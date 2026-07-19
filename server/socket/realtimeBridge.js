/**
 * Supabase Realtime → Socket.IO Köprüsü
 *
 * Supabase'in Postgres Change akışını dinler, olayları Socket.IO
 * aracılığıyla bağlı istemcilere iletir.
 *
 * Tablo → socket event eşlemesi:
 *   users                → 'user:updated'
 *   war_logs             → 'war:newlog'
 *   gangs                → 'gangUpdate'
 *   parties              → 'partyUpdate'
 *   beylik_wars          → 'beylik_war:update'
 *   announcements        → 'announcement:new'
 *   marketplace_listings → 'market:update'
 *   region_control       → 'region:update'
 *   elections            → 'election:update'
 *   auctions             → 'auction:update'
 *   laws                 → 'law:update'
 */

const TABLE_EVENTS = {
  users:                'user:updated',
  war_logs:             'war:newlog',
  gangs:                'gangUpdate',
  parties:              'partyUpdate',
  beylik_wars:          'beylik_war:update',
  announcements:        'announcement:new',
  marketplace_listings: 'market:update',
  region_control:       'region:update',
  elections:            'election:update',
  auctions:             'auction:update',
  laws:                 'law:update',
};

let _channel = null;

/**
 * Tabloları supabase_realtime yayınına ekler.
 * "already member" hataları sessizce geçilir.
 */
async function _enableRealtimeTables() {
  try {
    const db = require('../services/dbService');
    const tables = Object.keys(TABLE_EVENTS).join(', ');
    await db.query(`ALTER PUBLICATION supabase_realtime ADD TABLE ${tables}`);
    console.log('[Realtime] Tablolar yayına eklendi');
  } catch (e) {
    const msg = e.message || '';
    // Tablo zaten üye ise hata beklenen — görmezden gel
    if (!msg.includes('already member') && !msg.includes('already exists')) {
      console.warn('[Realtime] Publication uyarısı:', msg);
    }
  }
}

/**
 * Realtime bridge'i başlatır.
 * @param {import('socket.io').Server} io
 * @returns {import('@supabase/supabase-js').RealtimeChannel | null}
 */
async function initRealtimeBridge(io) {
  const { supabaseAdmin } = require('../services/supabaseService');
  if (!supabaseAdmin) {
    console.warn('[Realtime] supabaseAdmin yok — bridge atlandı.');
    return null;
  }

  // Tabloları yayına ekle
  await _enableRealtimeTables();

  const channel = supabaseAdmin.channel('saltanat-db-changes');

  for (const [table, event] of Object.entries(TABLE_EVENTS)) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      (payload) => {
        const data = {
          type:  payload.eventType,   // INSERT | UPDATE | DELETE
          new:   payload.new  ?? null,
          old:   payload.old  ?? null,
          table,
        };

        // Kullanıcı güncellemelerini sadece ilgili odaya gönder
        if (table === 'users' && data.new?.id) {
          io.to(`user_${data.new.id}`).emit(event, data);
        } else {
          io.emit(event, data);
        }
      }
    );
  }

  channel.subscribe((status, err) => {
    if (status === 'SUBSCRIBED') {
      console.log('[OK] Supabase Realtime bridge aktif — ' + Object.keys(TABLE_EVENTS).join(', '));
    } else if (status === 'CHANNEL_ERROR') {
      console.error('[Realtime] Kanal hatası:', err?.message);
    } else if (status === 'TIMED_OUT') {
      console.warn('[Realtime] Zaman aşımı — yeniden deneniyor…');
    }
  });

  _channel = channel;
  return channel;
}

/** Bridge'i kapatır (graceful shutdown) */
function closeRealtimeBridge() {
  if (_channel) {
    _channel.unsubscribe().catch(() => {});
    _channel = null;
  }
}

module.exports = { initRealtimeBridge, closeRealtimeBridge };
