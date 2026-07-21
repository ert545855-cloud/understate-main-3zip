"use strict";
// ═══════════════════════════════════════════════════════
// SALTANAT ONLINE — Lonca Sistemi (Guild System)
// Osmanlı Esnaf Loncaları — Üyelik, Hazine, Yetkiler
// ═══════════════════════════════════════════════════════

const LONCA_TIPLERI = [
  { id:'kuyumcu',   ad:'Kuyumcular Loncası',  icon:'💍', aciklama:'Altın ve gümüş işçileri. Takı, sikke ve süs eşyası üretir.',     bonus:'+20% Altın geliri',  renk:'#C89B3C' },
  { id:'tacir',     ad:'Tüccarlar Loncası',   icon:'🛒', aciklama:'İpek Yolu tüccarları. Eyaletler arası ticaret yapar.',            bonus:'+15% Ticaret geliri',renk:'#3E8C5A' },
  { id:'demirci',   ad:'Demirciler Loncası',  icon:'⚒️', aciklama:'Silah ve zırh ustası demirciler. Orduya teçhizat sağlar.',        bonus:'+25% Silah gücü',    renk:'#6B7280' },
  { id:'mimarlar',  ad:'Mimarlar Loncası',    icon:'🏛️', aciklama:'Cami, kervansaray ve köprü inşa eden usta mimarlar.',             bonus:'+30% İnşaat hızı',   renk:'#8B6BF2' },
  { id:'eczaci',    ad:'Eczacılar Loncası',   icon:'🌿', aciklama:'Baharat ve ilaç tüccarları. Sağlık ve zehir bilimleri.',          bonus:'+10% HP/gün',        renk:'#3ECF7A' },
  { id:'denizci',   ad:'Denizciler Loncası',  icon:'⚓', aciklama:'Kaptan ve denizciler. Deniz ticareti ve keşif seferleri.',         bonus:'+40% Deniz geliri',  renk:'#38BDF8' },
  { id:'alim',      ad:'Alimler Loncası',     icon:'📚', aciklama:'Medrese mezunu bilginler. Eğitim ve diplomasi işleri.',           bonus:'+20% XP kazanımı',   renk:'#F0B33E' },
  { id:'kasap',     ad:'Kasaplar Loncası',    icon:'🥩', aciklama:'Et, hayvan ve deri ticareti yapan esnaf.',                        bonus:'+15% Askeri yiyecek',renk:'#B8423C' },
];

window.GuildScreen = function GuildScreen({ cu, setCurrentPage, allUsers }) {
  const [aktifSekme, setAktifSekme] = React.useState('loncalar');
  const [seciliLonca, setSeciliLonca] = React.useState(null);
  const [uyeLiklar, setUyeliklar] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('rep_loncaUyelik') || '{}'); } catch { return {}; }
  });

  const benimLonca = Object.entries(uyeLiklar).find(([,v]) => v.userId === cu?.id);
  const benimLoncaId = benimLonca?.[0];

  function loncayaKatil(loncaId) {
    if (benimLoncaId) { alert('Zaten bir loncaya üyesiniz!'); return; }
    const yeni = { ...uyeLiklar, [loncaId]: { userId:cu?.id, kullanici:cu?.username, katilma:Date.now(), unvan:'Çırak' }};
    setUyeliklar(yeni);
    localStorage.setItem('rep_loncaUyelik', JSON.stringify(yeni));
    try { window._socket?.emit('loncaKatil', { loncaId, userId:cu?.id, username:cu?.username }); } catch(_){}
    setSeciliLonca(null);
  }

  function loncadanAyril() {
    if (!benimLoncaId) return;
    const yeni = { ...uyeLiklar };
    delete yeni[benimLoncaId];
    setUyeliklar(yeni);
    localStorage.setItem('rep_loncaUyelik', JSON.stringify(yeni));
  }

  const SEKMELER = [
    { id:'loncalar', icon:'🏛️', label:'Loncalar'   },
    { id:'benim',    icon:'⭐', label:'Loncam'     },
    { id:'pazar',    icon:'🛒', label:'Lonca Pazarı'},
  ];

  return React.createElement('div', {
    style:{ minHeight:'100vh', background:'#0F1115', paddingBottom:80, fontFamily:"'Inter',sans-serif" }
  },
    // Başlık
    React.createElement('div', {
      style:{ background:'linear-gradient(135deg,#0d0e1a,#141830)', borderBottom:'1px solid rgba(200,155,60,0.2)', padding:'16px 16px 12px' }
    },
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:12 } },
        React.createElement('button', { onClick:()=>setCurrentPage('home'), style:{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'6px 10px', color:'#A9A6A0', fontSize:'0.75rem', cursor:'pointer' } }, '← Geri'),
        React.createElement('div', { style:{ fontSize:'1.5rem' } }, '⚒️'),
        React.createElement('div', null,
          React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:'1.1rem', color:'#C89B3C' } }, 'Esnaf Loncaları'),
          React.createElement('div', { style:{ fontSize:'0.65rem', color:'#A9A6A0' } }, `${LONCA_TIPLERI.length} lonca · ${Object.keys(uyeLiklar).length} üye`)
        )
      ),
      React.createElement('div', { style:{ display:'flex', gap:6 } },
        SEKMELER.map(s =>
          React.createElement('button', {
            key:s.id, onClick:()=>setAktifSekme(s.id),
            style:{ flex:1, padding:'7px 4px', borderRadius:10, border:`1px solid ${aktifSekme===s.id?'rgba(200,155,60,0.45)':'rgba(255,255,255,0.07)'}`, background:aktifSekme===s.id?'rgba(200,155,60,0.12)':'rgba(255,255,255,0.02)', color:aktifSekme===s.id?'#C89B3C':'#A9A6A0', fontSize:'0.62rem', cursor:'pointer', textAlign:'center', fontWeight:aktifSekme===s.id?700:400 }
          },
            React.createElement('div', { style:{ fontSize:'0.9rem' } }, s.icon),
            React.createElement('div', null, s.label)
          )
        )
      )
    ),

    React.createElement('div', { style:{ padding:'12px' } },

      // ── Lonca Listesi ──
      aktifSekme === 'loncalar' && React.createElement('div', null,
        LONCA_TIPLERI.map(l => {
          const uyeSayisi = Object.values(uyeLiklar).filter(v=>v && (v.loncaId||l.id)===l.id || Object.keys(uyeLiklar).find(k=>k===l.id)).length;
          const benimBurada = benimLoncaId === l.id;

          return React.createElement('div', {
            key:l.id, onClick:()=>setSeciliLonca(l),
            style:{ background:'#1B1E25', border:`1px solid ${benimBurada?`${l.renk}55`:'rgba(255,255,255,0.07)'}`, borderLeft:`3px solid ${l.renk}`, borderRadius:14, padding:'12px 14px', marginBottom:8, cursor:'pointer', display:'flex', alignItems:'center', gap:12 }
          },
            React.createElement('div', { style:{ fontSize:'2rem', flexShrink:0 } }, l.icon),
            React.createElement('div', { style:{ flex:1 } },
              React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:6, marginBottom:2 } },
                React.createElement('span', { style:{ fontFamily:"'Cinzel',serif", fontSize:'0.85rem', fontWeight:700, color:'#F5EBD7' } }, l.ad),
                benimBurada && React.createElement('span', { style:{ fontSize:'0.58rem', background:`${l.renk}22`, border:`1px solid ${l.renk}55`, borderRadius:6, padding:'1px 5px', color:l.renk, fontWeight:700 } }, 'ÜYESİNİZ')
              ),
              React.createElement('div', { style:{ fontSize:'0.62rem', color:'#A9A6A0', marginBottom:3 } }, l.aciklama.substring(0,55)+'...'),
              React.createElement('div', { style:{ fontSize:'0.62rem', color:l.renk, fontWeight:600 } }, `⚡ ${l.bonus}`)
            )
          );
        })
      ),

      // ── Loncam ──
      aktifSekme === 'benim' && React.createElement('div', null,
        benimLoncaId
          ? (() => {
              const l = LONCA_TIPLERI.find(x=>x.id===benimLoncaId);
              if (!l) return null;
              return React.createElement('div', null,
                React.createElement('div', { style:{ background:`linear-gradient(135deg,${l.renk}15,${l.renk}05)`, border:`1px solid ${l.renk}40`, borderRadius:20, padding:'20px', textAlign:'center', marginBottom:16 } },
                  React.createElement('div', { style:{ fontSize:'3rem', marginBottom:8 } }, l.icon),
                  React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'1.1rem', fontWeight:700, color:l.renk, marginBottom:4 } }, l.ad),
                  React.createElement('div', { style:{ fontSize:'0.72rem', color:'#A9A6A0', marginBottom:10 } }, l.aciklama),
                  React.createElement('div', { style:{ background:`${l.renk}15`, borderRadius:10, padding:'8px 14px', display:'inline-block' } },
                    React.createElement('div', { style:{ fontSize:'0.65rem', color:'#A9A6A0' } }, 'Unvanınız'),
                    React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'0.9rem', fontWeight:700, color:l.renk } }, uyeLiklar[benimLoncaId]?.unvan || 'Çırak')
                  )
                ),
                React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 } },
                  [['⚡','Bonus',l.bonus],['📅','Katılma',new Date(uyeLiklar[benimLoncaId]?.katilma||Date.now()).toLocaleDateString('tr')]].map(([ic,lab,val])=>
                    React.createElement('div', { key:lab, style:{ background:'#1B1E25', borderRadius:12, padding:'10px', textAlign:'center' } },
                      React.createElement('div', { style:{ fontSize:'0.62rem', color:'#A9A6A0', marginBottom:2 } }, `${ic} ${lab}`),
                      React.createElement('div', { style:{ fontSize:'0.78rem', fontWeight:700, color:'#F5EBD7' } }, val)
                    )
                  )
                ),
                React.createElement('button', { onClick:loncadanAyril, style:{ width:'100%', padding:'10px', borderRadius:12, border:'1px solid rgba(184,66,60,0.3)', background:'rgba(184,66,60,0.08)', color:'#B8423C', fontWeight:700, fontSize:'0.8rem', cursor:'pointer' } }, 'Loncadan Ayrıl')
              );
            })()
          : React.createElement('div', { style:{ textAlign:'center', padding:'50px 20px' } },
              React.createElement('div', { style:{ fontSize:'3rem', marginBottom:12 } }, '⚒️'),
              React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'1rem', fontWeight:700, color:'#F5EBD7', marginBottom:8 } }, 'Henüz Loncaya Üye Değilsiniz'),
              React.createElement('div', { style:{ fontSize:'0.75rem', color:'#A9A6A0', marginBottom:16 } }, 'Loncalar sekmesinden bir loncaya katılın.'),
              React.createElement('button', { onClick:()=>setAktifSekme('loncalar'), style:{ padding:'10px 24px', borderRadius:12, border:'none', background:'#C89B3C', color:'#0F1115', fontWeight:800, fontSize:'0.85rem', cursor:'pointer' } }, '🏛️ Loncaları Gör')
            )
      ),

      // ── Lonca Pazarı ──
      aktifSekme === 'pazar' && React.createElement('div', null,
        React.createElement('div', { style:{ textAlign:'center', padding:'30px 20px' } },
          React.createElement('div', { style:{ fontSize:'2.5rem', marginBottom:12 } }, '🛒'),
          React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'0.95rem', fontWeight:700, color:'#F5EBD7', marginBottom:8 } }, 'Lonca Pazarı'),
          React.createElement('div', { style:{ fontSize:'0.75rem', color:'#A9A6A0' } }, 'Loncalar arası özel ticaret yakında açılıyor...')
        )
      )
    ),

    // Modal
    seciliLonca && React.createElement('div', {
      style:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' },
      onClick:e=>{ if(e.target===e.currentTarget) setSeciliLonca(null); }
    },
      React.createElement('div', {
        style:{ background:'#1B1E25', border:`1px solid ${seciliLonca.renk}44`, borderRadius:20, padding:'1.5rem', maxWidth:360, width:'100%' }
      },
        React.createElement('div', { style:{ textAlign:'center', marginBottom:16 } },
          React.createElement('div', { style:{ fontSize:'3rem', marginBottom:8 } }, seciliLonca.icon),
          React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'1.05rem', fontWeight:700, color:seciliLonca.renk } }, seciliLonca.ad)
        ),
        React.createElement('div', { style:{ fontSize:'0.75rem', color:'#A9A6A0', lineHeight:1.6, marginBottom:14 } }, seciliLonca.aciklama),
        React.createElement('div', { style:{ background:`${seciliLonca.renk}12`, border:`1px solid ${seciliLonca.renk}30`, borderRadius:10, padding:'10px 14px', marginBottom:16 } },
          React.createElement('div', { style:{ fontSize:'0.62rem', color:'#A9A6A0' } }, 'Üyelik Bonusu'),
          React.createElement('div', { style:{ fontSize:'0.88rem', fontWeight:700, color:seciliLonca.renk } }, `⚡ ${seciliLonca.bonus}`)
        ),
        React.createElement('div', { style:{ display:'flex', gap:8 } },
          !benimLoncaId && React.createElement('button', {
            onClick:()=>loncayaKatil(seciliLonca.id),
            style:{ flex:1, padding:'10px', borderRadius:12, border:'none', background:seciliLonca.renk, color:'#0F1115', fontWeight:800, fontSize:'0.82rem', cursor:'pointer' }
          }, '✅ Katıl'),
          React.createElement('button', { onClick:()=>setSeciliLonca(null), style:{ padding:'10px 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.03)', color:'#A9A6A0', fontSize:'0.82rem', cursor:'pointer' } }, 'Kapat')
        )
      )
    )
  );
};
