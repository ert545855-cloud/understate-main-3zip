// Bölge Hakimiyet Savaşı Ekranı — Warm Ottoman v11 tasarımı
window.BolgeSavasiScreen = function BolgeSavasiScreen({ profile, token }) {
  const [regions, setRegions] = React.useState([]);
  const [myAttacks, setMyAttacks] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const [tab, setTab] = React.useState('harita'); // harita | vergi

  const BOLGE_DATA = [
    { id:'karadeniz',  name:'Karadeniz Bölgesi',  emoji:'🌊', income:400 },
    { id:'ege',        name:'Ege Bölgesi',         emoji:'🏛️', income:350 },
    { id:'marmara',    name:'Marmara Bölgesi',     emoji:'⚓', income:500 },
    { id:'ic_anadolu', name:'İç Anadolu',          emoji:'🌾', income:300 },
    { id:'dogu_anadolu',name:'Doğu Anadolu',       emoji:'🏔️', income:250 },
    { id:'guneydogu',  name:'Güneydoğu Anadolu',  emoji:'🌅', income:280 },
    { id:'akdeniz',    name:'Akdeniz Bölgesi',     emoji:'☀️', income:380 },
  ];

  const fetchRegions = async () => {
    try {
      const r = await fetch('/api/region/list', { headers:{'Authorization':'Bearer '+token} });
      const d = await r.json();
      if (d.success) {
        const map = {};
        d.regions.forEach(r => { map[r.region_id] = r; });
        setRegions(map);
      }
    } catch {}
  };

  React.useEffect(() => {
    fetchRegions();
    const interval = setInterval(fetchRegions, 15000);
    // Socket
    if (window._socket) {
      window._socket.on('region:update', ({ regionId, control }) => {
        setRegions(prev => ({ ...prev, [regionId]: control }));
      });
    }
    return () => { clearInterval(interval); if(window._socket) window._socket.off('region:update'); };
  }, []);

  const attack = async (regionId) => {
    if (loading) return;
    setLoading(true);
    try {
      const r = await fetch('/api/region/attack', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: JSON.stringify({ regionId })
      });
      const d = await r.json();
      if (d.success) {
        setMsg(`⚔️ Saldırı başarılı! Güç: ${d.power}. ${d.control?.controller_name === profile?.username ? '🏆 Bölge sende!' : ''}`);
        setMyAttacks(prev => ({ ...prev, [regionId]: (prev[regionId]||0)+1 }));
        if (d.control) setRegions(prev => ({ ...prev, [regionId]: d.control }));
      } else setMsg(d.message || 'Hata');
    } catch { setMsg('Sunucu hatası'); }
    setLoading(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const collectTax = async () => {
    try {
      const r = await fetch('/api/region/collect-tax', { method:'POST', headers:{'Authorization':'Bearer '+token} });
      const d = await r.json();
      setMsg(d.success ? `💰 ${d.collected} 🪙 vergi toplandı! (${d.regionCount} bölge)` : d.message);
    } catch { setMsg('Hata'); }
    setTimeout(() => setMsg(''), 3000);
  };

  const ds = { gold:'var(--accent)', goldLight:'var(--accent-light)', border:'var(--border)', text:'var(--text)', muted:'var(--text-muted)', red:'var(--red)' };
  const myRegionCount = BOLGE_DATA.filter(b => regions[b.id]?.controller_id === profile?.id).length;

  return React.createElement('div', { style:{ minHeight:'100vh', padding:'1rem', paddingBottom:'5rem', color:ds.text } },
    React.createElement('div', { className:'war-tabs' },
      ['harita','vergi'].map(t =>
        React.createElement('button', { key:t, onClick:()=>setTab(t), className:`war-tab${tab===t ? ' active' : ''}` },
          t === 'harita' ? '🗺️ Bölge Haritası' : '💰 Vergi Topla'
        )
      )
    ),

    msg && React.createElement('div', { style:{ background:'rgba(200,155,60,0.12)', border:`1px solid ${ds.gold}`, borderRadius:'10px', padding:'10px 14px', marginBottom:'1rem', fontSize:'0.85rem', color:ds.goldLight }}, msg),

    tab === 'harita' && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'10px' } },
      React.createElement('p', { style:{ fontSize:'0.8rem', color:ds.muted, margin:'0 0 4px' }},
        '⚔️ Bölgelere saldırarak kontrolü ele geçir. En çok saldıran bu haftayı kazanır ve günlük vergi alır.'
      ),
      BOLGE_DATA.map(b => {
        const ctrl = regions[b.id];
        const isMine = ctrl?.controller_id === profile?.id;
        return React.createElement('div', { key:b.id, className:`region-card${isMine ? ' mine' : ''}` },
          React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }},
            React.createElement('div', { className:'region-emoji' }, b.emoji),
            React.createElement('div', { style:{ flex:1, minWidth:0 }},
              React.createElement('div', { style:{ fontWeight:700, fontSize:'0.9rem', fontFamily:"'Cinzel',serif" }}, b.name),
              React.createElement('div', { style:{ fontSize:'0.72rem', color: isMine ? ds.goldLight : ds.muted, marginTop:'2px' }},
                ctrl ? `🏴 ${ctrl.controller_name} (${ctrl.attack_count} saldırı)` : '🏳️ Sahipsiz'
              )
            ),
            React.createElement('div', { style:{ textAlign:'right', flexShrink:0 }},
              React.createElement('div', { style:{ fontSize:'0.78rem', color:ds.goldLight, fontWeight:700 }}, `💰 ${b.income} 🪙/gün`),
              myAttacks[b.id] && React.createElement('div', { style:{ fontSize:'0.68rem', color:ds.muted, marginTop:'2px' }}, `Senin saldırın: ${myAttacks[b.id]}`)
            )
          ),
          React.createElement('button', {
            className:`war-btn ${isMine ? 'resolve' : 'attack'}`, onClick:()=>attack(b.id), disabled:loading, style:{ width:'100%' }},
            loading ? '⚔️ Saldırılıyor...' : isMine ? '🛡️ Savun / Güçlendir' : '⚔️ Saldır'
          )
        );
      })
    ),

    tab === 'vergi' && React.createElement('div', null,
      React.createElement('p', { style:{ fontSize:'0.85rem', color:ds.muted, marginBottom:'1rem' }},
        'Kontrol ettiğin bölgelerden her 24 saatte bir vergi toplayabilirsin.'
      ),
      React.createElement('div', { className:'war-card', style:{ padding:'24px 20px', textAlign:'center' }},
        React.createElement('div', { style:{ fontSize:'2.2rem', marginBottom:'8px' }}, '💰'),
        React.createElement('div', { style:{ fontWeight:700, marginBottom:'4px', fontFamily:"'Cinzel',serif", color:ds.goldLight, letterSpacing:'1px' }}, 'Bölge Vergisi'),
        React.createElement('div', { style:{ fontSize:'0.8rem', color:ds.muted, marginBottom:'16px' }},
          `Sahip olduğun bölge sayısı: ${myRegionCount}`
        ),
        React.createElement('button', { className:'war-btn resolve', onClick:collectTax, style:{ width:'auto', padding:'10px 28px' }},
          '💰 Vergileri Topla'
        )
      )
    )
  );
};
