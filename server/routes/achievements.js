// ═══════════════════════════════════════════════════════════════
// Başarım Sistemi — /api/achievements
// ═══════════════════════════════════════════════════════════════
const express = require('express');
const router  = express.Router();
const { asyncHandler }   = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/authMiddleware');
const sb = require('../services/supabaseService');

// GET /api/achievements — kullanıcının kazandığı başarımlar
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await sb.query(
    `SELECT achievement_id, earned_at FROM user_achievements WHERE user_id=$1 ORDER BY earned_at DESC`,
    [req.user.id]
  );
  res.json({ success: true, achievements: rows });
}));

// POST /api/achievements/unlock — başarım aç (frontend tarafından çağrılır)
router.post('/unlock', authMiddleware, asyncHandler(async (req, res) => {
  const { achievement_id } = req.body;
  if (!achievement_id || typeof achievement_id !== 'string' || achievement_id.length > 64) {
    return res.status(400).json({ success: false, message: 'Geçersiz başarım ID' });
  }
  // ON CONFLICT DO NOTHING — duplicate unlock'ları yoksay
  const { rowCount } = await sb.query(
    `INSERT INTO user_achievements(user_id, achievement_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,
    [req.user.id, achievement_id]
  );
  res.json({ success: true, new: rowCount > 0 });
}));

// POST /api/achievements/bulk-unlock — birden fazla başarım aç
router.post('/bulk-unlock', authMiddleware, asyncHandler(async (req, res) => {
  const { achievement_ids } = req.body;
  if (!Array.isArray(achievement_ids) || achievement_ids.length === 0) {
    return res.status(400).json({ success: false });
  }
  const valid = achievement_ids.filter(id => typeof id === 'string' && id.length <= 64).slice(0, 50);
  let newCount = 0;
  for (const aid of valid) {
    const { rowCount } = await sb.query(
      `INSERT INTO user_achievements(user_id, achievement_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,
      [req.user.id, aid]
    );
    newCount += rowCount;
  }
  res.json({ success: true, new: newCount });
}));

module.exports = router;
