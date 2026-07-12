# UnderState

UNDERSTATE (v8.0) is a Turkish-language, mobile-friendly multiplayer city & state
simulation game. It's a Babel-standalone React single-file frontend (`index.html`
+ `src/`) backed by an Express + Socket.io + PostgreSQL server for real-time
multiplayer state (gangs, parties, alliances, elections, laws, chat, economy).

## Stack
- **Frontend**: React via `babel-standalone` (no build step), served as static files. Screens live under `src/screens/*.js` as `window.*` globals; the shell is `src/app.js`.
- **Backend**: Node/Express (`server/main.js`) + Socket.io for realtime, PostgreSQL for persistence (auth, gangs, parties, alliances, elections, laws, announcements, economy, etc.)
- **Mobile**: Capacitor config present for Android packaging (`android/`, `capacitor.config.json`).

## Running the project
- Workflow "Start application" runs `node server/main.js` on port 5000.
- Required env vars (already configured): `DATABASE_URL` (Replit Postgres, provisioned automatically), `JWT_SECRET` (generated), plus optional Firebase/SMTP/AWS/VAPID keys already set as shared env vars from the original import.
- DB schema: apply `server/migrations/001_initial_schema.sql` then `server/migrations/002_family_factories.sql` against `DATABASE_URL` (already applied once during setup). These are idempotent (`CREATE TABLE IF NOT EXISTS`), safe to re-run.
- `npm install` installs all deps (uses Node 18; a few sub-dependencies warn about wanting Node 20+ but work fine).

## User preferences
(none recorded yet)
