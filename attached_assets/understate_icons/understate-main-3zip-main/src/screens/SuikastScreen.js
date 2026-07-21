// Suikast Kontratı Ekranı
window.SuikastScreen = function SuikastScreen({ profile, token, onlinePlayers }) {
  const [contracts, setContracts] = React.useState([]);
  const [targetId, setTargetId] = React.useState('');
  const [reward, setReward] = React.useState(500);
  const [tab, setTab] = React.useState('liste');
  const [loading, setLoading] = React.useState('');
  const [msg, setMsg] = React.useState({ text:'', ok:true });

  const ds = { bg:'#0D1117', surface:'rgba(255,255,255,0.04)', gold:'#C9A227', border:'rgba(255,255,255,0.08)', text:'#EDE7DA', muted:'#8893A1', red:'#FF6B6B', green:'#4CAF50' };

  const fetchContracts = async () => {
    try {
      const r = await fetch('/api/assassination/list', { headers:{'Authorization':'Bearer '+token} });
      const d = await r.json();
      if (d.success) setContracts(d.contracts);
    } catch {}
  };

  React.useEffect(() => {
    fetchContracts();
    const iv = setInterval(fetchContracts, 12000);
    if (window._socket) {
      window._socket.on('assassination:new', fetchContracts);
      window._socket.on('assassination:completed', (data) => {
        window._pushGameEvent && window._pushGameEvent({ type:'crime', text:`💀 ${data.killer} → ${data.target} suikastı gerçekleştirdi! (${data.reward} 🪙)`, ts:Date.now() });
        fetchContracts();
      });
    }
    return () => { clearInterval(iv); if(window._socket){ window._socket.off('assassination:new'); window._socket.off('assassination:completed'); } };
  }, []);

  const show = (text, ok=true) => { setMsg({ text, ok }); setTimeout(() => setMsg({ text:'', ok:true }), 5000); };

  const postContract = async () => {
    if (!targetId) return show('Hedef seç', false);
    if (parseInt(reward) < 100) return show('Ödül en az 100 🪙 olmalı', false);
    setLoading('post');
    try {
      const r = await fetch('/api/assassination/post', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: JSON.stringify({ targetId, reward: parseInt(reward) })
      });
      const d = await r.json();
      if (d.success) { show('💀 Suikast kontratı yayınlandı!'); fetchContracts(); setTargetId(''); }
      else show(d.message || 'Hata', false);
    } catch { show('Sunucu hatası', false); }
    setLoading('');
  };

  const claimContract = async (contractId) => {
    setLoading(contractId);
    try {
      const r = await fetch('/api/assassination/claim', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: JSON.stringify({ contractId })
      });
      const d = await r.json();
      show(d.message || (d.success ? '✅ Başarılı!' : '❌ Başarısız'), d.success);
      if (d.success) fetchContracts();
    } catch { show('Hata', false); }
    setLoading('');
  };

  const timeLeft = (exp) => {
    const diff = new Date(exp) - new Date();
    if (diff <= 0) return '0s';
    const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000);
    return `${h}s ${m}dk`;
  };

  return React.createElement('div', { style:{ minHeight:'100vh', background:ds.bg, padding:'1rem', paddingBottom:'5rem', color:ds.text }},
    React.createElement('div', { style:{ display:'flex', gap:'8px', marginBottom:'1rem' }},
      ['liste','yayinla'].map(t =>
        React.createElement('button', { key:t, onClick:()=>setTab(t),
          style:{ flex:1, padding:'8px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.85rem',
            background: tab===t ? '#8B0000' : ds.surface, color: tab===t ? '#FFD0D0' : ds.muted }},
          t==='liste' ? '💀 Aktif Kontratlar' : '🗡️ Kontrat Yayınla'
        )
      )
    ),

    msg.text && React.createElement('div', { style:{ background: msg.ok ? 'rgba(80,200,80,0.1)' : 'rgba(255,80,80,0.1)', border:`1px solid ${msg.ok ? ds.green : ds.red}`, borderRadius:'8px', padding:'10px 14px', marginBottom:'1rem', fontSize:'0.82rem', color: msg.ok ? ds.green : ds.red }}, msg.text),

    tab === 'liste' && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'8px' }},
      !contracts.length && React.createElement('div', { style:{ textAlign:'center', padding:'3rem', color:ds.muted }}, '💀 Aktif kontrat yok.'),
      contracts.map(c => {
        const isTarget = String(c.target_id) === String(profile?.id);
        const isPoster = String(c.poster_id) === String(profile?.id);
        return React.createElement('div', { key:c.id,
          style:{ background: isTarget ? 'rgba(255,0,0,0.05)' : ds.surface, border:`1px solid ${isTarget ? 'rgba(255,80,80,0.3)' : ds.border}`, borderRadius:'12px', padding:'14px' }},
          React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }},
            React.createElement('div', null,
              React.createElement('div', { style:{ fontWeight:700, color: isTarget ? ds.red : ds.text }},
                `💀 Hedef: ${c.target_name}${isTarget ? ' (SEN!)' : ''}`
              ),
              React.createElement('div', { style:{ fontSize:'0.75rem', color:ds.muted }}, `Yayınlayan: ${c.poster_name} · ${timeLeft(c.expires_at)} kaldı`)
            ),
            React.createElement('div', { style:{ textAlign:'right' }},
              React.createElement('div', { style:{ fontWeight:900, fontSize:'1.1rem', color:ds.gold }}, `${c.reward} 🪙`),
              React.createElement('div', { style:{ fontSize:'0.7rem', color:ds.muted }}, 'Ödül')
            )
          ),
          !isTarget && !isPoster && React.createElement('button', { onClick:()=>claimContract(c.id), disabled:loading===c.id,
            style:{ width:'100%', padding:'8px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, background:'rgba(180,0,0,0.2)', color:ds.red }},
            loading===c.id ? '⚡ Saldırılıyor...' : '🗡️ Suikastı Gerçekleştir'
          ),
          isTarget && React.createElement('div', { style:{ fontSize:'0.78rem', color:ds.red, textAlign:'center', padding:'6px', background:'rgba(255,0,0,0.05)', borderRadius:'6px' }},
            '⚠️ Başına ödül kondu! Dikkatli ol.'
          )
        );
      })
    ),

    tab === 'yayinla' && React.createElement('div', { style:{ background:ds.surface, border:`1px solid ${ds.border}`, borderRadius:'12px', padding:'16px' }},
      React.createElement('div', { style:{ fontWeight:700, marginBottom:'4px' }}, '🗡️ Suikast Kontratı Yayınla'),
      React.createElement('div', { style:{ fontSize:'0.78rem', color:ds.muted, marginBottom:'14px' }}, 'Ödülü havuzdan çekersin. İlk öldüren ödülü alır.'),
      React.createElement('div', { style:{ marginBottom:'10px' }},
        React.createElement('label', { style:{ fontSize:'0.8rem', color:ds.muted, display:'block', marginBottom:'4px' }}, 'Hedef:'),
        React.createElement('select', {
          value:targetId, onChange:e=>setTargetId(e.target.value),
          style:{ width:'100%', padding:'8px', borderRadius:'8px', background:'rgba(255,255,255,0.06)', border:`1px solid ${ds.border}`, color:ds.text }},
          React.createElement('option', { value:'' }, '-- Hedef Seç --'),
          (onlinePlayers||[]).filter(p => String(p.id) !== String(profile?.id)).map(p =>
            React.createElement('option', { key:p.id, value:p.id }, `${p.username} (Lv.${p.level})`)
          )
        )
      ),
      React.createElement('div', { style:{ marginBottom:'14px' }},
        React.createElement('label', { style:{ fontSize:'0.8rem', color:ds.muted, display:'block', marginBottom:'4px' }}, `Ödül: ${reward} 🪙`),
        React.createElement('input', { type:'range', min:100, max:Math.min(50000, profile?.money||0), step:100,
          value:reward, onChange:e=>setReward(e.target.value), style:{ width:'100%', accentColor:'#8B0000' }})
      ),
      React.createElement('button', { onClick:postContract, disabled:loading==='post',
        style:{ width:'100%', padding:'10px', borderRadius:'10px', border:'none', cursor:'pointer', fontWeight:700, background:'#8B0000', color:'#FFD0D0' }},
        loading==='post' ? '⏳ Yayınlanıyor...' : `💀 Kontratı Yayınla (${reward} 🪙)`
      )
    )
  );
};
