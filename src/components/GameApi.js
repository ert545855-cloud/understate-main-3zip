"use strict";
// ═══════════════════════════════════════════════════════════════════════════
// Ortak sunucu istemcisi + küçük yardımcılar (askeri ekran, harita, öğretici)
// window.gameApi.call(url, body?) → JSON (hata olursa Error.message Türkçe)
// ═══════════════════════════════════════════════════════════════════════════
(function () {
  const jwt = () => { try { return localStorage.getItem('us_jwt') || localStorage.getItem('authToken') || ''; } catch (e) { return ''; } };
  async function call(url, body) {
    const headers = { 'Content-Type': 'application/json' };
    const t = jwt(); if (t) headers.Authorization = 'Bearer ' + t;
    let r;
    try { r = await fetch(url, { method: body ? 'POST' : 'GET', headers, body: body ? JSON.stringify(body) : undefined }); }
    catch (e) { const err = new Error('Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.'); err.status = 0; throw err; }
    let d = null; try { d = await r.json(); } catch (e) {}
    if (!r.ok || !d || d.success === false) {
      const msg = (d && (d.error || d.message)) || (r.status === 401 ? 'Oturumun süresi dolmuş, yeniden giriş yap.' : `Sunucu isteği tamamlayamadı (${r.status}).`);
      const err = new Error(msg); err.status = r.status; err.data = d; throw err;
    }
    return d;
  }
  // Yerel parayı sunucuya yaz (otomatik kayıt 30 sn'de bir; para harcayan isteklerden önce çağrılır)
  async function syncMoney(money) {
    if (typeof money !== 'number' || !jwt()) return;
    try { await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt() }, body: JSON.stringify({ money }) }); } catch (e) {}
  }
  const fmtNum = (n) => Number(n || 0).toLocaleString('tr-TR');
  const fmtDur = (sec) => {
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    if (h) return `${h} sa ${m} dk`;
    if (m) return `${m} dk ${String(s).padStart(2, '0')} sn`;
    return `${s} sn`;
  };
  const flagOf = (id) => (/^[A-Z]{2}$/.test(id || '') ? String.fromCodePoint(...[...id].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)) : '🏳️');
  // Öğretici adımlarını ilerletmek için oyun olayı yayınla
  const progress = (key) => { try { window.dispatchEvent(new CustomEvent('tutorial-event', { detail: key })); } catch (e) {} };
  window.gameApi = { call, jwt, syncMoney, fmtNum, fmtDur, flagOf, progress };
})();
