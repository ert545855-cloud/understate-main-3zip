"use strict";
// ═══════════════════════════════════════════════════════
// UNDERSTATE SHARED UI COMPONENTS — Design System v9
// Note: React hooks from app.js global scope at call time
// ═══════════════════════════════════════════════════════

// LedgerValue — stat tile with 2px gold top border + mono number
function LedgerValue({ value, label, prefix='₺', color, style={} }) {
  var c = color || (window.DS && window.DS.gold) || '#C9A227';
  return (
    <div style={{
      background: (window.DS&&window.DS.surface)||'#1B212B',
      border: '1px solid ' + ((window.DS&&window.DS.border)||'rgba(237,231,218,0.08)'),
      borderRadius: (window.DS&&window.DS.radius)||'10px',
      borderTop: '2px solid ' + c,
      padding: '0.55rem 0.75rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minWidth: 0,
      ...style
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.92rem',
        fontWeight: 700,
        color: c,
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
      }}>
        {prefix !== false && prefix}{typeof value === 'number' ? value.toLocaleString('tr-TR') : (value != null ? value : '—')}
      </div>
      {label && (
        <div style={{
          fontSize: '0.57rem',
          color: '#8893A1',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: 600,
          marginTop: '2px',
          fontFamily: "'Inter', sans-serif",
          textAlign: 'center',
        }}>
          {label}
        </div>
      )}
    </div>
  );
}
window.LedgerValue = LedgerValue;

// PrimaryButton — gold filled CTA
function PrimaryButton({ children, onClick, disabled=false, style={}, size='md' }) {
  var _h = React.useState(false); var h = _h[0]; var setH = _h[1];
  var _p = React.useState(false); var p = _p[0]; var setP = _p[1];
  var sizes = {
    sm:   { padding:'0.32rem 0.7rem',  fontSize:'0.75rem', minHeight:'30px' },
    md:   { padding:'0.62rem 1.2rem',  fontSize:'0.87rem', minHeight:'40px' },
    lg:   { padding:'0.82rem 1.5rem',  fontSize:'1rem',    minHeight:'48px' },
    full: { padding:'0.7rem 1rem',     fontSize:'0.87rem', minHeight:'42px', width:'100%' },
  };
  return (
    <button
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>{setH(false);setP(false);}}
      onMouseDown={()=>!disabled&&setP(true)} onMouseUp={()=>setP(false)}
      onTouchStart={()=>!disabled&&setP(true)} onTouchEnd={()=>setP(false)}
      style={{
        background: disabled ? 'rgba(201,162,39,0.18)' : p ? '#A07D1C' : h ? '#DEB12D' : '#C9A227',
        color: disabled ? '#8893A1' : '#11151C',
        border: '1.5px solid transparent',
        borderRadius: '10px',
        fontFamily: "'Inter', sans-serif",
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
        transition: 'all 0.14s ease',
        boxShadow: p || disabled ? 'none' : h ? '0 4px 18px rgba(201,162,39,0.45)' : '0 2px 8px rgba(201,162,39,0.2)',
        WebkitTapHighlightColor: 'transparent',
        outline: 'none', position: 'relative', overflow: 'hidden',
        transform: p ? 'scale(0.96)' : 'none',
        letterSpacing: '0.01em',
        ...sizes[size] || sizes.md,
        ...style,
      }}
    >{children}</button>
  );
}
window.PrimaryButton = PrimaryButton;

// SecondaryButton — neutral ghost
function SecondaryButton({ children, onClick, disabled=false, style={}, size='md' }) {
  var _h = React.useState(false); var h = _h[0]; var setH = _h[1];
  var _p = React.useState(false); var p = _p[0]; var setP = _p[1];
  var sizes = {
    sm:   { padding:'0.32rem 0.7rem',  fontSize:'0.75rem', minHeight:'30px' },
    md:   { padding:'0.62rem 1.2rem',  fontSize:'0.87rem', minHeight:'40px' },
    lg:   { padding:'0.82rem 1.5rem',  fontSize:'1rem',    minHeight:'48px' },
    full: { padding:'0.7rem 1rem',     fontSize:'0.87rem', minHeight:'42px', width:'100%' },
  };
  return (
    <button
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>{setH(false);setP(false);}}
      onMouseDown={()=>!disabled&&setP(true)} onMouseUp={()=>setP(false)}
      onTouchStart={()=>!disabled&&setP(true)} onTouchEnd={()=>setP(false)}
      style={{
        background: disabled ? 'transparent' : p ? 'rgba(237,231,218,0.1)' : h ? 'rgba(237,231,218,0.06)' : 'transparent',
        color: disabled ? '#8893A1' : '#EDE7DA',
        border: '1px solid ' + (h&&!disabled ? 'rgba(237,231,218,0.2)' : 'rgba(237,231,218,0.1)'),
        borderRadius: '10px',
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
        transition: 'all 0.14s ease',
        WebkitTapHighlightColor: 'transparent',
        outline: 'none', position: 'relative', overflow: 'hidden',
        transform: p ? 'scale(0.96)' : 'none',
        ...sizes[size] || sizes.md,
        ...style,
      }}
    >{children}</button>
  );
}
window.SecondaryButton = SecondaryButton;

// Card — standard surface tile
function Card({ children, style={}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#1B212B',
        border: '1px solid rgba(237,231,218,0.08)',
        borderRadius: '10px',
        ...style,
      }}
    >{children}</div>
  );
}
window.Card = Card;

// GoldDivider — thin horizontal separator
function GoldDivider({ style={} }) {
  return <div style={{height:'1px',background:'rgba(201,162,39,0.2)',margin:'0.75rem 0',...style}} />;
}
window.GoldDivider = GoldDivider;

// SectionTitle — Syne uppercase heading
function SectionTitle({ children, style={} }) {
  return (
    <div style={{
      fontFamily:"'Syne',sans-serif",
      fontWeight:800,
      fontSize:'0.82rem',
      color:'#EDE7DA',
      textTransform:'uppercase',
      letterSpacing:'0.1em',
      ...style
    }}>{children}</div>
  );
}
window.SectionTitle = SectionTitle;
