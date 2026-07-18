-- ═══════════════════════════════════════════════════
-- Migration 008: Extended Game Systems
-- Casus zinciri · Zanaat · Lonca · Kervan · Vergi · Vali
-- users.id = TEXT (uuid-like)
-- ═══════════════════════════════════════════════════

-- 3-Aşamalı Casus Görev Zinciri
CREATE TABLE IF NOT EXISTS casus_missions (
  id              SERIAL PRIMARY KEY,
  user_id         TEXT NOT NULL,
  mission_type    VARCHAR(50)  NOT NULL DEFAULT 'kesif',
  target_name     VARCHAR(100) NOT NULL,
  target_id       TEXT,
  stage           INT          NOT NULL DEFAULT 1,
  stage1_done_at  TIMESTAMPTZ,
  stage2_done_at  TIMESTAMPTZ,
  stage3_done_at  TIMESTAMPTZ,
  stage1_ends_at  TIMESTAMPTZ,
  stage2_ends_at  TIMESTAMPTZ,
  stage3_ends_at  TIMESTAMPTZ,
  status          VARCHAR(20)  NOT NULL DEFAULT 'active',
  result          JSONB        NOT NULL DEFAULT '{}',
  reward_sikke    INT          NOT NULL DEFAULT 0,
  reward_xp       INT          NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_casus_user   ON casus_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_casus_status ON casus_missions(status);

-- Zanaat Seviye Sistemi
CREATE TABLE IF NOT EXISTS zanaat_levels (
  id              SERIAL PRIMARY KEY,
  user_id         TEXT NOT NULL UNIQUE,
  craft_type      VARCHAR(50)  NOT NULL DEFAULT 'genel',
  level           INT          NOT NULL DEFAULT 1,
  xp              INT          NOT NULL DEFAULT 0,
  total_crafted   INT          NOT NULL DEFAULT 0,
  last_crafted_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Lonca Ticaret Anlaşmaları
CREATE TABLE IF NOT EXISTS lonca_anlasmalari (
  id               SERIAL PRIMARY KEY,
  proposer_id      TEXT NOT NULL,
  proposer_name    VARCHAR(100),
  partner_id       TEXT,
  partner_name     VARCHAR(100),
  goods_offered    VARCHAR(100) NOT NULL,
  amount_offered   INT          NOT NULL DEFAULT 0,
  goods_requested  VARCHAR(100) NOT NULL,
  amount_requested INT          NOT NULL DEFAULT 0,
  status           VARCHAR(20)  NOT NULL DEFAULT 'pending',
  notes            TEXT,
  expires_at       TIMESTAMPTZ  NOT NULL,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lonca_proposer ON lonca_anlasmalari(proposer_id);
CREATE INDEX IF NOT EXISTS idx_lonca_partner  ON lonca_anlasmalari(partner_id);
CREATE INDEX IF NOT EXISTS idx_lonca_status   ON lonca_anlasmalari(status);

-- Kervan Koruma Sistemi
CREATE TABLE IF NOT EXISTS kervan_koruma (
  id               SERIAL PRIMARY KEY,
  owner_id         TEXT NOT NULL,
  owner_name       VARCHAR(100),
  guard_id         TEXT,
  guard_name       VARCHAR(100),
  route            VARCHAR(200) NOT NULL,
  cargo_value      INT          NOT NULL DEFAULT 0,
  pay_amount       INT          NOT NULL DEFAULT 0,
  danger_level     INT          NOT NULL DEFAULT 1,
  status           VARCHAR(20)  NOT NULL DEFAULT 'open',
  attack_chance    INT          NOT NULL DEFAULT 20,
  started_at       TIMESTAMPTZ,
  ends_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kervan_status ON kervan_koruma(status);
CREATE INDEX IF NOT EXISTS idx_kervan_owner  ON kervan_koruma(owner_id);

-- Vergi Tahsilat Geçmişi
CREATE TABLE IF NOT EXISTS tax_history (
  id               SERIAL PRIMARY KEY,
  city             VARCHAR(100) NOT NULL,
  collector_id     TEXT,
  collector_name   VARCHAR(100),
  income_rate      DECIMAL(5,2) NOT NULL DEFAULT 0,
  trade_rate       DECIMAL(5,2) NOT NULL DEFAULT 0,
  property_rate    DECIMAL(5,2) NOT NULL DEFAULT 0,
  amount_collected BIGINT       NOT NULL DEFAULT 0,
  taxpayer_count   INT          NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_taxhist_city      ON tax_history(city);
CREATE INDEX IF NOT EXISTS idx_taxhist_collector ON tax_history(collector_id);

-- Vali Performans Takibi
ALTER TABLE users ADD COLUMN IF NOT EXISTS vali_since              TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vali_province           VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS vali_performance_score  INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vali_actions_count      INT DEFAULT 0;

-- NPC Tüccar İlişki (Server-backed)
CREATE TABLE IF NOT EXISTS npc_relations (
  id               SERIAL PRIMARY KEY,
  user_id          TEXT NOT NULL,
  npc_id           VARCHAR(50)  NOT NULL,
  relation_score   INT          NOT NULL DEFAULT 0,
  trade_count      INT          NOT NULL DEFAULT 0,
  last_price_mod   DECIMAL(4,2) NOT NULL DEFAULT 1.0,
  last_interaction TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, npc_id)
);
CREATE INDEX IF NOT EXISTS idx_npcrel_user ON npc_relations(user_id);

-- Kanun memnuniyeti tepkileri
CREATE TABLE IF NOT EXISTS law_reactions (
  id         SERIAL PRIMARY KEY,
  law_id     VARCHAR(100) NOT NULL,
  user_id    TEXT NOT NULL,
  reaction   VARCHAR(10)  NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(law_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_lawreact_law  ON law_reactions(law_id);
CREATE INDEX IF NOT EXISTS idx_lawreact_user ON law_reactions(user_id);

-- Sezon puan sütunu
ALTER TABLE users ADD COLUMN IF NOT EXISTS season_score INT DEFAULT 0;
