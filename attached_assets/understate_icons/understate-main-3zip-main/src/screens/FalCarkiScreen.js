// ═══════════════════════════════════════════════════════════════
// SALTANAT ONLINE — Fal Çarkı (Günde 1 Kez)
// ═══════════════════════════════════════════════════════════════
window.FalCarkiScreen = function FalCarkiScreen({ profile, onNavigate, showNotif }) {
  const G='#C89B3C', BG='#0F0800', T='#F5EBD7', M='#A9A6A0', S='#2D1800', GR='#3E8C5A';
  const jwt = () => localStorage.getItem('us_jwt') || '';

  const [status,   setStatus]   = React.useState(null);
  const [spinning, setSpinning] = React.useState(false);
  const [result,   setResult]   = React.useState(null);
  const [rotation, setRotation] = React.useState(0);
  const [tick,     setTick]     = React.useState(0);

  React.useEffect(() => { loadStatus(); }, []);
  React.useEffect(() => {
    if (!status?.canSpin && status?.nextSpin) {
      const iv = setInterval(() => setTick(p => p+1), 1000);
      return () => clearInterval(iv);
    }
  }, [status]);

  const loadStatus = async () => {
    try {
      const r = await fetch('/api/fal-carki/status', { headers:{ Authorization:'Bearer '+jwt() }});
      const d = await r.json();
      if (d.success) setStatus(d);
    } catch {}
  };

  const spin = async () => {
    if (spinning || !status?.canSpin) return;
    setSpinning(true);
    setResult(null);
    // Çark animasyonu — 4-6 tam tur + rastgele offset
    const extraTurns = (4 + Math.floor(Math.random() * 3)) * 360;
    const finalAngle = rotation + extraTurns + Math.floor(Math.random() * 360);
    setRotation(finalAngle);

    // API çağrısı
    try {
      await new Promise(r => setTimeout(r, 3200)); // animasyon bekle
      const r = await fetch('/api/fal-carki/spin', { method:'POST', headers:{ Authorization:'Bearer '+jwt() }});
      const d = await r.json();
      if (d.success) {
        setResult(d.dilim);
        loadStatus();
        const msg = d.dilim.type === 'empty'
          ? `${d.dilim.emoji} ${d.dilim.label}`
          : `🎉 ${d.dilim.emoji} ${d.dilim.label} kazandın!`;
        showNotif && showNotif(msg, d.dilim.type === 'empty' ? 'info' : 'success');
      } else {
        showNotif && showNotif(d.message || 'Hata', 'error');
        loadStatus();
      }
    } catch { showNotif && showNotif('Bağlantı hatası', 'error'); }
    setSpinning(false);
  };

  const timeUntil = (ts) => {
    if (!ts) return '';
    const ms = new Date(ts) - Date.now();
    if (ms <= 0) return 'Hazır!';
    const h = Math.floor(ms/3600000), m = Math.floor((ms%3600000)/60000), s = Math.floor((ms%60000)/1000);
    return `${h}sa ${m}dk ${s}sn`;
  };

  const COLORS = ['#C89B3C','#B8423C','#3E8C5A','#A78BFA','#60A5FA','#F97316','#C89B3C','#B8423C','#3E8C5A','#A9A6A0'];
  const dilimler = status?.dilimler || [];
  const sliceAngle = dilimler.length > 0 ? 360 / dilimler.length : 36;

  return React.createElement('div', { style:{ minHeight:'100vh', background:BG, fontFamily:"'Inter',sans-serif", paddingBottom:80 }},

    // Header
    React.createElement('div', { style:{ background:'linear-gradient(135deg,#1a0800,#2d1600)', borderBottom:'1px solid rgba(200,155,60,0.2)', padding:'14px 16px' }},
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:10 }},
        onNavigate && React.createElement('button', { onClick:()=>onNavigate('home'),
          style:{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'6px 10px', color:M, fontSize:'0.75rem', cursor:'pointer' }}, '← Geri'),
        React.createElement('span', { style:{ fontSize:'1.5rem' }}, '🎡'),
        React.createElement('div', null,
          React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontWeight:900, fontSize:'1.1rem', color:G }}, 'Fal Çarkı'),
          React.createElement('div', { style:{ fontSize:'0.62rem', color:M }}, 'Her 20 saatte bir bedava çevirme')
        )
      )
    ),

    React.createElement('div', { style:{ padding:'24px 16px', display:'flex', flexDirection:'column', alignItems:'center' }},

      // Çark SVG
      React.createElement('div', { style:{ position:'relative', marginBottom:24 }},
        // İşaretçi (ok)
        React.createElement('div', { style:{
          position:'absolute', top:-18, left:'50%', transform:'translateX(-50%)',
          width:0, height:0,
          borderLeft:'12px solid transparent', borderRight:'12px solid transparent',
          borderTop:`24px solid ${G}`,
          filter:'drop-shadow(0 2px 4px rgba(200,155,60,0.5))',
          zIndex:10
        }}),

        // Çark dairesi
        React.createElement('div', { style:{
          width:280, height:280,
          borderRadius:'50%',
          border:`6px solid ${G}`,
          boxShadow:`0 0 40px rgba(200,155,60,0.3), 0 0 0 2px rgba(200,155,60,0.1)`,
          overflow:'hidden',
          position:'relative',
          transition: spinning ? 'transform 3.2s cubic-bezier(0.17,0.67,0.12,0.99)' : 'none',
          transform:`rotate(${rotation}deg)`,
        }},
          dilimler.map((d, i) => {
            const startAngle = i * sliceAngle;
            const midAngle   = startAngle + sliceAngle / 2;
            const rad = (angle) => (angle - 90) * Math.PI / 180;
            const cx = 140, cy = 140, r = 134;
            const x1 = cx + r * Math.cos(rad(startAngle));
            const y1 = cy + r * Math.sin(rad(startAngle));
            const x2 = cx + r * Math.cos(rad(startAngle + sliceAngle));
            const y2 = cy + r * Math.sin(rad(startAngle + sliceAngle));
            const lx = cx + (r*0.65) * Math.cos(rad(midAngle));
            const ly = cy + (r*0.65) * Math.sin(rad(midAngle));
            const largeArc = sliceAngle > 180 ? 1 : 0;
            const pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
            const col = COLORS[i % COLORS.length];

            return React.createElement('svg', { key:d.id, style:{ position:'absolute', top:0, left:0, width:'100%', height:'100%', overflow:'visible' }, viewBox:'0 0 280 280' },
              React.createElement('path', { d:pathD, fill:col, stroke:BG, strokeWidth:1.5, opacity:0.85 }),
              React.createElement('text', { x:lx, y:ly, textAnchor:'middle', dominantBaseline:'middle', fontSize:'16', fill:'#fff', style:{ pointerEvents:'none', userSelect:'none', textShadow:'0 1px 3px rgba(0,0,0,0.8)' }}, d.emoji),
              React.createElement('text', { x:lx, y:ly+16, textAnchor:'middle', dominantBaseline:'middle', fontSize:'7', fill:'rgba(255,255,255,0.9)', style:{ pointerEvents:'none', userSelect:'none' }},
                d.amount > 0 ? `×${d.amount}` : '')
            );
          })
        ),

        // Merkez dairei
        React.createElement('div', { style:{
          position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
          width:48, height:48, borderRadius:'50%',
          background:`radial-gradient(circle,${G},#A07828)`,
          border:`4px solid #0F0800`,
          boxShadow:`0 0 16px rgba(200,155,60,0.6)`,
          zIndex:5, display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'1.2rem'
        }}, '⚜️')
      ),

      // Çevir butonu
      status?.canSpin
        ? React.createElement('button', { onClick:spin, disabled:spinning,
            style:{ padding:'14px 48px', borderRadius:14, border:'none', fontSize:'1rem', fontWeight:800,
              fontFamily:"'Cinzel',serif", cursor:spinning?'not-allowed':'pointer',
              background: spinning ? M+'44' : `linear-gradient(135deg,${G},#A07828)`,
              color: spinning ? M : '#0F0800',
              boxShadow: spinning ? 'none' : '0 6px 24px rgba(200,155,60,0.45)',
              transition:'all 0.2s' }},
            spinning ? '🌀 Çark Dönüyor…' : '🎡 ÇEVİR!')
        : React.createElement('div', { style:{ textAlign:'center' }},
            React.createElement('div', { style:{ color:M, fontSize:'0.85rem', marginBottom:8 }}, '⏳ Sonraki çevirme:'),
            React.createElement('div', { style:{ fontFamily:"'JetBrains Mono',monospace", fontSize:'1.3rem', fontWeight:800, color:G }},
              timeUntil(status?.nextSpin))
          ),

      // Sonuç kutusu
      result && React.createElement('div', { style:{
        marginTop:20, padding:'16px 24px', borderRadius:16,
        background: result.type==='empty' ? 'rgba(255,255,255,0.04)' : `rgba(200,155,60,0.1)`,
        border: `1px solid ${result.type==='empty' ? 'rgba(255,255,255,0.1)' : G+'44'}`,
        textAlign:'center',
        boxShadow: result.type!=='empty' ? '0 4px 20px rgba(200,155,60,0.2)' : 'none',
        animation:'slideUp 0.4s ease'
      }},
        React.createElement('div', { style:{ fontSize:'2.5rem', marginBottom:6 }}, result.emoji),
        React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'1rem', fontWeight:800, color: result.type==='empty'?M:G }},
          result.label),
        result.type !== 'empty' && React.createElement('div', { style:{ fontSize:'0.72rem', color:M, marginTop:4 }}, 'Hesabınıza eklendi!')
      ),

      // Son ödül
      !result && status?.lastReward && React.createElement('div', { style:{ marginTop:16, textAlign:'center', color:M, fontSize:'0.75rem' }},
        `Son kazanılan: ${status.lastReward.emoji} ${status.lastReward.label}`)
    )
  );
};
