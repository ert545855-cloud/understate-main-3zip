/**
 * Sezon Sistemi API — 30 günlük sezonlar, sıralama & ödüller
 */
const express = require('express');
const router  = express.Router();
const db      = require('../services/dbService');
const { authMiddleware } = require('../middleware/authMiddleware');

// ── Mevcut sezonu getir ──────────────────────────────────────────────────────
router.get('/current', authMiddleware, async (req, res) => {
  try {
    // Aktif sezon var mı?
    let sezon = null;
    try {
      const { rows } = await db.query(
        `SELECT * FROM seasons WHERE status = 'active' ORDER BY created_at DESC LIMIT 1`
      );
      sezon = rows[0] || null;
    } catch (_) {}

    // Yoksa oluştur
    if (!sezon) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const themes = ['kış', 'ilkbahar', 'yaz', 'sonbahar'];
      const theme  = themes[now.getMonth() % 4];
      const number = now.getMonth() + 1 + (now.getFullYear() - 2024) * 12;

      try {
        const ins = await db.query(
          `INSERT INTO seasons (number, theme, start_date, end_date, status, rewards)
           VALUES ($1,$2,$3,$4,'active',$5) RETURNING *`,
          [number, theme, start.toISOString(), end.toISOString(), JSON.stringify([])]
        );
        sezon = ins.rows[0];
      } catch (_) {
        // Tablo yoksa fallback
        sezon = {
          id: 1,
          number,
          theme,
          start_date: start.toISOString(),
          end_date:   end.toISOString(),
          status: 'active',
        };
      }
    }

    const rewards = [
      { tier: 'Padişah', rank: 1,  altin: 500, frame: 'rainbow', title: 'Sultan' },
      { tier: 'Vezir',   rank: 3,  altin: 250, frame: 'gold',    title: 'Sadrazam' },
      { tier: 'Bey',     rank: 10, altin: 100, frame: 'silver',  title: 'Bey' },
      { tier: 'Ağa',     rank: 50, altin: 50,  frame: null,      title: 'Ağa' },
      { tier: 'Vatandaş',rank: 999,altin: 10,  frame: null,      title: null },
    ];

    res.json({
      success: true,
      sezon: {
        id:         sezon.id,
        number:     sezon.number,
        theme:      sezon.theme,
        startDate:  sezon.start_date,
        endDate:    sezon.end_date,
        status:     sezon.status,
      },
      rewards,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Sezon sıralaması ─────────────────────────────────────────────────────────
router.get('/ranking', authMiddleware, async (req, res) => {
  try {
    let ranking = [];
    try {
      // Aktif sezonun sıralaması
      const { rows } = await db.query(`
        SELECT sr.user_id AS "userId", u.username, sr.score,
               ROW_NUMBER() OVER (ORDER BY sr.score DESC) AS rank
        FROM season_rankings sr
        JOIN users u ON u.id = sr.user_id
        WHERE sr.season_id = (
          SELECT id FROM seasons WHERE status = 'active' ORDER BY created_at DESC LIMIT 1
        )
        ORDER BY sr.score DESC
        LIMIT 100
      `);
      ranking = rows;
    } catch (_) {
      // Tablo yoksa leaderboard'dan fallback
      try {
        const { rows } = await db.query(`
          SELECT id AS "userId", username,
                 (COALESCE(level,1)*1000 + COALESCE(xp,0)/2 + COALESCE(merit_points,0)*50) AS score,
                 ROW_NUMBER() OVER (ORDER BY (COALESCE(level,1)*1000 + COALESCE(xp,0)/2) DESC) AS rank
          FROM users
          WHERE username IS NOT NULL
          ORDER BY score DESC
          LIMIT 100
        `);
        ranking = rows;
      } catch (_2) {}
    }
    res.json({ success: true, ranking });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Puan ekle (iç servisler çağırır) ────────────────────────────────────────
router.post('/add-score', authMiddleware, async (req, res) => {
  const { points = 0, reason = '' } = req.body;
  const userId = req.user.id;
  if (!points || points <= 0) return res.json({ success: false, error: 'Geçersiz puan' });

  try {
    // Aktif sezonu bul
    let seasonId = null;
    try {
      const { rows } = await db.query(
        `SELECT id FROM seasons WHERE status='active' ORDER BY created_at DESC LIMIT 1`
      );
      seasonId = rows[0]?.id;
    } catch (_) {}

    if (!seasonId) return res.json({ success: false, error: 'Aktif sezon bulunamadı' });

    // Upsert ranking kaydı
    await db.query(
      `INSERT INTO season_rankings (season_id, user_id, score)
       VALUES ($1, $2, $3)
       ON CONFLICT (season_id, user_id)
       DO UPDATE SET score = season_rankings.score + $3, updated_at = NOW()`,
      [seasonId, userId, points]
    );

    res.json({ success: true, added: points });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
