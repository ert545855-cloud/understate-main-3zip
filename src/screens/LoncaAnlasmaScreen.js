// ═══════════════════════════════════════════════════════════════
// SALTANAT ONLINE — Lonca Ticaret Anlaşmaları
// ═══════════════════════════════════════════════════════════════
window.LoncaAnlasmaScreen = function LoncaAnlasmaScreen({ profile, onNavigate, showNotif }) {
  const G='#C89B3C', BG='#0F0800', T='#F5EBD7', M='#A9A6A0', S='#2D1800', R='#B8423C', GR='#3E8C5A';
  const jwt = () => localStorage.getItem('us_jwt') || '';

  const [tab,    setTab]    = React.useState('open');
  const [data,   setData]   = React.useState({ mine:[], incoming:[], open:[], goods:[] });
  const [showNew, setShowNew] = React.useState(false);
  const [form,   setForm]   = React.useState({ goods_offered:'Kumaş', amount_offered:10, goods_requested:'Baharat', amount_requested:5, notes:'' });
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/lonca-anlasma', { headers:{ Authorization:'Bearer '+jwt() }});
      const d = await r.json();
      if (d.success) setData(d);
    } finally { setLoading(false); }
  };

  const propose = async () => {
    try {
      const r = await fetch('/api/lonca-anlasma/propose', {
        method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+jwt() },
        body: JSON.stringify(form)
      });
      const d = await r.json();
      if (d.success) { showNotif && showNotif('🤝 Teklif gönderildi!', 'success'); setShowNew(false); load(); }
      else showNotif && showNotif(d.message || 'Hata', 'error');
    } catch { showNotif && showNotif('Bağlantı hatası', 'error'); }
  };

  const accept = async (id) => {
    try {
      const r = await fetch(`/api/lonca-anlasma/${id}/accept`, { method:'POST', headers:{ Authorization:'Bearer '+jwt() }});
      const d = await r.json();
      if (d.success) { showNotif && showNotif(`✅ Anlaşma kabul edildi! +⭐${d.xp_reward} XP`, 'success'); load(); }
      else showNotif && showNotif(d.message || 'Hata', 'error');
    } catch { showNotif && showNotif('Bağlantı hatası', 'error'); }
  };

  const reject = async (id) => {
    await fetch(`/api/lonca-anlasma/${id}/reject`, { method:'POST', headers:{ Authorization:'Bearer '+jwt() }});
    load();
  };

  const statusColor = { pending:'#C89B3C', accepted:'#3E8C5A', rejected:'#B8423C', expired:'#A9A6A0', completed:'#60A5FA' };
  const statusLabel = { pending:'⏳ Bekliyor', accepted:'✅ Kabul', rejected:'❌ Red', expired:'⌛ Süresi Doldu', completed:'🏁 Tamamlandı' };

  const cardStyle = { background: S, borderRadius: 14, padding: '14px', marginBottom: 10, border: '1px solid rgba(200,155,60,0.18)', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' };

  const GoodsSelect = ({ label, val, onChange }) =>
    React.createElement('div', { style:{ flex:1 }},
      React.createElement('div', { style:{ fontSize:'0.65rem', color:M, marginBottom:4 }}, label),
      React.createElement('select', { value:val, onChange:e=>onChange(e.target.value),
        style:{ width:'100%', padding:'8px', borderRadius:8, border:'1px solid rgba(200,155,60,0.25)', background:'#1A0E00', color:T, fontSize:'0.8rem' }},
        (data.goods||[]).map(g => React.createElement('option', { key:g, value:g }, g))
      )
    );

  const DealCard = ({ deal, showActions, isIncoming }) =>
    React.createElement('div', { style: cardStyle },
      React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }},
        React.createElement('div', null,
          React.createElement('div', { style:{ fontWeight:800, fontSize:'0.88rem', color:T }},
            `🤝 ${deal.proposer_name || deal.proposer_username || 'Anonim'}`),
          React.createElement('div', { style:{ fontSize:'0.65rem', color:M, marginTop:2 }},
            `${new Date(deal.created_at).toLocaleDateString('tr-TR')} · ${deal.notes||''}`)
        ),
        React.createElement('span', { style:{ fontSize:'0.62rem', fontWeight:700, color:statusColor[deal.status], background:statusColor[deal.status]+'18', padding:'3px 8px', borderRadius:20 }},
          statusLabel[deal.status])
      ),
      React.createElement('div', { style:{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }},
        React.createElement('div', { style:{ flex:1, textAlign:'center', background:GR+'12', border:`1px solid ${GR}22`, borderRadius:10, padding:'8px' }},
          React.createElement('div', { style:{ fontSize:'0.62rem', color:GR, fontWeight:700 }}, 'VERİYOR'),
          React.createElement('div', { style:{ fontSize:'0.9rem', fontWeight:800, color:T }}, deal.goods_offered),
          React.createElement('div', { style:{ fontSize:'0.68rem', color:M }}, `× ${deal.amount_offered}`)
        ),
        React.createElement('div', { style:{ fontSize:'1.2rem', color:G }}, '⇄'),
        React.createElement('div', { style:{ flex:1, textAlign:'center', background:R+'12', border:`1px solid ${R}22`, borderRadius:10, padding:'8px' }},
          React.createElement('div', { style:{ fontSize:'0.62rem', color:R, fontWeight:700 }}, 'İSTİYOR'),
          React.createElement('div', { style:{ fontSize:'0.9rem', fontWeight:800, color:T }}, deal.goods_requested),
          React.createElement('div', { style:{ fontSize:'0.68rem', color:M }}, `× ${deal.amount_requested}`)
        )
      ),
      showActions && deal.status === 'pending' && React.createElement('div', { style:{ display:'flex', gap:6 }},
        React.createElement('button', { onClick:()=>accept(deal.id),
          style:{ flex:2, padding:'8px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${GR},#2E6B42)`, color:'#fff', fontWeight:700, cursor:'pointer' }},
          '✅ Kabul Et'),
        React.createElement('button', { onClick:()=>reject(deal.id),
          style:{ flex:1, padding:'8px', borderRadius:9, border:`1px solid ${R}44`, background:'transparent', color:R, cursor:'pointer', fontWeight:600 }},
          '❌ Reddet')
      ),
      !showActions && deal.status === 'pending' && React.createElement('button', { onClick:()=>accept(deal.id),
        style:{ width:'100%', padding:'8px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${G},#A07828)`, color:'#0F0800', fontWeight:700, cursor:'pointer' }},
        '🤝 Bu Anlaşmayı Kabul Et')
    );

  return React.createElement('div', { style:{ minHeight:'100vh', background:BG, fontFamily:"'Inter',sans-serif", paddingBottom:80 }},
    // Header
    React.createElement('div', { style:{ background:'linear-gradient(135deg,#0f0800,#2a1500)', borderBottom:'1px solid rgba(200,155,60,0.2)', padding:'14px 16px' }},
      React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between' }},
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:10 }},
          onNavigate && React.createElement('button', { onClick:()=>onNavigate('home'),
            style:{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'6px 10px', color:M, fontSize:'0.75rem', cursor:'pointer' }}, '← Geri'),
          React.createElement('span', { style:{ fontSize:'1.5rem' }}, '🤝'),
          React.createElement('div', null,
            React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontWeight:900, fontSize:'1.1rem', color:G }}, 'Lonca Anlaşmaları'),
            React.createElement('div', { style:{ fontSize:'0.62rem', color:M }}, `Gelen Teklif: ${data.incoming?.length || 0}`)
          )
        ),
        React.createElement('button', { onClick:()=>setShowNew(true),
          style:{ background:G, color:'#0F0800', border:'none', borderRadius:9, padding:'8px 14px', fontWeight:700, fontSize:'0.78rem', cursor:'pointer' }}, '+ Teklif')
      )
    ),

    // Sekmeler
    React.createElement('div', { style:{ display:'flex', gap:4, padding:'12px 12px 0' }},
      [['open','🌐 Açık'], ['incoming','📥 Gelen'], ['mine','📤 Tekliflerim']].map(([k,l]) =>
        React.createElement('button', { key:k, onClick:()=>setTab(k),
          style:{ flex:1, padding:'8px 4px', borderRadius:10, border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.72rem',
            background: tab===k ? G : 'rgba(255,255,255,0.05)', color: tab===k ? '#0F0800' : M }}, l)
      )
    ),

    React.createElement('div', { style:{ padding:'12px' }},
      tab === 'open' && React.createElement('div', null,
        data.open?.length === 0
          ? React.createElement('div', { style:{ textAlign:'center', color:M, padding:'40px 20px' }},
              React.createElement('div', { style:{ fontSize:'3rem', marginBottom:12 }}, '🤝'),
              React.createElement('div', { style:{ fontSize:'0.9rem', color:T, marginBottom:8 }}, 'Açık Teklif Yok'),
              React.createElement('button', { onClick:()=>setShowNew(true),
                style:{ background:G, color:'#0F0800', border:'none', borderRadius:9, padding:'9px 20px', fontWeight:700, cursor:'pointer' }}, '+ İlk Teklifi Oluştur')
            )
          : data.open.map(d => React.createElement(DealCard, { key:d.id, deal:d, showActions:false }))
      ),
      tab === 'incoming' && React.createElement('div', null,
        data.incoming?.length === 0
          ? React.createElement('div', { style:{ textAlign:'center', color:M, padding:'40px' }}, 'Gelen teklif yok')
          : data.incoming.map(d => React.createElement(DealCard, { key:d.id, deal:d, showActions:true, isIncoming:true }))
      ),
      tab === 'mine' && React.createElement('div', null,
        data.mine?.length === 0
          ? React.createElement('div', { style:{ textAlign:'center', color:M, padding:'40px' }}, 'Henüz teklif vermediniz')
          : data.mine.map(d => React.createElement(DealCard, { key:d.id, deal:d, showActions:false }))
      )
    ),

    // Yeni teklif modal
    showNew && React.createElement('div', { style:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'1rem' }},
      React.createElement('div', { style:{ background:'#1A0E00', borderRadius:16, padding:'1.5rem', maxWidth:400, width:'100%', border:`1px solid ${G}33`, maxHeight:'85vh', overflowY:'auto', boxShadow:`0 16px 64px rgba(0,0,0,0.7)` }},
        React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'1.1rem', fontWeight:800, color:G, marginBottom:16 }}, '🤝 Yeni Anlaşma Teklifi'),
        React.createElement('div', { style:{ display:'flex', gap:8, marginBottom:12 }},
          React.createElement(GoodsSelect, { label:'Sen Veriyorsun', val:form.goods_offered, onChange:v=>setForm(p=>({...p,goods_offered:v})) }),
          React.createElement('div', { style:{ flex:0.7 }},
            React.createElement('div', { style:{ fontSize:'0.65rem', color:M, marginBottom:4 }}, 'Miktar'),
            React.createElement('input', { type:'number', min:1, max:9999, value:form.amount_offered, onChange:e=>setForm(p=>({...p,amount_offered:parseInt(e.target.value)||1})),
              style:{ width:'100%', padding:'8px', borderRadius:8, border:'1px solid rgba(200,155,60,0.25)', background:'#1A0E00', color:T, fontSize:'0.8rem' }})
          )
        ),
        React.createElement('div', { style:{ textAlign:'center', color:G, fontSize:'1.2rem', marginBottom:10 }}, '⇄'),
        React.createElement('div', { style:{ display:'flex', gap:8, marginBottom:12 }},
          React.createElement(GoodsSelect, { label:'Karşılığında', val:form.goods_requested, onChange:v=>setForm(p=>({...p,goods_requested:v})) }),
          React.createElement('div', { style:{ flex:0.7 }},
            React.createElement('div', { style:{ fontSize:'0.65rem', color:M, marginBottom:4 }}, 'Miktar'),
            React.createElement('input', { type:'number', min:1, max:9999, value:form.amount_requested, onChange:e=>setForm(p=>({...p,amount_requested:parseInt(e.target.value)||1})),
              style:{ width:'100%', padding:'8px', borderRadius:8, border:'1px solid rgba(200,155,60,0.25)', background:'#1A0E00', color:T, fontSize:'0.8rem' }})
          )
        ),
        React.createElement('div', { style:{ marginBottom:16 }},
          React.createElement('div', { style:{ fontSize:'0.65rem', color:M, marginBottom:4 }}, 'Not (isteğe bağlı)'),
          React.createElement('input', { type:'text', value:form.notes, onChange:e=>setForm(p=>({...p,notes:e.target.value})), placeholder:'Anlaşma hakkında not…',
            style:{ width:'100%', padding:'8px', borderRadius:8, border:'1px solid rgba(200,155,60,0.25)', background:'#1A0E00', color:T, fontSize:'0.8rem', boxSizing:'border-box' }})
        ),
        React.createElement('div', { style:{ display:'flex', gap:8 }},
          React.createElement('button', { onClick:()=>setShowNew(false),
            style:{ flex:1, padding:'10px', borderRadius:9, border:`1px solid ${G}44`, background:'transparent', color:M, cursor:'pointer' }}, 'İptal'),
          React.createElement('button', { onClick:propose,
            style:{ flex:2, padding:'10px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${G},#A07828)`, color:'#0F0800', fontWeight:700, cursor:'pointer' }}, '🤝 Teklif Gönder')
        )
      )
    )
  );
};
