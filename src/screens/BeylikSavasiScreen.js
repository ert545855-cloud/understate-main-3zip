// Beylik Savaşı Ekranı
window.BeylikSavasiScreen = function BeylikSavasiScreen({ profile, token, serverBeyliks }) {
  const [wars, setWars] = React.useState([]);
  const [history, setHistory] = React.useState([]);
  const [tab, setTab] = React.useState('aktif');
  const [declareForm, setDeclareForm] = React.useState({ attackerBeylik:'', defenderBeylik:'' });
  const [loading, setLoading] = React.useState('');
  const [msg, setMsg] = React.useState({ text:'', ok:true });

  const ds = { bg:'#0D1117', surface:'rgba(255,255,255,0.04)', gold:'#C9A227', border:'rgba(255,255,255,0.08)', text:'#EDE7DA', muted:'#8893A1', red:'#FF6B6B', green:'#4CAF50' };
  const myBeylik = (serverBeyliks||[]).find(b => b.uyeler?.some(u => u.id === profile?.id) || b.lider === profile?.username);

  const fetchWars = async () => {
    try {
      const [ar, hr] = await Promise.all([
        fetch('/api/beylik-war/list',    { headers:{'Authorization':'Bearer '+token} }),
        fetch('/api/beylik-war/history', { headers:{'Authorization':'Bearer '+token} }),
      ]);
      const [ad, hd] = await Promise.all([ar.json(), hr.json()]);
      if (ad.success) setWars(ad.wars);
      if (hd.success) setHistory(hd.history);
    } catch {}
  };

  React.useEffect(() => {
    fetchWars();
    const iv = setInterval(fetchWars, 10000);
    if (window._socket) {
      window._socket.on('beylik_war:declared', fetchWars);
      window._socket.on('beylik_war:join', fetchWars);
      window._socket.on('beylik_war:resolved', (data) => {
        window._pushGameEvent && window._pushGameEvent({ type:'war', text:`⚜️ Beylik Savaşı bitti! ${data.attacker} ${data.attackerWins ? 'kazandı' : 'kaybetti'} vs ${data.defender}. Ganimet: ${data.spoils} 🪙`, ts:Date.now() });
        fetchWars();
      });
    }
    return () => { clearInterval(iv); if(window._socket){ window._socket.off('beylik_war:declared'); window._socket.off('beylik_war:join'); window._socket.off('beylik_war:resolved'); } };
  }, []);

  const show = (text, ok=true) => { setMsg({ text, ok }); setTimeout(() => setMsg({ text:'', ok:true }), 4000); };

  const declare = async () => {
    if (!declareForm.attackerBeylik || !declareForm.defenderBeylik) return show('Her iki beylik adını gir', false);
    setLoading('declare');
    try {
      const r = await fetch('/api/beylik-war/declare', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: JSON.stringify(declareForm)
      });
      const d = await r.json();
      if (d.success) { show('⚔️ Beylik savaşı ilan edildi!'); fetchWars(); }
      else show(d.message || 'Hata', false);
    } catch { show('Sunucu hatası', false); }
    setLoading('');
  };

  const join = async (warId, side) => {
    setLoading(`${warId}-${side}`);
    try {
      const r = await fetch('/api/beylik-war/join', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: JSON.stringify({ warId, side, beylikName: myBeylik?.ad || (side==='attacker' ? wars.find(w=>w.id===warId)?.attacker_beylik : wars.find(w=>w.id===warId)?.defender_beylik) })
      });
      const d = await r.json();
      if (d.success) { show(`✅ Savaşa katıldın (${side==='attacker'?'Saldıran':'Savunan'})!`); fetchWars(); }
      else show(d.message || 'Hata', false);
    } catch { show('Hata', false); }
    setLoading('');
  };

  const resolve = async (warId) => {
    try {
      const r = await fetch(`/api/beylik-war/resolve/${warId}`, {
        method:'POST', headers:{'Authorization':'Bearer '+token}
      });
      const d = await r.json();
      show(d.success ? (d.attackerWins ? `🏆 Saldıranlar kazandı! Ganimet: ${d.spoils} 🪙` : '🛡️ Savunanlar kazandı!') : d.message, d.success);
      if (d.success) fetchWars();
    } catch {}
    setTimeout(() => setMsg({ text:'', ok:true }), 4000);
  };

  const timeLeft = (e) => { const d=new Date(e)-new Date(); if(d<=0) return 'Süresi doldu'; const h=Math.floor(d/3600000),m=Math.floor((d%3600000)/60000); return h>0?`${h}s ${m}dk`:`${m}dk`; };

  return React.createElement('div', { style:{ minHeight:'100vh', background:ds.bg, padding:'1rem', paddingBottom:'5rem', color:ds.text }},
    React.createElement('div', { style:{ display:'flex', gap:'6px', marginBottom:'1rem' }},
      ['aktif','gecmis','ilan_et'].map(t =>
        React.createElement('button', { key:t, onClick:()=>setTab(t),
          style:{ flex:1, padding:'7px 4px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.75rem',
            background: tab===t ? ds.gold : ds.surface, color: tab===t ? '#000' : ds.muted }},
          { aktif:`⚔️ Aktif (${wars.length})`, gecmis:'📜 Geçmiş', ilan_et:'⚜️ İlan Et' }[t]
        )
      )
    ),

    msg.text && React.createElement('div', { style:{ background: msg.ok ? 'rgba(201,162,39,0.12)' : 'rgba(255,80,80,0.1)', border:`1px solid ${msg.ok ? ds.gold : ds.red}`, borderRadius:'8px', padding:'10px 14px', marginBottom:'1rem', fontSize:'0.82rem', color: msg.ok ? ds.gold : ds.red }}, msg.text),

    tab === 'aktif' && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'10px' }},
      !wars.length && React.createElement('div', { style:{ textAlign:'center', padding:'3rem', color:ds.muted }}, '⚔️ Aktif beylik savaşı yok. Sen başlat!'),
      wars.map(w => {
        const ended = new Date(w.ends_at) <= new Date();
        return React.createElement('div', { key:w.id, style:{ background:ds.surface, border:`1px solid rgba(201,162,39,0.25)`, borderRadius:'12px', padding:'14px' }},
          React.createElement('div', { style:{ fontWeight:700, marginBottom:'8px', fontSize:'0.95rem' }},
            `⚜️ ${w.attacker_beylik} ⚔️ ${w.defender_beylik}`
          ),
          React.createElement('div', { style:{ display:'flex', gap:'8px', marginBottom:'8px' }},
            React.createElement('div', { style:{ flex:1, background:'rgba(255,80,80,0.08)', borderRadius:'8px', padding:'8px', textAlign:'center' }},
              React.createElement('div', { style:{ fontSize:'0.7rem', color:ds.muted }}, '⚔️ Saldıran'),
              React.createElement('div', { style:{ fontWeight:700, color:ds.red, fontSize:'1.1rem' }}, w.attacker_power || 0)
            ),
            React.createElement('div', { style:{ flex:1, background:'rgba(80,200,80,0.08)', borderRadius:'8px', padding:'8px', textAlign:'center' }},
              React.createElement('div', { style:{ fontSize:'0.7rem', color:ds.muted }}, '🛡️ Savunan'),
              React.createElement('div', { style:{ fontWeight:700, color:ds.green, fontSize:'1.1rem' }}, w.defender_power || 0)
            )
          ),
          React.createElement('div', { style:{ fontSize:'0.75rem', color:ds.muted, marginBottom:'8px', textAlign:'center' }}, `⏱ ${timeLeft(w.ends_at)}`),
          !ended && React.createElement('div', { style:{ display:'flex', gap:'6px' }},
            ['attacker','defender'].map(side =>
              React.createElement('button', { key:side, onClick:()=>join(w.id, side), disabled:loading===`${w.id}-${side}`,
                style:{ flex:1, padding:'8px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.78rem',
                  background: side==='attacker' ? 'rgba(255,80,80,0.15)' : 'rgba(80,200,80,0.15)',
                  color: side==='attacker' ? ds.red : ds.green }},
                side==='attacker' ? '⚔️ Saldır' : '🛡️ Savun'
              )
            )
          ),
          ended && React.createElement('button', { onClick:()=>resolve(w.id),
            style:{ width:'100%', marginTop:'6px', padding:'8px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, background:ds.gold, color:'#000' }},
            '⚡ Sonucu Belirle'
          )
        );
      })
    ),

    tab === 'gecmis' && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'8px' }},
      !history.length && React.createElement('div', { style:{ textAlign:'center', padding:'3rem', color:ds.muted }}, '📜 Geçmiş savaş yok.'),
      history.map(w =>
        React.createElement('div', { key:w.id, style:{ background:ds.surface, border:`1px solid ${ds.border}`, borderRadius:'10px', padding:'12px', display:'flex', justifyContent:'space-between' }},
          React.createElement('div', null,
            React.createElement('div', { style:{ fontWeight:700 }}, `${w.attacker_beylik} vs ${w.defender_beylik}`),
            React.createElement('div', { style:{ fontSize:'0.75rem', color:ds.muted }}, new Date(w.created_at).toLocaleDateString('tr-TR'))
          ),
          React.createElement('div', { style:{ textAlign:'right' }},
            React.createElement('div', { style:{ fontWeight:700, color: w.status==='attacker_won' ? ds.red : ds.green }},
              w.status==='attacker_won' ? '⚔️ Saldıran kazandı' : '🛡️ Savunan kazandı'
            ),
            w.spoils_money > 0 && React.createElement('div', { style:{ fontSize:'0.75rem', color:ds.gold }}, `Ganimet: ${w.spoils_money} 🪙`)
          )
        )
      )
    ),

    tab === 'ilan_et' && React.createElement('div', { style:{ background:ds.surface, border:`1px solid ${ds.border}`, borderRadius:'12px', padding:'16px' }},
      React.createElement('div', { style:{ fontWeight:700, marginBottom:'12px' }}, '⚜️ Beylik Savaşı İlan Et'),
      ['attackerBeylik','defenderBeylik'].map(field =>
        React.createElement('div', { key:field, style:{ marginBottom:'10px' }},
          React.createElement('label', { style:{ fontSize:'0.8rem', color:ds.muted, display:'block', marginBottom:'4px' }},
            field==='attackerBeylik' ? '⚔️ Saldıran Beylik:' : '🛡️ Savunan Beylik:'
          ),
          React.createElement('select', {
            value: declareForm[field], onChange:e=>setDeclareForm(prev=>({...prev,[field]:e.target.value})),
            style:{ width:'100%', padding:'8px', borderRadius:'8px', background:'rgba(255,255,255,0.06)', border:`1px solid ${ds.border}`, color:ds.text }},
            React.createElement('option', { value:'' }, '-- Beylik Seç --'),
            (serverBeyliks||[]).map(b =>
              React.createElement('option', { key:b.id||b.ad, value:b.ad }, b.ad)
            )
          )
        )
      ),
      React.createElement('button', { onClick:declare, disabled:loading==='declare',
        style:{ width:'100%', padding:'10px', borderRadius:'10px', border:'none', cursor:'pointer', fontWeight:700, background:ds.gold, color:'#000' }},
        loading==='declare' ? '⏳ İlan ediliyor...' : '⚔️ Savaş İlan Et'
      )
    )
  );
};
