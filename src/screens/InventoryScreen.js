"use strict";
// ═══════════════════════════════════════════════════════
// SALTANAT ONLINE — Envanter (Inventory)
// Silahlar · Zırh · Kaynaklar · Yiyecek · Malzeme
// ═══════════════════════════════════════════════════════

const ENVANTER_KATEGORILER = [
  { id:'hepsi',    icon:'📦', label:'Tümü'     },
  { id:'silah',    icon:'⚔️', label:'Silahlar'  },
  { id:'zirh',     icon:'🛡️', label:'Zırh'     },
  { id:'kaynak',   icon:'⛏️', label:'Kaynaklar' },
  { id:'yiyecek',  icon:'🍞', label:'Yiyecek'  },
  { id:'malzeme',  icon:'🪵', label:'Malzeme'  },
];

const VARSAYILAN_ENVANTER = [
  { id:'kilij',      ad:'Kılıç',          kategori:'silah',   ikon:'⚔️', miktar:1, kalite:'iyi',    deger:500,  aciklama:'Osmanlı sipahi kılıcı. +15 saldırı.' },
  { id:'yay',        ad:'Yay',            kategori:'silah',   ikon:'🏹', miktar:1, kalite:'orta',   deger:300,  aciklama:'Türk geri çekme yayı. Uzak mesafe.' },
  { id:'zirh_deri',  ad:'Deri Zırh',      kategori:'zirh',    ikon:'🛡️', miktar:1, kalite:'orta',   deger:400,  aciklama:'Hafif deri zırh. +10 savunma.' },
  { id:'demir',      ad:'Demir Cevheri',   kategori:'kaynak',  ikon:'⛏️', miktar:50, kalite:'ham',   deger:10,   aciklama:'Silah ve zırh üretimi için gerekli.' },
  { id:'tahta',      ad:'Kereste',         kategori:'malzeme', ikon:'🪵', miktar:30, kalite:'ham',   deger:5,    aciklama:'İnşaat ve gemi yapımında kullanılır.' },
  { id:'bugday',     ad:'Buğday',          kategori:'yiyecek', ikon:'🌾', miktar:100,kalite:'iyi',   deger:3,    aciklama:'Ordu iaşesi için temel gıda maddesi.' },
  { id:'tas',        ad:'Taş Blok',        kategori:'malzeme', ikon:'🪨', miktar:25, kalite:'ham',   deger:8,    aciklama:'Kale ve bina inşaatı için.' },
  { id:'et',         ad:'Kurutulmuş Et',   kategori:'yiyecek', ikon:'🥩', miktar:20, kalite:'iyi',   deger:15,   aciklama:'Uzun seferlerde ordu erzakı.' },
  { id:'altin_cevher',ad:'Altın Cevheri', kategori:'kaynak',  ikon:'⚜️', miktar:5,  kalite:'nadir', deger:100,  aciklama:'Nadir. Madenden çıkarılır. Yüksek değer.' },
  { id:'haki',       ad:'İpek Kumaş',      kategori:'malzeme', ikon:'🧵', miktar:10, kalite:'iyi',   deger:80,   aciklama:'Ticaret ve giysi üretimi için.' },
];

const KALITE_RENK = { ham:'#A9A6A0', orta:'#3E8C5A', iyi:'#C89B3C', nadir:'#8B6BF2' };
const KALITE_AD   = { ham:'Ham',     orta:'Orta',    iyi:'İyi',     nadir:'Nadir'   };

window.InventoryScreen = function InventoryScreen({ cu, setCurrentPage }) {
  const [kategori, setKategori] = React.useState('hepsi');
  const [arama, setArama] = React.useState('');
  const [seciliEsya, setSeciliEsya] = React.useState(null);
  const [envanter, setEnvanter] = React.useState(() => {
    try {
      const kayitli = JSON.parse(localStorage.getItem('rep_envanter') || 'null');
      return kayitli || VARSAYILAN_ENVANTER;
    } catch { return VARSAYILAN_ENVANTER; }
  });

  const filtreliEsyalar = envanter.filter(e => {
    const kategoriFit = kategori === 'hepsi' || e.kategori === kategori;
    const aramaFit = !arama || e.ad.toLowerCase().includes(arama.toLowerCase());
    return kategoriFit && aramaFit;
  });

  const toplamDeger = envanter.reduce((s,e) => s + (e.deger * e.miktar), 0);

  return React.createElement('div', {
    style:{ minHeight:'100vh', background:'#0F1115', paddingBottom:80, fontFamily:"'Inter',sans-serif" }
  },
    // Başlık
    React.createElement('div', {
      style:{ background:'linear-gradient(135deg,#0e0c00,#1c1800)', borderBottom:'1px solid rgba(200,155,60,0.2)', padding:'16px 16px 12px' }
    },
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:10 } },
        React.createElement('button', { onClick:()=>setCurrentPage('home'), style:{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'6px 10px', color:'#A9A6A0', fontSize:'0.75rem', cursor:'pointer' } }, '← Geri'),
        React.createElement('div', { style:{ fontSize:'1.5rem' } }, '📦'),
        React.createElement('div', { style:{ flex:1 } },
          React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:'1.1rem', color:'#C89B3C' } }, 'Envanter'),
          React.createElement('div', { style:{ fontSize:'0.65rem', color:'#A9A6A0' } }, `${envanter.length} eşya · Toplam: ${toplamDeger.toLocaleString('tr')} 🪙`)
        )
      ),
      // Arama
      React.createElement('input', {
        value: arama,
        onChange: e=>setArama(e.target.value),
        placeholder: '🔍 Eşya ara...',
        style:{ width:'100%', padding:'8px 12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#F5EBD7', fontSize:'0.78rem', outline:'none', fontFamily:"'Inter',sans-serif", boxSizing:'border-box', marginBottom:10 }
      }),
      // Kategori filtresi
      React.createElement('div', { style:{ display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none' } },
        ENVANTER_KATEGORILER.map(k =>
          React.createElement('button', {
            key:k.id, onClick:()=>setKategori(k.id),
            style:{ flexShrink:0, padding:'5px 10px', borderRadius:20, border:`1px solid ${kategori===k.id?'rgba(200,155,60,0.5)':'rgba(255,255,255,0.08)'}`, background:kategori===k.id?'rgba(200,155,60,0.13)':'rgba(255,255,255,0.03)', color:kategori===k.id?'#C89B3C':'#A9A6A0', fontSize:'0.65rem', fontWeight:kategori===k.id?700:400, cursor:'pointer', whiteSpace:'nowrap' }
          }, `${k.icon} ${k.label}`)
        )
      )
    ),

    // Eşya grid
    React.createElement('div', { style:{ padding:'12px', display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 } },
      filtreliEsyalar.length === 0
        ? React.createElement('div', { style:{ gridColumn:'span 2', textAlign:'center', padding:'40px 20px', color:'#A9A6A0', fontSize:'0.8rem' } }, '📭 Eşya bulunamadı')
        : filtreliEsyalar.map(e =>
            React.createElement('div', {
              key:e.id, onClick:()=>setSeciliEsya(e),
              style:{ background:'#1B1E25', border:`1px solid ${KALITE_RENK[e.kalite]}22`, borderTop:`2px solid ${KALITE_RENK[e.kalite]}`, borderRadius:14, padding:'12px 10px', cursor:'pointer', position:'relative' }
            },
              React.createElement('div', { style:{ fontSize:'2rem', marginBottom:6, textAlign:'center' } }, e.ikon),
              React.createElement('div', { style:{ fontSize:'0.75rem', fontWeight:700, color:'#F5EBD7', marginBottom:2, textAlign:'center' } }, e.ad),
              React.createElement('div', { style:{ fontSize:'0.6rem', color:KALITE_RENK[e.kalite], fontWeight:600, textAlign:'center', marginBottom:4 } }, `✦ ${KALITE_AD[e.kalite]}`),
              React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center' } },
                React.createElement('span', { style:{ fontSize:'0.65rem', color:'#A9A6A0' } }, `x${e.miktar}`),
                React.createElement('span', { style:{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.65rem', color:'#C89B3C', fontWeight:700 } }, `${(e.deger*e.miktar).toLocaleString('tr')} 🪙`)
              )
            )
          )
    ),

    // Modal
    seciliEsya && React.createElement('div', {
      style:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' },
      onClick:e=>{ if(e.target===e.currentTarget) setSeciliEsya(null); }
    },
      React.createElement('div', { style:{ background:'#1B1E25', border:`1px solid ${KALITE_RENK[seciliEsya.kalite]}44`, borderRadius:20, padding:'1.5rem', maxWidth:340, width:'100%' } },
        React.createElement('div', { style:{ textAlign:'center', marginBottom:14 } },
          React.createElement('div', { style:{ fontSize:'3rem', marginBottom:8 } }, seciliEsya.ikon),
          React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'1.05rem', fontWeight:700, color:'#F5EBD7', marginBottom:4 } }, seciliEsya.ad),
          React.createElement('span', { style:{ fontSize:'0.65rem', padding:'3px 8px', borderRadius:8, background:`${KALITE_RENK[seciliEsya.kalite]}20`, color:KALITE_RENK[seciliEsya.kalite], border:`1px solid ${KALITE_RENK[seciliEsya.kalite]}40`, fontWeight:700 } }, `✦ ${KALITE_AD[seciliEsya.kalite]}`)
        ),
        React.createElement('div', { style:{ fontSize:'0.75rem', color:'#A9A6A0', lineHeight:1.6, marginBottom:14 } }, seciliEsya.aciklama),
        React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 } },
          [['📦','Miktar',`x${seciliEsya.miktar}`],['🪙','Birim Değer',`${seciliEsya.deger.toLocaleString('tr')} 🪙`]].map(([ic,lab,val])=>
            React.createElement('div', { key:lab, style:{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'10px', textAlign:'center' } },
              React.createElement('div', { style:{ fontSize:'0.62rem', color:'#A9A6A0' } }, `${ic} ${lab}`),
              React.createElement('div', { style:{ fontSize:'0.85rem', fontWeight:700, color:'#F5EBD7' } }, val)
            )
          )
        ),
        React.createElement('div', { style:{ display:'flex', gap:8 } },
          React.createElement('button', { style:{ flex:1, padding:'10px', borderRadius:12, border:'none', background:'rgba(62,140,90,0.2)', color:'#3E8C5A', fontWeight:700, fontSize:'0.8rem', cursor:'pointer' } }, '🛒 Sat'),
          React.createElement('button', { onClick:()=>setSeciliEsya(null), style:{ padding:'10px 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.03)', color:'#A9A6A0', fontSize:'0.8rem', cursor:'pointer' } }, 'Kapat')
        )
      )
    )
  );
};
