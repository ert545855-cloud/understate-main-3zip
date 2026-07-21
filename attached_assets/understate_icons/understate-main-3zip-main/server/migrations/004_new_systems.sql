-- ═══════════════════════════════════════════════════════════════
-- 004_new_systems.sql — Schema düzeltme + Artırma, Kervan, Sefer, Başarım
-- ═══════════════════════════════════════════════════════════════

-- ── Schema drift düzeltmesi: under_coin → altin alias ────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS altin BIGINT NOT NULL DEFAULT 0;
-- Mevcut under_coin değerlerini taşı (altin sıfırsa)
UPDATE users SET altin = under_coin WHERE altin = 0 AND under_coin > 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS alliance_id INTEGER;

-- ── Açık Artırma ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auctions (
  id                    SERIAL PRIMARY KEY,
  seller_id             INTEGER NOT NULL,
  seller_username       VARCHAR(64) NOT NULL,
  item_type             VARCHAR(32) NOT NULL,  -- 'sikke','altin','silah','mermi','esya'
  item_name             VARCHAR(128) NOT NULL,
  item_data             JSONB NOT NULL DEFAULT '{}',
  starting_price        BIGINT NOT NULL DEFAULT 100,
  current_price         BIGINT NOT NULL DEFAULT 100,
  buyout_price          BIGINT,
  highest_bidder_id     INTEGER,
  highest_bidder_name   VARCHAR(64),
  bid_count             INTEGER NOT NULL DEFAULT 0,
  ends_at               TIMESTAMPTZ NOT NULL,
  status                VARCHAR(16) NOT NULL DEFAULT 'active', -- 'active','sold','expired','cancelled'
  claimed               BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auctions_status   ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_ends_at  ON auctions(ends_at);
CREATE INDEX IF NOT EXISTS idx_auctions_seller   ON auctions(seller_id);

-- ── Açık Artırma Teklif Geçmişi ──────────────────────────────
CREATE TABLE IF NOT EXISTS auction_bids (
  id          SERIAL PRIMARY KEY,
  auction_id  INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  bidder_id   INTEGER NOT NULL,
  bidder_name VARCHAR(64) NOT NULL,
  amount      BIGINT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction ON auction_bids(auction_id);

-- ── Kervan / Ticaret Yolları ──────────────────────────────────
CREATE TABLE IF NOT EXISTS caravans (
  id               SERIAL PRIMARY KEY,
  owner_id         INTEGER NOT NULL,
  owner_username   VARCHAR(64) NOT NULL,
  gang_id          INTEGER,
  origin           VARCHAR(64) NOT NULL,
  destination      VARCHAR(64) NOT NULL,
  cargo_type       VARCHAR(32) NOT NULL,  -- 'tahil','baharat','kumas','maden','ipek'
  cargo_amount     INTEGER NOT NULL DEFAULT 100,
  income           BIGINT NOT NULL DEFAULT 500,
  status           VARCHAR(16) NOT NULL DEFAULT 'travelling', -- 'travelling','arrived','raided','collected'
  departs_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  arrives_at       TIMESTAMPTZ NOT NULL,
  collected_at     TIMESTAMPTZ,
  raider_id        INTEGER,
  raider_username  VARCHAR(64),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_caravans_owner  ON caravans(owner_id);
CREATE INDEX IF NOT EXISTS idx_caravans_status ON caravans(status);
CREATE INDEX IF NOT EXISTS idx_caravans_arrives ON caravans(arrives_at);

-- ── Seferler / Kampanyalar ────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(128) NOT NULL,
  description       TEXT,
  organizer_id      INTEGER NOT NULL,
  organizer_name    VARCHAR(64) NOT NULL,
  alliance_id       INTEGER,
  target_name       VARCHAR(128) NOT NULL,
  target_power      INTEGER NOT NULL DEFAULT 1000,
  participant_power INTEGER NOT NULL DEFAULT 0,
  participants      JSONB NOT NULL DEFAULT '[]',
  status            VARCHAR(16) NOT NULL DEFAULT 'recruiting', -- 'recruiting','active','victory','defeat','cancelled'
  reward_sikke      BIGINT NOT NULL DEFAULT 0,
  reward_xp         INTEGER NOT NULL DEFAULT 0,
  reward_merits     INTEGER NOT NULL DEFAULT 0,
  starts_at         TIMESTAMPTZ NOT NULL,
  ends_at           TIMESTAMPTZ NOT NULL,
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_campaigns_status   ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_alliance ON campaigns(alliance_id);

-- ── Başarım / Rozet Kayıtları ──────────────────────────────────
CREATE TABLE IF NOT EXISTS user_achievements (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL,
  achievement_id VARCHAR(64) NOT NULL,
  earned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON user_achievements(user_id);
