// Bölge Hakimiyet Savaşı Ekranı
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

  const ds = { bg:'#0D1117', surface:'rgba(255,255,255,0.04)', gold:'#C9A227', border:'rgba(255,255,255,0.08)', text:'#EDE7DA', muted:'#8893A1' };

  return React.createElement('div', { style:{ minHeight:'100vh', background:ds.bg, padding:'1rem', paddingBottom:'5rem', color:ds.text } },
    React.createElement('div', { style:{ display:'flex', gap:'8px', marginBottom:'1rem' } },
      ['harita','vergi'].map(t =>
        React.createElement('button', { key:t, onClick:()=>setTab(t),
          style:{ flex:1, padding:'8px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.85rem',
            background: tab===t ? ds.gold : ds.surface, color: tab===t ? '#000' : ds.muted }},
          t === 'harita' ? '🗺️ Bölge Haritası' : '💰 Vergi Topla'
        )
      )
    ),

    msg && React.createElement('div', { style:{ background:'rgba(201,162,39,0.15)', border:`1px solid ${ds.gold}`, borderRadius:'8px', padding:'10px 14px', marginBottom:'1rem', fontSize:'0.85rem', color:ds.gold }}, msg),

    tab === 'harita' && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'10px' } },
      React.createElement('p', { style:{ fontSize:'0.8rem', color:ds.muted, margin:'0 0 4px' }},
        '⚔️ Bölgelere saldırarak kontrolü ele geçir. En çok saldıran bu haftayı kazanır ve günlük vergi alır.'
      ),
      BOLGE_DATA.map(b => {
        const ctrl = regions[b.id];
        const isMine = ctrl?.controller_id === profile?.id;
        return React.createElement('div', { key:b.id,
          style:{ background: isMine ? 'rgba(201,162,39,0.1)' : ds.surface, border:`1px solid ${isMine ? ds.gold : ds.border}`, borderRadius:'12px', padding:'14px' }},
          React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }},
            React.createElement('div', null,
              React.createElement('div', { style:{ fontWeight:700, fontSize:'0.95rem' }}, `${b.emoji} ${b.name}`),
              React.createElement('div', { style:{ fontSize:'0.75rem', color:ds.muted, marginTop:'2px' }},
                ctrl ? `🏴 ${ctrl.controller_name} (${ctrl.attack_count} saldırı)` : '🏳️ Sahipsiz'
              )
            ),
            React.createElement('div', { style:{ textAlign:'right' }},
              React.createElement('div', { style:{ fontSize:'0.8rem', color:ds.gold }}, `💰 ${b.income} 🪙/gün`),
              myAttacks[b.id] && React.createElement('div', { style:{ fontSize:'0.7rem', color:ds.muted }}, `Senin saldırın: ${myAttacks[b.id]}`)
            )
          ),
          React.createElement('button', { onClick:()=>attack(b.id), disabled:loading,
            style:{ width:'100%', padding:'8px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.85rem',
              background: isMine ? 'rgba(201,162,39,0.2)' : 'rgba(255,60,60,0.15)', color: isMine ? ds.gold : '#FF6B6B' }},
            loading ? '⚔️ Saldırılıyor...' : isMine ? '⚔️ Savun / Güçlendir' : '⚔️ Saldır'
          )
        );
      })
    ),

    tab === 'vergi' && React.createElement('div', null,
      React.createElement('p', { style:{ fontSize:'0.85rem', color:ds.muted, marginBottom:'1rem' }},
        'Kontrol ettiğin bölgelerden her 24 saatte bir vergi toplayabilirsin.'
      ),
      React.createElement('div', { style:{ background:ds.surface, border:`1px solid ${ds.border}`, borderRadius:'12px', padding:'20px', textAlign:'center' }},
        React.createElement('div', { style:{ fontSize:'2rem', marginBottom:'8px' }}, '💰'),
        React.createElement('div', { style:{ fontWeight:700, marginBottom:'4px' }}, 'Bölge Vergisi'),
        React.createElement('div', { style:{ fontSize:'0.8rem', color:ds.muted, marginBottom:'16px' }},
          `Sahip olduğun bölge sayısı: ${BOLGE_DATA.filter(b => regions[b.id]?.controller_id === profile?.id).length}`
        ),
        React.createElement('button', { onClick:collectTax,
          style:{ padding:'10px 28px', borderRadius:'10px', border:'none', cursor:'pointer', fontWeight:700, background:ds.gold, color:'#000' }},
          '💰 Vergileri Topla'
        )
      )
    )
  );
};
