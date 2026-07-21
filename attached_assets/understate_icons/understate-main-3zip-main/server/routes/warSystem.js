const express = require('express');
const router  = express.Router();
const db      = require('../services/dbService');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler }   = require('../middleware/asyncHandler');

/* ── ELO helpers ─────────────────────────────────────── */
function calcElo(winnerElo, loserElo, K = 32) {
  const exp = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const delta = Math.round(K * (1 - exp));
  return delta;
}
function toLeague(elo) {
  if (elo < 800)  return 'bronz';
  if (elo < 1000) return 'gümüş';
  if (elo < 1200) return 'altın';
  if (elo < 1500) return 'vezir';
  return 'sultanî';
}

/* ── Daily challenge templates ───────────────────────── */
const DAILY_TEMPLATES = [
  { id:'win2',    desc:'Bugün 2 savaş kazan',       type:'win',    target:2, reward_money:500,  reward_xp:0   },
  { id:'atk5',    desc:'5 oyuncuya saldır',          type:'attack', target:5, reward_money:0,    reward_xp:200 },
  { id:'streak3', desc:'3 galibiyet serisi yap',     type:'streak', target:3, reward_money:300,  reward_xp:100 },
];

/* GET /api/war/log */
router.get('/log', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM war_logs WHERE attacker_id=$1 OR defender_id=$1 ORDER BY created_at DESC LIMIT 50`,
    [req.user.id]
  );
  res.json({ success: true, logs: rows });
}));

/* GET /api/war/elo */
router.get('/elo', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT username, war_elo, war_league, win_streak, max_streak, season_score FROM users WHERE id=$1`,
    [req.user.id]
  );
  res.json({ success: true, elo: rows[0] });
}));

/* GET /api/war/leaderboard */
router.get('/leaderboard', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, username, war_elo, war_league, win_streak, level FROM users ORDER BY war_elo DESC LIMIT 20`
  );
  res.json({ success: true, leaderboard: rows });
}));

/* GET /api/war/weekly-top */
router.get('/weekly-top', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await db.query(`
    SELECT w.user_id, u.username, w.battles_won, w.battles_fought
    FROM weekly_war_stats w JOIN users u ON u.id=w.user_id
    WHERE w.week_start = date_trunc('week', NOW())::date
    ORDER BY w.battles_won DESC LIMIT 3
  `);
  res.json({ success: true, top: rows });
}));

/* POST /api/war/attack */
router.post('/attack', authMiddleware, asyncHandler(async (req, res) => {
  const { targetId } = req.body;
  if (!targetId || targetId === req.user.id) return res.status(400).json({ success: false, message: 'Geçersiz hedef' });

  // Genel Sefer kontrolü — aktifse cooldown/koruma kalkanları devre dışı
  let genelSeferAktif = false;
  try {
    const { rows: gsRows } = await db.query(
      `SELECT id FROM padisahlik_donemleri WHERE durum='genel_sefer' LIMIT 1`
    );
    genelSeferAktif = gsRows.length > 0;
  } catch (_) {}

  const [atkR, defR] = await Promise.all([
    db.query(`SELECT id,username,level,war_elo,win_streak,max_streak,money,fame_score,season_score,revenge_on,revenge_until FROM users WHERE id=$1`, [req.user.id]),
    db.query(`SELECT id,username,level,war_elo,win_streak,max_streak,money,fame_score,season_score FROM users WHERE id=$1`, [targetId])
  ]);
  if (!atkR.rows[0] || !defR.rows[0]) return res.status(404).json({ success: false, message: 'Oyuncu bulunamadı' });
  const atk = atkR.rows[0], def = defR.rows[0];

  const isRevenge = String(atk.revenge_on) === String(targetId) && atk.revenge_until && new Date(atk.revenge_until) > new Date();

  let atkPow = (atk.level * 10) + Math.floor(Math.random() * 20);
  let defPow = (def.level * 10) + Math.floor(Math.random() * 20);
  if (isRevenge) atkPow = Math.round(atkPow * 1.25);
  atkPow += Math.min((atk.win_streak || 0) * 5, 50);

  const atkWins = atkPow >= defPow;
  const [winner, loser] = atkWins ? [atk, def] : [def, atk];
  const lootMoney = atkWins ? Math.max(0, Math.floor((def.money || 0) * 0.05)) : 0;

  const eloDelta = calcElo(atk.war_elo || 1000, def.war_elo || 1000);
  const atkEloDelta = atkWins ? eloDelta : -eloDelta;
  const defEloDelta = atkWins ? -eloDelta : eloDelta;

  const newAtkElo    = Math.max(0, (atk.war_elo || 1000) + atkEloDelta);
  const newDefElo    = Math.max(0, (def.war_elo || 1000) + defEloDelta);
  const newAtkStreak = atkWins ? (atk.win_streak || 0) + 1 : 0;
  const newAtkMaxStr = Math.max(atk.max_streak || 0, newAtkStreak);

  await Promise.all([
    db.query(`UPDATE users SET
      money = GREATEST(0, money + $2),
      war_elo = $3, war_league = $4,
      win_streak = $5, max_streak = $6,
      fame_score = GREATEST(0, fame_score + $7),
      season_score = season_score + $8,
      revenge_on = NULL, revenge_until = NULL
      WHERE id=$1`,
      [atk.id, lootMoney, newAtkElo, toLeague(newAtkElo), newAtkStreak, newAtkMaxStr,
       atkWins ? 10 : -5, Math.abs(atkEloDelta)]
    ),
    db.query(`UPDATE users SET
      money = GREATEST(0, money - $2),
      war_elo = $3, war_league = $4,
      win_streak = $5,
      fame_score = GREATEST(0, fame_score + $6),
      revenge_on = $7, revenge_until = NOW() + INTERVAL '48 hours'
      WHERE id=$1`,
      [def.id, lootMoney, newDefElo, toLeague(newDefElo),
       atkWins ? 0 : (def.win_streak || 0) + 1,
       atkWins ? -5 : 10,
       atkWins ? atk.id : null]
    ),
  ]);

  const { rows: [logRow] } = await db.query(`
    INSERT INTO war_logs (attacker_id,defender_id,attacker_name,defender_name,attacker_power,defender_power,winner_id,loot_money,is_revenge,fight_type,elo_delta)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pvp',$10) RETURNING id`,
    [atk.id, def.id, atk.username, def.username, atkPow, defPow, winner.id, lootMoney, isRevenge, Math.abs(atkEloDelta)]
  );

  // daily challenge progress
  const week = new Date(); week.setHours(0,0,0,0); week.setDate(week.getDate() - week.getDay());
  await Promise.all([
    db.query(`
      INSERT INTO daily_war_challenges (user_id, challenge_date, challenges, progress)
      VALUES ($1, CURRENT_DATE, $2::jsonb, $3::jsonb)
      ON CONFLICT (user_id) DO UPDATE SET
        challenge_date = EXCLUDED.challenge_date,
        challenges = CASE WHEN daily_war_challenges.challenge_date < CURRENT_DATE THEN EXCLUDED.challenges ELSE daily_war_challenges.challenges END,
        progress = CASE WHEN daily_war_challenges.challenge_date < CURRENT_DATE THEN EXCLUDED.progress
          ELSE jsonb_set(jsonb_set(daily_war_challenges.progress,
            '{attack}', to_jsonb(COALESCE((daily_war_challenges.progress->>'attack')::int,0)+1)),
            '{win}', CASE WHEN $4 THEN to_jsonb(COALESCE((daily_war_challenges.progress->>'win')::int,0)+1) ELSE daily_war_challenges.progress->'win' END)
          END,
        updated_at = NOW()`,
      [atk.id, JSON.stringify(DAILY_TEMPLATES), JSON.stringify({attack:1, win: atkWins?1:0}), atkWins]
    ),
    db.query(`
      INSERT INTO weekly_war_stats (user_id, week_start, battles_fought, battles_won)
      VALUES ($1, $2, 1, $3)
      ON CONFLICT (user_id, week_start) DO UPDATE SET
        battles_fought = weekly_war_stats.battles_fought + 1,
        battles_won    = weekly_war_stats.battles_won + $3`,
      [atk.id, week.toISOString().split('T')[0], atkWins ? 1 : 0]
    )
  ]);

  // Genel Sefer'de ganimet %50 artar (cooldown'suz saldırı bonusu)
  const genelSeferLoot = genelSeferAktif ? Math.floor(lootMoney * 0.5) : 0;
  if (genelSeferAktif && genelSeferLoot > 0 && atkWins) {
    await db.query(`UPDATE users SET money=money+$1 WHERE id=$2`, [genelSeferLoot, atk.id]);
  }

  const result = { success:true, attackerWins:atkWins, attackerPower:atkPow, defenderPower:defPow,
    lootMoney: lootMoney + genelSeferLoot, eloChange:atkEloDelta, newElo:newAtkElo,
    newLeague:toLeague(newAtkElo), newStreak:newAtkStreak, isRevenge, logId:logRow?.id,
    attacker:atk.username, defender:def.username,
    genelSefer: genelSeferAktif };

  if (global._io) global._io.emit('war:result', result);
  if (global._io) global._io.to(`user_${def.id}`).emit('war:attacked', { by: atk.username, lostMoney: lootMoney });

  res.json(result);
}));

/* GET /api/war/daily-challenge */
router.get('/daily-challenge', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM daily_war_challenges WHERE user_id=$1`, [req.user.id]
  );
  let rec = rows[0];
  if (!rec || rec.challenge_date < new Date().toISOString().split('T')[0]) {
    await db.query(`
      INSERT INTO daily_war_challenges (user_id, challenge_date, challenges, progress)
      VALUES ($1, CURRENT_DATE, $2::jsonb, '{}')
      ON CONFLICT (user_id) DO UPDATE SET challenge_date=CURRENT_DATE, challenges=$2::jsonb, progress='{}', updated_at=NOW()`,
      [req.user.id, JSON.stringify(DAILY_TEMPLATES)]
    );
    rec = { challenges: DAILY_TEMPLATES, progress: {} };
  }
  res.json({ success: true, challenges: rec.challenges || DAILY_TEMPLATES, progress: rec.progress || {} });
}));

/* POST /api/war/claim-challenge */
router.post('/claim-challenge', authMiddleware, asyncHandler(async (req, res) => {
  const { challengeId } = req.body;
  const tpl = DAILY_TEMPLATES.find(t => t.id === challengeId);
  if (!tpl) return res.status(400).json({ success: false, message: 'Geçersiz görev' });
  const { rows } = await db.query(`SELECT progress FROM daily_war_challenges WHERE user_id=$1`, [req.user.id]);
  if (!rows[0]) return res.status(400).json({ success: false });
  const prog = rows[0].progress || {};
  const current = parseInt(prog[tpl.type] || 0);
  if (current < tpl.target) return res.status(400).json({ success: false, message: 'Henüz tamamlanmadı' });
  // Mark claimed
  await db.query(`UPDATE daily_war_challenges SET progress=progress || $2::jsonb WHERE user_id=$1`,
    [req.user.id, JSON.stringify({ [`${challengeId}_claimed`]: true })]);
  const updates = [];
  if (tpl.reward_money) { updates.push(db.query(`UPDATE users SET money=money+$1 WHERE id=$2`, [tpl.reward_money, req.user.id])); }
  if (tpl.reward_xp)    { updates.push(db.query(`UPDATE users SET xp=xp+$1 WHERE id=$2`, [tpl.reward_xp, req.user.id])); }
  await Promise.all(updates);
  res.json({ success: true, reward_money: tpl.reward_money, reward_xp: tpl.reward_xp });
}));

/* ── POST /api/war/repair — hasar görmüş bina/eyaleti sikke karşılığı onar ── */
router.post('/repair', authMiddleware, asyncHandler(async (req, res) => {
  if (!db.isReady()) return res.status(503).json({ success: false, error: 'Veritabanı hazır değil' });

  const { binaId } = req.body;
  if (!binaId) return res.status(400).json({ success: false, error: 'binaId gerekli' });

  // Hasar kaydını bul
  const { rows: binaRows } = await db.query(
    `SELECT * FROM bina_hasar WHERE id=$1 AND onarildi_mi=FALSE`, [binaId]
  );
  if (!binaRows.length) return res.status(404).json({ success: false, error: 'Hasar kaydı bulunamadı veya zaten onarıldı' });

  const bina = binaRows[0];

  // Onarım maliyeti: hasar miktarının 10 katı Sikke
  const maliyet = bina.hasar_miktari * 10;

  // Kullanıcı bakiye kontrolü
  const { rows: userRows } = await db.query(
    `SELECT money FROM users WHERE id=$1 FOR UPDATE`, [req.user.id]
  );
  const u = userRows[0];
  if (!u) return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
  if ((u.money || 0) < maliyet) {
    return res.status(400).json({ success: false, error: `Onarım için ${maliyet.toLocaleString('tr-TR')} 🪙 gerekli` });
  }

  await db.query(`UPDATE users SET money=money-$1 WHERE id=$2`, [maliyet, req.user.id]);
  await db.query(`UPDATE bina_hasar SET onarildi_mi=TRUE WHERE id=$1`, [binaId]);

  if (global._io) {
    global._io.to(`user_${req.user.id}`).emit('war:repair_done', { binaId, binaAdi: bina.bina_adi });
  }

  res.json({ success: true, message: `${bina.bina_adi} onarıldı`, harcanan: maliyet });
}));

/* ── GET /api/war/hasar-listesi — benim beyliğimin hasarları ─────────────── */
router.get('/hasar-listesi', authMiddleware, asyncHandler(async (req, res) => {
  if (!db.isReady()) return res.json({ success: true, hasarlar: [] });
  const { beylikId } = req.query;
  const hedef = beylikId || req.user.id;
  const { rows } = await db.query(
    `SELECT * FROM bina_hasar WHERE beylik_id=$1 AND onarildi_mi=FALSE ORDER BY created_at DESC`,
    [hedef]
  ).catch(() => ({ rows: [] }));
  res.json({ success: true, hasarlar: rows });
}));

module.exports = router;
