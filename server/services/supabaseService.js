/**
 * Supabase Service — Admin client (service_role) + public client (anon key)
 *
 * Kullanım:
 *   const { supabaseAdmin, supabasePublic, SUPABASE_URL, ANON_KEY } = require('./supabaseService');
 *
 *   // Table API (REST):
 *   const { data, error } = await supabaseAdmin.from('users').select('*').eq('id', userId);
 *
 *   // Storage:
 *   await supabaseAdmin.storage.from('saltanat-avatars').upload(path, buffer, { upsert: true });
 *
 *   // Realtime: → server/socket/realtimeBridge.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zrablcffjvqtmlhwgpme.supabase.co';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;
const ANON_KEY     = process.env.SUPABASE_ANON_KEY || '';

if (!SERVICE_KEY) {
  console.warn('[Supabase] ⚠️  SUPABASE_SERVICE_KEY tanımlı değil — Supabase özellikleri pasif.');
}

/** Sunucu tarafı tam yetkili istemci (service_role — hiçbir zaman frontend'e verme!) */
const supabaseAdmin = SERVICE_KEY
  ? createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { 'x-client-info': 'saltanat-server/1.0' } },
    })
  : null;

/** Frontend için public istemci (anon key — RLS geçerli) */
const supabasePublic = ANON_KEY
  ? createClient(SUPABASE_URL, ANON_KEY)
  : null;

/**
 * Supabase Storage bucket'ı yoksa oluşturur.
 * Server start-up sırasında çağrılır.
 */
async function ensureStorageBucket() {
  if (!supabaseAdmin) return;
  const BUCKET = 'saltanat-avatars';
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 2 * 1024 * 1024,                          // 2 MB
    allowedMimeTypes: ['image/jpeg','image/png','image/webp','image/gif'],
  });
  if (!error || error.message?.toLowerCase().includes('already exist')) {
    console.log(`[OK] Supabase Storage bucket hazır: ${BUCKET}`);
  } else {
    console.warn('[Storage] Bucket uyarısı:', error.message);
  }
}

module.exports = { supabaseAdmin, supabasePublic, SUPABASE_URL, ANON_KEY, ensureStorageBucket };
