const express = require('express');
const router  = express.Router();
const db      = require('../services/dbService');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler }   = require('../middleware/asyncHandler');

const NPC_ITEMS = [
  { id:'altin_kupa',   name:'Altın Kupa',      base_price:2000,  emoji:'🏆', desc:'Nadide bir koleksiyon.' },
  { id:'ipek_kaftan',  name:'İpek Kaftan',      base_price:3500,  emoji:'👘', desc:'Doğu\'nun en ince ipeğinden.' },
  { id:'osmanli_hanci',name:'Osmanlı Hançeri',  base_price:5000,  emoji:'🗡️', desc:'Süslü bir savaş hatırası.' },
  { id:'baharat_kutu', name:'Baharat Kutusu',   base_price:800,   emoji:'🌶️', desc:'Hint baharatları.' },
  { id:'ferman_kopi',  name:'Sahte Ferman',     base_price:4500,  emoji:'📜', desc:'Kim sorarsa asıl bu.' },
  { id:'gizli_harita', name:'Gizli Harita',     base_price:6000,  emoji:'🗺️', desc:'Bilinmez bir hazineye işaret eder.' },
  { id:'amber_tesbih', name:'Amber Tespih',     base_price:1200,  emoji:'📿', desc:'Saf amberin kokusu.' },
  { id:'buyuk_ayna',   name:'Venedik Aynası',   base_price:2800,  emoji:'🪞', desc:'İtalyanların en güzel işi.' },
];

function getThisSaturday() {
  const d = new Date();
  const day = d.getDay();
  const diff = (6 - day + 7) % 7;
  const sat = new Date(d);
  sat.setDate(d.getDate() + (diff === 0 && d.getHours() >= 8 ? 0 : diff));
  return sat.toISOString().split('T')[0];
}

function isMarketActive() {
  const now = new Date();
  return now.getDay() === 6 && now.getHours() >= 8 && now.getHours() < 22;
}

function buildMarketItems() {
  // Pick 5 random items with 20% discount
  const shuffled = [...NPC_ITEMS].sort(() => Math.random() - 0.5).slice(0, 5);
  return shuffled.map(item => ({
    ...item,
    price: Math.round(item.base_price * 0.8),
    original_price: item.base_price,
    stock: Math.floor(Math.random() * 5) + 3
  }));
}

/* GET /api/market/status */
router.get('/status', authMiddleware, asyncHandler(async (req, res) => {
  const satDate = getThisSaturday();
  let { rows: [event] } = await db.query(`SELECT * FROM weekly_market_events WHERE market_date=$1`, [satDate]);

  if (!event) {
    const items = buildMarketItems();
    const { rows: [created] } = await db.query(
      `INSERT INTO weekly_market_events (market_date, items, status) VALUES ($1,$2,'scheduled') ON CONFLICT (market_date) DO UPDATE SET status=weekly_market_events.status RETURNING *`,
      [satDate, JSON.stringify(items)]
    );
    event = created;
  }

  const active = isMarketActive();
  res.json({
    success: true,
    active,
    event,
    items: active ? (event.items || []) : [],
    nextMarket: satDate,
    message: active ? '🎪 Pazar aktif! Fırsatları kaçırma.' : `📅 Sonraki pazar: ${satDate} (Cumartesi 08:00 – 22:00)`
  });
}));

/* POST /api/market/buy */
router.post('/buy', authMiddleware, asyncHandler(async (req, res) => {
  if (!isMarketActive()) return res.status(400).json({ success: false, message: 'Pazar aktif değil' });

  const { itemId } = req.body;
  const satDate = getThisSaturday();
  const { rows: [event] } = await db.query(`SELECT * FROM weekly_market_events WHERE market_date=$1`, [satDate]);
  if (!event) return res.status(404).json({ success: false });

  const items = event.items || [];
  const item = items.find(i => i.id === itemId);
  if (!item) return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });
  if ((item.stock || 0) <= 0) return res.status(400).json({ success: false, message: 'Stok tükendi' });

  // Check user hasn't already bought this item today
  const { rows: existing } = await db.query(
    `SELECT id FROM market_purchases WHERE event_id=$1 AND user_id=$2 AND item_id=$3`,
    [event.id, req.user.id, itemId]
  );
  if (existing.length) return res.status(400).json({ success: false, message: 'Bu ürünü zaten satın aldın' });

  const { rows: [user] } = await db.query(`SELECT money FROM users WHERE id=$1`, [req.user.id]);
  if ((user.money || 0) < item.price) return res.status(400).json({ success: false, message: 'Yetersiz para' });

  // Deduct money, reduce stock
  await db.query(`UPDATE users SET money=money-$1 WHERE id=$2`, [item.price, req.user.id]);
  const newItems = items.map(i => i.id === itemId ? { ...i, stock: i.stock - 1 } : i);
  await db.query(`UPDATE weekly_market_events SET items=$1::jsonb WHERE id=$2`, [JSON.stringify(newItems), event.id]);
  await db.query(`INSERT INTO market_purchases (event_id, user_id, item_id, item_name, price) VALUES ($1,$2,$3,$4,$5)`,
    [event.id, req.user.id, itemId, item.name, item.price]
  );

  if (global._io) global._io.emit('market:purchase', { item: item.name, stock: item.stock - 1 });
  res.json({ success: true, item, newStock: item.stock - 1 });
}));

/* GET /api/market/my-purchases */
router.get('/my-purchases', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT mp.*, wme.market_date FROM market_purchases mp
     JOIN weekly_market_events wme ON wme.id=mp.event_id
     WHERE mp.user_id=$1 ORDER BY mp.created_at DESC LIMIT 20`,
    [req.user.id]
  );
  res.json({ success: true, purchases: rows });
}));

module.exports = router;
