/**
 * Dünya Haritası — ülke sahipliği (sunucu otoritesi)
 *
 *   GET  /api/world/territories          → tüm sahiplikler (herkese açık)
 *   GET  /api/world/log?code=TR          → son fetih / bırakma / savaş kayıtları
 *   POST /api/world/conquer  { code }    → bağımsız ülkeyi beyliğine kat (lider, sikke ödenir)
 *   POST /api/world/release  { code }    → beyliğinin toprağını bırak (lider)
 *   POST /api/world/migrate  { code }    → vatandaşlık değiştir (ilk seçim ücretsiz)
 *
 * Kurallar sunucuda uygulanır: geçerli ülke kodu, beylik liderliği, ülkenin boş olması,
 * yeterli sikke ve fetih bedeli. Böylece istemciden sahte sahiplik yazılamaz; veriler
 * world_territories tablosunda kalıcıdır ve sonradan giren oyuncular da aynı haritayı görür.
 * Değişiklikler 'worldMapUpdate' socket olayıyla anında herkese yayınlanır.
 */
const fs      = require('fs');
const path    = require('path');
const express = require('express');
const router  = express.Router();
const db      = require('../services/dbService');
const logger  = require('../utils/logger');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler }   = require('../middleware/asyncHandler');
const { generalLimiter } = require('../middleware/rateLimiter');

const MIGRATE_COST = 25000;

// ── Ülke listesi: istemcinin kullandığı SVG'den okunur (tek kaynak) ─────────────
const COUNTRIES = (() => {
  const map = {};
  try {
    const svg = fs.readFileSync(path.join(__dirname, '..', '..', 'assets', 'maps', 'world.svg'), 'utf8');
    const re = /<path id="([A-Z0-9]{2,5})" data-name="([^"]*)" data-continent="([^"]*)" data-km2="(\d+)"/g;
    let m;
    while ((m = re.exec(svg))) map[m[1]] = { code: m[1], name: m[2], cont: m[3], km2: Number(m[4]) };
  } catch (e) {
    logger.error('[World] assets/maps/world.svg okunamadı:', e.message);
  }
  return map;
})();

// Ülke başına sabit oyun değerleri — src/screens/WorldMapScreen.js içindeki statsOf() ile AYNI olmalı
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function statsOf(c) {
  const h = hash(c.code);
  const size = clamp(Math.log10(Math.max(c.km2, 10)) / 7, 0, 1);
  const kaynak = clamp(Math.round(18 + size * 52 + (h % 31)), 5, 100);
  const savunma = clamp(Math.round(20 + size * 40 + ((h >>> 8) % 41)), 5, 100);
  const bedel = Math.min(50e6, Math.round(((250000 + c.km2 * 0.9) * (1 + savunma / 100)) / 1000) * 1000);
  return { kaynak, savunma, bedel };
}

// ── yardımcılar ───────────────────────────────────────────────────────────────
const normCode = (v) => String(v || '').trim().toUpperCase().slice(0, 8);
const safeColor = (v) => (/^#[0-9a-fA-F]{3,8}$/.test(String(v || '')) ? v : '#C9A227');

async function getBeyliks() {
  const b = await db.getGameState('beyliks').catch(() => null);
  return Array.isArray(b) ? b : (b && typeof b === 'object' ? Object.values(b) : null);
}
function leaderBeylik(beyliks, userId) {
  return (beyliks || []).find(b => b && b.id && String(b.kurucuId) === String(userId)) || null;
}

/**
 * Sahiplikleri okur. Beylik adı/rengi güncel beylik listesinden alınır; dağılmış
 * beyliklerin toprakları serbest bırakılır (sadece beylik listesi gerçekten okunabildiyse).
 */
async function readTerritories() {
  const { rows } = await db.query(
    `SELECT country_code, beylik_id, beylik_ad, renk, conquered_by_name, cost,
            EXTRACT(EPOCH FROM conquered_at) * 1000 AS ts
       FROM world_territories`
  );
  const beyliks = await getBeyliks();
  const byId = new Map((beyliks || []).filter(b => b && b.id).map(b => [String(b.id), b]));
  const out = {};
  const orphans = [];
  for (const r of rows) {
    const live = byId.get(String(r.beylik_id));
    if (!live && beyliks && beyliks.length) { orphans.push(r.country_code); continue; }
    out[r.country_code] = {
      beylikId: r.beylik_id,
      ad:   (live && live.ad) || r.beylik_ad,
      renk: safeColor((live && live.renk) || r.renk),
      by:   r.conquered_by_name || '',
      cost: Number(r.cost) || 0,
      ts:   Math.round(Number(r.ts) || 0),
    };
  }
  if (orphans.length) {
    await db.query(`DELETE FROM world_territories WHERE country_code = ANY($1::text[])`, [orphans]).catch(() => {});
    logger.info(`[World] Dağılmış beyliklerin ${orphans.length} toprağı serbest bırakıldı`);
  }
  return out;
}

async function broadcast(action, extra) {
  const io = global._io;
  if (!io) return;
  try {
    const territories = await readTerritories();
    io.emit('worldMapUpdate', { territories, action, ...extra, ts: Date.now() });
  } catch (e) { logger.warn('[World] yayın hatası:', e.message); }
}

function gameEvent(title, username, icon = '⚜️') {
  if (!global._io) return;
  global._io.emit('gameEvent', {
    id: `evt_world_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: 'worldConquest', category: 'savas', title: String(title).slice(0, 120),
    desc: '', icon, username: username || 'Sistem', ts: Date.now(),
  });
}

async function withTx(fn) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw e;
  } finally {
    client.release();
  }
}

class HttpError extends Error { constructor(status, message, extra) { super(message); this.status = status; this.extra = extra; } }
const needDb = (req, res, next) => (db.isReady() ? next() : res.status(503).json({ success: false, error: 'Veritabanı hazır değil, biraz sonra tekrar dene.' }));
const fail = (res, e) => {
  if (e instanceof HttpError) return res.status(e.status).json({ success: false, error: e.message, ...(e.extra || {}) });
  throw e;
};

// ── GET /api/world/territories ───────────────────────────────────────────────
router.get('/territories', needDb, asyncHandler(async (req, res) => {
  const territories = await readTerritories();
  res.json({ success: true, territories, countryCount: Object.keys(COUNTRIES).length });
}));

// ── GET /api/world/me — oyuncunun beyliği / liderliği / vatanı ─────────────
router.get('/me', authMiddleware, needDb, asyncHandler(async (req, res) => {
  const beyliks = (await getBeyliks()) || [];
  const uid = String(req.user.id);
  const b = beyliks.find(x => x && x.id && (String(x.kurucuId) === uid || (x.uyeler || []).map(String).includes(uid))) || null;
  const { rows } = await db.query(`SELECT game_data->>'worldCountry' AS wc FROM users WHERE id=$1`, [req.user.id]);
  res.json({
    success: true,
    beylik: b ? { id: b.id, ad: b.ad, renk: safeColor(b.renk), kurucuId: b.kurucuId } : null,
    isLeader: !!(b && String(b.kurucuId) === uid),
    worldCountry: (rows[0] && rows[0].wc) || null,
  });
}));

// ── GET /api/world/log ───────────────────────────────────────────────────────
router.get('/log', needDb, asyncHandler(async (req, res) => {
  const code = normCode(req.query.code);
  const { rows } = code
    ? await db.query(`SELECT * FROM world_territory_log WHERE country_code=$1 ORDER BY created_at DESC LIMIT 20`, [code])
    : await db.query(`SELECT * FROM world_territory_log ORDER BY created_at DESC LIMIT 30`);
  res.json({ success: true, log: rows });
}));

// ── POST /api/world/conquer ──────────────────────────────────────────────────
router.post('/conquer', authMiddleware, generalLimiter, needDb, asyncHandler(async (req, res) => {
  const code = normCode(req.body && req.body.code);
  const country = COUNTRIES[code];
  if (!country) return res.status(400).json({ success: false, error: 'Geçersiz ülke' });

  const beylik = leaderBeylik(await getBeyliks(), req.user.id);
  if (!beylik) return res.status(403).json({ success: false, error: 'Fetih kararını yalnızca bir beyliğin lideri verebilir.' });

  const cost = statsOf(country).bedel;
  let money;
  try {
    money = await withTx(async (c) => {
      const { rows: taken } = await c.query(`SELECT beylik_ad FROM world_territories WHERE country_code=$1 FOR UPDATE`, [code]);
      if (taken.length) throw new HttpError(409, `${country.name} zaten ${taken[0].beylik_ad} beyliğinin toprağı.`);
      const { rows: u } = await c.query(
        `UPDATE users SET money = money - $1 WHERE id = $2 AND money >= $1 RETURNING money`, [cost, req.user.id]
      );
      if (!u.length) {
        const { rows: cur } = await c.query(`SELECT money FROM users WHERE id=$1`, [req.user.id]);
        throw new HttpError(400, `Yetersiz sikke: ${country.name} için ${cost.toLocaleString('tr-TR')} gerekli.`,
          { money: cur[0] ? Number(cur[0].money) : null, cost });
      }
      await c.query(
        `INSERT INTO world_territories (country_code, beylik_id, beylik_ad, renk, conquered_by, conquered_by_name, cost)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [code, String(beylik.id), String(beylik.ad || 'Beylik').slice(0, 80), safeColor(beylik.renk), req.user.id, req.user.username || '', cost]
      );
      await c.query(
        `INSERT INTO world_territory_log (country_code, action, beylik_id, beylik_ad, user_id, username, cost)
         VALUES ($1,'conquer',$2,$3,$4,$5,$6)`,
        [code, String(beylik.id), String(beylik.ad || ''), req.user.id, req.user.username || '', cost]
      );
      return Number(u[0].money);
    });
  } catch (e) {
    if (e && e.code === '23505') return res.status(409).json({ success: false, error: `${country.name} az önce başka bir beylik tarafından fethedildi.` });
    return fail(res, e);
  }

  logger.info(`[World] ${req.user.username} → ${code} (${beylik.ad}) fethedildi, bedel ${cost}`);
  gameEvent(`${beylik.ad || 'Bir beylik'} ${country.name} topraklarını fethetti`, req.user.username);
  await broadcast('conquer', { code, beylikId: String(beylik.id), by: req.user.username });
  res.json({ success: true, code, cost, money, territories: await readTerritories() });
}));

// ── POST /api/world/release ──────────────────────────────────────────────────
router.post('/release', authMiddleware, generalLimiter, needDb, asyncHandler(async (req, res) => {
  const code = normCode(req.body && req.body.code);
  const country = COUNTRIES[code];
  if (!country) return res.status(400).json({ success: false, error: 'Geçersiz ülke' });
  const beylik = leaderBeylik(await getBeyliks(), req.user.id);
  if (!beylik) return res.status(403).json({ success: false, error: 'Toprağı yalnızca beylik lideri bırakabilir.' });

  const { rows } = await db.query(
    `DELETE FROM world_territories WHERE country_code=$1 AND beylik_id=$2 RETURNING beylik_ad`, [code, String(beylik.id)]
  );
  if (!rows.length) return res.status(404).json({ success: false, error: `${country.name} beyliğinin toprağı değil.` });
  await db.query(
    `INSERT INTO world_territory_log (country_code, action, prev_beylik_id, prev_beylik_ad, user_id, username)
     VALUES ($1,'release',$2,$3,$4,$5)`,
    [code, String(beylik.id), rows[0].beylik_ad, req.user.id, req.user.username || '']
  ).catch(() => {});
  gameEvent(`${country.name} bağımsızlığına kavuştu`, req.user.username, '🕊️');
  await broadcast('release', { code, by: req.user.username });
  res.json({ success: true, code, territories: await readTerritories() });
}));

// ── POST /api/world/migrate ──────────────────────────────────────────────────
router.post('/migrate', authMiddleware, generalLimiter, needDb, asyncHandler(async (req, res) => {
  const code = normCode(req.body && req.body.code);
  const country = COUNTRIES[code];
  if (!country) return res.status(400).json({ success: false, error: 'Geçersiz ülke' });

  const { rows: cur } = await db.query(`SELECT money, game_data->>'worldCountry' AS wc FROM users WHERE id=$1`, [req.user.id]);
  if (!cur.length) return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
  if (cur[0].wc === code) return res.json({ success: true, code, cost: 0, money: Number(cur[0].money) });
  const cost = cur[0].wc ? MIGRATE_COST : 0;

  const { rows } = await db.query(
    `UPDATE users
        SET money = money - $2,
            game_data = jsonb_set(COALESCE(game_data, '{}'::jsonb), '{worldCountry}', to_jsonb($3::text), true)
      WHERE id = $1 AND money >= $2
      RETURNING money`,
    [req.user.id, cost, code]
  );
  if (!rows.length) return res.status(400).json({ success: false, error: `Göç için ${cost.toLocaleString('tr-TR')} sikke gerekli.`, money: Number(cur[0].money), cost });
  res.json({ success: true, code, cost, money: Number(rows[0].money) });
}));

/**
 * Beylik savaşı kazanılınca hedef ülke saldıran beyliğe geçer.
 * server/routes/beylikWar.js → resolve içinden çağrılır.
 */
async function transferAfterWar(code, attackerBeylikAd, defenderBeylikAd, warId) {
  code = normCode(code);
  if (!COUNTRIES[code] || !db.isReady()) return false;
  const beyliks = await getBeyliks();
  const att = (beyliks || []).find(b => b && b.ad === attackerBeylikAd);
  if (!att) return false;
  const { rows } = await db.query(
    `UPDATE world_territories
        SET beylik_id=$2, beylik_ad=$3, renk=$4, conquered_at=NOW(), conquered_by_name=$5
      WHERE country_code=$1 AND beylik_ad=$6
      RETURNING country_code`,
    [code, String(att.id), String(att.ad), safeColor(att.renk), `Savaş #${warId}`, defenderBeylikAd]
  );
  if (!rows.length) return false;
  await db.query(
    `INSERT INTO world_territory_log (country_code, action, beylik_id, beylik_ad, prev_beylik_ad, username)
     VALUES ($1,'war',$2,$3,$4,$5)`,
    [code, String(att.id), att.ad, defenderBeylikAd, `Savaş #${warId}`]
  ).catch(() => {});
  gameEvent(`${att.ad}, ${defenderBeylikAd} beyliğinden ${COUNTRIES[code].name} topraklarını aldı`, 'Savaş', '⚔️');
  await broadcast('war', { code, beylikId: String(att.id) });
  return true;
}

/** Savaş ilanı öncesi kontrol: ülke gerçekten savunan beyliğin mi? */
async function ownerOf(code) {
  code = normCode(code);
  if (!COUNTRIES[code] || !db.isReady()) return null;
  const { rows } = await db.query(`SELECT beylik_id, beylik_ad FROM world_territories WHERE country_code=$1`, [code]);
  return rows[0] || null;
}

module.exports = router;
module.exports.transferAfterWar = transferAfterWar;
module.exports.ownerOf = ownerOf;
module.exports.COUNTRIES = COUNTRIES;
module.exports.statsOf = statsOf;
