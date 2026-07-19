/**
 * Admin Supabase REST API Rotaları  — /api/admin/sb/
 *
 * Supabase JS client'ın .from() (PostgREST) API'sini kullanır.
 * Tüm rotalar adminOnly middleware gerektirir.
 *
 * Endpoint'ler:
 *   GET    /api/admin/sb/stats             — Dashboard istatistikleri
 *   GET    /api/admin/sb/users             — Kullanıcı listesi (sayfalama + arama)
 *   GET    /api/admin/sb/users/:id         — Kullanıcı detayı
 *   PUT    /api/admin/sb/users/:id         — Kullanıcı güncelle
 *   DELETE /api/admin/sb/users/:id         — Kullanıcı sil
 *   POST   /api/admin/sb/users/:id/freeze  — Kullanıcıyı dondur / çöz
 *   POST   /api/admin/sb/users/:id/ban     — Kullanıcıyı yasakla / affet
 *   GET    /api/admin/sb/table/:table      — Genel tablo görüntüleyici
 */

const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler }   = require('../middleware/asyncHandler');
const { supabaseAdmin }  = require('../services/supabaseService');
const logger             = require('../utils/logger');

/* ── Admin yetki kontrolü ──────────────────────────────────────── */
function adminOnly(req, res, next) {
  const admins = (process.env.ADMIN_USERS || 'admin').split(',').map(s => s.trim());
  if (!admins.includes(req.user?.username) && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Yetki yok' });
  }
  next();
}

/* ── Supabase kontrolü ─────────────────────────────────────────── */
function sbCheck(req, res, next) {
  if (!supabaseAdmin) return res.status(503).json({ success: false, message: 'Supabase servisi aktif değil (SUPABASE_SERVICE_KEY eksik)' });
  next();
}

const guard = [authMiddleware, adminOnly, sbCheck];

/* ── STATS ─────────────────────────────────────────────────────── */
router.get('/stats', guard, asyncHandler(async (_req, res) => {
  const [users, online, gangs, parties, warLogs, beylikWars, auctions] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('is_online', true),
    supabaseAdmin.from('gangs').select('*',  { count: 'exact', head: true }),
    supabaseAdmin.from('parties').select('*',{ count: 'exact', head: true }),
    supabaseAdmin.from('war_logs').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('beylik_wars').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('auctions').select('*', { count: 'exact', head: true }),
  ]);

  const { data: topUsers } = await supabaseAdmin
    .from('users')
    .select('id, username, money, level, war_elo, war_league, city')
    .order('money', { ascending: false })
    .limit(10);

  const { data: recentUsers } = await supabaseAdmin
    .from('users')
    .select('id, username, city, level, created_at, last_seen, is_online')
    .order('created_at', { ascending: false })
    .limit(10);

  res.json({
    success: true,
    stats: {
      totalUsers:   users.count      ?? 0,
      onlineUsers:  online.count     ?? 0,
      totalGangs:   gangs.count      ?? 0,
      totalParties: parties.count    ?? 0,
      totalWarLogs: warLogs.count    ?? 0,
      beylikWars:   beylikWars.count ?? 0,
      auctions:     auctions.count   ?? 0,
    },
    topUsers:    topUsers    ?? [],
    recentUsers: recentUsers ?? [],
  });
}));

/* ── USERS — Liste ─────────────────────────────────────────────── */
router.get('/users', guard, asyncHandler(async (req, res) => {
  const page   = Math.max(0, parseInt(req.query.page)  || 0);
  const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const search = (req.query.search || '').trim();
  const role   = req.query.role || '';
  const banned = req.query.banned;   // 'true' | 'false' | ''

  let q = supabaseAdmin
    .from('users')
    .select(
      'id, username, email, level, money, altin, role, banned, ban_reason, city, ' +
      'created_at, last_seen, is_online, war_elo, war_league, fame_score, premium, is_frozen',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  if (search) q = q.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
  if (role)   q = q.eq('role', role);
  if (banned === 'true')  q = q.eq('banned', true);
  if (banned === 'false') q = q.eq('banned', false);

  const { data, error, count } = await q;
  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, users: data ?? [], total: count ?? 0, page });
}));

/* ── USERS — Detay ─────────────────────────────────────────────── */
router.get('/users/:id', guard, asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('users').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
  // Hassas alanları kaldır
  const safe = { ...data };
  ['password_hash','reset_token','email_verify_token','refresh_token'].forEach(k => delete safe[k]);
  res.json({ success: true, user: safe });
}));

/* ── USERS — Güncelle ──────────────────────────────────────────── */
const EDITABLE_FIELDS = ['money','level','xp','role','city','premium','altin',
  'fame_score','war_elo','itibar_score','loyalty_points','merit_points'];

router.put('/users/:id', guard, asyncHandler(async (req, res) => {
  const updates = {};
  for (const k of EDITABLE_FIELDS) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }
  if (!Object.keys(updates).length)
    return res.status(400).json({ success: false, message: 'Güncellenecek alan yok' });

  const { data, error } = await supabaseAdmin
    .from('users').update(updates).eq('id', req.params.id)
    .select('id, username, level, money, role').single();
  if (error) return res.status(500).json({ success: false, message: error.message });

  logger.info(`[AdminSB] Kullanıcı güncellendi: ${req.params.id} ← ${req.user.username}`);
  res.json({ success: true, user: data });
}));

/* ── USERS — Dondur / çöz ──────────────────────────────────────── */
router.post('/users/:id/freeze', guard, asyncHandler(async (req, res) => {
  const { freeze, reason } = req.body;
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ is_frozen: !!freeze, freeze_reason: freeze ? (reason || '') : null })
    .eq('id', req.params.id)
    .select('id, username, is_frozen').single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  logger.info(`[AdminSB] Kullanıcı ${freeze ? 'donduruldu' : 'çözüldü'}: ${req.params.id}`);
  res.json({ success: true, user: data });
}));

/* ── USERS — Yasakla / affet ───────────────────────────────────── */
router.post('/users/:id/ban', guard, asyncHandler(async (req, res) => {
  const { ban, reason } = req.body;
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ banned: !!ban, ban_reason: ban ? (reason || 'Kural ihlali') : null })
    .eq('id', req.params.id)
    .select('id, username, banned').single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  logger.info(`[AdminSB] Kullanıcı ${ban ? 'yasaklandı' : 'affedildi'}: ${req.params.id}`);
  res.json({ success: true, user: data });
}));

/* ── USERS — Sil ───────────────────────────────────────────────── */
router.delete('/users/:id', guard, asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id)
    return res.status(400).json({ success: false, message: 'Kendinizi silemezsiniz' });
  const { error } = await supabaseAdmin.from('users').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ success: false, message: error.message });
  logger.info(`[AdminSB] Kullanıcı silindi: ${req.params.id} ← ${req.user.username}`);
  res.json({ success: true });
}));

/* ── GENERIC TABLE VIEWER ──────────────────────────────────────── */
const ALLOWED_TABLES = new Set([
  'gangs','parties','alliances','elections','laws','announcements',
  'war_logs','beylik_wars','auctions','marketplace_listings','loans',
  'tournaments','duels','sieges','region_control','diplomasi_sozlesmeler',
  'cabinet','fermanlar','parliament_bills','game_events',
]);

router.get('/table/:table', guard, asyncHandler(async (req, res) => {
  const { table } = req.params;
  if (!ALLOWED_TABLES.has(table))
    return res.status(400).json({ success: false, message: 'Bu tabloya erişim kapalı' });

  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const { data, error } = await supabaseAdmin
    .from(table)
    .select('*')
    .order('created_at', { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, rows: data ?? [], table });
}));

module.exports = router;
