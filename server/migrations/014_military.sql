-- ═══════════════════════════════════════════════════════════════════════════
-- 014 — Silahlı Kuvvetler: devlet hazinesi, fabrikalar, birlikler, harekâtlar
-- Idempotent: sunucu her açılışta tekrar çalıştırabilir.
-- ═══════════════════════════════════════════════════════════════════════════

-- Her devletin (beylik id) askeri durumu. Üretim ve insan gücü yenilenmesi okuma
-- anında "geçen süre" üzerinden hesaplanır; küsuratlar progress içinde saklanır.
CREATE TABLE IF NOT EXISTS state_military (
  state_id    TEXT        PRIMARY KEY,
  state_ad    TEXT,
  hazine      BIGINT      NOT NULL DEFAULT 0,
  manpower    BIGINT      NOT NULL DEFAULT 20000,
  piyade      BIGINT      NOT NULL DEFAULT 5000,
  tank        INTEGER     NOT NULL DEFAULT 0,
  topcu       INTEGER     NOT NULL DEFAULT 0,
  iha         INTEGER     NOT NULL DEFAULT 0,
  tufek       BIGINT      NOT NULL DEFAULT 5000,
  progress    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS state_factories (
  id          SERIAL      PRIMARY KEY,
  state_id    TEXT        NOT NULL,
  type        VARCHAR(16) NOT NULL,                 -- silah | tank | topcu | iha
  level       INTEGER     NOT NULL DEFAULT 1,
  built_by    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_state_factories_state ON state_factories (state_id);

CREATE TABLE IF NOT EXISTS military_operations (
  id             SERIAL      PRIMARY KEY,
  state_id       TEXT        NOT NULL,
  state_ad       TEXT,
  renk           VARCHAR(16),
  leader_id      TEXT,
  leader_name    TEXT,
  origin_code    VARCHAR(8)  NOT NULL,
  target_code    VARCHAR(8)  NOT NULL,
  piyade         BIGINT      NOT NULL DEFAULT 0,
  tank           INTEGER     NOT NULL DEFAULT 0,
  topcu          INTEGER     NOT NULL DEFAULT 0,
  iha            INTEGER     NOT NULL DEFAULT 0,
  distance_km    INTEGER     NOT NULL DEFAULT 0,
  depart_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  arrive_at      TIMESTAMPTZ NOT NULL,
  battle_end_at  TIMESTAMPTZ NOT NULL,
  status         VARCHAR(12) NOT NULL DEFAULT 'moving',  -- moving | battle | won | lost | cancelled
  attack_power   INTEGER,
  defense_power  INTEGER,
  result         JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mil_ops_status ON military_operations (status, battle_end_at);
CREATE INDEX IF NOT EXISTS idx_mil_ops_state  ON military_operations (state_id, created_at DESC);

CREATE TABLE IF NOT EXISTS state_military_log (
  id          SERIAL      PRIMARY KEY,
  state_id    TEXT        NOT NULL,
  action      VARCHAR(24) NOT NULL,                 -- deposit | factory | upgrade | recruit | operation | result
  detail      JSONB,
  user_id     TEXT,
  username    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_state_mil_log ON state_military_log (state_id, created_at DESC);
