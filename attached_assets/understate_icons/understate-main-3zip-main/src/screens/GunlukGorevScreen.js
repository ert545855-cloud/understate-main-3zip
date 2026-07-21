// ═══════════════════════════════════════════════════════════════
// SALTANAT ONLINE — Günlük Görev Paneli (hızlı özet)
// ═══════════════════════════════════════════════════════════════
window.GunlukGorevScreen = function GunlukGorevScreen({ profile, onNavigate, showNotif }) {
  const G='#C89B3C', BG='#0F0800', T='#F5EBD7', M='#A9A6A0', S='#2D1800', GR='#3E8C5A', R='#B8423C';

  // Görevler localStorage'dan okun / hesapla
  const [gorevler, setGorevler] = React.useState([]);
  const [streak,   setStreak]   = React.useState(0);

  React.useEffect(() => {
    const todayKey = new Date().toISOString().split('T')[0];
    const raw = (() => { try { return JSON.parse(localStorage.getItem('rep_gunlukGorev')||'{}'); } catch { return {}; } })();

    // Bugüne ait görevler yoksa sıfırla
    if (raw.date !== todayKey) {
      const yeni = {
        date: todayKey,
        gorevler: GOREV_HAVUZU.slice(0,5).map(g => ({ ...g, tamamlandi: false }))
      };
      localStorage.setItem('rep_gunlukGorev', JSON.stringify(yeni));
      setGorevler(yeni.gorevler);
    } else {
      setGorevler(raw.gorevler || []);
    }

    // Streak hesapla
    const streakRaw = (() => { try { return JSON.parse(localStorage.getItem('rep_loginStreak')||'{}'); } catch { return {}; } })();
    const lastLogin = streakRaw.lastLogin;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now()-86400000).toISOString().split('T')[0];
    if (lastLogin === today) {
      setStreak(streakRaw.count || 1);
    } else if (lastLogin === yesterday) {
      const newCount = (streakRaw.count || 0) + 1;
      localStorage.setItem('rep_loginStreak', JSON.stringify({ lastLogin: today, count: newCount }));
      setStreak(newCount);
    } else {
      localStorage.setItem('rep_loginStreak', JSON.stringify({ lastLogin: today, count: 1 }));
      setStreak(1);
    }
  }, []);

  const tamamla = (id) => {
    const todayKey = new Date().toISOString().split('T')[0];
    const raw = (() => { try { return JSON.parse(localStorage.getItem('rep_gunlukGorev')||'{}'); } catch { return {}; } })();
    if (!raw.gorevler) return;
    const updated = raw.gorevler.map(g => g.id === id ? { ...g, tamamlandi: true } : g);
    const yeni = { ...raw, gorevler: updated };
    localStorage.setItem('rep_gunlukGorev', JSON.stringify(yeni));
    setGorevler(updated);
    const gorev = updated.find(g => g.id === id);
    showNotif && showNotif(`✅ ${gorev?.label} tamamlandı!`, 'success');
  };

  const tamamlandi = gorevler.filter(g => g.tamamlandi).length;
  const toplam     = gorevler.length;
  const pct        = toplam > 0 ? Math.round(tamamlandi / toplam * 100) : 0;

  const STREAK_RENK = streak >= 7 ? '#A78BFA' : streak >= 3 ? G : GR;

  return React.createElement('div', { style:{ minHeight:'100vh', background:BG, fontFamily:"'Inter',sans-serif", paddingBottom:80 }},

    // Header
    React.createElement('div', { style:{ background:'linear-gradient(135deg,#0f0800,#2a1500)', borderBottom:'1px solid rgba(200,155,60,0.2)', padding:'14px 16px' }},
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:10 }},
        onNavigate && React.createElement('button', { onClick:()=>onNavigate('home'),
          style:{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'6px 10px', color:M, fontSize:'0.75rem', cursor:'pointer' }}, '← Geri'),
        React.createElement('span', { style:{ fontSize:'1.5rem' }}, '📋'),
        React.createElement('div', null,
          React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontWeight:900, fontSize:'1.1rem', color:G }}, 'Günlük Görevler'),
          React.createElement('div', { style:{ fontSize:'0.62rem', color:M }},
            `${tamamlandi}/${toplam} tamamlandı`)
        )
      )
    ),

    React.createElement('div', { style:{ padding:'12px' }},

      // Streak kartı
      React.createElement('div', { style:{ background:S, borderRadius:14, padding:'14px', marginBottom:12, border:`1px solid ${STREAK_RENK}33`,
        boxShadow:`0 0 20px ${STREAK_RENK}15` }},
        React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between' }},
          React.createElement('div', null,
            React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'0.85rem', fontWeight:800, color:STREAK_RENK }}, '🔥 Giriş Serisi'),
            React.createElement('div', { style:{ fontSize:'0.68rem', color:M, marginTop:2 }},
              streak >= 7 ? 'Muhteşem! 7+ gün seri' : streak >= 3 ? '3+ gün devam ediyor' : 'Seriyi büyüt!')),
          React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'2rem', fontWeight:900, color:STREAK_RENK }}, `${streak}`)
        ),
        React.createElement('div', { style:{ marginTop:10 }},
          React.createElement('div', { style:{ display:'flex', gap:4 }},
            [1,2,3,4,5,6,7].map(d =>
              React.createElement('div', { key:d, style:{
                flex:1, height:6, borderRadius:3,
                background: d <= streak ? STREAK_RENK : 'rgba(255,255,255,0.08)',
                transition:'background 0.3s'
              }})
            )
          ),
          React.createElement('div', { style:{ fontSize:'0.6rem', color:M, marginTop:4 }}, 'Hedef: 7 gün seri')
        )
      ),

      // İlerleme
      React.createElement('div', { style:{ background:S, borderRadius:14, padding:'14px', marginBottom:12, border:'1px solid rgba(200,155,60,0.15)' }},
        React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }},
          React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'0.82rem', color:G }}, `📊 Bugünkü İlerleme`),
          React.createElement('div', { style:{ fontSize:'0.9rem', fontWeight:800, color:pct===100?GR:G }}, `%${pct}`)
        ),
        React.createElement('div', { style:{ height:10, background:'rgba(255,255,255,0.06)', borderRadius:5, overflow:'hidden' }},
          React.createElement('div', { style:{ height:'100%', width:`${pct}%`, borderRadius:5, transition:'width 0.6s ease',
            background: pct===100 ? `linear-gradient(90deg,${GR},#4CAF7A)` : `linear-gradient(90deg,${G},#E8C06A)` }})
        ),
        pct === 100 && React.createElement('div', { style:{ textAlign:'center', marginTop:8, color:GR, fontSize:'0.8rem', fontWeight:700 }},
          '🎉 Tüm görevler tamamlandı! Yarın yenilenir.')
      ),

      // Görev listesi
      React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'0.75rem', color:G, fontWeight:700, marginBottom:8 }}, '📜 Görevler'),
      gorevler.map(g =>
        React.createElement('div', { key:g.id, style:{
          background: g.tamamlandi ? GR+'10' : S,
          border:`1px solid ${g.tamamlandi ? GR+'33' : 'rgba(200,155,60,0.15)'}`,
          borderLeft:`3px solid ${g.tamamlandi ? GR : G}`,
          borderRadius:12, padding:'12px 14px', marginBottom:8,
          display:'flex', alignItems:'center', gap:12,
          opacity: g.tamamlandi ? 0.75 : 1
        }},
          React.createElement('span', { style:{ fontSize:'1.5rem', flexShrink:0 }}, g.emoji),
          React.createElement('div', { style:{ flex:1 }},
            React.createElement('div', { style:{ fontWeight:700, fontSize:'0.85rem', color: g.tamamlandi ? M : T,
              textDecoration: g.tamamlandi ? 'line-through' : 'none' }}, g.label),
            React.createElement('div', { style:{ display:'flex', gap:8, marginTop:3 }},
              React.createElement('span', { style:{ fontSize:'0.62rem', color:G }}, `🪙${g.odul_sikke}`),
              React.createElement('span', { style:{ fontSize:'0.62rem', color:'#60A5FA' }}, `⭐${g.odul_xp} XP`)
            )
          ),
          g.tamamlandi
            ? React.createElement('span', { style:{ fontSize:'1.2rem' }}, '✅')
            : React.createElement('button', { onClick:()=>tamamla(g.id),
                style:{ padding:'7px 14px', borderRadius:8, border:'none', background:G, color:'#0F0800',
                  fontWeight:700, fontSize:'0.72rem', cursor:'pointer', flexShrink:0 }}, 'Tamamla')
        )
      )
    )
  );
};

const GOREV_HAVUZU = [
  { id:'g1', emoji:'💼', label:'İşe git ve çalış',         odul_sikke:500,  odul_xp:50  },
  { id:'g2', emoji:'🏭', label:'Atölyede üretim yap',       odul_sikke:300,  odul_xp:40  },
  { id:'g3', emoji:'📰', label:'Gazeteyi oku',               odul_sikke:100,  odul_xp:20  },
  { id:'g4', emoji:'🤝', label:'Bir oyuncuya mesaj gönder', odul_sikke:200,  odul_xp:30  },
  { id:'g5', emoji:'⭐', label:'Liderlik tablosunu kontrol et', odul_sikke:150, odul_xp:25 },
  { id:'g6', emoji:'🎡', label:'Fal çarkını çevir',         odul_sikke:200,  odul_xp:30  },
  { id:'g7', emoji:'🗺️', label:'Haritaya bak',              odul_sikke:100,  odul_xp:15  },
];
