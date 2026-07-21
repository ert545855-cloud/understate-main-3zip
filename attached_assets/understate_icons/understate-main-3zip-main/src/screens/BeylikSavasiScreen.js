// Beylik Savaşı Ekranı — Warm Ottoman v11 savaş kartı tasarımı
window.BeylikSavasiScreen = function BeylikSavasiScreen({ profile, token, serverBeyliks }) {
  const [wars, setWars] = React.useState([]);
  const [history, setHistory] = React.useState([]);
  const [tab, setTab] = React.useState('aktif');
  const [declareForm, setDeclareForm] = React.useState({ attackerBeylik:'', defenderBeylik:'' });
  const [loading, setLoading] = React.useState('');
  const [msg, setMsg] = React.useState({ text:'', ok:true });

  const ds = { gold:'var(--accent)', goldLight:'var(--accent-light)', border:'var(--border)', text:'var(--text)', muted:'var(--text-muted)', red:'var(--red)', green:'var(--green)' };
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

  // ── Savaş Kartı ──
  const WarCard = (w) => {
    const ended = new Date(w.ends_at) <= new Date();
    const aPow = Number(w.attacker_power) || 0;
    const dPow = Number(w.defender_power) || 0;
    const total = aPow + dPow;
    const aPct = total > 0 ? Math.round((aPow / total) * 100) : 50;

    return React.createElement('div', { key:w.id, className:`war-card${ended ? ' ended' : ''}` },
      // Başlık şeridi
      React.createElement('div', { className:'war-card-header' },
        React.createElement('span', { className:'war-card-title' }, '⚜ Beylik Savaşı'),
        React.createElement('span', { className:`war-status-chip ${ended ? 'done' : 'live'}` },
          ended ? '🏁 Sona Erdi' : '🔴 Canlı'
        )
      ),

      // VS satırı
      React.createElement('div', { className:'war-vs-row' },
        React.createElement('div', { className:'war-side attacker' },
          React.createElement('span', { className:'war-side-role' }, 'Saldıran'),
          React.createElement('span', { className:'war-side-name', title:w.attacker_beylik }, w.attacker_beylik),
          React.createElement('span', { className:'war-side-power' }, aPow.toLocaleString('tr-TR'))
        ),
        React.createElement('div', { className:'war-vs-badge' }, '⚔️'),
        React.createElement('div', { className:'war-side defender' },
          React.createElement('span', { className:'war-side-role' }, 'Savunan'),
          React.createElement('span', { className:'war-side-name', title:w.defender_beylik }, w.defender_beylik),
          React.createElement('span', { className:'war-side-power' }, dPow.toLocaleString('tr-TR'))
        )
      ),

      // Güç dengesi çubuğu
      React.createElement('div', { className:'war-power-track', role:'img', 'aria-label':`Güç dengesi: saldıran %${aPct}` },
        React.createElement('div', { className:'war-power-fill-a', style:{ width:`${aPct}%` } }),
        React.createElement('div', { className:'war-power-fill-d' })
      ),

      // Süre
      React.createElement('div', { className:'war-card-meta' },
        React.createElement('span', null, '⏱'),
        React.createElement('span', null, timeLeft(w.ends_at))
      ),

      // Aksiyonlar
      React.createElement('div', { className:'war-card-actions' },
        !ended && React.createElement('button', {
          className:'war-btn attack', onClick:()=>join(w.id, 'attacker'), disabled:loading===`${w.id}-attacker`
        }, loading===`${w.id}-attacker` ? '⏳...' : '⚔️ Saldır'),
        !ended && React.createElement('button', {
          className:'war-btn defend', onClick:()=>join(w.id, 'defender'), disabled:loading===`${w.id}-defender`
        }, loading===`${w.id}-defender` ? '⏳...' : '🛡️ Savun'),
        ended && React.createElement('button', {
          className:'war-btn resolve', onClick:()=>resolve(w.id)
        }, '⚡ Sonucu Belirle')
      )
    );
  };

  return React.createElement('div', { style:{ minHeight:'100vh', padding:'1rem', paddingBottom:'5rem', color:ds.text }},
    // Sekmeler
    React.createElement('div', { className:'war-tabs' },
      ['aktif','gecmis','ilan_et'].map(t =>
        React.createElement('button', { key:t, onClick:()=>setTab(t), className:`war-tab${tab===t ? ' active' : ''}` },
          { aktif:`⚔️ Aktif (${wars.length})`, gecmis:'📜 Geçmiş', ilan_et:'⚜️ İlan Et' }[t]
        )
      )
    ),

    msg.text && React.createElement('div', { style:{ background: msg.ok ? 'rgba(200,155,60,0.12)' : 'var(--red-light)', border:`1px solid ${msg.ok ? ds.gold : ds.red}`, borderRadius:'10px', padding:'10px 14px', marginBottom:'1rem', fontSize:'0.82rem', color: msg.ok ? ds.goldLight : 'var(--red-light2)' }}, msg.text),

    // ── Aktif savaşlar ──
    tab === 'aktif' && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'12px' }},
      !wars.length && React.createElement('div', { className:'war-empty' },
        React.createElement('span', { className:'war-empty-icon' }, '⚔️'),
        React.createElement('div', { className:'war-empty-title' }, 'Cephe Sessiz'),
        React.createElement('div', { style:{ fontSize:'0.8rem' }}, 'Aktif beylik savaşı yok. İlk kılıcı sen çek!')
      ),
      wars.map(WarCard)
    ),

    // ── Geçmiş ──
    tab === 'gecmis' && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'8px' }},
      !history.length && React.createElement('div', { className:'war-empty' },
        React.createElement('span', { className:'war-empty-icon' }, '📜'),
        React.createElement('div', { className:'war-empty-title' }, 'Vakayiname Boş'),
        React.createElement('div', { style:{ fontSize:'0.8rem' }}, 'Henüz kayda geçmiş bir savaş yok.')
      ),
      history.map(w =>
        React.createElement('div', { key:w.id, className:`war-history-row ${w.status==='attacker_won' ? 'attacker-won' : 'defender-won'}` },
          React.createElement('div', { style:{ minWidth:0 }},
            React.createElement('div', { style:{ fontWeight:700, fontFamily:"'Cinzel',serif", fontSize:'0.85rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}, `${w.attacker_beylik} ⚔ ${w.defender_beylik}`),
            React.createElement('div', { style:{ fontSize:'0.72rem', color:ds.muted, marginTop:'2px' }}, new Date(w.created_at).toLocaleDateString('tr-TR'))
          ),
          React.createElement('div', { style:{ textAlign:'right', flexShrink:0 }},
            React.createElement('div', { style:{ fontWeight:700, fontSize:'0.78rem', color: w.status==='attacker_won' ? ds.red : ds.green }},
              w.status==='attacker_won' ? '⚔️ Saldıran kazandı' : '🛡️ Savunan kazandı'
            ),
            w.spoils_money > 0 && React.createElement('div', { style:{ fontSize:'0.72rem', color:ds.goldLight, marginTop:'2px' }}, `Ganimet: ${Number(w.spoils_money).toLocaleString('tr-TR')} 🪙`)
          )
        )
      )
    ),

    // ── İlan et ──
    tab === 'ilan_et' && React.createElement('div', { className:'war-card', style:{ padding:'16px' }},
      React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontWeight:700, marginBottom:'4px', color:ds.goldLight, letterSpacing:'1px' }}, '⚜️ Beylik Savaşı İlan Et'),
      React.createElement('p', { style:{ fontSize:'0.75rem', color:ds.muted, margin:'0 0 14px' }}, 'İki beylik arasında savaş başlat. Oyuncular taraflarını seçerek güç katar.'),
      ['attackerBeylik','defenderBeylik'].map(field =>
        React.createElement('div', { key:field, style:{ marginBottom:'10px' }},
          React.createElement('label', { style:{ fontSize:'0.78rem', color: field==='attackerBeylik' ? ds.red : ds.green, display:'block', marginBottom:'4px', fontWeight:600 }},
            field==='attackerBeylik' ? '⚔️ Saldıran Beylik' : '🛡️ Savunan Beylik'
          ),
          React.createElement('select', {
            value: declareForm[field], onChange:e=>setDeclareForm(prev=>({...prev,[field]:e.target.value})),
            style:{ width:'100%', padding:'10px', borderRadius:'10px', background:'rgba(0,0,0,0.3)', border:`1px solid ${ds.border}`, color:ds.text, fontSize:'0.85rem' }},
            React.createElement('option', { value:'' }, '-- Beylik Seç --'),
            (serverBeyliks||[]).map(b =>
              React.createElement('option', { key:b.id||b.ad, value:b.ad }, b.ad)
            )
          )
        )
      ),
      React.createElement('button', { className:'war-btn resolve', onClick:declare, disabled:loading==='declare', style:{ width:'100%', marginTop:'4px' }},
        loading==='declare' ? '⏳ İlan ediliyor...' : '⚔️ Savaş İlan Et'
      )
    )
  );
};
