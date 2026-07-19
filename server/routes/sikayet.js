const express = require('express');
const router  = express.Router();
const { asyncHandler }   = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/authMiddleware');
const db = require('../services/dbService');

router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM sikayetler WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20`, [req.user.id]);
  res.json({ success:true, sikayetler: rows });
}));

router.get('/public', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT id,user_name,subject,category,status,official_reply,created_at,replied_at
     FROM sikayetler WHERE status!='beklemede' OR created_at > NOW()-INTERVAL '7 days'
     ORDER BY created_at DESC LIMIT 30`);
  res.json({ success:true, sikayetler: rows });
}));

router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const { subject, content, category='genel' } = req.body;
  if (!subject?.trim() || !content?.trim()) return res.status(400).json({ success:false, message:'Konu ve içerik gerekli' });
  const { rows } = await db.query(
    `INSERT INTO sikayetler(user_id,user_name,subject,content,category)
     VALUES($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.id, req.user.username, subject.trim(), content.trim(), category]);
  res.json({ success:true, sikayet: rows[0] });
}));

// Admin: reply
router.post('/:id/reply', authMiddleware, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'vali') return res.status(403).json({ success:false });
  const { reply, status='yanıtlandı' } = req.body;
  await db.query(
    `UPDATE sikayetler SET official_reply=$1, status=$2, replied_by=$3, replied_at=NOW() WHERE id=$4`,
    [reply, status, req.user.username, req.params.id]);
  res.json({ success:true });
}));

module.exports = router;
