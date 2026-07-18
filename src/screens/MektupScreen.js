// Mektup Sistemi Ekranı
window.MektupScreen = function MektupScreen({ profile, token, onlinePlayers }) {
  const [tab, setTab] = React.useState('gelen');
  const [inbox, setInbox] = React.useState([]);
  const [sent, setSent] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [compose, setCompose] = React.useState({ receiverId:'', subject:'', content:'', sealed:true });
  const [unread, setUnread] = React.useState(0);
  const [loading, setLoading] = React.useState('');
  const [msg, setMsg] = React.useState('');

  const ds = { bg:'#0D1117', surface:'rgba(255,255,255,0.04)', gold:'#C9A227', border:'rgba(255,255,255,0.08)', text:'#EDE7DA', muted:'#8893A1', green:'#4CAF50', red:'#FF6B6B', parchment:'#F5E6C8' };

  const fetchLetters = async () => {
    try {
      const [ir, sr, cr] = await Promise.all([
        fetch('/api/letters/inbox',        { headers:{'Authorization':'Bearer '+token} }),
        fetch('/api/letters/sent',         { headers:{'Authorization':'Bearer '+token} }),
        fetch('/api/letters/count/unread', { headers:{'Authorization':'Bearer '+token} }),
      ]);
      const [id, sd, cd] = await Promise.all([ir.json(), sr.json(), cr.json()]);
      if (id.success) setInbox(id.letters);
      if (sd.success) setSent(sd.letters);
      if (cd.success) setUnread(cd.count);
    } catch {}
  };

  React.useEffect(() => {
    fetchLetters();
    if (window._socket) window._socket.on('letter:received', () => { fetchLetters(); });
    return () => { if(window._socket) window._socket.off('letter:received'); };
  }, []);

  const show = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const openLetter = async (letter) => {
    if (!letter.read && tab === 'gelen') {
      await fetch(`/api/letters/${letter.id}`, { headers:{'Authorization':'Bearer '+token} });
      setInbox(prev => prev.map(l => l.id === letter.id ? { ...l, read: true } : l));
      setUnread(prev => Math.max(0, prev - 1));
    }
    setSelected(letter);
  };

  const sendLetter = async () => {
    if (!compose.receiverId || !compose.content.trim()) return show('Alıcı ve içerik gerekli');
    setLoading('send');
    try {
      const r = await fetch('/api/letters/send', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: JSON.stringify(compose)
      });
      const d = await r.json();
      if (d.success) {
        show('✉️ Mektup gönderildi!');
        setCompose({ receiverId:'', subject:'', content:'', sealed:true });
        fetchLetters();
        setTab('gelen');
      } else show(d.message || 'Hata');
    } catch { show('Sunucu hatası'); }
    setLoading('');
  };

  const deleteLetter = async (id) => {
    await fetch(`/api/letters/${id}`, { method:'DELETE', headers:{'Authorization':'Bearer '+token} });
    setInbox(prev => prev.filter(l => l.id !== id));
    setSent(prev => prev.filter(l => l.id !== id));
    setSelected(null);
  };

  if (selected) return React.createElement('div', { style:{ minHeight:'100vh', background:ds.bg, padding:'1rem', paddingBottom:'5rem', color:ds.text }},
    React.createElement('button', { onClick:()=>setSelected(null), style:{ background:'none', border:'none', color:ds.muted, cursor:'pointer', fontSize:'0.85rem', marginBottom:'1rem' }}, '← Geri'),
    React.createElement('div', { style:{ background:'rgba(245,230,200,0.04)', border:`1px solid rgba(201,162,39,0.25)`, borderRadius:'14px', padding:'20px' }},
      React.createElement('div', { style:{ borderBottom:`1px solid rgba(201,162,39,0.2)`, paddingBottom:'12px', marginBottom:'14px' }},
        React.createElement('div', { style:{ fontWeight:800, fontSize:'1rem', marginBottom:'4px' }}, selected.subject || 'Mektup'),
        React.createElement('div', { style:{ fontSize:'0.78rem', color:ds.muted }},
          tab === 'gelen' ? `Gönderen: ${selected.sender_name}` : `Alıcı: ${selected.receiver_name}`
        ),
        React.createElement('div', { style:{ fontSize:'0.72rem', color:ds.muted, marginTop:'2px' }},
          new Date(selected.created_at).toLocaleString('tr-TR')
        ),
        selected.sealed && React.createElement('div', { style:{ fontSize:'0.72rem', color:ds.gold, marginTop:'4px' }}, '🔒 Mühürlü Mektup')
      ),
      React.createElement('div', { style:{ fontSize:'0.9rem', lineHeight:1.7, whiteSpace:'pre-wrap', color:ds.parchment }}, selected.content),
      React.createElement('button', { onClick:()=>deleteLetter(selected.id),
        style:{ marginTop:'16px', padding:'6px 14px', borderRadius:'8px', border:`1px solid rgba(255,100,100,0.3)`, background:'transparent', color:ds.red, cursor:'pointer', fontSize:'0.78rem' }},
        '🗑️ Sil'
      )
    )
  );

  return React.createElement('div', { style:{ minHeight:'100vh', background:ds.bg, padding:'1rem', paddingBottom:'5rem', color:ds.text }},
    React.createElement('div', { style:{ display:'flex', gap:'6px', marginBottom:'1rem' }},
      ['gelen','gonderilen','yaz'].map(t =>
        React.createElement('button', { key:t, onClick:()=>setTab(t),
          style:{ flex:1, padding:'7px 4px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.75rem', position:'relative',
            background: tab===t ? ds.gold : ds.surface, color: tab===t ? '#000' : ds.muted }},
          { gelen:`📬 Gelen${unread>0?` (${unread})`:''}`, gonderilen:'📤 Gönderilen', yaz:'✍️ Yaz' }[t]
        )
      )
    ),

    msg && React.createElement('div', { style:{ background:'rgba(201,162,39,0.1)', border:`1px solid ${ds.gold}`, borderRadius:'8px', padding:'10px 14px', marginBottom:'1rem', fontSize:'0.82rem', color:ds.gold }}, msg),

    (tab === 'gelen' || tab === 'gonderilen') && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'6px' }},
      (tab === 'gelen' ? inbox : sent).length === 0 && React.createElement('div', { style:{ textAlign:'center', padding:'3rem', color:ds.muted }}, '📭 Mektup yok.'),
      (tab === 'gelen' ? inbox : sent).map(l =>
        React.createElement('div', { key:l.id, onClick:()=>openLetter(l), style:{ cursor:'pointer',
          background: (!l.read && tab==='gelen') ? 'rgba(201,162,39,0.08)' : ds.surface,
          border:`1px solid ${(!l.read && tab==='gelen') ? 'rgba(201,162,39,0.3)' : ds.border}`,
          borderRadius:'10px', padding:'12px 14px' }},
          React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center' }},
            React.createElement('div', null,
              React.createElement('div', { style:{ fontWeight:700, fontSize:'0.88rem' }}, `${l.sealed?'🔒 ':'✉️ '}${l.subject || 'Mektup'}`),
              React.createElement('div', { style:{ fontSize:'0.75rem', color:ds.muted, marginTop:'2px' }},
                tab==='gelen' ? `Gönderen: ${l.sender_name}` : `Alıcı: ${l.receiver_name}`
              )
            ),
            React.createElement('div', { style:{ fontSize:'0.7rem', color:ds.muted }}, new Date(l.created_at).toLocaleDateString('tr-TR'))
          )
        )
      )
    ),

    tab === 'yaz' && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'10px' }},
      React.createElement('div', null,
        React.createElement('label', { style:{ fontSize:'0.8rem', color:ds.muted, display:'block', marginBottom:'4px' }}, 'Alıcı:'),
        React.createElement('select', {
          value:compose.receiverId, onChange:e=>setCompose(p=>({...p, receiverId:e.target.value})),
          style:{ width:'100%', padding:'8px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', border:`1px solid ${ds.border}`, color:ds.text }},
          React.createElement('option', { value:'' }, '-- Alıcı Seç --'),
          (onlinePlayers||[]).filter(p => String(p.id) !== String(profile?.id)).map(p =>
            React.createElement('option', { key:p.id, value:p.id }, p.username)
          )
        )
      ),
      React.createElement('input', {
        value:compose.subject, onChange:e=>setCompose(p=>({...p, subject:e.target.value.slice(0,100)})),
        placeholder:'Konu (isteğe bağlı)...',
        style:{ padding:'8px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', border:`1px solid ${ds.border}`, color:ds.text, fontSize:'0.85rem' }
      }),
      React.createElement('textarea', {
        value:compose.content, onChange:e=>setCompose(p=>({...p, content:e.target.value.slice(0,1000)})),
        placeholder:'Mektubunu yaz... (max 1000 karakter)',
        style:{ minHeight:'140px', padding:'10px', borderRadius:'10px', background:'rgba(255,255,255,0.04)', border:`1px solid ${ds.border}`, color:ds.text, fontSize:'0.88rem', resize:'vertical', lineHeight:1.6 }
      }),
      React.createElement('label', { style:{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontSize:'0.82rem', color:ds.muted }},
        React.createElement('input', { type:'checkbox', checked:compose.sealed, onChange:e=>setCompose(p=>({...p,sealed:e.target.checked})), style:{ accentColor:ds.gold } }),
        '🔒 Mühürlü gönder (sadece alıcı okur)'
      ),
      React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center' }},
        React.createElement('span', { style:{ fontSize:'0.72rem', color:ds.muted }}, `${compose.content.length}/1000`),
        React.createElement('button', { onClick:sendLetter, disabled:loading==='send',
          style:{ padding:'9px 22px', borderRadius:'10px', border:'none', cursor:'pointer', fontWeight:700, background:ds.gold, color:'#000' }},
          loading==='send' ? '⏳ Gönderiliyor...' : '✉️ Gönder'
        )
      )
    )
  );
};
