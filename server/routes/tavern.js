const express = require('express');
const router  = express.Router();
const db      = require('../services/dbService');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler }   = require('../middleware/asyncHandler');

const MENU = [
  { id:'kahve',   name:'Türk Kahvesi',  price:50,   xp:5,  emoji:'☕' },
  { id:'rakı',    name:'Rakı',          price:150,  xp:10, emoji:'🥃' },
  { id:'şerbet',  name:'Gül Şerbeti',   price:80,   xp:7,  emoji:'🌹' },
  { id:'baklava', name:'Baklava',       price:200,  xp:15, emoji:'🍰' },
  { id:'nargile', name:'Nargile',       price:300,  xp:20, emoji:'💨' },
];

/* GET /api/tavern/tables */
router.get('/tables', authMiddleware, asyncHandler(async (req, res) => {
  const { rows: tables } = await db.query(`SELECT * FROM tavern_tables ORDER BY table_no`);
  const { rows: occupants } = await db.query(
    `SELECT id, username, tavern_table FROM users WHERE tavern_table IS NOT NULL`
  );
  const enriched = tables.map(t => ({
    ...t,
    occupants: occupants.filter(u => u.tavern_table === t.table_no)
  }));
  res.json({ success: true, tables: enriched, menu: MENU });
}));

/* POST /api/tavern/sit */
router.post('/sit', authMiddleware, asyncHandler(async (req, res) => {
  const { tableNo } = req.body;
  const { rows: [table] } = await db.query(`SELECT * FROM tavern_tables WHERE table_no=$1`, [tableNo]);
  if (!table) return res.status(404).json({ success: false, message: 'Masa bulunamadı' });

  const { rows: occupants } = await db.query(
    `SELECT id FROM users WHERE tavern_table=$1`, [tableNo]
  );
  if (occupants.length >= table.capacity)
    return res.status(400).json({ success: false, message: 'Masa dolu' });

  await db.query(`UPDATE users SET tavern_table=$1 WHERE id=$2`, [tableNo, req.user.id]);
  const { rows: [user] } = await db.query(`SELECT username FROM users WHERE id=$1`, [req.user.id]);

  if (global._io) global._io.emit('tavern:sit', { tableNo, username: user.username });
  res.json({ success: true, tableNo });
}));

/* POST /api/tavern/leave */
router.post('/leave', authMiddleware, asyncHandler(async (req, res) => {
  const { rows: [user] } = await db.query(`SELECT username, tavern_table FROM users WHERE id=$1`, [req.user.id]);
  await db.query(`UPDATE users SET tavern_table=NULL WHERE id=$1`, [req.user.id]);
  if (global._io) global._io.emit('tavern:leave', { tableNo: user.tavern_table, username: user.username });
  res.json({ success: true });
}));

/* POST /api/tavern/order */
router.post('/order', authMiddleware, asyncHandler(async (req, res) => {
  const { itemId } = req.body;
  const item = MENU.find(m => m.id === itemId);
  if (!item) return res.status(400).json({ success: false, message: 'Menüde yok' });

  const { rows: [user] } = await db.query(`SELECT username, money, xp, tavern_table FROM users WHERE id=$1`, [req.user.id]);
  if ((user.money || 0) < item.price) return res.status(400).json({ success: false, message: 'Yetersiz para' });
  if (!user.tavern_table) return res.status(400).json({ success: false, message: 'Önce bir masaya otur' });

  await db.query(`UPDATE users SET money=money-$1, xp=xp+$2 WHERE id=$3`, [item.price, item.xp, req.user.id]);
  await db.query(
    `INSERT INTO tavern_messages (table_no, user_id, username, order_item, content) VALUES ($1,$2,$3,$4,$5)`,
    [user.tavern_table, req.user.id, user.username, item.id, `${item.emoji} ${item.name} ısmarlıyor!`]
  );

  if (global._io) global._io.to(`tavern_${user.tavern_table}`).emit('tavern:order', {
    tableNo: user.tavern_table, username: user.username, item
  });
  res.json({ success: true, item, newMoney: (user.money - item.price), xpGained: item.xp });
}));

/* GET/POST /api/tavern/chat/:tableNo */
router.get('/chat/:tableNo', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM tavern_messages WHERE table_no=$1 ORDER BY created_at DESC LIMIT 50`,
    [req.params.tableNo]
  );
  res.json({ success: true, messages: rows.reverse() });
}));

router.post('/chat/:tableNo', authMiddleware, asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content?.trim() || content.length > 300) return res.status(400).json({ success: false });

  const { rows: [user] } = await db.query(`SELECT username, tavern_table FROM users WHERE id=$1`, [req.user.id]);
  if (user.tavern_table !== parseInt(req.params.tableNo))
    return res.status(403).json({ success: false, message: 'Bu masada değilsin' });

  const { rows: [msg] } = await db.query(
    `INSERT INTO tavern_messages (table_no, user_id, username, content) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.params.tableNo, req.user.id, user.username, content.trim()]
  );
  if (global._io) global._io.to(`tavern_${req.params.tableNo}`).emit('tavern:msg', msg);
  res.json({ success: true, message: msg });
}));

module.exports = router;
