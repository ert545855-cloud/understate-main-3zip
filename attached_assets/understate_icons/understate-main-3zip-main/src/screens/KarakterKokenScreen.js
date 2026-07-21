// Karakter Kökeni & Sıfatları Ekranı
window.KarakterKokenScreen = function KarakterKokenScreen({ profile, token, setProfile, showNotif, onNavigate }) {
  const [origins, setOrigins] = React.useState([]);
  const [traitDefs, setTraitDefs] = React.useState([]);
  const [myTraits, setMyTraits] = React.useState([]);
  const [tab, setTab] = React.useState('koken');
  const [loading, setLoading] = React.useState('');
  const [msg, setMsg] = React.useState({ text:'', ok:true });

  const ds = { bg:'#0D1117', surface:'rgba(255,255,255,0.04)', gold:'#C9A227', border:'rgba(255,255,255,0.08)', text:'#EDE7DA', muted:'#8893A1', green:'#4CAF50', red:'#FF6B6B' };

  const fetchData = async () => {
    try {
      const [or, tr] = await Promise.all([
        fetch('/api/rp/origins', { headers:{'Authorization':'Bearer '+token} }),
        fetch('/api/rp/traits',  { headers:{'Authorization':'Bearer '+token} }),
      ]);
      const [od, td] = await Promise.all([or.json(), tr.json()]);
      if (od.success) setOrigins(od.origins);
      if (td.success) { setTraitDefs(td.definitions); setMyTraits(td.myTraits || []); }
    } catch {}
  };

  React.useEffect(() => { fetchData(); }, []);

  const show = (text, ok=true) => { setMsg({ text, ok }); setTimeout(() => setMsg({ text:'', ok:true }), 4000); };

  const chooseOrigin = async (originId) => {
    if (profile?.origin) return show('Kökenin zaten seçilmiş', false);
    setLoading(originId);
    try {
      const r = await fetch('/api/rp/origin/choose', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: JSON.stringify({ originId })
      });
      const d = await r.json();
      if (d.success) {
        show(`✅ ${d.origin.name} seçildi! +${d.bonusMoney} 🪙 +${d.bonusXp} XP`);
        setProfile && setProfile(prev => ({ ...prev, origin: originId }));
        showNotif && showNotif(`🌟 Köken seçildi: ${d.origin.name}`, 'success');
      } else show(d.message || 'Hata', false);
    } catch { show('Sunucu hatası', false); }
    setLoading('');
  };

  const buyTrait = async (traitId) => {
    setLoading(traitId);
    try {
      const r = await fetch('/api/rp/trait/buy', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: JSON.stringify({ traitId })
      });
      const d = await r.json();
      if (d.success) {
        show(`✅ ${d.trait.name} sıfatı alındı!`);
        setMyTraits(d.newTraits);
        setProfile && setProfile(prev => ({ ...prev, traits: d.newTraits }));
      } else show(d.message || 'Hata', false);
    } catch { show('Hata', false); }
    setLoading('');
  };

  const ORIGIN_EFFECTS = {
    anadolu_koylusu: '+500 🪙 · +50 XP başlangıç',
    istanbul_esnafi:  '+1000 🪙 · +30 XP · Pazar bonusu',
    balkan_askeri:    '+200 🪙 · +80 XP · Savaş bonusu',
    bedevi_tuccar:    '+800 🪙 · +40 XP · Kervan bonusu',
  };

  return React.createElement('div', { style:{ minHeight:'100vh', background:ds.bg, padding:'1rem', paddingBottom:'5rem', color:ds.text }},
    React.createElement('div', { style:{ display:'flex', gap:'8px', marginBottom:'1rem' }},
      ['koken','sifatlar'].map(t =>
        React.createElement('button', { key:t, onClick:()=>setTab(t),
          style:{ flex:1, padding:'8px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.85rem',
            background: tab===t ? ds.gold : ds.surface, color: tab===t ? '#000' : ds.muted }},
          t === 'koken' ? '🌍 Köken Seç' : '⭐ Sıfatlar'
        )
      )
    ),

    msg.text && React.createElement('div', { style:{ background: msg.ok ? 'rgba(80,200,80,0.1)' : 'rgba(255,80,80,0.1)', border:`1px solid ${msg.ok ? ds.green : ds.red}`, borderRadius:'8px', padding:'10px 14px', marginBottom:'1rem', fontSize:'0.82rem', color: msg.ok ? ds.green : ds.red }}, msg.text),

    tab === 'koken' && React.createElement('div', null,
      React.createElement('div', { style:{ fontSize:'0.8rem', color:ds.muted, marginBottom:'12px', lineHeight:1.5 }},
        profile?.origin
          ? `✅ Mevcut kökenin: ${origins.find(o=>o.id===profile.origin)?.name || profile.origin}`
          : '⚠️ Henüz köken seçmedin. Yalnızca bir kez seçebilirsin.'
      ),
      React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'10px' }},
        origins.map(o => {
          const isSelected = profile?.origin === o.id;
          return React.createElement('div', { key:o.id,
            style:{ background: isSelected ? 'rgba(201,162,39,0.12)' : ds.surface,
              border:`1px solid ${isSelected ? ds.gold : ds.border}`, borderRadius:'14px', padding:'16px' }},
            React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }},
              React.createElement('div', null,
                React.createElement('div', { style:{ fontWeight:800, fontSize:'1rem' }}, `${o.emoji} ${o.name}`),
                React.createElement('div', { style:{ fontSize:'0.78rem', color:ds.muted, marginTop:'3px' }}, o.description)
              ),
              isSelected && React.createElement('span', { style:{ fontSize:'0.72rem', background:'rgba(201,162,39,0.2)', color:ds.gold, padding:'3px 8px', borderRadius:'6px', fontWeight:700 }}, '✅ Seçili')
            ),
            React.createElement('div', { style:{ fontSize:'0.78rem', color:ds.gold, marginBottom:'10px' }}, ORIGIN_EFFECTS[o.id] || ''),
            !profile?.origin && React.createElement('button', { onClick:()=>chooseOrigin(o.id), disabled:loading===o.id,
              style:{ width:'100%', padding:'8px', borderRadius:'10px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.85rem',
                background: ds.gold, color:'#000' }},
              loading===o.id ? '⏳...' : '🌟 Bu Kökeni Seç'
            )
          );
        })
      )
    ),

    tab === 'sifatlar' && React.createElement('div', null,
      React.createElement('div', { style:{ background:'rgba(201,162,39,0.06)', border:`1px solid rgba(201,162,39,0.2)`, borderRadius:'10px', padding:'12px', marginBottom:'12px' }},
        React.createElement('div', { style:{ fontSize:'0.82rem', color:ds.gold, fontWeight:700 }}, '⭐ Sıfat Sistemi'),
        React.createElement('div', { style:{ fontSize:'0.77rem', color:ds.muted, marginTop:'4px' }},
          `XP harcayarak en fazla 3 sıfat seçebilirsin. Mevcut: ${myTraits.length}/3 · XP: ${profile?.xp || 0}`
        )
      ),
      React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'10px' }},
        traitDefs.map(t => {
          const owned = myTraits.includes(t.id);
          const canAfford = (profile?.xp || 0) >= t.cost_xp;
          const full = myTraits.length >= 3 && !owned;
          return React.createElement('div', { key:t.id,
            style:{ background: owned ? 'rgba(80,200,80,0.06)' : ds.surface,
              border:`1px solid ${owned ? 'rgba(80,200,80,0.3)' : ds.border}`, borderRadius:'12px', padding:'14px' }},
            React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'6px' }},
              React.createElement('div', null,
                React.createElement('div', { style:{ fontWeight:700 }}, `${t.emoji} ${t.name}`),
                React.createElement('div', { style:{ fontSize:'0.77rem', color:ds.muted, marginTop:'3px' }}, t.description)
              ),
              React.createElement('div', { style:{ textAlign:'right', minWidth:'70px' }},
                owned
                  ? React.createElement('span', { style:{ fontSize:'0.75rem', color:ds.green, fontWeight:700 }}, '✅ Sahip')
                  : React.createElement('span', { style:{ fontSize:'0.8rem', color:canAfford ? ds.gold : ds.muted, fontWeight:700 }}, `${t.cost_xp} XP`)
              )
            ),
            !owned && React.createElement('button', { onClick:()=>buyTrait(t.id), disabled:loading===t.id || !canAfford || full,
              style:{ width:'100%', padding:'7px', borderRadius:'8px', border:'none', cursor: (!canAfford||full)?'default':'pointer', fontWeight:700, fontSize:'0.82rem',
                background: owned ? 'transparent' : (!canAfford||full) ? 'rgba(255,255,255,0.04)' : 'rgba(201,162,39,0.15)',
                color: (!canAfford||full) ? ds.muted : ds.gold }},
              loading===t.id ? '⏳...' : full ? 'Limit doldu' : !canAfford ? 'Yetersiz XP' : '⭐ Sıfatı Al'
            )
          );
        })
      )
    )
  );
};
