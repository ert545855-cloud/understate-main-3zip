const express = require('express');
const router  = express.Router();
const db      = require('../services/dbService');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler }   = require('../middleware/asyncHandler');

const CASTLES = [
  { id:'istanbul_kalesi',  name:'İstanbul Kalesi',  defense:500 },
  { id:'anadolu_hisari',   name:'Anadolu Hisarı',   defense:350 },
  { id:'edirne_kalesi',    name:'Edirne Kalesi',     defense:400 },
  { id:'bursa_kalesi',     name:'Bursa Kalesi',      defense:300 },
  { id:'trabzon_kalesi',   name:'Trabzon Kalesi',    defense:250 },
  { id:'erzurum_kalesi',   name:'Erzurum Kalesi',    defense:280 },
];

/* GET /api/siege/castles */
router.get('/castles', authMiddleware, asyncHandler(async (req, res) => {
  // Enrich with active siege info
  const { rows: active } = await db.query(`SELECT * FROM sieges WHERE status='active'`);
  const enriched = CASTLES.map(c => ({
    ...c,
    activeSiege: active.find(s => s.castle_id === c.id) || null
  }));
  res.json({ success: true, castles: enriched });
}));

/* GET /api/siege/active */
router.get('/active', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await db.query(`
    SELECT s.*, 
      array_agg(json_build_object('user_id',sp.user_id,'side',sp.side,'power',sp.power_contributed)) as participants
    FROM sieges s LEFT JOIN siege_participants sp ON sp.siege_id=s.id
    WHERE s.status='active' GROUP BY s.id ORDER BY s.created_at DESC`
  );
  res.json({ success: true, sieges: rows });
}));

/* POST /api/siege/start */
router.post('/start', authMiddleware, asyncHandler(async (req, res) => {
  const { castleId } = req.body;
  const castle = CASTLES.find(c => c.id === castleId);
  if (!castle) return res.status(400).json({ success: false, message: 'Kale bulunamadı' });

  // Check no active siege for this castle
  const { rows: existing } = await db.query(
    `SELECT id FROM sieges WHERE castle_id=$1 AND status='active'`, [castleId]
  );
  if (existing.length) return res.status(400).json({ success: false, message: 'Bu kale zaten kuşatma altında' });

  const { rows: [user] } = await db.query(`SELECT id,username,level FROM users WHERE id=$1`, [req.user.id]);
  const endsAt = new Date(Date.now() + 30 * 60 * 1000);

  const { rows: [siege] } = await db.query(`
    INSERT INTO sieges (castle_id, castle_name, attacker_leader_id, ends_at, defender_power)
    VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [castleId, castle.name, user.id, endsAt, castle.defense]
  );

  await db.query(
    `INSERT INTO siege_participants (siege_id, user_id, side, power_contributed) VALUES ($1,$2,'attacker',$3)`,
    [siege.id, user.id, user.level * 10]
  );
  await db.query(`UPDATE sieges SET attacker_power=attacker_power+$1 WHERE id=$2`, [user.level * 10, siege.id]);

  if (global._io) global._io.emit('siege:started', { siege, by: user.username, castle: castle.name });

  res.json({ success: true, siege });
}));

/* POST /api/siege/join */
router.post('/join', authMiddleware, asyncHandler(async (req, res) => {
  const { siegeId, side } = req.body;
  if (!['attacker','defender'].includes(side)) return res.status(400).json({ success: false });

  const { rows: [user] } = await db.query(`SELECT id,username,level FROM users WHERE id=$1`, [req.user.id]);
  const { rows: [siege] } = await db.query(`SELECT * FROM sieges WHERE id=$1 AND status='active'`, [siegeId]);
  if (!siege) return res.status(404).json({ success: false, message: 'Aktif kuşatma yok' });

  const power = (user.level || 1) * 10;
  await db.query(
    `INSERT INTO siege_participants (siege_id, user_id, side, power_contributed) VALUES ($1,$2,$3,$4) ON CONFLICT (siege_id, user_id) DO NOTHING`,
    [siegeId, user.id, side, power]
  );
  const col = side === 'attacker' ? 'attacker_power' : 'defender_power';
  await db.query(`UPDATE sieges SET ${col}=${col}+$1 WHERE id=$2`, [power, siegeId]);

  const { rows: [updated] } = await db.query(`SELECT * FROM sieges WHERE id=$1`, [siegeId]);
  if (global._io) global._io.emit('siege:join', { siegeId, user: user.username, side, power, siege: updated });

  res.json({ success: true, siege: updated });
}));

/* POST /api/siege/resolve/:id */
router.post('/resolve/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { rows: [siege] } = await db.query(`SELECT * FROM sieges WHERE id=$1 AND status='active'`, [req.params.id]);
  if (!siege) return res.status(404).json({ success: false, message: 'Kuşatma bulunamadı' });
  if (new Date(siege.ends_at) > new Date()) return res.status(400).json({ success: false, message: 'Kuşatma süresi dolmadı' });

  const attackerWins = (siege.attacker_power || 0) > (siege.defender_power || 0);
  const status = attackerWins ? 'attacker_won' : 'defender_won';
  const bonusUntil = attackerWins ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;

  await db.query(
    `UPDATE sieges SET status=$1, bonus_active_until=$2 WHERE id=$3`,
    [status, bonusUntil, siege.id]
  );

  if (global._io) global._io.emit('siege:resolved', {
    siegeId: siege.id, castle: siege.castle_name, status, attackerWins,
    attackerPower: siege.attacker_power, defenderPower: siege.defender_power
  });

  res.json({ success: true, status, attackerWins, attackerPower: siege.attacker_power, defenderPower: siege.defender_power });
}));

module.exports = router;
