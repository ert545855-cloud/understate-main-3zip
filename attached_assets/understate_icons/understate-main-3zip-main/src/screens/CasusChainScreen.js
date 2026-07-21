// ═══════════════════════════════════════════════════════════════
// SALTANAT ONLINE — Casus Operasyon Zinciri (3 Aşamalı)
// ═══════════════════════════════════════════════════════════════
window.CasusChainScreen = function CasusChainScreen({ profile, onNavigate, showNotif }) {
  const G='#C89B3C', BG='#0F0800', T='#F5EBD7', M='#A9A6A0', S='#2D1800', R='#B8423C', GR='#3E8C5A';
  const jwt = () => localStorage.getItem('us_jwt') || '';

  const [missions, setMissions]   = React.useState([]);
  const [types,    setTypes]      = React.useState({});
  const [tab,      setTab]        = React.useState('active'); // active | history | start
  const [loading,  setLoading]    = React.useState(false);
  const [selType,  setSelType]    = React.useState('kesif');
  const [target,   setTarget]     = React.useState('');
  const [tick,     setTick]       = React.useState(0);

  const STAGE_LABELS = { 1:'İzle', 2:'Raporla', 3:'Sabote Et' };
  const STAGE_ICONS  = { 1:'🔭', 2:'📋', 3:'⚡' };

  React.useEffect(() => {
    const iv = setInterval(() => setTick(p => p+1), 5000);
    return () => clearInterval(iv);
  }, []);

  React.useEffect(() => {
    fetch('/api/casus-chain/types').then(r=>r.json()).then(d => { if(d.success) setTypes(d.missions); });
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/casus-chain/missions', { headers:{ Authorization:'Bearer '+jwt() }});
      const d = await r.json();
      if (d.success) setMissions(d.missions);
    } finally { setLoading(false); }
  };

  const startMission = async () => {
    if (!target.trim()) { showNotif && showNotif('Hedef adı giriniz', 'error'); return; }
    try {
      const r = await fetch('/api/casus-chain/start', {
        method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+jwt() },
        body: JSON.stringify({ mission_type: selType, target_name: target.trim() })
      });
      const d = await r.json();
      if (d.success) {
        showNotif && showNotif(`${types[selType]?.emoji || '🕵️'} Görev başladı! Aşama 1: ${STAGE_LABELS[1]}`, 'success');
        setTarget(''); setTab('active'); load();
      } else { showNotif && showNotif(d.message || 'Hata', 'error'); }
    } catch { showNotif && showNotif('Bağlantı hatası', 'error'); }
  };

  const advance = async (id) => {
    try {
      const r = await fetch(`/api/casus-chain/${id}/advance`, {
        method:'POST', headers:{ Authorization:'Bearer '+jwt() }
      });
      const d = await r.json();
      if (d.success) {
        if (d.completed) showNotif && showNotif(`✅ Görev tamamlandı! +🪙${d.reward_sikke?.toLocaleString('tr-TR')} +⭐${d.reward_xp} XP`, 'success');
        else if (d.failed) showNotif && showNotif('❌ Casus yakalandı! Görev başarısız.', 'error');
        else if (d.advanced) showNotif && showNotif(`➡️ Aşama ${d.mission?.stage}: ${STAGE_LABELS[d.mission?.stage] || ''}`, 'success');
        load();
      } else { showNotif && showNotif(d.message || 'Henüz hazır değil', 'error'); }
    } catch { showNotif && showNotif('Bağlantı hatası', 'error'); }
  };

  const abort = async (id) => {
    await fetch(`/api/casus-chain/${id}/abort`, { method:'POST', headers:{ Authorization:'Bearer '+jwt() }});
    load();
  };

  const timerStr = (endsAt) => {
    if (!endsAt) return '—';
    const ms = new Date(endsAt) - Date.now();
    if (ms <= 0) return '✅ Hazır';
    const s = Math.floor(ms/1000);
    if (s < 60) return `${s}sn`;
    if (s < 3600) return `${Math.floor(s/60)}dk ${s%60}sn`;
    return `${Math.floor(s/3600)}sa ${Math.floor((s%3600)/60)}dk`;
  };

  const isReady = (m) => {
    const endKey = `stage${m.stage}_ends_at`;
    return !m[endKey] || new Date(m[endKey]) <= new Date();
  };

  const activeMissions = missions.filter(m => m.status === 'active');
  const historyMissions = missions.filter(m => m.status !== 'active');

  const cardStyle = {
    background: S, borderRadius: 14, padding: '14px', marginBottom: 10,
    border: '1px solid rgba(200,155,60,0.2)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.4)'
  };

  return React.createElement('div', { style:{ minHeight:'100vh', background:BG, fontFamily:"'Inter',sans-serif", paddingBottom: 80 }},

    // Header
    React.createElement('div', { style:{ background:'linear-gradient(135deg,#1a0800,#2d1400)', borderBottom:'1px solid rgba(200,155,60,0.2)', padding:'14px 16px' }},
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:10 }},
        onNavigate && React.createElement('button', { onClick:()=>onNavigate('home'),
          style:{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'6px 10px', color:M, fontSize:'0.75rem', cursor:'pointer' }}, '← Geri'),
        React.createElement('span', { style:{ fontSize:'1.5rem' }}, '🕵️'),
        React.createElement('div', null,
          React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontWeight:900, fontSize:'1.1rem', color:G }}, 'Casus Teşkilatı'),
          React.createElement('div', { style:{ fontSize:'0.62rem', color:M }}, `3 Aşamalı Görev Zinciri  •  Aktif: ${activeMissions.length}`)
        )
      )
    ),

    // Sekmeler
    React.createElement('div', { style:{ display:'flex', gap:6, padding:'12px 12px 0' }},
      [['active','⚔️ Aktif'], ['history','📜 Geçmiş'], ['start','+ Başlat']].map(([k,l]) =>
        React.createElement('button', { key:k, onClick:()=>setTab(k),
          style:{ flex:1, padding:'8px 6px', borderRadius:10, border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.75rem',
            background: tab===k ? G : 'rgba(255,255,255,0.05)', color: tab===k ? '#0F0800' : M,
            boxShadow: tab===k ? '0 2px 8px rgba(200,155,60,0.3)' : 'none' }}, l)
      )
    ),

    React.createElement('div', { style:{ padding:'12px' }},

      // ── AKTIF GÖREVLER ──
      tab === 'active' && React.createElement('div', null,
        activeMissions.length === 0
          ? React.createElement('div', { style:{ textAlign:'center', color:M, padding:'40px 20px' }},
              React.createElement('div', { style:{ fontSize:'3rem', marginBottom:12 }}, '🕵️'),
              React.createElement('div', { style:{ fontSize:'0.9rem', fontWeight:600, color:T, marginBottom:8 }}, 'Aktif Görev Yok'),
              React.createElement('div', { style:{ fontSize:'0.75rem', color:M, marginBottom:20 }}, '3 aşamalı bir casus görevi başlatın'),
              React.createElement('button', { onClick:()=>setTab('start'),
                style:{ background:G, color:'#0F0800', border:'none', borderRadius:10, padding:'10px 24px', fontWeight:700, cursor:'pointer' }}, '+ Yeni Görev')
            )
          : activeMissions.map(m => {
              const def = types[m.mission_type] || {};
              const ready = isReady(m);
              const endKey = `stage${m.stage}_ends_at`;
              const progress = [1,2,3].map(s => s < m.stage ? 'done' : s === m.stage ? 'active' : 'pending');

              return React.createElement('div', { key:m.id, style:{ ...cardStyle, border:`1px solid ${ready?G+'44':'rgba(200,155,60,0.15)'}` }},
                // Başlık
                React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }},
                  React.createElement('div', null,
                    React.createElement('div', { style:{ fontWeight:800, fontSize:'0.95rem', color:T }},
                      `${def.emoji || '🕵️'} ${def.label || m.mission_type}`),
                    React.createElement('div', { style:{ fontSize:'0.7rem', color:M, marginTop:2 }}, `🎯 ${m.target_name}`)
                  ),
                  React.createElement('div', { style:{ textAlign:'right' }},
                    React.createElement('div', { style:{ fontSize:'0.65rem', color:G, fontWeight:700 }}, `🪙${(m.reward_sikke||0).toLocaleString('tr-TR')}`),
                    React.createElement('div', { style:{ fontSize:'0.62rem', color:'#60A5FA' }}, `+⭐${m.reward_xp} XP`)
                  )
                ),

                // Aşama göstergesi
                React.createElement('div', { style:{ display:'flex', gap:4, marginBottom:12, alignItems:'center' }},
                  [1,2,3].map((s,i) => [
                    React.createElement('div', { key:s, style:{
                      flex:1, padding:'6px 4px', borderRadius:8, textAlign:'center', fontSize:'0.65rem', fontWeight:700,
                      background: s < m.stage ? GR+'22' : s===m.stage ? G+'22' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${s < m.stage ? GR+'44' : s===m.stage ? G+'55' : 'rgba(255,255,255,0.08)'}`,
                      color: s < m.stage ? GR : s===m.stage ? G : M
                    }},
                      React.createElement('div', { style:{ fontSize:'1rem' }}, s < m.stage ? '✅' : STAGE_ICONS[s]),
                      React.createElement('div', null, STAGE_LABELS[s])
                    ),
                    i < 2 && React.createElement('div', { key:`sep${s}`, style:{ width:16, height:2, background: s < m.stage ? GR+'44' : 'rgba(255,255,255,0.08)', borderRadius:2 }})
                  ])
                ),

                // Zamanlayıcı
                React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }},
                  React.createElement('div', { style:{ fontSize:'0.75rem', color: ready ? GR : G, fontWeight:700 }},
                    ready ? '✅ Aşama Hazır — İlerleyin!' : `⏳ ${timerStr(m[endKey])}`
                  ),
                  React.createElement('div', { style:{ fontSize:'0.68rem', color:M }}, `Aşama ${m.stage}/3`)
                ),

                // Butonlar
                React.createElement('div', { style:{ display:'flex', gap:6 }},
                  React.createElement('button', { onClick:()=>advance(m.id), disabled:!ready,
                    style:{ flex:3, padding:'9px', borderRadius:9, border:'none', cursor: ready?'pointer':'not-allowed', fontWeight:700, fontSize:'0.8rem',
                      background: ready ? (m.stage===3 ? GR : G) : 'rgba(255,255,255,0.05)',
                      color: ready ? '#0F0800' : M,
                      boxShadow: ready ? `0 2px 12px rgba(200,155,60,0.3)` : 'none' }},
                    m.stage===3 ? '⚡ Sabotajı Tamamla' : `➡️ Aşama ${m.stage+1}e Geç`),
                  React.createElement('button', { onClick:()=>abort(m.id),
                    style:{ flex:1, padding:'9px', borderRadius:9, border:`1px solid rgba(184,66,60,0.3)`, background:'transparent', color:R, cursor:'pointer', fontSize:'0.7rem', fontWeight:600 }}, 'İptal')
                )
              );
            })
      ),

      // ── GEÇMİŞ ──
      tab === 'history' && React.createElement('div', null,
        historyMissions.length === 0
          ? React.createElement('div', { style:{ textAlign:'center', color:M, padding:'40px' }}, 'Henüz tamamlanmış görev yok')
          : historyMissions.map(m => {
              const def = types[m.mission_type] || {};
              const succeeded = m.status === 'completed';
              return React.createElement('div', { key:m.id, style:{ ...cardStyle, borderLeft:`3px solid ${succeeded?GR:R}` }},
                React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center' }},
                  React.createElement('div', null,
                    React.createElement('div', { style:{ fontWeight:700, fontSize:'0.85rem', color:T }},
                      `${def.emoji||'🕵️'} ${def.label||m.mission_type}`),
                    React.createElement('div', { style:{ fontSize:'0.68rem', color:M, marginTop:2 }}, `🎯 ${m.target_name}`)
                  ),
                  React.createElement('div', { style:{ textAlign:'right' }},
                    React.createElement('div', { style:{ fontSize:'0.8rem', fontWeight:800, color: succeeded?GR:R }},
                      succeeded ? '✅ Başarılı' : m.status==='captured'?'🚨 Yakalandı':'❌ Başarısız'),
                    succeeded && React.createElement('div', { style:{ fontSize:'0.65rem', color:G }},
                      `+🪙${(m.reward_sikke||0).toLocaleString('tr-TR')}`)
                  )
                )
              );
            })
      ),

      // ── YENİ GÖREV BAŞLAT ──
      tab === 'start' && React.createElement('div', null,
        // Görev türü seç
        React.createElement('div', { style:{ marginBottom:14 }},
          React.createElement('div', { style:{ fontSize:'0.7rem', color:G, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}, 'Operasyon Tipi'),
          Object.entries(types).map(([id, def]) =>
            React.createElement('button', { key:id, onClick:()=>setSelType(id),
              style:{ width:'100%', marginBottom:6, padding:'12px', borderRadius:10, border:`2px solid ${selType===id?G:'rgba(255,255,255,0.08)'}`,
                background: selType===id?G+'12':'rgba(255,255,255,0.03)', cursor:'pointer', textAlign:'left' }},
              React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center' }},
                React.createElement('div', null,
                  React.createElement('div', { style:{ fontWeight:800, fontSize:'0.85rem', color:selType===id?G:T }},
                    `${def.emoji} ${def.label}`),
                  React.createElement('div', { style:{ fontSize:'0.65rem', color:M, marginTop:2 }},
                    `Risk: %${def.risk} • 🪙${(def.reward_sikke||0).toLocaleString('tr-TR')} • ⭐${def.reward_xp} XP`)
                ),
                React.createElement('div', { style:{ fontSize:'0.75rem', fontWeight:700, color:selType===id?G:M }},
                  `🪙${(def.maliyet||0).toLocaleString('tr-TR')}`)
              )
            )
          )
        ),

        // Hedef adı
        React.createElement('div', { style:{ marginBottom:14 }},
          React.createElement('div', { style:{ fontSize:'0.7rem', color:G, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}, 'Hedef Adı'),
          React.createElement('input', { type:'text', value:target, onChange:e=>setTarget(e.target.value), placeholder:'Hedef beylik veya oyuncu adı…',
            style:{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1px solid rgba(200,155,60,0.25)', background:'rgba(255,255,255,0.04)', color:T, fontSize:'0.85rem', outline:'none', boxSizing:'border-box' }})
        ),

        // Aşama önizleme
        types[selType] && React.createElement('div', { style:{ ...cardStyle, marginBottom:14 }},
          React.createElement('div', { style:{ fontSize:'0.7rem', color:G, fontWeight:700, marginBottom:8 }}, '📋 Görev Aşamaları'),
          (types[selType].stages||[]).map((s, i) =>
            React.createElement('div', { key:i, style:{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }},
              React.createElement('div', { style:{ width:24, height:24, borderRadius:'50%', background:G+'22', border:`1px solid ${G}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:800, color:G, flexShrink:0 }}, i+1),
              React.createElement('div', null,
                React.createElement('div', { style:{ fontSize:'0.78rem', fontWeight:700, color:T }}, s.label),
                React.createElement('div', { style:{ fontSize:'0.62rem', color:M }}, `${s.dur<60?s.dur+'sn':s.dur<3600?Math.floor(s.dur/60)+'dk':Math.floor(s.dur/3600)+'sa'} süre`)
              )
            )
          )
        ),

        React.createElement('button', { onClick:startMission,
          style:{ width:'100%', padding:'13px', borderRadius:12, border:'none', background:`linear-gradient(135deg,${G},#A07828)`,
            color:'#0F0800', fontWeight:800, fontSize:'0.9rem', cursor:'pointer',
            boxShadow:'0 4px 16px rgba(200,155,60,0.35)' }},
          `🕵️ Görevi Başlat`)
      )
    )
  );
};
