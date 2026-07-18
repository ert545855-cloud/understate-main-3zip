// Düello Meydanı Ekranı
window.DuelMeydaniScreen = function DuelMeydaniScreen({ profile, token, onlinePlayers }) {
  const [tab, setTab] = React.useState('acik');
  const [openDuels, setOpenDuels] = React.useState([]);
  const [myDuels, setMyDuels] = React.useState([]);
  const [targetId, setTargetId] = React.useState('');
  const [betAmount, setBetAmount] = React.useState(100);
  const [loading, setLoading] = React.useState('');
  const [msg, setMsg] = React.useState({ text:'', ok:true });

  const ds = { bg:'#0D1117', surface:'rgba(255,255,255,0.04)', gold:'#C9A227', border:'rgba(255,255,255,0.08)', text:'#EDE7DA', muted:'#8893A1', red:'#FF6B6B', green:'#4CAF50' };

  const fetchDuels = async () => {
    try {
      const r = await fetch('/api/duel/list', { headers:{'Authorization':'Bearer '+token} });
      const d = await r.json();
      if (d.success) { setOpenDuels(d.open); setMyDuels(d.mine); }
    } catch {}
  };

  React.useEffect(() => {
    fetchDuels();
    const iv = setInterval(fetchDuels, 8000);
    if (window._socket) {
      window._socket.on('duel:result', fetchDuels);
      window._socket.on('duel:challenge', (data) => {
        window._pushGameEvent && window._pushGameEvent({ type:'duel', text:`⚔️ ${data.from} sana düello meydan okudu! (Bahis: ${data.bet} 🪙)`, ts: Date.now() });
        fetchDuels();
      });
    }
    return () => { clearInterval(iv); if(window._socket){ window._socket.off('duel:result'); window._socket.off('duel:challenge'); } };
  }, []);

  const show = (text, ok=true) => { setMsg({ text, ok }); setTimeout(() => setMsg({ text:'', ok:true }), 4000); };

  const challenge = async () => {
    if (!targetId) return show('Rakip seç', false);
    setLoading('challenge');
    try {
      const r = await fetch('/api/duel/challenge', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: JSON.stringify({ targetId, betAmount: parseInt(betAmount)||0 })
      });
      const d = await r.json();
      if (d.success) { show('⚔️ Düello daveti gönderildi!'); fetchDuels(); }
      else show(d.message || 'Hata', false);
    } catch { show('Sunucu hatası', false); }
    setLoading('');
  };

  const respond = async (duelId, accept) => {
    setLoading(duelId);
    try {
      const r = await fetch('/api/duel/respond', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: JSON.stringify({ duelId, accept })
      });
      const d = await r.json();
      if (d.success) {
        if (d.status === 'completed') show(`${d.challengerWins ? '🏆 Davetçi' : '🥊 Rakip'} kazandı! Güç: ${d.challengerPower} vs ${d.challengedPower}. Ödül: ${d.prize} 🪙`);
        else show('❌ Düello reddedildi');
        fetchDuels();
      } else show(d.message || 'Hata', false);
    } catch { show('Hata', false); }
    setLoading('');
  };

  const statusColor = (s) => s === 'completed' ? ds.green : s === 'declined' ? ds.red : s === 'expired' ? ds.muted : ds.gold;
  const statusLabel = (s) => ({ pending:'⏳ Bekliyor', accepted:'⚔️ Dövüşüldü', completed:'✅ Tamamlandı', declined:'❌ Reddedildi', expired:'💤 Süresi Doldu' })[s] || s;

  return React.createElement('div', { style:{ minHeight:'100vh', background:ds.bg, padding:'1rem', paddingBottom:'5rem', color:ds.text }},
    React.createElement('div', { style:{ display:'flex', gap:'6px', marginBottom:'1rem' }},
      ['acik','benimkiler','meydan_oku'].map(t =>
        React.createElement('button', { key:t, onClick:()=>setTab(t),
          style:{ flex:1, padding:'7px 4px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.75rem',
            background: tab===t ? ds.gold : ds.surface, color: tab===t ? '#000' : ds.muted }},
          t==='acik' ? '⚔️ Açık' : t==='benimkiler' ? '📋 Benimkiler' : '🥊 Meydan Oku'
        )
      )
    ),

    msg.text && React.createElement('div', { style:{ background: msg.ok ? 'rgba(201,162,39,0.12)' : 'rgba(255,80,80,0.1)', border:`1px solid ${msg.ok ? ds.gold : ds.red}`, borderRadius:'8px', padding:'10px 14px', marginBottom:'1rem', fontSize:'0.82rem', color: msg.ok ? ds.gold : ds.red }}, msg.text),

    tab === 'acik' && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'8px' }},
      !openDuels.length && React.createElement('div', { style:{ textAlign:'center', padding:'3rem', color:ds.muted }}, '⚔️ Açık düello yok. Sen bir tane oluştur!'),
      openDuels.map(d => {
        const isChallenger = d.challenger_id === profile?.id;
        const isChallenged = d.challenged_id === profile?.id;
        return React.createElement('div', { key:d.id,
          style:{ background:ds.surface, border:`1px solid rgba(201,162,39,0.2)`, borderRadius:'12px', padding:'12px' }},
          React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }},
            React.createElement('div', null,
              React.createElement('div', { style:{ fontWeight:700 }}, `⚔️ ${d.challenger_name} vs ${d.challenged_name}`),
              React.createElement('div', { style:{ fontSize:'0.75rem', color:ds.muted }}, `Bahis: ${d.bet_amount} 🪙`)
            ),
            React.createElement('span', { style:{ fontSize:'0.72rem', color:ds.gold }}, statusLabel(d.status))
          ),
          isChallenged && d.status === 'pending' && React.createElement('div', { style:{ display:'flex', gap:'8px' }},
            React.createElement('button', { onClick:()=>respond(d.id, true), disabled:loading===d.id,
              style:{ flex:1, padding:'7px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, background:'rgba(80,200,80,0.15)', color:ds.green }},
              '✅ Kabul Et'
            ),
            React.createElement('button', { onClick:()=>respond(d.id, false), disabled:loading===d.id,
              style:{ flex:1, padding:'7px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, background:'rgba(255,80,80,0.12)', color:ds.red }},
              '❌ Reddet'
            )
          )
        );
      })
    ),

    tab === 'benimkiler' && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'8px' }},
      !myDuels.length && React.createElement('div', { style:{ textAlign:'center', padding:'3rem', color:ds.muted }}, '📋 Henüz düello yok.'),
      myDuels.map(d =>
        React.createElement('div', { key:d.id, style:{ background:ds.surface, border:`1px solid ${ds.border}`, borderRadius:'12px', padding:'12px' }},
          React.createElement('div', { style:{ display:'flex', justifyContent:'space-between' }},
            React.createElement('div', null,
              React.createElement('div', { style:{ fontWeight:700 }}, `${d.challenger_name} vs ${d.challenged_name}`),
              React.createElement('div', { style:{ fontSize:'0.75rem', color:ds.muted }}, `Bahis: ${d.bet_amount} 🪙`)
            ),
            React.createElement('span', { style:{ fontSize:'0.75rem', fontWeight:700, color:statusColor(d.status) }}, statusLabel(d.status))
          )
        )
      )
    ),

    tab === 'meydan_oku' && React.createElement('div', { style:{ background:ds.surface, border:`1px solid ${ds.border}`, borderRadius:'12px', padding:'16px' }},
      React.createElement('div', { style:{ fontWeight:700, marginBottom:'12px' }}, '🥊 Düello Meydan Oku'),
      React.createElement('div', { style:{ marginBottom:'10px' }},
        React.createElement('label', { style:{ fontSize:'0.8rem', color:ds.muted, display:'block', marginBottom:'4px' }}, 'Rakip seç:'),
        React.createElement('select', {
          value: targetId, onChange: e => setTargetId(e.target.value),
          style:{ width:'100%', padding:'8px', borderRadius:'8px', background:'rgba(255,255,255,0.06)', border:`1px solid ${ds.border}`, color:ds.text, fontSize:'0.85rem' }},
          React.createElement('option', { value:'' }, '-- Rakip Seç --'),
          (onlinePlayers||[]).filter(p => p.id !== profile?.id).map(p =>
            React.createElement('option', { key:p.id, value:p.id }, `${p.username} (Lv.${p.level})`)
          )
        )
      ),
      React.createElement('div', { style:{ marginBottom:'14px' }},
        React.createElement('label', { style:{ fontSize:'0.8rem', color:ds.muted, display:'block', marginBottom:'4px' }}, `Bahis: ${betAmount} 🪙`),
        React.createElement('input', { type:'range', min:0, max:Math.min(5000, profile?.money||0), step:50,
          value:betAmount, onChange:e=>setBetAmount(e.target.value),
          style:{ width:'100%', accentColor:ds.gold }})
      ),
      React.createElement('button', { onClick:challenge, disabled:loading==='challenge',
        style:{ width:'100%', padding:'10px', borderRadius:'10px', border:'none', cursor:'pointer', fontWeight:700, background:ds.gold, color:'#000' }},
        loading==='challenge' ? '⏳ Gönderiliyor...' : `⚔️ Meydan Oku${betAmount>0?` (${betAmount} 🪙 bahis)`:''}`
      )
    )
  );
};
