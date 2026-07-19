const express = require('express');
const router  = express.Router();
const { asyncHandler }   = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/authMiddleware');
const db = require('../services/dbService');

// GET /api/ferman — list all
router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM fermanlar WHERE status='active' ORDER BY created_at DESC LIMIT 50`);
  res.json({ success:true, fermanlar: rows });
}));

// POST /api/ferman — create
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const { title, content, category='genel' } = req.body;
  if (!title?.trim() || !content?.trim()) return res.status(400).json({ success:false, message:'Başlık ve içerik gerekli' });
  const { rows } = await db.query(
    `INSERT INTO fermanlar(author_id,author_name,title,content,category)
     VALUES($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.id, req.user.username, title.trim(), content.trim(), category]
  );
  // Macera günlüğüne ekle
  await db.query(
    `INSERT INTO adventure_log(user_id,event_type,title,description,xp_earned)
     VALUES($1,'ferman',$2,'Ferman yayınladı',25)`,
    [req.user.id, title.trim()]
  ).catch(() => {});
  res.json({ success:true, ferman: rows[0] });
}));

// POST /api/ferman/:id/react
router.post('/:id/react', authMiddleware, asyncHandler(async (req, res) => {
  const { reaction } = req.body;
  if (!['like','dislike'].includes(reaction)) return res.status(400).json({ success:false });
  const id = parseInt(req.params.id);
  const prev = await db.query(`SELECT reaction FROM ferman_reactions WHERE ferman_id=$1 AND user_id=$2`, [id, req.user.id]);
  const prevReaction = prev.rows[0]?.reaction;
  await db.query(
    `INSERT INTO ferman_reactions(ferman_id,user_id,reaction) VALUES($1,$2,$3)
     ON CONFLICT(ferman_id,user_id) DO UPDATE SET reaction=$3`,
    [id, req.user.id, reaction]
  );
  // Update counts
  await db.query(`UPDATE fermanlar SET
    likes    = (SELECT COUNT(*) FROM ferman_reactions WHERE ferman_id=$1 AND reaction='like'),
    dislikes = (SELECT COUNT(*) FROM ferman_reactions WHERE ferman_id=$1 AND reaction='dislike')
    WHERE id=$1`, [id]);
  const { rows } = await db.query(`SELECT likes,dislikes FROM fermanlar WHERE id=$1`, [id]);
  res.json({ success:true, ...rows[0] });
}));

module.exports = router;
