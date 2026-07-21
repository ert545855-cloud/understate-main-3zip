const express = require('express');
const router  = express.Router();
const db      = require('../services/dbService');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler }   = require('../middleware/asyncHandler');

/* GET /api/duel/list */
router.get('/list', authMiddleware, asyncHandler(async (req, res) => {
  const { rows: open } = await db.query(`
    SELECT d.*, u1.username as challenger_name, u2.username as challenged_name
    FROM duels d
    JOIN users u1 ON u1.id=d.challenger_id
    JOIN users u2 ON u2.id=d.challenged_id
    WHERE d.status='pending' AND d.expires_at > NOW() ORDER BY d.created_at DESC LIMIT 20`
  );
  const { rows: mine } = await db.query(`
    SELECT d.*, u1.username as challenger_name, u2.username as challenged_name
    FROM duels d
    JOIN users u1 ON u1.id=d.challenger_id
    JOIN users u2 ON u2.id=d.challenged_id
    WHERE (d.challenger_id=$1 OR d.challenged_id=$1) ORDER BY d.created_at DESC LIMIT 10`,
    [req.user.id]
  );
  res.json({ success: true, open, mine });
}));

/* POST /api/duel/challenge */
router.post('/challenge', authMiddleware, asyncHandler(async (req, res) => {
  const { targetId, betAmount } = req.body;
  const bet = parseInt(betAmount) || 0;
  if (!targetId || targetId === req.user.id) return res.status(400).json({ success: false, message: 'Geçersiz rakip' });

  const { rows: [user] } = await db.query(`SELECT id,username,money,level FROM users WHERE id=$1`, [req.user.id]);
  if (bet > 0 && (user.money || 0) < bet) return res.status(400).json({ success: false, message: 'Yetersiz para' });

  if (bet > 0) await db.query(`UPDATE users SET money=money-$1 WHERE id=$2`, [bet, user.id]);

  const { rows: [duel] } = await db.query(`
    INSERT INTO duels (challenger_id, challenged_id, bet_amount, challenger_power)
    VALUES ($1,$2,$3,$4) RETURNING *`,
    [user.id, targetId, bet, (user.level || 1) * 10 + Math.floor(Math.random() * 20)]
  );

  if (global._io) global._io.to(`user_${targetId}`).emit('duel:challenge', {
    duelId: duel.id, from: user.username, bet
  });

  res.json({ success: true, duel });
}));

/* POST /api/duel/respond */
router.post('/respond', authMiddleware, asyncHandler(async (req, res) => {
  const { duelId, accept } = req.body;
  const { rows: [duel] } = await db.query(
    `SELECT d.*, u1.username as ch_name, u2.username as cd_name, u1.level as ch_level, u2.level as cd_level
     FROM duels d JOIN users u1 ON u1.id=d.challenger_id JOIN users u2 ON u2.id=d.challenged_id
     WHERE d.id=$1 AND d.challenged_id=$2 AND d.status='pending'`,
    [duelId, req.user.id]
  );
  if (!duel) return res.status(404).json({ success: false, message: 'Düello bulunamadı' });

  if (!accept) {
    await db.query(`UPDATE duels SET status='declined' WHERE id=$1`, [duelId]);
    if (duel.bet_amount > 0) await db.query(`UPDATE users SET money=money+$1 WHERE id=$2`, [duel.bet_amount, duel.challenger_id]);
    return res.json({ success: true, status: 'declined' });
  }

  const { rows: [challenged] } = await db.query(`SELECT money, level FROM users WHERE id=$1`, [req.user.id]);
  if (duel.bet_amount > 0 && (challenged.money || 0) < duel.bet_amount)
    return res.status(400).json({ success: false, message: 'Yetersiz para' });
  if (duel.bet_amount > 0) await db.query(`UPDATE users SET money=money-$1 WHERE id=$2`, [duel.bet_amount, req.user.id]);

  const chPow = duel.challenger_power || (duel.ch_level * 10) + Math.floor(Math.random() * 20);
  const cdPow = (challenged.level || 1) * 10 + Math.floor(Math.random() * 20);
  const challengerWins = chPow >= cdPow;
  const winnerId   = challengerWins ? duel.challenger_id : duel.challenged_id;
  const prize = duel.bet_amount * 2;

  await db.query(`UPDATE duels SET status='completed', challenged_power=$1, winner_id=$2 WHERE id=$3`,
    [cdPow, winnerId, duelId]);
  if (prize > 0) await db.query(`UPDATE users SET money=money+$1 WHERE id=$2`, [prize, winnerId]);

  // war log
  await db.query(`INSERT INTO war_logs (attacker_id,defender_id,attacker_name,defender_name,attacker_power,defender_power,winner_id,loot_money,fight_type)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'duel')`,
    [duel.challenger_id, duel.challenged_id, duel.ch_name, duel.cd_name, chPow, cdPow, winnerId, duel.bet_amount]
  );

  const result = { success:true, status:'completed', challengerWins, challengerPower:chPow, challengedPower:cdPow, prize, winner: challengerWins ? duel.ch_name : duel.cd_name };
  if (global._io) global._io.emit('duel:result', result);
  res.json(result);
}));

module.exports = router;
