// ═══════════════════════════════════════════════════════════════
// Lonca Ticaret Anlaşmaları — /api/lonca-anlasma
// ═══════════════════════════════════════════════════════════════
const express = require('express');
const router  = express.Router();
const { asyncHandler }   = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/authMiddleware');
const db = require('../services/dbService');

const GOODS = ['Kumaş','Deri','Seramik','Baharat','Tahıl','Kereste','Demir','Altın','Mermer','İpek'];

// GET /api/lonca-anlasma — açık anlaşmalar (kullanıcı kendi + gelen teklifler)
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  // Süresi dolmuşları iptal et
  await db.query(`UPDATE lonca_anlasmalari SET status='expired' WHERE status='pending' AND expires_at < NOW()`);

  const { rows: mine }     = await db.query(
    `SELECT * FROM lonca_anlasmalari WHERE proposer_id=$1 ORDER BY created_at DESC LIMIT 20`, [req.user.id]
  );
  const { rows: incoming } = await db.query(
    `SELECT * FROM lonca_anlasmalari WHERE partner_id=$1 AND status='pending' ORDER BY created_at DESC LIMIT 20`, [req.user.id]
  );
  const { rows: open }     = await db.query(
    `SELECT la.*, u.username as proposer_username FROM lonca_anlasmalari la
     JOIN users u ON u.id=la.proposer_id
     WHERE la.status='pending' AND la.partner_id IS NULL AND la.proposer_id!=$1
     ORDER BY la.created_at DESC LIMIT 30`, [req.user.id]
  );

  res.json({ success: true, mine, incoming, open, goods: GOODS });
}));

// POST /api/lonca-anlasma/propose — anlaşma teklif et
router.post('/propose', authMiddleware, asyncHandler(async (req, res) => {
  const { goods_offered, amount_offered, goods_requested, amount_requested, partner_id, notes } = req.body;
  if (!goods_offered || !goods_requested) return res.status(400).json({ success: false, message: 'Mal bilgisi gerekli' });
  if (!GOODS.includes(goods_offered) || !GOODS.includes(goods_requested)) {
    return res.status(400).json({ success: false, message: 'Geçersiz mal türü' });
  }

  let partnerName = null;
  if (partner_id) {
    const { rows: p } = await db.query(`SELECT username FROM users WHERE id=$1`, [partner_id]);
    if (!p.length) return res.status(400).json({ success: false, message: 'Kullanıcı bulunamadı' });
    partnerName = p[0].username;
  }

  const expiresAt = new Date(Date.now() + 48 * 3600000); // 48 saat
  const { rows } = await db.query(
    `INSERT INTO lonca_anlasmalari(proposer_id, proposer_name, partner_id, partner_name,
       goods_offered, amount_offered, goods_requested, amount_requested, notes, expires_at)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [req.user.id, req.user.username, partner_id||null, partnerName,
     goods_offered, amount_offered||1, goods_requested, amount_requested||1, notes||null, expiresAt]
  );

  // Socket bildirim
  try {
    const io = global._io;
    if (io && partner_id) io.to(`user_${partner_id}`).emit('lonca:proposal', { from: req.user.username, deal: rows[0] });
  } catch(_) {}

  res.json({ success: true, deal: rows[0] });
}));

// POST /api/lonca-anlasma/:id/accept — anlaşmayı kabul et
router.post('/:id/accept', authMiddleware, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { rows } = await db.query(`SELECT * FROM lonca_anlasmalari WHERE id=$1 FOR UPDATE`, [id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Anlaşma bulunamadı' });

  const deal = rows[0];
  if (deal.status !== 'pending') return res.status(400).json({ success: false, message: 'Bu anlaşma artık geçerli değil' });
  if (deal.expires_at < new Date()) return res.status(400).json({ success: false, message: 'Anlaşma süresi doldu' });

  // Eğer belirli bir partner belirlenmediyse, bu kullanıcı partner olsun
  const partnerId = deal.partner_id || req.user.id;
  if (partnerId === deal.proposer_id) return res.status(400).json({ success: false, message: 'Kendi teklifinizi kabul edemezsiniz' });

  await db.query(
    `UPDATE lonca_anlasmalari SET status='accepted', partner_id=$1, partner_name=$2, completed_at=NOW() WHERE id=$3`,
    [partnerId, req.user.username, id]
  );

  // Her iki tarafı XP ile ödüllendir
  const xpReward = 50;
  await db.query(`UPDATE users SET xp=xp+$1 WHERE id IN ($2,$3)`, [xpReward, deal.proposer_id, partnerId]);

  try {
    const io = global._io;
    if (io) {
      io.to(`user_${deal.proposer_id}`).emit('lonca:accepted', { partner: req.user.username, deal_id: id });
    }
  } catch(_) {}

  res.json({ success: true, xp_reward: xpReward });
}));

// POST /api/lonca-anlasma/:id/reject — anlaşmayı reddet
router.post('/:id/reject', authMiddleware, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  await db.query(
    `UPDATE lonca_anlasmalari SET status='rejected' WHERE id=$1 AND (partner_id=$2 OR proposer_id=$2)`,
    [id, req.user.id]
  );
  res.json({ success: true });
}));

module.exports = router;
