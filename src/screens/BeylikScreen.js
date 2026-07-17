"use strict";
// ═══════════════════════════════════════════════════════
// SALTANAT ONLINE — Beylik Sistemi
// Beylik kurma, katılma, yönetim — 1M Sikke + 50 Altın + 150k Sadakat
// ═══════════════════════════════════════════════════════

const BEYLIK_KUR_MALIYET = { sikke: 1_000_000, altin: 50, sadakat: 15_000 };

// Kurgusal bölge isimleri — gerçek coğrafya yok
const SANCAKLAR = [
  { id:'karaorman',  label:'Karaorman Sancağı',   emoji:'🌲', bolge:'Kuzey' },
  { id:'altinova',   label:'Altınova Eyaleti',     emoji:'🌾', bolge:'Orta'  },
  { id:'demirkapi',  label:'Demirkapı Sancağı',    emoji:'🏔️', bolge:'Doğu'  },
  { id:'gunestepe',  label:'Güneştepe Eyaleti',    emoji:'☀️', bolge:'Güney' },
  { id:'karatas',    label:'Karataş Limanı',        emoji:'⚓', bolge:'Batı'  },
  { id:'yildirim',   label:'Yıldırım Kalesi',      emoji:'⚡', bolge:'Kuzey' },
  { id:'bozkir',     label:'Bozkır Eyaleti',       emoji:'🏜️', bolge:'Orta'  },
  { id:'tunca',      label:'Tunca Sancağı',         emoji:'🌊', bolge:'Batı'  },
  { id:'sahinkoy',   label:'Şahinköy Dağları',     emoji:'🦅', bolge:'Doğu'  },
  { id:'altinkale',  label:'Altınkale Surları',     emoji:'🏰', bolge:'Güney' },
  { id:'cayirtepe',  label:'Çayırtepe Ovası',      emoji:'🌿', bolge:'Kuzey' },
  { id:'ruzgarli',   label:'Rüzgarlı Boğaz',       emoji:'💨', bolge:'Batı'  },
];

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

window.BeylikScreen = function BeylikScreen({ profile, setProfile, showNotif, allUsers, serverBeyliks, setServerBeyliks, savasIlanlari }) {
  // Sunucudan gelen beylikler öncelikli, yoksa localStorage'dan başla
  const [beyliks, setBeyliks] = React.useState(() => {
    if (Array.isArray(serverBeyliks) && serverBeyliks.length > 0) return serverBeyliks;
    try { return JSON.parse(localStorage.getItem('rep_beyliks') || '[]'); } catch { return []; }
  });
  const [tab, setTab] = React.useState('liste'); // 'liste' | 'kur' | 'yonet' | 'liderlik' | 'savas' | 'eyaletler'
  const [kurForm, setKurForm] = React.useState({ ad: '', ideoloji: 'gazi', renk: '#C89B3C', motto: '' });
  const [seciliBeylik, setSeciliBeylik] = React.useState(null);
  const [katilOnay, setKatilOnay] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  // Sunucudan gelen güncellemeleri yakala
  React.useEffect(() => {
    if (Array.isArray(serverBeyliks)) {
      setBeyliks(serverBeyliks);
    }
  }, [serverBeyliks]);

  const uid = profile?.uid || profile?.id;
  const benimBeylik = beyliks.find(b => b.kurucuId === uid || (b.uyeler||[]).includes(uid));
  const isKurucu = benimBeylik?.kurucuId === uid;

  const sadakat = profile?.loyaltyPoints || profile?.sadakat || 0;
  const sikke = profile?.money || 0;
  const altin = profile?.altin || profile?.underCoin || 0;

  // Güç puanı (global fonksiyon varsa kullan)
  const benimGüç = React.useMemo(() => {
    if (window.hesaplaGucPuani) return window.hesaplaGucPuani(profile || {}).toplam;
    return (profile?.gidaPuani||0) + (profile?.aletPuani||0) + (profile?.madenPuani||0) + (profile?.merit_points||0)*2;
  }, [profile]);

  // Savaş geçmişi
  const [savasList, setSavasList] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('rep_beylikSavaslar') || '[]'); } catch { return []; }
  });

  // Eyalet sahiplikleri (güncellenir)
  const sancakSahipleri = React.useMemo(() => {
    const map = {};
    beyliks.forEach(b => (b.eyaletler||[]).forEach(eId => { map[eId] = b; }));
    return map;
  }, [beyliks]);

  const savaşIlan = (hedefBeylik) => {
    if (!benimBeylik) { showNotif('Önce bir beyliğe katıl', 'error'); return; }
    if (hedefBeylik.id === benimBeylik.id) { showNotif('Kendinize savaş ilan edemezsiniz', 'error'); return; }
    const hedefGüç = hedefBeylik.gucPuani || 0;
    const kazanan = benimGüç >= hedefGüç ? benimBeylik : hedefBeylik;
    const kaybedenId = kazanan.id === benimBeylik.id ? hedefBeylik.id : benimBeylik.id;
    const fark = Math.abs(benimGüç - hedefGüç);
    const benimKazandım = kazanan.id === benimBeylik.id;

    // Güç kayıpları — kazanan fark kadar korudu, kaybeden fark kadar düşer
    let güncellenmisBeyliks = beyliks.map(b => {
      if (b.id === benimBeylik.id) return { ...b, gucPuani: benimKazandım ? benimGüç - Math.floor(fark*0.1) : Math.max(0, benimGüç - fark) };
      if (b.id === hedefBeylik.id) return { ...b, gucPuani: benimKazandım ? Math.max(0, hedefGüç - fark) : hedefGüç - Math.floor(fark*0.1) };
      return b;
    });

    // Kazanan rastgele 1 eyalet alır
    if (benimKazandım) {
      const boşSancak = SANCAKLAR.find(s => !sancakSahipleri[s.id]);
      const hedefSancak = (hedefBeylik.eyaletler||[])[0];
      const fethedilen = boşSancak?.id || hedefSancak;
      if (fethedilen) {
        güncellenmisBeyliks = güncellenmisBeyliks.map(b => {
          if (b.id === benimBeylik.id) return { ...b, eyaletler: [...new Set([...(b.eyaletler||[]), fethedilen])], prestij: (b.prestij||0)+500 };
          if (b.id === hedefBeylik.id && hedefSancak) return { ...b, eyaletler: (b.eyaletler||[]).filter(e => e !== hedefSancak) };
          return b;
        });
      }
    }
    const yeniSavas = { id:'sv_'+Date.now(), saldiranId:benimBeylik.id, saldiranAd:benimBeylik.ad, hedefId:hedefBeylik.id, hedefAd:hedefBeylik.ad, kazananId:kazanan.id, kazananAd:kazanan.ad, fark, ts:Date.now(), benimGüç, hedefGüç };
    const yeniListe = [yeniSavas, ...savasList].slice(0, 20);
    setSavasList(yeniListe);
    localStorage.setItem('rep_beylikSavaslar', JSON.stringify(yeniListe));
    kaydetBeyliks(güncellenmisBeyliks);
    try { window._socket?.emit('savas:ilan', { saldiranId: benimBeylik.id, hedefId: hedefBeylik.id, kazananId: kazanan.id, fark }); } catch(_){}
    try { window._pushGameEvent?.('beylik_savasi', `⚔️ Beylik Savaşı!`, `${benimBeylik.ad} vs ${hedefBeylik.ad} — Kazanan: ${kazanan.ad}`, '⚔️', 'savas'); } catch(_){}
    showNotif(benimKazandım ? `⚔️ Zafer! ${hedefBeylik.ad}'ı yendik! (+500 prestij)` : `❌ Yenildi. ${fark.toLocaleString('tr-TR')} güç farkı`, benimKazandım ? 'success' : 'error');
  };

  const sancakFethEt = (sancakId) => {
    if (!benimBeylik) { showNotif('Önce beyliğe katıl', 'error'); return; }
    const mevcut = sancakSahipleri[sancakId];
    if (mevcut?.id === benimBeylik.id) { showNotif('Bu sancak zaten sizin', 'info'); return; }
    if (mevcut) { showNotif('Bu sancak başka beyliğe ait. Savaşarak ele geçir.', 'error'); return; }
    const güncellenmis = beyliks.map(b => b.id === benimBeylik.id ? { ...b, eyaletler: [...(b.eyaletler||[]), sancakId], prestij:(b.prestij||0)+100 } : b);
    kaydetBeyliks(güncellenmis);
    showNotif(`🏰 ${SANCAKLAR.find(s=>s.id===sancakId)?.label} fethedildi! +100 Prestij`, 'success');
  };

  // Sunucu taraflı kaydetme — tüm oyunculara yayılır
  const kaydetBeyliks = (yeni) => {
    setBeyliks(yeni);
    localStorage.setItem('rep_beyliks', JSON.stringify(yeni));
    if (setServerBeyliks) setServerBeyliks(yeni);
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
      loyaltyPoints: sadakat - BEYLIK_KUR_MALIYET.sadakat,
      beylikId: yeniBeylik.id,
      beylikUnvan: 'bey',
    };
    // Sunucuya atomik kur eventi gönder (isim çakışması sunucu kontrolünde)
    try { window._socket?.emit('beylik:kur', { beylik: yeniBeylik }); } catch(_) {}
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
    // Sunucuya atomik katılım eventi — sunucu DB'ye yazar ve tüm oyunculara yayar
    try { window._socket?.emit('beylik:katil', { beylikId: beylik.id }); } catch(_) {}
    // Optimistik güncelleme
    const guncellenmis = beyliks.map(b =>
      b.id === beylik.id
        ? { ...b, uyeler: [...(b.uyeler||[]), uid], uyeSayisi: (b.uyeSayisi||1)+1 }
        : b
    );
    setBeyliks(guncellenmis);
    localStorage.setItem('rep_beyliks', JSON.stringify(guncellenmis));
    if (setServerBeyliks) setServerBeyliks(guncellenmis);
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
    try { window._socket?.emit('beylik:ayril', { beylikId: benimBeylik.id }); } catch(_) {}
    const guncellenmis = beyliks.map(b =>
      b.id === benimBeylik.id
        ? { ...b, uyeler: (b.uyeler||[]).filter(x=>x!==uid), uyeSayisi: Math.max(1,(b.uyeSayisi||1)-1) }
        : b
    );
    setBeyliks(guncellenmis);
    localStorage.setItem('rep_beyliks', JSON.stringify(guncellenmis));
    if (setServerBeyliks) setServerBeyliks(guncellenmis);
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

    // Güç puanı banner
    React.createElement('div', { style:{ background:'rgba(194,75,67,0.08)', borderBottom:'1px solid rgba(194,75,67,0.2)', padding:'6px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' } },
      React.createElement('span', {style:{fontSize:'0.72rem',color:'#C24B43',fontWeight:700}}, `⚡ Güç Puanı: ${benimGüç.toLocaleString('tr-TR')}`),
      benimBeylik && React.createElement('span', {style:{fontSize:'0.68rem',color:'#8893A1'}}, `🗺️ ${(benimBeylik.eyaletler||[]).length} Sancak`),
    ),

    // ── Tab Bar ──
    React.createElement('div', { style: { display: 'flex', gap: 2, padding: '8px 10px', borderBottom: '1px solid rgba(200,155,60,0.1)', overflowX:'auto', scrollbarWidth:'none' } },
      [
        ['liste','🏰 Beylikler'],
        [benimBeylik ? 'yonet' : 'kur', benimBeylik ? '⚙️ Yönet' : '⚜️ Kur'],
        ['eyaletler','🗺️ Sancaklar'],
        ['savas','⚔️ Savaş'],
        ['liderlik','🏆 Güç Sıralaması'],
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

      // ── EYALETLER / SANCAKLAR TAB ──
      tab === 'eyaletler' && React.createElement('div', null,
        React.createElement('div', {style:{background:'rgba(200,155,60,0.06)',border:'1px solid rgba(200,155,60,0.18)',borderRadius:10,padding:'8px 12px',marginBottom:12,fontSize:'0.72rem',color:'#A9A6A0',lineHeight:1.6}},
          '🗺️ Boş sancakları fethederek beyliğini genişlet. Başka beyliğin sancağını almak için ⚔️ Savaş sekmesinde güç savaşı başlat.'
        ),
        React.createElement('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}},
          SANCAKLAR.map(s => {
            const sahip = sancakSahipleri[s.id];
            const benim = sahip?.id === benimBeylik?.id;
            const bos   = !sahip;
            return React.createElement('div',{key:s.id,style:{background:benim?'rgba(200,155,60,0.1)':SURF,border:`1px solid ${benim?GOLD:bos?'rgba(255,255,255,0.08)':'rgba(194,75,67,0.25)'}`,borderRadius:12,padding:'10px 12px'}},
              React.createElement('div',{style:{fontSize:'1.3rem',marginBottom:4}},s.emoji),
              React.createElement('div',{style:{fontSize:'0.78rem',fontWeight:800,color:'#EDE7DA',marginBottom:2,lineHeight:1.2}},s.label),
              React.createElement('div',{style:{fontSize:'0.6rem',color:'#8893A1',marginBottom:6}},s.bolge+' Bölgesi'),
              benim
                ? React.createElement('div',{style:{fontSize:'0.65rem',color:GOLD,fontWeight:700}}, '✅ Sizin Sancağınız')
                : sahip
                  ? React.createElement('div',{style:{fontSize:'0.65rem',color:'#C24B43',fontWeight:700}},`🏴 ${sahip.ad}`)
                  : React.createElement('button',{onClick:()=>sancakFethEt(s.id),style:{width:'100%',padding:'5px',borderRadius:7,border:'none',background:'linear-gradient(135deg,#C89B3C,#8B6A1A)',color:'#0F0800',fontWeight:800,fontSize:'0.7rem',cursor:'pointer'}}, '⚔️ Fethdet')
            );
          })
        ),
      ),

      // ── SAVAŞ TAB ──
      tab === 'savas' && React.createElement('div', null,
        !benimBeylik && React.createElement('div',{style:{textAlign:'center',padding:'30px 20px',color:'#8893A1'}},
          React.createElement('div',{style:{fontSize:'2.5rem',marginBottom:8}},'⚔️'),
          React.createElement('div',{style:{fontSize:'0.85rem'}},'Savaş için önce bir beyliğe katıl.')
        ),
        benimBeylik && React.createElement('div', null,
          // Güç karşılaştırması
          React.createElement('div',{style:{background:SURF,border:'1px solid rgba(194,75,67,0.3)',borderRadius:12,padding:14,marginBottom:12}},
            React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontWeight:800,color:'#C24B43',marginBottom:10,fontSize:'0.88rem'}},'⚔️ SAVAŞ SİSTEMİ'),
            React.createElement('div',{style:{fontSize:'0.72rem',color:'#A9A6A0',lineHeight:1.7,marginBottom:8}},
              '• Güç puanın rakibin gücünden yüksekse kazanırsın\n• Güç farkı kadar puan kalır, sıfırlanma yok\n• Kazanan 1 boş sancak fetheder veya rakipten alır\n• Savaş Kazan = +500 Prestij'
            ),
            React.createElement('div',{style:{background:'rgba(194,75,67,0.08)',border:'1px solid rgba(194,75,67,0.2)',borderRadius:8,padding:'8px 12px'}},
              React.createElement('div',{style:{fontSize:'0.65rem',color:'#A9A6A0'}}, 'Senin Gücün'),
              React.createElement('div',{style:{fontFamily:"'JetBrains Mono',monospace",fontSize:'1.4rem',fontWeight:900,color:'#C24B43'}}, benimGüç.toLocaleString('tr-TR')),
              React.createElement('div',{style:{fontSize:'0.6rem',color:'#8893A1',marginTop:2}}, '⚡ Gıda + Alet + Maden + Eğitim + Ordu'),
            ),
          ),
          // Rakip beylikler
          React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontSize:'0.65rem',fontWeight:700,color:'#8893A1',marginBottom:10,letterSpacing:'0.1em'}},'RAKİP BEYLİKLER'),
          beyliks.filter(b=>b.id!==benimBeylik.id).length === 0
            ? React.createElement('div',{style:{textAlign:'center',padding:'20px',color:'#8893A1',fontSize:'0.8rem'}},'Savaşacak başka beylik yok')
            : beyliks.filter(b=>b.id!==benimBeylik.id).map(bey => {
                const hedefGüç = bey.gucPuani || 0;
                const benimÜstün = benimGüç > hedefGüç;
                const fark = Math.abs(benimGüç - hedefGüç);
                return React.createElement('div',{key:bey.id,style:{background:SURF,border:`1px solid ${benimÜstün?'rgba(76,154,107,0.25)':'rgba(194,75,67,0.25)'}`,borderRadius:12,padding:12,marginBottom:8}},
                  React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}},
                    React.createElement('div',null,
                      React.createElement('div',{style:{fontWeight:800,color:'#EDE7DA',fontSize:'0.88rem'}},bey.ad),
                      React.createElement('div',{style:{fontSize:'0.62rem',color:'#8893A1'}},`👑 ${bey.kurucuAdi} · ${(bey.eyaletler||[]).length} sancak`),
                    ),
                    React.createElement('div',{style:{textAlign:'right'}},
                      React.createElement('div',{style:{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.9rem',fontWeight:800,color:benimÜstün?'#4C9A6B':'#C24B43'}},hedefGüç.toLocaleString('tr-TR')),
                      React.createElement('div',{style:{fontSize:'0.6rem',color:benimÜstün?'#4C9A6B':'#C24B43'}},benimÜstün?`+${fark.toLocaleString()} üstünsün`:`-${fark.toLocaleString()} eksiksin`),
                    ),
                  ),
                  React.createElement('button',{onClick:()=>savaşIlan(bey),style:{width:'100%',padding:'8px',borderRadius:8,border:'none',background:benimÜstün?'linear-gradient(135deg,#C24B43,#8B2A2A)':'rgba(194,75,67,0.12)',color:benimÜstün?'#FFF':'#C24B43',fontWeight:800,fontSize:'0.8rem',cursor:'pointer',border:benimÜstün?'none':'1px solid rgba(194,75,67,0.3)'}},
                    benimÜstün ? '⚔️ Savaş İlan Et (Kazanma İhtimali Yüksek)' : `⚔️ Riskli Savaş (${fark.toLocaleString()} güç eksiği)`
                  ),
                );
              }),
          // Savaş geçmişi
          savasList.length > 0 && React.createElement('div',{style:{marginTop:16}},
            React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontSize:'0.65rem',fontWeight:700,color:'#8893A1',marginBottom:8,letterSpacing:'0.1em'}},'SAVAŞ GEÇMİŞİ'),
            savasList.slice(0,5).map(sv =>
              React.createElement('div',{key:sv.id,style:{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:8,padding:'8px 10px',marginBottom:4,display:'flex',justifyContent:'space-between',alignItems:'center'}},
                React.createElement('div',null,
                  React.createElement('div',{style:{fontSize:'0.72rem',color:'#EDE7DA',fontWeight:700}},`${sv.saldiranAd} vs ${sv.hedefAd}`),
                  React.createElement('div',{style:{fontSize:'0.6rem',color:'#8893A1'}},`Kazanan: ${sv.kazananAd} · Fark: ${sv.fark?.toLocaleString?.()}`),
                ),
                React.createElement('div',{style:{fontSize:'0.65rem',color:sv.kazananId===benimBeylik.id?'#4C9A6B':'#C24B43',fontWeight:700}},
                  sv.kazananId===benimBeylik.id ? '⚔️ Zafer' : '💀 Yenilgi'
                ),
              )
            )
          ),
        ),
      ),

      // ── LİDERLİK TAB ──
      tab === 'liderlik' && React.createElement('div', null,
        React.createElement('div', { style: { fontSize: '0.68rem', color: '#A9A6A0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 } }, '🏆 Güç Puanı Liderlik Tahtası'),
        [...beyliks].sort((a,b)=>(b.gucPuani||b.prestij||0)-(a.gucPuani||a.prestij||0)).map((bey,i) => {
          const madalya = i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
          const g = bey.gucPuani || 0;
          return React.createElement('div', { key: bey.id, style: { ...cardStyle, display: 'flex', alignItems: 'center', gap: 10 } },
            React.createElement('div', { style: { fontSize: '1.4rem', width: 32, textAlign: 'center', flexShrink: 0 } }, madalya || `${i+1}.`),
            React.createElement('div', { style: { width: 36, height: 36, borderRadius: 10, background: `${bey.renk||GOLD}22`, border: `2px solid ${bey.renk||GOLD}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 } }, '⚜️'),
            React.createElement('div', { style: { flex: 1 } },
              React.createElement('div', { style: { fontSize: '0.85rem', fontWeight: 700, color: '#F5EBD7' } }, bey.ad),
              React.createElement('div', { style: { fontSize: '0.62rem', color: '#A9A6A0' } }, `👑 ${bey.kurucuAdi} · 🗺️ ${(bey.eyaletler||[]).length} sancak · 👥 ${bey.uyeSayisi||1} üye`)
            ),
            React.createElement('div', {style:{textAlign:'right'}},
              React.createElement('div', { style: { fontFamily: "'JetBrains Mono',monospace", fontSize: '0.85rem', fontWeight: 700, color: '#C24B43' } }, `⚡${g.toLocaleString('tr-TR')}`),
              React.createElement('div', { style: { fontSize: '0.6rem', color: '#8893A1' } }, `🏆${(bey.prestij||0).toLocaleString('tr-TR')} prestij`),
            ),
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
