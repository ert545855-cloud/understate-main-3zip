const express = require('express');
const router  = express.Router();
const { asyncHandler }   = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/authMiddleware');
const db = require('../services/dbService');

// GET /api/arkadas — my friends list
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT f.*, u.username, u.level, u.active_title FROM friendships f
     JOIN users u ON (CASE WHEN f.user_id=$1 THEN f.friend_id ELSE f.user_id END)=u.id
     WHERE (f.user_id=$1 OR f.friend_id=$1) AND f.status='accepted'
     ORDER BY u.username`, [req.user.id]);
  res.json({ success:true, friends: rows });
}));

// GET /api/arkadas/requests — incoming requests
router.get('/requests', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT f.*, u.username, u.level FROM friendships f
     JOIN users u ON f.user_id=u.id
     WHERE f.friend_id=$1 AND f.status='pending'
     ORDER BY f.created_at DESC`, [req.user.id]);
  res.json({ success:true, requests: rows });
}));

// POST /api/arkadas/request — send request
router.post('/request', authMiddleware, asyncHandler(async (req, res) => {
  const { username } = req.body;
  const { rows:target } = await db.query(`SELECT id FROM users WHERE username=$1`, [username]);
  if (!target.length) return res.status(404).json({ success:false, message:'Oyuncu bulunamadı' });
  const friendId = target[0].id;
  if (friendId === req.user.id) return res.status(400).json({ success:false, message:'Kendinize istek gönderemezsiniz' });
  await db.query(
    `INSERT INTO friendships(user_id,friend_id,status) VALUES($1,$2,'pending')
     ON CONFLICT DO NOTHING`, [req.user.id, friendId]);
  res.json({ success:true });
}));

// POST /api/arkadas/respond — accept/reject
router.post('/respond', authMiddleware, asyncHandler(async (req, res) => {
  const { friendship_id, action } = req.body;
  if (!['accept','reject'].includes(action)) return res.status(400).json({ success:false });
  if (action === 'accept') {
    await db.query(`UPDATE friendships SET status='accepted' WHERE id=$1 AND friend_id=$2`, [friendship_id, req.user.id]);
  } else {
    await db.query(`DELETE FROM friendships WHERE id=$1 AND friend_id=$2`, [friendship_id, req.user.id]);
  }
  res.json({ success:true });
}));

module.exports = router;
