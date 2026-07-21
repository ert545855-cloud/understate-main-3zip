"use strict";
// ═══════════════════════════════════════════════════════
// İMPARATORLUK HARİTASI — Voronoi tabanlı eyalet haritası
// Palette: bg=#0B0F16  gold=#C9A227  text=#EDE7DA
// Kaynak veri: mapData.js (MAP_PROVINCES, MAP_CONTINENT_OUTLINE)
// ═══════════════════════════════════════════════════════

const EM_DS = {
  bg: '#0B0F16',
  sea: '#0d1420',
  gold: '#C9A227',
  text: '#EDE7DA',
  muted: '#6B7687',
  border: 'rgba(201,162,39,0.55)',
};

// Beylik/hanedan renkleri — owner alanına bu id'lerden biri atanır
const FACTION_COLORS = {
  player:   '201,162,39',   // altın — kendi beyliğin
  ally:     '76,154,107',   // yeşil — ittifak
  enemy:    '194,75,67',    // kırmızı — düşman
  neutral:  '90,96,107',    // gri — sahipsiz/NPC
};

function chaikinSmooth(points, iterations) {
  let pts = points;
  for (let it = 0; it < iterations; it++) {
    const next = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const p0 = pts[i], p1 = pts[(i + 1) % n];
      next.push([0.75 * p0[0] + 0.25 * p1[0], 0.75 * p0[1] + 0.25 * p1[1]]);
      next.push([0.25 * p0[0] + 0.75 * p1[0], 0.25 * p0[1] + 0.75 * p1[1]]);
    }
    pts = next;
  }
  return pts;
}

function pointsToPath(points, smoothIter) {
  const pts = smoothIter ? chaikinSmooth(points, smoothIter) : points;
  let d = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)} `;
  for (let i = 1; i < pts.length; i++) d += `L ${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)} `;
  return d + 'Z';
}

// EmpireMap: props.provinces (opsiyonel override), props.onSelect(provinceId), props.selectedId
function EmpireMap({ provinces, onSelect, selectedId }) {
  const data = provinces || window.MAP_PROVINCES || [];
  const outline = window.MAP_CONTINENT_OUTLINE || [];
  const [hoverId, setHoverId] = React.useState(null);

  const contPath = React.useMemo(() => pointsToPath(outline, 2), [outline]);

  return React.createElement('div', { style: { position: 'relative', width: '100%' } },
    React.createElement('svg', {
      viewBox: '0 0 1000 1000',
      style: { width: '100%', height: 'auto', display: 'block', background: EM_DS.sea, borderRadius: 18 },
    },
      React.createElement('defs', null,
        React.createElement('filter', { id: 'em-glow', x: '-50%', y: '-50%', width: '200%', height: '200%' },
          React.createElement('feGaussianBlur', { stdDeviation: 3, result: 'b' }),
          React.createElement('feMerge', null,
            React.createElement('feMergeNode', { in: 'b' }),
            React.createElement('feMergeNode', { in: 'SourceGraphic' })
          )
        )
      ),
      // dış hat glow
      React.createElement('path', { d: contPath, fill: 'none', stroke: EM_DS.gold, strokeWidth: 10, opacity: 0.1, filter: 'url(#em-glow)' }),

      // eyaletler
      ...data.map((p) => {
        const isHover = hoverId === p.id;
        const isSelected = selectedId === p.id;
        const rgb = FACTION_COLORS[p.owner] || FACTION_COLORS.neutral;
        const fillOpacity = isSelected ? 0.55 : isHover ? 0.4 : 0.28;
        return React.createElement('g', {
          key: p.id,
          style: { cursor: 'pointer' },
          onMouseEnter: () => setHoverId(p.id),
          onMouseLeave: () => setHoverId((h) => (h === p.id ? null : h)),
          onClick: () => onSelect && onSelect(p.id),
        },
          React.createElement('path', {
            d: pointsToPath(p.points, 1),
            fill: `rgba(${rgb},${fillOpacity})`,
            stroke: isSelected ? EM_DS.gold : `rgba(${rgb},0.8)`,
            strokeWidth: isSelected ? 2.4 : 1.4,
            style: { transition: 'all 0.15s' },
          }),
          React.createElement('circle', { cx: p.cx, cy: p.cy, r: 4, fill: EM_DS.gold, stroke: '#1a1a1a', strokeWidth: 0.8 }),
          React.createElement('text', {
            x: p.cx, y: p.cy - 10, textAnchor: 'middle', fontSize: 13, fontWeight: 700,
            fill: EM_DS.text, fontFamily: "'Cinzel',serif",
            style: { paintOrder: 'stroke', stroke: '#05070b', strokeWidth: 3, strokeLinejoin: 'round' },
          }, p.name)
        );
      }),

      // net dış hat
      React.createElement('path', { d: contPath, fill: 'none', stroke: EM_DS.gold, strokeWidth: 2.2, opacity: 0.85 })
    ),

    // hover tooltip
    hoverId != null && React.createElement('div', {
      style: {
        position: 'absolute', top: 10, left: 10, background: 'rgba(11,15,22,0.92)',
        border: `1px solid ${EM_DS.border}`, borderRadius: 10, padding: '8px 12px',
        color: EM_DS.text, fontFamily: "'Inter',sans-serif", fontSize: '0.8rem', pointerEvents: 'none',
      }
    }, (data.find(p => p.id === hoverId) || {}).name)
  );
}

window.EmpireMap = EmpireMap;
window.pointsToPath = pointsToPath;
window.chaikinSmooth = chaikinSmooth;
