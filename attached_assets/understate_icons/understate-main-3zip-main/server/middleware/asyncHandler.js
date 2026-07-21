"use strict";
/**
 * Async route handler'ları sarmalar; içeride try/catch olmasa bile
 * atılan hata/rejected promise otomatik olarak Express'in global hata
 * yakalayıcısına (server/main.js sonundaki middleware) iletilir.
 * Böylece bir DB hatası isteği sonsuza dek asılı bırakmaz veya
 * sessizce yutulmaz.
 */
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
