const express = require('express');
const router  = express.Router();
const { asyncHandler }   = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/authMiddleware');
const db = require('../services/dbService');

router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM adventure_log WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30`,
    [req.user.id]
  );
  res.json({ success:true, log: rows });
}));

module.exports = router;
