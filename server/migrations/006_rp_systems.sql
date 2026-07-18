-- ═══════════════════════════════════════════════════════
-- Migration 006: RP Systems
-- ═══════════════════════════════════════════════════════

-- ── Users yeni kolonlar ──────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS origin       TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS traits       JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS itibar_score INTEGER DEFAULT 100;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trade_banned_until TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tavern_table INTEGER DEFAULT NULL;

-- ── Karakter Geçmişi (Köken) ─────────────────────────────
CREATE TABLE IF NOT EXISTS character_origins (
  id          TEXT PRIMARY KEY,
  name        TEXT,
  description TEXT,
  bonus_money INTEGER DEFAULT 0,
  bonus_xp    INTEGER DEFAULT 0,
  bonus_trait TEXT,
  emoji       TEXT
);

INSERT INTO character_origins VALUES
  ('anadolu_koylusu', 'Anadolu Köylüsü', 'Toprağa bağlı, çalışkan ve dayanıklı.', 500, 50, 'cömert', '🌾'),
  ('istanbul_esnafi', 'İstanbul Esnafı', 'Ticaret bilgisi yüksek, pazarlığa alışkın.', 1000, 30, 'kurnaz', '🛒'),
  ('balkan_askeri',   'Balkan Askeri',   'Savaşta deneyimli, güçlü ve kararlı.',    200,  80, 'zalim', '⚔️'),
  ('bedevi_tuccar',   'Bedevi Tüccar',   'Uzak yollar bilen, kervan ustası.',       800,  40, 'karizmatik', '🐪')
ON CONFLICT (id) DO NOTHING;

-- ── Karakter Özellikleri (Sıfatlar) ──────────────────────
CREATE TABLE IF NOT EXISTS trait_definitions (
  id          TEXT PRIMARY KEY,
  name        TEXT,
  description TEXT,
  cost_xp     INTEGER DEFAULT 500,
  emoji       TEXT,
  effect_key  TEXT,
  effect_val  INTEGER
);

INSERT INTO trait_definitions VALUES
  ('karizmatik', 'Karizmatik', 'Ticaret müzakere bonusu +15%, şöhret kazanımı +20%.', 500, '🌟', 'trade_bonus', 15),
  ('zalim',      'Zalim',      'Suç cezası -30%, saldırı gücü +10%.',                 500, '⚡', 'crime_discount', 30),
  ('bilge',      'Bilge',      'XP kazanımı +20%, saray kartı efektleri +50%.',       600, '📖', 'xp_bonus', 20),
  ('comert',     'Cömert',     'Hediye gönderme limiti +50%, itibar kaybı -50%.',     400, '🤝', 'gift_limit', 50),
  ('kurnaz',     'Kurnaz',     'Pazar alışverişinde %10 gizli indirim, ELO +25 başlangıç.', 550, '🦊', 'market_discount', 10)
ON CONFLICT (id) DO NOTHING;

-- ── Ruzname (Günlük) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS ruzname_entries (
  id         SERIAL PRIMARY KEY,
  user_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
  username   TEXT,
  content    TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  entry_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

CREATE TABLE IF NOT EXISTS ruzname_likes (
  id       SERIAL PRIMARY KEY,
  entry_id INTEGER REFERENCES ruzname_entries(id) ON DELETE CASCADE,
  user_id  TEXT REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(entry_id, user_id)
);

-- ── Lonca Hanı Mesajları ──────────────────────────────────
CREATE TABLE IF NOT EXISTS guild_hall_messages (
  id        SERIAL PRIMARY KEY,
  guild_id  TEXT NOT NULL,
  user_id   TEXT REFERENCES users(id) ON DELETE CASCADE,
  username  TEXT,
  content   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Meyhane / Kahvehane ───────────────────────────────────
CREATE TABLE IF NOT EXISTS tavern_tables (
  table_no    INTEGER PRIMARY KEY,
  name        TEXT,
  capacity    INTEGER DEFAULT 4,
  description TEXT
);

INSERT INTO tavern_tables VALUES
  (1, 'Köşe Masası',     4, 'Sessiz ve gizli. Fısıltılar buradan yükselir.'),
  (2, 'Ocak Başı',       6, 'Sıcak ateşin yanında sohbet edilir.'),
  (3, 'Pencere Yanı',    4, 'Şehiri izlerken kahve içilir.'),
  (4, 'Büyük Orta Masa', 8, 'Kalabalık toplantılar için.'),
  (5, 'Balkon Masası',   4, 'Hava güzelse en iyi yer.')
ON CONFLICT (table_no) DO NOTHING;

CREATE TABLE IF NOT EXISTS tavern_messages (
  id        SERIAL PRIMARY KEY,
  table_no  INTEGER REFERENCES tavern_tables(table_no),
  user_id   TEXT REFERENCES users(id) ON DELETE CASCADE,
  username  TEXT,
  order_item TEXT,  -- null = normal message
  content   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Mektup Sistemi ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS letters (
  id          SERIAL PRIMARY KEY,
  sender_id   TEXT REFERENCES users(id) ON DELETE CASCADE,
  sender_name TEXT,
  receiver_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  subject     TEXT,
  content     TEXT NOT NULL,
  sealed      BOOLEAN DEFAULT true,
  read        BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── İtibar & Yaptırım ────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_reports (
  id           SERIAL PRIMARY KEY,
  reporter_id  TEXT REFERENCES users(id) ON DELETE CASCADE,
  reported_id  TEXT REFERENCES users(id) ON DELETE CASCADE,
  reason       TEXT,
  status       TEXT DEFAULT 'voting',  -- 'voting'|'guilty'|'innocent'|'expired'
  guilty_votes INTEGER DEFAULT 0,
  innocent_votes INTEGER DEFAULT 0,
  expires_at   TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_votes (
  id        SERIAL PRIMARY KEY,
  report_id INTEGER REFERENCES community_reports(id) ON DELETE CASCADE,
  voter_id  TEXT REFERENCES users(id) ON DELETE CASCADE,
  vote      TEXT,  -- 'guilty'|'innocent'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id, voter_id)
);

-- ── Pazar Günü Etkinlikleri ──────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_market_events (
  id          SERIAL PRIMARY KEY,
  market_date DATE UNIQUE,
  status      TEXT DEFAULT 'scheduled',  -- 'scheduled'|'active'|'ended'
  items       JSONB DEFAULT '[]',
  started_at  TIMESTAMPTZ,
  ended_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS market_purchases (
  id         SERIAL PRIMARY KEY,
  event_id   INTEGER REFERENCES weekly_market_events(id) ON DELETE CASCADE,
  user_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
  item_id    TEXT,
  item_name  TEXT,
  price      INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
