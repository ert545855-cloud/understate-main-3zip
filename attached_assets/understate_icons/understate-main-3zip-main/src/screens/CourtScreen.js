"use strict";
// ═══════════════════════════════════════════════════════
// SALTANAT ONLINE — Adalet Divanı (Court / Justice)
// Davalar · Suçlar · Cezalar · Yargıçlar
// ═══════════════════════════════════════════════════════

window.CourtScreen = function CourtScreen({ cu, setCurrentPage, allUsers }) {
  const [aktifSekme, setAktifSekme] = React.useState('davalar');
  const [davalar, setDavalar] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('rep_davalar') || '[]'); } catch { return []; }
  });

  const SUCLAR = [
    { kod:'hirsizlik',  ad:'Hırsızlık',       ceza:'500 🪙 veya 1 saat hapis',  agirlik:'orta', icon:'🥷' },
    { kod:'saldiri',    ad:'Saldırı',          ceza:'1.000 🪙 veya 2 saat hapis', agirlik:'agir', icon:'⚔️' },
    { kod:'karabara',   ad:'Kara Pazar',       ceza:'2.500 🪙 veya 4 saat hapis', agirlik:'agir', icon:'🏴' },
    { kod:'isyan',      ad:'İsyan Çıkarma',    ceza:'5.000 🪙 veya 8 saat hapis', agirlik:'cok_agir', icon:'🚩' },
    { kod:'suikast',    ad:'Suikast Girişimi', ceza:'10.000 🪙 veya 24 saat hapis',agirlik:'cok_agir', icon:'🗡️' },
    { kod:'sahtecilik', ad:'Sikke Sahteciliği',ceza:'3.000 🪙 + itibar kaybı',   agirlik:'agir', icon:'🪙' },
    { kod:'gizli_anlasma',ad:'Gizli Anlaşma', ceza:'Sürgün + 20.000 🪙',         agirlik:'cok_agir', icon:'🤝' },
  ];

  const YARGILAR = [
    { unvan:'Kadıasker',     yetki:'Ağır suçlar', bölge:'Tüm İmparatorluk', icon:'⚖️' },
    { unvan:'Kadı',          yetki:'Orta suçlar', bölge:'Eyalet mahkemesi',  icon:'📜' },
    { unvan:'Naip',          yetki:'Hafif suçlar',bölge:'Nahiye mahkemesi',  icon:'🖋️' },
  ];

  const agirlikRenk = { orta:'#C89B3C', agir:'#E8771C', cok_agir:'#B8423C' };
  const agirlikEtiket = { orta:'Orta', agir:'Ağır', cok_agir:'Çok Ağır' };

  const SEKMELER = [
    { id:'davalar',  icon:'⚖️', label:'Davalar'  },
    { id:'suclar',   icon:'📋', label:'Suç Listesi' },
    { id:'yargilar', icon:'👨‍⚖️', label:'Yargıçlar' },
    { id:'cezaevi',  icon:'🏛️', label:'Hapis'    },
  ];

  return React.createElement('div', {
    style:{ minHeight:'100vh', background:'#0F1115', paddingBottom:80, fontFamily:"'Inter',sans-serif" }
  },
    // Başlık
    React.createElement('div', {
      style:{ background:'linear-gradient(135deg,#0e1200,#1a1c00)', borderBottom:'1px solid rgba(200,155,60,0.2)', padding:'16px 16px 12px' }
    },
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:12 } },
        React.createElement('button', { onClick:()=>setCurrentPage('home'), style:{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'6px 10px', color:'#A9A6A0', fontSize:'0.75rem', cursor:'pointer' } }, '← Geri'),
        React.createElement('div', { style:{ fontSize:'1.5rem' } }, '⚖️'),
        React.createElement('div', null,
          React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:'1.1rem', color:'#C89B3C' } }, 'Adalet Divanı'),
          React.createElement('div', { style:{ fontSize:'0.65rem', color:'#A9A6A0' } }, 'Hukuk, yargı ve ceza sistemi')
        )
      ),
      React.createElement('div', { style:{ display:'flex', gap:6 } },
        SEKMELER.map(s =>
          React.createElement('button', {
            key:s.id, onClick:()=>setAktifSekme(s.id),
            style:{ flex:1, padding:'7px 2px', borderRadius:10, border:`1px solid ${aktifSekme===s.id?'rgba(200,155,60,0.45)':'rgba(255,255,255,0.07)'}`, background: aktifSekme===s.id?'rgba(200,155,60,0.12)':'rgba(255,255,255,0.02)', color: aktifSekme===s.id?'#C89B3C':'#A9A6A0', fontSize:'0.6rem', cursor:'pointer', textAlign:'center', fontWeight: aktifSekme===s.id?700:400 }
          },
            React.createElement('div', { style:{ fontSize:'0.9rem' } }, s.icon),
            React.createElement('div', null, s.label)
          )
        )
      )
    ),

    React.createElement('div', { style:{ padding:'12px' } },

      // ── Davalar ──
      aktifSekme === 'davalar' && React.createElement('div', null,
        davalar.length === 0
          ? React.createElement('div', { style:{ textAlign:'center', padding:'50px 20px' } },
              React.createElement('div', { style:{ fontSize:'3rem', marginBottom:12 } }, '⚖️'),
              React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'1rem', fontWeight:700, color:'#F5EBD7', marginBottom:8 } }, 'Aktif Dava Yok'),
              React.createElement('div', { style:{ fontSize:'0.75rem', color:'#A9A6A0' } }, 'Şu anda görülmekte olan dava bulunmuyor.')
            )
          : davalar.map((d,i) =>
              React.createElement('div', { key:i, style:{ background:'#1B1E25', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'12px 14px', marginBottom:8 } }, d.baslik)
            ),
        React.createElement('div', { style:{ background:'rgba(184,66,60,0.06)', border:'1px solid rgba(184,66,60,0.2)', borderRadius:14, padding:'14px', marginTop:12 } },
          React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'0.8rem', fontWeight:700, color:'#B8423C', marginBottom:8 } }, '⚠️ Şikayet Dilekçesi Ver'),
          React.createElement('div', { style:{ fontSize:'0.7rem', color:'#A9A6A0', marginBottom:10 } }, 'Başka bir oyuncuyu mahkemeye verebilirsiniz. Yargıç davayı inceleyecek.'),
          React.createElement('button', {
            style:{ width:'100%', padding:'10px', borderRadius:12, border:'none', background:'rgba(184,66,60,0.2)', color:'#E08078', fontWeight:700, fontSize:'0.8rem', cursor:'pointer' }
          }, '📜 Dilekçe Ver')
        )
      ),

      // ── Suç Listesi ──
      aktifSekme === 'suclar' && React.createElement('div', null,
        React.createElement('div', { style:{ background:'rgba(200,155,60,0.04)', border:'1px solid rgba(200,155,60,0.15)', borderRadius:12, padding:'10px 14px', marginBottom:12 } },
          React.createElement('div', { style:{ fontSize:'0.7rem', color:'#A9A6A0', lineHeight:1.5 } }, '📜 Osmanlı şeriat ve örfi hukuku çerçevesinde belirlenen suç ve ceza listesi. Tüm suçlar Kadıasker tarafından yargılanır.')
        ),
        React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:8 } },
          SUCLAR.map(s =>
            React.createElement('div', { key:s.kod, style:{ background:'#1B1E25', border:`1px solid ${agirlikRenk[s.agirlik]}22`, borderLeft:`3px solid ${agirlikRenk[s.agirlik]}`, borderRadius:12, padding:'12px 14px', display:'flex', gap:10 } },
              React.createElement('div', { style:{ fontSize:'1.6rem', flexShrink:0 } }, s.icon),
              React.createElement('div', { style:{ flex:1 } },
                React.createElement('div', { style:{ fontSize:'0.85rem', fontWeight:700, color:'#F5EBD7', marginBottom:2 } }, s.ad),
                React.createElement('div', { style:{ fontSize:'0.68rem', color:'#A9A6A0', marginBottom:4 } }, s.ceza),
                React.createElement('span', { style:{ fontSize:'0.58rem', padding:'2px 7px', borderRadius:6, background:`${agirlikRenk[s.agirlik]}20`, color:agirlikRenk[s.agirlik], border:`1px solid ${agirlikRenk[s.agirlik]}40`, fontWeight:700 } }, agirlikEtiket[s.agirlik])
              )
            )
          )
        )
      ),

      // ── Yargıçlar ──
      aktifSekme === 'yargilar' && React.createElement('div', null,
        React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:8 } },
          YARGILAR.map(y =>
            React.createElement('div', { key:y.unvan, style:{ background:'#1B1E25', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'14px', display:'flex', alignItems:'center', gap:12 } },
              React.createElement('div', { style:{ fontSize:'2rem', flexShrink:0 } }, y.icon),
              React.createElement('div', null,
                React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'0.85rem', fontWeight:700, color:'#F5EBD7', marginBottom:2 } }, y.unvan),
                React.createElement('div', { style:{ fontSize:'0.65rem', color:'#A9A6A0', marginBottom:2 } }, `Yetki: ${y.yetki}`),
                React.createElement('div', { style:{ fontSize:'0.62rem', color:'#C89B3C' } }, `📍 ${y.bölge}`)
              )
            )
          )
        )
      ),

      // ── Cezaevi ──
      aktifSekme === 'cezaevi' && React.createElement('div', null,
        React.createElement('div', {
          style:{ background:'rgba(184,66,60,0.06)', border:'1px solid rgba(184,66,60,0.2)', borderRadius:16, padding:'20px', textAlign:'center', marginBottom:16 }
        },
          React.createElement('div', { style:{ fontSize:'2.5rem', marginBottom:8 } }, '🏛️'),
          React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'0.95rem', fontWeight:700, color:'#F5EBD7', marginBottom:4 } }, 'Yedikule Zindanı'),
          React.createElement('div', { style:{ fontSize:'0.7rem', color:'#A9A6A0' } }, 'Hapis cezası alanlar burada tutulur')
        ),
        React.createElement('div', { style:{ background:'#1B1E25', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px' } },
          React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'0.8rem', color:'#C89B3C', marginBottom:10 } }, '📋 Hapis Kuralları'),
          [
            ['⏱️','Hapis süresince aksiyonlar kısıtlanır'],
            ['💰','Rüşvetle tahliye: Ceza × 2 🪙'],
            ['🏃','Kaçış: %30 başarı — başarısızsa süre 2x uzar'],
            ['🙏','İtiraz: 24 saat içinde kadıya başvurulabilir'],
          ].map(([ic,txt]) =>
            React.createElement('div', { key:txt, style:{ display:'flex', gap:8, padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' } },
              React.createElement('span', { style:{ fontSize:'0.9rem', flexShrink:0 } }, ic),
              React.createElement('span', { style:{ fontSize:'0.7rem', color:'#A9A6A0', lineHeight:1.4 } }, txt)
            )
          )
        )
      )
    )
  );
};
