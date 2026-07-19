// #15 Tax Routes
const express = require('express');
const router  = express.Router();
const { asyncHandler } = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/authMiddleware');
const taxSvc = require('../services/taxService');
const db = require('../services/dbService');

router.get('/', asyncHandler(async (req, res) => {
  const rates = await taxSvc.getAllRates();
  res.json({ success: true, rates });
}));

router.get('/:city', authMiddleware, asyncHandler(async (req, res) => {
  const rates = await taxSvc.getRates(decodeURIComponent(req.params.city));
  res.json({ success: true, rates });
}));

router.put('/:city', authMiddleware, asyncHandler(async (req, res) => {
  const { income, trade, property } = req.body;
  const result = await taxSvc.setRates(decodeURIComponent(req.params.city), { income, trade, property }, req.user.id);
  res.json({ success: result.ok });
}));

// GET /api/tax/history — vergi tahsilat geçmişi
router.get('/history', asyncHandler(async (req, res) => {
  const city = req.query.city;
  let query = `SELECT * FROM tax_history`;
  const params = [];
  if (city) { params.push(city); query += ` WHERE city=$1`; }
  query += ` ORDER BY created_at DESC LIMIT 50`;
  const { rows } = await db.query(query, params).catch(() => ({ rows: [] }));
  res.json({ success: true, history: rows });
}));

// POST /api/tax/:city/collect — vergi topla ve geçmişe kaydet
router.post('/:city/collect', authMiddleware, asyncHandler(async (req, res) => {
  const city = decodeURIComponent(req.params.city);
  const { amount_collected, taxpayer_count } = req.body;
  const rates = await taxSvc.getRates(city);
  await db.query(
    `INSERT INTO tax_history(city, collector_id, collector_name, income_rate, trade_rate, property_rate, amount_collected, taxpayer_count)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
    [city, req.user.id, req.user.username,
     rates?.income || 0, rates?.trade || 0, rates?.property || 0,
     parseInt(amount_collected) || 0, parseInt(taxpayer_count) || 0]
  );
  // Vali performans puanı artır
  await db.query(
    `UPDATE users SET vali_actions_count=COALESCE(vali_actions_count,0)+1,
     vali_performance_score=COALESCE(vali_performance_score,0)+5 WHERE id=$1`, [req.user.id]
  ).catch(() => {});
  res.json({ success: true });
}));

// POST /api/tax/padisah/global-collect — Padişah beyliğine özel küresel vergi toplama
// Yalnızca mevcut Padişah beyliğinin üyeleri çalıştırabilir.
router.post('/padisah/global-collect', authMiddleware, asyncHandler(async (req, res) => {
  if (!db.isReady()) return res.status(503).json({ success: false, error: 'DB hazır değil' });

  // Aktif Padişah beyliğini bul
  let padisahBeylikId = null;
  try {
    const { rows } = await db.query(
      `SELECT padisah_beylik_id FROM padisahlik_donemleri
       WHERE durum IN ('normal','genel_sefer')
       ORDER BY id DESC LIMIT 1`
    );
    padisahBeylikId = rows[0]?.padisah_beylik_id;
  } catch (_) {}

  if (!padisahBeylikId) {
    return res.status(403).json({ success: false, error: 'Henüz bir Padişah ilan edilmedi' });
  }

  // Kullanıcının bu beyliğe üye olup olmadığını game_state üzerinden doğrula
  // Beylikleri JSON'dan oku ve membership kontrolü yap
  let yetkili = false;
  try {
    const { rows: gs } = await db.query(
      `SELECT value FROM game_state WHERE key='beyliks' LIMIT 1`
    );
    const beyliks = gs[0]?.value || [];
    const beylik  = Array.isArray(beyliks)
      ? beyliks.find(b => String(b.id) === String(padisahBeylikId))
      : null;
    if (beylik) {
      const uid = String(req.user.id);
      yetkili = String(beylik.kurucuId) === uid ||
                (Array.isArray(beylik.uyeler) && beylik.uyeler.map(String).includes(uid));
    }
  } catch (_) {}

  if (!yetkili) {
    return res.status(403).json({
      success: false,
      error: 'Bu işlemi yalnızca mevcut Padişah beyliğinin üyeleri yapabilir'
    });
  }

  // Küresel vergi: tüm şehirlerin son vergi tahsilatının %5'i Padişah'a
  const { rows: tarih } = await db.query(
    `SELECT COALESCE(SUM(amount_collected),0) AS toplam
     FROM tax_history
     WHERE created_at > NOW() - INTERVAL '7 days'`
  ).catch(() => ({ rows: [{ toplam: 0 }] }));

  const toplamHaftalik = parseInt(tarih[0]?.toplam || 0);
  const padisahVergi   = Math.floor(toplamHaftalik * 0.05);

  if (padisahVergi <= 0) {
    return res.json({ success: false, error: 'Son 7 günde toplanmış vergi yok' });
  }

  // Padişah kullanıcısına ödeme
  await db.query(
    `UPDATE users SET money = money + $1 WHERE id = $2`,
    [padisahVergi, req.user.id]
  );

  // Log
  await db.query(
    `INSERT INTO tax_history(city, collector_id, collector_name, income_rate, trade_rate, property_rate, amount_collected, taxpayer_count)
     VALUES('GLOBAL_PADISAH',$1,$2,0,0,0,$3,0)`,
    [req.user.id, req.user.username, padisahVergi]
  ).catch(() => {});

  if (global._io) {
    global._io.emit('padisah:vergi_toplandi', {
      padisahBeylikId,
      miktar: padisahVergi,
      tarafindan: req.user.username,
    });
  }

  res.json({ success: true, toplandı: padisahVergi, mesaj: `${padisahVergi.toLocaleString('tr-TR')} 🪙 küresel vergi toplandı` });
}));

router.get('/summary/economy', asyncHandler(async (req, res) => {
  if (!db.isReady()) return res.json({ success: true, treasury: 0, collected: 0 });
  const { rows } = await db.query(
    `SELECT value FROM game_state WHERE key='economy'`
  ).catch(() => ({ rows: [] }));
  const eco = rows[0]?.value || {};
  res.json({ success: true, treasury: eco.treasury || 0, inflation: eco.inflation || 5 });
}));

module.exports = router;
