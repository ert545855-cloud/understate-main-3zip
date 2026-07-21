const express = require('express');
const router  = express.Router();
const db      = require('../services/dbService');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler }   = require('../middleware/asyncHandler');

/* GET /api/guild-hall/:guildId/messages */
router.get('/:guildId/messages', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM guild_hall_messages WHERE guild_id=$1 ORDER BY created_at DESC LIMIT 50`,
    [req.params.guildId]
  );
  res.json({ success: true, messages: rows.reverse() });
}));

/* POST /api/guild-hall/:guildId/messages */
router.post('/:guildId/messages', authMiddleware, asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content?.trim() || content.length > 500) return res.status(400).json({ success: false });

  const { rows: [user] } = await db.query(`SELECT username FROM users WHERE id=$1`, [req.user.id]);
  const { rows: [msg] } = await db.query(
    `INSERT INTO guild_hall_messages (guild_id, user_id, username, content) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.params.guildId, req.user.id, user.username, content.trim()]
  );

  if (global._io) global._io.to(`guild_${req.params.guildId}`).emit('guild_hall:msg', msg);
  res.json({ success: true, message: msg });
}));

/* DELETE /api/guild-hall/:guildId/messages/:msgId (leader only placeholder) */
router.delete('/:guildId/messages/:msgId', authMiddleware, asyncHandler(async (req, res) => {
  await db.query(
    `DELETE FROM guild_hall_messages WHERE id=$1 AND (user_id=$2 OR guild_id IN (SELECT id::text FROM users WHERE id=$2))`,
    [req.params.msgId, req.user.id]
  );
  res.json({ success: true });
}));

module.exports = router;
