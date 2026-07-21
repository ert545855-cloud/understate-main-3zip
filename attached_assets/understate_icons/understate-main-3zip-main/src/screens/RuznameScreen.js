// Ruzname (Günlük) Ekranı
window.RuznameScreen = function RuznameScreen({ profile, token }) {
  const [tab, setTab] = React.useState('akis');
  const [entries, setEntries] = React.useState([]);
  const [mine, setMine] = React.useState([]);
  const [weekly, setWeekly] = React.useState([]);
  const [content, setContent] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState('');

  const ds = { bg:'#0D1117', surface:'rgba(255,255,255,0.04)', gold:'#C9A227', border:'rgba(255,255,255,0.08)', text:'#EDE7DA', muted:'#8893A1', green:'#4CAF50', red:'#FF6B6B' };

  const fetchAll = async () => {
    try {
      const [er, mr, wr] = await Promise.all([
        fetch('/api/rp/ruzname',             { headers:{'Authorization':'Bearer '+token} }),
        fetch('/api/rp/ruzname/mine',        { headers:{'Authorization':'Bearer '+token} }),
        fetch('/api/rp/ruzname/weekly-top',  { headers:{'Authorization':'Bearer '+token} }),
      ]);
      const [ed, md, wd] = await Promise.all([er.json(), mr.json(), wr.json()]);
      if (ed.success) setEntries(ed.entries);
      if (md.success) setMine(md.entries);
      if (wd.success) setWeekly(wd.entries);
    } catch {}
  };

  React.useEffect(() => {
    fetchAll();
    if (window._socket) window._socket.on('ruzname:new', fetchAll);
    return () => { if(window._socket) window._socket.off('ruzname:new'); };
  }, []);

  const post = async () => {
    if (!content.trim() || content.length < 5) return;
    setLoading(true);
    try {
      const r = await fetch('/api/rp/ruzname', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: JSON.stringify({ content: content.trim() })
      });
      const d = await r.json();
      if (d.success) { setMsg('📖 Günlük kaydedildi!'); setContent(''); fetchAll(); }
      else setMsg(d.message || 'Hata');
    } catch { setMsg('Sunucu hatası'); }
    setLoading(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const toggleLike = async (entryId) => {
    try {
      await fetch(`/api/rp/ruzname/like/${entryId}`, { method:'POST', headers:{'Authorization':'Bearer '+token} });
      setEntries(prev => prev.map(e => e.id === entryId
        ? { ...e, i_liked: !e.i_liked, like_count: e.i_liked ? Math.max(0, e.like_count-1) : e.like_count+1 }
        : e
      ));
    } catch {}
  };

  const EntryCard = ({ entry, showLike=true }) => {
    const isMe = String(entry.user_id) === String(profile?.id);
    return React.createElement('div', {
      style:{ background:ds.surface, borderLeft:`3px solid ${isMe ? ds.gold : 'rgba(255,255,255,0.1)'}`, borderRadius:'0 12px 12px 0',
        padding:'14px', boxShadow:`inset 0 0 0 1px ${ds.border}` }},
      React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }},
        React.createElement('div', null,
          React.createElement('span', { style:{ fontWeight:700, color: isMe ? ds.gold : ds.text }}, entry.username),
          React.createElement('span', { style:{ fontSize:'0.72rem', color:ds.muted, marginLeft:'8px' }},
            new Date(entry.created_at).toLocaleDateString('tr-TR', { day:'numeric', month:'long' })
          )
        ),
        showLike && React.createElement('button', { onClick:()=>toggleLike(entry.id),
          style:{ background:'none', border:'none', cursor:'pointer', fontSize:'0.85rem', color: entry.i_liked ? '#E74C3C' : ds.muted, display:'flex', alignItems:'center', gap:'3px' }},
          React.createElement('span', null, entry.i_liked ? '❤️' : '🤍'),
          React.createElement('span', { style:{ fontSize:'0.72rem' }}, entry.like_count || 0)
        )
      ),
      React.createElement('div', { style:{ fontSize:'0.88rem', lineHeight:1.6, whiteSpace:'pre-wrap' }}, entry.content)
    );
  };

  const todayEntry = mine.find(e => e.entry_date === new Date().toISOString().split('T')[0]);

  return React.createElement('div', { style:{ minHeight:'100vh', background:ds.bg, padding:'1rem', paddingBottom:'5rem', color:ds.text }},
    // Write section
    React.createElement('div', { style:{ background:`linear-gradient(135deg, rgba(201,162,39,0.08), transparent)`, border:`1px solid rgba(201,162,39,0.2)`, borderRadius:'14px', padding:'14px', marginBottom:'1rem' }},
      React.createElement('div', { style:{ fontWeight:700, marginBottom:'8px', color:ds.gold }}, `📖 Bugünün Günlüğü${todayEntry ? ' (Güncellendi)' : ''}`),
      React.createElement('textarea', {
        value: content || (todayEntry?.content || ''),
        onChange: e => setContent(e.target.value.slice(0, 500)),
        placeholder: 'Bugün neler yaşandı? Düşüncelerini yaz... (5–500 karakter)',
        style:{ width:'100%', minHeight:'90px', padding:'10px', borderRadius:'10px', background:'rgba(255,255,255,0.04)', border:`1px solid ${ds.border}`, color:ds.text, fontSize:'0.88rem', resize:'vertical', boxSizing:'border-box', lineHeight:1.5 }
      }),
      React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'8px' }},
        React.createElement('span', { style:{ fontSize:'0.72rem', color:ds.muted }}, `${(content||'').length}/500`),
        React.createElement('button', { onClick:post, disabled:loading || (content||'').length < 5,
          style:{ padding:'7px 18px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, background:ds.gold, color:'#000', fontSize:'0.82rem' }},
          loading ? '⏳...' : '📖 Kaydet'
        )
      ),
      msg && React.createElement('div', { style:{ fontSize:'0.8rem', color:ds.gold, marginTop:'6px' }}, msg)
    ),

    // Tabs
    React.createElement('div', { style:{ display:'flex', gap:'6px', marginBottom:'1rem' }},
      ['akis','benimkiler','haftalık'].map(t =>
        React.createElement('button', { key:t, onClick:()=>setTab(t),
          style:{ flex:1, padding:'7px 6px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.78rem',
            background: tab===t ? ds.gold : ds.surface, color: tab===t ? '#000' : ds.muted }},
          { akis:'📰 Akış', benimkiler:'📝 Benimkiler', 'haftalık':'🏆 Haftanın En İyisi' }[t]
        )
      )
    ),

    tab === 'akis' && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'8px' }},
      !entries.length && React.createElement('div', { style:{ textAlign:'center', padding:'3rem', color:ds.muted }}, '📖 Henüz günlük yok.'),
      entries.map(e => React.createElement(EntryCard, { key:e.id, entry:e }))
    ),

    tab === 'benimkiler' && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'8px' }},
      !mine.length && React.createElement('div', { style:{ textAlign:'center', padding:'3rem', color:ds.muted }}, '📝 Henüz günlük yazmadın.'),
      mine.map(e => React.createElement(EntryCard, { key:e.id, entry:e, showLike:false }))
    ),

    tab === 'haftalık' && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'8px' }},
      React.createElement('div', { style:{ fontSize:'0.78rem', color:ds.muted, marginBottom:'6px' }}, '🏆 Bu haftanın en çok beğenilen günlükleri:'),
      !weekly.length && React.createElement('div', { style:{ textAlign:'center', padding:'2rem', color:ds.muted }}, 'Henüz yok.'),
      weekly.map((e, i) =>
        React.createElement('div', { key:e.id },
          React.createElement('div', { style:{ fontSize:'0.8rem', color:ds.gold, fontWeight:700, marginBottom:'4px' }},
            `${['🥇','🥈','🥉','4.','5.'][i]} ${e.likes} ❤️`
          ),
          React.createElement(EntryCard, { entry:e })
        )
      )
    )
  );
};
