-- Sezon Sistemi Tabloları

CREATE TABLE IF NOT EXISTS seasons (
  id          SERIAL PRIMARY KEY,
  number      INTEGER NOT NULL DEFAULT 1,
  theme       VARCHAR(20) DEFAULT 'yaz',
  start_date  TIMESTAMP NOT NULL,
  end_date    TIMESTAMP NOT NULL,
  status      VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','ended')),
  rewards     JSONB DEFAULT '[]',
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS season_rankings (
  id         SERIAL PRIMARY KEY,
  season_id  INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL,
  score      INTEGER DEFAULT 0,
  tier       VARCHAR(30) DEFAULT 'Vatandaş',
  rewarded   BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(season_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_season_rankings_score ON season_rankings(season_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_season_rankings_user  ON season_rankings(user_id);

-- Ferman/Kanun Memnuniyet Sistemi
ALTER TABLE laws ADD COLUMN IF NOT EXISTS satisfaction  INTEGER DEFAULT 50;
ALTER TABLE laws ADD COLUMN IF NOT EXISTS reactions     JSONB   DEFAULT '{}';
ALTER TABLE laws ADD COLUMN IF NOT EXISTS feedback_count INTEGER DEFAULT 0;
