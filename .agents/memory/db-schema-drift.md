---
name: DB schema drift vs code
description: server/migrations/001+002 were missing many columns/tables that server/routes and server/services actually query, causing register/login/bank/2FA/tax/event/tender/stock/gang-war/store/factory features to fail with "column/relation does not exist".
---

The committed migration SQL files were written earlier than a lot of the route/service code and never kept in sync. Symptom: register or login (or other features) return 500/503 with DB errors, even though `DATABASE_URL`/`JWT_SECRET` are set correctly and the base schema applied cleanly.

**Why:** Nobody re-derives the migration files from the code; new features add `db.query()` calls referencing new columns/tables without a matching migration.

**How to apply:** When a DB-backed feature errors out, don't assume it's an auth/env problem first — grep the failing route/service for the exact column/table names it queries and diff against `information_schema.columns` for that table. A one-off `subagent` explore pass across `server/routes/*.js` + `server/services/*.js` comparing against migrations is the fastest way to find *all* gaps at once rather than fixing them one error at a time. Added `server/migrations/003_bugfix_schema_gaps.sql` (idempotent, `ADD COLUMN IF NOT EXISTS`) covering the gaps found as of 2026-07-12: users (referral_code, two_factor_enabled, avatar, avatar_url, presidency_until, is_frozen, freeze_reason, bank, premium, last_bank_interest), two_factor_auth.backup_codes, money_transfers (fee, message, transfer_type), city_taxes (income/trade/property tax rates, last_updated), timed_events.rewards, plus new tables support_messages, tenders, job_cooldowns, stock_market, gang_war_logs, store_purchases, factory_sessions. Any future migration should be added as a new numbered file, never edit 001/002/003 after they've run.
