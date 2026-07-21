// ═══════════════════════════════════════════════════════════════
// SALTANAT ONLINE — Zanaat Ekranı (Çırak→Kalfa→Usta→Üstad)
// ═══════════════════════════════════════════════════════════════
window.ZanaatScreen = function ZanaatScreen({ profile, onNavigate, showNotif }) {
  const G='#C89B3C', BG='#0F0800', T='#F5EBD7', M='#A9A6A0', S='#2D1800', R='#B8423C', GR='#3E8C5A';
  const jwt = () => localStorage.getItem('us_jwt') || '';

  const [zanaat,   setZanaat]   = React.useState(null);
  const [tier,     setTier]     = React.useState(null);
  const [nextTier, setNextTier] = React.useState(null);
  const [recipes,  setRecipes]  = React.useState([]);
  const [tiers,    setTiers]    = React.useState([]);
  const [crafting, setCrafting] = React.useState(null); // active craft timer
  const [loading,  setLoading]  = React.useState(false);

  React.useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/zanaat/profile', { headers:{ Authorization:'Bearer '+jwt() }});
      const d = await r.json();
      if (d.success) { setZanaat(d.zanaat); setTier(d.tier); setNextTier(d.nextTier); setRecipes(d.recipes); setTiers(d.tiers); }
    } finally { setLoading(false); }
  };

  const craft = async (recipeId) => {
    if (crafting) { showNotif && showNotif('Zaten bir üretim devam ediyor', 'error'); return; }
    setCrafting(recipeId);
    try {
      const r = await fetch('/api/zanaat/craft', {
        method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+jwt() },
        body: JSON.stringify({ recipe_id: recipeId })
      });
      const d = await r.json();
      if (d.success) {
        const msg = d.leveled_up
          ? `🎊 Seviye atladın: ${d.level_title}! +🪙${d.reward_sikke?.toLocaleString('tr-TR')}`
          : `✅ Üretildi! +🪙${d.reward_sikke?.toLocaleString('tr-TR')} +⭐${d.reward_xp} XP`;
        showNotif && showNotif(msg, 'success');
        load();
      } else { showNotif && showNotif(d.message || 'Hata', 'error'); }
    } catch { showNotif && showNotif('Bağlantı hatası', 'error'); }
    finally { setCrafting(null); }
  };

  const TIER_COLORS = ['#A9A6A0','#C89B3C','#E05550','#A78BFA'];

  if (loading && !zanaat) return React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', background:BG }},
    React.createElement('div', { style:{ color:G, fontSize:'2rem' }}, '⚒️'));

  const xpPct = zanaat && nextTier && nextTier.level > (zanaat.level||1)
    ? Math.min(100, Math.round(((zanaat.xp||0) - (tiers[zanaat.level-1]?.xpNeeded||0)) /
        ((nextTier.xpNeeded||1) - (tiers[zanaat.level-1]?.xpNeeded||0)) * 100))
    : 100;

  const cardStyle = { background: S, borderRadius: 14, padding: '14px', marginBottom: 10, border: '1px solid rgba(200,155,60,0.18)', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' };

  return React.createElement('div', { style:{ minHeight:'100vh', background:BG, fontFamily:"'Inter',sans-serif", paddingBottom:80 }},

    // Header
    React.createElement('div', { style:{ background:'linear-gradient(135deg,#0f0800,#2a1500)', borderBottom:'1px solid rgba(200,155,60,0.2)', padding:'14px 16px' }},
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:10 }},
        onNavigate && React.createElement('button', { onClick:()=>onNavigate('home'),
          style:{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'6px 10px', color:M, fontSize:'0.75rem', cursor:'pointer' }}, '← Geri'),
        React.createElement('span', { style:{ fontSize:'1.5rem' }}, '⚒️'),
        React.createElement('div', null,
          React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontWeight:900, fontSize:'1.1rem', color:G }}, 'Zanaat Atölyesi'),
          React.createElement('div', { style:{ fontSize:'0.62rem', color:M }}, 'Çırak → Kalfa → Usta → Üstad')
        )
      )
    ),

    React.createElement('div', { style:{ padding:'12px' }},

      // Seviye kartı
      zanaat && tier && React.createElement('div', { style:{ ...cardStyle, background:`linear-gradient(135deg, ${S}, rgba(200,155,60,0.08))` }},
        React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }},
          React.createElement('div', null,
            React.createElement('div', { style:{ fontSize:'2rem', marginBottom:4 }}, tier.emoji),
            React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontWeight:900, fontSize:'1.1rem', color:G }}, tier.title),
            React.createElement('div', { style:{ fontSize:'0.68rem', color:M, marginTop:2 }}, `Toplam Üretim: ${(zanaat.total_crafted||0)}`)
          ),
          React.createElement('div', { style:{ textAlign:'right' }},
            React.createElement('div', { style:{ fontSize:'1.4rem', fontWeight:900, color:TIER_COLORS[zanaat.level-1]||G }},
              `Lv.${zanaat.level}`),
            React.createElement('div', { style:{ fontSize:'0.7rem', color:M }},
              nextTier && nextTier.level > zanaat.level ? `${zanaat.xp||0} / ${nextTier.xpNeeded} XP` : 'Maksimum Seviye')
          )
        ),

        // XP çubuğu
        React.createElement('div', { style:{ marginBottom:10 }},
          React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', fontSize:'0.62rem', color:M, marginBottom:4 }},
            React.createElement('span', null, `XP: ${zanaat.xp||0}`),
            nextTier && nextTier.level > zanaat.level
              ? React.createElement('span', null, `Sonraki: ${nextTier.title} @ ${nextTier.xpNeeded} XP`)
              : React.createElement('span', { style:{ color:G }}, '⚜️ Maksimum Seviye')
          ),
          React.createElement('div', { style:{ height:8, background:'rgba(255,255,255,0.06)', borderRadius:4, overflow:'hidden' }},
            React.createElement('div', { style:{ height:'100%', width:`${xpPct}%`, background:`linear-gradient(90deg,${G},#E8C06A)`, borderRadius:4, transition:'width 0.5s' }})
          )
        ),

        // Bonuslar
        React.createElement('div', { style:{ display:'flex', gap:6 }},
          [
            [`⚡ ${Math.round((tier.speedBonus-1)*100)}% Hız`, '#60A5FA'],
            [`💰 +${Math.round(tier.incomeBonus*100)}% Gelir`, GR],
            [`🔑 ${tier.craftSlots} Slot`, G],
          ].map(([l, c]) => React.createElement('div', { key:l,
            style:{ flex:1, textAlign:'center', background:c+'12', border:`1px solid ${c}22`, borderRadius:8, padding:'6px 4px', fontSize:'0.62rem', fontWeight:700, color:c }}, l))
        )
      ),

      // Tarif Listesi
      React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'0.75rem', color:G, fontWeight:700, marginBottom:8, marginTop:4 }}, '📜 Tarifler'),
      recipes.map(r => {
        const canCraft = (zanaat?.level||1) >= r.tier;
        const isCrafting = crafting === r.id;
        const tierDef = tiers[r.tier-1] || {};

        return React.createElement('div', { key:r.id, style:{ ...cardStyle, opacity: canCraft?1:0.6 }},
          React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:12 }},
            React.createElement('span', { style:{ fontSize:'1.8rem', flexShrink:0 }}, r.emoji),
            React.createElement('div', { style:{ flex:1, minWidth:0 }},
              React.createElement('div', { style:{ fontWeight:800, fontSize:'0.9rem', color:T, marginBottom:2 }}, r.label),
              React.createElement('div', { style:{ display:'flex', gap:8, flexWrap:'wrap' }},
                React.createElement('span', { style:{ fontSize:'0.62rem', color:R }}, `🪙${r.maliyet.toLocaleString('tr-TR')} maliyet`),
                React.createElement('span', { style:{ fontSize:'0.62rem', color:GR }}, `🪙${r.reward_sikke.toLocaleString('tr-TR')} getiri`),
                React.createElement('span', { style:{ fontSize:'0.62rem', color:'#60A5FA' }}, `⭐${r.reward_xp} XP`),
                React.createElement('span', { style:{ fontSize:'0.62rem', color:M }},
                  `⏱${r.sure<60?r.sure+'sn':r.sure<3600?Math.floor(r.sure/60)+'dk':Math.floor(r.sure/3600)+'sa'}`)
              )
            ),
            React.createElement('div', { style:{ flexShrink:0 }},
              !canCraft
                ? React.createElement('div', { style:{ fontSize:'0.62rem', color:M, textAlign:'center' }},
                    React.createElement('div', null, '🔒'),
                    React.createElement('div', null, `${tierDef.title||''} Gerekli`))
                : React.createElement('button', { onClick:()=>craft(r.id), disabled:!!crafting,
                    style:{ padding:'8px 14px', borderRadius:9, border:'none',
                      background: isCrafting ? M+'44' : `linear-gradient(135deg,${G},#A07828)`,
                      color: isCrafting ? M : '#0F0800', cursor: crafting?'not-allowed':'pointer',
                      fontWeight:700, fontSize:'0.75rem', boxShadow: crafting?'none':'0 2px 8px rgba(200,155,60,0.3)' }},
                    isCrafting ? '⏳ Üretiliyor…' : '⚒️ Üret')
            )
          )
        );
      }),

      // Seviye yolu
      React.createElement('div', { style:{ ...cardStyle, marginTop:14 }},
        React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'0.75rem', color:G, fontWeight:700, marginBottom:10 }}, '🏆 Ustalık Yolu'),
        tiers.map((t, i) =>
          React.createElement('div', { key:t.level, style:{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }},
            React.createElement('div', { style:{ width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem',
              background: (zanaat?.level||1) >= t.level ? t.level===4?'linear-gradient(135deg,#A78BFA,#7C3AED)':G+'22' : 'rgba(255,255,255,0.04)',
              border: `2px solid ${(zanaat?.level||1) >= t.level ? TIER_COLORS[i]+'66' : 'rgba(255,255,255,0.08)'}` }}, t.emoji),
            React.createElement('div', { style:{ flex:1 }},
              React.createElement('div', { style:{ fontWeight:700, fontSize:'0.82rem', color:(zanaat?.level||1)>=t.level?TIER_COLORS[i]:M }}, t.title),
              React.createElement('div', { style:{ fontSize:'0.62rem', color:M }},
                t.xpNeeded === 0 ? 'Başlangıç seviyesi' : `${t.xpNeeded} XP · ${Math.round((t.speedBonus-1)*100)}% hız · +${Math.round(t.incomeBonus*100)}% gelir`)
            ),
            (zanaat?.level||1) >= t.level && React.createElement('div', { style:{ fontSize:'0.75rem' }}, '✅')
          )
        )
      )
    )
  );
};
