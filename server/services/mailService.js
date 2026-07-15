/**
 * Saltanat Online Mail Servisi — Brevo Transactional Email API
 * Tek giriş noktası: tüm mail gönderimleri buradan geçer.
 */

const BREVO_URL  = 'https://api.brevo.com/v3/smtp/email';
const SENDER     = { name: 'Saltanat Online', email: 'basemirhan28@gmail.com' };

async function _send({ to, toName, subject, html, type = 'general' }) {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    console.warn('[Mail] BREVO_API_KEY eksik — mail gönderilemiyor');
    return { ok: false, reason: 'API key eksik' };
  }
  if (!to) return { ok: false, reason: 'E-posta adresi yok' };

  try {
    const res = await fetch(BREVO_URL, {
      method: 'POST',
      headers: { 'api-key': key, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ sender: SENDER, to: [{ email: to, name: toName || to }], subject, htmlContent: html }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      console.log(`📧 [Mail] Gönderildi → ${to} [${type}]`);
      return { ok: true };
    }
    const reason = data.message || JSON.stringify(data);
    console.warn(`[Mail] Brevo hata (${res.status}): ${reason}`);
    return { ok: false, reason };
  } catch (e) {
    console.warn('[Mail] Fetch hatası:', e.message);
    return { ok: false, reason: e.message };
  }
}

// ── HTML şablonları ───────────────────────────────────────────────────────────

function _layout(content) {
  return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">
<style>
body{margin:0;background:#0F1115;font-family:'Segoe UI',Arial,sans-serif;color:#F5EBD7}
.wrap{max-width:560px;margin:0 auto;padding:32px 16px}
.logo{text-align:center;margin-bottom:28px}
.logo-title{font-size:1.6rem;font-weight:900;letter-spacing:.25rem;color:#C89B3C;text-shadow:0 0 20px rgba(200,155,60,.4)}
.logo-sub{font-size:.7rem;color:#A9A6A0;letter-spacing:.2rem;text-transform:uppercase;margin-top:4px}
.footer{text-align:center;color:#3E4450;font-size:.73rem;margin-top:28px;border-top:1px solid rgba(200,155,60,.12);padding-top:16px}
</style></head><body><div class="wrap">
<div class="logo">
  <div class="logo-title">⚔ SALTANAT ONLİNE</div>
  <div class="logo-sub">Osmanlı Strateji &amp; Rol Yapma Oyunu</div>
</div>
${content}
<div class="footer">© 2026 Saltanat Online — Tüm hakları saklıdır.</div>
</div></body></html>`;
}

function _card(borderColor, content) {
  return `<div style="background:#1B1E25;border:1px solid ${borderColor};border-radius:14px;padding:28px">${content}</div>`;
}

// ── Hoş Geldin ────────────────────────────────────────────────────────────────
function sendWelcome(to, username) {
  const html = _layout(_card('rgba(200,155,60,.35)', `
    <h1 style="color:#F5EBD7;font-size:1.4rem;margin:0 0 12px">🎮 Hoş geldin, <span style="color:#C89B3C">${username}</span>!</h1>
    <p style="color:#A9A6A0;line-height:1.7">Saltanat Online'a katıldın. Osmanlı döneminde geçen, binlerce oyuncunun aynı dünyada yaşadığı strateji ve rol yapma oyununa hoş geldin.</p>
    <hr style="border:none;border-top:1px solid rgba(200,155,60,.15);margin:16px 0">
    <p style="color:#F5EBD7;font-weight:600;margin-bottom:10px">Başlangıç bonusların:</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${[['₺10.000','Başlangıç Akçesi'],['50 UC','Altın Sikke'],['Lv1','Seviye']].map(([v,l])=>`
      <div style="flex:1;min-width:90px;background:rgba(200,155,60,.1);border:1px solid rgba(200,155,60,.25);border-radius:10px;padding:12px;text-align:center">
        <div style="font-size:1.1rem;font-weight:800;color:#C89B3C">${v}</div>
        <div style="font-size:.7rem;color:#A9A6A0;text-transform:uppercase;margin-top:3px">${l}</div>
      </div>`).join('')}
    </div>
  `));
  return _send({ to, toName: username, subject: '⚔ Saltanat Online\'a Hoş Geldin!', html, type: 'welcome' });
}

// ── Email Doğrulama ───────────────────────────────────────────────────────────
function sendEmailVerification(to, username, verifyUrl) {
  const html = _layout(_card('rgba(62,140,90,.3)', `
    <h1 style="color:#F5EBD7;font-size:1.3rem;margin:0 0 12px">✉️ E-posta Adresini Doğrula</h1>
    <p style="color:#A9A6A0;line-height:1.7">Merhaba <strong style="color:#F5EBD7">${username}</strong>,</p>
    <p style="color:#A9A6A0;line-height:1.7">Saltanat Online hesabını aktive etmek için aşağıdaki butona tıkla.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${verifyUrl}" style="background:linear-gradient(135deg,#C89B3C,#E8B84B);color:#0F1115;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:800;font-size:15px;display:inline-block;letter-spacing:.05em">✉️ E-postamı Doğrula</a>
    </div>
    <p style="color:#C89B3C;font-size:.82rem;text-align:center">⚠️ Bu bağlantı 24 saat geçerlidir.</p>
    <p style="color:#3E4450;font-size:.82rem;text-align:center">Bu isteği sen yapmadıysan bu maili yoksay.</p>
  `));
  return _send({ to, toName: username, subject: '✉️ Saltanat Online — E-posta Doğrulama', html, type: 'email_verify' });
}

// ── Şifre Sıfırlama ───────────────────────────────────────────────────────────
function sendPasswordReset(to, username, resetUrl) {
  const html = _layout(_card('rgba(184,66,60,.3)', `
    <h1 style="color:#F5EBD7;font-size:1.3rem;margin:0 0 12px">🔐 Şifre Sıfırlama</h1>
    <p style="color:#A9A6A0;line-height:1.7">Merhaba <strong style="color:#F5EBD7">${username}</strong>,</p>
    <p style="color:#A9A6A0;line-height:1.7">Saltanat Online hesabın için şifre sıfırlama talebinde bulundun.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${resetUrl}" style="background:linear-gradient(135deg,#B8423C,#D45550);color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block">🔐 Şifremi Sıfırla</a>
    </div>
    <p style="color:#C89B3C;font-size:.82rem;text-align:center">⚠️ Bu bağlantı 1 saat geçerlidir.</p>
    <p style="color:#3E4450;font-size:.82rem;text-align:center">Bu isteği sen yapmadıysan yoksay — şifren değişmeyecek.</p>
  `));
  return _send({ to, toName: username, subject: '🔐 Saltanat Online — Şifre Sıfırlama', html, type: 'password_reset' });
}

// ── Ban Bildirimi ─────────────────────────────────────────────────────────────
function sendBanNotification(to, username, reason, until) {
  const untilStr = until ? new Date(until).toLocaleString('tr-TR') : 'Süresiz';
  const html = _layout(_card('rgba(184,66,60,.4)', `
    <h1 style="color:#B8423C;font-size:1.3rem;margin:0 0 12px">🚫 Hesap Askıya Alındı</h1>
    <p style="color:#A9A6A0;line-height:1.7">Merhaba <strong style="color:#F5EBD7">${username}</strong>,</p>
    <div style="background:rgba(184,66,60,.1);border:1px solid rgba(184,66,60,.3);border-radius:8px;padding:12px 16px;color:#E8A5A5;font-style:italic;margin:12px 0">${reason || 'Kural ihlali'}</div>
    <p style="color:#A9A6A0">Ban süresi: <strong style="color:#E8A5A5">${untilStr}</strong></p>
    <p style="color:#3E4450;font-size:.82rem">Haksız olduğunu düşünüyorsan yöneticilere itiraz edebilirsin.</p>
  `));
  return _send({ to, toName: username, subject: '🚫 Saltanat Online — Hesap Askıya Alındı', html, type: 'ban' });
}

// ── Seçim Sonucu ──────────────────────────────────────────────────────────────
function sendElectionResult(to, username, position, winner, votes) {
  const html = _layout(_card('rgba(200,155,60,.25)', `
    <h1 style="color:#C89B3C;font-size:1.3rem;margin:0 0 12px">🗳️ Seçim Sonuçlandı: ${position}</h1>
    <p style="color:#A9A6A0">Merhaba <strong style="color:#F5EBD7">${username}</strong>,</p>
    <div style="font-size:1.4rem;font-weight:900;color:#3E8C5A;text-align:center;padding:14px;background:rgba(62,140,90,.1);border:1px solid rgba(62,140,90,.2);border-radius:10px;margin:16px 0">🏆 Kazanan: ${winner} (${votes} oy)</div>
    <p style="color:#3E4450;font-size:.82rem;text-align:center">Sonuçların tamamını oyun içinde görebilirsin.</p>
  `));
  return _send({ to, toName: username, subject: `🗳️ Seçim Sonucu: ${position}`, html, type: 'election_result' });
}

// ── Genel Bildirim ────────────────────────────────────────────────────────────
function sendNotification(to, username, title, message) {
  const html = _layout(_card('rgba(200,155,60,.15)', `
    <h1 style="color:#F5EBD7;font-size:1.2rem;margin:0 0 12px">${title}</h1>
    <p style="color:#A9A6A0;line-height:1.7">Merhaba <strong style="color:#F5EBD7">${username}</strong>,</p>
    <p style="color:#A9A6A0;line-height:1.7">${message}</p>
  `));
  return _send({ to, toName: username, subject: `📢 Saltanat Online: ${title}`, html, type: 'notification' });
}

module.exports = {
  sendWelcome,
  sendEmailVerification,
  sendPasswordReset,
  sendBanNotification,
  sendElectionResult,
  sendNotification,
};
