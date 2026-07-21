// ═══════════════════════════════════════════════════════════════
// Zanaat Sistemi — /api/zanaat
// Çırak → Kalfa → Usta → Üstad kademesi, üretim hızı bonusu
// ═══════════════════════════════════════════════════════════════
const express = require('express');
const router  = express.Router();
const { asyncHandler }   = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/authMiddleware');
const db = require('../services/dbService');

const CRAFT_TIERS = [
  { level: 1, title: 'Çırak',  emoji: '🔨', xpNeeded:    0, speedBonus: 1.0,  incomeBonus: 0,    craftSlots: 1 },
  { level: 2, title: 'Kalfa',  emoji: '⚒️',  xpNeeded:  200, speedBonus: 1.15, incomeBonus: 0.05, craftSlots: 2 },
  { level: 3, title: 'Usta',   emoji: '🛠️',  xpNeeded:  600, speedBonus: 1.35, incomeBonus: 0.12, craftSlots: 3 },
  { level: 4, title: 'Üstad',  emoji: '⚜️',  xpNeeded: 1500, speedBonus: 1.60, incomeBonus: 0.22, craftSlots: 4 },
];

const RECIPES = [
  { id:'kumaş',     label:'Kumaş',        emoji:'🧵', maliyet:200,  sure:60,   reward_sikke:350,  reward_xp:20,  tier:1 },
  { id:'deri',      label:'Deri İşleme',  emoji:'🥋', maliyet:350,  sure:120,  reward_sikke:600,  reward_xp:35,  tier:1 },
  { id:'seramik',   label:'Seramik',      emoji:'🏺', maliyet:500,  sure:180,  reward_sikke:900,  reward_xp:50,  tier:2 },
  { id:'kılıç',     label:'Kılıç',        emoji:'⚔️', maliyet:1200, sure:300,  reward_sikke:2200, reward_xp:120, tier:2 },
  { id:'zırh',      label:'Zırh Plakası', emoji:'🛡️', maliyet:2000, sure:480,  reward_sikke:3800, reward_xp:200, tier:3 },
  { id:'top',       label:'Top Namlusu',  emoji:'💣', maliyet:5000, sure:900,  reward_sikke:9000, reward_xp:500, tier:3 },
  { id:'altin_tas', label:'Altın Taşı',   emoji:'💎', maliyet:8000, sure:1800, reward_sikke:18000,reward_xp:800, tier:4 },
];

// GET /api/zanaat/profile — kullanıcı zanaat profili
router.get('/profile', authMiddleware, asyncHandler(async (req, res) => {
  let { rows } = await db.query(`SELECT * FROM zanaat_levels WHERE user_id=$1`, [req.user.id]);
  if (!rows.length) {
    await db.query(`INSERT INTO zanaat_levels(user_id) VALUES($1) ON CONFLICT(user_id) DO NOTHING`, [req.user.id]);
    rows = [{ user_id: req.user.id, craft_type:'genel', level:1, xp:0, total_crafted:0 }];
  }
  const z = rows[0];
  const tier = CRAFT_TIERS[Math.min(z.level - 1, 3)];
  const nextTier = CRAFT_TIERS[Math.min(z.level, 3)];
  res.json({ success: true, zanaat: z, tier, nextTier, recipes: RECIPES, tiers: CRAFT_TIERS });
}));

// POST /api/zanaat/craft — ürün yap
router.post('/craft', authMiddleware, asyncHandler(async (req, res) => {
  const { recipe_id } = req.body;
  const recipe = RECIPES.find(r => r.id === recipe_id);
  if (!recipe) return res.status(400).json({ success: false, message: 'Geçersiz tarif' });

  // Zanaat profili
  let { rows: zRows } = await db.query(`SELECT * FROM zanaat_levels WHERE user_id=$1`, [req.user.id]);
  if (!zRows.length) {
    await db.query(`INSERT INTO zanaat_levels(user_id) VALUES($1) ON CONFLICT DO NOTHING`, [req.user.id]);
    zRows = [{ level: 1, xp: 0, total_crafted: 0 }];
  }
  const z = zRows[0];

  if (z.level < recipe.tier) {
    return res.status(400).json({ success: false, message: `Bu tarif için en az ${CRAFT_TIERS[recipe.tier-1].title} seviyesi gerekli` });
  }

  // Sikke kontrolü
  const { rows: user } = await db.query(`SELECT money FROM users WHERE id=$1`, [req.user.id]);
  if ((user[0]?.money || 0) < recipe.maliyet) {
    return res.status(400).json({ success: false, message: `Yetersiz Sikke — ${recipe.maliyet.toLocaleString('tr-TR')} gerekli` });
  }

  // Tier hızı bonusu
  const tier = CRAFT_TIERS[Math.min(z.level - 1, 3)];
  const adjustedTime = Math.floor(recipe.sure / tier.speedBonus);
  const reward_sikke = Math.floor(recipe.reward_sikke * (1 + tier.incomeBonus));
  const reward_xp    = recipe.reward_xp;

  // Ödeme ve ödül ver (anlık — gerçek üretim timeri frontend'de)
  await db.query(
    `UPDATE users SET money=money-$1+$2, xp=xp+$3 WHERE id=$4`,
    [recipe.maliyet, reward_sikke, reward_xp, req.user.id]
  );

  // Zanaat XP & Seviye güncelle
  let newXp    = (z.xp || 0) + reward_xp;
  let newLevel = z.level;
  while (newLevel < 4 && newXp >= CRAFT_TIERS[newLevel].xpNeeded) { newLevel++; }

  await db.query(
    `UPDATE zanaat_levels SET xp=$1, level=$2, total_crafted=total_crafted+1, last_crafted_at=NOW(), updated_at=NOW() WHERE user_id=$3`,
    [newXp, newLevel, req.user.id]
  );

  const leveledUp = newLevel > z.level;

  // Sezon puanı
  try { await addSezonPuan(req.user.id, 10); } catch(_) {}

  res.json({
    success: true,
    reward_sikke, reward_xp,
    adjusted_time: adjustedTime,
    new_level: newLevel,
    new_xp: newXp,
    leveled_up: leveledUp,
    level_title: CRAFT_TIERS[newLevel - 1]?.title,
  });
}));

async function addSezonPuan(userId, points) {
  try {
    await db.query(`UPDATE users SET season_score = COALESCE(season_score,0) + $1 WHERE id=$2`, [points, userId]);
    const { rows } = await db.query(`SELECT id FROM seasons WHERE status='active' ORDER BY id DESC LIMIT 1`);
    if (rows[0]) {
      await db.query(
        `INSERT INTO season_rankings(season_id,user_id,score) VALUES($1,$2,$3)
         ON CONFLICT(season_id,user_id) DO UPDATE SET score=season_rankings.score+$3, updated_at=NOW()`,
        [rows[0].id, userId, points]
      );
    }
  } catch(_) {}
}

module.exports = router;
