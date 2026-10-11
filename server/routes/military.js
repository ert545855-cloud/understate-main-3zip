/**
 * Silahlı Kuvvetler — devlet hazinesi, fabrikalar, asker basma ve askeri harekâtlar
 *
 *   GET  /api/military/me                    → devletimin askeri durumu (üretim bu anda hesaplanır)
 *   GET  /api/military/operations            → haritada gösterilecek süren / yeni biten harekâtlar
 *   GET  /api/military/estimate?target=SY    → çıkış ülkesi, mesafe ve tahmini direnç
 *   POST /api/military/deposit   { amount }  → üye kendi parasından hazineye bağış yapar
 *   POST /api/military/factory   { type }    → lider fabrika kurar (silah | tank | topcu | iha)
 *   POST /api/military/factory/upgrade { id }→ lider fabrikayı yükseltir
 *   POST /api/military/recruit   { batches } → lider asker basar (1 parti = 1.000 asker)
 *   POST /api/military/operation { target, piyade, tank, topcu, iha } → lider harekât başlatır
 *   POST /api/military/operation/cancel { id } → yoldaki harekâtı geri çağırır
 *
 * Harekâtlar gerçek zamanlı ilerler: yola çıkış → varış (mesafe / en yavaş birlik hızı) →
 * 45 sn çatışma → sonuç. Sonuç sunucu döngüsünde (init) hesaplanır; kazanılırsa ülke saldıran
 * devlete geçer. Tüm değişiklikler 'operation:update' socket olayıyla yayınlanır.
 */
const express = require('express');
const router  = express.Router();
const db      = require('../services/dbService');
const logger  = require('../utils/logger');
const world   = require('./world');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler }   = require('../middleware/asyncHandler');
const { generalLimiter } = require('../middleware/rateLimiter');

// ── Oyun kuralları (istemci de /me ile aynısını alır) ─────────────────────────
const RULES = {
  factories: {
    silah: { ad: 'Silah Fabrikası', urun: 'Tüfek',  out: 'tufek', cost: 750000,  perHour: 1500 },
    tank:  { ad: 'Tank Fabrikası',  urun: 'Tank',   out: 'tank',  cost: 3000000, perHour: 6 },
    topcu: { ad: 'Topçu Fabrikası', urun: 'Obüs',   out: 'topcu', cost: 2000000, perHour: 8 },
    iha:   { ad: 'İHA Fabrikası',   urun: 'İHA',    out: 'iha',   cost: 4000000, perHour: 4 },
  },
  maxPerType: 5,
  maxLevel: 5,
  recruit: { batch: 1000, costPerBatch: 20000 },
  power:   { piyade: 1, tank: 60, topcu: 35, iha: 45 },
  speedKmS:{ piyade: 4, tank: 5, topcu: 4, iha: 12 },
  baseTravelS: 60,
  maxTravelS: 5400,
  battleS: 45,
  kmPerUnit: 38,
  manpower: { base: 20000, perTerritory: 25000, perMember: 2000, regenPctHour: 0.08 },
  minDeposit: 1000,
};
const UNIT_KEYS = ['piyade', 'tank', 'topcu', 'iha'];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const toInt = (v) => Math.max(0, Math.floor(Number(v) || 0));
const rand = (a, b) => a + Math.random() * (b - a);
const powerOf = (u) => UNIT_KEYS.reduce((s, k) => s + (Number(u[k]) || 0) * RULES.power[k], 0);

class HttpError extends Error { constructor(status, message, extra) { super(message); this.status = status; this.extra = extra; } }
const needDb = (req, res, next) => (db.isReady() ? next() : res.status(503).json({ success: false, error: 'Veritabanı hazır değil, biraz sonra tekrar dene.' }));
const fail = (res, e) => {
  if (e instanceof HttpError) return res.status(e.status).json({ success: false, error: e.message, ...(e.extra || {}) });
  throw e;
};

async function withTx(fn) {
  const client = await db.pool.connect();
  try { await client.query('BEGIN'); const out = await fn(client); await client.query('COMMIT'); return out; }
  catch (e) { try { await client.query('ROLLBACK'); } catch (_) {} throw e; }
  finally { client.release(); }
}

// ── devlet / üyelik ───────────────────────────────────────────────────────────
async function myState(userId) {
  const beyliks = (await world.getBeyliks()) || [];
  const uid = String(userId);
  const b = beyliks.find(x => x && x.id && (String(x.kurucuId) === uid || (x.uyeler || []).map(String).includes(uid)));
  if (!b) return null;
  return { id: String(b.id), ad: b.ad || 'Devlet', renk: world.safeColor(b.renk), kurucuId: String(b.kurucuId), uyeler: b.uyeler || [], isLeader: String(b.kurucuId) === uid };
}
async function requireLeader(userId) {
  const st = await myState(userId);
  if (!st) throw new HttpError(403, 'Önce bir devlete katıl ya da kendi devletini kur.');
  if (!st.isLeader) throw new HttpError(403, 'Bu kararı yalnızca devlet lideri verebilir.');
  return st;
}

function npcGarrison(c) {
  const st = world.statsOf(c);
  return Math.round(st.savunma * 150 + Math.sqrt(c.km2) * 8);
}

/** Satırı kilitler ve geçen süreye göre üretimi + insan gücünü ekler. */
async function lockState(c, st) {
  await c.query(`INSERT INTO state_military (state_id, state_ad) VALUES ($1,$2) ON CONFLICT (state_id) DO NOTHING`, [st.id, st.ad]);
  const { rows: [m] } = await c.query(`SELECT * FROM state_military WHERE state_id=$1 FOR UPDATE`, [st.id]);
  const { rows: facs } = await c.query(`SELECT type, SUM(level)::int AS lv FROM state_factories WHERE state_id=$1 GROUP BY type`, [st.id]);
  const owned = await world.countOwned(st.id);
  const cap = RULES.manpower.base + RULES.manpower.perTerritory * owned + RULES.manpower.perMember * Math.max(1, (st.uyeler || []).length);
  const hours = clamp((Date.now() - new Date(m.updated_at).getTime()) / 3600000, 0, 48);
  const prog = Object.assign({}, m.progress || {});
  const next = { tufek: Number(m.tufek), tank: m.tank, topcu: m.topcu, iha: m.iha, manpower: Number(m.manpower) };
  for (const f of facs) {
    const def = RULES.factories[f.type]; if (!def) continue;
    const amt = def.perHour * f.lv * hours + (prog[def.out] || 0);
    next[def.out] += Math.floor(amt); prog[def.out] = amt - Math.floor(amt);
  }
  if (next.manpower < cap) {
    const g = cap * RULES.manpower.regenPctHour * hours + (prog.manpower || 0);
    next.manpower = Math.min(cap, next.manpower + Math.floor(g)); prog.manpower = g - Math.floor(g);
  } else prog.manpower = 0;
  const { rows: [u] } = await c.query(
    `UPDATE state_military SET tufek=$2, tank=$3, topcu=$4, iha=$5, manpower=$6, progress=$7, state_ad=$8, updated_at=NOW()
      WHERE state_id=$1 RETURNING *`,
    [st.id, next.tufek, next.tank, next.topcu, next.iha, next.manpower, JSON.stringify(prog), st.ad]
  );
  return { mil: u, cap, owned, facs };
}

function publicMil(m, cap) {
  return {
    hazine: Number(m.hazine), manpower: Number(m.manpower), manpowerCap: cap,
    piyade: Number(m.piyade), tank: m.tank, topcu: m.topcu, iha: m.iha, tufek: Number(m.tufek),
    power: powerOf({ piyade: Number(m.piyade), tank: m.tank, topcu: m.topcu, iha: m.iha }),
  };
}

async function capitalOf(st, leaderId) {
  const { rows: own } = await db.query(`SELECT country_code FROM world_territories WHERE beylik_id=$1 ORDER BY conquered_at ASC`, [st.id]);
  const { rows: u } = await db.query(`SELECT game_data->>'worldCountry' AS wc FROM users WHERE id=$1`, [leaderId]);
  const wc = u[0] && u[0].wc;
  if (own.length) return own.some(r => r.country_code === wc) ? wc : own[0].country_code;
  return (wc && world.COUNTRIES[wc]) ? wc : 'TR';
}

function travelOf(origin, target, units) {
  const a = world.COUNTRIES[origin], b = world.COUNTRIES[target];
  const du = Math.hypot((a.cx - b.cx), (a.cy - b.cy));
  const km = Math.max(80, Math.round(du * RULES.kmPerUnit));
  const used = UNIT_KEYS.filter(k => (units[k] || 0) > 0);
  const speed = used.length ? Math.min(...used.map(k => RULES.speedKmS[k])) : RULES.speedKmS.piyade;
  const seconds = Math.min(RULES.maxTravelS, Math.round(RULES.baseTravelS + km / speed));
  return { km, seconds, speed };
}

async function logMil(stateId, action, detail, user) {
  await db.query(`INSERT INTO state_military_log (state_id, action, detail, user_id, username) VALUES ($1,$2,$3,$4,$5)`,
    [stateId, action, JSON.stringify(detail || {}), user ? user.id : null, user ? user.username : null]).catch(() => {});
}

function opPublic(o) {
  const t = world.COUNTRIES[o.target_code] || {}, f = world.COUNTRIES[o.origin_code] || {};
  return {
    id: o.id, stateId: o.state_id, stateAd: o.state_ad, renk: o.renk, leader: o.leader_name,
    origin: o.origin_code, originName: f.name || o.origin_code, target: o.target_code, targetName: t.name || o.target_code,
    units: { piyade: Number(o.piyade), tank: o.tank, topcu: o.topcu, iha: o.iha },
    distanceKm: o.distance_km, departAt: new Date(o.depart_at).getTime(), arriveAt: new Date(o.arrive_at).getTime(),
    battleEndAt: new Date(o.battle_end_at).getTime(), status: o.status,
    attackPower: o.attack_power, defensePower: o.defense_power, result: o.result || null,
  };
}
function emitOp(o) { try { global._io && global._io.emit('operation:update', { op: opPublic(o), now: Date.now() }); } catch (_) {} }

// ── GET /me ───────────────────────────────────────────────────────────────────
router.get('/me', authMiddleware, needDb, asyncHandler(async (req, res) => {
  const st = await myState(req.user.id);
  if (!st) return res.json({ success: true, state: null, rules: RULES, now: Date.now() });
  const out = await withTx(c => lockState(c, st));
  const { rows: factories } = await db.query(`SELECT id, type, level, created_at FROM state_factories WHERE state_id=$1 ORDER BY id`, [st.id]);
  const { rows: ops } = await db.query(
    `SELECT * FROM military_operations WHERE state_id=$1 AND (status IN ('moving','battle') OR battle_end_at > NOW() - interval '6 hours')
      ORDER BY created_at DESC LIMIT 15`, [st.id]);
  const capital = await capitalOf(st, st.kurucuId);
  res.json({
    success: true, now: Date.now(), rules: RULES,
    state: { id: st.id, ad: st.ad, renk: st.renk, isLeader: st.isLeader, members: (st.uyeler || []).length || 1, owned: out.owned, capital, capitalName: (world.COUNTRIES[capital] || {}).name || capital },
    mil: publicMil(out.mil, out.cap),
    factories: factories.map(f => ({ id: f.id, type: f.type, level: f.level })),
    ops: ops.map(opPublic),
  });
}));

// ── GET /operations (herkese açık; harita için) ───────────────────────────────
router.get('/operations', needDb, asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM military_operations
      WHERE status IN ('moving','battle') OR (status IN ('won','lost') AND battle_end_at > NOW() - interval '3 minutes')
      ORDER BY depart_at DESC LIMIT 60`);
  res.json({ success: true, now: Date.now(), ops: rows.map(opPublic) });
}));

// ── GET /estimate ─────────────────────────────────────────────────────────────
router.get('/estimate', authMiddleware, needDb, asyncHandler(async (req, res) => {
  const target = String(req.query.target || '').toUpperCase();
  const c = world.COUNTRIES[target];
  if (!c) return res.status(400).json({ success: false, error: 'Geçersiz hedef' });
  const st = await myState(req.user.id);
  if (!st) return res.status(403).json({ success: false, error: 'Önce bir devlete katıl ya da kendi devletini kur.' });
  const origin = await capitalOf(st, st.kurucuId);
  const owner = await world.ownerOf(target);
  let defense = npcGarrison(c), defender = null;
  if (owner && owner.beylik_id !== st.id) {
    const { rows } = await db.query(`SELECT * FROM state_military WHERE state_id=$1`, [owner.beylik_id]);
    const t = await world.countOwned(owner.beylik_id);
    const g = rows[0] ? powerOf({ piyade: Number(rows[0].piyade), tank: rows[0].tank, topcu: rows[0].topcu, iha: rows[0].iha }) * 0.6 / Math.sqrt(Math.max(1, t)) : 0;
    defense = Math.round(g * 1.25 + npcGarrison(c) * 0.4);
    defender = owner.beylik_ad;
  }
  const speeds = {};
  for (const k of UNIT_KEYS) speeds[k] = travelOf(origin, target, { [k]: 1 }).seconds;
  const { km } = travelOf(origin, target, { piyade: 1 });
  res.json({
    success: true, origin, originName: (world.COUNTRIES[origin] || {}).name, target, targetName: c.name,
    distanceKm: km, travelSeconds: speeds, defender, sameOwner: !!(owner && owner.beylik_id === st.id),
    defenseMin: Math.round(defense * 0.85), defenseMax: Math.round(defense * 1.15),
  });
}));

// ── POST /deposit ─────────────────────────────────────────────────────────────
router.post('/deposit', authMiddleware, generalLimiter, needDb, asyncHandler(async (req, res) => {
  const amount = toInt(req.body && req.body.amount);
  if (amount < RULES.minDeposit) return res.status(400).json({ success: false, error: `En az ${RULES.minDeposit.toLocaleString('tr-TR')} bağışlayabilirsin.` });
  const st = await myState(req.user.id);
  if (!st) return res.status(403).json({ success: false, error: 'Bağış için bir devlete üye olmalısın.' });
  try {
    const out = await withTx(async (c) => {
      const { rows: u } = await c.query(`UPDATE users SET money = money - $1 WHERE id=$2 AND money >= $1 RETURNING money`, [amount, req.user.id]);
      if (!u.length) throw new HttpError(400, 'Yetersiz para.');
      const s = await lockState(c, st);
      const { rows: [m] } = await c.query(`UPDATE state_military SET hazine = hazine + $2 WHERE state_id=$1 RETURNING *`, [st.id, amount]);
      return { money: Number(u[0].money), mil: publicMil(m, s.cap) };
    });
    await logMil(st.id, 'deposit', { amount }, req.user);
    res.json({ success: true, ...out });
  } catch (e) { return fail(res, e); }
}));

// ── POST /factory ─────────────────────────────────────────────────────────────
router.post('/factory', authMiddleware, generalLimiter, needDb, asyncHandler(async (req, res) => {
  const type = String(req.body && req.body.type || '');
  const def = RULES.factories[type];
  if (!def) return res.status(400).json({ success: false, error: 'Geçersiz fabrika türü' });
  try {
    const st = await requireLeader(req.user.id);
    const out = await withTx(async (c) => {
      const s = await lockState(c, st);
      const { rows: [{ n }] } = await c.query(`SELECT COUNT(*)::int AS n FROM state_factories WHERE state_id=$1 AND type=$2`, [st.id, type]);
      if (n >= RULES.maxPerType) throw new HttpError(400, `En fazla ${RULES.maxPerType} ${def.ad} kurabilirsin. Mevcutları yükselt.`);
      if (Number(s.mil.hazine) < def.cost) throw new HttpError(400, `Hazine yetersiz: ${def.ad} için ${def.cost.toLocaleString('tr-TR')} gerekli.`);
      const { rows: [m] } = await c.query(`UPDATE state_military SET hazine = hazine - $2 WHERE state_id=$1 RETURNING *`, [st.id, def.cost]);
      const { rows: [f] } = await c.query(`INSERT INTO state_factories (state_id, type, built_by) VALUES ($1,$2,$3) RETURNING id, type, level`, [st.id, type, req.user.id]);
      return { mil: publicMil(m, s.cap), factory: f };
    });
    await logMil(st.id, 'factory', { type, cost: def.cost }, req.user);
    world.gameEvent(`${st.ad} yeni bir ${def.ad} kurdu`, req.user.username, '🏭');
    res.json({ success: true, ...out });
  } catch (e) { return fail(res, e); }
}));

router.post('/factory/upgrade', authMiddleware, generalLimiter, needDb, asyncHandler(async (req, res) => {
  const id = toInt(req.body && req.body.id);
  try {
    const st = await requireLeader(req.user.id);
    const out = await withTx(async (c) => {
      const s = await lockState(c, st);
      const { rows: [f] } = await c.query(`SELECT * FROM state_factories WHERE id=$1 AND state_id=$2 FOR UPDATE`, [id, st.id]);
      if (!f) throw new HttpError(404, 'Fabrika bulunamadı.');
      const def = RULES.factories[f.type];
      if (f.level >= RULES.maxLevel) throw new HttpError(400, 'Fabrika en üst seviyede.');
      const cost = def.cost * f.level;
      if (Number(s.mil.hazine) < cost) throw new HttpError(400, `Hazine yetersiz: yükseltme için ${cost.toLocaleString('tr-TR')} gerekli.`);
      const { rows: [m] } = await c.query(`UPDATE state_military SET hazine = hazine - $2 WHERE state_id=$1 RETURNING *`, [st.id, cost]);
      const { rows: [nf] } = await c.query(`UPDATE state_factories SET level = level + 1 WHERE id=$1 RETURNING id, type, level`, [id]);
      return { mil: publicMil(m, s.cap), factory: nf, cost };
    });
    await logMil(st.id, 'upgrade', { id, cost: out.cost }, req.user);
    res.json({ success: true, ...out });
  } catch (e) { return fail(res, e); }
}));

// ── POST /recruit ─────────────────────────────────────────────────────────────
router.post('/recruit', authMiddleware, generalLimiter, needDb, asyncHandler(async (req, res) => {
  const batches = clamp(toInt(req.body && req.body.batches), 0, 100);
  if (!batches) return res.status(400).json({ success: false, error: 'En az 1 parti (1.000 asker) seç.' });
  try {
    const st = await requireLeader(req.user.id);
    const n = batches * RULES.recruit.batch, cost = batches * RULES.recruit.costPerBatch;
    const out = await withTx(async (c) => {
      const s = await lockState(c, st);
      const m0 = s.mil;
      if (Number(m0.manpower) < n) throw new HttpError(400, `İnsan gücü yetersiz: ${n.toLocaleString('tr-TR')} gerekli, ${Number(m0.manpower).toLocaleString('tr-TR')} var.`);
      if (Number(m0.tufek) < n) throw new HttpError(400, `Tüfek stoğu yetersiz: ${n.toLocaleString('tr-TR')} gerekli. Silah fabrikası kur.`);
      if (Number(m0.hazine) < cost) throw new HttpError(400, `Hazine yetersiz: ${cost.toLocaleString('tr-TR')} gerekli.`);
      const { rows: [m] } = await c.query(
        `UPDATE state_military SET manpower=manpower-$2, tufek=tufek-$2, hazine=hazine-$3, piyade=piyade+$2 WHERE state_id=$1 RETURNING *`,
        [st.id, n, cost]);
      return { mil: publicMil(m, s.cap), recruited: n, cost };
    });
    await logMil(st.id, 'recruit', { n, cost }, req.user);
    res.json({ success: true, ...out });
  } catch (e) { return fail(res, e); }
}));

// ── POST /operation ───────────────────────────────────────────────────────────
router.post('/operation', authMiddleware, generalLimiter, needDb, asyncHandler(async (req, res) => {
  const target = String(req.body && req.body.target || '').toUpperCase();
  const c = world.COUNTRIES[target];
  if (!c) return res.status(400).json({ success: false, error: 'Geçersiz hedef' });
  const units = {}; for (const k of UNIT_KEYS) units[k] = toInt(req.body[k]);
  if (powerOf(units) <= 0) return res.status(400).json({ success: false, error: 'Harekât için en az bir birlik seç.' });
  try {
    const st = await requireLeader(req.user.id);
    const owner = await world.ownerOf(target);
    if (owner && owner.beylik_id === st.id) throw new HttpError(400, `${c.name} zaten devletinin toprağı.`);
    const { rows: busy } = await db.query(`SELECT id FROM military_operations WHERE state_id=$1 AND target_code=$2 AND status IN ('moving','battle')`, [st.id, target]);
    if (busy.length) throw new HttpError(409, `${c.name} için süren bir harekâtın var.`);
    const origin = await capitalOf(st, st.kurucuId);
    if (origin === target) throw new HttpError(400, 'Başkentine harekât düzenleyemezsin.');
    const tr = travelOf(origin, target, units);
    const op = await withTx(async (cl) => {
      const s = await lockState(cl, st);
      for (const k of UNIT_KEYS) if (Number(s.mil[k]) < units[k]) throw new HttpError(400, `Yeterli ${({ piyade: 'asker', tank: 'tank', topcu: 'obüs', iha: 'İHA' })[k]} yok.`);
      await cl.query(`UPDATE state_military SET piyade=piyade-$2, tank=tank-$3, topcu=topcu-$4, iha=iha-$5 WHERE state_id=$1`,
        [st.id, units.piyade, units.tank, units.topcu, units.iha]);
      const { rows: [o] } = await cl.query(
        `INSERT INTO military_operations (state_id, state_ad, renk, leader_id, leader_name, origin_code, target_code,
            piyade, tank, topcu, iha, distance_km, arrive_at, battle_end_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, NOW() + make_interval(secs => $13), NOW() + make_interval(secs => $14))
         RETURNING *`,
        [st.id, st.ad, st.renk, req.user.id, req.user.username || '', origin, target, units.piyade, units.tank, units.topcu, units.iha,
          tr.km, tr.seconds, tr.seconds + RULES.battleS]);
      return o;
    });
    await logMil(st.id, 'operation', { target, units, km: tr.km, seconds: tr.seconds }, req.user);
    world.gameEvent(`${st.ad}, ${c.name} hedefine askeri harekât başlattı`, req.user.username, '🎖️');
    emitOp(op);
    res.json({ success: true, op: opPublic(op), now: Date.now() });
  } catch (e) { return fail(res, e); }
}));

router.post('/operation/cancel', authMiddleware, generalLimiter, needDb, asyncHandler(async (req, res) => {
  const id = toInt(req.body && req.body.id);
  try {
    const st = await requireLeader(req.user.id);
    const op = await withTx(async (cl) => {
      const { rows: [o] } = await cl.query(`SELECT * FROM military_operations WHERE id=$1 AND state_id=$2 FOR UPDATE`, [id, st.id]);
      if (!o) throw new HttpError(404, 'Harekât bulunamadı.');
      if (o.status !== 'moving') throw new HttpError(400, 'Yalnızca yoldaki birlikler geri çağrılabilir.');
      await lockState(cl, st);
      await cl.query(`UPDATE state_military SET piyade=piyade+$2, tank=tank+$3, topcu=topcu+$4, iha=iha+$5 WHERE state_id=$1`,
        [st.id, o.piyade, o.tank, o.topcu, o.iha]);
      const { rows: [u] } = await cl.query(`UPDATE military_operations SET status='cancelled', battle_end_at=NOW() WHERE id=$1 RETURNING *`, [id]);
      return u;
    });
    emitOp(op);
    res.json({ success: true, op: opPublic(op) });
  } catch (e) { return fail(res, e); }
}));

// ── Sonuç döngüsü ─────────────────────────────────────────────────────────────
async function resolveOne(cl, op) {
  const c = world.COUNTRIES[op.target_code];
  const units = { piyade: Number(op.piyade), tank: op.tank, topcu: op.topcu, iha: op.iha };
  const attacker = { id: op.state_id, ad: op.state_ad, renk: op.renk, uyeler: [] };
  const { rows: ow } = await cl.query(`SELECT beylik_id, beylik_ad, renk FROM world_territories WHERE country_code=$1`, [op.target_code]);
  const owner = ow[0] || null;

  let attack = powerOf(units) * rand(0.85, 1.15), defense, defMil = null, garrisonShare = 0, defenderState = null;
  if (owner && owner.beylik_id === op.state_id) {
    defense = 0; // bu arada devletin eline geçmiş
  } else if (owner) {
    defenderState = { id: owner.beylik_id, ad: owner.beylik_ad, renk: owner.renk, uyeler: [] };
    const s = await lockState(cl, defenderState);
    defMil = s.mil;
    garrisonShare = 0.6 / Math.sqrt(Math.max(1, s.owned));
    const g = powerOf({ piyade: Number(defMil.piyade), tank: defMil.tank, topcu: defMil.topcu, iha: defMil.iha }) * garrisonShare;
    defense = (g * 1.25 + npcGarrison(c) * 0.4) * rand(0.85, 1.15);
  } else {
    defense = npcGarrison(c) * rand(0.85, 1.15);
  }
  attack = Math.round(attack); defense = Math.round(defense);
  const won = attack > defense;
  const ratio = attack > 0 ? clamp(defense / attack, 0, 1.5) : 1.5;
  const lossPct = won ? 0.10 + 0.25 * Math.min(1, ratio) : 0.55 + 0.25 * Math.random();
  const survivors = {}, losses = {};
  for (const k of UNIT_KEYS) {
    const lp = k === 'iha' ? lossPct * 0.6 : lossPct;
    survivors[k] = Math.floor(units[k] * (1 - lp)); losses[k] = units[k] - survivors[k];
  }
  await lockState(cl, attacker);
  await cl.query(`UPDATE state_military SET piyade=piyade+$2, tank=tank+$3, topcu=topcu+$4, iha=iha+$5 WHERE state_id=$1`,
    [op.state_id, survivors.piyade, survivors.tank, survivors.topcu, survivors.iha]);

  let defenderLosses = null;
  if (defMil) {
    const dl = won ? 0.35 + Math.random() * 0.2 : 0.10 + 0.2 * Math.min(1, attack / Math.max(1, defense));
    defenderLosses = {};
    for (const k of UNIT_KEYS) defenderLosses[k] = Math.floor(Number(defMil[k]) * garrisonShare * dl);
    await cl.query(`UPDATE state_military SET piyade=GREATEST(0,piyade-$2), tank=GREATEST(0,tank-$3), topcu=GREATEST(0,topcu-$4), iha=GREATEST(0,iha-$5) WHERE state_id=$1`,
      [defenderState.id, defenderLosses.piyade, defenderLosses.tank, defenderLosses.topcu, defenderLosses.iha]);
  }
  const result = { won, survivors, losses, defenderLosses, defender: owner ? owner.beylik_ad : null, lossPct: Math.round(lossPct * 100) };
  const { rows: [done] } = await cl.query(
    `UPDATE military_operations SET status=$2, attack_power=$3, defense_power=$4, result=$5 WHERE id=$1 RETURNING *`,
    [op.id, won ? 'won' : 'lost', attack, defense, JSON.stringify(result)]);
  return { done, won, owner, attacker, c };
}

let _ticking = false;
async function tick() {
  if (_ticking || !db.isReady()) return;
  _ticking = true;
  try {
    const { rows: arrived } = await db.query(`UPDATE military_operations SET status='battle' WHERE status='moving' AND arrive_at <= NOW() RETURNING *`);
    arrived.forEach(emitOp);
    const resolved = await withTx(async (cl) => {
      const { rows: due } = await cl.query(
        `SELECT * FROM military_operations WHERE status='battle' AND battle_end_at <= NOW() ORDER BY battle_end_at LIMIT 10 FOR UPDATE SKIP LOCKED`);
      const out = [];
      for (const op of due) out.push(await resolveOne(cl, op));
      return out;
    });
    for (const r of resolved) {
      emitOp(r.done);
      await logMil(r.attacker.id, 'result', r.done.result, null);
      if (r.won) {
        if (!r.owner || r.owner.beylik_id !== r.attacker.id) await world.setOwner(r.c.code, r.attacker, r.done.leader_name, 'war', r.owner ? r.owner.beylik_ad : null, r.done.leader_id);
        world.gameEvent(`${r.attacker.ad}, ${r.c.name} topraklarını ele geçirdi!`, r.done.leader_name, '⚔️');
      } else {
        world.gameEvent(`${r.c.name}, ${r.attacker.ad} harekâtını püskürttü`, r.done.leader_name, '🛡️');
      }
    }
  } catch (e) {
    logger.warn('[Military] tick hatası:', e.message);
  } finally { _ticking = false; }
}
let _timer = null;
function init() {
  if (_timer) return;
  _timer = setInterval(tick, 4000);
  if (_timer.unref) _timer.unref();
}

module.exports = router;
module.exports.init = init;
module.exports.tick = tick;
module.exports.RULES = RULES;
