const express = require('express');
const router  = express.Router();
const { asyncHandler }   = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/authMiddleware');
const db = require('../services/dbService');

router.get('/search', authMiddleware, asyncHandler(async (req, res) => {
  const q = (req.query.q||'').trim();
  if (q.length < 2) return res.status(400).json({ success:false, message:'En az 2 karakter' });
  const { rows } = await db.query(
    `SELECT id,username,level,score,merit_points,active_title FROM users
     WHERE username ILIKE $1 AND id!=$2 LIMIT 10`,
    [`${q}%`, req.user.id]
  );
  res.json({ success:true, players: rows });
}));

module.exports = router;
