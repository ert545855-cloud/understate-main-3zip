// ═══════════════════════════════════════════════════════════════
// Casus Görev Zinciri — /api/casus-chain
// 3 aşamalı server-doğrulamalı casusluk sistemi
// ═══════════════════════════════════════════════════════════════
const express = require('express');
const router  = express.Router();
const { asyncHandler }   = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/authMiddleware');
const db = require('../services/dbService');

// Görev tanımları
const MISSION_DEFS = {
  kesif:    { label:'Keşif',           emoji:'🔭', maliyet:500,   risk:10, stages:[{ dur:300, label:'Bölgeyi İzle' },{ dur:180, label:'Rapor Hazırla' },{ dur:120, label:'Bilgi Teslim Et' }], reward_sikke:800,  reward_xp:80  },
  casusluk: { label:'Casusluk',        emoji:'🕵️', maliyet:2000,  risk:25, stages:[{ dur:600, label:'Sızma Hazırlığı' },{ dur:900, label:'İçeriden Bilgi Al' },{ dur:300, label:'Güvenli Çıkış' }], reward_sikke:3500, reward_xp:250 },
  sabotaj:  { label:'Sabotaj',         emoji:'🔥', maliyet:5000,  risk:40, stages:[{ dur:900, label:'Hedefi Tespit Et' },{ dur:1200, label:'Savunmayı Aş' },{ dur:600, label:'Sabotajı Yap' }], reward_sikke:8000, reward_xp:500 },
  suikast:  { label:'Suikast Girişimi',emoji:'🗡️', maliyet:8000,  risk:55, stages:[{ dur:1800,label:'Fırsatı Bekle' },{ dur:3600, label:'Yaklaş' },{ dur:900, label:'Harekata Geç' }], reward_sikke:12000,reward_xp:800 },
};

// GET /api/casus-chain/missions — kullanıcının aktif/tamamlanan görevleri
router.get('/missions', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM casus_missions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20`,
    [req.user.id]
  );
  // Süresi dolan aşamaları kontrol et
  await resolveExpiredStages(req.user.id);
  res.json({ success: true, missions: rows });
}));

// GET /api/casus-chain/types — görev tanımları
router.get('/types', (req, res) => {
  res.json({ success: true, missions: MISSION_DEFS });
});

// POST /api/casus-chain/start — yeni görev zinciri başlat
router.post('/start', authMiddleware, asyncHandler(async (req, res) => {
  const { mission_type, target_name, target_id } = req.body;
  const def = MISSION_DEFS[mission_type];
  if (!def) return res.status(400).json({ success: false, message: 'Geçersiz görev tipi' });
  if (!target_name) return res.status(400).json({ success: false, message: 'Hedef adı gerekli' });

  // Zaten aktif görev var mı?
  const { rows: active } = await db.query(
    `SELECT id FROM casus_missions WHERE user_id=$1 AND status='active'`,
    [req.user.id]
  );
  if (active.length) return res.status(400).json({ success: false, message: 'Zaten aktif bir göreviniz var' });

  // Sikke kontrolü
  const { rows: user } = await db.query(`SELECT money FROM users WHERE id=$1`, [req.user.id]);
  if ((user[0]?.money || 0) < def.maliyet) {
    return res.status(400).json({ success: false, message: `Yetersiz Sikke — ${def.maliyet.toLocaleString('tr-TR')} gerekli` });
  }

  // Sikke düş
  await db.query(`UPDATE users SET money=money-$1 WHERE id=$2`, [def.maliyet, req.user.id]);

  const stageDur = def.stages[0].dur * 1000;
  const stage1End = new Date(Date.now() + stageDur);

  const { rows } = await db.query(
    `INSERT INTO casus_missions(user_id, mission_type, target_name, target_id, stage, stage1_ends_at, reward_sikke, reward_xp)
     VALUES($1,$2,$3,$4,1,$5,$6,$7) RETURNING *`,
    [req.user.id, mission_type, target_name, target_id || null, stage1End, def.reward_sikke, def.reward_xp]
  );

  // Sezon puanı ekle
  try { await addSezonPuan(req.user.id, 15); } catch(_) {}

  res.json({ success: true, mission: rows[0] });
}));

// POST /api/casus-chain/:id/advance — bir sonraki aşamaya geç
router.post('/:id/advance', authMiddleware, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { rows } = await db.query(`SELECT * FROM casus_missions WHERE id=$1 AND user_id=$2`, [id, req.user.id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Görev bulunamadı' });

  const m = rows[0];
  if (m.status !== 'active') return res.status(400).json({ success: false, message: 'Görev zaten tamamlandı' });

  const def = MISSION_DEFS[m.mission_type];
  const now = new Date();

  // Mevcut aşamanın süresi dolmuş mu?
  const endKey = `stage${m.stage}_ends_at`;
  if (m[endKey] && new Date(m[endKey]) > now) {
    const remaining = Math.ceil((new Date(m[endKey]) - now) / 1000);
    return res.status(400).json({ success: false, message: `Aşama henüz tamamlanmadı — ${remaining}sn kaldı` });
  }

  // Risk kontrolü — başarısız mı oldu?
  const failed = Math.random() * 100 < def.risk;
  if (failed && m.stage >= 2) {
    await db.query(
      `UPDATE casus_missions SET status='captured', stage${m.stage}_done_at=NOW(), result=$1 WHERE id=$2`,
      [JSON.stringify({ failed: true, stage: m.stage, msg: 'Casus yakalandı!' }), id]
    );
    return res.json({ success: true, failed: true, message: '❌ Casus yakalandı! Görev başarısız.' });
  }

  if (m.stage < 3) {
    // Sonraki aşamaya geç
    const nextStage = m.stage + 1;
    const nextDur   = def.stages[nextStage - 1].dur * 1000;
    const nextEnd   = new Date(Date.now() + nextDur);
    await db.query(
      `UPDATE casus_missions
         SET stage=$1, stage${m.stage}_done_at=NOW(), stage${nextStage}_ends_at=$2
       WHERE id=$3`,
      [nextStage, nextEnd, id]
    );
    const { rows: updated } = await db.query(`SELECT * FROM casus_missions WHERE id=$1`, [id]);
    return res.json({ success: true, mission: updated[0], advanced: true });
  }

  // Stage 3 tamamlandı → Görev bitti
  const reward_sikke = def.reward_sikke;
  const reward_xp    = def.reward_xp;
  await db.query(
    `UPDATE casus_missions SET status='completed', stage3_done_at=NOW(), result=$1 WHERE id=$2`,
    [JSON.stringify({ success: true, reward_sikke, reward_xp }), id]
  );
  await db.query(
    `UPDATE users SET money=money+$1, xp=xp+$2 WHERE id=$3`,
    [reward_sikke, reward_xp, req.user.id]
  );

  // Sezon puanı
  try { await addSezonPuan(req.user.id, 50); } catch(_) {}

  // Socket bildirim
  try {
    const io = global._io;
    if (io) io.to(`user_${req.user.id}`).emit('casus:completed', { mission_type: m.mission_type, reward_sikke, reward_xp });
  } catch(_) {}

  res.json({ success: true, completed: true, reward_sikke, reward_xp });
}));

// POST /api/casus-chain/:id/abort — görevi iptal et
router.post('/:id/abort', authMiddleware, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  await db.query(
    `UPDATE casus_missions SET status='failed' WHERE id=$1 AND user_id=$2 AND status='active'`,
    [id, req.user.id]
  );
  res.json({ success: true });
}));

async function resolveExpiredStages(userId) {
  try {
    // Süresi dolan ve failure riski olan görevleri çöz
    const { rows } = await db.query(
      `SELECT * FROM casus_missions WHERE user_id=$1 AND status='active'`, [userId]
    );
    for (const m of rows) {
      const def = MISSION_DEFS[m.mission_type];
      if (!def) continue;
      // Eğer son aşamanın süresi üzerinden 2 kat geçtiyse — başarısız say
      const lastEnd = m[`stage${m.stage}_ends_at`];
      if (lastEnd && (Date.now() - new Date(lastEnd)) > def.stages[m.stage - 1].dur * 2000) {
        await db.query(`UPDATE casus_missions SET status='failed' WHERE id=$1`, [m.id]);
      }
    }
  } catch(_) {}
}

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
