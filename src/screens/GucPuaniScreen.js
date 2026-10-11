"use strict";
// ═══════════════════════════════════════════════════════
// SALTANAT ONLINE — Güç Puanı Merkezi
// Gıda + Alet + Maden + Eğitim → Toplam Güç Puanı
// Beylik savaşlarında kullanılır
// ═══════════════════════════════════════════════════════

// Global güç puanı hesaplama fonksiyonu — BeylikScreen da kullanır
window.hesaplaGucPuani = function(profile) {
  const gida  = profile?.gidaPuani   || 0;
  const alet  = profile?.aletPuani   || 0;
  const maden = profile?.madenPuani  || 0;
  const egit  = (profile?.educationCycles || 0) * 500 + (profile?.merit_points || 0) * 2;
  const ordu  = (() => {
    try {
      const ordu = JSON.parse(localStorage.getItem('rep_osmOrdu') || '{}');
      const birlikler = ordu.birlikler || {};
      const GÜÇLER = { yeniceri:50, akinci:35, sipahi:45, azap:20, kapikulu:80, topcu:70 };
      return Object.entries(birlikler).reduce((s,[id,adet]) => s + (GÜÇLER[id]||0)*adet, 0);
    } catch { return 0; }
  })();
  // Alet envanteri güç katkısı
  const aletEnvGucu = (() => {
    try {
      const env = JSON.parse(localStorage.getItem('rep_aletEnvanter') || '{}');
      const ALET_GUCLERI = { kilicl1:20,kilicl2:45,kilicl3:90,yayl1:50,yayl2:110,yayl3:200,okl1:15,okl2:35,kalkanl1:10,kalkanl2:25,kalkanl3:55,mızrakl1:25,mızrakl2:60,zirhl1:30,zirhl2:75,zirhl3:160,topl1:80,topl2:180 };
      return Object.entries(env).reduce((s,[id,adet]) => s + (ALET_GUCLERI[id]||0)*adet, 0);
    } catch { return 0; }
  })();
  return { gida, alet: alet + aletEnvGucu, maden, egitim: egit, ordu, toplam: gida + alet + aletEnvGucu + maden + egit + ordu };
};

window.GücPuaniScreen = function GücPuaniScreen({ profile, setProfile, showNotif, onNavigate }) {
  const [sayaç, setSayaç] = React.useState(Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setSayaç(Date.now()), 3000);
    return () => clearInterval(t);
  }, []);

  const güç = window.hesaplaGucPuani(profile || {});

  const GOLD = '#C89B3C';
  const BG   = '#1A0E00';
  const SURF = '#2D1800';

  const kategoriler = [
    { id:'gida',    label:'Gıda Puanı',    emoji:'🌾', deger:güç.gida,    color:'#4C9A6B', aciklama:'Tarım ve hayvancılıktan kazanılır. Ordu iaşesi için kritik.' },
    { id:'alet',    label:'Alet Puanı',    emoji:'⚒️', deger:güç.alet,    color:'#C89B3C', aciklama:'Alet Atölyesi\'nde üretilen silah ve donanımdan kazanılır.' },
    { id:'maden',   label:'Maden Puanı',   emoji:'⛏️', deger:güç.maden,   color:'#8893A1', aciklama:'Madencilik faaliyetlerinden kazanılır. Hammadde katkısı.' },
    { id:'egitim',  label:'Eğitim Puanı',  emoji:'🎓', deger:güç.egitim,  color:'#5B8DD9', aciklama:'Diplomalar ve liyakat puanı eğitim gücüne katkı sağlar.' },
    { id:'ordu',    label:'Ordu Gücü',     emoji:'🪖', deger:güç.ordu,    color:'#C24B43', aciklama:'Askere alınan Osmanlı birliklerinin toplam güç değeri.' },
  ];

  const toplamBar = (deger, toplam) => toplam > 0 ? Math.min(100, Math.round(deger/toplam*100)) : 0;

  return React.createElement('div', {style:{minHeight:'100vh',background:BG,fontFamily:"'Inter',sans-serif",paddingBottom:90}},
    // Header
    React.createElement('div', {style:{background:'linear-gradient(135deg,#2D1800,#3D2200,#2D1800)',borderBottom:'1px solid rgba(200,155,60,0.3)',padding:'14px 16px 14px'}},
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:10,marginBottom:12}},
        React.createElement('span',{style:{fontSize:'1.6rem'}},'⚡'),
        React.createElement('div',null,
          React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:'1.15rem',color:GOLD}},'Güç Puanı Merkezi'),
          React.createElement('div',{style:{fontSize:'0.68rem',color:'#A9A6A0'}},'Tüm puan türlerinin birleşimi → Beylik gücü'),
        ),
      ),
      // Toplam büyük gösterge
      React.createElement('div',{style:{background:'rgba(200,155,60,0.1)',border:'1px solid rgba(200,155,60,0.35)',borderRadius:14,padding:'16px',textAlign:'center',marginBottom:8}},
        React.createElement('div',{style:{fontSize:'0.65rem',color:'#A9A6A0',letterSpacing:'0.12em',textTransform:'uppercase',fontFamily:"'Cinzel',serif",marginBottom:4}},'TOPLAM GÜÇ PUANI'),
        React.createElement('div',{style:{fontFamily:"'JetBrains Mono',monospace",fontSize:'2.5rem',fontWeight:900,color:GOLD}}, güç.toplam.toLocaleString('tr-TR')),
        React.createElement('div',{style:{fontSize:'0.65rem',color:'#8893A1',marginTop:4}}, 'Bu puan beylik savaşlarında kullanılır'),
      ),
    ),

    React.createElement('div',{style:{padding:12}},

      // Puan kategorileri
      React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontSize:'0.65rem',fontWeight:700,color:'#8893A1',marginBottom:10,letterSpacing:'0.1em'}}, 'PUAN KATEGORİLERİ'),
      kategoriler.map(k =>
        React.createElement('div',{key:k.id,style:{background:SURF,border:`1px solid ${k.color}33`,borderRadius:12,padding:'12px 14px',marginBottom:8}},
          React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}},
            React.createElement('div',{style:{display:'flex',alignItems:'center',gap:8}},
              React.createElement('span',{style:{fontSize:'1.2rem'}},k.emoji),
              React.createElement('span',{style:{fontWeight:800,color:'#EDE7DA',fontSize:'0.85rem'}},k.label),
            ),
            React.createElement('div',{style:{fontFamily:"'JetBrains Mono',monospace",fontWeight:800,color:k.color,fontSize:'1rem'}},k.deger.toLocaleString('tr-TR')),
          ),
          React.createElement('div',{style:{height:5,background:'rgba(255,255,255,0.07)',borderRadius:3,overflow:'hidden',marginBottom:5}},
            React.createElement('div',{style:{height:'100%',width:`${toplamBar(k.deger,güç.toplam)}%`,background:k.color,borderRadius:3,transition:'width 0.5s'}}),
          ),
          React.createElement('div',{style:{display:'flex',justifyContent:'space-between'}},
            React.createElement('span',{style:{fontSize:'0.62rem',color:'#6B7687'}},k.aciklama),
            React.createElement('span',{style:{fontSize:'0.62rem',color:k.color,fontWeight:700}},`%${toplamBar(k.deger,güç.toplam)}`),
          ),
        )
      ),

      // Geliştirme kılavuzu
      React.createElement('div',{style:{background:'rgba(200,155,60,0.05)',border:'1px solid rgba(200,155,60,0.15)',borderRadius:12,padding:14,marginTop:8}},
        React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontWeight:700,color:GOLD,marginBottom:10,fontSize:'0.8rem'}},'💡 NASIL GELİŞTİRİLİR?'),
        [
          ['🌾','Gıda Puanı','Tarım → Ekin ek, hasat yap (her hasat +Gıda Puanı)'],
          ['⚒️','Alet Puanı','Maden → Alet Atölyesi → Kılıç/Yay/Ok/Zırh üret'],
          ['⛏️','Maden Puanı','Maden sekmesinden kaynak çıkar (+Maden Puanı)'],
          ['🎓','Eğitim Puanı','Eğitim tamamla + Liyakat puanı kazan'],
          ['🪖','Ordu Gücü','Osmanlı Ordusu\'ndan asker al (Alet ile)'],
        ].map(([em,lb,ac])=>React.createElement('div',{key:lb,style:{display:'flex',gap:8,padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}},
          React.createElement('span',{style:{fontSize:'1rem',flexShrink:0}},em),
          React.createElement('div',null,
            React.createElement('div',{style:{fontSize:'0.73rem',fontWeight:700,color:'#EDE7DA'}},lb),
            React.createElement('div',{style:{fontSize:'0.65rem',color:'#8893A1'}},ac),
          ),
        ))
      ),

      // Hızlı navigasyon
      React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:12}},
        [
          ['⛏️','Madencilik','mining'],
          ['⚒️','Alet Atölyesi','alet_atolyesi'],
          ['🌾','Tarım','farm'],
          ['🪖','Osmanlı Ordusu','ottoman_ordu'],
          ['🎓','Eğitim','education'],
          ['⚜️','Beylikler','politics'],
        ].map(([em,lb,page])=>
          React.createElement('button',{key:page,onClick:()=>onNavigate&&onNavigate(page),style:{background:SURF,border:'1px solid rgba(200,155,60,0.15)',borderRadius:10,padding:'10px 6px',display:'flex',flexDirection:'column',alignItems:'center',gap:4,cursor:'pointer',border:'1px solid rgba(255,255,255,0.07)'}},
            React.createElement('span',{style:{fontSize:'1.3rem'}},em),
            React.createElement('span',{style:{fontSize:'0.65rem',color:'#A9A6A0',fontWeight:700,textAlign:'center'}},lb),
          )
        )
      ),
    ),
  );
};
