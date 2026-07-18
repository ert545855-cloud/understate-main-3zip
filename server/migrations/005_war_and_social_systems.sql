-- ═══════════════════════════════════════════════════════
-- Migration 005: War & Social Systems (Full Online)
-- ═══════════════════════════════════════════════════════

-- ── Users table new columns ──────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS fame_score   INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS war_elo      INTEGER DEFAULT 1000;
ALTER TABLE users ADD COLUMN IF NOT EXISTS war_league   TEXT    DEFAULT 'bronz';
ALTER TABLE users ADD COLUMN IF NOT EXISTS win_streak   INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_streak   INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS season_score INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS revenge_on   TEXT DEFAULT NULL;  -- user_id of attacker
ALTER TABLE users ADD COLUMN IF NOT EXISTS revenge_until TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen    TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS gossip_text  TEXT    DEFAULT NULL;

-- ── War Logs (Savaş Kayıt Defteri) ──────────────────────
CREATE TABLE IF NOT EXISTS war_logs (
  id            SERIAL PRIMARY KEY,
  attacker_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
  defender_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
  attacker_name TEXT,
  defender_name TEXT,
  attacker_power INTEGER DEFAULT 0,
  defender_power INTEGER DEFAULT 0,
  winner_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  loot_money    INTEGER DEFAULT 0,
  loot_item     TEXT,
  is_revenge    BOOLEAN DEFAULT false,
  fight_type    TEXT DEFAULT 'pvp',   -- 'pvp'|'siege'|'region'|'duel'|'tournament'
  elo_delta     INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── ELO / League tracking ─────────────────────────────────
CREATE TABLE IF NOT EXISTS war_elo_history (
  id       SERIAL PRIMARY KEY,
  user_id  TEXT REFERENCES users(id) ON DELETE CASCADE,
  elo_before INTEGER,
  elo_after  INTEGER,
  league_before TEXT,
  league_after  TEXT,
  war_log_id INTEGER REFERENCES war_logs(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Region Control (Bölge Hakimiyet) ─────────────────────
CREATE TABLE IF NOT EXISTS region_control (
  region_id        TEXT PRIMARY KEY,
  controller_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
  controller_name  TEXT,
  controller_group TEXT,   -- gang/guild/beylik name
  controller_type  TEXT DEFAULT 'oyuncu',
  attack_count     INTEGER DEFAULT 0,
  daily_income     INTEGER DEFAULT 200,
  last_tax_paid    TIMESTAMPTZ DEFAULT NOW(),
  captured_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS region_attacks (
  id          SERIAL PRIMARY KEY,
  region_id   TEXT,
  attacker_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  attacker_name TEXT,
  power       INTEGER DEFAULT 0,
  attacked_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Castle Sieges (Kale Kuşatma) ─────────────────────────
CREATE TABLE IF NOT EXISTS sieges (
  id                 SERIAL PRIMARY KEY,
  castle_id          TEXT NOT NULL,
  castle_name        TEXT,
  attacker_leader_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  defender_leader_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  status             TEXT DEFAULT 'active',   -- 'active'|'attacker_won'|'defender_won'
  attacker_power     INTEGER DEFAULT 0,
  defender_power     INTEGER DEFAULT 0,
  ends_at            TIMESTAMPTZ,
  bonus_active_until TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS siege_participants (
  id        SERIAL PRIMARY KEY,
  siege_id  INTEGER REFERENCES sieges(id) ON DELETE CASCADE,
  user_id   TEXT REFERENCES users(id) ON DELETE CASCADE,
  side      TEXT,    -- 'attacker'|'defender'
  power_contributed INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(siege_id, user_id)
);

-- ── Duel Arena (Düello Meydanı) ───────────────────────────
CREATE TABLE IF NOT EXISTS duels (
  id            SERIAL PRIMARY KEY,
  challenger_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  challenged_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  bet_amount    INTEGER DEFAULT 0,
  status        TEXT DEFAULT 'pending',   -- 'pending'|'accepted'|'completed'|'declined'|'expired'
  winner_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  challenger_power INTEGER DEFAULT 0,
  challenged_power INTEGER DEFAULT 0,
  fight_log     JSONB DEFAULT '[]',
  expires_at    TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 minutes',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Assassination Contracts (Suikast Kontratı) ────────────
CREATE TABLE IF NOT EXISTS assassination_contracts (
  id          SERIAL PRIMARY KEY,
  poster_id   TEXT REFERENCES users(id) ON DELETE CASCADE,
  poster_name TEXT,
  target_id   TEXT REFERENCES users(id) ON DELETE CASCADE,
  target_name TEXT,
  reward      INTEGER DEFAULT 0,
  status      TEXT DEFAULT 'active',   -- 'active'|'completed'|'expired'
  killer_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Daily War Challenges (Savaş Meydan Okuması) ───────────
CREATE TABLE IF NOT EXISTS daily_war_challenges (
  id             SERIAL PRIMARY KEY,
  user_id        TEXT REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  challenge_date DATE DEFAULT CURRENT_DATE,
  challenges     JSONB DEFAULT '[]',
  progress       JSONB DEFAULT '{}',
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Weekly War Stats + Reward (Haftalık) ─────────────────
CREATE TABLE IF NOT EXISTS weekly_war_stats (
  id             SERIAL PRIMARY KEY,
  user_id        TEXT REFERENCES users(id) ON DELETE CASCADE,
  week_start     DATE,
  battles_fought INTEGER DEFAULT 0,
  battles_won    INTEGER DEFAULT 0,
  reward_claimed BOOLEAN DEFAULT false,
  UNIQUE(user_id, week_start)
);

-- ── Guild Tournament (Lonca Turnuvası) ────────────────────
CREATE TABLE IF NOT EXISTS tournaments (
  id            SERIAL PRIMARY KEY,
  week_start    DATE UNIQUE,
  status        TEXT DEFAULT 'active',   -- 'active'|'semifinal'|'final'|'completed'
  bracket       JSONB DEFAULT '{}',
  winner_guild_id INTEGER,
  winner_guild_name TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tournament_entries (
  id             SERIAL PRIMARY KEY,
  tournament_id  INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
  guild_id       INTEGER,
  guild_name     TEXT,
  score          INTEGER DEFAULT 0,
  wins           INTEGER DEFAULT 0,
  losses         INTEGER DEFAULT 0,
  eliminated     BOOLEAN DEFAULT false,
  UNIQUE(tournament_id, guild_id)
);

-- ── Season Championship (Sezonluk Şampiyonluk) ───────────
CREATE TABLE IF NOT EXISTS seasons (
  id            SERIAL PRIMARY KEY,
  season_number INTEGER UNIQUE,
  started_at    TIMESTAMPTZ DEFAULT NOW(),
  ends_at       TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  status        TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS season_rewards (
  id        SERIAL PRIMARY KEY,
  season_id INTEGER REFERENCES seasons(id) ON DELETE CASCADE,
  user_id   TEXT REFERENCES users(id) ON DELETE CASCADE,
  rank      INTEGER,
  badge     TEXT,
  reward    INTEGER DEFAULT 0,
  claimed   BOOLEAN DEFAULT false,
  UNIQUE(season_id, user_id)
);

-- ── Fame Events (Şöhret & Dedikodu) ──────────────────────
CREATE TABLE IF NOT EXISTS fame_events (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT REFERENCES users(id) ON DELETE CASCADE,
  event_type  TEXT,   -- 'war_win'|'siege'|'duel'|'caravan'|'election'|'suikast'
  description TEXT,
  fame_points INTEGER DEFAULT 0,
  public      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Announcements Board (Duyuru Panosu / İlan) ───────────
CREATE TABLE IF NOT EXISTS announcements (
  id         SERIAL PRIMARY KEY,
  user_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
  username   TEXT,
  content    TEXT NOT NULL,
  category   TEXT DEFAULT 'genel',   -- 'is'|'ortak'|'satis'|'genel'
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Friend Gifts (Arkadaş Hediye) ─────────────────────────
CREATE TABLE IF NOT EXISTS friend_gifts (
  id          SERIAL PRIMARY KEY,
  sender_id   TEXT REFERENCES users(id) ON DELETE CASCADE,
  sender_name TEXT,
  receiver_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  amount      INTEGER DEFAULT 0,
  item_name   TEXT,
  message     TEXT,
  status      TEXT DEFAULT 'pending',   -- 'pending'|'accepted'|'rejected'
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Trade Routes (Ticaret Yolu Keşfi) ────────────────────
CREATE TABLE IF NOT EXISTS trade_routes (
  id           SERIAL PRIMARY KEY,
  user_id      TEXT REFERENCES users(id) ON DELETE CASCADE,
  route_id     TEXT,
  route_name   TEXT,
  daily_income INTEGER DEFAULT 0,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  last_collected TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, route_id)
);

-- ── Province Tax Flow (Eyalet Vergisi) ───────────────────
CREATE TABLE IF NOT EXISTS province_income_log (
  id         SERIAL PRIMARY KEY,
  vali_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
  region_id  TEXT,
  amount     INTEGER DEFAULT 0,
  collected_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Beylik Wars (Beylik Savaşı) ───────────────────────────
CREATE TABLE IF NOT EXISTS beylik_wars (
  id              SERIAL PRIMARY KEY,
  attacker_beylik TEXT,
  attacker_leader_id TEXT REFERENCES users(id),
  defender_beylik TEXT,
  defender_leader_id TEXT REFERENCES users(id),
  attacker_power  INTEGER DEFAULT 0,
  defender_power  INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'active',  -- 'active'|'attacker_won'|'defender_won'
  spoils_money    INTEGER DEFAULT 0,
  spoils_region   TEXT,
  ends_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS beylik_war_participants (
  id          SERIAL PRIMARY KEY,
  war_id      INTEGER REFERENCES beylik_wars(id) ON DELETE CASCADE,
  user_id     TEXT REFERENCES users(id) ON DELETE CASCADE,
  beylik_name TEXT,
  side        TEXT,   -- 'attacker'|'defender'
  power_contributed INTEGER DEFAULT 0,
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(war_id, user_id)
);

-- ── Palace Intrigue Cards (Saray İntrigi) ────────────────
CREATE TABLE IF NOT EXISTS intrigue_draws (
  id         SERIAL PRIMARY KEY,
  user_id    TEXT REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  last_draw  DATE DEFAULT NULL,
  draw_count INTEGER DEFAULT 0
);

-- ── Offline Earnings Log ──────────────────────────────────
CREATE TABLE IF NOT EXISTS offline_earnings (
  user_id        TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_seen      TIMESTAMPTZ DEFAULT NOW(),
  pending_summary JSONB DEFAULT '{}'
);

-- ── Seed: Season 1 ───────────────────────────────────────
INSERT INTO seasons (season_number, started_at, ends_at, status)
VALUES (1, NOW(), NOW() + INTERVAL '30 days', 'active')
ON CONFLICT (season_number) DO NOTHING;
