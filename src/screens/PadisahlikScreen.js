"use strict";
// ═══════════════════════════════════════════════════════
// PADİŞAHLIK SAVAŞI EKRANI
// 90 günlük döngü — 87. günde Genel Sefer başlar (3 gün)
// ═══════════════════════════════════════════════════════

window.PadisahlikScreen = function PadisahlikScreen({ profile, setProfile, showNotif, onNavigate }) {
  const G='#C89B3C', BG='#0F0800', T='#F5EBD7', M='#A9A6A0', S='#2D1800', R='#B8423C', GR='#3E8C5A';
  const token = (() => { try { return localStorage.getItem('rep_token') || ''; } catch { return ''; } })();

  const [durum, setDurum]       = React.useState(null);
  const [yukleniyor, setYukleniyor] = React.useState(true);
  const [sekme, setSekme]       = React.useState('tahta');
  // Genel Sefer — paralı asker
  const [paketler, setPaketler] = React.useState([]);
  const [kiralaniyor, setKiralaniyor] = React.useState(null);
  // Geri sayım timer
  const [saniye, setSaniye]     = React.useState(0);

  // ── Durum yükle ──────────────────────────────────────────────────────────
  const yukle = async () => {
    setYukleniyor(true);
    try {
      const r = await fetch('/api/padisahlik/durum', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await r.json();
      if (d.success) setDurum(d);
    } catch (_) {}
    try {
      const r2 = await fetch('/api/mercenary/paketler', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d2 = await r2.json();
      if (d2.success) setPaketler(d2.paketler || []);
    } catch (_) {}
    setYukleniyor(false);
  };

  React.useEffect(() => { yukle(); }, []);

  // Geri sayım
  React.useEffect(() => {
    if (!durum?.donem) return;
    const hedef = durum.donem.durum === 'genel_sefer'
      ? new Date(durum.donem.bitis_tarihi).getTime()
      : new Date(durum.donem.genel_sefer_baslangic).getTime();
    const tick = () => {
      const kalan = Math.max(0, Math.floor((hedef - Date.now()) / 1000));
      setSaniye(kalan);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [durum?.donem]);

  // Socket — Genel Sefer olayları
  React.useEffect(() => {
    const s = window._socket;
    if (!s) return;
    const onGs  = () => { showNotif('⚔️ GENEL SEFER BAŞLADI!', 'warning'); yukle(); };
    const onBit = () => { showNotif('🏳️ Genel Sefer sona erdi', 'info'); yukle(); };
    const onPad = (d) => { showNotif(`👑 Yeni Padişah: ${d.beylikId}`, 'success'); yukle(); };
    s.on('genel_sefer:basladi', onGs);
    s.on('genel_sefer:bitti',   onBit);
    s.on('padisah:ilan_edildi', onPad);
    return () => {
      s.off('genel_sefer:basladi', onGs);
      s.off('genel_sefer:bitti',   onBit);
      s.off('padisah:ilan_edildi', onPad);
    };
  }, []);

  // ── Paralı asker kirala ───────────────────────────────────────────────────
  const kirala = async (paketId) => {
    setKiralaniyor(paketId);
    try {
      const r = await fetch('/api/mercenary/hire', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ paketId }),
      });
      const d = await r.json();
      if (d.success) {
        showNotif(`⚔️ ${d.message}`, 'success');
        setProfile && setProfile(p => ({ ...p, weapons: (p?.weapons||0) + d.askerEklendi }));
      } else {
        showNotif(d.error || 'Hata oluştu', 'error');
      }
    } catch (_) { showNotif('Bağlantı hatası', 'error'); }
    setKiralaniyor(null);
  };

  // ── Geri sayım formatı ────────────────────────────────────────────────────
  const fmtSure = (s) => {
    const g  = Math.floor(s / 86400);
    const sa = Math.floor((s % 86400) / 3600);
    const dk = Math.floor((s % 3600) / 60);
    const sn = s % 60;
    if (g > 0)  return `${g}g ${sa}s ${dk}dk`;
    if (sa > 0) return `${sa}s ${dk}dk ${sn}sn`;
    return `${dk}dk ${sn}sn`;
  };

  const genelSefer  = durum?.donem?.durum === 'genel_sefer';
  const hedefLabel  = genelSefer ? '⚔️ Genel Sefer Bitimine' : '⚔️ Genel Sefer Başlangıcına';

  return React.createElement('div', { style:{ minHeight:'100vh', background:BG, fontFamily:"'Inter',sans-serif", paddingBottom:80 } },

    // ── Üst başlık ──────────────────────────────────────────────────────────
    React.createElement('div', { style:{ background:'linear-gradient(135deg,#1a0800,#2d1600)', borderBottom:'1px solid rgba(200,155,60,0.25)', padding:'14px 16px' } },
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:10 } },
        onNavigate && React.createElement('button', { onClick:()=>onNavigate('home'), style:{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'6px 10px', color:M, fontSize:'0.75rem', cursor:'pointer' } }, '← Geri'),
        React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'1.1rem', fontWeight:800, color:G, letterSpacing:'0.08em' } }, '👑 PADİŞAHLIK SAVAŞI')
      )
    ),

    // ── Genel Sefer banner ───────────────────────────────────────────────────
    genelSefer && React.createElement('div', { style:{ position:'relative', margin:'12px 16px', borderRadius:14, overflow:'hidden', border:'2px solid rgba(184,66,60,0.7)' } },
      React.createElement('img', { src:'/assets/ui/genel-sefer-banner.svg', alt:'Genel Sefer', style:{ width:'100%', display:'block', maxHeight:140, objectFit:'cover' } }),
      React.createElement('div', { style:{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, padding:'10px' } },
        React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'1.05rem', fontWeight:900, color:'#FF6B6B', textShadow:'0 2px 8px rgba(0,0,0,0.8)', letterSpacing:'0.06em' } }, '⚔️ GENEL SEFER BAŞLADI!'),
        React.createElement('div', { style:{ fontSize:'0.72rem', color:'#FFC9C9', textShadow:'0 1px 4px rgba(0,0,0,0.9)' } }, 'Tüm koruma kalkanları ve bekleme süreleri devre dışı!'),
        React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'0.95rem', fontWeight:800, color:'#FFD700', textShadow:'0 2px 6px rgba(0,0,0,0.9)' } }, `⏱ ${fmtSure(saniye)}`)
      )
    ),

    // ── Normal dönem geri sayım ──────────────────────────────────────────────
    !genelSefer && durum?.donem && React.createElement('div', { style:{ background:S, border:'1px solid rgba(200,155,60,0.2)', margin:'12px 16px', borderRadius:14, padding:'14px 16px', textAlign:'center' } },
      React.createElement('div', { style:{ fontSize:'0.72rem', color:M, marginBottom:4 } }, hedefLabel),
      React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'1.4rem', fontWeight:900, color:G } }, fmtSure(saniye)),
      React.createElement('div', { style:{ fontSize:'0.65rem', color:M, marginTop:4 } },
        `Dönem No: ${durum?.donem?.id || '—'}  •  ${genelSefer ? '⚔️ Genel Sefer' : '🕊️ Barış Dönemi'}`
      )
    ),

    // ── Sekmeler ─────────────────────────────────────────────────────────────
    React.createElement('div', { style:{ display:'flex', gap:4, padding:'0 16px', marginTop:8, marginBottom:8 } },
      [['tahta','🏆 Fetih Tahtası'], ['sefer', genelSefer ? '⚔️ Paralı Asker' : '⚔️ Genel Sefer'], ['gecmis','📜 Geçmiş']].map(([id, lbl]) =>
        React.createElement('button', { key:id, onClick:()=>setSekme(id), style:{
          flex:1, padding:'8px 4px', borderRadius:10, border:'none', cursor:'pointer',
          fontSize:'0.68rem', fontWeight:700,
          background: sekme===id ? 'rgba(200,155,60,0.15)' : 'rgba(255,255,255,0.04)',
          color: sekme===id ? G : M,
          border: `1px solid ${sekme===id ? 'rgba(200,155,60,0.35)' : 'rgba(255,255,255,0.07)'}`,
        } }, lbl)
      )
    ),

    yukleniyor
      ? React.createElement('div', { style:{ textAlign:'center', padding:'40px', color:M } }, '⏳ Yükleniyor...')
      : React.createElement('div', { style:{ padding:'0 16px', display:'flex', flexDirection:'column', gap:10 } },

        // ── Fetih Tahtası ──────────────────────────────────────────────────
        sekme === 'tahta' && React.createElement('div', null,
          React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'0.85rem', color:G, fontWeight:700, marginBottom:10 } }, '🗺️ EYALET FETİH SIRALAMASI'),
          (!durum?.sira?.length)
            ? React.createElement('div', { style:{ textAlign:'center', color:M, fontSize:'0.8rem', padding:'30px' } }, 'Henüz fethedilen eyalet yok. Beylik savaşları ile eyalet fethet!')
            : React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:6 } },
                durum.sira.map((s, i) => {
                  const madalya = i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`;
                  return React.createElement('div', { key:s.beylik_id, style:{
                    display:'flex', alignItems:'center', gap:10,
                    background: i===0 ? 'rgba(200,155,60,0.12)' : S,
                    border: `1px solid ${i===0 ? 'rgba(200,155,60,0.35)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius:12, padding:'10px 14px',
                  } },
                    React.createElement('div', { style:{ fontSize:i<3?'1.3rem':'0.85rem', minWidth:28, textAlign:'center', fontWeight:800, color:M } }, madalya),
                    React.createElement('div', { style:{ flex:1 } },
                      React.createElement('div', { style:{ fontSize:'0.82rem', fontWeight:700, color:T } }, `⚜️ ${s.beylik_id}`),
                    ),
                    React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'0.9rem', fontWeight:900, color:G } }, `${s.eyalet_sayisi} 🗺️`)
                  );
                })
              ),

          // Son padişah bilgisi
          durum?.sonPadisah?.padisah_beylik_id && React.createElement('div', { style:{ marginTop:14, background:'rgba(200,155,60,0.08)', border:'1px solid rgba(200,155,60,0.25)', borderRadius:12, padding:'12px', textAlign:'center' } },
            React.createElement('div', { style:{ fontSize:'0.7rem', color:M, marginBottom:4 } }, 'Son Dönem Padişahı'),
            React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'1rem', fontWeight:900, color:G } }, `👑 ${durum.sonPadisah.padisah_beylik_id}`)
          )
        ),

        // ── Genel Sefer / Paralı Asker ─────────────────────────────────────
        sekme === 'sefer' && React.createElement('div', null,
          genelSefer
            ? React.createElement('div', null,
                React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'0.85rem', color:R, fontWeight:700, marginBottom:10 } }, '⚔️ PARALI ASKER KİRALA'),
                React.createElement('div', { style:{ fontSize:'0.72rem', color:M, marginBottom:14 } },
                  'Genel Sefer boyunca orduna anlık asker katabilirsin. Dönem sona erince kaybolur.'
                ),
                React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:8 } },
                  paketler.map(p =>
                    React.createElement('div', { key:p.id, style:{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      background:S, border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'12px 14px',
                    } },
                      React.createElement('div', null,
                        React.createElement('div', { style:{ fontSize:'0.85rem', fontWeight:700, color:T } }, p.ad),
                        React.createElement('div', { style:{ fontSize:'0.68rem', color:M, marginTop:2 } }, `${p.asker} asker • ${p.maliyet.toLocaleString('tr-TR')} 🪙`)
                      ),
                      React.createElement('button', {
                        onClick: () => kirala(p.id),
                        disabled: !!kiralaniyor,
                        style:{
                          display:'flex', alignItems:'center', gap:5,
                          padding:'8px 14px', borderRadius:10, border:'none',
                          background: kiralaniyor===p.id ? M : `linear-gradient(135deg,${G},#A07828)`,
                          color:'#0F0800', fontWeight:800, fontSize:'0.75rem', cursor:'pointer',
                        }
                      },
                        kiralaniyor===p.id ? '...' : React.createElement(React.Fragment, null,
                          React.createElement('img', { src:'/assets/icons/mercenary.svg', width:14, height:14, alt:'', style:{ flexShrink:0 } }),
                          'Kirala'
                        )
                      )
                    )
                  )
                )
              )
            : React.createElement('div', { style:{ textAlign:'center', padding:'40px', color:M } },
                React.createElement('div', { style:{ fontSize:'2rem', marginBottom:8 } }, '🕊️'),
                React.createElement('div', { style:{ fontSize:'0.85rem', fontWeight:700, color:T, marginBottom:6 } }, 'Genel Sefer Henüz Başlamadı'),
                React.createElement('div', { style:{ fontSize:'0.72rem' } }, 'Paralı asker kiralama yalnızca Genel Sefer süresince aktif.'),
                durum?.donem && React.createElement('div', { style:{ fontSize:'0.7rem', color:G, marginTop:10, fontWeight:700 } }, `Genel Sefer: ${fmtSure(saniye)}`)
              )
        ),

        // ── Geçmiş dönemler ────────────────────────────────────────────────
        sekme === 'gecmis' && React.createElement('div', null,
          React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'0.85rem', color:G, fontWeight:700, marginBottom:10 } }, '📜 GEÇMİŞ DÖNEMLER'),
          React.createElement(GecmisDönemler, { token })
        )
      )
  );
};

// ── Alt bileşen: Geçmiş Dönemler ─────────────────────────────────────────────
function GecmisDönemler({ token }) {
  const G='#C89B3C', M='#A9A6A0', T='#F5EBD7', S='#2D1800';
  const [liste, setListe] = React.useState([]);
  const [yuk, setYuk]     = React.useState(true);

  React.useEffect(() => {
    fetch('/api/padisahlik/gecmis', { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setListe(d.gecmis||[]); })
      .catch(()=>{})
      .finally(()=>setYuk(false));
  }, []);

  if (yuk) return React.createElement('div', { style:{ textAlign:'center', color:M, padding:'20px' } }, '⏳');
  if (!liste.length) return React.createElement('div', { style:{ textAlign:'center', color:M, fontSize:'0.8rem', padding:'30px' } }, 'Henüz tamamlanan dönem yok.');

  return React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:8 } },
    liste.map(d =>
      React.createElement('div', { key:d.id, style:{
        background:S, border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'10px 14px',
      } },
        React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', marginBottom:4 } },
          React.createElement('div', { style:{ fontSize:'0.78rem', fontWeight:700, color:T } }, `Dönem #${d.id}`),
          React.createElement('div', { style:{ fontSize:'0.65rem', color: d.durum==='tamamlandi'?G:M, fontWeight:700 } },
            d.durum==='tamamlandi' ? '✅ Tamamlandı' : d.durum==='genel_sefer' ? '⚔️ Genel Sefer' : '🕊️ Normal'
          )
        ),
        d.padisah_beylik_id && React.createElement('div', { style:{ fontSize:'0.72rem', color:G, marginBottom:4 } }, `👑 Padişah: ${d.padisah_beylik_id}`),
        React.createElement('div', { style:{ fontSize:'0.62rem', color:M } },
          `${new Date(d.baslangic_tarihi).toLocaleDateString('tr-TR')} → ${new Date(d.bitis_tarihi).toLocaleDateString('tr-TR')}`
        )
      )
    )
  );
}
