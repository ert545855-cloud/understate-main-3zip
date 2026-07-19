/**
 * Padişahlık Savaşı — 90 günlük döngü + 3 günlük Genel Sefer
 * Her dönem sonunda en çok eyalete sahip beylik başkanı Padişah ilan edilir.
 */
const express = require('express');
const router  = express.Router();
const db      = require('../services/dbService');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler }   = require('../middleware/asyncHandler');
const logger             = require('../utils/logger');

const DONEM_GUN       = 90;
const GENEL_SEFER_GUN = 3;

// ── Yardımcı: aktif dönemi getir veya oluştur ────────────────────────────────
async function getAktifDonem() {
  if (!db.isReady()) return null;
  try {
    const { rows } = await db.query(
      `SELECT * FROM padisahlik_donemleri WHERE durum IN ('normal','genel_sefer') ORDER BY id DESC LIMIT 1`
    );
    if (rows.length) return rows[0];

    // Yeni dönem oluştur
    const now   = new Date();
    const bitis = new Date(now.getTime() + DONEM_GUN * 86400000);
    const gsBas = new Date(bitis.getTime() - GENEL_SEFER_GUN * 86400000);

    const ins = await db.query(
      `INSERT INTO padisahlik_donemleri
         (baslangic_tarihi, bitis_tarihi, genel_sefer_baslangic, genel_sefer_bitis, durum)
       VALUES ($1,$2,$3,$4,'normal') RETURNING *`,
      [now.toISOString(), bitis.toISOString(), gsBas.toISOString(), bitis.toISOString()]
    );
    logger.info('[Padişahlık] Yeni dönem başlatıldı, id=' + ins.rows[0].id);
    return ins.rows[0];
  } catch (e) {
    logger.error('[Padişahlık] getAktifDonem hatası:', e.message);
    return null;
  }
}

// ── Zamanlayıcı: durum güncellemesi ─────────────────────────────────────────
async function donemKontrolEt(io) {
  if (!db.isReady()) return;
  try {
    const donem = await getAktifDonem();
    if (!donem) return;

    const now = new Date();
    const gsB = new Date(donem.genel_sefer_baslangic);
    const bit = new Date(donem.bitis_tarihi);

    // normal → genel_sefer
    if (donem.durum === 'normal' && now >= gsB) {
      await db.query(
        `UPDATE padisahlik_donemleri SET durum='genel_sefer' WHERE id=$1`, [donem.id]
      );
      if (io) io.emit('genel_sefer:basladi', { donemId: donem.id, bitis: donem.bitis_tarihi });
      logger.info('[Padişahlık] ⚔️ GENEL SEFER BAŞLADI — dönem id=' + donem.id);
      return;
    }

    // genel_sefer → tamamlandi
    if (donem.durum === 'genel_sefer' && now >= bit) {
      const { rows: sira } = await db.query(
        `SELECT beylik_id FROM eyalet_fetih_sayaci
         WHERE donem_id=$1 ORDER BY eyalet_sayisi DESC LIMIT 1`,
        [donem.id]
      );
      const padisahBeylikId = sira[0]?.beylik_id || null;

      await db.query(
        `UPDATE padisahlik_donemleri SET durum='tamamlandi', padisah_beylik_id=$1 WHERE id=$2`,
        [padisahBeylikId, donem.id]
      );

      if (io) io.emit('genel_sefer:bitti',    { donemId: donem.id });
      if (io && padisahBeylikId) io.emit('padisah:ilan_edildi', { beylikId: padisahBeylikId });
      logger.info('[Padişahlık] 👑 DÖNEM TAMAMLANDI — Padişah beyliği=' + padisahBeylikId);
    }
  } catch (e) {
    logger.error('[Padişahlık] donemKontrolEt hatası:', e.message);
  }
}

// 5 dakikada bir kontrol
let _io = null;
setInterval(() => donemKontrolEt(_io), 5 * 60 * 1000);
function setIO(io) { _io = io; }

// ── GET /api/padisahlik/durum ────────────────────────────────────────────────
router.get('/durum', authMiddleware, asyncHandler(async (req, res) => {
  await donemKontrolEt(_io);
  const donem = await getAktifDonem();
  if (!donem) return res.json({ success: false, error: 'Veritabanı hazır değil' });

  let sira = [];
  try {
    const { rows } = await db.query(
      `SELECT beylik_id, eyalet_sayisi FROM eyalet_fetih_sayaci
       WHERE donem_id=$1 ORDER BY eyalet_sayisi DESC LIMIT 20`,
      [donem.id]
    );
    sira = rows;
  } catch (_) {}

  let sonPadisah = null;
  try {
    const { rows } = await db.query(
      `SELECT padisah_beylik_id, bitis_tarihi FROM padisahlik_donemleri
       WHERE durum='tamamlandi' ORDER BY id DESC LIMIT 1`
    );
    sonPadisah = rows[0] || null;
  } catch (_) {}

  res.json({ success: true, donem, sira, sonPadisah });
}));

// ── Internal server-only helper: fetih sayacını artır ───────────────────────
// UYARI: Bu fonksiyon HTTP endpoint değil — yalnızca server-side route'lardan
// (beylikWar resolve, regionControl conquest) doğrudan import edilerek çağrılır.
// Kullanıcı doğrudan miktar veya beylikId giremez.
async function incrementFetihSayaci(beylikId, miktar) {
  if (!beylikId || !db.isReady()) return;
  const sayi = 1; // miktar her zaman 1 — dışarıdan kontrol edilemez
  try {
    await donemKontrolEt(_io);
    const donem = await getAktifDonem();
    if (!donem) return;
    await db.query(
      `INSERT INTO eyalet_fetih_sayaci (donem_id, beylik_id, eyalet_sayisi)
       VALUES ($1,$2,$3)
       ON CONFLICT (donem_id, beylik_id)
       DO UPDATE SET eyalet_sayisi = eyalet_fetih_sayaci.eyalet_sayisi + $3,
                     guncelleme_tarihi = NOW()`,
      [donem.id, beylikId, sayi]
    );
    logger.info(`[Padişahlık] Fetih kaydedildi: beylikId=${beylikId}, dönem=${donem.id}`);
  } catch (e) {
    logger.error('[Padişahlık] incrementFetihSayaci hatası:', e.message);
  }
}

// ── GET /api/padisahlik/gecmis ───────────────────────────────────────────────
router.get('/gecmis', authMiddleware, asyncHandler(async (req, res) => {
  let gecmis = [];
  try {
    const { rows } = await db.query(
      `SELECT id, baslangic_tarihi, bitis_tarihi, padisah_beylik_id, durum
       FROM padisahlik_donemleri ORDER BY id DESC LIMIT 10`
    );
    gecmis = rows;
  } catch (_) {}
  res.json({ success: true, gecmis });
}));

module.exports = router;
module.exports.setIO = setIO;
module.exports.donemKontrolEt = donemKontrolEt;
module.exports.incrementFetihSayaci = incrementFetihSayaci;
module.exports.getAktifDonem = getAktifDonem;
