// Lonca Turnuvası Ekranı (Haftalık)
window.TurnuvaEkraniScreen = function TurnuvaEkraniScreen({ profile, token }) {
  const [tourney, setTourney] = React.useState(null);
  const [entries, setEntries] = React.useState([]);
  const [guildName, setGuildName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState({ text:'', ok:true });
  const [tab, setTab] = React.useState('sirala');

  const ds = { bg:'#0D1117', surface:'rgba(255,255,255,0.04)', gold:'#C9A227', border:'rgba(255,255,255,0.08)', text:'#EDE7DA', muted:'#8893A1', red:'#FF6B6B', green:'#4CAF50' };

  const fetchData = async () => {
    try {
      const r = await fetch('/api/tournament/leaderboard', { headers:{'Authorization':'Bearer '+token} });
      const d = await r.json();
      if (d.success) { setEntries(d.entries); }
      const cr = await fetch('/api/tournament/current', { headers:{'Authorization':'Bearer '+token} });
      const cd = await cr.json();
      if (cd.success) setTourney(cd.tournament);
    } catch {}
  };

  React.useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 20000);
    if (window._socket) window._socket.on('tournament:register', fetchData);
    return () => { clearInterval(iv); if(window._socket) window._socket.off('tournament:register'); };
  }, []);

  const show = (text, ok=true) => { setMsg({ text, ok }); setTimeout(() => setMsg({ text:'', ok:true }), 3000); };

  const register = async () => {
    if (!guildName.trim()) return show('Lonca adı gir', false);
    setLoading(true);
    try {
      const r = await fetch('/api/tournament/register', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: JSON.stringify({ guildId: profile?.id + '_guild', guildName: guildName.trim() })
      });
      const d = await r.json();
      if (d.success) { show('✅ Turnuvaya kayıt oldun!'); fetchData(); }
      else show(d.message || 'Hata', false);
    } catch { show('Hata', false); }
    setLoading(false);
  };

  const weekDaysLeft = () => {
    const now = new Date();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() + (7 - now.getDay()) % 7);
    sunday.setHours(23,59,59,999);
    const diff = sunday - now;
    const d = Math.floor(diff/86400000), h = Math.floor((diff%86400000)/3600000);
    return `${d}g ${h}s`;
  };

  const medalEmoji = (i) => ['🥇','🥈','🥉'][i] || `${i+1}.`;

  return React.createElement('div', { style:{ minHeight:'100vh', background:ds.bg, padding:'1rem', paddingBottom:'5rem', color:ds.text }},
    // Header
    React.createElement('div', { style:{ background:`linear-gradient(135deg, rgba(201,162,39,0.15), transparent)`, border:`1px solid rgba(201,162,39,0.25)`, borderRadius:'14px', padding:'14px', marginBottom:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }},
      React.createElement('div', null,
        React.createElement('div', { style:{ fontWeight:900, fontSize:'1.1rem', color:ds.gold }}, '🏆 Haftalık Lonca Ligi'),
        React.createElement('div', { style:{ fontSize:'0.78rem', color:ds.muted, marginTop:'2px' }}, 'Her Pazartesi sıfırlanır · 8 Lonca yarışır')
      ),
      React.createElement('div', { style:{ textAlign:'right' }},
        React.createElement('div', { style:{ fontSize:'0.75rem', color:ds.muted }}, 'Bitiş'),
        React.createElement('div', { style:{ fontWeight:700, color:ds.gold }}, weekDaysLeft())
      )
    ),

    msg.text && React.createElement('div', { style:{ background: msg.ok ? 'rgba(201,162,39,0.1)' : 'rgba(255,80,80,0.1)', border:`1px solid ${msg.ok ? ds.gold : ds.red}`, borderRadius:'8px', padding:'10px 14px', marginBottom:'1rem', fontSize:'0.82rem', color: msg.ok ? ds.gold : ds.red }}, msg.text),

    React.createElement('div', { style:{ display:'flex', gap:'8px', marginBottom:'1rem' }},
      ['sirala','kayit'].map(t =>
        React.createElement('button', { key:t, onClick:()=>setTab(t),
          style:{ flex:1, padding:'8px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.85rem',
            background: tab===t ? ds.gold : ds.surface, color: tab===t ? '#000' : ds.muted }},
          t==='sirala' ? '🏆 Sıralama' : '📝 Kayıt Ol'
        )
      )
    ),

    tab === 'sirala' && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'8px' }},
      !entries.length && React.createElement('div', { style:{ textAlign:'center', padding:'3rem', color:ds.muted }}, '🏆 Henüz kayıtlı lonca yok.'),
      entries.map((e, i) =>
        React.createElement('div', { key:e.id,
          style:{ background: i===0 ? 'rgba(201,162,39,0.08)' : ds.surface, border:`1px solid ${i===0 ? 'rgba(201,162,39,0.3)' : ds.border}`, borderRadius:'12px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'10px' }},
          React.createElement('div', { style:{ fontSize:'1.5rem', minWidth:'32px', textAlign:'center' }}, medalEmoji(i)),
          React.createElement('div', { style:{ flex:1 }},
            React.createElement('div', { style:{ fontWeight:700 }}, e.guild_name),
            React.createElement('div', { style:{ fontSize:'0.75rem', color:ds.muted }}, `${e.wins||0} galibiyet · ${e.losses||0} mağlubiyet`)
          ),
          React.createElement('div', { style:{ textAlign:'right' }},
            React.createElement('div', { style:{ fontWeight:900, fontSize:'1.1rem', color:ds.gold }}, e.score || 0),
            React.createElement('div', { style:{ fontSize:'0.7rem', color:ds.muted }}, 'puan')
          )
        )
      ),
      React.createElement('div', { style:{ background:'rgba(201,162,39,0.05)', border:`1px solid rgba(201,162,39,0.15)`, borderRadius:'10px', padding:'12px', marginTop:'8px' }},
        React.createElement('div', { style:{ fontWeight:700, marginBottom:'6px', color:ds.gold }}, '🎁 Sezon Ödülleri'),
        ['🥇 1. — 5,000 🪙 + Şampiyon Lonca rozeti', '🥈 2. — 2,500 🪙 + Gümüş Lonca rozeti', '🥉 3. — 1,000 🪙 + Bronz Lonca rozeti'].map((r,i) =>
          React.createElement('div', { key:i, style:{ fontSize:'0.8rem', color:ds.muted, marginBottom:'3px' }}, r)
        )
      )
    ),

    tab === 'kayit' && React.createElement('div', { style:{ background:ds.surface, border:`1px solid ${ds.border}`, borderRadius:'12px', padding:'16px' }},
      React.createElement('div', { style:{ fontWeight:700, marginBottom:'12px' }}, '📝 Turnuvaya Kayıt'),
      React.createElement('input', {
        value:guildName, onChange:e=>setGuildName(e.target.value),
        placeholder:'Lonca adı...',
        style:{ width:'100%', padding:'10px', borderRadius:'8px', background:'rgba(255,255,255,0.06)', border:`1px solid ${ds.border}`, color:ds.text, fontSize:'0.85rem', boxSizing:'border-box', marginBottom:'10px' }
      }),
      React.createElement('button', { onClick:register, disabled:loading,
        style:{ width:'100%', padding:'10px', borderRadius:'10px', border:'none', cursor:'pointer', fontWeight:700, background:ds.gold, color:'#000' }},
        loading ? '⏳ Kaydediliyor...' : '🏆 Turnuvaya Katıl'
      ),
      React.createElement('div', { style:{ fontSize:'0.75rem', color:ds.muted, marginTop:'10px', lineHeight:1.5 }},
        '• Turnuva her Pazartesi başlar, Pazar biter.\n• 8 Lonca bracket sistemle yarışır.\n• Savaş galibiyetleri puan kazandırır.\n• Kazanan Lonca "Şampiyon" rozeti alır.'
      )
    )
  );
};
