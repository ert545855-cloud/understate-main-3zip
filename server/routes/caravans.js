// ═══════════════════════════════════════════════════════════════
// Kervan / Ticaret Yolları — /api/caravans
// ═══════════════════════════════════════════════════════════════
const express = require('express');
const router  = express.Router();
const { asyncHandler }   = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/authMiddleware');
const sb = require('../services/supabaseService');

const CARGO_TYPES = {
  tahil:   { name:'Tahıl',   icon:'🌾', baseIncome: 400,  travelHours: 2 },
  baharat: { name:'Baharat', icon:'🫙', baseIncome: 900,  travelHours: 4 },
  kumas:   { name:'Kumaş',   icon:'🧵', baseIncome: 700,  travelHours: 3 },
  maden:   { name:'Maden',   icon:'⛏️', baseIncome: 1200, travelHours: 5 },
  ipek:    { name:'İpek',    icon:'🪡', baseIncome: 1800, travelHours: 6 },
};

const PROVINCES = [
  'İstanbul','Bursa','Edirne','İzmir','Ankara','Konya','Kayseri',
  'Trabzon','Erzurum','Diyarbakır','Halep','Şam','Kahire','Bağdat','Belgrad'
];

// GET /api/caravans/config — kargo tipleri + şehirler
router.get('/config', (req, res) => {
  res.json({ success: true, cargoTypes: CARGO_TYPES, provinces: PROVINCES });
});

// GET /api/caravans — kullanıcının kervanları
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  // Süresi gelenler otomatik tamamlansın
  await sb.query(`UPDATE caravans SET status='arrived' WHERE status='travelling' AND arrives_at<=NOW()`);
  const { rows } = await sb.query(
    `SELECT * FROM caravans WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 30`,
    [req.user.id]
  );
  res.json({ success: true, caravans: rows });
}));

// GET /api/caravans/active — tüm aktif kervanlar (raid için)
router.get('/active', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await sb.query(
    `SELECT id,owner_username,origin,destination,cargo_type,cargo_amount,arrives_at
     FROM caravans WHERE status='travelling' AND owner_id!=$1 ORDER BY arrives_at ASC LIMIT 50`,
    [req.user.id]
  );
  res.json({ success: true, caravans: rows });
}));

// POST /api/caravans/send — yeni kervan gönder
router.post('/send', authMiddleware, asyncHandler(async (req, res) => {
  const { origin, destination, cargo_type, cargo_amount = 100 } = req.body;
  if (!origin || !destination || !cargo_type) return res.status(400).json({ success: false, message: 'Eksik alan' });
  if (!PROVINCES.includes(origin) || !PROVINCES.includes(destination)) return res.status(400).json({ success: false, message: 'Geçersiz şehir' });
  if (origin === destination) return res.status(400).json({ success: false, message: 'Kaynak ve hedef aynı olamaz' });
  if (!CARGO_TYPES[cargo_type]) return res.status(400).json({ success: false, message: 'Geçersiz kargo türü' });
  // Aktif kervan sınırı: 3
  const { rows: active } = await sb.query(
    `SELECT COUNT(*) FROM caravans WHERE owner_id=$1 AND status='travelling'`,
    [req.user.id]
  );
  if (parseInt(active[0].count) >= 3) return res.status(400).json({ success: false, message: 'En fazla 3 aktif kervan gönderebilirsin' });
  const ct     = CARGO_TYPES[cargo_type];
  const amount = Math.max(10, Math.min(1000, parseInt(cargo_amount)));
  const income = Math.floor(ct.baseIncome * (amount / 100));
  const hours  = ct.travelHours;
  const { rows } = await sb.query(
    `INSERT INTO caravans(owner_id,owner_username,origin,destination,cargo_type,cargo_amount,income,arrives_at)
     VALUES($1,$2,$3,$4,$5,$6,$7,NOW()+$8::interval) RETURNING *`,
    [req.user.id, req.user.username, origin, destination, cargo_type, amount, income, `${hours} hours`]
  );
  res.json({ success: true, caravan: rows[0] });
}));

// POST /api/caravans/:id/collect — varış gelirini topla
router.post('/:id/collect', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await sb.query(
    `SELECT * FROM caravans WHERE id=$1 AND owner_id=$2 FOR UPDATE`,
    [parseInt(req.params.id), req.user.id]
  );
  if (!rows.length) return res.status(404).json({ success: false, message: 'Kervan bulunamadı' });
  const c = rows[0];
  if (c.status !== 'arrived') return res.status(400).json({ success: false, message: 'Kervan henüz varmadı' });
  await sb.query(
    `UPDATE caravans SET status='collected',collected_at=NOW() WHERE id=$1`,
    [c.id]
  );
  // Kullanıcı parasına ekle
  await sb.query(`UPDATE users SET money=money+$1 WHERE id=$2`, [c.income, req.user.id]);
  res.json({ success: true, income: c.income, message: `Kervan geliri toplandı: ${c.income.toLocaleString()} 🪙` });
}));

// POST /api/caravans/:id/raid — kervan soy
router.post('/:id/raid', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await sb.query(
    `SELECT * FROM caravans WHERE id=$1 AND status='travelling' FOR UPDATE`,
    [parseInt(req.params.id)]
  );
  if (!rows.length) return res.status(404).json({ success: false, message: 'Soyulacak kervan bulunamadı' });
  const c = rows[0];
  if (c.owner_id === req.user.id) return res.status(400).json({ success: false, message: 'Kendi kervanını soyamazsın' });
  // Güç karşılaştırması
  const { rows: raider }  = await sb.query(`SELECT level,weapons,ammo FROM users WHERE id=$1`, [req.user.id]);
  const { rows: defender } = await sb.query(`SELECT level,weapons,ammo FROM users WHERE id=$1`, [c.owner_id]);
  const rPow = (raider[0]?.level||1)*10 + (raider[0]?.weapons||0)*5 + (raider[0]?.ammo||0)*3;
  const dPow = (defender[0]?.level||1)*10 + (defender[0]?.weapons||0)*5 + (defender[0]?.ammo||0)*3;
  const success = Math.random() < (rPow / (rPow + dPow));
  if (success) {
    await sb.query(`UPDATE caravans SET status='raided',raider_id=$1,raider_username=$2 WHERE id=$3`, [req.user.id, req.user.username, c.id]);
    await sb.query(`UPDATE users SET money=money+$1 WHERE id=$2`, [Math.floor(c.income * 0.7), req.user.id]);
    // Kervan sahibine bildirim
    try {
      const io = global._io;
      if (io) io.to(`user_${c.owner_id}`).emit('notification', { type:'error', message:`⚔️ ${req.user.username} kervanını soydu!` });
    } catch(e) {}
    res.json({ success: true, result: 'raided', loot: Math.floor(c.income * 0.7) });
  } else {
    res.json({ success: true, result: 'failed', message: 'Kervan korumaları püskürttü!' });
  }
}));

module.exports = router;
