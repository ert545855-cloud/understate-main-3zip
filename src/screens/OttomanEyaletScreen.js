"use strict";
// ═══════════════════════════════════════════════════════
// SALTANAT ONLINE — Osmanlı Eyaletleri & Valilik Sistemi
// Tüm eyaletler, vali atamaları ve eyalet yönetimi
// ═══════════════════════════════════════════════════════

const OTTOMAN_EYALETLER = [
  // ── Anadolu ─────────────────────────────────────────
  { id:'anadolu',    ad:'Anadolu Eyaleti',    merkez:'Kütahya',    bolge:'Anadolu',    bayrak:'🏔️', gelir:12000, asker:8000,  aciklama:'İmparatorluğun kalbi, eski Selçuklu toprakları.' },
  { id:'karaman',    ad:'Karaman Eyaleti',    merkez:'Konya',      bolge:'Anadolu',    bayrak:'🌾', gelir:8000,  asker:5000,  aciklama:'Orta Anadolu\'nun bereketli ovaları.' },
  { id:'sivas',      ad:'Sivas Eyaleti',      merkez:'Sivas',      bolge:'Anadolu',    bayrak:'⛰️', gelir:7000,  asker:6000,  aciklama:'İç Anadolu\'nun stratejik kalesi.' },
  { id:'trabzon',    ad:'Trabzon Eyaleti',    merkez:'Trabzon',    bolge:'Anadolu',    bayrak:'⚓', gelir:9000,  asker:4000,  aciklama:'Karadeniz ticaretinin merkezi.' },
  { id:'erzurum',    ad:'Erzurum Eyaleti',    merkez:'Erzurum',    bolge:'Anadolu',    bayrak:'🏹', gelir:6000,  asker:9000,  aciklama:'Doğu sınırının kalkanı, savaşçı halkı.' },
  { id:'van',        ad:'Van Eyaleti',        merkez:'Van',        bolge:'Anadolu',    bayrak:'💧', gelir:5000,  asker:7000,  aciklama:'Göl kıyısının güzide eyaleti.' },
  { id:'diyarbekir', ad:'Diyarbekir Eyaleti', merkez:'Diyarbakır', bolge:'Anadolu',    bayrak:'⚫', gelir:8500,  asker:7500,  aciklama:'Güneydoğu\'nun siyah bazalt şehri.' },

  // ── Rumeli (Balkanlar) ───────────────────────────────
  { id:'rumeli',     ad:'Rumeli Eyaleti',     merkez:'Sofya',      bolge:'Rumeli',     bayrak:'🌙', gelir:18000, asker:12000, aciklama:'İmparatorluğun en kalabalık ve zengin eyaleti.' },
  { id:'bosna',      ad:'Bosna Eyaleti',      merkez:'Saraybosna', bolge:'Rumeli',     bayrak:'🛡️', gelir:9000,  asker:8000,  aciklama:'Batı Balkanların kapısı.' },
  { id:'budin',      ad:'Budin Eyaleti',      merkez:'Budapeşte',  bolge:'Rumeli',     bayrak:'🦅', gelir:14000, asker:10000, aciklama:'Macaristan\'ın başkenti, Avrupa\'nın kilidi.' },
  { id:'erdel',      ad:'Erdel Eyaleti',      merkez:'Kolojvar',   bolge:'Rumeli',     bayrak:'🏰', gelir:10000, asker:6000,  aciklama:'Transilvanya prensi, Osmanlı vassalı.' },
  { id:'mora',       ad:'Mora Eyaleti',        merkez:'Korent',     bolge:'Rumeli',     bayrak:'🏛️', gelir:7000,  asker:4000,  aciklama:'Antik Yunanistan\'ın mirası.' },
  { id:'kefe',       ad:'Kefe Eyaleti',        merkez:'Kefe',       bolge:'Rumeli',     bayrak:'🐴', gelir:11000, asker:15000, aciklama:'Kırım\'ın stratejik kapısı, Tatar süvarileri.' },

  // ── Arap Coğrafyası ──────────────────────────────────
  { id:'misir',      ad:'Mısır Eyaleti',      merkez:'Kahire',     bolge:'Arap Diyarı',bayrak:'🌴', gelir:25000, asker:10000, aciklama:'Nil\'in nimeti, imparatorluğun tahıl ambarı.' },
  { id:'sam',        ad:'Şam Eyaleti',         merkez:'Şam',        bolge:'Arap Diyarı',bayrak:'🌹', gelir:15000, asker:8000,  aciklama:'Baharat yolunun kalbi.' },
  { id:'halep',      ad:'Halep Eyaleti',       merkez:'Halep',      bolge:'Arap Diyarı',bayrak:'🕌', gelir:12000, asker:6000,  aciklama:'İpek Yolu\'nun kilit noktası.' },
  { id:'bagdat',     ad:'Bağdat Eyaleti',      merkez:'Bağdat',     bolge:'Arap Diyarı',bayrak:'🌙', gelir:16000, asker:9000,  aciklama:'Halifeliğin kadim başkenti.' },
  { id:'basra',      ad:'Basra Eyaleti',       merkez:'Basra',      bolge:'Arap Diyarı',bayrak:'⚓', gelir:10000, asker:5000,  aciklama:'Hint Okyanusu ticaret kapısı.' },
  { id:'musul',      ad:'Musul Eyaleti',       merkez:'Musul',      bolge:'Arap Diyarı',bayrak:'🏺', gelir:8000,  asker:6000,  aciklama:'Kuzey Mezopotamya\'nın merkezi.' },
  { id:'hicaz',      ad:'Hicaz Eyaleti',       merkez:'Mekke',      bolge:'Arap Diyarı',bayrak:'🕋', gelir:8000,  asker:3000,  aciklama:'İki kutsal şehrin mukaddes toprakları.' },
  { id:'yemen',      ad:'Yemen Eyaleti',        merkez:'Sana',       bolge:'Arap Diyarı',bayrak:'☕', gelir:7000,  asker:4000,  aciklama:'Kahvenin anavatanı, deniz ticareti merkezi.' },
  { id:'lahsa',      ad:'Lahsa Eyaleti',        merkez:'Lahsa',      bolge:'Arap Diyarı',bayrak:'🌊', gelir:6000,  asker:3000,  aciklama:'Körfez kıyılarının inci avcıları.' },

  // ── Kuzey Afrika ─────────────────────────────────────
  { id:'trablusgarp',ad:'Trablusgarp Eyaleti', merkez:'Trablusgarp',bolge:'Kuzey Afrika',bayrak:'🏜️', gelir:7000,  asker:5000,  aciklama:'Akdeniz\'in güneyinde korsanların sığınağı.' },
  { id:'tunus',      ad:'Tunus Eyaleti',        merkez:'Tunus',      bolge:'Kuzey Afrika',bayrak:'🌺', gelir:8500,  asker:5000,  aciklama:'Akdeniz ticaretinin güney kapısı.' },
  { id:'cezayir',    ad:'Cezayir Eyaleti',      merkez:'Cezayir',    bolge:'Kuzey Afrika',bayrak:'⚓', gelir:10000, asker:8000,  aciklama:'Kuzey Afrika\'nın en güçlü eyaleti.' },
  { id:'habes',      ad:'Habeş Eyaleti',         merkez:'Masava',     bolge:'Kuzey Afrika',bayrak:'🌿', gelir:4000,  asker:3000,  aciklama:'Doğu Afrika kıyılarının stratejik noktası.' },

  // ── Adalar ──────────────────────────────────────────
  { id:'kibris',     ad:'Kıbrıs Eyaleti',       merkez:'Lefkoşa',    bolge:'Adalar',     bayrak:'🌊', gelir:9000,  asker:4000,  aciklama:'Akdeniz\'in mücevheri.' },
  { id:'girit',      ad:'Girit Eyaleti',         merkez:'Kandiye',    bolge:'Adalar',     bayrak:'🏺', gelir:8000,  asker:5000,  aciklama:'Ege\'nin en büyük adası.' },
];

const BOLGE_RENKLERI = {
  'Anadolu':      '#F0B33E',
  'Rumeli':       '#8B6BF2',
  'Arap Diyarı':  '#3ECF7A',
  'Kuzey Afrika': '#EF5350',
  'Adalar':       '#38BDF8',
};

window.OttomanEyaletScreen = function OttomanEyaletScreen({ cu, setCurrentPage, allUsers, eyaletValiVerisi: serverValiVerisi }) {
  const [aktifBolge, setAktifBolge] = React.useState('hepsi');
  const [seciliEyalet, setSeciliEyalet] = React.useState(null);
  // Sunucudan gelen vali verisi öncelikli
  const [valiVerisi, setValiVerisi] = React.useState(() => {
    if (serverValiVerisi && Object.keys(serverValiVerisi).length > 0) return serverValiVerisi;
    try { return JSON.parse(localStorage.getItem('rep_valiVerisi') || '{}'); } catch { return {}; }
  });
  const [atamaBekliyor, setAtamaBekliyor] = React.useState(false);

  // Sunucu güncellemelerini yakala
  React.useEffect(() => {
    if (serverValiVerisi && typeof serverValiVerisi === 'object') {
      setValiVerisi(serverValiVerisi);
    }
  }, [serverValiVerisi]);

  // Anlık socket güncellemelerini de dinle
  React.useEffect(() => {
    const handler = (e) => {
      if (e.detail?.key === 'eyaletValiVerisi' && e.detail?.value) {
        setValiVerisi(e.detail.value);
      }
    };
    window.addEventListener('fb-sync', handler);
    return () => window.removeEventListener('fb-sync', handler);
  }, []);

  const DS = window.DS || {};
  const isSultan = cu?.role === 'admin' || cu?.isAdmin === true;
  const kullanicivaliEyaleti = Object.entries(valiVerisi).find(([,v]) => v.valiId === cu?.id)?.[0];

  const bolgeler = ['hepsi', ...new Set(OTTOMAN_EYALETLER.map(e => e.bolge))];
  const filtreliEyaletler = aktifBolge === 'hepsi'
    ? OTTOMAN_EYALETLER
    : OTTOMAN_EYALETLER.filter(e => e.bolge === aktifBolge);

  function valiAtamaIste(eyaletId) {
    if (!cu?.id) return;
    if (kullanicivaliEyaleti && kullanicivaliEyaleti !== eyaletId) {
      alert('Zaten başka bir eyaletin valisisiniz!'); return;
    }
    // Sunucuya gönder — sunucu DB'ye yazar ve tüm oyunculara yayar
    const evt = { eyaletId, valiAdi: cu.username, action: 'atama' };
    try { window._socket?.emit('eyaletValiAtama', evt); } catch(_){}
    // Optimistik güncelleme
    const yeniVeri = { ...valiVerisi, [eyaletId]: { valiId: cu.id, valiAdi: cu.username, atamaTarihi: Date.now() } };
    setValiVerisi(yeniVeri);
    localStorage.setItem('rep_valiVerisi', JSON.stringify(yeniVeri));
    setSeciliEyalet(null);
  }

  function valiCikart(eyaletId) {
    if (!isSultan && valiVerisi[eyaletId]?.valiId !== cu?.id) return;
    try { window._socket?.emit('eyaletValiAtama', { eyaletId, action: 'cikart' }); } catch(_){}
    const yeniVeri = { ...valiVerisi };
    delete yeniVeri[eyaletId];
    setValiVerisi(yeniVeri);
    localStorage.setItem('rep_valiVerisi', JSON.stringify(yeniVeri));
    setSeciliEyalet(null);
  }

  const toplam = OTTOMAN_EYALETLER.length;
  const doluSayi = Object.keys(valiVerisi).length;

  return React.createElement('div', {
    style: { minHeight: '100vh', background: '#0F0800', padding: '0 0 80px 0', fontFamily: "'Inter',sans-serif" }
  },
    // Başlık
    React.createElement('div', {
      style: {
        background: 'linear-gradient(135deg,#1a1000 0%,#2d1e00 50%,#1a1000 100%)',
        borderBottom: '1px solid rgba(240,179,62,0.25)',
        padding: '16px 16px 12px',
      }
    },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 } },
        React.createElement('button', {
          onClick: () => setCurrentPage('home'),
          style: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '6px 10px', color: '#8893A1', fontSize: '0.75rem', cursor: 'pointer' }
        }, '← Geri'),
        React.createElement('div', { style: { fontSize: '1.3rem' } }, '🗺️'),
        React.createElement('div', null,
          React.createElement('div', { style: { fontFamily: "'Cinzel',serif", fontWeight: 900, fontSize: '1.1rem', color: '#F0B33E' } }, 'Osmanlı Eyaletleri'),
          React.createElement('div', { style: { fontSize: '0.68rem', color: '#8893A1', marginTop: 1 } }, `${toplam} eyalet · ${doluSayi} valili · ${toplam - doluSayi} boş`)
        )
      ),
      // İstatistikler
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 } },
        [
          ['💰', 'Toplam Gelir', OTTOMAN_EYALETLER.reduce((s,e)=>s+e.gelir,0).toLocaleString('tr') + ' 🪙'],
          ['⚔️', 'Toplam Asker', OTTOMAN_EYALETLER.reduce((s,e)=>s+e.asker,0).toLocaleString('tr')],
          ['👑', 'Dolu Valilik', `${doluSayi}/${toplam}`],
        ].map(([ic, baslik, deger]) =>
          React.createElement('div', { key: baslik, style: { background: 'rgba(240,179,62,0.07)', border: '1px solid rgba(240,179,62,0.15)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' } },
            React.createElement('div', { style: { fontSize: '1rem' } }, ic),
            React.createElement('div', { style: { fontSize: '0.62rem', color: '#8893A1', marginTop: 2 } }, baslik),
            React.createElement('div', { style: { fontSize: '0.78rem', fontWeight: 700, color: '#F0B33E', fontFamily: "'JetBrains Mono',monospace" } }, deger)
          )
        )
      )
    ),

    // Bölge filtresi
    React.createElement('div', { style: { display: 'flex', gap: 6, overflowX: 'auto', padding: '10px 16px', scrollbarWidth: 'none' } },
      bolgeler.map(b =>
        React.createElement('button', {
          key: b,
          onClick: () => setAktifBolge(b),
          style: {
            flexShrink: 0,
            padding: '5px 12px',
            borderRadius: 20,
            border: `1px solid ${aktifBolge === b ? '#F0B33E' : 'rgba(255,255,255,0.1)'}`,
            background: aktifBolge === b ? 'rgba(240,179,62,0.15)' : 'rgba(255,255,255,0.03)',
            color: aktifBolge === b ? '#F0B33E' : '#8893A1',
            fontSize: '0.7rem',
            fontWeight: aktifBolge === b ? 700 : 400,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }
        }, b === 'hepsi' ? '🌍 Tümü' : b)
      )
    ),

    // Eyalet kartları
    React.createElement('div', { style: { padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 8 } },
      filtreliEyaletler.map(eyalet => {
        const vali = valiVerisi[eyalet.id];
        const boluRenk = BOLGE_RENKLERI[eyalet.bolge] || '#F0B33E';
        const benimEyalet = vali?.valiId === cu?.id;

        return React.createElement('div', {
          key: eyalet.id,
          onClick: () => setSeciliEyalet(eyalet),
          style: {
            background: benimEyalet
              ? 'linear-gradient(135deg,rgba(240,179,62,0.12),rgba(240,179,62,0.05))'
              : 'rgba(27,33,43,0.8)',
            border: `1px solid ${benimEyalet ? 'rgba(240,179,62,0.4)' : 'rgba(255,255,255,0.07)'}`,
            borderLeft: `3px solid ${boluRenk}`,
            borderRadius: 12,
            padding: '12px 14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }
        },
          React.createElement('div', { style: { fontSize: '1.8rem', flexShrink: 0 } }, eyalet.bayrak),
          React.createElement('div', { style: { flex: 1, minWidth: 0 } },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 } },
              React.createElement('span', { style: { fontSize: '0.85rem', fontWeight: 700, color: '#EDE7DA' } }, eyalet.ad),
              benimEyalet && React.createElement('span', { style: { fontSize: '0.6rem', background: 'rgba(240,179,62,0.2)', border: '1px solid rgba(240,179,62,0.4)', borderRadius: 6, padding: '1px 5px', color: '#F0B33E', fontWeight: 700 } }, 'VALİNİZ'),
            ),
            React.createElement('div', { style: { fontSize: '0.65rem', color: '#8893A1', marginBottom: 4 } }, `📍 ${eyalet.merkez} · ${eyalet.bolge}`),
            React.createElement('div', { style: { display: 'flex', gap: 10 } },
              React.createElement('span', { style: { fontSize: '0.65rem', color: '#3ECF7A' } }, `💰 ${eyalet.gelir.toLocaleString('tr')} 🪙/gün`),
              React.createElement('span', { style: { fontSize: '0.65rem', color: '#EF5350' } }, `⚔️ ${eyalet.asker.toLocaleString('tr')} asker`),
            )
          ),
          React.createElement('div', { style: { textAlign: 'right', flexShrink: 0 } },
            vali
              ? React.createElement('div', null,
                  React.createElement('div', { style: { fontSize: '0.6rem', color: '#8893A1' } }, '👑 Vali'),
                  React.createElement('div', { style: { fontSize: '0.72rem', fontWeight: 700, color: '#F0B33E' } }, vali.valiAdi)
                )
              : React.createElement('div', { style: { fontSize: '0.65rem', color: '#EF5350', fontWeight: 600 } }, '⚠️ Boş')
          )
        );
      })
    ),

    // Detay Modal
    seciliEyalet && React.createElement('div', {
      style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
      onClick: (e) => { if(e.target === e.currentTarget) setSeciliEyalet(null); }
    },
      React.createElement('div', {
        style: { background: '#1B212B', border: '1px solid rgba(240,179,62,0.3)', borderRadius: 16, padding: '1.5rem', maxWidth: 380, width: '100%', maxHeight: '85vh', overflowY: 'auto' }
      },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 } },
          React.createElement('div', { style: { fontSize: '3rem' } }, seciliEyalet.bayrak),
          React.createElement('div', null,
            React.createElement('div', { style: { fontFamily: "'Cinzel',serif", fontSize: '1.1rem', fontWeight: 900, color: '#F0B33E' } }, seciliEyalet.ad),
            React.createElement('div', { style: { fontSize: '0.72rem', color: '#8893A1' } }, `📍 ${seciliEyalet.merkez} · ${seciliEyalet.bolge}`)
          )
        ),

        React.createElement('div', { style: { fontSize: '0.78rem', color: '#8893A1', lineHeight: 1.5, marginBottom: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '10px 12px' } }, seciliEyalet.aciklama),

        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 } },
          [
            ['💰', 'Günlük Gelir', `${seciliEyalet.gelir.toLocaleString('tr')} 🪙`],
            ['⚔️', 'Asker Gücü', seciliEyalet.asker.toLocaleString('tr')],
          ].map(([ic, baslik, deger]) =>
            React.createElement('div', { key: baslik, style: { background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px' } },
              React.createElement('div', { style: { fontSize: '0.65rem', color: '#8893A1' } }, `${ic} ${baslik}`),
              React.createElement('div', { style: { fontSize: '0.9rem', fontWeight: 700, color: '#EDE7DA', fontFamily: "'JetBrains Mono',monospace" } }, deger)
            )
          )
        ),

        // Mevcut vali
        React.createElement('div', { style: { marginBottom: 14 } },
          React.createElement('div', { style: { fontSize: '0.72rem', color: '#8893A1', marginBottom: 6 } }, '👑 MEVCUT VALİ'),
          valiVerisi[seciliEyalet.id]
            ? React.createElement('div', { style: { background: 'rgba(240,179,62,0.08)', border: '1px solid rgba(240,179,62,0.2)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
                React.createElement('div', null,
                  React.createElement('div', { style: { fontSize: '0.85rem', fontWeight: 700, color: '#F0B33E' } }, `👑 ${valiVerisi[seciliEyalet.id].valiAdi}`),
                  React.createElement('div', { style: { fontSize: '0.62rem', color: '#8893A1' } }, `Atanma: ${new Date(valiVerisi[seciliEyalet.id].atamaTarihi).toLocaleDateString('tr')}`)
                ),
                (isSultan || valiVerisi[seciliEyalet.id].valiId === cu?.id) && React.createElement('button', {
                  onClick: () => valiCikart(seciliEyalet.id),
                  style: { background: 'rgba(239,83,80,0.15)', border: '1px solid rgba(239,83,80,0.3)', borderRadius: 8, padding: '5px 10px', color: '#EF5350', fontSize: '0.7rem', cursor: 'pointer' }
                }, 'Görevden Al')
              )
            : React.createElement('div', { style: { background: 'rgba(239,83,80,0.06)', border: '1px solid rgba(239,83,80,0.2)', borderRadius: 10, padding: '10px 12px', fontSize: '0.78rem', color: '#EF5350' } }, '⚠️ Bu eyalet valisi atanmayı bekliyor')
        ),

        // Aksiyon butonları
        React.createElement('div', { style: { display: 'flex', gap: 8 } },
          !valiVerisi[seciliEyalet.id] && cu?.id && React.createElement('button', {
            onClick: () => valiAtamaIste(seciliEyalet.id),
            disabled: !!kullanicivaliEyaleti,
            style: {
              flex: 1, padding: '10px 14px', borderRadius: 12, border: 'none',
              background: kullanicivaliEyaleti ? '#2a2a2a' : '#F0B33E',
              color: kullanicivaliEyaleti ? '#555' : '#0F0800',
              fontWeight: 800, fontSize: '0.82rem', cursor: kullanicivaliEyaleti ? 'not-allowed' : 'pointer'
            }
          }, kullanicivaliEyaleti ? '⚠️ Başka eyaletiniz var' : '👑 Vali Ol'),
          React.createElement('button', {
            onClick: () => setSeciliEyalet(null),
            style: { padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#8893A1', fontSize: '0.82rem', cursor: 'pointer' }
          }, 'Kapat')
        )
      )
    )
  );
};

// ── Valilik Ana Ekranı (kullanıcının kendi valiliği) ──────────────────────────
window.VaililikEkrani = function VaililikEkrani({ cu, setCurrentPage }) {
  const [valiVerisi] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('rep_valiVerisi') || '{}'); } catch { return {}; }
  });

  const benimEyaletId = Object.entries(valiVerisi).find(([,v]) => v.valiId === cu?.id)?.[0];
  const benimEyalet = benimEyaletId ? OTTOMAN_EYALETLER.find(e => e.id === benimEyaletId) : null;

  const DS = window.DS || {};

  return React.createElement('div', { style: { minHeight: '100vh', background: '#0F0800', fontFamily: "'Inter',sans-serif" } },
    // Header
    React.createElement('div', { style: { background: 'linear-gradient(135deg,#1a1000,#2d1e00)', borderBottom: '1px solid rgba(240,179,62,0.25)', padding: '16px' } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 } },
        React.createElement('button', { onClick: () => setCurrentPage('home'), style: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '6px 10px', color: '#8893A1', fontSize: '0.75rem', cursor: 'pointer' } }, '← Geri'),
        React.createElement('div', { style: { fontSize: '1.2rem' } }, '👑'),
        React.createElement('div', { style: { fontFamily: "'Cinzel',serif", fontWeight: 900, fontSize: '1.1rem', color: '#F0B33E' } }, 'Valilik')
      )
    ),

    React.createElement('div', { style: { padding: '20px 16px' } },
      benimEyalet
        ? React.createElement('div', null,
            // Eyalet kartı
            React.createElement('div', { style: { background: 'linear-gradient(135deg,rgba(240,179,62,0.15),rgba(240,179,62,0.05))', border: '1px solid rgba(240,179,62,0.35)', borderRadius: 16, padding: '20px', marginBottom: 20 } },
              React.createElement('div', { style: { fontSize: '3rem', textAlign: 'center', marginBottom: 8 } }, benimEyalet.bayrak),
              React.createElement('div', { style: { textAlign: 'center', fontFamily: "'Cinzel',serif", fontSize: '1.2rem', fontWeight: 900, color: '#F0B33E', marginBottom: 4 } }, benimEyalet.ad),
              React.createElement('div', { style: { textAlign: 'center', fontSize: '0.72rem', color: '#8893A1', marginBottom: 16 } }, `📍 ${benimEyalet.merkez} · ${benimEyalet.bolge}`),
              React.createElement('div', { style: { textAlign: 'center', fontSize: '0.8rem', color: '#8893A1', fontStyle: 'italic', marginBottom: 16 } }, benimEyalet.aciklama),
              React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } },
                [
                  ['💰', 'Günlük Vergi', `${benimEyalet.gelir.toLocaleString('tr')} 🪙`],
                  ['⚔️', 'Askeri Güç', `${benimEyalet.asker.toLocaleString('tr')}`],
                  ['🗺️', 'Bölge', benimEyalet.bolge],
                  ['👑', 'Unvan', 'Vali'],
                ].map(([ic, baslik, deger]) =>
                  React.createElement('div', { key: baslik, style: { background: 'rgba(240,179,62,0.06)', borderRadius: 10, padding: '10px 12px' } },
                    React.createElement('div', { style: { fontSize: '0.62rem', color: '#8893A1' } }, `${ic} ${baslik}`),
                    React.createElement('div', { style: { fontSize: '0.9rem', fontWeight: 700, color: '#F0B33E' } }, deger)
                  )
                )
              )
            ),
            // Vali yetkileri
            React.createElement('div', { style: { background: 'rgba(27,33,43,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px' } },
              React.createElement('div', { style: { fontWeight: 700, color: '#EDE7DA', fontSize: '0.85rem', marginBottom: 12 } }, '⚡ Vali Yetkileri'),
              [
                ['💰', 'Vergi Toplama', 'Eyaletinizden günlük vergi geliri alırsınız'],
                ['⚔️', 'Asker Sevk', 'Eyalet ordusunu devlet seferlerine katabilirsiniz'],
                ['🏗️', 'İnşaat Yetkisi', 'Eyalet merkezinde bina inşa ettirebilirsiniz'],
                ['📜', 'Kanun Çıkarma', 'Yerel kanunları meclise sunma hakkınız var'],
              ].map(([ic, baslik, acik]) =>
                React.createElement('div', { key: baslik, style: { display: 'flex', gap: 10, marginBottom: 10, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 10 } },
                  React.createElement('div', { style: { fontSize: '1.2rem', flexShrink: 0 } }, ic),
                  React.createElement('div', null,
                    React.createElement('div', { style: { fontSize: '0.78rem', fontWeight: 600, color: '#EDE7DA' } }, baslik),
                    React.createElement('div', { style: { fontSize: '0.65rem', color: '#8893A1' } }, acik)
                  )
                )
              )
            )
          )
        : React.createElement('div', { style: { textAlign: 'center', padding: '40px 20px' } },
            React.createElement('div', { style: { fontSize: '3rem', marginBottom: 12 } }, '🏛️'),
            React.createElement('div', { style: { fontFamily: "'Cinzel',serif", fontSize: '1.1rem', fontWeight: 700, color: '#EDE7DA', marginBottom: 8 } }, 'Henüz Valiliğiniz Yok'),
            React.createElement('div', { style: { fontSize: '0.78rem', color: '#8893A1', marginBottom: 20, lineHeight: 1.5 } }, 'Eyaletler sayfasından boş bir eyalete başvurarak vali olabilirsiniz. Vali olarak eyaletinizden vergi geliri elde eder, asker sevk edebilirsiniz.'),
            React.createElement('button', {
              onClick: () => setCurrentPage('eyalet_harita'),
              style: { padding: '12px 24px', borderRadius: 14, border: 'none', background: '#F0B33E', color: '#0F0800', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }
            }, '🗺️ Eyaletleri Gör')
          )
    )
  );
};
