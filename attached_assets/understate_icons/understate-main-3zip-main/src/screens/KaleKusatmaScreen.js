// Kale Kuşatma Ekranı
window.KaleKusatmaScreen = function KaleKusatmaScreen({ profile, token }) {
  const [castles, setCastles] = React.useState([]);
  const [activeSieges, setActiveSieges] = React.useState([]);
  const [loading, setLoading] = React.useState('');
  const [msg, setMsg] = React.useState('');
  const [tab, setTab] = React.useState('kaleler');

  const ds = { bg:'#0D1117', surface:'rgba(255,255,255,0.04)', gold:'#C9A227', border:'rgba(255,255,255,0.08)', text:'#EDE7DA', muted:'#8893A1', red:'#FF6B6B', green:'#4CAF50' };

  const fetchData = async () => {
    try {
      const [cr, sr] = await Promise.all([
        fetch('/api/siege/castles', { headers:{'Authorization':'Bearer '+token} }),
        fetch('/api/siege/active',  { headers:{'Authorization':'Bearer '+token} }),
      ]);
      const [cd, sd] = await Promise.all([cr.json(), sr.json()]);
      if (cd.success) setCastles(cd.castles);
      if (sd.success) setActiveSieges(sd.sieges);
    } catch {}
  };

  React.useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    if (window._socket) {
      window._socket.on('siege:started', fetchData);
      window._socket.on('siege:join', fetchData);
      window._socket.on('siege:resolved', fetchData);
    }
    return () => {
      clearInterval(interval);
      if (window._socket) {
        window._socket.off('siege:started');
        window._socket.off('siege:join');
        window._socket.off('siege:resolved');
      }
    };
  }, []);

  const startSiege = async (castleId) => {
    setLoading(castleId);
    try {
      const r = await fetch('/api/siege/start', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: JSON.stringify({ castleId })
      });
      const d = await r.json();
      setMsg(d.success ? `🏰 Kuşatma başladı! 30 dakika içinde karar verilecek.` : d.message || 'Hata');
      if (d.success) fetchData();
    } catch { setMsg('Hata'); }
    setLoading('');
    setTimeout(() => setMsg(''), 4000);
  };

  const joinSiege = async (siegeId, side) => {
    setLoading(`${siegeId}-${side}`);
    try {
      const r = await fetch('/api/siege/join', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: JSON.stringify({ siegeId, side })
      });
      const d = await r.json();
      setMsg(d.success ? `✅ ${side === 'attacker' ? 'Saldıran' : 'Savunan'} tarafa katıldın!` : d.message || 'Hata');
      if (d.success) fetchData();
    } catch { setMsg('Hata'); }
    setLoading('');
    setTimeout(() => setMsg(''), 3000);
  };

  const resolveSiege = async (siegeId) => {
    try {
      const r = await fetch(`/api/siege/resolve/${siegeId}`, {
        method:'POST', headers:{'Authorization':'Bearer '+token}
      });
      const d = await r.json();
      setMsg(d.success ? (d.attackerWins ? '🏆 Saldıranlar kazandı! +%20 üretim bonusu 24 saat aktif.' : '🛡️ Savunanlar kazandı!') : d.message);
      if (d.success) fetchData();
    } catch {}
    setTimeout(() => setMsg(''), 4000);
  };

  const timeLeft = (endsAt) => {
    const diff = new Date(endsAt) - new Date();
    if (diff <= 0) return 'Süresi doldu';
    const m = Math.floor(diff / 60000), s = Math.floor((diff % 60000) / 1000);
    return `${m}:${s.toString().padStart(2,'0')}`;
  };

  return React.createElement('div', { style:{ minHeight:'100vh', background:ds.bg, padding:'1rem', paddingBottom:'5rem', color:ds.text }},
    React.createElement('div', { style:{ display:'flex', gap:'8px', marginBottom:'1rem' }},
      ['kaleler','aktif'].map(t =>
        React.createElement('button', { key:t, onClick:()=>setTab(t),
          style:{ flex:1, padding:'8px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.85rem',
            background: tab===t ? ds.gold : ds.surface, color: tab===t ? '#000' : ds.muted }},
          t === 'kaleler' ? '🏰 Kaleler' : `⚔️ Aktif Kuşatmalar (${activeSieges.length})`
        )
      )
    ),

    msg && React.createElement('div', { style:{ background:'rgba(201,162,39,0.12)', border:`1px solid ${ds.gold}`, borderRadius:'8px', padding:'10px 14px', marginBottom:'1rem', fontSize:'0.85rem', color:ds.gold }}, msg),

    tab === 'kaleler' && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'10px' }},
      React.createElement('p', { style:{ fontSize:'0.78rem', color:ds.muted, margin:'0 0 4px' }}, '🏰 Bir kaleye saldır, 30 dakika içinde en fazla güç toplayan taraf kazanır.'),
      castles.map(c => {
        const siege = c.activeSiege;
        return React.createElement('div', { key:c.id,
          style:{ background:ds.surface, border:`1px solid ${siege ? 'rgba(255,100,100,0.3)' : ds.border}`, borderRadius:'12px', padding:'14px' }},
          React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }},
            React.createElement('div', null,
              React.createElement('div', { style:{ fontWeight:700, fontSize:'0.95rem' }}, `🏰 ${c.name}`),
              React.createElement('div', { style:{ fontSize:'0.75rem', color:ds.muted }}, `Savunma: ${c.defense}`)
            ),
            siege ? React.createElement('span', { style:{ fontSize:'0.75rem', background:'rgba(255,100,100,0.15)', color:ds.red, padding:'3px 8px', borderRadius:'6px', border:`1px solid rgba(255,100,100,0.3)` }}, `⚔️ Kuşatma Altında`) : null
          ),
          siege ? React.createElement('div', null,
            React.createElement('div', { style:{ display:'flex', gap:'8px', marginBottom:'8px' }},
              React.createElement('div', { style:{ flex:1, background:'rgba(255,100,100,0.08)', borderRadius:'8px', padding:'8px', textAlign:'center' }},
                React.createElement('div', { style:{ fontSize:'0.7rem', color:ds.muted }}, '⚔️ Saldıranlar'),
                React.createElement('div', { style:{ fontWeight:700, color:ds.red }}, siege.attacker_power || 0)
              ),
              React.createElement('div', { style:{ flex:1, background:'rgba(100,200,100,0.08)', borderRadius:'8px', padding:'8px', textAlign:'center' }},
                React.createElement('div', { style:{ fontSize:'0.7rem', color:ds.muted }}, '🛡️ Savunanlar'),
                React.createElement('div', { style:{ fontWeight:700, color:ds.green }}, siege.defender_power || 0)
              )
            ),
            React.createElement('div', { style:{ fontSize:'0.75rem', color:ds.muted, marginBottom:'8px', textAlign:'center' }}, `⏱ ${timeLeft(siege.ends_at)}`),
            React.createElement('div', { style:{ display:'flex', gap:'6px' }},
              ['attacker','defender'].map(side =>
                React.createElement('button', { key:side, onClick:()=>joinSiege(siege.id, side),
                  disabled: loading === `${siege.id}-${side}`,
                  style:{ flex:1, padding:'8px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.78rem',
                    background: side==='attacker' ? 'rgba(255,80,80,0.15)' : 'rgba(80,200,80,0.15)',
                    color: side==='attacker' ? ds.red : ds.green }},
                  side==='attacker' ? '⚔️ Saldır' : '🛡️ Savun'
                )
              )
            ),
            new Date(siege.ends_at) <= new Date() && React.createElement('button', { onClick:()=>resolveSiege(siege.id),
              style:{ width:'100%', marginTop:'6px', padding:'8px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, background:ds.gold, color:'#000' }},
              '⚡ Sonucu Belirle'
            )
          ) : React.createElement('button', { onClick:()=>startSiege(c.id), disabled:loading===c.id,
            style:{ width:'100%', padding:'8px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, background:'rgba(255,80,80,0.15)', color:ds.red }},
            loading===c.id ? '⏳ Başlatılıyor...' : '⚔️ Kuşatma Başlat'
          )
        );
      })
    ),

    tab === 'aktif' && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'10px' }},
      !activeSieges.length && React.createElement('div', { style:{ textAlign:'center', padding:'3rem', color:ds.muted }}, '🏰 Şu an aktif kuşatma yok.'),
      activeSieges.map(s =>
        React.createElement('div', { key:s.id, style:{ background:ds.surface, border:`1px solid rgba(255,100,100,0.3)`, borderRadius:'12px', padding:'14px' }},
          React.createElement('div', { style:{ fontWeight:700, marginBottom:'6px' }}, `🏰 ${s.castle_name || s.castle_id}`),
          React.createElement('div', { style:{ display:'flex', gap:'8px', marginBottom:'6px' }},
            React.createElement('div', { style:{ flex:1, textAlign:'center', background:'rgba(255,80,80,0.08)', borderRadius:'8px', padding:'6px' }},
              React.createElement('div', { style:{ fontSize:'0.7rem', color:ds.muted }}, '⚔️ Saldıran Güç'),
              React.createElement('div', { style:{ fontWeight:700, color:ds.red }}, s.attacker_power)
            ),
            React.createElement('div', { style:{ flex:1, textAlign:'center', background:'rgba(80,200,80,0.08)', borderRadius:'8px', padding:'6px' }},
              React.createElement('div', { style:{ fontSize:'0.7rem', color:ds.muted }}, '🛡️ Savunan Güç'),
              React.createElement('div', { style:{ fontWeight:700, color:ds.green }}, s.defender_power)
            )
          ),
          React.createElement('div', { style:{ fontSize:'0.75rem', color:ds.muted, textAlign:'center' }}, `⏱ Bitiş: ${timeLeft(s.ends_at)}`)
        )
      )
    )
  );
};
