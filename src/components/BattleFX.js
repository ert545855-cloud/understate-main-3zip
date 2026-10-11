"use strict";
// ═══════════════════════════════════════════════════════════════════════════
// Savaş efekti şeridi — window.BattleFX
//   mode: 'battle' → iki taraf, namlu alevleri, iz mermileri, patlama, duman, sarsıntı
//         'march'  → yoldaki konvoy: tanklar ilerler, yol akar, toz kalkar
//   props: { mode, label, sub, height }
// Harekât kartlarında (Silahlı Kuvvetler) ve aktif harekâtlarda (Harekâtlar) kullanılır.
// Saf SVG + CSS animasyonu; hareket azaltma tercihinde sabit görüntü.
// ═══════════════════════════════════════════════════════════════════════════
(function () {
  const R = React, h = R.createElement;
  // Basit, özgün tank silüeti (sağa bakar), 0,0 paletlerin sol altı
  const TANK = 'M2,-2 h30 a3,3 0 0 1 0,6 h-30 a3,3 0 0 1 0,-6 Z M5,-4 h24 l-3,-6 h-15 Z M12,-10 h11 v-6 h-11 Z M23,-14 h16 v2.4 h-16 Z';
  const TRUCK = 'M0,-2 h22 v-12 h-22 Z M22,-2 h10 v-8 l-4,-4 h-6 Z';
  const wheels = (n, x0, gap) => Array.from({ length: n }, (_, i) => h('circle', { key: i, cx: x0 + i * gap, cy: 1.4, r: 2.2, className: 'bfx-wheel' }));

  function Tank({ x, y, s, flip, cls }) {
    return h('g', { transform: `translate(${x},${y}) scale(${flip ? -s : s},${s})`, className: cls },
      h('path', { d: TANK }), wheels(5, 5, 6));
  }

  function BattleFX({ mode, label, sub, height }) {
    const H = height || 92;
    const battle = mode !== 'march';
    // Sabit (deterministik) efekt konumları — her çizimde aynı, titreme yok
    const booms = [[108, 50, 0], [170, 62, .55], [140, 40, 1.1], [205, 52, 1.6], [125, 66, 2.1], [188, 38, 2.6]];
    const tracers = [[70, 58, 150, .1], [74, 64, 190, .7], [266, 56, 140, .4], [262, 62, 180, 1.0], [72, 60, 170, 1.4], [268, 60, 160, 1.8]];
    const smoke = [[118, 46, .2], [160, 50, .9], [196, 44, 1.5], [138, 54, 2.2]];
    return h('div', { className: 'bfx' + (battle ? ' bfx-battle' : ' bfx-march'), style: { height: H }, role: 'img', 'aria-label': label || (battle ? 'Çatışma sürüyor' : 'Birlikler yolda') },
      h('style', null, BFX_CSS),
      h('svg', { viewBox: '0 0 340 92', preserveAspectRatio: 'xMidYMid slice', className: 'bfx-svg' },
        h('defs', null,
          h('linearGradient', { id: battle ? 'bfxSkyB' : 'bfxSkyM', x1: 0, y1: 0, x2: 0, y2: 1 },
            h('stop', { offset: '0%', stopColor: battle ? '#2A1416' : '#0F1A2A' }), h('stop', { offset: '100%', stopColor: '#0A0F17' })),
          h('radialGradient', { id: 'bfxBoom' },
            h('stop', { offset: '0%', stopColor: '#FFF6D6' }), h('stop', { offset: '35%', stopColor: '#FFB43C' }),
            h('stop', { offset: '70%', stopColor: '#E5484D', stopOpacity: .7 }), h('stop', { offset: '100%', stopColor: '#E5484D', stopOpacity: 0 }))),
        h('rect', { width: 340, height: 92, fill: battle ? 'url(#bfxSkyB)' : 'url(#bfxSkyM)' }),
        // uzak siluet tepeler
        h('path', { d: 'M0,70 C40,58 70,64 100,60 C140,54 170,66 210,58 C250,52 290,62 340,56 V92 H0 Z', className: 'bfx-hill' }),
        h('g', { className: battle ? 'bfx-shake' : '' },
          // zemin / yol
          h('rect', { x: 0, y: 76, width: 340, height: 16, className: 'bfx-ground' }),
          !battle && h('g', { className: 'bfx-road' }, Array.from({ length: 12 }, (_, i) => h('rect', { key: i, x: i * 34, y: 83, width: 16, height: 1.6, rx: .8 }))),
          battle
            ? h(R.Fragment, null,
                h(Tank, { x: 22, y: 75, s: .95, cls: 'bfx-own' }), h(Tank, { x: 56, y: 72, s: .7, cls: 'bfx-own bfx-dim' }),
                h(Tank, { x: 318, y: 75, s: .95, flip: true, cls: 'bfx-foe' }), h(Tank, { x: 286, y: 72, s: .7, flip: true, cls: 'bfx-foe bfx-dim' }),
                // namlu alevleri
                h('circle', { cx: 60, cy: 61.5, r: 3, className: 'bfx-muzzle' }),
                h('circle', { cx: 280, cy: 61.5, r: 3, className: 'bfx-muzzle', style: { animationDelay: '.6s' } }),
                tracers.map(([x, y, len, d], i) => h('line', { key: 't' + i, x1: x, y1: y, x2: x + (x < 170 ? len : -len), y2: y - 6, className: 'bfx-tracer ' + (x < 170 ? 'own' : 'foe'), style: { animationDelay: d + 's' } })),
                smoke.map(([x, y, d], i) => h('circle', { key: 's' + i, cx: x, cy: y, r: 9, className: 'bfx-smoke', style: { animationDelay: d + 's' } })),
                booms.map(([x, y, d], i) => h('circle', { key: 'b' + i, cx: x, cy: y, r: 14, className: 'bfx-boom', style: { animationDelay: d + 's' } })),
                h('rect', { width: 340, height: 92, className: 'bfx-flash' }))
            : h('g', { className: 'bfx-convoy' },
                [116, 66, 16].map((x, i) => h('circle', { key: i, cx: x, cy: 79, r: 4.5, className: 'bfx-dust', style: { animationDelay: (i * .35) + 's' } })),
                h(Tank, { x: 120, y: 80, s: .9, cls: 'bfx-own' }),
                h('g', { transform: 'translate(70,80) scale(.9)', className: 'bfx-own' }, h('path', { d: TRUCK }), wheels(3, 5, 10)),
                h(Tank, { x: 20, y: 80, s: .9, cls: 'bfx-own' })))),
      (label || sub) && h('div', { className: 'bfx-cap' },
        label && h('b', null, label), sub && h('span', null, sub))
    );
  }

  const BFX_CSS = `
  .bfx{position:relative;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.07);background:#0A0F17;margin:8px 0}
  .bfx-battle{border-color:rgba(229,72,77,.45)}
  .bfx-svg{position:absolute;inset:0;width:100%;height:100%;display:block}
  .bfx-hill{fill:#121C2B}
  .bfx-battle .bfx-hill{fill:#1D1418}
  .bfx-ground{fill:#0D141F}
  .bfx-own{fill:#3CC8F0;color:#3CC8F0}
  .bfx-foe{fill:#E5484D;color:#E5484D}
  .bfx-dim{opacity:.55}
  .bfx-wheel{fill:#0A0F17;stroke:currentColor;stroke-width:.6}
  .bfx-muzzle{fill:#FFE7A3;opacity:0;animation:bfxMuzzle 1.2s steps(1) infinite}
  .bfx-tracer{stroke-width:1.4;stroke-linecap:round;stroke-dasharray:10 200;opacity:0;animation:bfxTracer 2.2s linear infinite}
  .bfx-tracer.own{stroke:#9BE6FB}
  .bfx-tracer.foe{stroke:#FFB4A8}
  .bfx-boom{fill:url(#bfxBoom);opacity:0;transform-box:fill-box;transform-origin:center;animation:bfxBoom 3.1s ease-out infinite}
  .bfx-smoke{fill:#5C6573;opacity:0;transform-box:fill-box;transform-origin:center;animation:bfxSmoke 3.1s ease-out infinite}
  .bfx-flash{fill:#FFD7A0;opacity:0;animation:bfxFlash 3.1s ease-out infinite;pointer-events:none}
  .bfx-shake{animation:bfxShake 3.1s ease-in-out infinite}
  .bfx-road rect{fill:#2A3647;animation:bfxRoad 1.1s linear infinite}
  .bfx-convoy{animation:bfxRoll 6s ease-in-out infinite alternate}
  .bfx-dust{fill:#3A4556;opacity:0;transform-box:fill-box;transform-origin:center;animation:bfxDust 1.4s ease-out infinite}
  .bfx-cap{position:absolute;left:10px;top:8px;display:flex;flex-direction:column;gap:1px;text-shadow:0 1px 4px rgba(0,0,0,.8)}
  .bfx-cap b{font:700 .8rem 'Rajdhani',sans-serif;letter-spacing:.04em;color:#E6EDF5}
  .bfx-battle .bfx-cap b{color:#FFB4A8}
  .bfx-cap span{font:500 .68rem 'Inter',sans-serif;color:#C9D4E0}
  @keyframes bfxMuzzle{0%{opacity:1}12%{opacity:0}}
  @keyframes bfxTracer{0%{opacity:0;stroke-dashoffset:0}8%{opacity:1}60%{opacity:1}100%{opacity:0;stroke-dashoffset:-210}}
  @keyframes bfxBoom{0%{opacity:0;transform:scale(.2)}6%{opacity:1;transform:scale(.6)}30%{opacity:.85;transform:scale(1.15)}55%{opacity:0;transform:scale(1.5)}100%{opacity:0}}
  @keyframes bfxSmoke{0%,20%{opacity:0;transform:translateY(0) scale(.5)}35%{opacity:.5}100%{opacity:0;transform:translateY(-22px) scale(1.8)}}
  @keyframes bfxFlash{0%,100%{opacity:0}3%{opacity:.18}9%{opacity:0}}
  @keyframes bfxShake{0%,100%{transform:translate(0,0)}2%{transform:translate(-1.2px,.8px)}4%{transform:translate(1px,-.6px)}6%{transform:translate(0,0)}}
  @keyframes bfxRoad{from{transform:translateX(0)}to{transform:translateX(-34px)}}
  @keyframes bfxRoll{from{transform:translateX(0)}to{transform:translateX(150px)}}
  @keyframes bfxDust{0%{opacity:.6;transform:scale(.4)}100%{opacity:0;transform:translate(-14px,-6px) scale(1.8)}}
  @media (prefers-reduced-motion:reduce){.bfx *{animation:none !important}.bfx-boom{opacity:.8}.bfx-smoke{opacity:.4}}
  `;

  window.BattleFX = BattleFX;
})();
