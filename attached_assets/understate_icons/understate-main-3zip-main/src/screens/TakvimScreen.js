"use strict";
// ═══════════════════════════════════════════════════════
// SALTANAT ONLINE — İmparatorluk Takvimi
// Savaş pencereleri, festivallar, Genel Sefer sayacı
// ═══════════════════════════════════════════════════════

const HAFTA_GUNLERI = ['Pzr','Pzt','Sal','Çar','Per','Cum','Cmt'];
const AYLAR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

// Haftalık tekrar eden etkinlikler
const TEKRAR_ETKINLIKLER = [
  { gun:1, saat:'08:00', sure:4,  tip:'savas',    emoji:'⚔️', ad:'Sabah Akını',        acik:'Tüm savaşlar aktif, güç bonusu +10%',                 renk:'#B8423C' },
  { gun:1, saat:'20:00', sure:3,  tip:'pazar',    emoji:'🛒', ad:'Haftalık Büyük Pazar', acik:'Özel indirimler, nadir eşyalar mevcut',             renk:'#3E8C5A' },
  { gun:2, saat:'12:00', sure:2,  tip:'vergi',    emoji:'📋', ad:'Vergi Toplama',        acik:'Eyalet gelirleri toplanır, vali bonusu',            renk:'#5B8DD9' },
  { gun:3, saat:'18:00', sure:6,  tip:'savas',    emoji:'⚔️', ad:'Çarşamba Seferi',      acik:'Özel savaş bölgesi açık, +20% ganimet',            renk:'#B8423C' },
  { gun:4, saat:'10:00', sure:3,  tip:'sadakat',  emoji:'💎', ad:'Divan Oturumu',        acik:'Sadakat görevleri 2x ödül verir',                  renk:'#C89B3C' },
  { gun:5, saat:'15:00', sure:4,  tip:'turnuva',  emoji:'🏆', ad:'Cuma Turnuvası',       acik:'Haftalık PvP turnuvası finali, ödüller dağıtılır', renk:'#FFD700' },
  { gun:5, saat:'20:00', sure:8,  tip:'festival', emoji:'🎆', ad:'Cuma Gecesi Festivali', acik:'XP ve Sikke kazanımı 1.5x — tüm gece',           renk:'#9C5FDB' },
  { gun:6, saat:'09:00', sure:12, tip:'sefer',    emoji:'🚩', ad:'Genel Sefer Penceresi', acik:'Büyük eyalet fetihleri bu pencerede yapılır',     renk:'#E67E22' },
  { gun:0, saat:'16:00', sure:3,  tip:'festival', emoji:'🌙', ad:'Pazar Şöleni',          acik:'Tüm üretim binaları 2x verim',                   renk:'#9C5FDB' },
];

// Tek seferlik yaklaşan olaylar (dinamik, sunucudan da gelebilir)
const OZEL_ETKINLIKLER = [
  { tarih:null, tip:'sefer', emoji:'🚩', ad:'Büyük Genel Sefer', acik:'Padişah fermanıyla açılan büyük fetih kampanyası', renk:'#E67E22', gunKalan:7 },
  { tarih:null, tip:'festival', emoji:'🎆', ad:'Kurban Bayramı Şöleni', acik:'3 gün boyunca 2x Sikke + özel kostümler', renk:'#9C5FDB', gunKalan:18 },
  { tarih:null, tip:'turnuva', emoji:'🏆', ad:'Aylık Şampiyona', acik:'En büyük beyliğe imparatorluk unvanı', renk:'#FFD700', gunKalan:23 },
];

const TIP_RENK = { savas:'#B8423C', pazar:'#3E8C5A', vergi:'#5B8DD9', sadakat:'#C89B3C', turnuva:'#FFD700', festival:'#9C5FDB', sefer:'#E67E22' };
const TIP_ETIKET = { savas:'Savaş', pazar:'Pazar', vergi:'Vergi', sadakat:'Sadakat', turnuva:'Turnuva', festival:'Festival', sefer:'Sefer' };

function zamanDonustur(gunSirasi, saatStr) {
  const [h, m] = saatStr.split(':').map(Number);
  const simdi = new Date();
  const hedef = new Date(simdi);
  hedef.setHours(h, m, 0, 0);
  const simdiGun = simdi.getDay();
  let fark = gunSirasi - simdiGun;
  if (fark < 0) fark += 7;
  if (fark === 0 && hedef <= simdi) fark = 7;
  hedef.setDate(simdi.getDate() + fark);
  return hedef;
}

function kalanSure(hedef) {
  const fark = hedef - Date.now();
  if (fark <= 0) return 'Şu an aktif';
  const s = Math.floor(fark / 3600000);
  const d = Math.floor(s / 24);
  if (d > 0) return `${d}g ${s%24}s`;
  return `${s}s ${Math.floor((fark%3600000)/60000)}dk`;
}

window.TakvimScreen = function TakvimScreen({ profile, setCurrentPage, showNotif }) {
  const [aktifSekme, setAktifSekme] = React.useState('bu_hafta');
  const [simdi, setSimdi] = React.useState(new Date());

  React.useEffect(() => {
    const iv = setInterval(() => setSimdi(new Date()), 60000);
    return () => clearInterval(iv);
  }, []);

  const simdiGun = simdi.getDay();
  const simdiSaat = simdi.getHours() + simdi.getMinutes() / 60;

  function aktifMi(etkinlik) {
    const [h] = etkinlik.saat.split(':').map(Number);
    const etkinlikSaatBasla = h;
    const etkinlikSaatBit = h + etkinlik.sure;
    return etkinlik.gun === simdiGun && simdiSaat >= etkinlikSaatBasla && simdiSaat < etkinlikSaatBit;
  }

  const buHaftaEtkinlikler = [...TEKRAR_ETKINLIKLER]
    .map(e => ({ ...e, hedefTarih: zamanDonustur(e.gun, e.saat), aktif: aktifMi(e) }))
    .sort((a, b) => {
      if (a.aktif && !b.aktif) return -1;
      if (!a.aktif && b.aktif) return 1;
      return a.hedefTarih - b.hedefTarih;
    });

  const aktifEtkinlikler = buHaftaEtkinlikler.filter(e => e.aktif);
  const G='#C89B3C', BG='#0F0800', T='#F5EBD7', M='#A9A6A0';

  // Haftalık plan ızgarası
  function HaftalikIzgara() {
    return React.createElement('div', { style:{overflowX:'auto'} },
      React.createElement('div', { style:{minWidth:480} },
        // Gün başlıkları
        React.createElement('div', { style:{display:'grid',gridTemplateColumns:'60px repeat(7,1fr)',gap:2,marginBottom:4} },
          React.createElement('div', null),
          HAFTA_GUNLERI.map((g, i) =>
            React.createElement('div', { key:g, style:{textAlign:'center',fontSize:'0.62rem',fontWeight:700,color:i===simdiGun?G:M,padding:'4px 2px',borderRadius:6,background:i===simdiGun?'rgba(200,155,60,0.1)':'transparent'} }, g)
          )
        ),
        // Saatler + etkinlikler
        ['08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00'].map(saat => {
          const saatNo = parseInt(saat);
          return React.createElement('div', { key:saat, style:{display:'grid',gridTemplateColumns:'60px repeat(7,1fr)',gap:2,marginBottom:2} },
            React.createElement('div', { style:{fontSize:'0.58rem',color:'rgba(255,255,255,0.3)',display:'flex',alignItems:'center',paddingRight:4} }, saat),
            HAFTA_GUNLERI.map((_, gunIdx) => {
              const etkinlik = TEKRAR_ETKINLIKLER.find(e => e.gun === gunIdx && parseInt(e.saat) === saatNo);
              return React.createElement('div', { key:gunIdx,
                style:{height:28,borderRadius:4,background:etkinlik?`${etkinlik.renk}33`:'rgba(255,255,255,0.02)',border:etkinlik?`1px solid ${etkinlik.renk}55`:'1px solid transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.65rem',cursor:etkinlik?'pointer':'default'} },
                etkinlik ? etkinlik.emoji : null
              );
            })
          );
        })
      )
    );
  }

  return React.createElement('div', { style:{minHeight:'100vh',background:BG,fontFamily:"'Inter',sans-serif",paddingBottom:90} },
    // Başlık
    React.createElement('div', { style:{background:'linear-gradient(135deg,#1a1000,#2d1e00)',borderBottom:'1px solid rgba(200,155,60,0.25)',padding:'14px 16px'} },
      React.createElement('div', { style:{display:'flex',alignItems:'center',gap:10,marginBottom:12} },
        React.createElement('button', { onClick:()=>setCurrentPage('home'), style:{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'6px 10px',color:M,fontSize:'0.75rem',cursor:'pointer'} }, '← Geri'),
        React.createElement('span', { style:{fontSize:'1.4rem'} }, '📅'),
        React.createElement('div', null,
          React.createElement('div', { style:{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:'1.1rem',color:G} }, 'İmparatorluk Takvimi'),
          React.createElement('div', { style:{fontSize:'0.62rem',color:M} }, `${HAFTA_GUNLERI[simdiGun]} · ${simdi.getDate()} ${AYLAR[simdi.getMonth()]}`)
        )
      ),
      // Sekme bar
      React.createElement('div', { style:{display:'flex',gap:4} },
        [['bu_hafta','📅 Bu Hafta'],['ozel','✨ Özel Etkinlik'],['plan','🗓️ Plan']].map(([id,lb]) =>
          React.createElement('button', { key:id, onClick:()=>setAktifSekme(id),
            style:{flex:1,padding:'7px 4px',borderRadius:10,border:`1px solid ${aktifSekme===id?G:'rgba(255,255,255,0.08)'}`,background:aktifSekme===id?'rgba(200,155,60,0.15)':'rgba(255,255,255,0.03)',color:aktifSekme===id?G:M,fontWeight:700,fontSize:'0.68rem',cursor:'pointer'} }, lb)
        )
      )
    ),

    React.createElement('div', { style:{padding:'12px'} },
      // Şu an aktif
      aktifEtkinlikler.length > 0 && React.createElement('div', { style:{marginBottom:12} },
        React.createElement('div', { style:{fontSize:'0.65rem',color:'#3E8C5A',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6} }, '🟢 Şu An Aktif'),
        aktifEtkinlikler.map(e =>
          React.createElement('div', { key:e.ad, style:{background:`${e.renk}15`,border:`1px solid ${e.renk}44`,borderLeft:`3px solid ${e.renk}`,borderRadius:10,padding:'10px 12px',marginBottom:6,display:'flex',alignItems:'center',gap:10} },
            React.createElement('span', { style:{fontSize:'1.4rem'} }, e.emoji),
            React.createElement('div', { style:{flex:1} },
              React.createElement('div', { style:{fontSize:'0.82rem',fontWeight:700,color:T} }, e.ad),
              React.createElement('div', { style:{fontSize:'0.65rem',color:M,lineHeight:1.4,marginTop:2} }, e.acik)
            ),
            React.createElement('div', { style:{fontSize:'0.6rem',background:'rgba(62,140,90,0.2)',borderRadius:6,padding:'3px 8px',color:'#3E8C5A',fontWeight:700} }, '● AKTİF')
          )
        )
      ),

      aktifSekme === 'bu_hafta' && React.createElement('div', null,
        React.createElement('div', { style:{fontSize:'0.65rem',color:G,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8} }, '📅 Bu Haftanın Etkinlikleri'),
        buHaftaEtkinlikler.filter(e => !e.aktif).map(e =>
          React.createElement('div', { key:e.ad+e.gun, style:{display:'flex',alignItems:'center',gap:10,background:'rgba(27,33,43,0.7)',border:`1px solid ${e.renk}22`,borderLeft:`3px solid ${e.renk}`,borderRadius:10,padding:'10px 12px',marginBottom:6} },
            React.createElement('span', { style:{fontSize:'1.2rem'} }, e.emoji),
            React.createElement('div', { style:{flex:1,minWidth:0} },
              React.createElement('div', { style:{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'} },
                React.createElement('span', { style:{fontSize:'0.8rem',fontWeight:700,color:T} }, e.ad),
                React.createElement('span', { style:{fontSize:'0.58rem',background:`${e.renk}22`,border:`1px solid ${e.renk}44`,borderRadius:4,padding:'1px 6px',color:e.renk,fontWeight:700} }, TIP_ETIKET[e.tip]||e.tip)
              ),
              React.createElement('div', { style:{fontSize:'0.62rem',color:M,marginTop:2} }, e.acik)
            ),
            React.createElement('div', { style:{textAlign:'right',flexShrink:0} },
              React.createElement('div', { style:{fontSize:'0.6rem',color:M} }, HAFTA_GUNLERI[e.gun]),
              React.createElement('div', { style:{fontSize:'0.68rem',fontWeight:700,color:G} }, e.saat),
              React.createElement('div', { style:{fontSize:'0.58rem',color:M} }, kalanSure(e.hedefTarih))
            )
          )
        )
      ),

      aktifSekme === 'ozel' && React.createElement('div', null,
        React.createElement('div', { style:{fontSize:'0.65rem',color:G,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8} }, '✨ Yaklaşan Özel Etkinlikler'),
        OZEL_ETKINLIKLER.map(e =>
          React.createElement('div', { key:e.ad, style:{background:'rgba(27,33,43,0.7)',border:`1px solid ${e.renk}33`,borderLeft:`3px solid ${e.renk}`,borderRadius:12,padding:'14px',marginBottom:10} },
            React.createElement('div', { style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6} },
              React.createElement('div', { style:{display:'flex',alignItems:'center',gap:8} },
                React.createElement('span', { style:{fontSize:'1.5rem'} }, e.emoji),
                React.createElement('span', { style:{fontFamily:"'Cinzel',serif",fontSize:'0.9rem',fontWeight:800,color:T} }, e.ad)
              ),
              React.createElement('div', { style:{background:`${e.renk}22`,border:`1px solid ${e.renk}44`,borderRadius:8,padding:'4px 10px',textAlign:'center'} },
                React.createElement('div', { style:{fontSize:'0.58rem',color:M} }, 'Kalan'),
                React.createElement('div', { style:{fontSize:'0.82rem',fontWeight:900,color:e.renk,fontFamily:"'JetBrains Mono',monospace"} }, `${e.gunKalan}g`)
              )
            ),
            React.createElement('div', { style:{fontSize:'0.7rem',color:M,lineHeight:1.5} }, e.acik)
          )
        )
      ),

      aktifSekme === 'plan' && React.createElement('div', null,
        React.createElement('div', { style:{fontSize:'0.65rem',color:G,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8} }, '🗓️ Haftalık Plan'),
        HaftalikIzgara(),
        React.createElement('div', { style:{marginTop:12,display:'flex',flexWrap:'wrap',gap:6} },
          Object.entries(TIP_ETIKET).map(([tip,lb]) =>
            React.createElement('div', { key:tip, style:{display:'flex',alignItems:'center',gap:4,fontSize:'0.62rem',color:M} },
              React.createElement('div', { style:{width:10,height:10,borderRadius:2,background:TIP_RENK[tip]} }),
              lb
            )
          )
        )
      )
    )
  );
};
