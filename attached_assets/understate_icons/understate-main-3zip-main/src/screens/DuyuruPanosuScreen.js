// Duyuru Panosu / İlan Tahtası
window.DuyuruPanosuScreen = function DuyuruPanosuScreen({ profile, token }) {
  const [announcements, setAnnouncements] = React.useState([]);
  const [content, setContent] = React.useState('');
  const [category, setCategory] = React.useState('genel');
  const [filter, setFilter] = React.useState('hepsi');
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState('');

  const ds = { bg:'#0D1117', surface:'rgba(255,255,255,0.04)', gold:'#C9A227', border:'rgba(255,255,255,0.08)', text:'#EDE7DA', muted:'#8893A1', red:'#FF6B6B', green:'#4CAF50' };

  const CATS = [
    { id:'hepsi', label:'Hepsi', emoji:'📋', color:ds.muted },
    { id:'is',    label:'İş',   emoji:'💼', color:'#4A90E2' },
    { id:'ortak', label:'Ortak',emoji:'🤝', color:'#27AE60' },
    { id:'satis', label:'Satış',emoji:'🛒', color:'#E67E22' },
    { id:'genel', label:'Genel',emoji:'📣', color:ds.gold },
  ];

  const catInfo = (id) => CATS.find(c=>c.id===id) || CATS[CATS.length-1];

  const fetchAnn = async () => {
    try {
      const r = await fetch('/api/social/announcements', { headers:{'Authorization':'Bearer '+token} });
      const d = await r.json();
      if (d.success) setAnnouncements(d.announcements);
    } catch {}
  };

  React.useEffect(() => {
    fetchAnn();
    const iv = setInterval(fetchAnn, 15000);
    if (window._socket) {
      window._socket.on('announcement:new', (ann) => {
        setAnnouncements(prev => [ann, ...prev].slice(0, 50));
      });
    }
    return () => { clearInterval(iv); if(window._socket) window._socket.off('announcement:new'); };
  }, []);

  const post = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const r = await fetch('/api/social/announcements', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: JSON.stringify({ content: content.trim(), category })
      });
      const d = await r.json();
      if (d.success) { setMsg('✅ İlan yayınlandı!'); setContent(''); fetchAnn(); }
      else setMsg(d.message || 'Hata');
    } catch { setMsg('Sunucu hatası'); }
    setLoading(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const del = async (id) => {
    await fetch(`/api/social/announcements/${id}`, { method:'DELETE', headers:{'Authorization':'Bearer '+token} });
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const timeLeft = (exp) => {
    const d = new Date(exp) - new Date();
    if (d <= 0) return 'Süresi doldu';
    const h = Math.floor(d/3600000), m = Math.floor((d%3600000)/60000);
    return `${h}s ${m}dk kaldı`;
  };

  const visible = filter === 'hepsi' ? announcements : announcements.filter(a => a.category === filter);

  return React.createElement('div', { style:{ minHeight:'100vh', background:ds.bg, padding:'1rem', paddingBottom:'5rem', color:ds.text }},
    // Post form
    React.createElement('div', { style:{ background:ds.surface, border:`1px solid ${ds.border}`, borderRadius:'12px', padding:'14px', marginBottom:'1rem' }},
      React.createElement('div', { style:{ fontWeight:700, marginBottom:'10px' }}, '📣 İlan Yayınla'),
      React.createElement('div', { style:{ display:'flex', gap:'6px', marginBottom:'8px', flexWrap:'wrap' }},
        CATS.slice(1).map(c =>
          React.createElement('button', { key:c.id, onClick:()=>setCategory(c.id),
            style:{ padding:'4px 10px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'0.75rem', fontWeight:600,
              background: category===c.id ? c.color+'33' : 'transparent', color: category===c.id ? c.color : ds.muted,
              border: category===c.id ? `1px solid ${c.color}44` : `1px solid ${ds.border}` }},
            `${c.emoji} ${c.label}`
          )
        )
      ),
      React.createElement('textarea', {
        value:content, onChange:e=>setContent(e.target.value.slice(0,200)),
        placeholder:'İlanını yaz... (max 200 karakter)',
        style:{ width:'100%', minHeight:'80px', padding:'8px', borderRadius:'8px', background:'rgba(255,255,255,0.04)', border:`1px solid ${ds.border}`, color:ds.text, fontSize:'0.85rem', resize:'vertical', boxSizing:'border-box' }
      }),
      React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'8px' }},
        React.createElement('span', { style:{ fontSize:'0.72rem', color:ds.muted }}, `${content.length}/200 · 24 saat geçerli`),
        React.createElement('button', { onClick:post, disabled:loading||!content.trim(),
          style:{ padding:'7px 18px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, background:ds.gold, color:'#000', fontSize:'0.82rem' }},
          loading ? '⏳...' : '📣 Yayınla'
        )
      ),
      msg && React.createElement('div', { style:{ fontSize:'0.8rem', color:ds.gold, marginTop:'6px' }}, msg)
    ),

    // Filter tabs
    React.createElement('div', { style:{ display:'flex', gap:'4px', marginBottom:'10px', overflowX:'auto', paddingBottom:'2px' }},
      CATS.map(c =>
        React.createElement('button', { key:c.id, onClick:()=>setFilter(c.id),
          style:{ padding:'5px 10px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'0.73rem', fontWeight:700, whiteSpace:'nowrap',
            background: filter===c.id ? c.color+'44' : ds.surface, color: filter===c.id ? c.color : ds.muted }},
          `${c.emoji} ${c.label}`
        )
      )
    ),

    !visible.length && React.createElement('div', { style:{ textAlign:'center', padding:'3rem', color:ds.muted }}, '📋 Bu kategoride ilan yok.'),

    React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'8px' }},
      visible.map(a => {
        const ci = catInfo(a.category);
        const isMe = String(a.user_id) === String(profile?.id);
        return React.createElement('div', { key:a.id,
          style:{ background:ds.surface, borderLeft:`3px solid ${ci.color}`, borderRadius:'0 10px 10px 0', padding:'12px 14px',
            boxShadow:`inset 0 0 0 1px ${ds.border}` }},
          React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'8px' }},
            React.createElement('div', { style:{ flex:1 }},
              React.createElement('div', { style:{ display:'flex', gap:'6px', alignItems:'center', marginBottom:'4px' }},
                React.createElement('span', { style:{ fontSize:'0.7rem', background:`${ci.color}22`, color:ci.color, padding:'2px 6px', borderRadius:'4px', fontWeight:700 }},
                  `${ci.emoji} ${ci.label}`
                ),
                React.createElement('span', { style:{ fontSize:'0.7rem', color:ds.muted }}, a.username)
              ),
              React.createElement('div', { style:{ fontSize:'0.88rem' }}, a.content),
              React.createElement('div', { style:{ fontSize:'0.7rem', color:ds.muted, marginTop:'4px' }}, timeLeft(a.expires_at))
            ),
            isMe && React.createElement('button', { onClick:()=>del(a.id),
              style:{ background:'none', border:'none', cursor:'pointer', color:ds.muted, fontSize:'1rem', padding:'0' }},
              '🗑️'
            )
          )
        );
      })
    )
  );
};
