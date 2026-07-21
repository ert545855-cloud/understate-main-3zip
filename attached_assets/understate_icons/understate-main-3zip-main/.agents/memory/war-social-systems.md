---
name: War & Social Systems (Migration 005)
description: All new online war/battle/social features added in the big batch — tables, routes, screens.
---

## DB Tables (migration 005)
- `war_logs` — all fight records (pvp/siege/region/duel/tournament/suikast)
- `war_elo_history` — ELO change log per fight
- `region_control` + `region_attacks` — weekly region domination
- `sieges` + `siege_participants` — 30-min castle siege windows
- `duels` — 1v1 duel with bet, accept/decline flow
- `assassination_contracts` — poster pays reward, first killer claims it
- `daily_war_challenges` — 3 daily quests per user, progress in JSONB
- `weekly_war_stats` — battles_fought / battles_won per week per user
- `tournaments` + `tournament_entries` — weekly guild bracket
- `seasons` + `season_rewards` — monthly season ranking
- `fame_events` — gossip/fame log
- `announcements` — 24h auto-expiring bulletin board
- `friend_gifts` — 1 gift/day/receiver, pending/accepted flow
- `trade_routes` — discovered routes per user
- `beylik_wars` + `beylik_war_participants` — beylik vs beylik war
- `intrigue_draws` — palace intrigue card daily draw tracker
- `offline_earnings` — pending summary for when user returns
- `province_income_log` — vali tax collection log

## Users table new columns (migration 005)
fame_score, war_elo, war_league, win_streak, max_streak, season_score, revenge_on, revenge_until, last_seen, gossip_text

## Routes
- `/api/war` → warSystem.js (log, elo, leaderboard, attack, daily-challenge, claim-challenge, weekly-top)
- `/api/region` → regionControl.js (list, attack, collect-tax)
- `/api/siege` → siege.js (castles, active, start, join, resolve/:id)
- `/api/duel` → duel.js (list, challenge, respond)
- `/api/assassination` → assassination.js (list, post, claim)
- `/api/social` → socialSystems.js (announcements CRUD, gifts, fame, intrigue/draw, offline-summary)
- `/api/beylik-war` → beylikWar.js (list, history, declare, join, resolve/:id)
- `/api/tournament` → tournament.js (current, register, score, leaderboard)

## Frontend Screens
- `BolgeSavasiScreen.js` → page `bolge_savasi`
- `KaleKusatmaScreen.js` → page `kale_kusatma`
- `DuelMeydaniScreen.js` → page `duel_meydani`
- `SuikastScreen.js` → page `suikast`
- `SavasKayitScreen.js` → page `savas_kayit` (also shows ELO, daily quests, weekly top 3)
- `BeylikSavasiScreen.js` → page `beylik_savasi`
- `DuyuruPanosuScreen.js` → page `duyuru_panosu`
- `SarayIntrigiScreen.js` → page `saray_intrigi`
- `TurnuvaEkraniScreen.js` → page `lonca_turnuva`

## ELO League Thresholds
<800=bronz, <1000=gümüş, <1200=altın, <1500=vezir, >=1500=sultanî

## Key Design Decisions
- All fights (pvp/duel/siege/suikast/beylik) write to war_logs for unified history
- Revenge: loser gets revenge_on=winner_id for 48h; attacking that person gives +25% power
- Win streak: each win +1 streak, adds up to +50 power; loss resets to 0
- Socket events: war:result, region:update, siege:started/join/resolved, duel:challenge/result, assassination:new/completed/target, beylik_war:declared/join/resolved, announcement:new, gift:received, tournament:register
