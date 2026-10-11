"use strict";
// ═══════════════════════════════════════════════════════
// SALTANAT ONLINE — Saray Ekranı (Palace)
// Taht Odası · Divan · Hazine · Sultani Fermanlar
// ═══════════════════════════════════════════════════════

window.PalaceScreen = function PalaceScreen({ cu, setCurrentPage, allUsers }) {
  const [aktifSekme, setAktifSekme] = React.useState('taht');

  const DS = window.DS || {};
  const isSultan = cu?.role === 'admin' || cu?.isAdmin === true;

  const SEKMELER = [
    { id:'taht',    icon:'👑', label:'Makam Odası' },
    { id:'divan',   icon:'📜', label:'Kabine'      },
    { id:'hazine',  icon:'💰', label:'Hazine'      },
    { id:'ferman',  icon:'🔖', label:'Kararnameler'  },
  ];

  const DIVAN_UYELERI = [
    { unvan:'Başbakan',     icon:'🥇', aciklama:'Sultanın sağ kolu. Devleti yönetir.',      dolu: false },
    { unvan:'Kazasker',     icon:'⚖️', aciklama:'Ordu ve yargı işlerinden sorumlu.',        dolu: false },
    { unvan:'Defterdar',    icon:'📊', aciklama:'Hazineyi yönetir, vergileri denetler.',   dolu: false },
    { unvan:'Nişancı',      icon:'🖋️', aciklama:'Sultanın mühürünü taşır, belgeleri onaylar.', dolu: false },
    { unvan:'Şeyhülislam',  icon:'🕌', aciklama:'Dini otoriteler ve şeriat işleri.',        dolu: false },
    { unvan:'Kaptan-ı Derya',icon:'⚓', aciklama:'Devlet donanmasının başkomutanı.',      dolu: false },
    { unvan:'Piyade Ağası',icon:'🪖', aciklama:'Piyade ocağının komutanı.',           dolu: false },
    { unvan:'Reisülküttab', icon:'📬', aciklama:'Dış işler ve yazışmalardan sorumlu.',     dolu: false },
  ];

  const FERMANLAR = [
    { id:1, baslik:'Vergi İndirimi Kararnamesi',      tarih:'1574',  durum:'aktif',   aciklama:'Anadolu eyaletlerinde %10 vergi indirimi.' },
    { id:2, baslik:'Ticaret Serbestisi Kararnamesi',   tarih:'1572',  durum:'aktif',   aciklama:'Tüm limanlarda gümrük muafiyeti.' },
    { id:3, baslik:'Askeri Seferberlik Kararnamesi',   tarih:'1571',  durum:'bekleme', aciklama:'Doğu seferine hazırlık emri.' },
    { id:4, baslik:'Eğitim Vakıfları Kararnamesi',    tarih:'1570',  durum:'aktif',   aciklama:'Her eyalette medrese kurulacak.' },
  ];

  const styleSekme = (aktif) => ({
    flex: 1, padding: '8px 4px', borderRadius: 12,
    border: `1px solid ${aktif ? 'rgba(60,200,240,0.5)' : 'rgba(255,255,255,0.07)'}`,
    background: aktif ? 'rgba(60,200,240,0.13)' : 'rgba(255,255,255,0.02)',
    color: aktif ? '#3CC8F0' : '#93A4B8',
    fontWeight: aktif ? 700 : 500,
    fontSize: '0.65rem', cursor: 'pointer', textAlign: 'center',
    fontFamily: "'Inter',sans-serif",
  });

  return React.createElement('div', {
    style: { minHeight:'100vh', background:'#0F1115', paddingBottom:80, fontFamily:"'Inter',sans-serif" }
  },
    // ── Başlık ──
    React.createElement('div', {
      style: {
        background:'linear-gradient(135deg,#0F1724 0%,#152032 50%,#0F1724 100%)',
        borderBottom:'1px solid rgba(60,200,240,0.25)',
        padding:'16px 16px 12px',
      }
    },
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:12 } },
        React.createElement('button', {
          onClick:()=>setCurrentPage('home'),
          style:{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'6px 10px', color:'#93A4B8', fontSize:'0.75rem', cursor:'pointer' }
        }, '← Geri'),
        React.createElement('div', { style:{ fontSize:'1.6rem' } }, '🏰'),
        React.createElement('div', null,
          React.createElement('div', { style:{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:'1.15rem', color:'#3CC8F0' } }, 'Cumhurbaşkanlığı Külliyesi'),
          React.createElement('div', { style:{ fontSize:'0.65rem', color:'#93A4B8' } }, 'Devletin kalbi')
        )
      ),
      React.createElement('div', { style:{ display:'flex', gap:6 } },
        SEKMELER.map(s =>
          React.createElement('button', { key:s.id, onClick:()=>setAktifSekme(s.id), style:styleSekme(aktifSekme===s.id) },
            React.createElement('div', { style:{ fontSize:'0.95rem' } }, s.icon),
            React.createElement('div', null, s.label)
          )
        )
      )
    ),

    React.createElement('div', { style:{ padding:'12px' } },

      // ── Taht Odası ──
      aktifSekme === 'taht' && React.createElement('div', null,
        React.createElement('div', {
          style:{ background:'linear-gradient(135deg,#152032,#0F1724)', border:'1px solid rgba(60,200,240,0.35)', borderRadius:20, padding:'24px', textAlign:'center', marginBottom:16 }
        },
          React.createElement('div', { style:{ fontSize:'3.5rem', marginBottom:8 } }, '👑'),
          React.createElement('div', { style:{ fontFamily:"'Rajdhani',sans-serif", fontSize:'1.3rem', fontWeight:700, color:'#3CC8F0', marginBottom:4 } }, 'CUMHURBAŞKANI'),
          React.createElement('div', { style:{ fontSize:'0.75rem', color:'#93A4B8', marginBottom:16 } }, 'Devletin Lideri'),
          isSultan
            ? React.createElement('div', { style:{ background:'rgba(60,200,240,0.1)', border:'1px solid rgba(60,200,240,0.3)', borderRadius:12, padding:'10px 16px', display:'inline-block' } },
                React.createElement('div', { style:{ fontSize:'0.8rem', color:'#3CC8F0', fontWeight:700 } }, `👑 ${cu?.username || 'Cumhurbaşkanı'}`)
              )
            : React.createElement('div', { style:{ fontSize:'0.75rem', color:'#93A4B8' } }, 'Makam boş — en güçlü oyuncu cumhurbaşkanı olur')
        ),
        // İstatistikler
        React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 } },
          [
            ['🏛️','Bölge','29'],
            ['⚔️','Ordu','250.000'],
            ['₺','Hazine','∞'],
          ].map(([ic,lab,val]) =>
            React.createElement('div', { key:lab, style:{ background:'#1B1E25', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'12px 8px', textAlign:'center' } },
              React.createElement('div', { style:{ fontSize:'1.4rem', marginBottom:4 } }, ic),
              React.createElement('div', { style:{ fontSize:'0.6rem', color:'#93A4B8' } }, lab),
              React.createElement('div', { style:{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.82rem', fontWeight:700, color:'#E6EDF5' } }, val)
            )
          )
        ),
        // Unvanlar hiyerarşisi
        React.createElement('div', { style:{ background:'#1B1E25', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'16px' } },
          React.createElement('div', { style:{ fontFamily:"'Rajdhani',sans-serif", fontSize:'0.85rem', fontWeight:700, color:'#3CC8F0', marginBottom:12 } }, '⚡ Güç Hiyerarşisi'),
          ['🌟 Cumhurbaşkanı', '⭐ Başbakan', '✨ Bakan', '🔹 Vali', '🔸 Bölge Valisi', '▫️ Nahiye Müdürü', '👤 Köylü'].map((r,i) =>
            React.createElement('div', { key:i, style:{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', marginBottom:4, background: i===0?'rgba(60,200,240,0.08)':'transparent', borderRadius:8 } },
              React.createElement('div', { style:{ fontSize:'0.82rem', minWidth:20 } }, r.split(' ')[0]),
              React.createElement('div', { style:{ fontSize:'0.78rem', color: i===0?'#3CC8F0':'#93A4B8', fontWeight: i===0?700:400 } }, r.split(' ').slice(1).join(' '))
            )
          )
        )
      ),

      // ── Divan ──
      aktifSekme === 'divan' && React.createElement('div', null,
        React.createElement('div', { style:{ background:'rgba(60,200,240,0.04)', border:'1px solid rgba(60,200,240,0.15)', borderRadius:12, padding:'12px 14px', marginBottom:14 } },
          React.createElement('div', { style:{ fontSize:'0.72rem', color:'#93A4B8', lineHeight:1.5 } }, '🏛️ Kabine-ı Hümayun, devletin en yüksek karar organıdır. Başbakan başkanlığında toplanır, devlet meseleleri görüşülür.')
        ),
        React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:8 } },
          DIVAN_UYELERI.map((u,i) =>
            React.createElement('div', { key:i, style:{ background:'#1B1E25', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'12px 14px', display:'flex', alignItems:'center', gap:12 } },
              React.createElement('div', { style:{ fontSize:'1.8rem', flexShrink:0 } }, u.icon),
              React.createElement('div', { style:{ flex:1 } },
                React.createElement('div', { style:{ fontFamily:"'Rajdhani',sans-serif", fontSize:'0.82rem', fontWeight:700, color:'#E6EDF5', marginBottom:2 } }, u.unvan),
                React.createElement('div', { style:{ fontSize:'0.65rem', color:'#93A4B8' } }, u.aciklama)
              ),
              React.createElement('div', { style:{ fontSize:'0.65rem', color: u.dolu?'#3CC8F0':'#B8423C', fontWeight:600, flexShrink:0 } }, u.dolu ? '✅ Atanmış' : '⚠️ Boş')
            )
          )
        )
      ),

      // ── Hazine ──
      aktifSekme === 'hazine' && React.createElement('div', null,
        React.createElement('div', {
          style:{ background:'linear-gradient(135deg,#0F1724,#2a1c00)', border:'1px solid rgba(60,200,240,0.3)', borderRadius:20, padding:'20px', textAlign:'center', marginBottom:16 }
        },
          React.createElement('div', { style:{ fontSize:'2.5rem', marginBottom:8 } }, '🏺'),
          React.createElement('div', { style:{ fontFamily:"'Rajdhani',sans-serif", fontSize:'0.85rem', color:'#93A4B8', marginBottom:4 } }, 'SULTANI HAZİNE'),
          React.createElement('div', { style:{ fontFamily:"'JetBrains Mono',monospace", fontSize:'1.5rem', fontWeight:900, color:'#3CC8F0' } }, '0 ₺'),
          React.createElement('div', { style:{ fontSize:'0.65rem', color:'#93A4B8', marginTop:4 } }, 'Vergi ve haraçlardan toplanan devlet geliri')
        ),
        React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:8 } },
          [
            ['💰','Bölge Vergileri','Günlük vergi geliri', '0 ₺/gün'],
            ['⚔️','Savaş Ganimet','Fethedilen topraklardan', '0 ₺'],
            ['🛒','Gümrük Resimleri','Ticaret limanlarından', '0 ₺/gün'],
            ['🕌','Vakıf Gelirleri','Dini kurumlardan', '0 ₺/gün'],
          ].map(([ic,bas,alt,val]) =>
            React.createElement('div', { key:bas, style:{ background:'#1B1E25', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'12px 14px', display:'flex', alignItems:'center', gap:10 } },
              React.createElement('div', { style:{ fontSize:'1.5rem', flexShrink:0 } }, ic),
              React.createElement('div', { style:{ flex:1 } },
                React.createElement('div', { style:{ fontSize:'0.82rem', color:'#E6EDF5', fontWeight:600 } }, bas),
                React.createElement('div', { style:{ fontSize:'0.65rem', color:'#93A4B8' } }, alt)
              ),
              React.createElement('div', { style:{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.78rem', fontWeight:700, color:'#3CC8F0' } }, val)
            )
          )
        )
      ),

      // ── Fermanlar ──
      aktifSekme === 'ferman' && React.createElement('div', null,
        React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:10 } },
          FERMANLAR.map(f =>
            React.createElement('div', { key:f.id, style:{ background:'#1B1E25', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'14px' } },
              React.createElement('div', { style:{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:8 } },
                React.createElement('div', { style:{ fontSize:'1.5rem' } }, '📜'),
                React.createElement('div', { style:{ flex:1 } },
                  React.createElement('div', { style:{ fontFamily:"'Rajdhani',sans-serif", fontSize:'0.85rem', fontWeight:700, color:'#E6EDF5', marginBottom:2 } }, f.baslik),
                  React.createElement('div', { style:{ fontSize:'0.65rem', color:'#93A4B8' } }, `H. ${f.tarih}`)
                ),
                React.createElement('span', { style:{ fontSize:'0.62rem', padding:'3px 8px', borderRadius:8, fontWeight:700, background: f.durum==='aktif'?'rgba(62,140,90,0.2)':'rgba(60,200,240,0.15)', color: f.durum==='aktif'?'#3E8C5A':'#3CC8F0', border:`1px solid ${f.durum==='aktif'?'rgba(62,140,90,0.4)':'rgba(60,200,240,0.3)'}` } }, f.durum==='aktif'?'✅ Aktif':'⏳ Beklemede')
              ),
              React.createElement('div', { style:{ fontSize:'0.72rem', color:'#93A4B8', lineHeight:1.5 } }, f.aciklama)
            )
          )
        ),
        isSultan && React.createElement('button', {
          style:{ width:'100%', marginTop:14, padding:'12px', borderRadius:14, border:'1px solid rgba(60,200,240,0.35)', background:'rgba(60,200,240,0.08)', color:'#3CC8F0', fontFamily:"'Rajdhani',sans-serif", fontSize:'0.85rem', fontWeight:700, cursor:'pointer' }
        }, '+ Yeni Kararname Yayımla')
      )
    )
  );
};
