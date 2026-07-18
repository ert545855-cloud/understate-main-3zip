const express = require('express');
const router  = express.Router();
const db      = require('../services/dbService');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler }   = require('../middleware/asyncHandler');

/* ─── KÖKEN (Origin) ───────────────────────────────────── */
router.get('/origins', asyncHandler(async (req, res) => {
  const { rows } = await db.query(`SELECT * FROM character_origins ORDER BY id`);
  res.json({ success: true, origins: rows });
}));

router.post('/origin/choose', authMiddleware, asyncHandler(async (req, res) => {
  const { originId } = req.body;
  const { rows: [user] } = await db.query(`SELECT id, origin, money, xp FROM users WHERE id=$1`, [req.user.id]);
  if (user.origin) return res.status(400).json({ success: false, message: 'Köken zaten seçilmiş' });

  const { rows: [origin] } = await db.query(`SELECT * FROM character_origins WHERE id=$1`, [originId]);
  if (!origin) return res.status(404).json({ success: false, message: 'Köken bulunamadı' });

  await db.query(
    `UPDATE users SET origin=$1, money=money+$2, xp=xp+$3 WHERE id=$4`,
    [originId, origin.bonus_money, origin.bonus_xp, user.id]
  );
  res.json({ success: true, origin, bonusMoney: origin.bonus_money, bonusXp: origin.bonus_xp });
}));

/* ─── SIFATLAR (Traits) ────────────────────────────────── */
router.get('/traits', authMiddleware, asyncHandler(async (req, res) => {
  const [defsR, userR] = await Promise.all([
    db.query(`SELECT * FROM trait_definitions ORDER BY cost_xp`),
    db.query(`SELECT traits FROM users WHERE id=$1`, [req.user.id])
  ]);
  res.json({ success: true, definitions: defsR.rows, myTraits: userR.rows[0]?.traits || [] });
}));

router.post('/trait/buy', authMiddleware, asyncHandler(async (req, res) => {
  const { traitId } = req.body;
  const [{ rows: [tdef] }, { rows: [user] }] = await Promise.all([
    db.query(`SELECT * FROM trait_definitions WHERE id=$1`, [traitId]),
    db.query(`SELECT xp, traits FROM users WHERE id=$1`, [req.user.id])
  ]);
  if (!tdef) return res.status(404).json({ success: false, message: 'Sıfat bulunamadı' });

  const myTraits = user.traits || [];
  if (myTraits.includes(traitId)) return res.status(400).json({ success: false, message: 'Zaten sahipsin' });
  if (myTraits.length >= 3) return res.status(400).json({ success: false, message: 'En fazla 3 sıfat seçebilirsin' });
  if ((user.xp || 0) < tdef.cost_xp) return res.status(400).json({ success: false, message: `Yetersiz XP (${tdef.cost_xp} XP gerekli)` });

  const newTraits = [...myTraits, traitId];
  await db.query(
    `UPDATE users SET traits=$1::jsonb, xp=xp-$2 WHERE id=$3`,
    [JSON.stringify(newTraits), tdef.cost_xp, req.user.id]
  );
  res.json({ success: true, trait: tdef, newTraits });
}));

/* ─── RUZNAME (Günlük) ─────────────────────────────────── */
router.get('/ruzname', authMiddleware, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const { rows } = await db.query(
    `SELECT r.*, (SELECT COUNT(*) FROM ruzname_likes l WHERE l.entry_id=r.id) as likes,
     EXISTS(SELECT 1 FROM ruzname_likes l WHERE l.entry_id=r.id AND l.user_id=$1) as i_liked
     FROM ruzname_entries r ORDER BY r.created_at DESC LIMIT 20 OFFSET $2`,
    [req.user.id, page * 20]
  );
  res.json({ success: true, entries: rows });
}));

router.get('/ruzname/mine', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM ruzname_entries WHERE user_id=$1 ORDER BY entry_date DESC LIMIT 30`,
    [req.user.id]
  );
  res.json({ success: true, entries: rows });
}));

router.post('/ruzname', authMiddleware, asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content || content.length < 5 || content.length > 500)
    return res.status(400).json({ success: false, message: 'Günlük 5–500 karakter olmalı' });

  const { rows: [user] } = await db.query(`SELECT username FROM users WHERE id=$1`, [req.user.id]);
  const { rows: [entry] } = await db.query(
    `INSERT INTO ruzname_entries (user_id, username, content)
     VALUES ($1,$2,$3)
     ON CONFLICT (user_id, entry_date) DO UPDATE SET content=EXCLUDED.content, created_at=NOW()
     RETURNING *`,
    [req.user.id, user.username, content]
  );
  if (global._io) global._io.emit('ruzname:new', { entry });
  res.json({ success: true, entry });
}));

router.post('/ruzname/like/:id', authMiddleware, asyncHandler(async (req, res) => {
  const entryId = parseInt(req.params.id);
  try {
    await db.query(`INSERT INTO ruzname_likes (entry_id, user_id) VALUES ($1,$2)`, [entryId, req.user.id]);
    await db.query(`UPDATE ruzname_entries SET like_count=like_count+1 WHERE id=$1`, [entryId]);
    res.json({ success: true, liked: true });
  } catch {
    await db.query(`DELETE FROM ruzname_likes WHERE entry_id=$1 AND user_id=$2`, [entryId, req.user.id]);
    await db.query(`UPDATE ruzname_entries SET like_count=GREATEST(0,like_count-1) WHERE id=$1`, [entryId]);
    res.json({ success: true, liked: false });
  }
}));

router.get('/ruzname/weekly-top', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT r.*, (SELECT COUNT(*) FROM ruzname_likes l WHERE l.entry_id=r.id) as likes
     FROM ruzname_entries r
     WHERE r.created_at >= NOW() - INTERVAL '7 days'
     ORDER BY likes DESC LIMIT 5`
  );
  res.json({ success: true, entries: rows });
}));

module.exports = router;
