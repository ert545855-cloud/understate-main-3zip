const express = require('express');
const router  = express.Router();
const db      = require('../services/dbService');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler }   = require('../middleware/asyncHandler');

function getWeekStart() {
  const d = new Date(); d.setHours(0,0,0,0);
  d.setDate(d.getDate() - d.getDay() + 1); // Monday
  return d.toISOString().split('T')[0];
}

/* GET /api/tournament/current */
router.get('/current', authMiddleware, asyncHandler(async (req, res) => {
  const ws = getWeekStart();
  let { rows: [t] } = await db.query(`SELECT * FROM tournaments WHERE week_start=$1`, [ws]);
  if (!t) {
    const { rows: [created] } = await db.query(
      `INSERT INTO tournaments (week_start, status) VALUES ($1,'active') ON CONFLICT (week_start) DO UPDATE SET status=tournaments.status RETURNING *`, [ws]
    );
    t = created;
  }
  const { rows: entries } = await db.query(
    `SELECT * FROM tournament_entries WHERE tournament_id=$1 ORDER BY score DESC`, [t.id]
  );
  res.json({ success: true, tournament: t, entries });
}));

/* POST /api/tournament/register */
router.post('/register', authMiddleware, asyncHandler(async (req, res) => {
  const { guildId, guildName } = req.body;
  if (!guildId || !guildName) return res.status(400).json({ success: false });
  const ws = getWeekStart();
  let { rows: [t] } = await db.query(`SELECT * FROM tournaments WHERE week_start=$1`, [ws]);
  if (!t) {
    const { rows: [c] } = await db.query(
      `INSERT INTO tournaments (week_start) VALUES ($1) ON CONFLICT (week_start) DO UPDATE SET week_start=EXCLUDED.week_start RETURNING *`, [ws]
    );
    t = c;
  }
  const { rows: existing } = await db.query(
    `SELECT id FROM tournament_entries WHERE tournament_id=$1 AND guild_id=$2`, [t.id, guildId]
  );
  if (existing.length) return res.json({ success: true, message: 'Zaten kayıtlı' });
  await db.query(
    `INSERT INTO tournament_entries (tournament_id, guild_id, guild_name) VALUES ($1,$2,$3)`,
    [t.id, guildId, guildName]
  );
  if (global._io) global._io.emit('tournament:register', { guildName, weekStart: ws });
  res.json({ success: true });
}));

/* POST /api/tournament/score - add score to guild (called from war resolution) */
router.post('/score', authMiddleware, asyncHandler(async (req, res) => {
  const { guildId, points } = req.body;
  const ws = getWeekStart();
  const { rows: [t] } = await db.query(`SELECT id FROM tournaments WHERE week_start=$1`, [ws]);
  if (!t) return res.status(404).json({ success: false });
  await db.query(
    `UPDATE tournament_entries SET score=score+$1, wins=wins+1 WHERE tournament_id=$2 AND guild_id=$3`,
    [parseInt(points) || 10, t.id, guildId]
  );
  res.json({ success: true });
}));

/* GET /api/tournament/leaderboard */
router.get('/leaderboard', authMiddleware, asyncHandler(async (req, res) => {
  const ws = getWeekStart();
  const { rows: [t] } = await db.query(`SELECT id FROM tournaments WHERE week_start=$1`, [ws]);
  if (!t) return res.json({ success: true, entries: [] });
  const { rows } = await db.query(
    `SELECT * FROM tournament_entries WHERE tournament_id=$1 ORDER BY score DESC LIMIT 8`, [t.id]
  );
  res.json({ success: true, entries: rows, weekStart: ws });
}));

module.exports = router;
