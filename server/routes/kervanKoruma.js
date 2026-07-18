// ═══════════════════════════════════════════════════════════════
// Kervan Koruma Sistemi — /api/kervan-koruma
// ═══════════════════════════════════════════════════════════════
const express = require('express');
const router  = express.Router();
const { asyncHandler }   = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/authMiddleware');
const db = require('../services/dbService');

const ROUTES = [
  { id:'istanbul_bursa',  label:'İstanbul → Bursa',   distance:200, base_pay:500,  danger:1 },
  { id:'bursa_izmir',     label:'Bursa → İzmir',      distance:350, base_pay:900,  danger:2 },
  { id:'istanbul_edirne', label:'İstanbul → Edirne',  distance:230, base_pay:700,  danger:2 },
  { id:'izmir_konya',     label:'İzmir → Konya',      distance:450, base_pay:1200, danger:3 },
  { id:'konya_sivas',     label:'Konya → Sivas',      distance:380, base_pay:1500, danger:3 },
  { id:'sivas_erzurum',   label:'Sivas → Erzurum',    distance:500, base_pay:2000, danger:4 },
  { id:'erzurum_tebriz',  label:'Erzurum → Tebriz',   distance:600, base_pay:3000, danger:5 },
  { id:'istanbul_selanik',label:'İstanbul → Selanik',  distance:550, base_pay:2500, danger:4 },
];

// GET /api/kervan-koruma — mevcut kervanlar + rotalar
router.get('/', asyncHandler(async (req, res) => {
  // Süresi dolanları çöz
  await resolveExpired();

  const { rows: open } = await db.query(
    `SELECT k.*, u.username as owner_username, u.level as owner_level
     FROM kervan_koruma k JOIN users u ON u.id=k.owner_id
     WHERE k.status='open' ORDER BY k.created_at DESC LIMIT 20`
  );
  const { rows: active } = await db.query(
    `SELECT * FROM kervan_koruma WHERE (owner_id=$1 OR guard_id=$1) AND status='active'`,
    [req.user?.id || 0]
  );

  res.json({ success: true, open_caravans: open, active_caravans: active, routes: ROUTES });
}));

// POST /api/kervan-koruma/create — yeni kervan oluştur (nakliyeci)
router.post('/create', authMiddleware, asyncHandler(async (req, res) => {
  const { route_id, cargo_value } = req.body;
  const route = ROUTES.find(r => r.id === route_id);
  if (!route) return res.status(400).json({ success: false, message: 'Geçersiz rota' });

  const cargoVal = Math.max(100, Math.min(100000, parseInt(cargo_value) || 1000));
  const payAmount = Math.floor(route.base_pay + cargoVal * 0.05); // %5 kargo değeri + base

  const { rows } = await db.query(
    `INSERT INTO kervan_koruma(owner_id, owner_name, route, cargo_value, pay_amount, danger_level, attack_chance)
     VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.user.id, req.user.username, route.label, cargoVal, payAmount, route.danger,
     route.danger * 8 + Math.floor(Math.random() * 10)]
  );

  try { const io = global._io; if(io) io.emit('kervan:new', { caravan: rows[0] }); } catch(_) {}
  res.json({ success: true, caravan: rows[0] });
}));

// POST /api/kervan-koruma/:id/guard — muhafız ol
router.post('/:id/guard', authMiddleware, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { rows } = await db.query(`SELECT * FROM kervan_koruma WHERE id=$1 FOR UPDATE`, [id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Kervan bulunamadı' });
  const k = rows[0];
  if (k.status !== 'open') return res.status(400).json({ success: false, message: 'Bu kervan zaten dolu' });
  if (k.owner_id === req.user.id) return res.status(400).json({ success: false, message: 'Kendi kervanınızı koruyamazsınız' });

  const durationMs = (k.danger_level * 10 + 20) * 60000; // 20-70 dakika
  const endsAt = new Date(Date.now() + durationMs);

  await db.query(
    `UPDATE kervan_koruma SET status='active', guard_id=$1, guard_name=$2, started_at=NOW(), ends_at=$3 WHERE id=$4`,
    [req.user.id, req.user.username, endsAt, id]
  );

  try {
    const io = global._io;
    if(io) io.to(`user_${k.owner_id}`).emit('kervan:guarded', { guard: req.user.username, caravan_id: id });
  } catch(_) {}

  res.json({ success: true, ends_at: endsAt, pay_amount: k.pay_amount });
}));

// POST /api/kervan-koruma/:id/complete — kervan tamamlandı (server-side resolve)
router.post('/:id/complete', authMiddleware, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { rows } = await db.query(`SELECT * FROM kervan_koruma WHERE id=$1 FOR UPDATE`, [id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Bulunamadı' });
  const k = rows[0];
  if (k.status !== 'active') return res.status(400).json({ success: false, message: 'Aktif kervan değil' });
  if (k.guard_id !== req.user.id && k.owner_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Yetki yok' });
  }
  if (k.ends_at > new Date()) {
    const rem = Math.ceil((new Date(k.ends_at) - Date.now()) / 60000);
    return res.status(400).json({ success: false, message: `Rota henüz tamamlanmadı — ${rem} dakika kaldı` });
  }

  // Saldırı oldu mu?
  const attacked = Math.random() * 100 < k.attack_chance;
  const guardSuccess = attacked ? Math.random() > 0.4 : true; // %60 savunma başarısı

  let guardPay = k.pay_amount;
  let status   = 'completed';
  let ownerLoss = 0;

  if (attacked && !guardSuccess) {
    // Saldırı başarılı — nakliyeci zarar gördü
    status   = 'failed';
    guardPay = Math.floor(k.pay_amount * 0.3); // kısmi ödeme
    ownerLoss = Math.floor(k.cargo_value * 0.2);
  }

  await db.query(`UPDATE kervan_koruma SET status=$1 WHERE id=$2`, [status, id]);

  // Ödemeleri yap
  if (k.guard_id) {
    await db.query(`UPDATE users SET money=money+$1, xp=xp+$2 WHERE id=$3`,
      [guardPay, 60, k.guard_id]);
  }
  if (ownerLoss > 0) {
    await db.query(`UPDATE users SET money=GREATEST(0,money-$1) WHERE id=$2`, [ownerLoss, k.owner_id]);
  }

  // Sezon puanı
  try { if (k.guard_id) await addSezonPuan(k.guard_id, 35); } catch(_) {}

  try {
    const io = global._io;
    if(io) {
      const evt = attacked ? (guardSuccess ? 'kervan:defended' : 'kervan:attacked') : 'kervan:completed';
      io.to(`user_${k.owner_id}`).emit(evt, { caravan_id: id, guard: k.guard_name });
      if (k.guard_id) io.to(`user_${k.guard_id}`).emit(evt, { caravan_id: id, pay: guardPay });
    }
  } catch(_) {}

  res.json({ success: true, status, attacked, guard_success: guardSuccess, guard_pay: guardPay, owner_loss: ownerLoss });
}));

async function resolveExpired() {
  try {
    const { rows } = await db.query(
      `SELECT * FROM kervan_koruma WHERE status='active' AND ends_at < NOW()`
    );
    for (const k of rows) {
      const attacked = Math.random() * 100 < k.attack_chance;
      const guardSuccess = !attacked;
      const guardPay = attacked ? Math.floor(k.pay_amount * 0.3) : k.pay_amount;
      const status = attacked && !guardSuccess ? 'failed' : 'completed';
      await db.query(`UPDATE kervan_koruma SET status=$1 WHERE id=$2`, [status, k.id]);
      if (k.guard_id) {
        await db.query(`UPDATE users SET money=money+$1, xp=xp+60 WHERE id=$2`, [guardPay, k.guard_id]);
      }
    }
  } catch(_) {}
}

async function addSezonPuan(userId, points) {
  try {
    await db.query(`UPDATE users SET season_score = COALESCE(season_score,0) + $1 WHERE id=$2`, [points, userId]);
    const { rows } = await db.query(`SELECT id FROM seasons WHERE status='active' ORDER BY id DESC LIMIT 1`);
    if (rows[0]) {
      await db.query(
        `INSERT INTO season_rankings(season_id,user_id,score) VALUES($1,$2,$3)
         ON CONFLICT(season_id,user_id) DO UPDATE SET score=season_rankings.score+$3, updated_at=NOW()`,
        [rows[0].id, userId, points]
      );
    }
  } catch(_) {}
}

module.exports = router;
