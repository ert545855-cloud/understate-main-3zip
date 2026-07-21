const express = require('express');
const router  = express.Router();
const { asyncHandler }   = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/authMiddleware');
const db = require('../services/dbService');

const ALL_TITLES = [
  { id:'yolcu',      label:'Yolcu',              emoji:'🚶', req:'level', val:1  },
  { id:'acemi',      label:'Acemi Sipahi',        emoji:'⚔️', req:'level', val:5  },
  { id:'esnaf',      label:'Esnaf',               emoji:'🛒', req:'level', val:10 },
  { id:'haci',       label:'Hacı',                emoji:'🕌', req:'level', val:15 },
  { id:'bey',        label:'Bey',                 emoji:'👑', req:'level', val:20 },
  { id:'sipahi',     label:'Sipahi',              emoji:'🐎', req:'level', val:25 },
  { id:'alim',       label:'Âlim',                emoji:'📜', req:'level', val:30 },
  { id:'tacir',      label:'Büyük Tâcir',         emoji:'💰', req:'money', val:100000 },
  { id:'aga',        label:'Ağa',                 emoji:'🪖', req:'level', val:35 },
  { id:'pasa',       label:'Paşa',                emoji:'🎖️', req:'level', val:50 },
  { id:'vezir',      label:'Vezir',               emoji:'⚜️', req:'level', val:70 },
  { id:'serdar',     label:'Serdar',              emoji:'🏹', req:'level', val:60 },
  { id:'kapudan',    label:'Kaptanıderya',        emoji:'⚓', req:'merits', val:500 },
  { id:'beylerbeyi', label:'Rumeli Beylerbeyisi', emoji:'🏰', req:'level', val:80 },
  { id:'sadrazam',   label:'Sadrazam',            emoji:'🌟', req:'level', val:99 },
];

router.get('/list', authMiddleware, asyncHandler(async (req, res) => {
  const u = req.user;
  const profile = (await db.query(`SELECT level,money,merit_points FROM users WHERE id=$1`, [u.id])).rows[0] || {};
  const earned = (await db.query(`SELECT title_id FROM user_titles WHERE user_id=$1`, [u.id])).rows.map(r=>r.title_id);
  // Auto-unlock based on stats
  const toUnlock = ALL_TITLES.filter(t => {
    if (earned.includes(t.id)) return false;
    if (t.req==='level')  return (profile.level||1) >= t.val;
    if (t.req==='money')  return (profile.money||0) >= t.val;
    if (t.req==='merits') return (profile.merit_points||0) >= t.val;
    return false;
  });
  for (const t of toUnlock) {
    await db.query(`INSERT INTO user_titles(user_id,title_id) VALUES($1,$2) ON CONFLICT DO NOTHING`, [u.id, t.id]).catch(()=>{});
    earned.push(t.id);
  }
  res.json({ success:true, titles: ALL_TITLES, earned, activeTitle: profile.active_title || u.active_title });
}));

router.post('/equip', authMiddleware, asyncHandler(async (req, res) => {
  const { title_id } = req.body;
  const { rows } = await db.query(`SELECT 1 FROM user_titles WHERE user_id=$1 AND title_id=$2`, [req.user.id, title_id]);
  if (!rows.length) return res.status(403).json({ success:false, message:'Bu unvan henüz kazanılmadı' });
  await db.query(`UPDATE users SET active_title=$1 WHERE id=$2`, [title_id, req.user.id]);
  res.json({ success:true });
}));

module.exports = router;
