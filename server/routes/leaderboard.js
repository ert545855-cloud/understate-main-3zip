const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/asyncHandler');
const { getLeaderboard } = require('../services/leaderboardService');
const monitoring = require('../services/monitoringService');
const roomManager = require('../rooms/roomManager');
const { getOnlineGamePlayers } = require('../socket/gameHandler');
const db = require('../services/dbService');

const VALID_TYPES = ['level', 'money', 'bank', 'score', 'gang'];

// Tekli tip sorgulama
router.get('/', asyncHandler(async (req, res) => {
  const type = VALID_TYPES.includes(req.query.type) ? req.query.type : 'level';
  const result = await getLeaderboard(type);
  res.json(result);
}));

// /top alias → /all ile aynı
router.get('/top', async (req, res, next) => { req.url = '/all'; next(); });

// Tüm kategorileri tek sorguda döner (UI için kullanışlı)
router.get('/all', asyncHandler(async (req, res) => {
  try {
    const results = await Promise.all(VALID_TYPES.map(t => getLeaderboard(t)));
    const combined = {};
    VALID_TYPES.forEach((t, i) => { combined[t] = results[i].data || []; });
    res.json({ success: true, data: combined, types: VALID_TYPES });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Hata' });
  }
}));

// Online istatistikler
router.get('/online', (req, res) => {
  const stats       = monitoring.getStats(roomManager.getAllRooms().length);
  const gamePlayers = getOnlineGamePlayers();
  res.json({
    success: true,
    online:  stats.connectedSockets,
    peak:    stats.peakOnline,
    rooms:   stats.roomCount,
    uptime:  stats.uptimeFormatted,
    inGame:  gamePlayers.length,
  });
});

// ── Extended leaderboards ────────────────────────────────────────────────────

// En yüksek kredi skoru
router.get('/extended/credit', asyncHandler(async (req, res) => {
  if (!db.isReady()) return res.json({ success: false, data: [] });
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const { rows } = await db.query(
    `SELECT id, username, level, city, credit_score
     FROM users
     ORDER BY credit_score DESC, level DESC
     LIMIT $1`,
    [limit]
  ).catch(() => ({ rows: [] }));
  res.json({ success: true, type: 'credit', data: rows });
}));

// En çok streak yapan oyuncular
router.get('/extended/streak', asyncHandler(async (req, res) => {
  if (!db.isReady()) return res.json({ success: false, data: [] });
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const { rows } = await db.query(
    `SELECT u.id, u.username, u.level, u.city,
            ds.current_streak, ds.longest_streak, ds.total_claims
     FROM daily_streaks ds
     JOIN users u ON u.id = ds.user_id
     ORDER BY ds.longest_streak DESC, ds.current_streak DESC
     LIMIT $1`,
    [limit]
  ).catch(() => ({ rows: [] }));
  res.json({ success: true, type: 'streak', data: rows });
}));

// En çok marketplace işlemi yapan oyuncular
router.get('/extended/traders', asyncHandler(async (req, res) => {
  if (!db.isReady()) return res.json({ success: false, data: [] });
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const { rows } = await db.query(
    `SELECT u.id, u.username, u.level, u.city,
            COUNT(mt.id)         AS total_trades,
            COALESCE(SUM(mt.price), 0) AS total_volume
     FROM marketplace_transactions mt
     JOIN users u ON u.id = mt.buyer_id OR u.id = mt.seller_id
     GROUP BY u.id, u.username, u.level, u.city
     ORDER BY total_volume DESC, total_trades DESC
     LIMIT $1`,
    [limit]
  ).catch(() => ({ rows: [] }));
  res.json({ success: true, type: 'traders', data: rows });
}));

// En çok transfer yapan oyuncular
router.get('/extended/transfers', asyncHandler(async (req, res) => {
  if (!db.isReady()) return res.json({ success: false, data: [] });
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const { rows } = await db.query(
    `SELECT u.id, u.username, u.level, u.city,
            COUNT(t.id)               AS total_transfers,
            COALESCE(SUM(t.amount), 0) AS total_sent
     FROM money_transfers t
     JOIN users u ON u.id = t.sender_id
     GROUP BY u.id, u.username, u.level, u.city
     ORDER BY total_sent DESC, total_transfers DESC
     LIMIT $1`,
    [limit]
  ).catch(() => ({ rows: [] }));
  res.json({ success: true, type: 'transfers', data: rows });
}));

// En güçlü portföy (son snapshot'a göre)
router.get('/extended/portfolio', asyncHandler(async (req, res) => {
  if (!db.isReady()) return res.json({ success: false, data: [] });
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const { rows } = await db.query(
    `SELECT DISTINCT ON (ph.user_id)
            u.id, u.username, u.level, u.city,
            ph.total_value, ph.recorded_at
     FROM portfolio_history ph
     JOIN users u ON u.id = ph.user_id
     ORDER BY ph.user_id, ph.recorded_at DESC`,
    []
  ).then(r => {
    // re-sort by total_value after DISTINCT
    r.rows.sort((a, b) => BigInt(b.total_value) > BigInt(a.total_value) ? 1 : -1);
    return { rows: r.rows.slice(0, limit) };
  }).catch(() => ({ rows: [] }));
  res.json({ success: true, type: 'portfolio', data: rows });
}));

// En iyi kredi ödeyenler (tam ödenmiş kredi sayısı)
router.get('/extended/loans', asyncHandler(async (req, res) => {
  if (!db.isReady()) return res.json({ success: false, data: [] });
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const { rows } = await db.query(
    `SELECT u.id, u.username, u.level, u.city,
            u.credit_score,
            COUNT(l.id)               AS paid_loans,
            COALESCE(SUM(l.principal), 0) AS total_repaid
     FROM loans l
     JOIN users u ON u.id = l.user_id
     WHERE l.status = 'paid'
     GROUP BY u.id, u.username, u.level, u.city, u.credit_score
     ORDER BY paid_loans DESC, total_repaid DESC
     LIMIT $1`,
    [limit]
  ).catch(() => ({ rows: [] }));
  res.json({ success: true, type: 'loans', data: rows });
}));

// En aktif arkadaş networkleri
router.get('/extended/social', asyncHandler(async (req, res) => {
  if (!db.isReady()) return res.json({ success: false, data: [] });
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const { rows } = await db.query(
    `SELECT u.id, u.username, u.level, u.city,
            COUNT(f.id) AS friend_count
     FROM friendships f
     JOIN users u ON u.id = f.user_id
     WHERE f.status = 'accepted'
     GROUP BY u.id, u.username, u.level, u.city
     ORDER BY friend_count DESC
     LIMIT $1`,
    [limit]
  ).catch(() => ({ rows: [] }));
  res.json({ success: true, type: 'social', data: rows });
}));

// Tüm extended kategoriler tek sorguda
router.get('/extended', asyncHandler(async (req, res) => {
  if (!db.isReady()) return res.json({ success: false, data: {} });
  const limit = 10;
  try {
    const [credit, streak, traders, transfers, loans, social] = await Promise.all([
      db.query(`SELECT u.id,u.username,u.level,u.city,u.credit_score FROM users u ORDER BY credit_score DESC,level DESC LIMIT $1`, [limit]),
      db.query(`SELECT u.id,u.username,u.level,ds.current_streak,ds.longest_streak FROM daily_streaks ds JOIN users u ON u.id=ds.user_id ORDER BY ds.longest_streak DESC LIMIT $1`, [limit]),
      db.query(`SELECT u.id,u.username,u.level,COUNT(mt.id) AS total_trades,COALESCE(SUM(mt.price),0) AS total_volume FROM marketplace_transactions mt JOIN users u ON u.id=mt.buyer_id OR u.id=mt.seller_id GROUP BY u.id,u.username,u.level ORDER BY total_volume DESC LIMIT $1`, [limit]),
      db.query(`SELECT u.id,u.username,u.level,COUNT(t.id) AS total_transfers,COALESCE(SUM(t.amount),0) AS total_sent FROM money_transfers t JOIN users u ON u.id=t.sender_id GROUP BY u.id,u.username,u.level ORDER BY total_sent DESC LIMIT $1`, [limit]),
      db.query(`SELECT u.id,u.username,u.level,u.credit_score,COUNT(l.id) AS paid_loans FROM loans l JOIN users u ON u.id=l.user_id WHERE l.status='paid' GROUP BY u.id,u.username,u.level,u.credit_score ORDER BY paid_loans DESC LIMIT $1`, [limit]),
      db.query(`SELECT u.id,u.username,u.level,COUNT(f.id) AS friend_count FROM friendships f JOIN users u ON u.id=f.user_id WHERE f.status='accepted' GROUP BY u.id,u.username,u.level ORDER BY friend_count DESC LIMIT $1`, [limit]),
    ]);
    res.json({
      success: true,
      data: {
        credit:    credit.rows,
        streak:    streak.rows,
        traders:   traders.rows,
        transfers: transfers.rows,
        loans:     loans.rows,
        social:    social.rows,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

// ── Çok Kategorili Liderlik Tahtası ─────────────────────────────────────────
// GET /api/leaderboard/:category  (zenginlik | ordu | toprak | itibar)

router.get('/:category', asyncHandler(async (req, res) => {
  if (!db.isReady()) return res.json({ success: false, data: [] });

  const cat   = req.params.category;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);

  let rows = [];

  try {
    if (cat === 'zenginlik') {
      ({ rows } = await db.query(
        `SELECT id, username, level, city,
                COALESCE(money,0) AS money,
                COALESCE(bank_balance,0) AS bank_balance,
                (COALESCE(money,0) + COALESCE(bank_balance,0)) AS toplam_servet
         FROM users
         ORDER BY toplam_servet DESC
         LIMIT $1`, [limit]
      ));
    } else if (cat === 'ordu') {
      ({ rows } = await db.query(
        `SELECT id, username, level, city,
                COALESCE(weapons,0) AS weapons,
                COALESCE(ammo,0) AS ammo,
                COALESCE(war_elo,1000) AS war_elo,
                COALESCE(war_league,'bronz') AS war_league,
                (COALESCE(weapons,0)*5 + COALESCE(ammo,0)*3 + COALESCE(level,1)*10) AS guc_puani
         FROM users
         ORDER BY guc_puani DESC
         LIMIT $1`, [limit]
      ));
    } else if (cat === 'toprak') {
      // Eyalet sayacı üzerinden
      ({ rows } = await db.query(
        `SELECT e.beylik_id, e.eyalet_sayisi,
                u.username, u.level, u.city
         FROM eyalet_fetih_sayaci e
         JOIN padisahlik_donemleri d ON d.id = e.donem_id
         LEFT JOIN users u ON u.id::text = e.beylik_id
         WHERE d.durum IN ('normal','genel_sefer')
         ORDER BY e.eyalet_sayisi DESC
         LIMIT $1`, [limit]
      ).catch(() => ({ rows: [] })));

      // Fallback: eyalet vali verisinden
      if (!rows.length) {
        ({ rows } = await db.query(
          `SELECT u.id, u.username, u.level, u.city,
                  COUNT(ev.user_id) AS eyalet_sayisi
           FROM eyalet_vali ev
           JOIN users u ON u.id::text = ev.user_id
           GROUP BY u.id, u.username, u.level, u.city
           ORDER BY eyalet_sayisi DESC
           LIMIT $1`, [limit]
        ).catch(() => ({ rows: [] })));
      }
    } else if (cat === 'itibar') {
      ({ rows } = await db.query(
        `SELECT id, username, level, city,
                COALESCE(itibar_score,100) AS itibar_score,
                COALESCE(merit_points,0) AS merit_points
         FROM users
         ORDER BY itibar_score DESC, merit_points DESC
         LIMIT $1`, [limit]
      ));
    } else {
      return res.status(400).json({ success: false, error: 'Geçersiz kategori. zenginlik | ordu | toprak | itibar' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }

  res.json({ success: true, category: cat, data: rows });
}));

module.exports = router;
