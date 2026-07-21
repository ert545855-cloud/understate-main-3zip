// ═══════════════════════════════════════════════════════════════
// Sefer / Kampanya Sistemi — /api/campaigns
// ═══════════════════════════════════════════════════════════════
const express = require('express');
const router  = express.Router();
const { asyncHandler }   = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/authMiddleware');
const sb = require('../services/supabaseService');

// Hazır NPC hedefler — sefer düzenlenecek yerler
const NPC_TARGETS = [
  { name: 'Venedik Ticaret Kumpanyası', power: 800,   reward_sikke: 5000,  reward_xp: 200, reward_merits: 10 },
  { name: 'Rodos Şövalyeleri',          power: 1500,  reward_sikke: 12000, reward_xp: 400, reward_merits: 25 },
  { name: 'Ceneviz Kolonisi',           power: 1200,  reward_sikke: 9000,  reward_xp: 300, reward_merits: 20 },
  { name: 'Macar Krallığı Sınır Kalesi',power: 2500,  reward_sikke: 20000, reward_xp: 600, reward_merits: 40 },
  { name: 'Akkoyunlu Öncü Kuvvetleri', power: 2000,  reward_sikke: 16000, reward_xp: 500, reward_merits: 35 },
  { name: 'Eflak Beyliği',              power: 1800,  reward_sikke: 14000, reward_xp: 450, reward_merits: 30 },
  { name: 'İskenderi Haçlı Artıkları', power: 3500,  reward_sikke: 30000, reward_xp: 800, reward_merits: 60 },
  { name: 'Safevi İleri Karakolu',      power: 4000,  reward_sikke: 40000, reward_xp: 1000,reward_merits: 80 },
];

// GET /api/campaigns/targets — mevcut NPC hedefleri
router.get('/targets', (req, res) => {
  res.json({ success: true, targets: NPC_TARGETS });
});

// GET /api/campaigns — aktif/tamamlanan seferler
router.get('/', asyncHandler(async (req, res) => {
  // Süresi dolanları çöz
  await resolveCampaigns();
  const { status } = req.query;
  let query = `SELECT * FROM campaigns`;
  const params = [];
  if (status) { params.push(status); query += ` WHERE status=$1`; }
  query += ` ORDER BY created_at DESC LIMIT 30`;
  const { rows } = await sb.query(query, params);
  res.json({ success: true, campaigns: rows });
}));

// GET /api/campaigns/:id — tek sefer detayı
router.get('/:id', asyncHandler(async (req, res) => {
  const { rows } = await sb.query(`SELECT * FROM campaigns WHERE id=$1`, [parseInt(req.params.id)]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Sefer bulunamadı' });
  res.json({ success: true, campaign: rows[0] });
}));

// POST /api/campaigns/create — yeni sefer başlat
router.post('/create', authMiddleware, asyncHandler(async (req, res) => {
  const { target_index, recruit_hours = 12 } = req.body;
  const idx = parseInt(target_index);
  if (isNaN(idx) || idx < 0 || idx >= NPC_TARGETS.length) return res.status(400).json({ success: false, message: 'Geçersiz hedef' });
  const target = NPC_TARGETS[idx];
  const hours  = Math.max(1, Math.min(48, parseInt(recruit_hours)));
  // Kullanıcı ittifakta mı?
  const { rows: user } = await sb.query(`SELECT alliance_id FROM users WHERE id=$1`, [req.user.id]);
  const allianceId = user[0]?.alliance_id || null;
  // Zaten aktif sefer var mı?
  const { rows: existing } = await sb.query(
    `SELECT id FROM campaigns WHERE organizer_id=$1 AND status IN ('recruiting','active')`,
    [req.user.id]
  );
  if (existing.length) return res.status(400).json({ success: false, message: 'Zaten aktif bir seferin var' });
  const starts_at = new Date(Date.now() + hours * 3600000);
  const ends_at   = new Date(starts_at.getTime() + 3600000); // 1 saat savaş
  const { rows } = await sb.query(
    `INSERT INTO campaigns(name,description,organizer_id,organizer_name,alliance_id,target_name,target_power,
       reward_sikke,reward_xp,reward_merits,starts_at,ends_at,participants)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'[]') RETURNING *`,
    [
      `${target.name} Seferi`, `${target.name} üzerine düzenlenen büyük sefer`,
      req.user.id, req.user.username, allianceId,
      target.name, target.power,
      target.reward_sikke, target.reward_xp, target.reward_merits,
      starts_at, ends_at
    ]
  );
  // Organizatör otomatik katılsın
  const campaign = rows[0];
  await joinCampaign(campaign.id, req.user.id, req.user.username);
  try { const io = global._io; if(io) io.emit('campaign:new', { campaign }); } catch(e) {}
  res.json({ success: true, campaign });
}));

// POST /api/campaigns/:id/join — sefere katıl
router.post('/:id/join', authMiddleware, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { rows } = await sb.query(`SELECT * FROM campaigns WHERE id=$1 FOR UPDATE`, [id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Sefer bulunamadı' });
  const c = rows[0];
  if (c.status !== 'recruiting') return res.status(400).json({ success: false, message: 'Kayıt kapalı' });
  const participants = c.participants || [];
  if (participants.find(p => p.user_id === req.user.id)) return res.status(400).json({ success: false, message: 'Zaten katılıyorsun' });
  await joinCampaign(id, req.user.id, req.user.username);
  const { rows: updated } = await sb.query(`SELECT * FROM campaigns WHERE id=$1`, [id]);
  try { const io = global._io; if(io) io.emit('campaign:update', updated[0]); } catch(e) {}
  res.json({ success: true, campaign: updated[0] });
}));

// POST /api/campaigns/:id/leave — seferden ayrıl
router.post('/:id/leave', authMiddleware, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { rows } = await sb.query(`SELECT * FROM campaigns WHERE id=$1 FOR UPDATE`, [id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Sefer bulunamadı' });
  const c = rows[0];
  if (c.status !== 'recruiting') return res.status(400).json({ success: false, message: 'Sefer başladı, ayrılamazsın' });
  if (c.organizer_id === req.user.id) return res.status(400).json({ success: false, message: 'Organizatör ayrılamaz' });
  const participants = (c.participants || []).filter(p => p.user_id !== req.user.id);
  const totalPower   = participants.reduce((s, p) => s + (p.power || 0), 0);
  await sb.query(
    `UPDATE campaigns SET participants=$1,participant_power=$2 WHERE id=$3`,
    [JSON.stringify(participants), totalPower, id]
  );
  res.json({ success: true });
}));

async function joinCampaign(campaignId, userId, username) {
  const { rows: user } = await sb.query(`SELECT level,weapons,ammo FROM users WHERE id=$1`, [userId]);
  const u = user[0] || {};
  const power = (u.level || 1) * 10 + (u.weapons || 0) * 5 + (u.ammo || 0) * 3;
  const { rows } = await sb.query(`SELECT participants,participant_power FROM campaigns WHERE id=$1`, [campaignId]);
  const participants = rows[0]?.participants || [];
  participants.push({ user_id: userId, username, power, joined_at: new Date() });
  const totalPower = participants.reduce((s, p) => s + (p.power || 0), 0);
  await sb.query(
    `UPDATE campaigns SET participants=$1,participant_power=$2 WHERE id=$3`,
    [JSON.stringify(participants), totalPower, campaignId]
  );
}

async function resolveCampaigns() {
  try {
    // Katılım süresi bitti → 'active'
    await sb.query(`UPDATE campaigns SET status='active' WHERE status='recruiting' AND starts_at<=NOW()`);
    // Savaş süresi bitti → çöz
    const { rows: toResolve } = await sb.query(
      `SELECT * FROM campaigns WHERE status='active' AND ends_at<=NOW()`
    );
    for (const c of toResolve) {
      const victory = c.participant_power >= c.target_power;
      await sb.query(
        `UPDATE campaigns SET status=$1,resolved_at=NOW() WHERE id=$2`,
        [victory ? 'victory' : 'defeat', c.id]
      );
      if (victory && c.participants?.length) {
        const share_sikke  = Math.floor(c.reward_sikke  / c.participants.length);
        const share_xp     = Math.floor(c.reward_xp     / c.participants.length);
        const share_merits = Math.floor(c.reward_merits / c.participants.length);
        for (const p of c.participants) {
          await sb.query(
            `UPDATE users SET money=money+$1, xp=xp+$2, merit_points=COALESCE(merit_points,0)+$3 WHERE id=$4`,
            [share_sikke, share_xp, share_merits, p.user_id]
          );
        }
      }
      try { const io = global._io; if(io) io.emit('campaign:resolved', { id: c.id, victory, name: c.target_name }); } catch(e) {}
    }
  } catch(e) {}
}

module.exports = router;
