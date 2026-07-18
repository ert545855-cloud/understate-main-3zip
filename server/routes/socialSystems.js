const express = require('express');
const router  = express.Router();
const db      = require('../services/dbService');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler }   = require('../middleware/asyncHandler');

/* ─── ANNOUNCEMENTS (Duyuru Panosu / İlan) ─────────────── */
router.get('/announcements', authMiddleware, asyncHandler(async (req, res) => {
  await db.query(`DELETE FROM announcements WHERE expires_at < NOW()`); // auto-clean
  const { rows } = await db.query(`SELECT * FROM announcements ORDER BY created_at DESC LIMIT 50`);
  res.json({ success: true, announcements: rows });
}));

router.post('/announcements', authMiddleware, asyncHandler(async (req, res) => {
  const { content, category } = req.body;
  if (!content || content.length > 200) return res.status(400).json({ success: false, message: 'İlan metni 1–200 karakter olmalı' });
  const { rows: [user] } = await db.query(`SELECT username FROM users WHERE id=$1`, [req.user.id]);
  const cat = ['is','ortak','satis','genel'].includes(category) ? category : 'genel';
  const { rows: [ann] } = await db.query(
    `INSERT INTO announcements (user_id, username, content, category) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.id, user.username, content, cat]
  );
  if (global._io) global._io.emit('announcement:new', ann);
  res.json({ success: true, announcement: ann });
}));

router.delete('/announcements/:id', authMiddleware, asyncHandler(async (req, res) => {
  await db.query(`DELETE FROM announcements WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
  res.json({ success: true });
}));

/* ─── FRIEND GIFTS (Arkadaş Hediye) ─────────────────────── */
router.get('/gifts', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM friend_gifts WHERE receiver_id=$1 AND status='pending' ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json({ success: true, gifts: rows });
}));

router.post('/gifts/send', authMiddleware, asyncHandler(async (req, res) => {
  const { receiverId, amount, message } = req.body;
  const amt = parseInt(amount) || 0;
  if (!receiverId || receiverId === req.user.id) return res.status(400).json({ success: false });
  if (amt < 10 || amt > 10000) return res.status(400).json({ success: false, message: 'Hediye 10–10,000 🪙 arasında olmalı' });

  const { rows: [user] } = await db.query(`SELECT id,username,money FROM users WHERE id=$1`, [req.user.id]);
  if ((user.money || 0) < amt) return res.status(400).json({ success: false, message: 'Yetersiz para' });

  // 1 gift per day per receiver
  const { rows: existing } = await db.query(
    `SELECT id FROM friend_gifts WHERE sender_id=$1 AND receiver_id=$2 AND created_at > NOW()-INTERVAL '24 hours'`,
    [req.user.id, receiverId]
  );
  if (existing.length) return res.status(400).json({ success: false, message: 'Bugün bu kişiye zaten hediye gönderdin' });

  await db.query(`UPDATE users SET money=money-$1 WHERE id=$2`, [amt, user.id]);
  const { rows: [gift] } = await db.query(
    `INSERT INTO friend_gifts (sender_id, sender_name, receiver_id, amount, message) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [user.id, user.username, receiverId, amt, message || '']
  );

  if (global._io) global._io.to(`user_${receiverId}`).emit('gift:received', { from: user.username, amount: amt, giftId: gift.id });
  res.json({ success: true, gift });
}));

router.post('/gifts/accept/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { rows: [gift] } = await db.query(
    `SELECT * FROM friend_gifts WHERE id=$1 AND receiver_id=$2 AND status='pending'`,
    [req.params.id, req.user.id]
  );
  if (!gift) return res.status(404).json({ success: false });
  await db.query(`UPDATE friend_gifts SET status='accepted' WHERE id=$1`, [gift.id]);
  await db.query(`UPDATE users SET money=money+$1 WHERE id=$2`, [gift.amount, req.user.id]);
  res.json({ success: true, amount: gift.amount });
}));

/* ─── FAME / GOSSIP (Şöhret & Dedikodu) ─────────────────── */
router.get('/fame/:userId', authMiddleware, asyncHandler(async (req, res) => {
  const { rows: [user] } = await db.query(
    `SELECT username, fame_score, war_elo, war_league FROM users WHERE id=$1`, [req.params.userId]
  );
  const { rows: events } = await db.query(
    `SELECT * FROM fame_events WHERE user_id=$1 AND public=true ORDER BY created_at DESC LIMIT 10`,
    [req.params.userId]
  );
  res.json({ success: true, user, events });
}));

router.post('/fame', authMiddleware, asyncHandler(async (req, res) => {
  const { eventType, description, famePoints } = req.body;
  const pts = Math.min(parseInt(famePoints) || 10, 100);
  await db.query(`INSERT INTO fame_events (user_id, event_type, description, fame_points) VALUES ($1,$2,$3,$4)`,
    [req.user.id, eventType, description, pts]);
  await db.query(`UPDATE users SET fame_score=fame_score+$1 WHERE id=$2`, [pts, req.user.id]);
  res.json({ success: true });
}));

/* ─── PALACE INTRIGUE (Saray İntrigi Kartları) ──────────── */
const INTRIGUE_CARDS = [
  { id:'vezir_ihbar',   text:'Vezir seni ihbar etti!',       effect:{money:-500},            emoji:'⚠️' },
  { id:'saray_sairi',   text:'Saray şairi seni övdü!',       effect:{xp:50},                 emoji:'🎭' },
  { id:'altin_buldu',   text:'Hazinede gizli altın buldun!', effect:{money:800},              emoji:'💰' },
  { id:'hain_kefalet',  text:'Bir hain sana borçlandı.',     effect:{money:300},              emoji:'🤝' },
  { id:'yangın',        text:'Atölyen yandı!',               effect:{money:-400},             emoji:'🔥' },
  { id:'pasa_armagan',  text:'Paşa bir armağan gönderdi!',   effect:{money:600, xp:20},      emoji:'🎁' },
  { id:'casuslar',      text:'Casuslar tuzak kurdu.',        effect:{money:-300, xp:-10},    emoji:'🕵️' },
  { id:'zafer_kutlama', text:'Zafer kutlamasına davet edildin!', effect:{xp:80, fame:15},    emoji:'🎊' },
  { id:'veba',          text:'Şehirde veba çıktı, ticaret durdu.', effect:{money:-200},      emoji:'💀' },
  { id:'sultan_lutuf',  text:'Sultan sana iltifat etti!',    effect:{xp:100, fame:25},       emoji:'👑' },
];

router.post('/intrigue/draw', authMiddleware, asyncHandler(async (req, res) => {
  const { rows: [rec] } = await db.query(`SELECT * FROM intrigue_draws WHERE user_id=$1`, [req.user.id]);
  const today = new Date().toISOString().split('T')[0];
  if (rec && rec.last_draw && rec.last_draw.toISOString().split('T')[0] === today)
    return res.status(429).json({ success: false, message: 'Bugün zaten kart çektin. Yarın tekrar dene.' });

  const card = INTRIGUE_CARDS[Math.floor(Math.random() * INTRIGUE_CARDS.length)];
  await db.query(`
    INSERT INTO intrigue_draws (user_id, last_draw, draw_count) VALUES ($1, NOW(), 1)
    ON CONFLICT (user_id) DO UPDATE SET last_draw=NOW(), draw_count=intrigue_draws.draw_count+1`,
    [req.user.id]
  );

  const updates = [];
  if (card.effect.money) updates.push(db.query(`UPDATE users SET money=GREATEST(0,money+$1) WHERE id=$2`, [card.effect.money, req.user.id]));
  if (card.effect.xp)    updates.push(db.query(`UPDATE users SET xp=GREATEST(0,xp+$1) WHERE id=$2`, [card.effect.xp, req.user.id]));
  if (card.effect.fame)  updates.push(db.query(`UPDATE users SET fame_score=GREATEST(0,fame_score+$1) WHERE id=$2`, [card.effect.fame, req.user.id]));
  await Promise.all(updates);

  res.json({ success: true, card });
}));

/* ─── OFFLINE EARNINGS SUMMARY ───────────────────────────── */
router.get('/offline-summary', authMiddleware, asyncHandler(async (req, res) => {
  const { rows: [rec] } = await db.query(`SELECT * FROM offline_earnings WHERE user_id=$1`, [req.user.id]);
  if (!rec || !rec.pending_summary || !Object.keys(rec.pending_summary).length)
    return res.json({ success: true, hasSummary: false });
  // Clear after reading
  await db.query(`UPDATE offline_earnings SET pending_summary='{}' WHERE user_id=$1`, [req.user.id]);
  res.json({ success: true, hasSummary: true, summary: rec.pending_summary });
}));

module.exports = router;
