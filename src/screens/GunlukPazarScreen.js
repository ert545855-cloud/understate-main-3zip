"use strict";
// ═══════════════════════════════════════════════════════
// SALTANAT ONLINE — Günlük Pazar
// Her 24 saatte bir dönen özel fırsatlar
// ═══════════════════════════════════════════════════════

// Havuzdan her gün 6 ürün seçilir (seed = günün tarihi)
const PAZAR_HAVUZU = [
  { id:'altin_torba',   emoji:'⚜️',  ad:'Altın Torbası',      acik:'250 Altın',                  fiyat:80000,  indirim:30, tip:'altin',   miktar:250 },
  { id:'altin_kese',    emoji:'⚜️',  ad:'Altın Kesesi',       acik:'100 Altın',                  fiyat:35000,  indirim:20, tip:'altin',   miktar:100 },
  { id:'sikke_yigini',  emoji:'🪙',  ad:'Sikke Yığını',       acik:'500.000 Sikke',              fiyat:400000, indirim:25, tip:'sikke',   miktar:500000 },
  { id:'sadakat_taşi',  emoji:'💎',  ad:'Sadakat Taşı',       acik:'+5.000 Sadakat Puanı',       fiyat:20000,  indirim:40, tip:'sadakat', miktar:5000 },
  { id:'xp_kitabi',     emoji:'📖',  ad:'Tecrübe Kitabı',     acik:'+10.000 XP',                 fiyat:15000,  indirim:35, tip:'xp',      miktar:10000 },
  { id:'silah_paketi',  emoji:'⚔️',  ad:'Silah Paketi',       acik:'Ordu gücü +1',               fiyat:25000,  indirim:20, tip:'silah',   miktar:1 },
  { id:'koruma_kalkan', emoji:'🛡️',  ad:'Koruma Kalkanı',     acik:'24s savaş koruması',         fiyat:30000,  indirim:50, tip:'koruma',  miktar:1 },
  { id:'ticaret_kart',  emoji:'📜',  ad:'Ticaret Fermanı',    acik:'Pazar komisyonu 24s sıfır',  fiyat:12000,  indirim:45, tip:'ferman',  miktar:1 },
  { id:'casus_gecesi',  emoji:'🕵️',  ad:'Casus Geçişi',       acik:'Bir operasyon ücretsiz',     fiyat:18000,  indirim:30, tip:'casus',   miktar:1 },
  { id:'vip_7gun',      emoji:'👑',  ad:'VIP 7 Gün',          acik:'Tüm kazanımlar +15%',        fiyat:100000, indirim:40, tip:'vip',     miktar:7 },
  { id:'harita_parcasi',emoji:'🗺️',  ad:'Harita Parçası',     acik:'Eyalet bilgisi açar',        fiyat:8000,   indirim:60, tip:'bilgi',   miktar:1 },
  { id:'lonca_izni',    emoji:'🔨',  ad:'Lonca Üretim Artışı',acik:'Üretim 48s 2x',              fiyat:22000,  indirim:35, tip:'uretim',  miktar:2 },
];

function gunSeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth()+1) * 100 + d.getDate();
}

function seudoPseudo(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return Math.abs(s) / 0xffffffff; };
}

function bugunUrunler() {
  const rand = seudoPseudo(gunSeed());
  const karistir = [...PAZAR_HAVUZU].sort(() => rand() - 0.5);
  return karistir.slice(0, 6);
}

function yarinaKalan() {
  const simdi = new Date();
  const yarin = new Date(simdi);
  yarin.setDate(yarin.getDate() + 1);
  yarin.setHours(0, 0, 0, 0);
  const fark = yarin - simdi;
  const s = Math.floor(fark / 3600000);
  const dk = Math.floor((fark % 3600000) / 60000);
  return `${s}s ${dk}dk`;
}

const LS_SATIN = 'rep_gunlukPazarSatin';

window.GunlukPazarScreen = function GunlukPazarScreen({ profile, setProfile, showNotif, setCurrentPage }) {
  const [urunler] = React.useState(bugunUrunler);
  const [satinAlinanlar, setSatinAlinanlar] = React.useState(() => {
    try {
      const d = JSON.parse(localStorage.getItem(LS_SATIN)||'{}');
      if (d.gun !== gunSeed()) return { gun: gunSeed(), urunler: [] };
      return d;
    } catch { return { gun: gunSeed(), urunler: [] }; }
  });
  const [saat, setSaat] = React.useState(yarinaKalan());

  React.useEffect(() => {
    const iv = setInterval(() => setSaat(yarinaKalan()), 60000);
    return () => clearInterval(iv);
  }, []);

  function satin(urun) {
    if ((satinAlinanlar.urunler||[]).includes(urun.id)) { showNotif('Bu ürünü bugün aldınız', 'error'); return; }
    if ((profile?.money||0) < urun.fiyat) { showNotif('Yetersiz Sikke', 'error'); return; }
    const token = localStorage.getItem('us_jwt')||'';

    let np = { ...profile, money: (profile.money||0) - urun.fiyat };
    if (urun.tip === 'altin')   np = { ...np, altin: (np.altin||0) + urun.miktar, underCoin: (np.underCoin||0) + urun.miktar };
    if (urun.tip === 'sikke')   np = { ...np, money: np.money + urun.miktar };
    if (urun.tip === 'sadakat') np = { ...np, loyaltyPoints: (np.loyaltyPoints||0) + urun.miktar };
    if (urun.tip === 'xp')      np = { ...np, xp: (np.xp||0) + urun.miktar };

    setProfile(np);
    localStorage.setItem('rep_userProfile', JSON.stringify(np));

    // Sunucuya kaydet
    const saveBody = { money: np.money };
    if (urun.tip === 'altin')   saveBody.altin = np.altin;
    if (urun.tip === 'sadakat') saveBody.loyaltyPoints = np.loyaltyPoints;
    if (urun.tip === 'xp')      saveBody.xp = np.xp;
    fetch('/api/save', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify(saveBody) }).catch(()=>{});

    const yeniSatin = { gun: gunSeed(), urunler: [...(satinAlinanlar.urunler||[]), urun.id] };
    setSatinAlinanlar(yeniSatin);
    localStorage.setItem(LS_SATIN, JSON.stringify(yeniSatin));
    showNotif(`${urun.emoji} ${urun.ad} satın alındı!`, 'success');
  }

  const G='#C89B3C', BG='#0F0800', T='#F5EBD7', M='#A9A6A0';

  return React.createElement('div', { style:{minHeight:'100vh',background:BG,fontFamily:"'Inter',sans-serif",paddingBottom:90} },
    // Başlık
    React.createElement('div', { style:{background:'linear-gradient(135deg,#1a1000,#2d1e00)',borderBottom:'1px solid rgba(200,155,60,0.25)',padding:'14px 16px'} },
      React.createElement('div', { style:{display:'flex',alignItems:'center',gap:10,marginBottom:10} },
        React.createElement('button', { onClick:()=>setCurrentPage('home'), style:{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'6px 10px',color:M,fontSize:'0.75rem',cursor:'pointer'} }, '← Geri'),
        React.createElement('span', { style:{fontSize:'1.4rem'} }, '🌅'),
        React.createElement('div', null,
          React.createElement('div', { style:{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:'1.1rem',color:G} }, 'Günlük Pazar'),
          React.createElement('div', { style:{fontSize:'0.62rem',color:M} }, `Her gün 6 özel fırsat · Yenileme: ${saat}`)
        )
      ),
      // Bakiye
      React.createElement('div', { style:{display:'flex',gap:8,padding:'8px 0 0'} },
        [['🪙','Sikke',(profile?.money||0)],['⚜️','Altın',(profile?.altin||0)],['💎','Sadakat',(profile?.loyaltyPoints||0)]].map(([ic,lb,val])=>
          React.createElement('div', { key:lb, style:{flex:1,background:'rgba(200,155,60,0.06)',border:'1px solid rgba(200,155,60,0.12)',borderRadius:8,padding:'6px',textAlign:'center'} },
            React.createElement('div', { style:{fontSize:'0.58rem',color:M} }, `${ic} ${lb}`),
            React.createElement('div', { style:{fontSize:'0.72rem',fontWeight:700,color:G,fontFamily:"'JetBrains Mono',monospace"} }, val.toLocaleString('tr-TR'))
          )
        )
      )
    ),

    React.createElement('div', { style:{padding:'12px'} },
      // Bilgi bandı
      React.createElement('div', { style:{background:'rgba(200,155,60,0.06)',border:'1px solid rgba(200,155,60,0.15)',borderRadius:10,padding:'10px 14px',marginBottom:14,display:'flex',alignItems:'center',justifyContent:'space-between'} },
        React.createElement('div', { style:{fontSize:'0.72rem',color:T} }, `🌅 Bugün ${(satinAlinanlar.urunler||[]).length}/6 ürün alındı`),
        React.createElement('div', { style:{fontSize:'0.65rem',color:M} }, `🔄 ${saat} sonra yenilenir`)
      ),

      // Ürün ızgarası
      React.createElement('div', { style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10} },
        urunler.map(u => {
          const alindi = (satinAlinanlar.urunler||[]).includes(u.id);
          const yeterli = (profile?.money||0) >= u.fiyat;
          const asılFiyat = Math.round(u.fiyat / (1 - u.indirim/100));
          return React.createElement('div', { key:u.id,
            style:{background:'rgba(27,33,43,0.8)',border:`1px solid ${alindi?'rgba(62,140,90,0.3)':'rgba(200,155,60,0.12)'}`,borderRadius:14,padding:'14px',display:'flex',flexDirection:'column',position:'relative',overflow:'hidden'} },
            // İndirim rozeti
            React.createElement('div', { style:{position:'absolute',top:8,right:8,background:'#B8423C',borderRadius:20,padding:'2px 8px',fontSize:'0.6rem',fontWeight:800,color:'#fff'} }, `-${u.indirim}%`),
            React.createElement('div', { style:{fontSize:'2rem',marginBottom:8,textAlign:'center'} }, alindi?'✅':u.emoji),
            React.createElement('div', { style:{fontSize:'0.78rem',fontWeight:700,color:T,marginBottom:4,lineHeight:1.3} }, u.ad),
            React.createElement('div', { style:{fontSize:'0.62rem',color:M,lineHeight:1.4,marginBottom:10,flex:1} }, u.acik),
            React.createElement('div', { style:{marginBottom:8} },
              React.createElement('div', { style:{fontSize:'0.58rem',color:M,textDecoration:'line-through'} }, `🪙${asılFiyat.toLocaleString('tr-TR')}`),
              React.createElement('div', { style:{fontSize:'0.82rem',fontWeight:900,color:G,fontFamily:"'JetBrains Mono',monospace"} }, `🪙${u.fiyat.toLocaleString('tr-TR')}`)
            ),
            React.createElement('button', { onClick:()=>satin(u), disabled:alindi||!yeterli,
              style:{width:'100%',padding:'8px',borderRadius:10,border:'none',background:alindi?'rgba(62,140,90,0.15)':yeterli?G:'rgba(255,255,255,0.06)',color:alindi?'#3E8C5A':yeterli?'#0F0800':M,fontWeight:800,fontSize:'0.7rem',cursor:alindi||!yeterli?'default':'pointer'} },
              alindi?'✓ Alındı':!yeterli?'Yetersiz':'Satın Al')
          );
        })
      )
    )
  );
};
