---
name: Extended Game Systems (v9)
description: All systems added in the extended features session — casus chain, zanaat, kervan, lonca, law reactions, CSS redesign
---

# Extended Game Systems

## users.id is TEXT (uuid-like), NOT INT
All new tables must use `TEXT NOT NULL` for user_id columns — NOT `INT REFERENCES users(id)`.
**Why:** schema.sql defines `id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text` — foreign key with INT fails.

## New DB Tables (Migration 008)
- `casus_missions` — 3-stage spy chain (stage1/2/3_ends_at, status: active/completed/failed/captured)
- `zanaat_levels` — craft level system (UNIQUE user_id, level 1-4)
- `lonca_anlasmalari` — guild trade deals (proposer_id/partner_id TEXT)
- `kervan_koruma` — caravan guard system (owner_id/guard_id TEXT)
- `tax_history` — tax collection log
- `npc_relations` — server-backed NPC relations (UNIQUE user_id+npc_id)
- `law_reactions` — law like/dislike (UNIQUE law_id+user_id)
- `users` new columns: vali_since, vali_province, vali_performance_score, vali_actions_count, season_score

## New Routes
- `/api/casus-chain` — server/routes/casusChain.js (start/advance/abort missions)
- `/api/zanaat` — server/routes/zanaat.js (profile/craft)
- `/api/lonca-anlasma` — server/routes/loncaAnlasma.js (propose/accept/reject)
- `/api/kervan-koruma` — server/routes/kervanKoruma.js (create/guard/complete)
- `/api/game/laws/:id/react` — added to game.js (like/dislike laws)
- `/api/tax/history` — added to tax.js
- `/api/tax/:city/collect` — added to tax.js (records to tax_history)

## New Screens
- `CasusChainScreen.js` → route `casus_chain` → window.CasusChainScreen
- `ZanaatScreen.js` → route `zanaat` → window.ZanaatScreen
- `KervanKorumaScreen.js` → route `kervan_koruma` → window.KervanKorumaScreen
- `LoncaAnlasmaScreen.js` → route `lonca_anlasma` → window.LoncaAnlasmaScreen

## CSS v12 additions (css/styles.css)
- `.btn-premium` — gradient shine button with slide effect
- `.btn-danger`, `.btn-success` — colored action buttons
- `.tab-nav` / `.tab-btn` — pill navigation tabs
- `.stats-row` / `.stat-card` — stats grid
- `.reaction-btn` / `.law-reaction-bar` — law reaction UI classes
- `.screen-header` — sticky premium header
- `.stage-track` / `.stage-node` — 3-stage progress indicator
- `.section-label` — section divider with gradient line
- `.fab` — floating action button
- `.chip-scroll` / `.chip` — horizontal scrollable chips
- `.skeleton` — loading skeleton animation
- `.empty-state` — empty state component

## Nav additions
- Ekonomi: `kervan_koruma`, `lonca_anlasma`, `zanaat`
- Savaş: `casus_chain`
- Sosyal: `sezon`, `karakter_koken`, `pazar_etkinlik`, `meyhane`, `mektup`, `itibar`
- Devlet: `ruzname`

## Season point helper pattern
All activity routes call `addSezonPuan(userId, points)` internally — adds to `users.season_score` and `season_rankings` table if active season exists. Points: craft=10, casus_start=15, casus_complete=50, kervan_guard=35.
