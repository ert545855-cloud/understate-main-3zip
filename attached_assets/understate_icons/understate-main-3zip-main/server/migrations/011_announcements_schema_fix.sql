-- ═══════════════════════════════════════════════════════════════════
-- Migration 011 — Announcements şema düzeltmesi
-- ───────────────────────────────────────────────────────────────────
-- Sorun: 001_initial_schema.sql announcements tablosunu (id TEXT,
--   title, content, author_id, author, type, pinned) olarak tanımladı.
--   005_war_and_social_systems.sql farklı bir şema (user_id, username,
--   category, expires_at) ile yeniden CREATE etmeye çalıştı ancak
--   IF NOT EXISTS nedeniyle silently atlandı.
--   Sonuç: server/routes/socialSystems.js'in beklediği kolonlar eksik
--   → GET/POST/DELETE /api/social/announcements hepsi SQL hatası veriyor.
-- ───────────────────────────────────────────────────────────────────

-- socialSystems.js'in beklediği eksik kolonları ekle
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS user_id  TEXT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'genel';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours';

-- Mevcut satırları geçerlileştir (001 şemasıyla oluşturulmuş olabilir)
UPDATE announcements SET expires_at = NOW() + INTERVAL '365 days' WHERE expires_at IS NULL;
UPDATE announcements SET category   = 'genel' WHERE category IS NULL;

-- Performans index'leri
CREATE INDEX IF NOT EXISTS idx_announcements_user_id    ON announcements(user_id);
CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON announcements(expires_at);
CREATE INDEX IF NOT EXISTS idx_announcements_category   ON announcements(category);
