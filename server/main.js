require('dotenv').config({ override: true }); // .env değerleri Replit runtime env var'larını override eder
require('express-async-errors'); // async route handler'larında try/catch zorunluluğunu kaldırır — hatalar global error handler'a düşer

// ── Kritik env var kontrolü ──────────────────────────────────────────────────
// Eskiden JWT_SECRET ya da DATABASE_URL yoksa process.exit(1) ile kapanıyordu; Render'da
// bu "Deploy failed / Exited with status 1" döngüsüne yol açıyordu ve site hiç açılmıyordu.
// Artık sunucu her durumda ayağa kalkar, eksik olanı günlükte açıkça yazar.
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = require('crypto').randomBytes(48).toString('hex');
  console.error('\n[UYARI] JWT_SECRET tanımlı değil! Geçici rastgele bir anahtar üretildi.');
  console.error('[UYARI] Sunucu her yeniden başladığında oyuncuların oturumu kapanır.');
  console.error('[UYARI] Render → Environment bölümüne en az 32 karakterlik JWT_SECRET ekleyin.\n');
}
const HAS_DB_CONFIG = !!(process.env.DATABASE_URL || process.env.SUPABASE_DB_URL ||
  (process.env.RDS_HOSTNAME && process.env.RDS_USERNAME && process.env.RDS_PASSWORD));
if (!HAS_DB_CONFIG) {
  console.error('\n[UYARI] Veritabanı adresi yok (DATABASE_URL / SUPABASE_DB_URL / RDS_*).');
  console.error('[UYARI] Sunucu açılıyor ama giriş, kayıt ve ilerleme KAYDEDİLMEZ.');
  console.error('[UYARI] Render → Environment bölümüne DATABASE_URL ekleyin (Render Postgres "Internal Database URL" ya da Supabase).\n');
}
if (process.env.ALLOWED_ORIGINS === '*' && process.env.NODE_ENV === 'production') {
  console.warn('[WARN] ALLOWED_ORIGINS=* production ortamında güvensizdir. Gerçek origin listesi kullanın.');
}

const express  = require('express');
const http     = require('http');
const cors     = require('cors');
const helmet   = require('helmet');
const path     = require('path');
const socketIo = require('socket.io');

const { connectDB }      = require('./database/connection');
const { initSocket }     = require('./socket/index');
const { getPublicAdConfig } = require('./config/admob');
const logger             = require('./utils/logger');
const { ensureStorageBucket, SUPABASE_URL, ANON_KEY } = require('./services/supabaseService');
const { initRealtimeBridge, closeRealtimeBridge }     = require('./socket/realtimeBridge');

const app  = express();
const PORT = process.env.PORT || 8080;
const root = path.join(__dirname, '..');

// ── Güvenlik & gövde parse ────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
  : (process.env.NODE_ENV === 'production' ? [] : ['*']);   // canlıda varsayılan: sadece aynı site + APK + bilinen platformlar

const REPLIT_DEV_DOMAIN = process.env.REPLIT_DEV_DOMAIN || '';
const RENDER_URL = (process.env.RENDER_EXTERNAL_URL || '').replace(/\/+$/, '');   // Render otomatik verir

function isOriginAllowed(origin, host) {
  if (!origin) return true;
  try { if (host && new URL(origin).host === host) return true; } catch (_) {}   // aynı site (sayfa bu sunucudan)
  if (ALLOWED_ORIGINS.includes('*')) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (RENDER_URL && origin === RENDER_URL) return true;
  if (origin.endsWith('.onrender.com')) return true;
  if (REPLIT_DEV_DOMAIN && origin.endsWith(REPLIT_DEV_DOMAIN)) return true;
  if (origin.endsWith('.replit.dev') || origin.endsWith('.repl.co') || origin.endsWith('.pike.replit.dev')) return true;
  // Capacitor APK: androidScheme 'https' → https://localhost, iOS → capacitor://localhost
  if (origin === 'capacitor://localhost' || origin.startsWith('capacitor://')) return true;
  if (origin === 'https://localhost' || origin === 'http://localhost' || origin === 'ionic://localhost') return true;
  if (origin.endsWith('.elasticbeanstalk.com') || origin.endsWith('.amazonaws.com')) return true;
  if (origin.endsWith('.cloudfront.net')) return true;
  if (origin.endsWith('.up.railway.app')) return true;
  return false;
}

// İzin verilmeyen kaynakta hata fırlatmak yerine CORS başlığı eklemiyoruz: tarayıcı yabancı siteyi
// engeller, ama aynı sitedeki istekler (Render alan adı ne olursa olsun) 500 hatası almaz.
app.use(cors((req, cb) => {
  const origin = req.headers.origin;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  cb(null, { origin: isOriginAllowed(origin, host) ? true : false, credentials: true });
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Dinamik config (Capacitor/APK için backend URL inject) ────────────────────
app.get('/config.js', (req, res) => {
  // Sayfa bu sunucudan açıldığına göre arka uç da bu sunucudur: isteğin kendi adresini kullan.
  // (Eskiden sabit PUBLIC_URL kullanılıyordu; Render'daki gerçek alan adı farklıysa socket ve
  // istekler yanlış adrese gidiyordu.) APK kendi statik config.js dosyasını kullanır.
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const publicUrl = host ? `${proto}://${host}` : (process.env.PUBLIC_URL || RENDER_URL || '');
  res.set('Content-Type', 'application/javascript');
  res.set('Cache-Control', 'no-cache');
  res.send(`window.__BACKEND_URL__ = ${JSON.stringify(publicUrl)};`);
});

// ── Supabase public config (frontend direct erişim için) ─────────────────────
app.get('/supabase-config.js', (req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.set('Cache-Control', 'no-cache');
  res.send([
    `window.__SUPABASE_URL__ = ${JSON.stringify(SUPABASE_URL)};`,
    `window.__SUPABASE_ANON_KEY__ = ${JSON.stringify(ANON_KEY)};`,
    // Supabase JS client init (anon key varsa)
    ANON_KEY
      ? `if(typeof supabase!=='undefined'){ window.__sb = supabase.createClient(window.__SUPABASE_URL__, window.__SUPABASE_ANON_KEY__); }`
      : `/* SUPABASE_ANON_KEY tanımlı değil — window.__sb oluşturulmadı */`,
  ].join('\n'));
});

// ── Statik dosyalar ───────────────────────────────────────────────────────────
const staticOpts = {
  setHeaders: (res, fp) => {
    // Büyük kütüphane dosyaları uzun süre cache'lenebilir
    if (fp.endsWith('.min.js') || fp.endsWith('.min.css')) {
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');
    } else if (fp.endsWith('.js') || fp.endsWith('.jsx')) {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
};
app.use('/public',  express.static(path.join(root, 'public'), staticOpts));
app.use('/css',     express.static(path.join(root, 'css'), staticOpts));
app.use('/js',      express.static(path.join(root, 'js'), staticOpts));
app.use('/src',     express.static(path.join(root, 'src'), staticOpts));
app.use('/assets',  express.static(path.join(root, 'assets'), staticOpts));
// Eski yollar (/icons/..., /sounds/...) public/ altında duruyor — kırık ikon/ses olmasın
app.use('/icons',   express.static(path.join(root, 'public', 'icons'), staticOpts));
app.use('/sounds',  express.static(path.join(root, 'public', 'sounds'), staticOpts));

// ── API rotaları ──────────────────────────────────────────────────────────────
const adminRoute    = require('./routes/admin');
const electionRoute = require('./routes/election');

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/game',          require('./routes/game'));
app.use('/api/admin',         adminRoute.router    || adminRoute);
app.use('/api/profile',       require('./routes/profile'));
app.use('/api/leaderboard',   require('./routes/leaderboard'));
app.use('/api/marketplace',   require('./routes/marketplace'));
app.use('/api/save',          require('./routes/save'));
app.use('/api/push',          require('./routes/push'));
app.use('/api/auction',      require('./routes/auction'));
app.use('/api/caravans',     require('./routes/caravans'));
app.use('/api/campaigns',    require('./routes/campaigns'));
app.use('/api/achievements', require('./routes/achievements'));
// ── Yeni Savaş & Sosyal Sistemler ────────────────────────
app.use('/api/war',          require('./routes/warSystem'));
app.use('/api/region',       require('./routes/regionControl'));
app.use('/api/siege',        require('./routes/siege'));
app.use('/api/duel',         require('./routes/duel'));
app.use('/api/assassination',require('./routes/assassination'));
app.use('/api/social',       require('./routes/socialSystems'));
app.use('/api/beylik-war',   require('./routes/beylikWar'));
app.use('/api/tournament',   require('./routes/tournament'));
// ── RP Sistemleri ─────────────────────────────────────────
app.use('/api/rp',           require('./routes/rpSystems'));
app.use('/api/tavern',       require('./routes/tavern'));
app.use('/api/letters',      require('./routes/letters'));
app.use('/api/itibar',       require('./routes/itibar'));
app.use('/api/market',       require('./routes/weeklyMarket'));
app.use('/api/guild-hall',   require('./routes/guildHall'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/messages',      require('./routes/messages'));
app.use('/api/friends',       require('./routes/friends'));
app.use('/api/diplomacy',     require('./routes/diplomacy'));
app.use('/api/election',      electionRoute.router || electionRoute);
app.use('/api/events',        require('./routes/events'));
app.use('/api/loans',         require('./routes/loans'));
app.use('/api/parliament',    require('./routes/parliament'));
app.use('/api/portfolio',     require('./routes/portfolio'));
app.use('/api/security',      require('./routes/security'));
app.use('/api/sessions',      require('./routes/sessions'));
app.use('/api/streak',        require('./routes/streak'));
app.use('/api/tax',           require('./routes/tax'));
app.use('/api/tfa',           require('./routes/tfa'));
app.use('/api/transfer',      require('./routes/transfer'));
app.use('/api/tender',        require('./routes/tender'));
app.use('/api/factory',       require('./routes/factory'));
app.use('/api/jobs',          require('./routes/jobs'));
app.use('/api/store',         require('./routes/store'));
app.use('/api/gang-crime',    require('./routes/gangCrime'));
app.use('/api/bank',           require('./routes/bank'));
app.use('/api/chat',           require('./routes/chat'));
app.use('/api/family-factory', require('./routes/familyFactory'));
app.use('/api/sezon',         require('./routes/sezon'));
app.use('/api/padisahlik',   require('./routes/padisahlik'));
app.use('/api/mercenary',    require('./routes/mercenary'));
app.use('/api/cosmetics',    require('./routes/cosmetics'));
app.use('/api/casus-chain',   require('./routes/casusChain'));
app.use('/api/zanaat',        require('./routes/zanaat'));
app.use('/api/lonca-anlasma', require('./routes/loncaAnlasma'));
app.use('/api/kervan-koruma', require('./routes/kervanKoruma'));
app.use('/api/fal-carki',    require('./routes/falCarki'));
app.use('/api/ferman',       require('./routes/ferman'));
app.use('/api/arkadas',      require('./routes/arkadas'));
app.use('/api/sikayet',      require('./routes/sikayet'));
app.use('/api/unvan',        require('./routes/unvan'));
app.use('/api/grup-mesaj',   require('./routes/grupMesaj'));
app.use('/api/adventure-log',require('./routes/adventureLog'));
app.use('/api/players',      require('./routes/playerSearch'));
app.use('/api/world',        require('./routes/world'));          // Dünya Haritası — ülke sahipliği
app.use('/api/military',     require('./routes/military'));       // Silahlı Kuvvetler — fabrika, asker, harekât
// ── Supabase REST API — Admin & Upload ────────────────────────
app.use('/api/admin/sb',     require('./routes/adminSupabase'));

app.get('/health',            (_req, res) => res.json({ status: 'OK', db: require('./database/connection').getConnectionStatus(), ts: Date.now() }));
app.get('/api/admob-config',  (_req, res) => res.json(getPublicAdConfig(process.env.NODE_ENV !== 'production')));

// ── Alias route'lar: eksik endpoint'ler için yönlendirme ────────────────────
const _gameRouter = require('./routes/game');
app.use('/api/state',               _gameRouter); // /api/state → /api/game/...
app.use('/api/gangs',               _gameRouter);
app.use('/api/parties',             _gameRouter);
app.use('/api/alliances',           _gameRouter);
app.use('/api/elections',           _gameRouter);
app.use('/api/laws',                _gameRouter);
app.use('/api/announcements',       _gameRouter);

// /api/leaderboard/top → /api/leaderboard/all
const _lbRouter = require('./routes/leaderboard');
app.use('/api/leaderboard/top',     (req, res, next) => { req.url = '/all'; next(); }, _lbRouter);

// /api/parliament/parties → /api/game/parties
app.get('/api/parliament/parties',  (req, res, next) => { req.url = '/parties'; next(); }, _gameRouter);

// /api/game/session → JWT kontrol + session bilgisi döner
const { authMiddleware } = require('./middleware/authMiddleware');
app.get('/api/game/session', authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

// /api/error-log → hata raporlama (auth gerektirmez)
app.post('/api/error-log', (req, res) => {
  const { message, stack, version } = req.body || {};
  if (message) require('./utils/logger').warn('[ClientError]', message?.slice?.(0,200));
  res.json({ ok: true });
});

// /api/giphy-trending + /api/giphy-search → Giphy API proxy
app.get('/api/giphy-trending', async (req, res) => {
  const key = process.env.GIPHY_API_KEY;
  if (!key) return res.json({ data: [] });
  const limit = Math.min(parseInt(req.query.limit) || 24, 50);
  try {
    const r = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${key}&limit=${limit}&rating=pg-13`);
    const d = await r.json();
    res.json(d);
  } catch (e) { res.json({ data: [] }); }
});
app.get('/api/giphy-search', async (req, res) => {
  const key = process.env.GIPHY_API_KEY;
  if (!key) return res.json({ data: [] });
  const q     = String(req.query.q || '').slice(0, 100);
  const limit = Math.min(parseInt(req.query.limit) || 24, 50);
  if (!q) return res.json({ data: [] });
  try {
    const r = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(q)}&limit=${limit}&rating=pg-13`);
    const d = await r.json();
    res.json(d);
  } catch (e) { res.json({ data: [] }); }
});

// ── SPA catch-all ─────────────────────────────────────────────────────────────
app.use(express.static(root, { index: false }));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(root, 'index.html'));
});

// ── Global hata yakalayıcı (CloudFront 500 cache'lemesini önler) ───────────────
app.use((err, req, res, _next) => {
  logger.error('[Express]', err.message);
  if (req.path.startsWith('/api/')) {
    return res.status(err.status || 500).json({ error: err.message || 'Sunucu hatası' });
  }
  // Statik dosya veya SPA hataları için index.html döndür (CloudFront 500 cache'lemez)
  res.status(200).sendFile(path.join(root, 'index.html'));
});

// ── HTTP sunucusu + Socket.IO ─────────────────────────────────────────────────
const server = http.createServer(app);
const io     = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout:  60000,
  pingInterval: 25000,
});

app.set('io', io);
global._io = io; // kampanya/kervan route'larından erişim için
connectDB(io);
initSocket(io);

// Padişahlık socket bağlantısı
try { require('./routes/padisahlik').setIO(io); } catch(_) {}
// Askeri harekât sonuç döngüsü (4 sn'de bir varan / çatışması biten harekâtları işler)
try { require('./routes/military').init(); } catch(e) { logger.warn('[Military] başlatılamadı:', e.message); }

// ── Supabase: Storage bucket + Realtime bridge ────────────────────────────────
ensureStorageBucket().catch(e => logger.warn('[Storage] Başlatma uyarısı:', e.message));
initRealtimeBridge(io).catch(e => logger.warn('[Realtime] Bridge uyarısı:', e.message));

server.listen(PORT, '0.0.0.0', () => {
  logger.success(`SALTANAT ONLINE sunucusu başlatıldı → port ${PORT}`);
});

process.on('uncaughtException',  (err) => logger.error('UncaughtException:', err.message));
process.on('unhandledRejection', (r)   => logger.error('UnhandledRejection:', String(r)));
process.on('SIGTERM', () => { closeRealtimeBridge(); server.close(); });

module.exports = { app, server, io };
