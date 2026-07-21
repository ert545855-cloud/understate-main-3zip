const express = require('express');
const router  = express.Router();
const db      = require('../services/dbService');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler }   = require('../middleware/asyncHandler');

/* GET /api/assassination/list */
router.get('/list', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await db.query(`
    SELECT a.*, u.username as target_current_name
    FROM assassination_contracts a
    JOIN users u ON u.id=a.target_id
    WHERE a.status='active' AND a.expires_at > NOW()
    ORDER BY a.reward DESC LIMIT 30`
  );
  res.json({ success: true, contracts: rows });
}));

/* POST /api/assassination/post */
router.post('/post', authMiddleware, asyncHandler(async (req, res) => {
  const { targetId, reward } = req.body;
  const amt = parseInt(reward) || 0;
  if (!targetId || targetId === req.user.id || amt < 100) return res.status(400).json({ success: false, message: 'Geçersiz istek' });

  const [{ rows: [user] }, { rows: [target] }] = await Promise.all([
    db.query(`SELECT id,username,money FROM users WHERE id=$1`, [req.user.id]),
    db.query(`SELECT id,username FROM users WHERE id=$1`, [targetId])
  ]);
  if (!target) return res.status(404).json({ success: false, message: 'Hedef bulunamadı' });
  if ((user.money || 0) < amt) return res.status(400).json({ success: false, message: 'Yetersiz para' });

  await db.query(`UPDATE users SET money=money-$1 WHERE id=$2`, [amt, user.id]);
  const { rows: [contract] } = await db.query(`
    INSERT INTO assassination_contracts (poster_id,poster_name,target_id,target_name,reward)
    VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [user.id, user.username, target.id, target.username, amt]
  );

  if (global._io) {
    global._io.to(`user_${target.id}`).emit('assassination:target', {
      message: `⚠️ Başına ${amt} 🪙 ödül kondu! 24 saat dikkatli ol.`,
      reward: amt, by: user.username
    });
    global._io.emit('assassination:new', { contract });
  }

  res.json({ success: true, contract });
}));

/* POST /api/assassination/claim */
router.post('/claim', authMiddleware, asyncHandler(async (req, res) => {
  const { contractId } = req.body;
  const { rows: [contract] } = await db.query(`
    SELECT * FROM assassination_contracts WHERE id=$1 AND status='active' AND expires_at > NOW()`, [contractId]
  );
  if (!contract) return res.status(404).json({ success: false, message: 'Kontrat bulunamadı veya süresi doldu' });
  if (String(contract.poster_id) === String(req.user.id) || String(contract.target_id) === String(req.user.id))
    return res.status(403).json({ success: false, message: 'Bu kontratta tarafsın' });

  const [{ rows: [killer] }, { rows: [target] }] = await Promise.all([
    db.query(`SELECT id,username,level FROM users WHERE id=$1`, [req.user.id]),
    db.query(`SELECT id,username,level,money FROM users WHERE id=$1`, [contract.target_id])
  ]);

  const killerPow = (killer.level || 1) * 10 + Math.floor(Math.random() * 20);
  const targetPow = (target.level || 1) * 10 + Math.floor(Math.random() * 20);
  const killerWins = killerPow >= targetPow;

  if (!killerWins) {
    await db.query(`INSERT INTO war_logs (attacker_id,defender_id,attacker_name,defender_name,attacker_power,defender_power,winner_id,fight_type)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'suikast')`,
      [killer.id, target.id, killer.username, target.username, killerPow, targetPow, target.id]
    );
    return res.json({ success: false, message: `💪 ${target.username} direndi! Suikast başarısız.`, killerPow, targetPow });
  }

  await db.query(`UPDATE assassination_contracts SET status='completed', killer_id=$1 WHERE id=$2`, [killer.id, contract.id]);
  await db.query(`UPDATE users SET money=money+$1 WHERE id=$2`, [contract.reward, killer.id]);
  await db.query(`INSERT INTO war_logs (attacker_id,defender_id,attacker_name,defender_name,attacker_power,defender_power,winner_id,loot_money,fight_type)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'suikast')`,
    [killer.id, target.id, killer.username, target.username, killerPow, targetPow, killer.id, contract.reward]
  );

  if (global._io) global._io.emit('assassination:completed', {
    killer: killer.username, target: target.username, reward: contract.reward
  });

  res.json({ success: true, reward: contract.reward, killerPow, targetPow, message: `✅ Suikast başarılı! ${contract.reward} 🪙 kazandın.` });
}));

module.exports = router;
