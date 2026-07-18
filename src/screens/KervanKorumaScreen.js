// ═══════════════════════════════════════════════════════════════
// SALTANAT ONLINE — Kervan Koruma Ekranı
// ═══════════════════════════════════════════════════════════════
window.KervanKorumaScreen = function KervanKorumaScreen({ profile, onNavigate, showNotif }) {
  const G='#C89B3C', BG='#0F0800', T='#F5EBD7', M='#A9A6A0', S='#2D1800', R='#B8423C', GR='#3E8C5A';
  const jwt = () => localStorage.getItem('us_jwt') || '';

  const [tab,     setTab]     = React.useState('open');
  const [data,    setData]    = React.useState({ open_caravans:[], active_caravans:[], routes:[] });
  const [loading, setLoading] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);
  const [selRoute,   setSelRoute]   = React.useState('');
  const [cargoVal,   setCargoVal]   = React.useState(1000);
  const [tick,       setTick]       = React.useState(0);

  React.useEffect(() => {
    const iv = setInterval(() => setTick(p => p+1), 15000);
    return () => clearInterval(iv);
  }, []);

  React.useEffect(() => { load(); }, [tick]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/kervan-koruma', { headers:{ Authorization:'Bearer '+jwt() }});
      const d = await r.json();
      if (d.success) { setData(d); if (!selRoute && d.routes.length) setSelRoute(d.routes[0].id); }
    } finally { setLoading(false); }
  };

  const createCaravan = async () => {
    try {
      const r = await fetch('/api/kervan-koruma/create', {
        method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+jwt() },
        body: JSON.stringify({ route_id: selRoute, cargo_value: cargoVal })
      });
      const d = await r.json();
      if (d.success) { showNotif && showNotif('🐪 Kervan oluşturuldu! Muhafız bekleniyor…', 'success'); setShowCreate(false); load(); }
      else showNotif && showNotif(d.message || 'Hata', 'error');
    } catch { showNotif && showNotif('Bağlantı hatası', 'error'); }
  };

  const guardCaravan = async (id) => {
    try {
      const r = await fetch(`/api/kervan-koruma/${id}/guard`, {
        method:'POST', headers:{ Authorization:'Bearer '+jwt() }
      });
      const d = await r.json();
      if (d.success) { showNotif && showNotif(`🛡️ Muhafız oldunuz! Ödeme: 🪙${d.pay_amount?.toLocaleString('tr-TR')}`, 'success'); load(); }
      else showNotif && showNotif(d.message || 'Hata', 'error');
    } catch { showNotif && showNotif('Bağlantı hatası', 'error'); }
  };

  const completeJourney = async (id) => {
    try {
      const r = await fetch(`/api/kervan-koruma/${id}/complete`, {
        method:'POST', headers:{ Authorization:'Bearer '+jwt() }
      });
      const d = await r.json();
      if (d.success) {
        const msg = d.attacked
          ? (d.guard_success ? `⚔️ Saldırı püskürtüldü! +🪙${d.guard_pay?.toLocaleString('tr-TR')}` : '💀 Saldırı başarılı oldu!')
          : `✅ Kervan başarıyla ulaştı! +🪙${d.guard_pay?.toLocaleString('tr-TR')}`;
        showNotif && showNotif(msg, d.attacked && !d.guard_success ? 'error' : 'success');
        load();
      } else showNotif && showNotif(d.message || 'Henüz tamamlanmadı', 'error');
    } catch { showNotif && showNotif('Bağlantı hatası', 'error'); }
  };

  const dangerLabel = n => ['','Düşük','Orta','Yüksek','Çok Yüksek','Tehlikeli'][n] || '?';
  const dangerColor = n => ['','#3E8C5A','#C89B3C','#E8771C','#E05550','#B8423C'][n] || M;

  const timerStr = (endsAt) => {
    if (!endsAt) return '—';
    const ms = new Date(endsAt) - Date.now();
    if (ms <= 0) return '✅ Tamamlandı';
    const m = Math.floor(ms/60000);
    return m > 60 ? `${Math.floor(m/60)}sa ${m%60}dk` : `${m}dk`;
  };

  const cardStyle = { background: S, borderRadius: 14, padding: '14px', marginBottom: 10, border: '1px solid rgba(200,155,60,0.18)', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' };

  return React.createElement('div', { style:{ minHeight:'100vh', background:BG, fontFamily:"'Inter',sans-serif", paddingBottom:80 }},

    // Header
    React.createElement('div', { style:{ background:'linear-gradient(135deg,#0f0800,#2a1500)', borderBottom:'1px solid rgba(200,155,60,0.2)', padding:'14px 16px' }},
      React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between' }},
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:10 }},
          onNavigate && React.createElement('button', { onClick:()=>onNavigate('home'),
            style:{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'6px 10px', color:M, fontSize:'0.75rem', cursor:'pointer' }}, '← Geri'),
          React.createElement('span', { style:{ fontSize:'1.5rem' }}, '🐪'),
          React.createElement('div', null,
            React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontWeight:900, fontSize:'1.1rem', color:G }}, 'Kervan Koruması'),
            React.createElement('div', { style:{ fontSize:'0.62rem', color:M }}, 'Muhafız ol • Sikke kazan')
          )
        ),
        React.createElement('button', { onClick:()=>setShowCreate(true),
          style:{ background:G, color:'#0F0800', border:'none', borderRadius:9, padding:'8px 14px', fontWeight:700, fontSize:'0.78rem', cursor:'pointer' }}, '+ Kervan')
      )
    ),

    // Sekmeler
    React.createElement('div', { style:{ display:'flex', gap:6, padding:'12px 12px 0' }},
      [['open','🐪 Açık'], ['active','⚔️ Aktif']].map(([k,l]) =>
        React.createElement('button', { key:k, onClick:()=>setTab(k),
          style:{ flex:1, padding:'8px', borderRadius:10, border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.78rem',
            background: tab===k ? G : 'rgba(255,255,255,0.05)', color: tab===k ? '#0F0800' : M }}, l)
      )
    ),

    React.createElement('div', { style:{ padding:'12px' }},

      // Açık kervanlar
      tab === 'open' && React.createElement('div', null,
        data.open_caravans.length === 0
          ? React.createElement('div', { style:{ textAlign:'center', color:M, padding:'40px 20px' }},
              React.createElement('div', { style:{ fontSize:'3rem', marginBottom:12 }}, '🐪'),
              React.createElement('div', { style:{ fontSize:'0.9rem', color:T, marginBottom:6 }}, 'Açık Kervan Yok'),
              React.createElement('button', { onClick:()=>setShowCreate(true),
                style:{ background:G, color:'#0F0800', border:'none', borderRadius:9, padding:'9px 20px', fontWeight:700, cursor:'pointer' }}, '+ Kervan Oluştur')
            )
          : data.open_caravans.map(k =>
              React.createElement('div', { key:k.id, style: cardStyle },
                React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }},
                  React.createElement('div', null,
                    React.createElement('div', { style:{ fontWeight:800, fontSize:'0.9rem', color:T }}, `🐪 ${k.route}`),
                    React.createElement('div', { style:{ fontSize:'0.68rem', color:M, marginTop:2 }}, `Nakliyeci: ${k.owner_username || k.owner_name}`)
                  ),
                  React.createElement('div', { style:{ textAlign:'right' }},
                    React.createElement('div', { style:{ fontSize:'0.9rem', fontWeight:800, color:GR }}, `🪙${(k.pay_amount||0).toLocaleString('tr-TR')}`),
                    React.createElement('div', { style:{ fontSize:'0.62rem', color:M }}, 'Muhafız ücreti')
                  )
                ),
                React.createElement('div', { style:{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }},
                  React.createElement('span', { style:{ fontSize:'0.62rem', background:dangerColor(k.danger_level)+'18', color:dangerColor(k.danger_level), padding:'3px 8px', borderRadius:20, fontWeight:700 }},
                    `⚠️ ${dangerLabel(k.danger_level)} Risk`),
                  React.createElement('span', { style:{ fontSize:'0.62rem', color:M, background:'rgba(255,255,255,0.04)', padding:'3px 8px', borderRadius:20 }},
                    `💰 Kargo: 🪙${(k.cargo_value||0).toLocaleString('tr-TR')}`),
                  React.createElement('span', { style:{ fontSize:'0.62rem', color:R, background:R+'12', padding:'3px 8px', borderRadius:20 }},
                    `🎯 Saldırı: %${k.attack_chance}`)
                ),
                k.owner_id !== profile?.id && React.createElement('button', { onClick:()=>guardCaravan(k.id),
                  style:{ width:'100%', padding:'9px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${G},#A07828)`,
                    color:'#0F0800', fontWeight:700, cursor:'pointer', boxShadow:'0 2px 8px rgba(200,155,60,0.3)' }},
                  '🛡️ Muhafız Ol')
              )
            )
      ),

      // Aktif kervanlar
      tab === 'active' && React.createElement('div', null,
        data.active_caravans.length === 0
          ? React.createElement('div', { style:{ textAlign:'center', color:M, padding:'40px' }}, '⚔️ Aktif kervan yok')
          : data.active_caravans.map(k => {
              const isGuard = k.guard_id === profile?.id;
              const isOwner = k.owner_id === profile?.id;
              const isDone  = k.ends_at && new Date(k.ends_at) <= new Date();
              return React.createElement('div', { key:k.id, style:{ ...cardStyle, border:`1px solid ${isDone?GR+'44':'rgba(200,155,60,0.2)'}` }},
                React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }},
                  React.createElement('div', null,
                    React.createElement('div', { style:{ fontWeight:800, fontSize:'0.9rem', color:T }}, `🐪 ${k.route}`),
                    React.createElement('div', { style:{ fontSize:'0.68rem', color:M, marginTop:2 }},
                      isGuard ? `👑 Muhafız: Sen` : `🛡️ Muhafız: ${k.guard_name||'—'}`)
                  ),
                  React.createElement('div', { style:{ textAlign:'right', fontSize:'0.72rem', fontWeight:700, color: isDone?GR:G }},
                    isDone ? '✅ Tamamlandı' : `⏳ ${timerStr(k.ends_at)}`)
                ),
                (isGuard || isOwner) && React.createElement('button', { onClick:()=>completeJourney(k.id), disabled:!isDone,
                  style:{ width:'100%', padding:'9px', borderRadius:9, border:'none', cursor:isDone?'pointer':'not-allowed', fontWeight:700,
                    background: isDone ? `linear-gradient(135deg,${GR},#2E6B42)` : 'rgba(255,255,255,0.05)',
                    color: isDone ? '#fff' : M }},
                  isDone ? '✅ Yolculuğu Tamamla' : '⏳ Yolculuk Devam Ediyor')
              );
            })
      )
    ),

    // Kervan oluştur modal
    showCreate && React.createElement('div', { style:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'1rem' }},
      React.createElement('div', { style:{ background:'#1A0E00', borderRadius:16, padding:'1.5rem', maxWidth:400, width:'100%', border:`1px solid ${G}33`, boxShadow:`0 16px 64px rgba(0,0,0,0.7)` }},
        React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'1.1rem', fontWeight:800, color:G, marginBottom:16 }}, '🐪 Yeni Kervan'),
        React.createElement('div', { style:{ marginBottom:12 }},
          React.createElement('div', { style:{ fontSize:'0.7rem', color:M, marginBottom:6 }}, 'Rota Seç'),
          React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:4 }},
            data.routes.map(r => React.createElement('button', { key:r.id, onClick:()=>setSelRoute(r.id),
              style:{ padding:'8px 12px', borderRadius:9, border:`2px solid ${selRoute===r.id?G:'rgba(255,255,255,0.08)'}`,
                background:selRoute===r.id?G+'12':'transparent', cursor:'pointer', textAlign:'left', color:T }},
              React.createElement('div', { style:{ display:'flex', justifyContent:'space-between' }},
                React.createElement('span', { style:{ fontSize:'0.8rem', fontWeight:600 }}, r.label),
                React.createElement('span', { style:{ fontSize:'0.72rem', color:dangerColor(r.danger) }}, `⚠️ Tehlike ${r.danger}/5`)
              )
            ))
          )
        ),
        React.createElement('div', { style:{ marginBottom:16 }},
          React.createElement('div', { style:{ fontSize:'0.7rem', color:M, marginBottom:6 }}, `Kargo Değeri: 🪙${cargoVal.toLocaleString('tr-TR')}`),
          React.createElement('input', { type:'range', min:100, max:50000, step:100, value:cargoVal, onChange:e=>setCargoVal(parseInt(e.target.value)),
            style:{ width:'100%', accentColor:G }})
        ),
        React.createElement('div', { style:{ display:'flex', gap:8 }},
          React.createElement('button', { onClick:()=>setShowCreate(false),
            style:{ flex:1, padding:'10px', borderRadius:9, border:`1px solid ${G}44`, background:'transparent', color:M, cursor:'pointer' }}, 'İptal'),
          React.createElement('button', { onClick:createCaravan,
            style:{ flex:2, padding:'10px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${G},#A07828)`, color:'#0F0800', fontWeight:700, cursor:'pointer' }}, '🐪 Kervan Kur')
        )
      )
    )
  );
};
