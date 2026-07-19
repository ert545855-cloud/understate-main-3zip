-- ═══════════════════════════════════════════════════
-- Migration 009: Social & RP Systems
-- Arkadaşlık · Unvan · Ferman · Şikayet · Macera · Fiyat
-- ═══════════════════════════════════════════════════

-- Arkadaşlık sistemi
CREATE TABLE IF NOT EXISTS friendships (
  id         SERIAL PRIMARY KEY,
  user_id    TEXT NOT NULL,
  friend_id  TEXT NOT NULL,
  status     VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);
CREATE INDEX IF NOT EXISTS idx_friends_user   ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend ON friendships(friend_id);

-- Kazanılan unvanlar
CREATE TABLE IF NOT EXISTS user_titles (
  id        SERIAL PRIMARY KEY,
  user_id   TEXT NOT NULL,
  title_id  VARCHAR(100) NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, title_id)
);
CREATE INDEX IF NOT EXISTS idx_titles_user ON user_titles(user_id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_title VARCHAR(100);

-- Ferman sistemi (padişah fermanları)
CREATE TABLE IF NOT EXISTS fermanlar (
  id         SERIAL PRIMARY KEY,
  author_id  TEXT NOT NULL,
  author_name VARCHAR(100),
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  category   VARCHAR(50) NOT NULL DEFAULT 'genel',
  status     VARCHAR(20) NOT NULL DEFAULT 'active',
  likes      INT NOT NULL DEFAULT 0,
  dislikes   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ferman_author ON fermanlar(author_id);
CREATE INDEX IF NOT EXISTS idx_ferman_status ON fermanlar(status);

CREATE TABLE IF NOT EXISTS ferman_reactions (
  id         SERIAL PRIMARY KEY,
  ferman_id  INT NOT NULL,
  user_id    TEXT NOT NULL,
  reaction   VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ferman_id, user_id)
);

-- Şikayet kutusu
CREATE TABLE IF NOT EXISTS sikayetler (
  id             SERIAL PRIMARY KEY,
  user_id        TEXT NOT NULL,
  user_name      VARCHAR(100),
  subject        TEXT NOT NULL,
  content        TEXT NOT NULL,
  category       VARCHAR(50) NOT NULL DEFAULT 'genel',
  status         VARCHAR(20) NOT NULL DEFAULT 'beklemede',
  official_reply TEXT,
  replied_by     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  replied_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_sikayet_user   ON sikayetler(user_id);
CREATE INDEX IF NOT EXISTS idx_sikayet_status ON sikayetler(status);

-- Macera günlüğü
CREATE TABLE IF NOT EXISTS adventure_log (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL,
  event_type  VARCHAR(50) NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  xp_earned   INT NOT NULL DEFAULT 0,
  sikke_earned INT NOT NULL DEFAULT 0,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_advlog_user ON adventure_log(user_id);

-- Fiyat geçmişi (ekonomi grafiği)
CREATE TABLE IF NOT EXISTS price_history (
  id          SERIAL PRIMARY KEY,
  item        VARCHAR(100) NOT NULL,
  price       INT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pricehist_item ON price_history(item);
CREATE INDEX IF NOT EXISTS idx_pricehist_date ON price_history(recorded_at);

-- Grup mesaj odaları
CREATE TABLE IF NOT EXISTS group_messages (
  id         SERIAL PRIMARY KEY,
  room_id    VARCHAR(100) NOT NULL,
  room_name  VARCHAR(100),
  sender_id  TEXT NOT NULL,
  sender_name VARCHAR(100),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_grpmsg_room ON group_messages(room_id);
