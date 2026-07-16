"use strict";
// ═══════════════════════════════════════════════════════
// SALTANAT ONLINE — Beylik Sistemi
// Beylik kurma, katılma, yönetim — 1M Sikke + 50 Altın + 150k Sadakat
// ═══════════════════════════════════════════════════════

const BEYLIK_KUR_MALIYET = { sikke: 1_000_000, altin: 50, sadakat: 150_000 };

const BEYLIK_UNVANLARI = [
  { id:'bey',       label:'Bey',         emoji:'⚜️',  min:0 },
  { id:'sancakbeyi',label:'Sancak Beyi', emoji:'🚩',  min:5 },
  { id:'vali',      label:'Vali',        emoji:'🏰',  min:10 },
  { id:'pasa',      label:'Paşa',        emoji:'🦅',  min:20 },
  { id:'vezir',     label:'Vezir',       emoji:'👑',  min:50 },
];

const IDEOLOJI_LISTESI = [
  { id:'gazi',    label:'Gazi Yolu',     acik:'Savaş odaklı, fetih puanı +20%',  renk:'#B8423C' },
  { id:'ticaret', label:'Ticaret Beyi',  acik:'Gelir odaklı, Sikke üretimi +15%',renk:'#C89B3C' },
  { id:'dini',    label:'Dini Bey',      acik:'Sadakat odaklı, üye bağlılığı +25%',renk:'#5B8DD9' },
  { id:'ilim',    label:'İlim Ocağı',    acik:'Bilim odaklı, XP kazanımı +10%',  renk:'#3E8C5A' },
];

window.BeylikScreen = function BeylikScreen({ profile, setProfile, showNotif, allUsers }) {
  const [beyliks, setBeyliks] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('rep_beyliks') || '[]'); } catch { return []; }
  });
  const [tab, setTab] = React.useState('liste'); // 'liste' | 'kur' | 'yonet' | 'liderlik'
  const [kurForm, setKurForm] = React.useState({ ad: '', ideoloji: 'gazi', renk: '#C89B3C', motto: '' });
  const [seciliBeylik, setSeciliBeylik] = React.useState(null);
  const [katilOnay, setKatilOnay] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const uid = profile?.uid || profile?.id;
  const benimBeylik = beyliks.find(b => b.kurucuId === uid || (b.uyeler||[]).includes(uid));
  const isKurucu = benimBeylik?.kurucuId === uid;

  const sadakat = profile?.sadakat || 0;
  const sikke = profile?.money || 0;
  const altin = profile?.altin || profile?.underCoin || 0;

  const kaydetBeyliks = (yeni) => {
    setBeyliks(yeni);
    localStorage.setItem('rep_beyliks', JSON.stringify(yeni));
    try { window._socket?.emit('beylik:guncelle', { beyliks: yeni }); } catch(_) {}
  };

  const beylikKur = () => {
    if (!kurForm.ad.trim()) { showNotif('Beylik adı gerekli', 'error'); return; }
    if (kurForm.ad.trim().length < 3) { showNotif('Beylik adı en az 3 karakter olmalı', 'error'); return; }
    if (benimBeylik) { showNotif('Zaten bir beyliğe üyesiniz', 'error'); return; }
    if (sikke < BEYLIK_KUR_MALIYET.sikke) {
      showNotif(`Beylik kurmak için 🪙${BEYLIK_KUR_MALIYET.sikke.toLocaleString('tr-TR')} Sikke gerekli`, 'error'); return;
    }
    if (altin < BEYLIK_KUR_MALIYET.altin) {
      showNotif(`Beylik kurmak için ⚜️${BEYLIK_KUR_MALIYET.altin} Altın gerekli`, 'error'); return;
    }
    if (sadakat < BEYLIK_KUR_MALIYET.sadakat) {
      showNotif(`Beylik kurmak için 💎${BEYLIK_KUR_MALIYET.sadakat.toLocaleString('tr-TR')} Sadakat Puanı gerekli`, 'error'); return;
    }
    if (beyliks.find(b => b.ad.toLowerCase() === kurForm.ad.trim().toLowerCase())) {
      showNotif('Bu isimde bir beylik zaten var', 'error'); return;
    }
    setLoading(true);
    const yeniBeylik = {
      id: 'bey_' + Date.now(),
      ad: kurForm.ad.trim(),
      ideoloji: kurForm.ideoloji,
      renk: kurForm.renk,
      motto: kurForm.motto.trim() || 'Adalet ve Zafer',
      kurucuId: uid,
      kurucuAdi: profile?.username || 'Anonim',
      uyeler: [uid],
      uyeSayisi: 1,
      hazine: 0,
      prestij: 0,
      eyaletler: [],
      olusturuldu: Date.now(),
    };
    const np = {
      ...profile,
      money: sikke - BEYLIK_KUR_MALIYET.sikke,
      altin: altin - BEYLIK_KUR_MALIYET.altin,
      underCoin: altin - BEYLIK_KUR_MALIYET.altin,
      sadakat: sadakat - BEYLIK_KUR_MALIYET.sadakat,
      beylikId: yeniBeylik.id,
      beylikUnvan: 'bey',
    };
    kaydetBeyliks([...beyliks, yeniBeylik]);
    setProfile(np);
    localStorage.setItem('rep_userProfile', JSON.stringify(np));
    try { window._pushGameEvent?.('beylik_kuruldu', `⚜️ ${yeniBeylik.ad} Beyliği Kuruldu!`,
      `${profile?.username||'Bir oyuncu'} "${yeniBeylik.ad}" beyliğini kurdu.`, '⚜️', 'beylik'); } catch(_) {}
    showNotif(`⚜️ ${yeniBeylik.ad} Beyliği kuruldu!`, 'success');
    setTab('yonet');
    setLoading(false);
  };

  const beyligeKatil = (beylik) => {
    if (benimBeylik) { showNotif('Zaten bir beyliğe üyesiniz', 'error'); return; }
    const guncellenmis = beyliks.map(b =>
      b.id === beylik.id
        ? { ...b, uyeler: [...(b.uyeler||[]), uid], uyeSayisi: (b.uyeSayisi||1)+1 }
        : b
    );
    kaydetBeyliks(guncellenmis);
    const np = { ...profile, beylikId: beylik.id, beylikUnvan: 'bey' };
    setProfile(np);
    localStorage.setItem('rep_userProfile', JSON.stringify(np));
    showNotif(`⚜️ ${beylik.ad} Beyliği'ne katıldınız!`, 'success');
    setKatilOnay(null);
    setSeciliBeylik(null);
    setTab('yonet');
  };

  const beyliktenAyril = () => {
    if (!benimBeylik || isKurucu) { showNotif('Kurucu çıkamaz — önce liderliği devredin', 'error'); return; }
    const guncellenmis = beyliks.map(b =>
      b.id === benimBeylik.id
        ? { ...b, uyeler: (b.uyeler||[]).filter(x=>x!==uid), uyeSayisi: Math.max(1,(b.uyeSayisi||1)-1) }
        : b
    );
    kaydetBeyliks(guncellenmis);
    const np = { ...profile, beylikId: null, beylikUnvan: null };
    setProfile(np);
    localStorage.setItem('rep_userProfile', JSON.stringify(np));
    showNotif('Beylikten ayrıldınız', 'info');
    setTab('liste');
  };

  const RENK_SECENEKLERI = ['#C89B3C','#B8423C','#5B8DD9','#3E8C5A','#8B6BF2','#E87040','#F5EBD7'];

  // ── Tema rengi ──────────────────────────────────────
  const GOLD = '#C89B3C';
  const BG   = '#1A0E00';
  const SURF = '#2D1800';

  const cardStyle = {
    background: SURF,
    border: '1px solid rgba(200,155,60,0.2)',
    borderRadius: 14,
    padding: '14px 14px',
    marginBottom: 10,
    cursor: 'pointer',
  };

  const btnStyle = (primary) => ({
    padding: '10px 0',
    borderRadius: 12,
    border: primary ? 'none' : '1px solid rgba(200,155,60,0.35)',
    background: primary ? 'linear-gradient(135deg,#C89B3C,#8B6A1A)' : 'rgba(200,155,60,0.08)',
    color: primary ? '#0F0800' : GOLD,
    fontWeight: 800,
    fontSize: '0.85rem',
    cursor: 'pointer',
    width: '100%',
  });

  return React.createElement('div', {
    style: { minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif", paddingBottom: 80 }
  },
    // ── Header ──
    React.createElement('div', {
      style: {
        background: 'linear-gradient(135deg,#2D1800 0%,#3D2200 50%,#2D1800 100%)',
        borderBottom: '1px solid rgba(200,155,60,0.3)',
        padding: '14px 16px 10px',
      }
    },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 } },
        React.createElement('div', { style: { fontSize: '1.6rem' } }, '⚜️'),
        React.createElement('div', null,
          React.createElement('div', { style: { fontFamily: "'Cinzel',serif", fontWeight: 900, fontSize: '1.15rem', color: GOLD } }, 'Beylikler'),
          React.createElement('div', { style: { fontSize: '0.68rem', color: '#A9A6A0' } },
            benimBeylik
              ? `${benimBeylik.ad} · ${isKurucu ? 'Bey (Kurucu)' : 'Üye'}`
              : `${beyliks.length} beylik kurulmuş`
          )
        ),
        benimBeylik && React.createElement('div', {
          style: { marginLeft: 'auto', background: 'rgba(200,155,60,0.15)', border: '1px solid rgba(200,155,60,0.35)', borderRadius: 8, padding: '4px 10px', fontSize: '0.7rem', color: GOLD, fontWeight: 700 }
        }, `⚜️ ${benimBeylik.ad}`)
      ),
      // Stats bar
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 } },
        [
          ['🪙', 'Sikke', (sikke||0).toLocaleString('tr-TR')],
          ['⚜️', 'Altın', (altin||0).toLocaleString('tr-TR')],
          ['💎', 'Sadakat', (sadakat||0).toLocaleString('tr-TR')],
        ].map(([ic,lb,val]) =>
          React.createElement('div', { key: lb, style: { background: 'rgba(200,155,60,0.06)', border: '1px solid rgba(200,155,60,0.12)', borderRadius: 8, padding: '6px 8px', textAlign: 'center' } },
            React.createElement('div', { style: { fontSize: '0.6rem', color: '#A9A6A0' } }, `${ic} ${lb}`),
            React.createElement('div', { style: { fontSize: '0.78rem', fontWeight: 700, color: GOLD, fontFamily: "'JetBrains Mono',monospace" } }, val)
          )
        )
      )
    ),

    // ── Tab Bar ──
    React.createElement('div', { style: { display: 'flex', gap: 4, padding: '10px 12px', borderBottom: '1px solid rgba(200,155,60,0.1)' } },
      [
        ['liste','🏰 Beylikler'],
        [benimBeylik ? 'yonet' : 'kur', benimBeylik ? '⚙️ Yönet' : '⚜️ Kur'],
        ['liderlik','🏆 Liderlik'],
      ].map(([id,lb]) =>
        React.createElement('button', {
          key: id,
          onClick: () => setTab(id),
          style: { flex: 1, padding: '7px 4px', borderRadius: 10, border: `1px solid ${tab===id ? GOLD : 'rgba(255,255,255,0.08)'}`, background: tab===id ? 'rgba(200,155,60,0.15)' : 'rgba(255,255,255,0.03)', color: tab===id ? GOLD : '#A9A6A0', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer' }
        }, lb)
      )
    ),

    // ── İçerik ──
    React.createElement('div', { style: { padding: '12px 12px' } },

      // ── LİSTE TAB ──
      tab === 'liste' && React.createElement('div', null,
        beyliks.length === 0
          ? React.createElement('div', { style: { textAlign: 'center', padding: '40px 20px' } },
              React.createElement('div', { style: { fontSize: '3rem', marginBottom: 12 } }, '⚜️'),
              React.createElement('div', { style: { fontFamily: "'Cinzel',serif", fontSize: '1.1rem', color: '#F5EBD7', marginBottom: 8 } }, 'Henüz Beylik Yok'),
              React.createElement('div', { style: { fontSize: '0.78rem', color: '#A9A6A0', lineHeight: 1.6 } }, 'İlk beyliği kuran sen ol. 1M Sikke, 50 Altın ve 150k Sadakat Puanı gereklidir.'),
              !benimBeylik && React.createElement('button', {
                onClick: () => setTab('kur'),
                style: { ...btnStyle(true), marginTop: 16, width: 180 }
              }, '⚜️ Beylik Kur')
            )
          : React.createElement('div', null,
              React.createElement('div', { style: { fontSize: '0.68rem', color: '#A9A6A0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 } },
                `${beyliks.length} Beylik`),
              beyliks.map(bey => {
                const idlg = IDEOLOJI_LISTESI.find(x=>x.id===bey.ideoloji) || IDEOLOJI_LISTESI[0];
                const benimmi = benimBeylik?.id === bey.id;
                return React.createElement('div', {
                  key: bey.id,
                  onClick: () => setSeciliBeylik(bey),
                  style: { ...cardStyle, borderLeft: `3px solid ${bey.renk || GOLD}`, background: benimmi ? 'rgba(200,155,60,0.08)' : SURF }
                },
                  React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
                    React.createElement('div', { style: { width: 40, height: 40, borderRadius: 10, background: `${bey.renk||GOLD}22`, border: `2px solid ${bey.renk||GOLD}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 } }, '⚜️'),
                    React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
                        React.createElement('span', { style: { fontWeight: 800, color: '#F5EBD7', fontSize: '0.9rem' } }, bey.ad),
                        benimmi && React.createElement('span', { style: { fontSize: '0.58rem', background: 'rgba(200,155,60,0.2)', border: '1px solid rgba(200,155,60,0.4)', borderRadius: 5, padding: '1px 5px', color: GOLD, fontWeight: 700 } }, 'BENİM')
                      ),
                      React.createElement('div', { style: { fontSize: '0.65rem', color: '#A9A6A0', marginTop: 2 } }, `${idlg.emoji} ${idlg.label} · 👥 ${bey.uyeSayisi||1} üye · 🏆 ${(bey.prestij||0).toLocaleString('tr-TR')} prestij`),
                      React.createElement('div', { style: { fontSize: '0.62rem', color: '#A9A6A0', fontStyle: 'italic', marginTop: 2 } }, `"${bey.motto||'Adalet ve Zafer'}"`)
                    ),
                    React.createElement('div', { style: { textAlign: 'right', flexShrink: 0 } },
                      React.createElement('div', { style: { fontSize: '0.62rem', color: '#A9A6A0' } }, '👑 Bey'),
                      React.createElement('div', { style: { fontSize: '0.72rem', fontWeight: 700, color: GOLD } }, bey.kurucuAdi)
                    )
                  )
                );
              })
            )
      ),

      // ── KUR TAB ──
      tab === 'kur' && !benimBeylik && React.createElement('div', null,
        // Maliyet kutusu
        React.createElement('div', { style: { background: 'linear-gradient(135deg,rgba(200,155,60,0.12),rgba(45,24,0,0.95))', border: '1px solid rgba(200,155,60,0.35)', borderRadius: 14, padding: '14px', marginBottom: 14 } },
          React.createElement('div', { style: { fontFamily: "'Cinzel',serif", fontSize: '0.95rem', fontWeight: 900, color: GOLD, marginBottom: 10, textAlign: 'center' } }, '⚜️ Beylik Kurma Maliyeti'),
          [
            ['🪙', 'Sikke', BEYLIK_KUR_MALIYET.sikke, sikke],
            ['⚜️', 'Altın', BEYLIK_KUR_MALIYET.altin, altin],
            ['💎', 'Sadakat Puanı', BEYLIK_KUR_MALIYET.sadakat, sadakat],
          ].map(([ic, lb, gereken, sahip]) => {
            const yeterli = sahip >= gereken;
            return React.createElement('div', { key: lb, style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' } },
              React.createElement('div', { style: { fontSize: '0.78rem', color: '#A9A6A0' } }, `${ic} ${lb}`),
              React.createElement('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
                React.createElement('span', { style: { fontSize: '0.72rem', color: yeterli ? '#3E8C5A' : '#B8423C', fontWeight: 700 } }, sahip.toLocaleString('tr-TR')),
                React.createElement('span', { style: { fontSize: '0.65rem', color: '#A9A6A0' } }, '/ ' + gereken.toLocaleString('tr-TR')),
                React.createElement('span', { style: { fontSize: '0.9rem' } }, yeterli ? '✅' : '❌')
              )
            );
          })
        ),

        // Form
        React.createElement('div', { style: { background: SURF, border: '1px solid rgba(200,155,60,0.2)', borderRadius: 14, padding: '14px', marginBottom: 10 } },
          React.createElement('div', { style: { fontSize: '0.72rem', color: '#A9A6A0', fontWeight: 700, marginBottom: 4 } }, 'BEYLİK ADI'),
          React.createElement('input', {
            value: kurForm.ad,
            onChange: e => setKurForm(f => ({...f, ad: e.target.value})),
            placeholder: 'Beyliğinizin adı...',
            maxLength: 32,
            style: { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(200,155,60,0.25)', background: 'rgba(200,155,60,0.05)', color: '#F5EBD7', fontSize: '0.9rem', marginBottom: 12, boxSizing: 'border-box', outline: 'none' }
          }),
          React.createElement('div', { style: { fontSize: '0.72rem', color: '#A9A6A0', fontWeight: 700, marginBottom: 4 } }, 'MOTTO'),
          React.createElement('input', {
            value: kurForm.motto,
            onChange: e => setKurForm(f => ({...f, motto: e.target.value})),
            placeholder: '"Adalet ve Zafer"',
            maxLength: 64,
            style: { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(200,155,60,0.25)', background: 'rgba(200,155,60,0.05)', color: '#F5EBD7', fontSize: '0.85rem', marginBottom: 12, boxSizing: 'border-box', outline: 'none' }
          }),
          React.createElement('div', { style: { fontSize: '0.72rem', color: '#A9A6A0', fontWeight: 700, marginBottom: 8 } }, 'İDEOLOJİ'),
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 } },
            IDEOLOJI_LISTESI.map(idlg =>
              React.createElement('div', {
                key: idlg.id,
                onClick: () => setKurForm(f => ({...f, ideoloji: idlg.id, renk: idlg.renk})),
                style: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, border: `1px solid ${kurForm.ideoloji===idlg.id ? idlg.renk : 'rgba(255,255,255,0.08)'}`, background: kurForm.ideoloji===idlg.id ? `${idlg.renk}18` : 'rgba(255,255,255,0.02)', cursor: 'pointer' }
              },
                React.createElement('div', { style: { width: 12, height: 12, borderRadius: '50%', background: idlg.renk, flexShrink: 0 } }),
                React.createElement('div', null,
                  React.createElement('div', { style: { fontSize: '0.8rem', fontWeight: 700, color: '#F5EBD7' } }, idlg.label),
                  React.createElement('div', { style: { fontSize: '0.62rem', color: '#A9A6A0' } }, idlg.acik)
                ),
                kurForm.ideoloji===idlg.id && React.createElement('div', { style: { marginLeft: 'auto', fontSize: '0.75rem', color: idlg.renk } }, '✓')
              )
            )
          ),
          React.createElement('div', { style: { fontSize: '0.72rem', color: '#A9A6A0', fontWeight: 700, marginBottom: 8 } }, 'BAYRAK RENGİ'),
          React.createElement('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 } },
            RENK_SECENEKLERI.map(r =>
              React.createElement('div', {
                key: r,
                onClick: () => setKurForm(f => ({...f, renk: r})),
                style: { width: 28, height: 28, borderRadius: '50%', background: r, border: `2px solid ${kurForm.renk===r ? '#fff' : 'transparent'}`, cursor: 'pointer', flexShrink: 0 }
              })
            )
          ),
          React.createElement('button', {
            onClick: beylikKur,
            disabled: loading || !kurForm.ad.trim(),
            style: { ...btnStyle(true), opacity: loading || !kurForm.ad.trim() ? 0.5 : 1 }
          }, loading ? '⏳ Kuruluyor...' : '⚜️ Beyliği Kur')
        )
      ),

      // ── YÖNET TAB ──
      tab === 'yonet' && React.createElement('div', null,
        benimBeylik
          ? React.createElement('div', null,
              // Beylik kartı
              React.createElement('div', { style: { background: `linear-gradient(135deg,${benimBeylik.renk||GOLD}18,${SURF})`, border: `1px solid ${benimBeylik.renk||GOLD}44`, borderRadius: 16, padding: '16px', marginBottom: 14, textAlign: 'center' } },
                React.createElement('div', { style: { fontSize: '2.5rem', marginBottom: 8 } }, '⚜️'),
                React.createElement('div', { style: { fontFamily: "'Cinzel',serif", fontSize: '1.3rem', fontWeight: 900, color: benimBeylik.renk||GOLD, marginBottom: 4 } }, benimBeylik.ad),
                React.createElement('div', { style: { fontSize: '0.75rem', color: '#A9A6A0', fontStyle: 'italic', marginBottom: 12 } }, `"${benimBeylik.motto||'Adalet ve Zafer'}"`),
                React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 } },
                  [
                    ['👥','Üyeler',(benimBeylik.uyeSayisi||1)+''],
                    ['🏆','Prestij',(benimBeylik.prestij||0).toLocaleString('tr-TR')],
                    ['🗺️','Eyalet',(benimBeylik.eyaletler||[]).length+''],
                  ].map(([ic,lb,val]) =>
                    React.createElement('div', { key: lb, style: { background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px' } },
                      React.createElement('div', { style: { fontSize: '1rem' } }, ic),
                      React.createElement('div', { style: { fontSize: '0.6rem', color: '#A9A6A0' } }, lb),
                      React.createElement('div', { style: { fontSize: '0.9rem', fontWeight: 700, color: '#F5EBD7' } }, val)
                    )
                  )
                )
              ),
              // İdeoloji bonusu
              React.createElement('div', { style: { background: SURF, border: '1px solid rgba(200,155,60,0.15)', borderRadius: 12, padding: '12px 14px', marginBottom: 10 } },
                React.createElement('div', { style: { fontWeight: 700, color: '#F5EBD7', fontSize: '0.82rem', marginBottom: 8 } }, '⚡ İdeoloji Bonusu'),
                React.createElement('div', { style: { fontSize: '0.78rem', color: '#A9A6A0' } },
                  IDEOLOJI_LISTESI.find(x=>x.id===benimBeylik.ideoloji)?.acik || '—'
                )
              ),
              // Unvanlar
              React.createElement('div', { style: { background: SURF, border: '1px solid rgba(200,155,60,0.15)', borderRadius: 12, padding: '12px 14px', marginBottom: 10 } },
                React.createElement('div', { style: { fontWeight: 700, color: '#F5EBD7', fontSize: '0.82rem', marginBottom: 10 } }, '👑 Beylik Unvanları'),
                BEYLIK_UNVANLARI.map(u =>
                  React.createElement('div', { key: u.id, style: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' } },
                    React.createElement('div', { style: { fontSize: '1rem', width: 24 } }, u.emoji),
                    React.createElement('div', { style: { flex: 1, fontSize: '0.78rem', fontWeight: 600, color: '#F5EBD7' } }, u.label),
                    React.createElement('div', { style: { fontSize: '0.65rem', color: '#A9A6A0' } }, `${u.min}+ üye`)
                  )
                )
              ),
              !isKurucu && React.createElement('button', {
                onClick: beyliktenAyril,
                style: { ...btnStyle(false), color: '#B8423C', borderColor: 'rgba(184,66,60,0.4)' }
              }, '🚪 Beylikten Ayrıl')
            )
          : React.createElement('div', { style: { textAlign: 'center', padding: '30px 20px' } },
              React.createElement('div', { style: { fontSize: '3rem', marginBottom: 12 } }, '⚜️'),
              React.createElement('div', { style: { fontFamily: "'Cinzel',serif", fontSize: '1.1rem', color: '#F5EBD7', marginBottom: 8 } }, 'Beyliğiniz Yok'),
              React.createElement('button', { onClick: () => setTab('kur'), style: { ...btnStyle(true), width: 180, margin: '0 auto' } }, '⚜️ Beylik Kur')
            )
      ),

      // ── LİDERLİK TAB ──
      tab === 'liderlik' && React.createElement('div', null,
        React.createElement('div', { style: { fontSize: '0.68rem', color: '#A9A6A0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 } }, '🏆 Prestij Liderlik Tahtası'),
        [...beyliks].sort((a,b)=>(b.prestij||0)-(a.prestij||0)).map((bey,i) => {
          const madalya = i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
          return React.createElement('div', { key: bey.id, style: { ...cardStyle, display: 'flex', alignItems: 'center', gap: 10 } },
            React.createElement('div', { style: { fontSize: '1.4rem', width: 32, textAlign: 'center', flexShrink: 0 } }, madalya || `${i+1}.`),
            React.createElement('div', { style: { width: 36, height: 36, borderRadius: 10, background: `${bey.renk||GOLD}22`, border: `2px solid ${bey.renk||GOLD}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 } }, '⚜️'),
            React.createElement('div', { style: { flex: 1 } },
              React.createElement('div', { style: { fontSize: '0.85rem', fontWeight: 700, color: '#F5EBD7' } }, bey.ad),
              React.createElement('div', { style: { fontSize: '0.62rem', color: '#A9A6A0' } }, `👑 ${bey.kurucuAdi} · 👥 ${bey.uyeSayisi||1} üye`)
            ),
            React.createElement('div', { style: { fontFamily: "'JetBrains Mono',monospace", fontSize: '0.85rem', fontWeight: 700, color: GOLD } }, (bey.prestij||0).toLocaleString('tr-TR'))
          );
        }),
        beyliks.length === 0 && React.createElement('div', { style: { textAlign: 'center', padding: '30px', color: '#A9A6A0', fontSize: '0.85rem' } }, 'Henüz beylik yok')
      )
    ),

    // ── Beylik Detay Modal ──
    seciliBeylik && React.createElement('div', {
      style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
      onClick: e => { if(e.target===e.currentTarget){setSeciliBeylik(null);setKatilOnay(null);} }
    },
      React.createElement('div', { style: { background: '#2D1800', border: '1px solid rgba(200,155,60,0.35)', borderRadius: 18, padding: '1.5rem', maxWidth: 360, width: '100%' } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 } },
          React.createElement('div', { style: { width: 48, height: 48, borderRadius: 12, background: `${seciliBeylik.renk||GOLD}22`, border: `2px solid ${seciliBeylik.renk||GOLD}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 } }, '⚜️'),
          React.createElement('div', null,
            React.createElement('div', { style: { fontFamily: "'Cinzel',serif", fontSize: '1.1rem', fontWeight: 900, color: seciliBeylik.renk||GOLD } }, seciliBeylik.ad),
            React.createElement('div', { style: { fontSize: '0.68rem', color: '#A9A6A0', fontStyle: 'italic' } }, `"${seciliBeylik.motto||'Adalet ve Zafer'}"`)
          )
        ),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 } },
          [
            ['👑','Kurucu',seciliBeylik.kurucuAdi],
            ['👥','Üye',`${seciliBeylik.uyeSayisi||1}`],
            ['🏆','Prestij',(seciliBeylik.prestij||0).toLocaleString('tr-TR')],
            ['⚡','İdeoloji', IDEOLOJI_LISTESI.find(x=>x.id===seciliBeylik.ideoloji)?.label||'—'],
          ].map(([ic,lb,val]) =>
            React.createElement('div', { key: lb, style: { background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px' } },
              React.createElement('div', { style: { fontSize: '0.62rem', color: '#A9A6A0' } }, `${ic} ${lb}`),
              React.createElement('div', { style: { fontSize: '0.82rem', fontWeight: 700, color: '#F5EBD7' } }, val)
            )
          )
        ),
        React.createElement('div', { style: { display: 'flex', gap: 8 } },
          !benimBeylik && React.createElement('button', {
            onClick: () => { if(katilOnay===seciliBeylik.id) beyligeKatil(seciliBeylik); else setKatilOnay(seciliBeylik.id); },
            style: { ...btnStyle(true), flex: 1 }
          }, katilOnay===seciliBeylik.id ? '✅ Onayla — Katıl' : '⚜️ Katıl'),
          benimBeylik?.id===seciliBeylik.id && React.createElement('div', { style: { flex: 1, fontSize: '0.75rem', color: '#3E8C5A', padding: '10px', textAlign: 'center', fontWeight: 700 } }, '✅ Zaten Üyesiniz'),
          React.createElement('button', {
            onClick: () => { setSeciliBeylik(null); setKatilOnay(null); },
            style: { ...btnStyle(false), flex: 0, padding: '10px 18px' }
          }, 'Kapat')
        )
      )
    )
  );
};
