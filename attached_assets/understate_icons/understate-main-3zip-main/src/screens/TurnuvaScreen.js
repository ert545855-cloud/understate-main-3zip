"use strict";
// ═══════════════════════════════════════════════════════
// SALTANAT ONLINE — Turnuva Sistemi
// Gerçek zamanlı sıralamalar + ödül dağıtımı
// ═══════════════════════════════════════════════════════

const TURNUVA_TURLERI = [
  { id:'pvp',      emoji:'⚔️',  ad:'PvP Turnuvası',       acik:'Dövüş sayısı ve galibiyet oranı',      periyot:'Haftalık',  odul1:500000, odul2:200000, odul3:50000 },
  { id:'servet',   emoji:'💰',  ad:'Servet Yarışı',        acik:'En yüksek toplam servet',               periyot:'Haftalık',  odul1:300000, odul2:150000, odul3:50000 },
  { id:'sadakat',  emoji:'💎',  ad:'Sadakat Şampiyonası',  acik:'Bu hafta kazanılan sadakat puanı',      periyot:'Haftalık',  odul1:10000,  odul2:5000,   odul3:2000,  tip:'sadakat' },
  { id:'eyalet',   emoji:'🏰',  ad:'Fetih Turnuvası',      acik:'En fazla eyalet fetheden beylik',       periyot:'Aylık',     odul1:2000000,odul2:800000, odul3:200000 },
  { id:'ticaret',  emoji:'🛒',  ad:'Tüccar Kupası',        acik:'Pazar işlem hacmi',                     periyot:'Haftalık',  odul1:400000, odul2:180000, odul3:60000 },
  { id:'xp',       emoji:'⭐',  ad:'Bilge Yarışı',          acik:'Bu hafta kazanılan XP',                 periyot:'Günlük',    odul1:50000,  odul2:20000,  odul3:5000 },
];

const MADALYA_RENK = ['#FFD700','#C0C0C0','#CD7F32'];

window.TurnuvaScreen = function TurnuvaScreen({ profile, setProfile, showNotif, setCurrentPage, onlinePlayers }) {
  const [aktifTur, setAktifTur] = React.useState('pvp');
  const [sira, setSira] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [katilimlar, setKatilimlar] = React.useState(() => { try { return JSON.parse(localStorage.getItem('rep_turnuvaKatil')||'{}'); } catch { return {}; } });
  const [odulLog, setOdulLog] = React.useState(() => { try { return JSON.parse(localStorage.getItem('rep_odulLog')||'[]'); } catch { return []; } });

  const tur = TURNUVA_TURLERI.find(t => t.id === aktifTur) || TURNUVA_TURLERI[0];
  const uid = profile?.id || profile?.uid;

  // Sunucudan gerçek sıralama çek
  React.useEffect(() => {
    setLoading(true);
    const kategori = aktifTur === 'pvp' ? 'score' : aktifTur === 'servet' ? 'money' : aktifTur === 'sadakat' ? 'loyalty' : aktifTur === 'xp' ? 'level' : aktifTur === 'ticaret' ? 'traders' : 'score';
    const token = localStorage.getItem('us_jwt') || '';
    fetch(`/api/leaderboard/${kategori}?limit=20`, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json()).then(d => {
        const liste = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
        setSira(liste.map((u, i) => ({
          sira: i + 1,
          id: u.id || u.user_id,
          ad: u.username || u.name,
          deger: kategori === 'money' ? (u.money||0) : kategori === 'loyalty' ? (u.loyaltyPoints||u.loyalty_points||0) : kategori === 'level' ? (u.level||1) : (u.score||0),
          level: u.level || 1,
          emoji: kategori === 'money' ? '🪙' : kategori === 'loyalty' ? '💎' : kategori === 'level' ? '⭐' : '🏆',
        })));
      }).catch(() => setSira([])).finally(() => setLoading(false));
  }, [aktifTur]);

  // Socket — gerçek zamanlı sıralama güncellemeleri
  React.useEffect(() => {
    const s = window._socket;
    if (!s) return;
    const handler = (d) => { if (d.kategori === aktifTur) setSira(d.sira || []); };
    s.on('turnuvaSiraUpdate', handler);
    return () => s.off('turnuvaSiraUpdate', handler);
  }, [aktifTur]);

  function katil() {
    if (katilimlar[aktifTur]) { showNotif('Bu turnuvaya zaten katıldınız', 'error'); return; }
    const yeni = { ...katilimlar, [aktifTur]: { ts: Date.now(), kullanici: profile?.username } };
    setKatilimlar(yeni);
    localStorage.setItem('rep_turnuvaKatil', JSON.stringify(yeni));
    try { window._socket?.emit('turnuva:katil', { tur: aktifTur, userId: uid, username: profile?.username }); } catch(_) {}
    showNotif(`⚔️ ${tur.ad} turnuvasına katıldınız!`, 'success');
  }

  const kendi = sira.find(s => s.id === uid);
  const G='#C89B3C', BG='#0F0800', S='#2D1800', T='#F5EBD7', M='#A9A6A0';

  return React.createElement('div', { style:{minHeight:'100vh',background:BG,fontFamily:"'Inter',sans-serif",paddingBottom:90} },
    // Başlık
    React.createElement('div', { style:{background:'linear-gradient(135deg,#1a1000,#2d1e00)',borderBottom:'1px solid rgba(200,155,60,0.25)',padding:'14px 16px'} },
      React.createElement('div', { style:{display:'flex',alignItems:'center',gap:10,marginBottom:12} },
        React.createElement('button', { onClick:()=>setCurrentPage('home'), style:{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'6px 10px',color:M,fontSize:'0.75rem',cursor:'pointer'} }, '← Geri'),
        React.createElement('span', { style:{fontSize:'1.4rem'} }, '🏆'),
        React.createElement('div', null,
          React.createElement('div', { style:{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:'1.1rem',color:G} }, 'Turnuva Alanı'),
          React.createElement('div', { style:{fontSize:'0.62rem',color:M} }, 'Yarış — Fethet — Ödül Kazan')
        )
      ),
      // Tur seçimi
      React.createElement('div', { style:{display:'flex',gap:6,overflowX:'auto',paddingBottom:4} },
        TURNUVA_TURLERI.map(t =>
          React.createElement('button', { key:t.id, onClick:()=>setAktifTur(t.id),
            style:{flexShrink:0,padding:'6px 12px',borderRadius:20,border:`1px solid ${aktifTur===t.id?G:'rgba(255,255,255,0.1)'}`,background:aktifTur===t.id?'rgba(200,155,60,0.18)':'rgba(255,255,255,0.03)',color:aktifTur===t.id?G:M,fontSize:'0.7rem',fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'} },
            `${t.emoji} ${t.ad}`)
        )
      )
    ),

    React.createElement('div', { style:{padding:'12px'} },
      // Tur bilgi kartı
      React.createElement('div', { style:{background:'linear-gradient(135deg,rgba(200,155,60,0.12),rgba(45,24,0,0.95))',border:'1px solid rgba(200,155,60,0.3)',borderRadius:14,padding:'14px',marginBottom:14} },
        React.createElement('div', { style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start'} },
          React.createElement('div', null,
            React.createElement('div', { style:{fontFamily:"'Cinzel',serif",fontSize:'1rem',fontWeight:900,color:G,marginBottom:4} }, `${tur.emoji} ${tur.ad}`),
            React.createElement('div', { style:{fontSize:'0.7rem',color:M} }, tur.acik),
            React.createElement('div', { style:{fontSize:'0.65rem',color:'rgba(200,155,60,0.7)',marginTop:4} }, `📅 ${tur.periyot}`)
          ),
          React.createElement('button', { onClick:katil, style:{background:katilimlar[aktifTur]?'rgba(255,255,255,0.06)':G,border:`1px solid ${katilimlar[aktifTur]?'rgba(255,255,255,0.15)':G}`,borderRadius:10,padding:'8px 14px',color:katilimlar[aktifTur]?M:'#0F0800',fontWeight:800,fontSize:'0.72rem',cursor:katilimlar[aktifTur]?'default':'pointer'} },
            katilimlar[aktifTur] ? '✓ Katıldın' : 'Katıl')
        ),
        // Ödüller
        React.createElement('div', { style:{display:'flex',gap:6,marginTop:12} },
          [[1,tur.odul1,'🥇'],[2,tur.odul2,'🥈'],[3,tur.odul3,'🥉']].map(([rank,odul,ic]) =>
            React.createElement('div', { key:rank, style:{flex:1,background:'rgba(0,0,0,0.3)',borderRadius:8,padding:'6px',textAlign:'center',border:`1px solid ${MADALYA_RENK[rank-1]}33`} },
              React.createElement('div', { style:{fontSize:'1rem'} }, ic),
              React.createElement('div', { style:{fontSize:'0.6rem',color:MADALYA_RENK[rank-1],fontWeight:700,fontFamily:"'JetBrains Mono',monospace"} },
                tur.tip==='sadakat' ? `💎${odul.toLocaleString('tr-TR')}` : `🪙${odul.toLocaleString('tr-TR')}`)
            )
          )
        )
      ),

      // Kendi sıran
      kendi && React.createElement('div', { style:{background:'rgba(200,155,60,0.08)',border:'1px solid rgba(200,155,60,0.25)',borderRadius:10,padding:'10px 14px',marginBottom:12,display:'flex',alignItems:'center',justifyContent:'space-between'} },
        React.createElement('div', null,
          React.createElement('div', { style:{fontSize:'0.62rem',color:M} }, 'Senin sıran'),
          React.createElement('div', { style:{fontSize:'1.3rem',fontWeight:900,color:G,fontFamily:"'JetBrains Mono',monospace"} }, `#${kendi.sira}`)
        ),
        React.createElement('div', { style:{textAlign:'right'} },
          React.createElement('div', { style:{fontSize:'0.62rem',color:M} }, 'Puan'),
          React.createElement('div', { style:{fontSize:'0.9rem',fontWeight:700,color:T} }, `${kendi.emoji} ${(kendi.deger||0).toLocaleString('tr-TR')}`)
        )
      ),

      // Sıralama tablosu
      React.createElement('div', { style:{fontFamily:"'Cinzel',serif",fontSize:'0.75rem',color:G,fontWeight:700,marginBottom:8,padding:'0 2px'} }, '🏆 Sıralama'),
      loading
        ? React.createElement('div', { style:{textAlign:'center',padding:'40px',color:M} }, '⏳ Yükleniyor...')
        : sira.length === 0
          ? React.createElement('div', { style:{textAlign:'center',padding:'40px',color:M} }, 'Henüz katılımcı yok')
          : React.createElement('div', { style:{display:'flex',flexDirection:'column',gap:6} },
              sira.slice(0,20).map((oyuncu, i) => {
                const benim = oyuncu.id === uid;
                const madalya = i < 3 ? MADALYA_RENK[i] : null;
                return React.createElement('div', { key:oyuncu.id || i,
                  style:{display:'flex',alignItems:'center',gap:10,background:benim?'rgba(200,155,60,0.1)':'rgba(27,33,43,0.6)',border:`1px solid ${benim?'rgba(200,155,60,0.3)':madalya?madalya+'33':'rgba(255,255,255,0.06)'}`,borderRadius:10,padding:'8px 12px'} },
                  React.createElement('div', { style:{width:28,height:28,borderRadius:8,background:madalya?madalya+'22':'rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:madalya?'1rem':'0.75rem',fontWeight:900,color:madalya||M,flexShrink:0,fontFamily:"'JetBrains Mono',monospace"} },
                    i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}`),
                  React.createElement('div', { style:{flex:1,minWidth:0} },
                    React.createElement('div', { style:{fontSize:'0.8rem',fontWeight:700,color:benim?G:T,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'} }, oyuncu.ad),
                    React.createElement('div', { style:{fontSize:'0.6rem',color:M} }, `Lv.${oyuncu.level}`)
                  ),
                  React.createElement('div', { style:{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.78rem',fontWeight:800,color:madalya||G} },
                    `${oyuncu.emoji} ${(oyuncu.deger||0).toLocaleString('tr-TR')}`)
                );
              })
            )
    )
  );
};
