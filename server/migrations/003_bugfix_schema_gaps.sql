-- UNDERSTATE — Migration 003: Şema eksiklerini tamamla (register/login/bank/2FA/vergi/etkinlik/vs. hataları)
-- Çalıştır: psql $DATABASE_URL -f server/migrations/003_bugfix_schema_gaps.sql
-- Güvenli: IF NOT EXISTS kullanır, tekrar çalıştırılabilir.

-- ── USERS: eksik sütunlar ─────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code       TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar              TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url          TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS presidency_until    TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_frozen           BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS freeze_reason       TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank                BIGINT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium             BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_bank_interest  TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code) WHERE referral_code IS NOT NULL;

-- ── TWO FACTOR AUTH: eksik sütun ──────────────────────────────────────────────
ALTER TABLE two_factor_auth ADD COLUMN IF NOT EXISTS backup_codes JSONB NOT NULL DEFAULT '[]';

-- ── MONEY TRANSFERS: eksik sütunlar ───────────────────────────────────────────
ALTER TABLE money_transfers ADD COLUMN IF NOT EXISTS fee           BIGINT NOT NULL DEFAULT 0;
ALTER TABLE money_transfers ADD COLUMN IF NOT EXISTS message       TEXT;
ALTER TABLE money_transfers ADD COLUMN IF NOT EXISTS transfer_type TEXT NOT NULL DEFAULT 'player';

-- ── CITY TAXES: eksik sütunlar ────────────────────────────────────────────────
ALTER TABLE city_taxes ADD COLUMN IF NOT EXISTS income_tax_rate   NUMERIC(5,2) NOT NULL DEFAULT 0;
ALTER TABLE city_taxes ADD COLUMN IF NOT EXISTS trade_tax_rate    NUMERIC(5,2) NOT NULL DEFAULT 0;
ALTER TABLE city_taxes ADD COLUMN IF NOT EXISTS property_tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0;
ALTER TABLE city_taxes ADD COLUMN IF NOT EXISTS last_updated      TIMESTAMPTZ NOT NULL DEFAULT now();

-- ── TIMED EVENTS: eksik sütun ─────────────────────────────────────────────────
ALTER TABLE timed_events ADD COLUMN IF NOT EXISTS rewards JSONB NOT NULL DEFAULT '{}';

-- ── YENİ TABLOLAR ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS support_messages (
  id         TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  user_id    TEXT,
  username   TEXT,
  message    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_messages_user ON support_messages(user_id);

CREATE TABLE IF NOT EXISTS tenders (
  id              TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  title           TEXT NOT NULL,
  description     TEXT DEFAULT '',
  category        TEXT DEFAULT 'general',
  start_bid       BIGINT NOT NULL DEFAULT 0,
  current_bid     BIGINT NOT NULL DEFAULT 0,
  current_bidder  TEXT,
  bids            JSONB NOT NULL DEFAULT '[]',
  status          TEXT NOT NULL DEFAULT 'active',
  data            JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_cooldowns (
  user_id      TEXT NOT NULL,
  job_id       TEXT NOT NULL,
  last_done_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, job_id)
);

CREATE TABLE IF NOT EXISTS stock_market (
  company_id    TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  share_price   BIGINT NOT NULL DEFAULT 0,
  change        BIGINT NOT NULL DEFAULT 0,
  change_pct    NUMERIC(6,2) NOT NULL DEFAULT 0,
  volume        BIGINT NOT NULL DEFAULT 0,
  high          BIGINT NOT NULL DEFAULT 0,
  low           BIGINT NOT NULL DEFAULT 0,
  price_history JSONB NOT NULL DEFAULT '[]',
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gang_war_logs (
  id                SERIAL PRIMARY KEY,
  attacker_gang     TEXT,
  defender_gang     TEXT,
  attacker_user_id  TEXT,
  action            TEXT,
  damage_dealt      INTEGER DEFAULT 0,
  territory         TEXT,
  metadata          JSONB DEFAULT '{}',
  ts                BIGINT DEFAULT (EXTRACT(EPOCH FROM now())::BIGINT * 1000)
);
CREATE INDEX IF NOT EXISTS idx_gang_war_logs_attacker ON gang_war_logs(attacker_gang);
CREATE INDEX IF NOT EXISTS idx_gang_war_logs_defender ON gang_war_logs(defender_gang);

CREATE TABLE IF NOT EXISTS store_purchases (
  id         SERIAL PRIMARY KEY,
  user_id    TEXT NOT NULL,
  package_id TEXT,
  uc_amount  INTEGER DEFAULT 0,
  price_tl   NUMERIC(10,2) DEFAULT 0,
  status     TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_store_purchases_user ON store_purchases(user_id);

CREATE TABLE IF NOT EXISTS factory_sessions (
  id         SERIAL PRIMARY KEY,
  user_id    TEXT NOT NULL,
  collected  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_factory_sessions_user ON factory_sessions(user_id);
