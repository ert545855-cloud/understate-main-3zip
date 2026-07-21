# Saltanat Online

SALTANAT ONLINE (v8.0) is a Turkish-language, mobile-friendly multiplayer city & state
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
- DB schema: migrations `001_initial_schema.sql`, `002_family_factories.sql`, and `003_bugfix_schema_gaps.sql` under `server/migrations/` have all been applied to the Replit Postgres DB. They are idempotent (`IF NOT EXISTS`), safe to re-run.
- `npm install` installs all deps. Note: `@aws-sdk/client-s3` and `multer-s3` were removed because `fast-xml-parser` (their transitive dependency) is blocked by Replit's security policy. S3 avatar upload is gracefully disabled when AWS env vars are absent; local file-based avatar upload still works.
- Bug fixes applied on import: (1) `gang:create` / `party:create` socket handlers now return an error event instead of broadcasting an empty list when DB is not ready — fixes gang/party silently disappearing after creation; (2) mobile modal `max-height` reduced to leave room for the bottom navigation bar.

## User preferences
(none recorded yet)
