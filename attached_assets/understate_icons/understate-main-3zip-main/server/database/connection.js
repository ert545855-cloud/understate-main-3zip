/**
 * Database connection — PostgreSQL (Railway / Supabase / Replit / RDS uyumlu)
 *
 * ÖNEMLİ: Sunucu her açılışta şemayı otomatik uygular (idempotent, "IF NOT
 * EXISTS" kullanır). Böylece Railway'de sıfırdan bir Postgres eklentisi
 * bağlansa bile "gangs" / "parties" gibi tablolar hiç oluşmadığı için
 * verilerin sessizce kaybolduğu duruma bir daha düşülmez. Daha önce bu adım
 * sadece "node server/scripts/migrate.js" elle çalıştırılırsa ya da AWS EB
 * container_commands üzerinden tetikleniyordu; Railway'de bu adım hiç
 * çalışmadığı için tablolar oluşmuyor, INSERT'ler sessizce başarısız oluyor
 * ve "parti/çete kuruldu ama sonra kayboluyor" hatasına yol açıyordu.
 */
const fs   = require('fs');
const path = require('path');
const db = require('../services/dbService');
const { markConnected } = db;
const logger = require('../utils/logger');

let _io = null;
let _ready = false;

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

// schema.sql zaten 001_initial_schema.sql ile birebir aynı (temel şema).
// Ek olarak, schema.sql'e dahil edilmemiş numaralı migration dosyalarını
// (ör. 002_family_factories.sql) da otomatik uygula. Hepsi "IF NOT EXISTS"
// kullandığı için tekrar tekrar çalıştırmak güvenlidir.
function collectMigrationFiles() {
  const files = ['schema.sql'];
  let extra = [];
  try {
    extra = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => /^\d+_.*\.sql$/.test(f))
      .sort();
  } catch (_) { /* migrations klasörü okunamadı, sadece schema.sql uygulanır */ }
  for (const f of extra) if (!files.includes(f)) files.push(f);
  return files;
}

async function runMigrations() {
  const files = collectMigrationFiles();
  for (const file of files) {
    const fullPath = path.join(MIGRATIONS_DIR, file);
    if (!fs.existsSync(fullPath)) continue;
    const sql = fs.readFileSync(fullPath, 'utf8');
    try {
      await db.query(sql);
      logger.success(`[Migrate] ${file} uygulandı`);
    } catch (err) {
      // Idempotent CREATE/ALTER olduğu için normal şartlarda hata vermez;
      // yine de bir dosya başarısız olursa diğerlerini denemeye devam et.
      logger.error(`[Migrate] ${file} başarısız:`, err.message);
    }
  }
}

async function connectDB(io) {
  if (io) _io = io;

  if (!process.env.DATABASE_URL) {
    logger.warn('DATABASE_URL tanımlanmamış — DB bağlantısı kurulamadı');
    return;
  }

  try {
    // 5 saniyelik timeout: Render/Railway deploy sirasinda DB yanitlamazsa
    // sunucunun health-check'e cevap veremez hale gelmesini onler.
    const timeoutPromise = new Promise((_, rej) =>
      setTimeout(() => rej(new Error('DB baglanti testi zaman asimina ugradi (5s)')), 5000)
    );
    await Promise.race([db.query('SELECT 1'), timeoutPromise]);

    if (typeof markConnected === 'function') markConnected();
    _ready = true;
    logger.success('PostgreSQL baglantisi basarili');

    // ── Otomatik şema uygulama ──────────────────────────────────────────────
    await runMigrations();

    if (_io) _io.emit('dbStatus', { status: 'connected', timestamp: Date.now() });

    const REQUIRED_TABLES = ['users', 'chat_messages', 'game_state', 'rooms', 'economy', 'gangs', 'parties'];
    let missing = false;
    for (const table of REQUIRED_TABLES) {
      try {
        const { rows } = await db.query(
          "SELECT to_regclass($1) AS exists", [table]
        );
        if (!rows[0].exists) { logger.error(`[DB] TABLO EKSIK: ${table} — migration başarısız olmuş olabilir`); missing = true; }
      } catch (_) {}
    }
    if (missing && _io) _io.emit('dbStatus', { status: 'schema_incomplete', timestamp: Date.now() });
  } catch (err) {
    logger.error('PostgreSQL baglanti testi basarisiz:', err.message);
    logger.warn('DB bagli degil — veriler kalici olmayacak. Sunucu yine de calismaya devam ediyor.');
    if (_io) _io.emit('dbStatus', { status: 'error', timestamp: Date.now() });
    // Hata firlatmiyoruz: sunucu DB olmadan da ayaga kalkmali
  }
}

function getConnectionStatus() {
  return db.isReady() && _ready;
}

function getConnectionDetails() {
  return {
    status:    (_ready && db.isReady()) ? 'connected' : 'disconnected',
    isConnected: _ready && db.isReady(),
    provider:  'railway_postgresql',
    retryCount: 0,
    maxRetries: 0,
    host: process.env.PGHOST || null,
    dbName: process.env.PGDATABASE || 'postgres',
  };
}

module.exports = { connectDB, getConnectionStatus, getConnectionDetails, runMigrations };
