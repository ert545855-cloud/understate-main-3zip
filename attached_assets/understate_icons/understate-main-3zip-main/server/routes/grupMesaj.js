const express = require('express');
const router  = express.Router();
const { asyncHandler }   = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/authMiddleware');
const db = require('../services/dbService');

const VALID_ROOMS = ['genel','ticaret','savas','devlet','zanaat'];

router.get('/:room', authMiddleware, asyncHandler(async (req, res) => {
  const room = req.params.room;
  if (!VALID_ROOMS.includes(room)) return res.status(400).json({ success:false, message:'Geçersiz oda' });
  const { rows } = await db.query(
    `SELECT * FROM group_messages WHERE room_id=$1 ORDER BY created_at DESC LIMIT 50`,
    [room]
  );
  res.json({ success:true, messages: rows.reverse() });
}));

router.post('/:room', authMiddleware, asyncHandler(async (req, res) => {
  const room = req.params.room;
  if (!VALID_ROOMS.includes(room)) return res.status(400).json({ success:false, message:'Geçersiz oda' });
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ success:false, message:'Mesaj boş olamaz' });
  if (content.length > 500) return res.status(400).json({ success:false, message:'Mesaj çok uzun (maks 500)' });
  const { rows } = await db.query(
    `INSERT INTO group_messages(room_id,room_name,sender_id,sender_name,content)
     VALUES($1,$1,$2,$3,$4) RETURNING *`,
    [room, req.user.id, req.user.username, content.trim()]
  );
  res.json({ success:true, message: rows[0] });
}));

module.exports = router;
