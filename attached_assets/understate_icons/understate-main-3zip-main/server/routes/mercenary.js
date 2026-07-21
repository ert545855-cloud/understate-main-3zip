/**
 * Paralı Asker Kiralama — Genel Sefer sırasında aktif
 * POST /api/mercenary/hire
 */
const express = require('express');
const router  = express.Router();
const db      = require('../services/dbService');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler }   = require('../middleware/asyncHandler');

// Paralı asker birim fiyatı ve başına kazandırdığı asker miktarı
const PAKET_TANIMLARI = [
  { id:'kucuk',  ad:'Küçük Manga',   asker:10,  maliyet:2000  },
  { id:'orta',   ad:'Orta Bölük',    asker:50,  maliyet:8000  },
  { id:'buyuk',  ad:'Büyük Alay',    asker:200, maliyet:28000 },
];

// ── GET /api/mercenary/paketler ──────────────────────────────────────────────
router.get('/paketler', authMiddleware, asyncHandler(async (req, res) => {
  // Aktif Genel Sefer durumu varsa paketler görünür
  let genelSefer = false;
  try {
    const { rows } = await db.query(
      `SELECT durum FROM padisahlik_donemleri WHERE durum='genel_sefer' LIMIT 1`
    );
    genelSefer = rows.length > 0;
  } catch (_) {}

  res.json({ success: true, genelSefer, paketler: PAKET_TANIMLARI });
}));

// ── POST /api/mercenary/hire ─────────────────────────────────────────────────
router.post('/hire', authMiddleware, asyncHandler(async (req, res) => {
  if (!db.isReady()) return res.status(503).json({ success: false, error: 'Veritabanı hazır değil' });

  // Sadece Genel Sefer'de çalışır
  const { rows: donemRows } = await db.query(
    `SELECT id FROM padisahlik_donemleri WHERE durum='genel_sefer' LIMIT 1`
  );
  if (!donemRows.length) {
    return res.status(403).json({ success: false, error: 'Paralı asker yalnızca Genel Sefer sırasında kiralanabilir' });
  }
  const donemId = donemRows[0].id;

  const { paketId } = req.body;
  const paket = PAKET_TANIMLARI.find(p => p.id === paketId);
  if (!paket) return res.status(400).json({ success: false, error: 'Geçersiz paket' });

  // Kullanıcı bakiyesini kontrol et ve düş
  const { rows: userRows } = await db.query(
    `SELECT money, weapons FROM users WHERE id=$1 FOR UPDATE`, [req.user.id]
  );
  const u = userRows[0];
  if (!u) return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
  if ((u.money || 0) < paket.maliyet) {
    return res.status(400).json({ success: false, error: `Yetersiz Sikke — ${paket.maliyet.toLocaleString('tr-TR')} gerekli` });
  }

  await db.query(
    `UPDATE users SET money=money-$1, weapons=weapons+$2 WHERE id=$3`,
    [paket.maliyet, paket.asker, req.user.id]
  );

  // Log kaydı
  await db.query(
    `INSERT INTO parali_asker_log (user_id, miktar, maliyet, donem_id) VALUES ($1,$2,$3,$4)`,
    [req.user.id, paket.asker, paket.maliyet, donemId]
  ).catch(() => {});

  if (global._io) {
    global._io.to(`user_${req.user.id}`).emit('mercenary:hired', {
      paket: paket.ad, asker: paket.asker
    });
  }

  res.json({
    success: true,
    message: `${paket.asker} paralı asker orduna katıldı`,
    askerEklendi: paket.asker,
    harcanan: paket.maliyet,
  });
}));

module.exports = router;
