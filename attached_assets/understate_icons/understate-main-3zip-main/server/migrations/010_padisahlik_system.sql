-- =====================================================
-- Migration 010: Padisahlik Savasi + Diplomasi Log + Kozmetik
-- =====================================================

-- 1) Padisahlik Donemleri
CREATE TABLE IF NOT EXISTS padisahlik_donemleri (
  id                     SERIAL PRIMARY KEY,
  baslangic_tarihi       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  bitis_tarihi           TIMESTAMPTZ NOT NULL,
  genel_sefer_baslangic  TIMESTAMPTZ,
  genel_sefer_bitis      TIMESTAMPTZ,
  padisah_beylik_id      TEXT,
  durum                  VARCHAR(20)  NOT NULL DEFAULT 'normal'
    CHECK (durum IN ('normal','genel_sefer','tamamlandi')),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_padisahlik_durum ON padisahlik_donemleri(durum);

-- 2) Eyalet Fetih Sayaci
CREATE TABLE IF NOT EXISTS eyalet_fetih_sayaci (
  id               SERIAL PRIMARY KEY,
  donem_id         INTEGER NOT NULL REFERENCES padisahlik_donemleri(id) ON DELETE CASCADE,
  beylik_id        TEXT NOT NULL,
  eyalet_sayisi    INTEGER NOT NULL DEFAULT 0,
  guncelleme_tarihi TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(donem_id, beylik_id)
);
CREATE INDEX IF NOT EXISTS idx_fetih_donem  ON eyalet_fetih_sayaci(donem_id);
CREATE INDEX IF NOT EXISTS idx_fetih_beylik ON eyalet_fetih_sayaci(beylik_id);

-- 3) Diplomasi Sozlesme Logu
CREATE TABLE IF NOT EXISTS diplomasi_sozlesmeler (
  id               SERIAL PRIMARY KEY,
  beylik_a_id      TEXT NOT NULL,
  beylik_a_ad      TEXT NOT NULL DEFAULT '',
  beylik_b_id      TEXT NOT NULL,
  beylik_b_ad      TEXT NOT NULL DEFAULT '',
  tur              VARCHAR(20)  NOT NULL DEFAULT 'ittifak'
    CHECK (tur IN ('ittifak','ateskes','saldirmazlik','harac','ticaret','savunma')),
  durum            VARCHAR(20)  NOT NULL DEFAULT 'aktif'
    CHECK (durum IN ('aktif','bozuldu','suresi_doldu')),
  olusturma_tarihi TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  bozulma_tarihi   TIMESTAMPTZ,
  bozan_beylik_id  TEXT,
  bitis_tarihi     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_diplo_sozlesme_a ON diplomasi_sozlesmeler(beylik_a_id);
CREATE INDEX IF NOT EXISTS idx_diplo_sozlesme_b ON diplomasi_sozlesmeler(beylik_b_id);

-- 4) Bina Hasar Tablosu
CREATE TABLE IF NOT EXISTS bina_hasar (
  id            SERIAL PRIMARY KEY,
  beylik_id     TEXT NOT NULL,
  bina_adi      VARCHAR(100) NOT NULL DEFAULT 'Bina',
  hasar_miktari INTEGER NOT NULL DEFAULT 0,
  onarildi_mi   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bina_hasar_beylik ON bina_hasar(beylik_id);

-- 5) Kozmetik Satin Alimlar
CREATE TABLE IF NOT EXISTS kozmetik_satin_alimlar (
  id                 SERIAL PRIMARY KEY,
  user_id            TEXT NOT NULL,
  kozmetik_id        VARCHAR(60)  NOT NULL,
  tur                VARCHAR(30)  NOT NULL DEFAULT 'bayrak'
    CHECK (tur IN ('bayrak','arma','taht_temasi')),
  satin_alinan_tarih TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, kozmetik_id)
);
CREATE INDEX IF NOT EXISTS idx_kozmetik_user ON kozmetik_satin_alimlar(user_id);

-- 6) Paralı Asker Kiralama Logu
CREATE TABLE IF NOT EXISTS parali_asker_log (
  id         SERIAL PRIMARY KEY,
  user_id    TEXT NOT NULL,
  miktar     INTEGER NOT NULL DEFAULT 0,
  maliyet    INTEGER NOT NULL DEFAULT 0,
  donem_id   INTEGER REFERENCES padisahlik_donemleri(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_parali_asker_user ON parali_asker_log(user_id);
