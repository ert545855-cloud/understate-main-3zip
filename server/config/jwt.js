const jwt = require('jsonwebtoken');
const { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } = require('./constants');

// ── JWT_SECRET: yoksa sunucuyu çökertme (Render'da deploy döngüsüne giriyordu) ──
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = require('crypto').randomBytes(48).toString('hex');
  console.error('[UYARI] JWT_SECRET tanımlı değil — geçici rastgele anahtar kullanılıyor (yeniden başlatınca oturumlar düşer).');
}

const SECRET         = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_SECRET + '_refresh';

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

module.exports = { signToken, verifyToken, signRefreshToken, verifyRefreshToken, SECRET };
