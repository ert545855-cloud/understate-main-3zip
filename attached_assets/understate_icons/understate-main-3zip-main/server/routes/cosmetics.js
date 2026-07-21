/**
 * Kozmetik Sistemi — bayrak / arma / taht teması satın alma
 * Rekabete etki etmez; sadece profilde/beylik sayfasında görsel.
 */
const express = require('express');
const router  = express.Router();
const db      = require('../services/dbService');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler }   = require('../middleware/asyncHandler');

const KOZMETIKLER = [
  // Bayraklar
  { id:'bayrak_altin',    tur:'bayrak',       ad:'Altın Tuğra Bayrağı',   emoji:'🏳️', maliyet:5000,  aciklama:'Beyliğinizde parlak altın tuğra' },
  { id:'bayrak_hilal',    tur:'bayrak',       ad:'Hilal Bayrağı',         emoji:'☪️',  maliyet:3000,  aciklama:'Klasik Osmanlı hilali' },
  { id:'bayrak_arslan',   tur:'bayrak',       ad:'Arslan Bayrağı',         emoji:'🦁',  maliyet:8000,  aciklama:'Güç simgesi arslan figürü' },
  // Armalar
  { id:'arma_kartal',     tur:'arma',         ad:'Kartal Arması',          emoji:'🦅',  maliyet:6000,  aciklama:'Çift başlı kartal arması' },
  { id:'arma_kılıç',      tur:'arma',         ad:'Kılıç Arması',           emoji:'⚔️',  maliyet:4000,  aciklama:'Savaşçı beyliklerin tercihi' },
  { id:'arma_taç',        tur:'arma',         ad:'Taç Arması',             emoji:'👑',  maliyet:12000, aciklama:'Sadece padişahlara yakışır' },
  // Taht temaları
  { id:'taht_altin',      tur:'taht_temasi',  ad:'Altın Taht Teması',      emoji:'✨',  maliyet:15000, aciklama:'Profiliniz altın ışıltısıyla parlar' },
  { id:'taht_lacivert',   tur:'taht_temasi',  ad:'Lacivert Divan Teması',  emoji:'💙',  maliyet:10000, aciklama:'Sultanî mavi tonlar' },
  { id:'taht_kırmızı',    tur:'taht_temasi',  ad:'Kırmızı Hükümet Teması', emoji:'❤️',  maliyet:10000, aciklama:'Güç ve otorite kırmızısı' },
];

// ── GET /api/cosmetics/liste ─────────────────────────────────────────────────
router.get('/liste', authMiddleware, asyncHandler(async (req, res) => {
  let satin = [];
  try {
    const { rows } = await db.query(
      `SELECT kozmetik_id FROM kozmetik_satin_alimlar WHERE user_id=$1`, [req.user.id]
    );
    satin = rows.map(r => r.kozmetik_id);
  } catch (_) {}

  const liste = KOZMETIKLER.map(k => ({ ...k, sahipMi: satin.includes(k.id) }));
  res.json({ success: true, liste });
}));

// ── POST /api/cosmetics/satin-al ────────────────────────────────────────────
router.post('/satin-al', authMiddleware, asyncHandler(async (req, res) => {
  if (!db.isReady()) return res.status(503).json({ success: false, error: 'Veritabanı hazır değil' });

  const { kozmetikId } = req.body;
  const kozmetik = KOZMETIKLER.find(k => k.id === kozmetikId);
  if (!kozmetik) return res.status(400).json({ success: false, error: 'Geçersiz kozmetik' });

  // Zaten satın almış mı?
  const { rows: mevcut } = await db.query(
    `SELECT id FROM kozmetik_satin_alimlar WHERE user_id=$1 AND kozmetik_id=$2`,
    [req.user.id, kozmetikId]
  );
  if (mevcut.length) return res.status(400).json({ success: false, error: 'Bu kozmetiği zaten sahipsiniz' });

  // Bakiye kontrolü
  const { rows: userRows } = await db.query(
    `SELECT money FROM users WHERE id=$1 FOR UPDATE`, [req.user.id]
  );
  const u = userRows[0];
  if (!u) return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
  if ((u.money || 0) < kozmetik.maliyet) {
    return res.status(400).json({
      success: false,
      error: `Yetersiz Sikke — ${kozmetik.maliyet.toLocaleString('tr-TR')} gerekli`
    });
  }

  await db.query(`UPDATE users SET money=money-$1 WHERE id=$2`, [kozmetik.maliyet, req.user.id]);
  await db.query(
    `INSERT INTO kozmetik_satin_alimlar (user_id, kozmetik_id, tur) VALUES ($1,$2,$3)`,
    [req.user.id, kozmetikId, kozmetik.tur]
  );

  res.json({
    success: true,
    message: `${kozmetik.ad} başarıyla satın alındı`,
    kozmetik,
    harcanan: kozmetik.maliyet,
  });
}));

// ── GET /api/cosmetics/profil/:userId ───────────────────────────────────────
router.get('/profil/:userId', asyncHandler(async (req, res) => {
  let satin = [];
  try {
    const { rows } = await db.query(
      `SELECT kozmetik_id, tur FROM kozmetik_satin_alimlar WHERE user_id=$1`, [req.params.userId]
    );
    satin = rows;
  } catch (_) {}
  res.json({ success: true, kozmetikler: satin });
}));

module.exports = router;
