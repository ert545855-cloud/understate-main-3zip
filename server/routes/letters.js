const express = require('express');
const router  = express.Router();
const db      = require('../services/dbService');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler }   = require('../middleware/asyncHandler');

/* GET /api/letters/inbox */
router.get('/inbox', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT l.*, u.username as sender_name FROM letters l
     JOIN users u ON u.id=l.sender_id
     WHERE l.receiver_id=$1 ORDER BY l.created_at DESC LIMIT 30`,
    [req.user.id]
  );
  res.json({ success: true, letters: rows });
}));

/* GET /api/letters/sent */
router.get('/sent', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT l.*, u.username as receiver_name FROM letters l
     JOIN users u ON u.id=l.receiver_id
     WHERE l.sender_id=$1 ORDER BY l.created_at DESC LIMIT 30`,
    [req.user.id]
  );
  res.json({ success: true, letters: rows });
}));

/* POST /api/letters/send */
router.post('/send', authMiddleware, asyncHandler(async (req, res) => {
  const { receiverId, subject, content, sealed } = req.body;
  if (!receiverId || !content?.trim()) return res.status(400).json({ success: false, message: 'Alıcı ve içerik gerekli' });
  if (content.length > 1000) return res.status(400).json({ success: false, message: 'Mektup max 1000 karakter' });
  if (receiverId === req.user.id) return res.status(400).json({ success: false, message: 'Kendine mektup yazamazsın' });

  const { rows: [sender] } = await db.query(`SELECT username FROM users WHERE id=$1`, [req.user.id]);
  const { rows: [receiver] } = await db.query(`SELECT id, username FROM users WHERE id=$1`, [receiverId]);
  if (!receiver) return res.status(404).json({ success: false, message: 'Alıcı bulunamadı' });

  const { rows: [letter] } = await db.query(
    `INSERT INTO letters (sender_id, sender_name, receiver_id, subject, content, sealed)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.id, sender.username, receiverId, subject || 'Mektup', content.trim(), sealed !== false]
  );

  if (global._io) global._io.to(`user_${receiverId}`).emit('letter:received', {
    from: sender.username, subject: letter.subject, sealed: letter.sealed
  });
  res.json({ success: true, letter });
}));

/* GET /api/letters/:id */
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { rows: [letter] } = await db.query(
    `SELECT * FROM letters WHERE id=$1 AND (sender_id=$2 OR receiver_id=$2)`,
    [req.params.id, req.user.id]
  );
  if (!letter) return res.status(404).json({ success: false, message: 'Mektup bulunamadı' });
  if (!letter.read && String(letter.receiver_id) === String(req.user.id)) {
    await db.query(`UPDATE letters SET read=true WHERE id=$1`, [letter.id]);
  }
  res.json({ success: true, letter });
}));

/* DELETE /api/letters/:id */
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  await db.query(
    `DELETE FROM letters WHERE id=$1 AND (sender_id=$2 OR receiver_id=$2)`,
    [req.params.id, req.user.id]
  );
  res.json({ success: true });
}));

/* GET /api/letters/unread-count */
router.get('/count/unread', authMiddleware, asyncHandler(async (req, res) => {
  const { rows: [r] } = await db.query(
    `SELECT COUNT(*) as cnt FROM letters WHERE receiver_id=$1 AND read=false`, [req.user.id]
  );
  res.json({ success: true, count: parseInt(r.cnt) });
}));

module.exports = router;
