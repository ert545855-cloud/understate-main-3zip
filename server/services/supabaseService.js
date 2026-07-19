/**
 * Supabase Service
 *
 * İki sorumluluk:
 * 1. supabaseAdmin (service_role) + supabasePublic (anon) client'larını sağlar
 * 2. Tüm dbService metotlarını yeniden ihraç eder — böylece authController,
 *    socket handlers ve diğer dosyalar bu dosyayı tam bir DB katmanı olarak
 *    kullanmaya devam edebilir (geriye dönük uyumluluk).
 *
 * Kullanım örnekleri:
 *   const sb = require('./supabaseService');
 *   sb.isReady()                          // dbService.isReady() delegate
 *   sb.findUserById(id)                   // dbService.findUserById()
 *   sb.supabaseAdmin.from('users')...     // REST API doğrudan
 *   sb.supabaseAdmin.storage.from('...') // Storage
 */

'use strict';

// ── Node.js 18 için WebSocket polyfill ────────────────────────────────────────
if (typeof WebSocket === 'undefined') {
  global.WebSocket = require('ws').WebSocket;
}

const { createClient } = require('@supabase/supabase-js');

// ── Ortam değişkenleri ────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zrablcffjvqtmlhwgpme.supabase.co';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;
const ANON_KEY     = process.env.SUPABASE_ANON_KEY || '';

if (!SERVICE_KEY) {
  console.warn('[Supabase] ⚠️  SUPABASE_SERVICE_KEY tanımlı değil — Supabase özellikleri pasif.');
}

// ── İstemciler ────────────────────────────────────────────────────────────────
/** Sunucu tarafı tam yetkili istemci (service_role) */
const supabaseAdmin = SERVICE_KEY
  ? createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { 'x-client-info': 'saltanat-server/1.0' } },
    })
  : null;

/** Frontend için anon istemci (RLS geçerli) */
const supabasePublic = ANON_KEY
  ? createClient(SUPABASE_URL, ANON_KEY)
  : null;

// ── Storage bucket oluştur ────────────────────────────────────────────────────
async function ensureStorageBucket() {
  if (!supabaseAdmin) return;
  const BUCKET = 'saltanat-avatars';
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 2 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  });
  if (!error || error.message?.toLowerCase().includes('already exist')) {
    console.log(`[OK] Supabase Storage bucket hazır: ${BUCKET}`);
  } else {
    console.warn('[Storage] Bucket uyarısı:', error.message);
  }
}

// ── dbService'i yeniden ihraç et (geriye dönük uyumluluk) ────────────────────
// authController, socket/index, chatHandler, saveService, leaderboardService vs.
// bu dosyayı require ederek isReady(), findUserById(), updateUser(), query() vs.
// kullanır. Tüm bu metodlar dbService'te mevcut — burada yeniden ihraç ediyoruz.
const db = require('./dbService');

module.exports = {
  // ── Tüm dbService metotları ──────────────────────────────────────────────
  ...db,

  // ── Supabase'e özgü ──────────────────────────────────────────────────────
  supabaseAdmin,
  supabasePublic,
  ensureStorageBucket,

  // SUPABASE_URL ve ANON_KEY: dbService'teki boş string'leri override et
  SUPABASE_URL,
  ANON_KEY,
  SUPABASE_ANON_KEY: ANON_KEY,   // dbService uyumluluğu için alias
};
