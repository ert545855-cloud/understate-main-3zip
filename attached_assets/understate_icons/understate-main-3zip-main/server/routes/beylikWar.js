const express = require('express');
const router  = express.Router();
const db      = require('../services/dbService');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler }   = require('../middleware/asyncHandler');

/* GET /api/beylik-war/list */
router.get('/list', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await db.query(`
    SELECT bw.*, 
      array_agg(json_build_object('user_id',bp.user_id,'side',bp.side,'power',bp.power_contributed,'beylik',bp.beylik_name)) as participants
    FROM beylik_wars bw LEFT JOIN beylik_war_participants bp ON bp.war_id=bw.id
    WHERE bw.status='active' GROUP BY bw.id ORDER BY bw.created_at DESC LIMIT 20`
  );
  res.json({ success: true, wars: rows });
}));

/* GET /api/beylik-war/history */
router.get('/history', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await db.query(`
    SELECT * FROM beylik_wars WHERE status != 'active' ORDER BY created_at DESC LIMIT 20`
  );
  res.json({ success: true, history: rows });
}));

/* POST /api/beylik-war/declare */
router.post('/declare', authMiddleware, asyncHandler(async (req, res) => {
  const { attackerBeylik, defenderBeylik, defenderLeaderId } = req.body;
  if (!attackerBeylik || !defenderBeylik) return res.status(400).json({ success: false, message: 'Beylik adları gerekli' });

  const { rows: [user] } = await db.query(`SELECT id,username,level FROM users WHERE id=$1`, [req.user.id]);
  const endsAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour window

  const { rows: [war] } = await db.query(`
    INSERT INTO beylik_wars (attacker_beylik, attacker_leader_id, defender_beylik, defender_leader_id, ends_at)
    VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [attackerBeylik, user.id, defenderBeylik, defenderLeaderId || null, endsAt]
  );

  // Auto-join attacker as participant
  await db.query(
    `INSERT INTO beylik_war_participants (war_id, user_id, beylik_name, side, power_contributed) VALUES ($1,$2,$3,'attacker',$4)`,
    [war.id, user.id, attackerBeylik, (user.level || 1) * 15]
  );
  await db.query(`UPDATE beylik_wars SET attacker_power=attacker_power+$1 WHERE id=$2`,
    [(user.level || 1) * 15, war.id]);

  if (global._io) global._io.emit('beylik_war:declared', {
    war, by: user.username, attacker: attackerBeylik, defender: defenderBeylik
  });

  res.json({ success: true, war });
}));

/* POST /api/beylik-war/join */
router.post('/join', authMiddleware, asyncHandler(async (req, res) => {
  const { warId, side, beylikName } = req.body;
  if (!['attacker','defender'].includes(side)) return res.status(400).json({ success: false });

  const { rows: [user] } = await db.query(`SELECT id,username,level FROM users WHERE id=$1`, [req.user.id]);
  const { rows: [war] }  = await db.query(`SELECT * FROM beylik_wars WHERE id=$1 AND status='active'`, [warId]);
  if (!war) return res.status(404).json({ success: false, message: 'Aktif savaş yok' });

  const power = (user.level || 1) * 15;
  await db.query(`
    INSERT INTO beylik_war_participants (war_id, user_id, beylik_name, side, power_contributed)
    VALUES ($1,$2,$3,$4,$5) ON CONFLICT (war_id, user_id) DO NOTHING`,
    [warId, user.id, beylikName, side, power]
  );
  const col = side === 'attacker' ? 'attacker_power' : 'defender_power';
  await db.query(`UPDATE beylik_wars SET ${col}=${col}+$1 WHERE id=$2`, [power, warId]);

  const { rows: [updated] } = await db.query(`SELECT * FROM beylik_wars WHERE id=$1`, [warId]);
  if (global._io) global._io.emit('beylik_war:join', { warId, user: user.username, side, power, war: updated });

  res.json({ success: true, war: updated });
}));

/* POST /api/beylik-war/resolve/:id */
router.post('/resolve/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { rows: [war] } = await db.query(
    `SELECT * FROM beylik_wars WHERE id=$1 AND status='active'`, [req.params.id]
  );
  if (!war) return res.status(404).json({ success: false });
  if (new Date(war.ends_at) > new Date()) return res.status(400).json({ success: false, message: 'Savaş süresi dolmadı' });

  const attackerWins = (war.attacker_power || 0) >= (war.defender_power || 0);
  const status = attackerWins ? 'attacker_won' : 'defender_won';
  const spoils = Math.floor(Math.random() * 5000) + 1000;

  await db.query(`UPDATE beylik_wars SET status=$1, spoils_money=$2 WHERE id=$3`, [status, spoils, war.id]);

  if (attackerWins && war.attacker_leader_id) {
    await db.query(`UPDATE users SET money=money+$1 WHERE id=$2`, [spoils, war.attacker_leader_id]);
  }

  if (global._io) global._io.emit('beylik_war:resolved', {
    warId: war.id, status, attackerWins, spoils,
    attacker: war.attacker_beylik, defender: war.defender_beylik
  });

  // Padişahlık fetih sayacını artır — galip beyliği sunucu tarafında kaydeder
  if (attackerWins && war.attacker_beylik) {
    try {
      const padisahlikRoute = require('./padisahlik');
      await padisahlikRoute.incrementFetihSayaci(war.attacker_beylik);
    } catch (_) {}
  }

  res.json({ success: true, status, attackerWins, spoils });
}));

module.exports = router;
