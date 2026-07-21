"use strict";
// ═══════════════════════════════════════════════════════
// SALTANAT ONLINE — Oyun Ayarları Ekranı
// Müzik, bildirimler, hesap yönetimi
// ═══════════════════════════════════════════════════════

window.GameSettingsScreen = function GameSettingsScreen({ cu, setCurrentPage, onLogout }) {
  const MUSIC_KEY  = 'rep_musicEnabled';
  const VOL_KEY    = 'rep_musicVolume';
  const NOTIF_KEY  = 'rep_notifsEnabled';

  const [musicOn,   setMusicOn]   = React.useState(() => localStorage.getItem(MUSIC_KEY) !== 'false');
  const [volume,    setVolume]    = React.useState(() => parseFloat(localStorage.getItem(VOL_KEY) || '0.4'));
  const [notifsOn,  setNotifsOn]  = React.useState(() => localStorage.getItem(NOTIF_KEY) !== 'false');
  const [delConfirm, setDelConfirm] = React.useState(false);
  const [deleting,   setDeleting]   = React.useState(false);
  const [delMsg,     setDelMsg]     = React.useState('');

  // ── Müzik yönetimi ──────────────────────────────────
  const audioRef = React.useRef(null);

  React.useEffect(() => {
    if (!audioRef.current) {
      const a = new Audio('/sounds/Gloria_In_Ruina.mp3');
      a.loop    = true;
      a.volume  = volume;
      audioRef.current = a;
      window._saltanatAudio = a;
    }
    // Sayfa kapanana kadar audio nesnesini canlı tut
    return () => {}; // intentionally no cleanup — audio lives globally
  }, []);

  React.useEffect(() => {
    const a = audioRef.current || window._saltanatAudio;
    if (!a) return;
    a.volume = volume;
    localStorage.setItem(VOL_KEY, String(volume));
  }, [volume]);

  React.useEffect(() => {
    const a = audioRef.current || window._saltanatAudio;
    if (!a) return;
    localStorage.setItem(MUSIC_KEY, String(musicOn));
    if (musicOn) {
      a.play().catch(() => {});
    } else {
      a.pause();
    }
  }, [musicOn]);

  React.useEffect(() => {
    localStorage.setItem(NOTIF_KEY, String(notifsOn));
  }, [notifsOn]);

  // Bildirim izni iste
  function requestNotifPermission() {
    if (!('Notification' in window)) return;
    Notification.requestPermission().then(p => {
      setNotifsOn(p === 'granted');
      localStorage.setItem(NOTIF_KEY, String(p === 'granted'));
    });
  }

  function toggleNotifs() {
    const next = !notifsOn;
    if (next) {
      requestNotifPermission();
    } else {
      setNotifsOn(false);
      localStorage.setItem(NOTIF_KEY, 'false');
    }
  }

  // ── Hesap silme ──────────────────────────────────────
  async function deleteAccount() {
    setDeleting(true);
    setDelMsg('');
    try {
      const token = localStorage.getItem('us_jwt') || '';
      const r = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok || d.success) {
        localStorage.clear();
        window.location.reload();
      } else {
        setDelMsg(d.error || 'Hesap silinemedi. Lütfen tekrar deneyin.');
      }
    } catch (e) {
      setDelMsg('Bağlantı hatası: ' + e.message);
    }
    setDeleting(false);
  }

  // ── Stil sabitleri ────────────────────────────────────
  const S = {
    page:    { minHeight: '100vh', background: '#0F0800', fontFamily: "'Inter',sans-serif", paddingBottom: 80 },
    header:  { background: 'linear-gradient(135deg,#1a1000 0%,#2d1e00 50%,#1a1000 100%)', borderBottom: '1px solid rgba(240,179,62,0.25)', padding: '16px' },
    card:    { background: 'rgba(27,33,43,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px', marginBottom: 12 },
    label:   { fontSize: '0.7rem', color: '#8893A1', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 10 },
    row:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' },
    divider: { height: 1, background: 'rgba(255,255,255,0.06)', margin: '2px 0' },
    gold:    '#F0B33E',
    muted:   '#8893A1',
    text:    '#EDE7DA',
  };

  function Toggle({ on, onToggle }) {
    return React.createElement('div', {
      onClick: onToggle,
      style: {
        width: 44, height: 24, borderRadius: 12, cursor: 'pointer', position: 'relative', transition: 'background 0.25s',
        background: on ? 'rgba(240,179,62,0.85)' : 'rgba(255,255,255,0.12)',
      }
    },
      React.createElement('div', {
        style: {
          position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18,
          borderRadius: '50%', background: on ? '#0F0800' : '#8893A1', transition: 'left 0.25s',
        }
      })
    );
  }

  return React.createElement('div', { style: S.page },

    // Header
    React.createElement('div', { style: S.header },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
        React.createElement('button', {
          onClick: () => setCurrentPage('home'),
          style: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '6px 10px', color: '#8893A1', fontSize: '0.75rem', cursor: 'pointer' }
        }, '← Geri'),
        React.createElement('div', { style: { fontSize: '1.3rem' } }, '⚙️'),
        React.createElement('div', { style: { fontFamily: "'Cinzel',serif", fontWeight: 900, fontSize: '1.1rem', color: S.gold } }, 'Oyun Ayarları')
      )
    ),

    React.createElement('div', { style: { padding: '16px 14px' } },

      // ── Müzik & Ses ──
      React.createElement('div', { style: S.card },
        React.createElement('div', { style: S.label }, '🎵 Müzik & Ses'),

        React.createElement('div', { style: S.row },
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: '0.85rem', fontWeight: 600, color: S.text } }, 'Arka Plan Müziği'),
            React.createElement('div', { style: { fontSize: '0.65rem', color: S.muted, marginTop: 2 } }, 'Gloria In Ruina — Ottoman soundtrack')
          ),
          React.createElement(Toggle, { on: musicOn, onToggle: () => setMusicOn(v => !v) })
        ),

        React.createElement('div', { style: S.divider }),

        React.createElement('div', { style: { padding: '12px 0 4px' } },
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 } },
            React.createElement('span', { style: { fontSize: '0.8rem', color: musicOn ? S.text : S.muted } }, '🔈 Ses Seviyesi'),
            React.createElement('span', { style: { fontSize: '0.75rem', color: S.gold, fontFamily: "'JetBrains Mono',monospace" } }, Math.round(volume * 100) + '%')
          ),
          React.createElement('input', {
            type: 'range', min: 0, max: 1, step: 0.05,
            value: volume,
            disabled: !musicOn,
            onChange: e => setVolume(parseFloat(e.target.value)),
            style: {
              width: '100%', accentColor: S.gold, cursor: musicOn ? 'pointer' : 'not-allowed',
              opacity: musicOn ? 1 : 0.4,
            }
          })
        )
      ),

      // ── Bildirimler ──
      React.createElement('div', { style: S.card },
        React.createElement('div', { style: S.label }, '🔔 Bildirimler'),
        React.createElement('div', { style: S.row },
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: '0.85rem', fontWeight: 600, color: S.text } }, 'Oyun Bildirimleri'),
            React.createElement('div', { style: { fontSize: '0.65rem', color: S.muted, marginTop: 2 } }, 'Savaş, mesaj ve etkinlik uyarıları')
          ),
          React.createElement(Toggle, { on: notifsOn, onToggle: toggleNotifs })
        ),
        ('Notification' in window && Notification.permission === 'denied') &&
          React.createElement('div', { style: { fontSize: '0.65rem', color: '#EF5350', marginTop: 6, padding: '6px 10px', background: 'rgba(239,83,80,0.07)', borderRadius: 8 } },
            '⚠️ Tarayıcı bildirimleri engellendi. Tarayıcı ayarlarından izin vermeniz gerekiyor.'
          )
      ),

      // ── Hesap Yönetimi ──
      React.createElement('div', { style: S.card },
        React.createElement('div', { style: S.label }, '👤 Hesap'),

        React.createElement('div', { style: { ...S.row, cursor: 'pointer' }, onClick: () => { if (onLogout) onLogout(); else { localStorage.removeItem('us_jwt'); window.location.reload(); } } },
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: '0.85rem', fontWeight: 600, color: S.text } }, 'Çıkış Yap'),
            React.createElement('div', { style: { fontSize: '0.65rem', color: S.muted, marginTop: 2 } }, 'Hesabından güvenli çıkış yap')
          ),
          React.createElement('span', { style: { color: S.muted, fontSize: '1rem' } }, '→')
        ),

        React.createElement('div', { style: S.divider }),

        !delConfirm
          ? React.createElement('div', { style: { ...S.row, cursor: 'pointer' }, onClick: () => setDelConfirm(true) },
              React.createElement('div', null,
                React.createElement('div', { style: { fontSize: '0.85rem', fontWeight: 600, color: '#EF5350' } }, '🗑️ Hesabı Sil'),
                React.createElement('div', { style: { fontSize: '0.65rem', color: S.muted, marginTop: 2 } }, 'Tüm verilerini kalıcı olarak sil')
              ),
              React.createElement('span', { style: { color: '#EF5350', fontSize: '1rem' } }, '→')
            )
          : React.createElement('div', { style: { marginTop: 10 } },
              React.createElement('div', { style: { background: 'rgba(239,83,80,0.08)', border: '1px solid rgba(239,83,80,0.25)', borderRadius: 10, padding: '12px 14px', marginBottom: 10 } },
                React.createElement('div', { style: { fontSize: '0.82rem', fontWeight: 700, color: '#EF5350', marginBottom: 6 } }, '⚠️ Bu işlem geri alınamaz!'),
                React.createElement('div', { style: { fontSize: '0.72rem', color: S.muted, lineHeight: 1.5 } }, 'Hesabın, tüm ilerleme, sikke, eyalet ve birliktelikler kalıcı olarak silinecek.')
              ),
              delMsg && React.createElement('div', { style: { fontSize: '0.7rem', color: '#EF5350', marginBottom: 8 } }, delMsg),
              React.createElement('div', { style: { display: 'flex', gap: 8 } },
                React.createElement('button', {
                  onClick: deleteAccount,
                  disabled: deleting,
                  style: { flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: deleting ? '#333' : '#EF5350', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: deleting ? 'not-allowed' : 'pointer' }
                }, deleting ? 'Siliniyor...' : '✓ Evet, Hesabı Sil'),
                React.createElement('button', {
                  onClick: () => { setDelConfirm(false); setDelMsg(''); },
                  style: { flex: 1, padding: '10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: S.muted, fontSize: '0.82rem', cursor: 'pointer' }
                }, '✕ Vazgeç')
              )
            )
      ),

      // ── Uygulama bilgisi ──
      React.createElement('div', { style: { textAlign: 'center', marginTop: 24, color: 'rgba(136,147,161,0.4)', fontSize: '0.65rem', letterSpacing: '0.1em' } },
        React.createElement('div', { style: { fontFamily: "'Cinzel',serif", color: 'rgba(200,155,60,0.35)', marginBottom: 4 } }, 'SALTANAT ONLINE'),
        'v8.0 · İmparatorluk Seninle Yükselir'
      )
    )
  );
};
