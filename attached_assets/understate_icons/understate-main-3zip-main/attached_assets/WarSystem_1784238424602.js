"use strict";
// ═══════════════════════════════════════════════════════
// SAVAŞ SİSTEMİ — Canlı savaş haritası + ilan akışı + rapor kartı
// EmpireMap.js üzerine kurulu, aynı tasarım dili (gold/dark palet)
// ═══════════════════════════════════════════════════════

const WAR_DS = {
  bg: '#12161f',
  border: 'rgba(201,162,39,0.25)',
  gold: '#C9A227',
  red: '#C24B43',
  text: '#EDE7DA',
  muted: '#9aa1ad',
};

// ── Canlı Savaş Haritası: EmpireMap üzerine cephe/kuşatma/ordu katmanı ekler ──
// props.fronts: [{ fromId, toId, type: 'march'|'siege' }]
function WarMap({ provinces, fronts, onSelect, selectedId }) {
  const data = provinces || window.MAP_PROVINCES || [];
  const outline = window.MAP_CONTINENT_OUTLINE || [];
  const activeFronts = fronts || [];

  const byId = (id) => data.find((p) => p.id === id);
  const siegeIds = React.useMemo(
    () => new Set(activeFronts.filter((f) => f.type === 'siege').flatMap((f) => [f.fromId, f.toId])),
    [activeFronts]
  );

  const contPath = React.useMemo(() => pointsToPath(outline, 2), [outline]);
  const FACTION_COLORS = { player: '201,162,39', ally: '76,154,107', enemy: '194,75,67', neutral: '90,96,107' };

  return React.createElement('svg', {
    viewBox: '0 0 1000 1000',
    style: { width: '100%', height: 'auto', display: 'block', background: '#0d1420', borderRadius: 18 },
  },
    React.createElement('defs', null,
      React.createElement('marker', { id: 'war-arrow', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' },
        React.createElement('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: WAR_DS.red })
      )
    ),
    React.createElement('path', { d: contPath, fill: 'none', stroke: WAR_DS.gold, strokeWidth: 10, opacity: 0.1 }),

    ...data.map((p) => {
      const rgb = FACTION_COLORS[p.owner] || FACTION_COLORS.neutral;
      const isSiege = siegeIds.has(p.id);
      const isSelected = selectedId === p.id;
      return React.createElement('g', {
        key: p.id,
        style: { cursor: 'pointer' },
        onClick: () => onSelect && onSelect(p.id),
      },
        React.createElement('path', {
          d: pointsToPath(p.points, 1),
          fill: `rgba(${rgb},${isSelected ? 0.5 : 0.3})`,
          stroke: isSiege ? WAR_DS.red : (isSelected ? WAR_DS.gold : `rgba(${rgb},0.85)`),
          strokeWidth: isSiege ? 2.6 : (isSelected ? 2.2 : 1.4),
          strokeDasharray: isSiege ? '6,4' : 'none',
        },
          isSiege && React.createElement('animate', { attributeName: 'stroke-opacity', values: '1;0.35;1', dur: '1.6s', repeatCount: 'indefinite' })
        ),
        React.createElement('circle', { cx: p.cx, cy: p.cy, r: 4, fill: WAR_DS.gold, stroke: '#1a1a1a', strokeWidth: 0.8 }),
        React.createElement('text', {
          x: p.cx, y: p.cy - 10, textAnchor: 'middle', fontSize: 13, fontWeight: 700, fill: WAR_DS.text,
          style: { paintOrder: 'stroke', stroke: '#05070b', strokeWidth: 3, strokeLinejoin: 'round' },
        }, p.name)
      );
    }),

    React.createElement('path', { d: contPath, fill: 'none', stroke: WAR_DS.gold, strokeWidth: 2.2, opacity: 0.85 }),

    ...activeFronts.map((f, i) => {
      const from = byId(f.fromId), to = byId(f.toId);
      if (!from || !to) return null;
      return React.createElement(React.Fragment, { key: i },
        React.createElement('line', {
          x1: from.cx, y1: from.cy, x2: to.cx, y2: to.cy,
          stroke: WAR_DS.red, strokeWidth: 2, strokeDasharray: '5,5',
          markerEnd: 'url(#war-arrow)', opacity: 0.8,
        }),
        f.type === 'march' && React.createElement('circle', { r: 6, fill: WAR_DS.red, stroke: '#2a0a0a', strokeWidth: 1.2 },
          React.createElement('animateMotion', { dur: '4s', repeatCount: 'indefinite', path: `M ${from.cx},${from.cy} L ${to.cx},${to.cy}` })
        )
      );
    })
  );
}

// ── Savaş İlanları Akışı ──
// props.declarations: [{ attacker, defender, reason, time }]
function WarDeclarationsFeed({ declarations }) {
  const items = declarations || [];
  return React.createElement('div', { style: { background: WAR_DS.bg, border: `1px solid ${WAR_DS.border}`, borderRadius: 14, padding: 16 } },
    React.createElement('div', {
      style: { fontSize: '0.85rem', color: WAR_DS.gold, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, fontFamily: "'Cinzel',serif" }
    }, 'Savaş İlanları'),
    ...items.map((w, i) => React.createElement('div', {
      key: i,
      style: { fontFamily: "'Inter',sans-serif", fontSize: '0.78rem', padding: '10px 10px', borderRadius: 8, marginBottom: 8, background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${WAR_DS.red}` }
    },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', color: WAR_DS.text, fontWeight: 600, marginBottom: 3 } },
        React.createElement('span', null, w.attacker),
        React.createElement('span', { style: { color: WAR_DS.red } }, '⚔'),
        React.createElement('span', null, w.defender)
      ),
      React.createElement('div', { style: { color: WAR_DS.muted, fontSize: '0.72rem' } }, w.time),
      React.createElement('div', { style: { color: WAR_DS.gold, fontSize: '0.7rem', marginTop: 4 } }, `Sebep: ${w.reason}`)
    ))
  );
}

// ── Savaş Raporu Kartı ──
// props.report: { title, attacker, defender, result, attackerLoss, defenderLoss, loot, wallBefore, wallAfter }
function BattleReportCard({ report }) {
  if (!report) return null;
  const r = report;
  const Row = (label, value, cls) => React.createElement('div', {
    style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }
  },
    React.createElement('span', { style: { color: WAR_DS.muted } }, label),
    React.createElement('span', { style: { fontWeight: cls ? 700 : 400, color: cls === 'win' ? '#4C9A6B' : cls === 'loss' ? WAR_DS.red : WAR_DS.text } }, value)
  );
  return React.createElement('div', {
    style: { background: 'linear-gradient(180deg,#171b25,#12161f)', border: `1px solid ${WAR_DS.border}`, borderRadius: 14, padding: 16, fontFamily: "'Inter',sans-serif", color: WAR_DS.text }
  },
    React.createElement('div', { style: { fontFamily: "'Cinzel',serif", fontSize: '0.95rem', color: WAR_DS.gold, marginBottom: 10, letterSpacing: 1 } }, r.title),
    Row('Saldıran', r.attacker),
    Row('Savunan', r.defender),
    Row('Sonuç', r.result, r.won ? 'win' : 'loss'),
    Row('Saldıran kaybı', r.attackerLoss),
    Row('Savunan kaybı', r.defenderLoss, r.won ? 'loss' : undefined),
    Row('Ganimet', r.loot),
    Row('Sur seviyesi', `${r.wallBefore} → ${r.wallAfter}`)
  );
}

window.WarMap = WarMap;
window.WarDeclarationsFeed = WarDeclarationsFeed;
window.BattleReportCard = BattleReportCard;

// Not: pointsToPath fonksiyonu EmpireMap.js icinde tanimli — bu dosyayi
// EmpireMap.js'den SONRA yukleyin (script sirasi onemli).
