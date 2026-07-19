-- ═══════════════════════════════════════════════════════════════════
-- Migration 012 — Başlangıç seed verisi
-- ───────────────────────────────────────────────────────────────────
-- daily_task_templates: Görev sekmesinin içerik göstermesi için gerekli.
-- city_ownership / economy satırları halihazırda 001'de mevcut.
-- ───────────────────────────────────────────────────────────────────

-- ── Günlük Görev Şablonları ───────────────────────────────────────
INSERT INTO daily_task_templates (id, title, description, type, target, reward_money, reward_uc, reward_xp, icon, active) VALUES
  ('login_daily',      'Günlük Giriş',        'Bugün oyuna giriş yap',                      'login',    1,   200,  0,  20, '🌅', true),
  ('chat_5',           'Sohbet Et',           '5 mesaj gönder',                              'chat',     5,   100,  0,  10, '💬', true),
  ('earn_money',       'Para Kazan',          '500 🪙 kazan',                               'earn',     500, 300,  0,  30, '💰', true),
  ('level_up_xp',      'Deneyim Kazan',       '100 XP kazan',                               'xp',       100, 150,  0,  50, '⭐', true),
  ('crime_3',          'Suç İşle',            '3 suç eylemi gerçekleştir',                  'crime',    3,   400,  0,  40, '🔪', true),
  ('market_buy',       'Çarşıdan Al',         'Pazaryerinden 1 ürün satın al',              'market',   1,   250,  0,  25, '🛒', true),
  ('gang_activity',    'Çete Aktivitesi',     'Çete üyesiyle etkileşime gir',               'gang',     1,   300,  0,  30, '⚔️',  true),
  ('factory_collect',  'Atölye Topla',        'Atölye gelirini topla',                       'factory',  1,   500,  0,  50, '🏭', true),
  ('bank_deposit',     'Bankaya Yatır',       'Bankaya en az 100 🪙 yatır',                 'bank',     100, 100,  0,  10, '🏦', true),
  ('social_post',      'İlan Ver',            'Duyuru panosuna ilan yayınla',               'announce', 1,   200,  0,  20, '📢', true),
  ('attack_region',    'Bölge Saldırısı',     'Bir bölgeye saldır',                         'region',   1,   600,  0,  60, '🏰', true),
  ('send_gift',        'Hediye Gönder',       'Bir arkadaşına hediye gönder',               'gift',     1,   150,  0,  15, '🎁', true),
  ('tavern_visit',     'Meyhane Ziyareti',    'Meyhaneye bir kez git',                      'tavern',   1,   100,  0,  10, '🍺', true),
  ('duel_attempt',     'Düello',              'Birini düelloya davet et',                   'duel',     1,   800,  0,  80, '🗡️',  true),
  ('marketplace_sell', 'Ürün Sat',            'Pazaryerinde 1 ürün listele',                'market_sell',1, 300,  0,  30, '💼', true)
ON CONFLICT (id) DO NOTHING;

-- ── Ekonomi ana satırı (zaten var ama güvence için) ───────────────
INSERT INTO economy (id, data) VALUES ('main', '{}') ON CONFLICT DO NOTHING;

-- ── Başlangıç şehir vergileri (zaten var ama güvence için) ────────
INSERT INTO city_taxes (city, rate) VALUES
  ('İstanbul',  12), ('Ankara',    10), ('İzmir',     10),
  ('Bursa',      8), ('Antalya',    8), ('Adana',      8),
  ('Trabzon',    7), ('Konya',      7), ('Gaziantep',  7),
  ('Samsun',     6)
ON CONFLICT DO NOTHING;
