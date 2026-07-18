// Saray İntrigi Kartları
window.SarayIntrigiScreen = function SarayIntrigiScreen({ profile, token }) {
  const [drawn, setDrawn] = React.useState(null);
  const [canDraw, setCanDraw] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [flipped, setFlipped] = React.useState(false);
  const [history, setHistory] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('rep_intrigu_history')||'[]'); } catch { return []; }
  });

  const ds = { bg:'#0D1117', surface:'rgba(255,255,255,0.04)', gold:'#C9A227', border:'rgba(255,255,255,0.08)', text:'#EDE7DA', muted:'#8893A1' };

  const draw = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/social/intrigue/draw', {
        method:'POST', headers:{'Authorization':'Bearer '+token}
      });
      const d = await r.json();
      if (d.success) {
        setDrawn(d.card);
        setFlipped(false);
        setTimeout(() => setFlipped(true), 100);
        const h = [{ ...d.card, ts: Date.now() }, ...history].slice(0, 10);
        setHistory(h);
        try { localStorage.setItem('rep_intrigu_history', JSON.stringify(h)); } catch {}
      } else {
        setCanDraw(false);
        alert(d.message || 'Bugün zaten kart çektin.');
      }
    } catch { alert('Sunucu hatası'); }
    setLoading(false);
  };

  const effectDesc = (card) => {
    if (!card?.effect) return '';
    const parts = [];
    if (card.effect.money) parts.push(`${card.effect.money > 0 ? '+' : ''}${card.effect.money} 🪙`);
    if (card.effect.xp) parts.push(`${card.effect.xp > 0 ? '+' : ''}${card.effect.xp} XP`);
    if (card.effect.fame) parts.push(`${card.effect.fame > 0 ? '+' : ''}${card.effect.fame} Şöhret`);
    return parts.join(' · ');
  };

  const isPositive = (card) => {
    if (!card?.effect) return true;
    const total = (card.effect.money||0) + (card.effect.xp||0) + (card.effect.fame||0);
    return total >= 0;
  };

  return React.createElement('div', { style:{ minHeight:'100vh', background:ds.bg, padding:'1rem', paddingBottom:'5rem', color:ds.text }},
    // Header
    React.createElement('div', { style:{ textAlign:'center', marginBottom:'2rem' }},
      React.createElement('div', { style:{ fontSize:'2.5rem', marginBottom:'8px' }}, '🎴'),
      React.createElement('div', { style:{ fontWeight:900, fontSize:'1.2rem', color:ds.gold }}, 'Saray İntrigi'),
      React.createElement('div', { style:{ fontSize:'0.8rem', color:ds.muted, marginTop:'4px' }}, 'Günde bir kez kader kartı çek. Her kart bir sürpriz getirir.')
    ),

    // Card area
    React.createElement('div', { style:{ display:'flex', justifyContent:'center', marginBottom:'2rem' }},
      !drawn ? React.createElement('div', {
        onClick: canDraw && !loading ? draw : undefined,
        style:{ width:'180px', height:'260px', borderRadius:'16px', cursor: canDraw ? 'pointer' : 'default',
          background: canDraw ? `linear-gradient(135deg, #2D1800, #4A2800)` : 'rgba(255,255,255,0.04)',
          border:`2px solid ${canDraw ? ds.gold : ds.border}`,
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          boxShadow: canDraw ? `0 0 30px rgba(201,162,39,0.3)` : 'none',
          transition:'all 0.3s' }},
        React.createElement('div', { style:{ fontSize:'3rem', marginBottom:'12px' }}, loading ? '⏳' : '🎴'),
        React.createElement('div', { style:{ fontSize:'0.85rem', fontWeight:700, color: canDraw ? ds.gold : ds.muted, textAlign:'center' }},
          loading ? 'Çekiliyor...' : canDraw ? 'Karta dokun!' : 'Yarın tekrar gel'
        )
      ) : React.createElement('div', {
        style:{ width:'180px', height:'260px', borderRadius:'16px',
          background: isPositive(drawn) ? 'linear-gradient(135deg, #0D2D0D, #1A4A1A)' : 'linear-gradient(135deg, #2D0D0D, #4A1A1A)',
          border:`2px solid ${isPositive(drawn) ? '#4CAF50' : ds.red}`,
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'16px',
          boxShadow: `0 0 30px ${isPositive(drawn) ? 'rgba(76,175,80,0.3)' : 'rgba(255,100,100,0.3)'}`,
          opacity: flipped ? 1 : 0, transform: flipped ? 'rotateY(0deg)' : 'rotateY(90deg)', transition:'all 0.5s' }},
        React.createElement('div', { style:{ fontSize:'2.5rem', marginBottom:'10px' }}, drawn.emoji || '🎴'),
        React.createElement('div', { style:{ fontSize:'0.82rem', fontWeight:700, textAlign:'center', marginBottom:'10px', lineHeight:1.4 }}, drawn.text),
        React.createElement('div', { style:{ fontSize:'0.78rem', fontWeight:700, color: isPositive(drawn) ? '#4CAF50' : ds.red, textAlign:'center' }}, effectDesc(drawn))
      )
    ),

    drawn && React.createElement('div', { style:{ textAlign:'center', marginBottom:'2rem' }},
      React.createElement('button', { onClick:()=>{ setDrawn(null); setCanDraw(false); },
        style:{ padding:'8px 20px', borderRadius:'10px', border:`1px solid ${ds.border}`, cursor:'pointer', background:'transparent', color:ds.muted, fontSize:'0.82rem' }},
        '↩️ Kapat'
      )
    ),

    // History
    history.length > 0 && React.createElement('div', null,
      React.createElement('div', { style:{ fontWeight:700, marginBottom:'8px', color:ds.muted, fontSize:'0.85rem' }}, '📜 Son Kartlar'),
      React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'6px' }},
        history.map((c, i) =>
          React.createElement('div', { key:i, style:{ background:ds.surface, border:`1px solid ${ds.border}`, borderRadius:'8px', padding:'8px 12px', display:'flex', gap:'10px', alignItems:'center' }},
            React.createElement('span', { style:{ fontSize:'1.2rem' }}, c.emoji || '🎴'),
            React.createElement('div', { style:{ flex:1 }},
              React.createElement('div', { style:{ fontSize:'0.82rem' }}, c.text),
              React.createElement('div', { style:{ fontSize:'0.7rem', color:ds.muted }}, new Date(c.ts).toLocaleDateString('tr-TR'))
            ),
            React.createElement('div', { style:{ fontSize:'0.78rem', fontWeight:700, color: isPositive(c) ? '#4CAF50' : ds.red }}, effectDesc(c))
          )
        )
      )
    )
  );
};
