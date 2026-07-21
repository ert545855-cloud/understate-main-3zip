// ═══════════════════════════════════════════════════════════════
// Fal Çarkı — /api/fal-carki — Günde 1 kez bedava çevirme
// ═══════════════════════════════════════════════════════════════
const express = require('express');
const router  = express.Router();
const { asyncHandler }   = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/authMiddleware');
const db = require('../services/dbService');

const DILIMLER = [
  { id:'kucuk_sikke',  emoji:'🪙',  label:'200 Sikke',      type:'money',  amount:200,   weight:30 },
  { id:'orta_sikke',   emoji:'🪙🪙', label:'750 Sikke',      type:'money',  amount:750,   weight:18 },
  { id:'buyuk_sikke',  emoji:'💰',  label:'2000 Sikke',     type:'money',  amount:2000,  weight:8  },
  { id:'xp_kucuk',     emoji:'⭐',  label:'50 XP',          type:'xp',     amount:50,    weight:25 },
  { id:'xp_buyuk',     emoji:'🌟',  label:'200 XP',         type:'xp',     amount:200,   weight:10 },
  { id:'altin_kucuk',  emoji:'⚜️',  label:'5 Altın',        type:'altin',  amount:5,     weight:12 },
  { id:'altin_orta',   emoji:'⚜️⚜️', label:'20 Altın',      type:'altin',  amount:20,    weight:4  },
  { id:'merits',       emoji:'💎',  label:'10 Liyakat',     type:'merits', amount:10,    weight:8  },
  { id:'bos1',         emoji:'💨',  label:'Bir Dahaki',     type:'empty',  amount:0,     weight:20 },
  { id:'bos2',         emoji:'☁️',  label:'Şansı Kaçırdın', type:'empty',  amount:0,     weight:15 },
];

// Ağırlıklı rastgele seçim
function pickDilim() {
  const total = DILIMLER.reduce((s, d) => s + d.weight, 0);
  let rand = Math.random() * total;
  for (const d of DILIMLER) {
    rand -= d.weight;
    if (rand <= 0) return d;
  }
  return DILIMLER[0];
}

// GET /api/fal-carki/status — son çevirme zamanı ve dilimler
router.get('/status', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT value FROM game_state WHERE key=$1`, [`fal_carki_${req.user.id}`]
  ).catch(() => ({ rows: [] }));
  const data = rows[0]?.value || {};
  const lastSpun = data.lastSpun ? new Date(data.lastSpun) : null;
  const now = new Date();
  const canSpin = !lastSpun || (now - lastSpun) >= 20 * 60 * 60 * 1000; // 20 saat
  const nextSpin = lastSpun ? new Date(lastSpun.getTime() + 20 * 60 * 60 * 1000) : null;
  res.json({ success: true, canSpin, nextSpin, lastReward: data.lastReward, dilimler: DILIMLER });
}));

// POST /api/fal-carki/spin — çevir
router.post('/spin', authMiddleware, asyncHandler(async (req, res) => {
  // Cooldown kontrolü
  const { rows } = await db.query(
    `SELECT value FROM game_state WHERE key=$1`, [`fal_carki_${req.user.id}`]
  ).catch(() => ({ rows: [] }));
  const data = rows[0]?.value || {};
  const lastSpun = data.lastSpun ? new Date(data.lastSpun) : null;
  const cooldownMs = 20 * 60 * 60 * 1000;
  if (lastSpun && (Date.now() - lastSpun) < cooldownMs) {
    const remainMs = cooldownMs - (Date.now() - lastSpun);
    const remainH  = Math.ceil(remainMs / 3600000);
    return res.status(429).json({ success: false, message: `Sonraki çevirme için ${remainH} saat bekleyin` });
  }

  const dilim = pickDilim();

  // Ödülü ver
  if (dilim.type === 'money' && dilim.amount > 0) {
    await db.query(`UPDATE users SET money=money+$1 WHERE id=$2`, [dilim.amount, req.user.id]);
  } else if (dilim.type === 'xp' && dilim.amount > 0) {
    await db.query(`UPDATE users SET xp=xp+$1 WHERE id=$2`, [dilim.amount, req.user.id]);
  } else if (dilim.type === 'altin' && dilim.amount > 0) {
    await db.query(`UPDATE users SET altin=COALESCE(altin,0)+$1 WHERE id=$2`, [dilim.amount, req.user.id]);
  } else if (dilim.type === 'merits' && dilim.amount > 0) {
    await db.query(`UPDATE users SET merit_points=COALESCE(merit_points,0)+$1 WHERE id=$2`, [dilim.amount, req.user.id]);
  }

  // Durum kaydet
  const newData = { lastSpun: new Date(), lastReward: dilim };
  await db.query(
    `INSERT INTO game_state(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=$2`,
    [`fal_carki_${req.user.id}`, JSON.stringify(newData)]
  );

  // Sezon puanı
  try {
    if (dilim.type !== 'empty') {
      await db.query(`UPDATE users SET season_score=COALESCE(season_score,0)+5 WHERE id=$1`, [req.user.id]);
    }
  } catch(_) {}

  res.json({ success: true, dilim, index: DILIMLER.indexOf(dilim) });
}));

module.exports = router;
