// #15 Tax Routes
const express = require('express');
const router  = express.Router();
const { asyncHandler } = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/authMiddleware');
const taxSvc = require('../services/taxService');
const db = require('../services/dbService');

router.get('/', asyncHandler(async (req, res) => {
  const rates = await taxSvc.getAllRates();
  res.json({ success: true, rates });
}));

router.get('/:city', authMiddleware, asyncHandler(async (req, res) => {
  const rates = await taxSvc.getRates(decodeURIComponent(req.params.city));
  res.json({ success: true, rates });
}));

router.put('/:city', authMiddleware, asyncHandler(async (req, res) => {
  const { income, trade, property } = req.body;
  const result = await taxSvc.setRates(decodeURIComponent(req.params.city), { income, trade, property }, req.user.id);
  res.json({ success: result.ok });
}));

// GET /api/tax/history — vergi tahsilat geçmişi
router.get('/history', asyncHandler(async (req, res) => {
  const city = req.query.city;
  let query = `SELECT * FROM tax_history`;
  const params = [];
  if (city) { params.push(city); query += ` WHERE city=$1`; }
  query += ` ORDER BY created_at DESC LIMIT 50`;
  const { rows } = await db.query(query, params).catch(() => ({ rows: [] }));
  res.json({ success: true, history: rows });
}));

// POST /api/tax/:city/collect — vergi topla ve geçmişe kaydet
router.post('/:city/collect', authMiddleware, asyncHandler(async (req, res) => {
  const city = decodeURIComponent(req.params.city);
  const { amount_collected, taxpayer_count } = req.body;
  const rates = await taxSvc.getRates(city);
  await db.query(
    `INSERT INTO tax_history(city, collector_id, collector_name, income_rate, trade_rate, property_rate, amount_collected, taxpayer_count)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
    [city, req.user.id, req.user.username,
     rates?.income || 0, rates?.trade || 0, rates?.property || 0,
     parseInt(amount_collected) || 0, parseInt(taxpayer_count) || 0]
  );
  // Vali performans puanı artır
  await db.query(
    `UPDATE users SET vali_actions_count=COALESCE(vali_actions_count,0)+1,
     vali_performance_score=COALESCE(vali_performance_score,0)+5 WHERE id=$1`, [req.user.id]
  ).catch(() => {});
  res.json({ success: true });
}));

router.get('/summary/economy', asyncHandler(async (req, res) => {
  if (!db.isReady()) return res.json({ success: true, treasury: 0, collected: 0 });
  const { rows } = await db.query(
    `SELECT value FROM game_state WHERE key='economy'`
  ).catch(() => ({ rows: [] }));
  const eco = rows[0]?.value || {};
  res.json({ success: true, treasury: eco.treasury || 0, inflation: eco.inflation || 5 });
}));

module.exports = router;
