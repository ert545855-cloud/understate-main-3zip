"use strict";
// ═══════════════════════════════════════════════════════
// SALTANAT ONLINE — Casus Operasyonları
// Rakip beyliğin hazinesini/ordusunu keşfet veya sabote et
// ═══════════════════════════════════════════════════════

const OPERASYONLAR = [
  { id:'kesif',     emoji:'🔭', ad:'Keşif',            acik:'Hedefin hazinesi ve ordu gücünü öğren',          maliyet:500,    risk:10, sure:300,   tip:'bilgi',  odul:'Bilgi' },
  { id:'casusluk',  emoji:'🕵️', ad:'Casusluk',         acik:'Hedefin beylik üyelerini ve planlarını gör',     maliyet:2000,   risk:25, sure:900,   tip:'bilgi',  odul:'Rapor' },
  { id:'sabotaj',   emoji:'🔥', ad:'Sabotaj',           acik:'Hedefin hazinesinden %3-8 çal',                  maliyet:5000,   risk:40, sure:1800,  tip:'saldiri',odul:'Sikke' },
  { id:'suikast',   emoji:'🗡️', ad:'Suikast Girişimi',  acik:'Hedef oyuncunun HP\'sini %30 düşür',            maliyet:8000,   risk:55, sure:3600,  tip:'saldiri',odul:'HP hasarı' },
  { id:'provokas',  emoji:'😈', ad:'Provokasyon',       acik:'Hedef beylikte iç çatışma çıkar, -500 prestij', maliyet:12000,  risk:45, sure:7200,  tip:'saldiri',odul:'Prestij hasarı' },
  { id:'ajan',      emoji:'🥸', ad:'Ajan Yerleştir',    acik:'Beyliğe gizli ajan yer — 24s boyunca bilgi akışı',maliyet:20000, risk:30, sure:86400, tip:'uzun',   odul:'24s rapor' },
];

const LS_AKTIF = 'rep_casusAktif';
const LS_LOG   = 'rep_casusLog';

window.CasusScreen = function CasusScreen({ profile, setProfile, showNotif, setCurrentPage, serverBeyliks }) {
  const [aktifOp, setAktifOp] = React.useState([]);
  const [log, setLog] = React.useState(() => { try { return JSON.parse(localStorage.getItem(LS_LOG)||'[]'); } catch { return []; } });
  const [hedef, setHedef] = React.useState(null);
  const [seciliOp, setSeciliOp] = React.useState(null);
  const [sonuc, setSonuc] = React.useState(null);

  const beyliks = Array.isArray(serverBeyliks) ? serverBeyliks : (()=>{ try { return JSON.parse(localStorage.getItem('rep_beyliks')||'[]'); } catch { return []; }})();
  const uid = profile?.id || profile?.uid;
  const benimBeylik = beyliks.find(b => b.kurucuId === uid || (b.uyeler||[]).includes(uid));
  const rakipler = beyliks.filter(b => b.id !== benimBeylik?.id);

  React.useEffect(() => {
    try { setAktifOp(JSON.parse(localStorage.getItem(LS_AKTIF)||'[]')); } catch { setAktifOp([]); }
    const iv = setInterval(() => {
      try {
        const now = Date.now();
        const aktif = JSON.parse(localStorage.getItem(LS_AKTIF)||'[]');
        const biten = aktif.filter(o => o.bitisTs <= now);
        if (biten.length > 0) {
          biten.forEach(o => tamamla(o, true));
          const yeni = aktif.filter(o => o.bitisTs > now);
          localStorage.setItem(LS_AKTIF, JSON.stringify(yeni));
          setAktifOp(yeni);
        }
      } catch(_) {}
    }, 10000);
    return () => clearInterval(iv);
  }, []);

  function baslatOp(op) {
    if (!hedef) { showNotif('Önce hedef seçin', 'error'); return; }
    if ((profile?.money||0) < op.maliyet) { showNotif(`Yetersiz Sikke — ${op.maliyet.toLocaleString('tr-TR')} gerekli`, 'error'); return; }
    const aktifAyni = aktifOp.find(a => a.opId === op.id);
    if (aktifAyni) { showNotif('Bu operasyon zaten devam ediyor', 'error'); return; }

    const token = localStorage.getItem('us_jwt') || '';
    fetch('/api/game/casus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ opId: op.id, hedefBeylikId: hedef.id, hedefBeylikAd: hedef.ad, maliyet: op.maliyet }),
    }).catch(()=>{});

    const np = { ...profile, money: (profile.money||0) - op.maliyet };
    setProfile(np);
    localStorage.setItem('rep_userProfile', JSON.stringify(np));

    const yeniOp = {
      id: `cas_${Date.now()}`,
      opId: op.id,
      opAd: op.ad,
      opEmoji: op.emoji,
      hedefAd: hedef.ad,
      hedefId: hedef.id,
      risk: op.risk,
      odul: op.odul,
      baslangicTs: Date.now(),
      bitisTs: Date.now() + op.sure * 1000,
    };
    const yeniAktif = [...aktifOp, yeniOp];
    setAktifOp(yeniAktif);
    localStorage.setItem(LS_AKTIF, JSON.stringify(yeniAktif));
    showNotif(`${op.emoji} ${op.ad} operasyonu başladı!`, 'success');
    setSeciliOp(null);
  }

  function tamamla(o, otomatik = false) {
    const basarili = Math.random() * 100 > o.risk;
    const sonucObj = {
      id: o.id,
      opAd: o.opAd,
      opEmoji: o.opEmoji,
      hedefAd: o.hedefAd,
      basarili,
      ts: Date.now(),
      acik: basarili
        ? `✅ ${o.opAd} başarılı! Hedef: ${o.hedefAd} — ${o.odul} elde edildi.`
        : `❌ ${o.opAd} başarısız. Casus yakalandı veya operasyon ifşa oldu.`,
    };
    const yeniLog = [sonucObj, ...log].slice(0, 30);
    setLog(yeniLog);
    localStorage.setItem(LS_LOG, JSON.stringify(yeniLog));
    if (!otomatik) setSonuc(sonucObj);
    showNotif(sonucObj.basarili ? `✅ ${o.opAd} başarılı!` : `❌ Operasyon başarısız`, sonucObj.basarili ? 'success' : 'error');
  }

  const G='#C89B3C', BG='#0F0800', T='#F5EBD7', M='#A9A6A0', S='#2D1800';

  function kalanSure(bitisTs) {
    const fark = bitisTs - Date.now();
    if (fark <= 0) return 'Tamamlandı';
    const s = Math.floor(fark/1000);
    if (s < 60) return `${s}sn`;
    if (s < 3600) return `${Math.floor(s/60)}dk`;
    return `${Math.floor(s/3600)}s ${Math.floor((s%3600)/60)}dk`;
  }

  return React.createElement('div', { style:{minHeight:'100vh',background:BG,fontFamily:"'Inter',sans-serif",paddingBottom:90} },
    React.createElement('div', { style:{background:'linear-gradient(135deg,#1a1000,#2d1e00)',borderBottom:'1px solid rgba(200,155,60,0.25)',padding:'14px 16px'} },
      React.createElement('div', { style:{display:'flex',alignItems:'center',gap:10} },
        React.createElement('button', { onClick:()=>setCurrentPage('home'), style:{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'6px 10px',color:M,fontSize:'0.75rem',cursor:'pointer'} }, '← Geri'),
        React.createElement('span', { style:{fontSize:'1.4rem'} }, '🕵️'),
        React.createElement('div', null,
          React.createElement('div', { style:{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:'1.1rem',color:G} }, 'Casus Teşkilatı'),
          React.createElement('div', { style:{fontSize:'0.62rem',color:M} }, `Mevcut: 🪙${(profile?.money||0).toLocaleString('tr-TR')}`)
        )
      )
    ),

    React.createElement('div', { style:{padding:'12px'} },
      // Aktif operasyonlar
      aktifOp.length > 0 && React.createElement('div', { style:{marginBottom:14} },
        React.createElement('div', { style:{fontSize:'0.65rem',color:G,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6} }, '⏳ Aktif Operasyonlar'),
        aktifOp.map(op => {
          const kalan = op.bitisTs - Date.now();
          const toplam = op.bitisTs - op.baslangicTs;
          const ilerleme = Math.max(0, Math.min(100, ((toplam - kalan) / toplam) * 100));
          return React.createElement('div', { key:op.id, style:{background:'rgba(200,155,60,0.06)',border:'1px solid rgba(200,155,60,0.2)',borderRadius:10,padding:'10px 12px',marginBottom:6} },
            React.createElement('div', { style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6} },
              React.createElement('div', { style:{fontSize:'0.8rem',fontWeight:700,color:T} }, `${op.opEmoji} ${op.opAd} → ${op.hedefAd}`),
              React.createElement('div', { style:{fontSize:'0.68rem',fontWeight:700,color:G,fontFamily:"'JetBrains Mono',monospace"} }, kalanSure(op.bitisTs))
            ),
            React.createElement('div', { style:{height:4,background:'rgba(255,255,255,0.06)',borderRadius:4,overflow:'hidden'} },
              React.createElement('div', { style:{height:'100%',width:`${ilerleme}%`,background:G,borderRadius:4,transition:'width 0.5s'} })
            )
          );
        })
      ),

      // Hedef seçimi
      React.createElement('div', { style:{marginBottom:14} },
        React.createElement('div', { style:{fontSize:'0.65rem',color:G,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6} }, '🎯 Hedef Beylik'),
        rakipler.length === 0
          ? React.createElement('div', { style:{background:'rgba(27,33,43,0.7)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:'20px',textAlign:'center',color:M,fontSize:'0.75rem'} }, 'Henüz rakip beylik yok')
          : React.createElement('div', { style:{display:'flex',gap:6,flexWrap:'wrap'} },
              rakipler.map(b =>
                React.createElement('button', { key:b.id, onClick:()=>setHedef(hedef?.id===b.id?null:b),
                  style:{padding:'6px 12px',borderRadius:20,border:`1px solid ${hedef?.id===b.id?'#B8423C':'rgba(255,255,255,0.1)'}`,background:hedef?.id===b.id?'rgba(184,66,60,0.15)':'rgba(255,255,255,0.03)',color:hedef?.id===b.id?'#B8423C':M,fontSize:'0.7rem',fontWeight:700,cursor:'pointer'} },
                  `⚜️ ${b.ad}`)
              )
            )
      ),

      // Operasyon listesi
      React.createElement('div', { style:{fontFamily:"'Cinzel',serif",fontSize:'0.75rem',color:G,fontWeight:700,marginBottom:8} }, '🕵️ Operasyonlar'),
      React.createElement('div', { style:{display:'flex',flexDirection:'column',gap:6} },
        OPERASYONLAR.map(op => {
          const aktif = aktifOp.find(a => a.opId === op.id);
          const maliyetYeterli = (profile?.money||0) >= op.maliyet;
          return React.createElement('div', { key:op.id,
            style:{background:aktif?'rgba(200,155,60,0.05)':'rgba(27,33,43,0.7)',border:`1px solid ${aktif?'rgba(200,155,60,0.2)':op.tip==='saldiri'?'rgba(184,66,60,0.15)':'rgba(255,255,255,0.07)'}`,borderRadius:10,padding:'10px 12px',display:'flex',alignItems:'center',gap:10} },
            React.createElement('span', { style:{fontSize:'1.4rem',flexShrink:0} }, op.emoji),
            React.createElement('div', { style:{flex:1,minWidth:0} },
              React.createElement('div', { style:{fontSize:'0.82rem',fontWeight:700,color:T,marginBottom:2} }, op.ad),
              React.createElement('div', { style:{fontSize:'0.62rem',color:M,lineHeight:1.4} }, op.acik),
              React.createElement('div', { style:{display:'flex',gap:8,marginTop:4,flexWrap:'wrap'} },
                React.createElement('span', { style:{fontSize:'0.6rem',color:'#B8423C'} }, `⚠️ Risk: %${op.risk}`),
                React.createElement('span', { style:{fontSize:'0.6rem',color:M} }, `⏱ ${op.sure<3600?op.sure/60+'dk':op.sure/3600+'s'}`),
                React.createElement('span', { style:{fontSize:'0.6rem',color:'#3E8C5A'} }, `🎁 ${op.odul}`)
              )
            ),
            React.createElement('div', { style:{textAlign:'right',flexShrink:0} },
              React.createElement('div', { style:{fontSize:'0.68rem',color:G,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",marginBottom:4} }, `🪙${op.maliyet.toLocaleString('tr-TR')}`),
              aktif
                ? React.createElement('div', { style:{fontSize:'0.6rem',color:G,fontWeight:700} }, '⏳ Aktif')
                : React.createElement('button', { onClick:()=>baslatOp(op), disabled:!hedef||!maliyetYeterli,
                    style:{padding:'5px 10px',borderRadius:8,border:'none',background:(!hedef||!maliyetYeterli)?'rgba(255,255,255,0.05)':'#B8423C',color:(!hedef||!maliyetYeterli)?M:'#fff',fontSize:'0.65rem',fontWeight:700,cursor:(!hedef||!maliyetYeterli)?'not-allowed':'pointer'} },
                  !hedef?'Hedef Seç':!maliyetYeterli?'Yetersiz':'Başlat')
            )
          );
        })
      ),

      // Operasyon logu
      log.length > 0 && React.createElement('div', { style:{marginTop:16} },
        React.createElement('div', { style:{fontFamily:"'Cinzel',serif",fontSize:'0.75rem',color:G,fontWeight:700,marginBottom:8} }, '📋 Operasyon Kaydı'),
        React.createElement('div', { style:{display:'flex',flexDirection:'column',gap:4} },
          log.slice(0,10).map(e =>
            React.createElement('div', { key:e.id, style:{background:'rgba(27,33,43,0.5)',border:`1px solid ${e.basarili?'rgba(62,140,90,0.2)':'rgba(184,66,60,0.2)'}`,borderLeft:`3px solid ${e.basarili?'#3E8C5A':'#B8423C'}`,borderRadius:8,padding:'8px 10px'} },
              React.createElement('div', { style:{fontSize:'0.72rem',color:e.basarili?'#3E8C5A':'#B8423C',lineHeight:1.4} }, e.acik),
              React.createElement('div', { style:{fontSize:'0.58rem',color:M,marginTop:2} }, new Date(e.ts).toLocaleString('tr-TR'))
            )
          )
        )
      )
    )
  );
};
