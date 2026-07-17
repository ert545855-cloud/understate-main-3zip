// ═══════════════════════════════════════════════════════════════
// Açık Artırma Evi — /api/auction
// ═══════════════════════════════════════════════════════════════
const express = require('express');
const router  = express.Router();
const { asyncHandler }   = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/authMiddleware');
const sb = require('../services/supabaseService');

const MIN_BID_STEP = 0.05; // en az %5 artış

// ── Yardımcı: süre dolmuş artırmaları kapat ───────────────────
async function expireAuctions() {
  try {
    await sb.query(`
      UPDATE auctions SET status='expired'
      WHERE status='active' AND ends_at < NOW()
        AND highest_bidder_id IS NULL
    `);
    await sb.query(`
      UPDATE auctions SET status='sold'
      WHERE status='active' AND ends_at < NOW()
        AND highest_bidder_id IS NOT NULL
    `);
  } catch(e) {}
}

// GET /api/auction — aktif artırmalar
router.get('/', asyncHandler(async (req, res) => {
  await expireAuctions();
  const { item_type, page = 1 } = req.query;
  const limit  = 20;
  const offset = (parseInt(page) - 1) * limit;
  let query = `SELECT * FROM auctions WHERE status='active'`;
  const params = [];
  if (item_type) { params.push(item_type); query += ` AND item_type=$${params.length}`; }
  query += ` ORDER BY ends_at ASC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
  params.push(limit, offset);
  const { rows } = await sb.query(query, params);
  const countQ  = item_type
    ? await sb.query(`SELECT COUNT(*) FROM auctions WHERE status='active' AND item_type=$1`, [item_type])
    : await sb.query(`SELECT COUNT(*) FROM auctions WHERE status='active'`);
  res.json({ success: true, auctions: rows, total: parseInt(countQ.rows[0].count) });
}));

// GET /api/auction/my — kullanıcının artırmaları
router.get('/my', authMiddleware, asyncHandler(async (req, res) => {
  await expireAuctions();
  const { rows } = await sb.query(
    `SELECT * FROM auctions WHERE seller_id=$1 ORDER BY created_at DESC LIMIT 50`,
    [req.user.id]
  );
  res.json({ success: true, auctions: rows });
}));

// GET /api/auction/my-bids — kullanıcının teklif verdiği artırmalar
router.get('/my-bids', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await sb.query(
    `SELECT DISTINCT a.* FROM auctions a
     JOIN auction_bids b ON b.auction_id=a.id
     WHERE b.bidder_id=$1 ORDER BY a.ends_at ASC`,
    [req.user.id]
  );
  res.json({ success: true, auctions: rows });
}));

// GET /api/auction/:id — tek artırma + teklif geçmişi
router.get('/:id', asyncHandler(async (req, res) => {
  const { rows } = await sb.query(`SELECT * FROM auctions WHERE id=$1`, [parseInt(req.params.id)]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Artırma bulunamadı' });
  const { rows: bids } = await sb.query(
    `SELECT * FROM auction_bids WHERE auction_id=$1 ORDER BY created_at DESC LIMIT 20`,
    [parseInt(req.params.id)]
  );
  res.json({ success: true, auction: rows[0], bids });
}));

// POST /api/auction/create — yeni artırma listele
router.post('/create', authMiddleware, asyncHandler(async (req, res) => {
  const { item_type, item_name, item_data = {}, starting_price, buyout_price, duration_hours = 24 } = req.body;
  if (!item_type || !item_name || !starting_price) return res.status(400).json({ success: false, message: 'Eksik alan' });
  if (!['sikke','altin','silah','mermi','esya'].includes(item_type)) return res.status(400).json({ success: false, message: 'Geçersiz eşya türü' });
  const sp   = parseInt(starting_price);
  const bp   = buyout_price ? parseInt(buyout_price) : null;
  const hours = Math.max(1, Math.min(72, parseInt(duration_hours)));
  if (sp < 1) return res.status(400).json({ success: false, message: 'Başlangıç fiyatı en az 1 olmalı' });
  if (bp && bp <= sp) return res.status(400).json({ success: false, message: 'Hemen al fiyatı başlangıç fiyatından yüksek olmalı' });
  const { rows } = await sb.query(
    `INSERT INTO auctions(seller_id,seller_username,item_type,item_name,item_data,starting_price,current_price,buyout_price,ends_at)
     VALUES($1,$2,$3,$4,$5,$6,$6,$7, NOW()+$8::interval) RETURNING *`,
    [req.user.id, req.user.username, item_type, item_name.slice(0,128), item_data, sp, bp, `${hours} hours`]
  );
  res.json({ success: true, auction: rows[0] });
}));

// POST /api/auction/:id/bid — teklif ver
router.post('/:id/bid', authMiddleware, asyncHandler(async (req, res) => {
  const auctionId = parseInt(req.params.id);
  const { amount } = req.body;
  const bid = parseInt(amount);
  if (!bid || bid < 1) return res.status(400).json({ success: false, message: 'Geçersiz teklif' });
  const { rows } = await sb.query(`SELECT * FROM auctions WHERE id=$1 FOR UPDATE`, [auctionId]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Artırma bulunamadı' });
  const a = rows[0];
  if (a.status !== 'active') return res.status(400).json({ success: false, message: 'Artırma aktif değil' });
  if (new Date(a.ends_at) < new Date()) return res.status(400).json({ success: false, message: 'Artırma sona erdi' });
  if (a.seller_id === req.user.id) return res.status(400).json({ success: false, message: 'Kendi artırmana teklif veremezsin' });
  const minBid = Math.ceil(a.current_price * (1 + MIN_BID_STEP));
  if (bid < minBid) return res.status(400).json({ success: false, message: `Minimum teklif: ${minBid} 🪙` });
  // Teklifi kaydet
  await sb.query(
    `INSERT INTO auction_bids(auction_id,bidder_id,bidder_name,amount) VALUES($1,$2,$3,$4)`,
    [auctionId, req.user.id, req.user.username, bid]
  );
  const isBuyout = a.buyout_price && bid >= a.buyout_price;
  await sb.query(
    `UPDATE auctions SET current_price=$1,highest_bidder_id=$2,highest_bidder_name=$3,bid_count=bid_count+1${isBuyout?",status='sold',ends_at=NOW()":''} WHERE id=$4`,
    [isBuyout ? a.buyout_price : bid, req.user.id, req.user.username, auctionId]
  );
  // Socket bildirimi
  try { const io = require('../main').io || global._io; if(io) io.emit('auction:update', { auctionId, newPrice: bid, bidder: req.user.username }); } catch(e){}
  res.json({ success: true, message: isBuyout ? 'Hemen alındı!' : 'Teklifiniz alındı!', buyout: isBuyout });
}));

// POST /api/auction/:id/cancel — artırmayı iptal et (teklif yoksa)
router.post('/:id/cancel', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await sb.query(`SELECT * FROM auctions WHERE id=$1 AND seller_id=$2`, [parseInt(req.params.id), req.user.id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Bulunamadı' });
  if (rows[0].bid_count > 0) return res.status(400).json({ success: false, message: 'Teklif verilmiş artırma iptal edilemez' });
  await sb.query(`UPDATE auctions SET status='cancelled' WHERE id=$1`, [parseInt(req.params.id)]);
  res.json({ success: true });
}));

// POST /api/auction/:id/claim — kazanan ödülü talep et
router.post('/:id/claim', authMiddleware, asyncHandler(async (req, res) => {
  const { rows } = await sb.query(`SELECT * FROM auctions WHERE id=$1`, [parseInt(req.params.id)]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Bulunamadı' });
  const a = rows[0];
  if (a.claimed) return res.status(400).json({ success: false, message: 'Zaten alındı' });
  if (a.status !== 'sold') return res.status(400).json({ success: false, message: 'Artırma tamamlanmadı' });
  const isSeller = a.seller_id === req.user.id;
  const isWinner = a.highest_bidder_id === req.user.id;
  if (!isSeller && !isWinner) return res.status(403).json({ success: false, message: 'Yetkisiz' });
  await sb.query(`UPDATE auctions SET claimed=TRUE WHERE id=$1`, [a.id]);
  res.json({ success: true, auction: a, role: isSeller ? 'seller' : 'winner' });
}));

module.exports = router;
