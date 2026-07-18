// Meyhane / Kahvehane Ekranı
window.MeyhanScreen = function MeyhanScreen({ profile, token }) {
  const [tables, setTables] = React.useState([]);
  const [menu, setMenu] = React.useState([]);
  const [myTable, setMyTable] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [chatInput, setChatInput] = React.useState('');
  const [loading, setLoading] = React.useState('');
  const [msg, setMsg] = React.useState({ text:'', ok:true });
  const chatRef = React.useRef(null);

  const ds = { bg:'#0B0906', surface:'rgba(255,220,150,0.04)', gold:'#C9A227', amber:'#D4872C', border:'rgba(255,200,100,0.1)', text:'#EDE7DA', muted:'#A8956A', green:'#4CAF50', red:'#FF6B6B' };

  const fetchTables = async () => {
    try {
      const r = await fetch('/api/tavern/tables', { headers:{'Authorization':'Bearer '+token} });
      const d = await r.json();
      if (d.success) {
        setTables(d.tables);
        setMenu(d.menu);
        const tbl = d.tables.find(t => t.occupants?.some(u => String(u.id) === String(profile?.id)));
        setMyTable(tbl?.table_no || null);
      }
    } catch {}
  };

  const fetchChat = async (tableNo) => {
    try {
      const r = await fetch(`/api/tavern/chat/${tableNo}`, { headers:{'Authorization':'Bearer '+token} });
      const d = await r.json();
      if (d.success) setMessages(d.messages);
    } catch {}
  };

  React.useEffect(() => {
    fetchTables();
    if (window._socket) {
      window._socket.on('tavern:sit',   fetchTables);
      window._socket.on('tavern:leave', fetchTables);
      window._socket.on('tavern:msg',   (msg) => setMessages(prev => [...prev.slice(-49), msg]));
      window._socket.on('tavern:order', (data) => setMessages(prev => [...prev.slice(-49), { id:Date.now(), username:data.username, content:`${data.item.emoji} ${data.item.name} ısmarlıyor!`, order_item:data.item.id, created_at: new Date().toISOString() }]));
    }
    return () => {
      if (window._socket) { window._socket.off('tavern:sit'); window._socket.off('tavern:leave'); window._socket.off('tavern:msg'); window._socket.off('tavern:order'); }
    };
  }, []);

  React.useEffect(() => {
    if (myTable) fetchChat(myTable);
  }, [myTable]);

  React.useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const show = (text, ok=true) => { setMsg({ text, ok }); setTimeout(() => setMsg({ text:'', ok:true }), 3000); };

  const sit = async (tableNo) => {
    setLoading(`sit-${tableNo}`);
    try {
      const r = await fetch('/api/tavern/sit', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ tableNo }) });
      const d = await r.json();
      if (d.success) { setMyTable(tableNo); fetchTables(); fetchChat(tableNo); }
      else show(d.message || 'Hata', false);
    } catch { show('Hata', false); }
    setLoading('');
  };

  const leave = async () => {
    try {
      await fetch('/api/tavern/leave', { method:'POST', headers:{'Authorization':'Bearer '+token} });
      setMyTable(null); setMessages([]); fetchTables();
    } catch {}
  };

  const order = async (itemId) => {
    setLoading(`order-${itemId}`);
    try {
      const r = await fetch('/api/tavern/order', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ itemId }) });
      const d = await r.json();
      if (d.success) show(`${d.item.emoji} ${d.item.name} söylendi! +${d.xpGained} XP`);
      else show(d.message || 'Hata', false);
    } catch { show('Hata', false); }
    setLoading('');
  };

  const sendChat = async () => {
    if (!chatInput.trim() || !myTable) return;
    const txt = chatInput.trim(); setChatInput('');
    try {
      await fetch(`/api/tavern/chat/${myTable}`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ content: txt }) });
    } catch {}
  };

  return React.createElement('div', { style:{ minHeight:'100vh', background:ds.bg, padding:'1rem', paddingBottom:'5rem', color:ds.text,
    backgroundImage:'radial-gradient(circle at 20% 80%, rgba(180,100,20,0.08) 0%, transparent 60%)' }},

    React.createElement('div', { style:{ textAlign:'center', marginBottom:'1.2rem' }},
      React.createElement('div', { style:{ fontSize:'2rem', marginBottom:'4px' }}, '🏮'),
      React.createElement('div', { style:{ fontWeight:900, fontSize:'1.2rem', color:ds.amber, fontFamily:'serif' }}, 'Kahvehane & Meyhane'),
      React.createElement('div', { style:{ fontSize:'0.78rem', color:ds.muted }}, 'Bir masaya otur, sipariş ver, sohbet et.')
    ),

    msg.text && React.createElement('div', { style:{ background: msg.ok ? 'rgba(201,162,39,0.1)' : 'rgba(255,80,80,0.1)', border:`1px solid ${msg.ok ? ds.gold : ds.red}`, borderRadius:'8px', padding:'10px 14px', marginBottom:'1rem', fontSize:'0.82rem', color: msg.ok ? ds.gold : ds.red }}, msg.text),

    // If seated — show chat + menu
    myTable ? React.createElement('div', null,
      React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }},
        React.createElement('div', { style:{ fontWeight:700, color:ds.amber }}, `🪑 Masa ${myTable}'de oturuyorsun`),
        React.createElement('button', { onClick:leave, style:{ padding:'5px 12px', borderRadius:'6px', border:`1px solid rgba(255,100,100,0.3)`, background:'transparent', color:ds.red, cursor:'pointer', fontSize:'0.78rem', fontWeight:700 }}, '🚪 Kalk')
      ),

      // Chat
      React.createElement('div', { ref:chatRef, style:{ background:'rgba(0,0,0,0.3)', border:`1px solid ${ds.border}`, borderRadius:'12px', padding:'10px', height:'180px', overflowY:'auto', marginBottom:'8px', display:'flex', flexDirection:'column', gap:'4px' }},
        !messages.length && React.createElement('div', { style:{ textAlign:'center', color:ds.muted, fontSize:'0.8rem', marginTop:'60px' }}, 'Henüz sohbet yok...'),
        messages.map((m, i) => {
          const isMe = String(m.user_id) === String(profile?.id);
          return React.createElement('div', { key:m.id||i, style:{ fontSize:'0.82rem', color: m.order_item ? ds.amber : (isMe ? ds.gold : ds.text) }},
            React.createElement('span', { style:{ fontWeight:700, marginRight:'4px' }}, `${m.username}:`),
            m.content
          );
        })
      ),
      React.createElement('div', { style:{ display:'flex', gap:'6px', marginBottom:'12px' }},
        React.createElement('input', { value:chatInput, onChange:e=>setChatInput(e.target.value), onKeyDown:e=>e.key==='Enter'&&sendChat(),
          placeholder:'Bir şeyler söyle...', style:{ flex:1, padding:'8px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', border:`1px solid ${ds.border}`, color:ds.text, fontSize:'0.85rem' }
        }),
        React.createElement('button', { onClick:sendChat, style:{ padding:'8px 14px', borderRadius:'8px', border:'none', cursor:'pointer', background:ds.amber, color:'#000', fontWeight:700 }}, '→')
      ),

      // Menu
      React.createElement('div', { style:{ fontWeight:700, color:ds.amber, marginBottom:'8px' }}, '🍽️ Sipariş Ver'),
      React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }},
        menu.map(item =>
          React.createElement('button', { key:item.id, onClick:()=>order(item.id), disabled:loading===`order-${item.id}`,
            style:{ padding:'10px 8px', borderRadius:'10px', border:`1px solid ${ds.border}`, cursor:'pointer', background:'rgba(255,200,100,0.04)', color:ds.text, textAlign:'center' }},
            React.createElement('div', { style:{ fontSize:'1.4rem', marginBottom:'3px' }}, item.emoji),
            React.createElement('div', { style:{ fontSize:'0.75rem', fontWeight:700 }}, item.name),
            React.createElement('div', { style:{ fontSize:'0.7rem', color:ds.muted }}, `${item.price} 🪙 · +${item.xp} XP`)
          )
        )
      )
    ) :

    // Table selection
    React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'10px' }},
      tables.map(t => {
        const full = t.occupants?.length >= t.capacity;
        return React.createElement('div', { key:t.table_no,
          style:{ background:ds.surface, border:`1px solid ${full ? 'rgba(255,100,100,0.2)' : ds.border}`, borderRadius:'12px', padding:'14px' }},
          React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }},
            React.createElement('div', null,
              React.createElement('div', { style:{ fontWeight:700 }}, `🪑 Masa ${t.table_no} — ${t.name}`),
              React.createElement('div', { style:{ fontSize:'0.77rem', color:ds.muted, marginTop:'2px' }}, t.description)
            ),
            React.createElement('div', { style:{ textAlign:'right', fontSize:'0.75rem', color: full ? ds.red : ds.muted }},
              `${t.occupants?.length||0}/${t.capacity}`
            )
          ),
          t.occupants?.length > 0 && React.createElement('div', { style:{ display:'flex', gap:'4px', flexWrap:'wrap', marginBottom:'8px' }},
            t.occupants.map(u => React.createElement('span', { key:u.id, style:{ fontSize:'0.7rem', background:'rgba(255,255,255,0.05)', borderRadius:'4px', padding:'2px 6px', color:ds.muted }}, u.username))
          ),
          React.createElement('button', { onClick:()=>sit(t.table_no), disabled:full||loading===`sit-${t.table_no}`,
            style:{ width:'100%', padding:'8px', borderRadius:'8px', border:'none', cursor:full?'default':'pointer', fontWeight:700,
              background: full ? 'rgba(255,255,255,0.04)' : 'rgba(212,135,44,0.15)', color: full ? ds.muted : ds.amber }},
            full ? 'Dolu' : loading===`sit-${t.table_no}` ? '⏳...' : '🪑 Otur'
          )
        );
      })
    )
  );
};
