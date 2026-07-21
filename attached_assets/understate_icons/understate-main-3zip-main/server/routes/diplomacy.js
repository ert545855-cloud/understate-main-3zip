// #20 Alliance Diplomacy Routes
const express = require('express');
const router  = express.Router();
const { asyncHandler } = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/authMiddleware');
const dipSvc = require('../services/diplomacyService');

let _io = null;
function setIO(io) { _io = io; }

router.get('/', asyncHandler(async (req, res) => {
  const actions = await dipSvc.getAll({ status: req.query.status });
  res.json({ success: true, actions });
}));

router.get('/alliance/:name', asyncHandler(async (req, res) => {
  const actions = await dipSvc.getActive(req.params.name);
  res.json({ success: true, actions });
}));

router.get('/types', (req, res) => {
  res.json({ success: true, types: dipSvc.VALID_ACTIONS });
});

router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const result = await dipSvc.propose(req.user.id, req.body);
  if (result.ok && _io) _io.emit('diplomacyProposal', { id: result.id, ...req.body });
  res.json({ success: result.ok, ...result });
}));

router.post('/:id/respond', authMiddleware, asyncHandler(async (req, res) => {
  const { accept } = req.body;
  const result = await dipSvc.respond(parseInt(req.params.id), req.user.id, !!accept);
  if (result.ok && _io) _io.emit('diplomacyResponse', { id: req.params.id, status: result.status });
  res.json({ success: result.ok, ...result });
}));

// ── Sözleşme Geçmişi ─────────────────────────────────────────────────────────

// GET /api/diplomacy/sozlesmeler — herkese açık, silinemez tarih
router.get('/sozlesmeler', asyncHandler(async (req, res) => {
  const { Pool } = require('pg');
  const db = require('../services/dbService');
  if (!db.isReady()) return res.json({ success: true, sozlesmeler: [] });

  const limit  = Math.min(parseInt(req.query.limit) || 50, 100);
  const { rows } = await db.query(
    `SELECT id, beylik_a_id, beylik_a_ad, beylik_b_id, beylik_b_ad,
            tur, durum, olusturma_tarihi, bozulma_tarihi, bozan_beylik_id
     FROM diplomasi_sozlesmeler
     ORDER BY olusturma_tarihi DESC
     LIMIT $1`,
    [limit]
  ).catch(() => ({ rows: [] }));

  res.json({ success: true, sozlesmeler: rows });
}));

// POST /api/diplomacy/sozlesme — yeni sözleşme kaydı (ittifak/ateşkes kabul edilince)
router.post('/sozlesme', authMiddleware, asyncHandler(async (req, res) => {
  const db = require('../services/dbService');
  if (!db.isReady()) return res.status(503).json({ success: false, error: 'DB hazır değil' });

  const { beylikAId, beylikAAd, beylikBId, beylikBAd, tur, sure } = req.body;
  if (!beylikAId || !beylikBId || !tur) {
    return res.status(400).json({ success: false, error: 'Eksik alan' });
  }

  const bitis = sure ? new Date(Date.now() + sure * 86400000) : null;

  const { rows: [soz] } = await db.query(
    `INSERT INTO diplomasi_sozlesmeler
       (beylik_a_id, beylik_a_ad, beylik_b_id, beylik_b_ad, tur, durum, bitis_tarihi)
     VALUES ($1,$2,$3,$4,$5,'aktif',$6) RETURNING id`,
    [beylikAId, beylikAAd || beylikAId, beylikBId, beylikBAd || beylikBId, tur, bitis?.toISOString() || null]
  );

  if (_io) _io.emit('diplomasi:sozlesme_yapildi', { id: soz.id, beylikAId, beylikBId, tur });
  res.json({ success: true, id: soz.id });
}));

// POST /api/diplomacy/sozlesme/:id/boz — tek taraflı bozma (itibar cezası)
router.post('/sozlesme/:id/boz', authMiddleware, asyncHandler(async (req, res) => {
  const db = require('../services/dbService');
  if (!db.isReady()) return res.status(503).json({ success: false, error: 'DB hazır değil' });

  const sozId = parseInt(req.params.id);
  const { bozanBeylikId } = req.body;

  const { rows: [soz] } = await db.query(
    `SELECT * FROM diplomasi_sozlesmeler WHERE id=$1 AND durum='aktif'`, [sozId]
  );
  if (!soz) return res.status(404).json({ success: false, error: 'Aktif sözleşme bulunamadı' });

  await db.query(
    `UPDATE diplomasi_sozlesmeler
     SET durum='bozuldu', bozulma_tarihi=NOW(), bozan_beylik_id=$1
     WHERE id=$2`,
    [bozanBeylikId || req.user.id, sozId]
  );

  // İtibar cezası (sözleşmeyi bozan taraf)
  await db.query(
    `UPDATE users SET itibar_score=GREATEST(0, itibar_score-30) WHERE id=$1`,
    [req.user.id]
  ).catch(() => {});

  if (_io) {
    _io.emit('diplomasi:sozlesme_bozuldu', {
      sozlesmeId: sozId, bozanBeylikId: bozanBeylikId || req.user.id,
    });
  }

  res.json({ success: true, message: 'Sözleşme bozuldu. İtibar -30 puan.' });
}));

module.exports = router;
module.exports.setIO = setIO;
