-- ═══════════════════════════════════════════════════════════════════════════
-- 013 — Dünya Haritası: ülke sahipliği (sunucu otoritesi, kalıcı)
-- Idempotent: sunucu her açılışta tekrar çalıştırabilir.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS world_territories (
  country_code       VARCHAR(8)  PRIMARY KEY,           -- assets/maps/world.svg path id (TR, DE, KKTC…)
  beylik_id          TEXT        NOT NULL,
  beylik_ad          TEXT        NOT NULL,
  renk               VARCHAR(16) NOT NULL DEFAULT '#C9A227',
  conquered_by       TEXT        REFERENCES users(id) ON DELETE SET NULL,
  conquered_by_name  TEXT,
  cost               BIGINT      NOT NULL DEFAULT 0,
  conquered_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_world_territories_beylik ON world_territories (beylik_id);

CREATE TABLE IF NOT EXISTS world_territory_log (
  id              SERIAL       PRIMARY KEY,
  country_code    VARCHAR(8)   NOT NULL,
  action          VARCHAR(16)  NOT NULL,                -- conquer | release | war
  beylik_id       TEXT,
  beylik_ad       TEXT,
  prev_beylik_id  TEXT,
  prev_beylik_ad  TEXT,
  user_id         TEXT,
  username        TEXT,
  cost            BIGINT       DEFAULT 0,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_world_log_country ON world_territory_log (country_code, created_at DESC);
