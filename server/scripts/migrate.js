/**
 * Database migration runner
 * Çalıştırma: node server/scripts/migrate.js
 * AWS EB container_commands içinden de çalışır.
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

function buildConnectionString() {
  // Önce DATABASE_URL'e bak
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  // AWS EB RDS_* env var'larını kullan
  const { RDS_HOSTNAME, RDS_PORT, RDS_DB_NAME, RDS_USERNAME, RDS_PASSWORD } = process.env;
  if (RDS_HOSTNAME && RDS_USERNAME && RDS_PASSWORD) {
    const port = RDS_PORT || 5432;
    const db   = RDS_DB_NAME || 'understate';
    return `postgres://${RDS_USERNAME}:${encodeURIComponent(RDS_PASSWORD)}@${RDS_HOSTNAME}:${port}/${db}`;
  }

  throw new Error('Veritabanı bağlantı bilgisi bulunamadı. DATABASE_URL veya RDS_* env var\'ları set edin.');
}

async function migrate() {
  const connStr = buildConnectionString();
  const isLocal = /localhost|127\.0\.0\.1/.test(connStr);

  const pool = new Pool({
    connectionString: connStr,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });

  // Sırayla uygulanır: 001 (taban şema) → 002/003 (eklemeler/düzeltmeler).
  // schema.sql güncel değil (002/003'ü içermiyor), bu yüzden numaralı
  // migration dosyaları tek doğru kaynak olarak kullanılır. Hepsi
  // "IF NOT EXISTS" kullandığından tekrar tekrar çalıştırmak güvenlidir.
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => /^\d+.*\.sql$/.test(f))
    .sort();

  console.log('[Migrate] Bağlanılıyor...');
  const client = await pool.connect();
  try {
    for (const file of files) {
      console.log(`[Migrate] Uygulanıyor: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query(sql);
    }
    console.log('[Migrate] ✅ Tüm tablolar oluşturuldu / güncellendi.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('[Migrate] ❌ Hata:', err.message);
  process.exit(1);
});
