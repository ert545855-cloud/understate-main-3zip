const express = require('express');
const router  = express.Router();
const db      = require('../services/dbService');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler }   = require('../middleware/asyncHandler');

/* GET /api/region/list */
router.get('/list', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await db.query(`SELECT * FROM region_control ORDER BY captured_at DESC`);
  res.json({ success: true, regions: rows });
}));

/* POST /api/region/attack */
router.post('/attack', authMiddleware, asyncHandler(async (req, res) => {
  const { regionId } = req.body;
  if (!regionId) return res.status(400).json({ success: false, message: 'Bölge gerekli' });
  const { rows: [user] } = await db.query(`SELECT id, username, level, game_data FROM users WHERE id=$1`, [req.user.id]);
  const power = (user.level || 1) * 5 + Math.floor(Math.random() * 10);

  await db.query(
    `INSERT INTO region_attacks (region_id, attacker_id, attacker_name, power) VALUES ($1,$2,$3,$4)`,
    [regionId, user.id, user.username, power]
  );

  // Determine this week's leader
  const { rows: topAttackers } = await db.query(`
    SELECT attacker_id, attacker_name, COUNT(*) as cnt
    FROM region_attacks
    WHERE region_id=$1 AND attacked_at >= date_trunc('week', NOW())
    GROUP BY attacker_id, attacker_name
    ORDER BY cnt DESC LIMIT 1`, [regionId]
  );

  if (topAttackers[0]) {
    const top = topAttackers[0];
    await db.query(`
      INSERT INTO region_control (region_id, controller_id, controller_name, attack_count, captured_at)
      VALUES ($1,$2,$3,$4,NOW())
      ON CONFLICT (region_id) DO UPDATE SET
        controller_id=$2, controller_name=$3, attack_count=$4, captured_at=NOW()`,
      [regionId, top.attacker_id, top.attacker_name, parseInt(top.cnt)]
    );
  }

  const { rows: [ctrl] } = await db.query(`SELECT * FROM region_control WHERE region_id=$1`, [regionId]);
  if (global._io) global._io.emit('region:update', { regionId, control: ctrl });

  res.json({ success: true, power, control: ctrl });
}));

/* POST /api/region/collect-tax */
router.post('/collect-tax', authMiddleware, asyncHandler(async (req, res) => {
  const { rows: myRegions } = await db.query(
    `SELECT * FROM region_control WHERE controller_id=$1 AND last_tax_paid < NOW() - INTERVAL '24 hours'`,
    [req.user.id]
  );
  if (!myRegions.length) return res.json({ success: true, collected: 0, message: 'Vergi zamanı gelmedi' });

  let total = 0;
  for (const r of myRegions) {
    total += r.daily_income || 200;
    await db.query(`UPDATE region_control SET last_tax_paid=NOW() WHERE region_id=$1`, [r.region_id]);
    await db.query(`INSERT INTO province_income_log (vali_id, region_id, amount) VALUES ($1,$2,$3)`,
      [req.user.id, r.region_id, r.daily_income || 200]);
  }
  await db.query(`UPDATE users SET money=money+$1 WHERE id=$2`, [total, req.user.id]);
  res.json({ success: true, collected: total, regionCount: myRegions.length });
}));

module.exports = router;
