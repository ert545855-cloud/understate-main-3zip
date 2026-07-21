// Pazar Günü Etkinliği Ekranı
window.PazarEtkinlikScreen = function PazarEtkinlikScreen({ profile, token }) {
  const [status, setStatus] = React.useState(null);
  const [purchases, setPurchases] = React.useState([]);
  const [loading, setLoading] = React.useState('');
  const [msg, setMsg] = React.useState({ text:'', ok:true });

  const ds = { bg:'#0D1117', surface:'rgba(255,255,255,0.04)', gold:'#C9A227', border:'rgba(255,255,255,0.08)', text:'#EDE7DA', muted:'#8893A1', green:'#4CAF50', red:'#FF6B6B' };

  const fetchStatus = async () => {
    try {
      const [sr, pr] = await Promise.all([
        fetch('/api/market/status',       { headers:{'Authorization':'Bearer '+token} }),
        fetch('/api/market/my-purchases', { headers:{'Authorization':'Bearer '+token} }),
      ]);
      const [sd, pd] = await Promise.all([sr.json(), pr.json()]);
      if (sd.success) setStatus(sd);
      if (pd.success) setPurchases(pd.purchases);
    } catch {}
  };

  React.useEffect(() => {
    fetchStatus();
    const iv = setInterval(fetchStatus, 30000);
    if (window._socket) window._socket.on('market:purchase', fetchStatus);
    return () => { clearInterval(iv); if(window._socket) window._socket.off('market:purchase'); };
  }, []);

  const show = (text, ok=true) => { setMsg({ text, ok }); setTimeout(() => setMsg({ text:'', ok:true }), 4000); };

  const buy = async (itemId) => {
    setLoading(itemId);
    try {
      const r = await fetch('/api/market/buy', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: JSON.stringify({ itemId })
      });
      const d = await r.json();
      if (d.success) { show(`✅ ${d.item.emoji} ${d.item.name} satın alındı! (${d.item.price} 🪙)`); fetchStatus(); }
      else show(d.message || 'Hata', false);
    } catch { show('Hata', false); }
    setLoading('');
  };

  const todayBoughtIds = purchases
    .filter(p => new Date(p.created_at) > new Date(Date.now() - 86400000))
    .map(p => p.item_id);

  return React.createElement('div', { style:{ minHeight:'100vh', background:ds.bg, padding:'1rem', paddingBottom:'5rem', color:ds.text }},
    // Banner
    React.createElement('div', { style:{ background:`linear-gradient(135deg, rgba(201,162,39,0.15), rgba(180,80,20,0.1))`, border:`1px solid rgba(201,162,39,0.25)`, borderRadius:'16px', padding:'18px', marginBottom:'1.2rem', textAlign:'center' }},
      React.createElement('div', { style:{ fontSize:'2.5rem', marginBottom:'6px' }}, '🎪'),
      React.createElement('div', { style:{ fontWeight:900, fontSize:'1.2rem', color:ds.gold }}, 'Pazar Günü Özel'),
      React.createElement('div', { style:{ fontSize:'0.82rem', color:ds.muted, marginTop:'4px' }},
        status?.message || 'Her Cumartesi 08:00–22:00 aktif'
      ),
      status?.active && React.createElement('div', { style:{ display:'inline-block', background:'rgba(80,200,80,0.15)', border:`1px solid rgba(80,200,80,0.3)`, borderRadius:'20px', padding:'4px 14px', marginTop:'8px', fontSize:'0.78rem', fontWeight:700, color:ds.green }},
        '🟢 PAZAR AKTİF'
      )
    ),

    msg.text && React.createElement('div', { style:{ background: msg.ok ? 'rgba(80,200,80,0.08)' : 'rgba(255,80,80,0.08)', border:`1px solid ${msg.ok ? ds.green : ds.red}`, borderRadius:'8px', padding:'10px 14px', marginBottom:'1rem', fontSize:'0.82rem', color: msg.ok ? ds.green : ds.red }}, msg.text),

    // Active market items
    status?.active && status?.items?.length > 0 && React.createElement('div', null,
      React.createElement('div', { style:{ fontWeight:700, marginBottom:'10px', color:ds.gold }}, '🛒 Bugünün Özel Ürünleri (%20 İndirim!)'),
      React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'10px' }},
        status.items.map(item => {
          const bought = todayBoughtIds.includes(item.id);
          const outOfStock = item.stock <= 0;
          return React.createElement('div', { key:item.id,
            style:{ background: bought ? 'rgba(80,200,80,0.05)' : ds.surface, border:`1px solid ${bought ? 'rgba(80,200,80,0.2)' : ds.border}`, borderRadius:'12px', padding:'14px', display:'flex', alignItems:'center', gap:'12px' }},
            React.createElement('div', { style:{ fontSize:'2.2rem', minWidth:'44px', textAlign:'center' }}, item.emoji),
            React.createElement('div', { style:{ flex:1 }},
              React.createElement('div', { style:{ fontWeight:700 }}, item.name),
              React.createElement('div', { style:{ fontSize:'0.77rem', color:ds.muted }}, item.desc || ''),
              React.createElement('div', { style:{ display:'flex', gap:'8px', alignItems:'center', marginTop:'4px' }},
                React.createElement('span', { style:{ fontWeight:700, color:ds.gold }}, `${item.price} 🪙`),
                React.createElement('span', { style:{ fontSize:'0.7rem', color:ds.muted, textDecoration:'line-through' }}, `${item.original_price}`),
                React.createElement('span', { style:{ fontSize:'0.7rem', background:'rgba(80,200,80,0.15)', color:ds.green, padding:'1px 5px', borderRadius:'4px' }}, '-20%')
              )
            ),
            React.createElement('div', { style:{ textAlign:'right' }},
              React.createElement('div', { style:{ fontSize:'0.72rem', color:ds.muted, marginBottom:'5px' }}, `Stok: ${item.stock}`),
              bought
                ? React.createElement('div', { style:{ fontSize:'0.75rem', color:ds.green, fontWeight:700 }}, '✅ Alındı')
                : outOfStock
                  ? React.createElement('div', { style:{ fontSize:'0.75rem', color:ds.muted }}, 'Tükendi')
                  : React.createElement('button', { onClick:()=>buy(item.id), disabled:loading===item.id,
                      style:{ padding:'7px 14px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.82rem', background:ds.gold, color:'#000' }},
                      loading===item.id ? '⏳' : '🛒 Al'
                    )
            )
          );
        })
      )
    ),

    !status?.active && React.createElement('div', { style:{ background:ds.surface, border:`1px solid ${ds.border}`, borderRadius:'12px', padding:'24px', textAlign:'center' }},
      React.createElement('div', { style:{ fontSize:'2rem', marginBottom:'8px' }}, '📅'),
      React.createElement('div', { style:{ fontWeight:700, marginBottom:'4px' }}, 'Pazar Henüz Başlamadı'),
      React.createElement('div', { style:{ fontSize:'0.82rem', color:ds.muted, marginBottom:'12px' }}, 'Her Cumartesi 08:00–22:00 arası aktif.'),
      React.createElement('div', { style:{ fontSize:'0.8rem', color:ds.gold }}, `Sonraki: ${status?.nextMarket || '—'}`)
    ),

    purchases.length > 0 && React.createElement('div', { style:{ marginTop:'1.5rem' }},
      React.createElement('div', { style:{ fontWeight:700, marginBottom:'8px', color:ds.muted, fontSize:'0.85rem' }}, '📦 Geçmiş Alışverişlerin'),
      React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'6px' }},
        purchases.slice(0, 8).map(p =>
          React.createElement('div', { key:p.id, style:{ background:ds.surface, border:`1px solid ${ds.border}`, borderRadius:'8px', padding:'8px 12px', display:'flex', justifyContent:'space-between' }},
            React.createElement('span', { style:{ fontSize:'0.85rem' }}, p.item_name),
            React.createElement('div', { style:{ textAlign:'right' }},
              React.createElement('div', { style:{ fontSize:'0.8rem', color:ds.red }}, `-${p.price} 🪙`),
              React.createElement('div', { style:{ fontSize:'0.68rem', color:ds.muted }}, new Date(p.created_at).toLocaleDateString('tr-TR'))
            )
          )
        )
      )
    )
  );
};
