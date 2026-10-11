"use strict";
// ═══════════════════════════════════════════════════════════════════════════
// SALTANAT ONLINE — DÜNYA HARİTASI (window.WorldMapScreen)
// SVG dünya haritası: assets/maps/world.svg (Miller, Natural Earth 1:50m)
// • Parmakla kaydır / iki parmakla yakınlaştır / çift dokun / fare tekerleği
// • Harita modları: Siyasi (beylik toprakları) · Kıtalar · Kaynaklar
// • Ülke kartı: fethet, savaş ilan et, göç et, ticaret, diplomasi
// Toprak sahipliği 'worldMap' anahtarıyla localStorage + socket stateUpdate
// üzerinden diğer oyunculara yayılır (mevcut cityOwnership deseniyle aynı).
// Tüm sabitler IIFE içinde — birleşik betikte isim çakışması olmaz.
// ═══════════════════════════════════════════════════════════════════════════
(function () {
  const R = React;
  const h = R.createElement;
  const WM_SRC = 'assets/maps/world.svg';
  const C = {
    ocean: '#04080F', oceanHi: '#0A1A2E', land: '#1C2738', edge: '#070D18',
    gold: '#3CC8F0', goldHi: '#9BE6FB', text: '#E6EDF5', muted: '#8893A1',
    surface: '#111A28', line: 'rgba(60,200,240,0.18)', red: '#C24B43', green: '#4C9A6B',
  };
  const CONTINENTS = {
    'Avrupa': '#5B7DB1', 'Asya': '#B08A3E', 'Afrika': '#9C5B45',
    'Kuzey Amerika': '#4E8F7A', 'Güney Amerika': '#7D9A4A', 'Okyanusya': '#7A68A6',
  };
  const MODES = [
    { id: 'siyasi', label: 'Siyasi' },
    { id: 'kita', label: 'Kıtalar' },
    { id: 'kaynak', label: 'Kaynaklar' },
  ];
  const MIGRATE_COST = 25000;
  const MAX_K = 40;

  // ── yardımcılar ───────────────────────────────────────────────────────────
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const money = (n) => (typeof fmtWord === 'function' ? fmtWord(n) : Number(n || 0).toLocaleString('tr-TR'));
  const trLower = (s) => String(s || '').toLocaleLowerCase('tr');
  const flagOf = (id) => (/^[A-Z]{2}$/.test(id) ? String.fromCodePoint(...[...id].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)) : '🏳️');
  const mix = (a, b, t) => {
    const p = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const A = p(a), B = p(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };
  const reduceMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

  // Ülke başına sabit oyun değerleri (ülke kodundan türetilir, her oyuncuda aynı)
  function statsOf(c) {
    const h = hash(c.id);
    const size = clamp(Math.log10(Math.max(c.km2, 10)) / 7, 0, 1); // 0..1
    const kaynak = clamp(Math.round(18 + size * 52 + (h % 31)), 5, 100);
    const savunma = clamp(Math.round(20 + size * 40 + ((h >>> 8) % 41)), 5, 100);
    const bedel = Math.min(50e6, Math.round(((250000 + c.km2 * 0.9) * (1 + savunma / 100)) / 1000) * 1000);
    return { kaynak, savunma, bedel };
  }

  // ── SVG verisi: bir kez indir, ayrıştır, önbellekle ─────────────────────────
  let cache = null, pending = null;
  function loadWorld() {
    if (cache) return Promise.resolve(cache);
    if (pending) return pending;
    pending = fetch(WM_SRC)
      .then(r => { if (!r.ok) throw new Error('Harita dosyası alınamadı (HTTP ' + r.status + ')'); return r.text(); })
      .then(txt => {
        const doc = new DOMParser().parseFromString(txt, 'image/svg+xml');
        const vb = (doc.documentElement.getAttribute('viewBox') || '0 0 1000 500').split(/[\s,]+/).map(Number);
        const countries = Array.from(doc.querySelectorAll('#countries path')).map(p => ({
          id: p.getAttribute('id'),
          name: p.getAttribute('data-name') || p.getAttribute('id'),
          cont: p.getAttribute('data-continent') || 'Diğer',
          km2: +p.getAttribute('data-km2') || 0,
          cx: +p.getAttribute('data-cx') || 0,
          cy: +p.getAttribute('data-cy') || 0,
          bw: +p.getAttribute('data-bw') || 0,
          d: p.getAttribute('d'),
        })).filter(c => c.id && c.d);
        if (!countries.length) throw new Error('Harita dosyası boş görünüyor');
        countries.forEach(c => { c.stats = statsOf(c); c.flag = flagOf(c.id); c.key = trLower(c.name); });
        const ist = doc.getElementById('istanbul');
        cache = {
          W: vb[2], H: vb[3], countries,
          byId: Object.fromEntries(countries.map(c => [c.id, c])),
          grat: (doc.getElementById('graticule') || { getAttribute: () => '' }).getAttribute('d') || '',
          rose: ist ? [+ist.getAttribute('cx'), +ist.getAttribute('cy')] : [vb[2] * 0.55, vb[3] * 0.39],
        };
        return cache;
      })
      .catch(e => { pending = null; throw e; });
    return pending;
  }

  // ── sunucu API (server/routes/world.js) ─────────────────────────────────────
  // Toprak sahipliği sunucuda (world_territories tablosu) tutulur; istemci yalnızca
  // okur ve eylem ister. Değişiklikler 'worldMapUpdate' socket olayıyla gelir.
  const jwt = () => { try { return localStorage.getItem('us_jwt') || localStorage.getItem('authToken') || ''; } catch (e) { return ''; } };
  async function apiCall(url, body) {
    const headers = { 'Content-Type': 'application/json' };
    const t = jwt(); if (t) headers.Authorization = 'Bearer ' + t;
    let r;
    try { r = await fetch(url, { method: body ? 'POST' : 'GET', headers, body: body ? JSON.stringify(body) : undefined }); }
    catch (e) { const err = new Error('Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.'); err.status = 0; throw err; }
    let d = null; try { d = await r.json(); } catch (e) {}
    if (!r.ok || !d || d.success === false) {
      const msg = (d && (d.error || d.message)) || (r.status === 401 ? 'Oturumun süresi dolmuş, yeniden giriş yap.' : `Sunucu isteği tamamlayamadı (${r.status}).`);
      const err = new Error(msg); err.status = r.status; err.data = d; throw err;
    }
    return d;
  }
  // Fetih öncesi yerel sikkeyi sunucuya yaz (otomatik kayıt 30 sn'de bir çalışıyor)
  async function syncMoney(money) {
    if (typeof money !== 'number' || !jwt()) return;
    try { await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt() }, body: JSON.stringify({ money }) }); } catch (e) {}
  }

  // ── toprak sahipliği (sunucudan) ──────────────────────────────────────────
  function readLs(key, def) { try { const v = localStorage.getItem('rep_' + key); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function storeOwnership(t) {
    try { localStorage.setItem('rep_worldMap', JSON.stringify(t)); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('fb-sync', { detail: { key: 'worldMap', value: t } })); } catch (e) {}
  }
  function useWorldOwnership() {
    const [own, setOwn] = R.useState(() => readLs('worldMap', {}) || {});
    const [status, setStatus] = R.useState('loading'); // loading | live | offline
    const refresh = R.useCallback(() => apiCall('/api/world/territories')
      .then(d => { const t = d.territories || {}; setOwn(t); storeOwnership(t); setStatus('live'); })
      .catch(() => setStatus('offline')), []);
    R.useEffect(() => {
      refresh();
      const h = (e) => { if (e.detail && e.detail.key === 'worldMap' && e.detail.value) { setOwn(e.detail.value); setStatus('live'); } };
      window.addEventListener('fb-sync', h);
      window.addEventListener('socket-reconnected', refresh);
      return () => { window.removeEventListener('fb-sync', h); window.removeEventListener('socket-reconnected', refresh); };
    }, []);
    const apply = R.useCallback((t) => { setOwn(t || {}); storeOwnership(t || {}); }, []);
    return [own, apply, status, refresh];
  }

  // ── haritanın statik katmanı (sadece renkler değişince yeniden çizilir) ───
  const CountryLayer = R.memo(function CountryLayer({ countries, fills }) {
    return R.createElement('g', null, countries.map(c =>
      R.createElement('path', { key: c.id, className: 'wm-c', 'data-id': c.id, d: c.d, fill: fills[c.id] || C.land })
    ));
  });

  // ── Askeri harekât katmanı ────────────────────────────────────────────────
  const UNIT_POWER = { piyade: 1, tank: 60, topcu: 35, iha: 45 };
  const fmtDur = (sec) => (window.gameApi ? window.gameApi.fmtDur(sec) : Math.round(sec) + ' sn');
  // İkinci dereceden Bezier: kalkış → hedef, yukarı kavisli
  function opGeom(op, byId) {
    const a = byId[op.origin], b = byId[op.target];
    if (!a || !b) return null;
    const dx = b.cx - a.cx, dy = b.cy - a.cy, d = Math.hypot(dx, dy) || 1;
    let nx = -dy / d, ny = dx / d; if (ny > 0) { nx = -nx; ny = -ny; }
    const bend = Math.min(60, d * 0.28);
    const c = { x: (a.cx + b.cx) / 2 + nx * bend, y: (a.cy + b.cy) / 2 + ny * bend };
    const at = (t) => ({ x: (1 - t) * (1 - t) * a.cx + 2 * (1 - t) * t * c.x + t * t * b.cx, y: (1 - t) * (1 - t) * a.cy + 2 * (1 - t) * t * c.y + t * t * b.cy });
    return { a, b, c, at, d: `M${a.cx},${a.cy}Q${c.x.toFixed(1)},${c.y.toFixed(1)} ${b.cx},${b.cy}` };
  }
  const seeded = (seed) => { let x = (seed * 9301 + 49297) % 233280; return () => (x = (x * 9301 + 49297) % 233280) / 233280; };

  // Çatışma efekti: patlamalar, duman, iz mermileri, kırmızı dalga (ekran pikseli ölçeğinde)
  function WarFX({ x, y, s, seed }) {
    const rnd = seeded(seed || 1), booms = [], smoke = [], tracers = [];
    for (let i = 0; i < 6; i++) booms.push({ x: (rnd() - 0.5) * 34, y: (rnd() - 0.5) * 24, r: 6 + rnd() * 7, d: (rnd() * 1.6).toFixed(2) });
    for (let i = 0; i < 5; i++) smoke.push({ x: (rnd() - 0.5) * 30, y: (rnd() - 0.5) * 14, r: 6 + rnd() * 6, d: (rnd() * 2.4).toFixed(2) });
    for (let i = 0; i < 5; i++) tracers.push({ x1: -26 + rnd() * 6, y1: (rnd() - 0.5) * 18, x2: 22 + rnd() * 6, y2: (rnd() - 0.5) * 18, d: (rnd() * 0.9).toFixed(2) });
    return h('g', { className: 'wm-fx', transform: `translate(${x},${y}) scale(${1 / s})` },
      h('circle', { r: 16, className: 'wm-fx-wave' }), h('circle', { r: 16, className: 'wm-fx-wave', style: { animationDelay: '1.1s' } }),
      smoke.map((p, i) => h('circle', { key: 's' + i, cx: p.x, cy: p.y, r: p.r, className: 'wm-fx-smoke', style: { animationDelay: p.d + 's' } })),
      tracers.map((t, i) => h('line', { key: 't' + i, x1: t.x1, y1: t.y1, x2: t.x2, y2: t.y2, className: 'wm-fx-tracer', style: { animationDelay: t.d + 's' } })),
      booms.map((b, i) => h('circle', { key: 'b' + i, cx: b.x, cy: b.y, r: b.r, className: 'wm-fx-boom', style: { animationDelay: b.d + 's' } })),
    );
  }

  function OpsLayer({ ops, byId, s, now, myStateId }) {
    const tankPath = (window.US_ICONS && window.US_ICONS.tank) || '';
    return h('g', { className: 'wm-ops' }, ops.map(op => {
      const g = opGeom(op, byId); if (!g) return null;
      const mine = myStateId && op.stateId === myStateId;
      const col = op.renk || '#3CC8F0';
      const parts = [h('path', { key: 'arc', d: g.d, className: 'wm-arc' + (op.status === 'moving' ? ' run' : ''), style: { stroke: col } })];
      parts.push(h('g', { key: 'base', transform: `translate(${g.a.cx},${g.a.cy}) scale(${1 / s})` }, h('circle', { r: 4, className: 'wm-base', style: { stroke: col } })));
      if (op.status === 'moving') {
        const p = Math.min(1, Math.max(0, (now - op.departAt) / Math.max(1, op.arriveAt - op.departAt)));
        const pt = g.at(p), left = (op.arriveAt - now) / 1000;
        parts.push(h('g', { key: 'unit', transform: `translate(${pt.x.toFixed(2)},${pt.y.toFixed(2)}) scale(${1 / s})` },
          h('circle', { r: 15, className: 'wm-unit-halo', style: { fill: col } }),
          h('circle', { r: 11, className: 'wm-unit', style: { stroke: col } }),
          h('g', { transform: 'translate(-8,-8) scale(0.667)', className: 'wm-unit-ic', dangerouslySetInnerHTML: { __html: tankPath } }),
          h('text', { y: 25, className: 'wm-unit-eta' + (mine ? ' mine' : '') }, fmtDur(left))));
      } else if (op.status === 'battle') {
        const left = (op.battleEndAt - now) / 1000;
        parts.push(h(WarFX, { key: 'fx', x: g.b.cx, y: g.b.cy, s, seed: op.id }));
        parts.push(h('text', { key: 'bt', x: g.b.cx, y: g.b.cy, dy: 34 / s, className: 'wm-fx-label', style: { fontSize: (10.5 / s) + 'px', strokeWidth: (3 / s) + 'px' } }, `Çatışma ${fmtDur(left)}`));
      } else if (op.status === 'won' || op.status === 'lost') {
        const won = op.status === 'won';
        parts.push(h('g', { key: 'res', transform: `translate(${g.b.cx},${g.b.cy}) scale(${1 / s})`, className: 'wm-res' },
          h('rect', { x: -40, y: -26, width: 80, height: 18, rx: 9, className: won ? 'wm-res-w' : 'wm-res-l' }),
          h('text', { y: -13.5, className: 'wm-res-t' }, won ? 'ZAFER' : 'PÜSKÜRTÜLDÜ')));
      }
      return h('g', { key: op.id, className: 'wm-op ' + op.status }, parts);
    }));
  }

  // Harekât planlama penceresi
  function OperationModal({ target, onClose, onLaunched, notify }) {
    const [est, setEst] = R.useState(null), [mil, setMil] = R.useState(null), [err, setErr] = R.useState(null);
    const [sel, setSel] = R.useState({ piyade: 0, tank: 0, topcu: 0, iha: 0 });
    const [busy, setBusy] = R.useState(false);
    R.useEffect(() => {
      Promise.all([window.gameApi.call('/api/military/estimate?target=' + target.id), window.gameApi.call('/api/military/me')])
        .then(([e, m]) => {
          setEst(e); setMil(m.mil);
          if (m.mil) setSel({ piyade: Math.floor(m.mil.piyade * 0.6 / 500) * 500, tank: Math.floor(m.mil.tank * 0.6), topcu: Math.floor(m.mil.topcu * 0.6), iha: Math.floor(m.mil.iha * 0.6) });
        })
        .catch(e => setErr(e.message));
    }, [target.id]);
    const UN = [
      { k: 'piyade', ad: 'Asker', ic: 'soldier', step: 500 }, { k: 'tank', ad: 'Tank', ic: 'tank', step: 1 },
      { k: 'topcu', ad: 'Obüs', ic: 'artillery', step: 1 }, { k: 'iha', ad: 'İHA', ic: 'drone', step: 1 },
    ];
    const power = UN.reduce((a, u) => a + (sel[u.k] || 0) * UNIT_POWER[u.k], 0);
    const used = UN.filter(u => sel[u.k] > 0);
    const eta = est && used.length ? Math.max(...used.map(u => est.travelSeconds[u.k])) : 0;
    let chance = 0;
    if (est && power > 0) {
      const D = (est.defenseMin + est.defenseMax) / 2 / 1; let w = 0; const r = seeded(power % 9973 + 7);
      for (let i = 0; i < 400; i++) if (power * (0.85 + r() * 0.3) > D * (0.85 + r() * 0.3)) w++;
      chance = Math.round(w / 4);
    }
    const chanceCol = chance >= 70 ? '#3FB27F' : chance >= 35 ? '#F2A93B' : '#E5484D';
    const launch = async () => {
      if (busy || !power) return; setBusy(true);
      try {
        const d = await window.gameApi.call('/api/military/operation', { target: target.id, ...sel });
        window.gameApi.progress('operation');
        notify(`🎖️ Birlikler ${target.name} hedefine yola çıktı. Varış: ${fmtDur((d.op.arriveAt - d.now) / 1000)}`, 'success');
        onLaunched(d.op, d.now);
      } catch (e) { notify(e.message, 'error'); setBusy(false); }
    };
    const arriveClock = eta ? new Date(Date.now() + eta * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '';
    return h('div', { className: 'wm-modal-bg', onClick: onClose },
      h('div', { className: 'wm-modal', role: 'dialog', 'aria-label': 'Askeri harekât', onClick: e => e.stopPropagation() },
        h('div', { className: 'wm-modal-h' },
          h('div', null, h('div', { className: 'wm-modal-k' }, 'Askeri harekât'),
            h('div', { className: 'wm-modal-t' }, est ? `${window.gameApi.flagOf(est.origin)} ${est.originName}  →  ${target.flag} ${target.name}` : `${target.flag} ${target.name}`)),
          h('button', { type: 'button', className: 'wm-x', onClick: onClose, 'aria-label': 'Kapat' }, '✕')),
        err && h('p', { className: 'wm-modal-err' }, err),
        !err && (!est || !mil) && h('div', { className: 'wm-modal-load' }, h('div', { className: 'wm-spin' }), 'Karargâh hesaplıyor…'),
        est && mil && h(R.Fragment, null,
          est.defender && h('p', { className: 'wm-modal-note' }, `${target.name} ${est.defender} devletinin toprağı; savunmaya onun garnizonu da katılır.`),
          h('div', { className: 'wm-sliders' }, UN.map(u => h('label', { key: u.k, className: 'wm-sl' + (mil[u.k] ? '' : ' off') },
            h('span', { className: 'wm-sl-h' }, window.SvgIcon && h(window.SvgIcon, { name: u.ic, size: 18 }), u.ad,
              h('b', null, `${(sel[u.k] || 0).toLocaleString('tr-TR')} / ${(mil[u.k] || 0).toLocaleString('tr-TR')}`)),
            h('input', { type: 'range', min: 0, max: mil[u.k] || 0, step: Math.min(u.step, mil[u.k] || 1), value: sel[u.k] || 0, disabled: !mil[u.k],
              onChange: e => setSel(x => ({ ...x, [u.k]: Number(e.target.value) })) })))),
          h('div', { className: 'wm-sum' },
            h('div', null, h('span', null, 'Saldırı gücü'), h('b', null, power.toLocaleString('tr-TR'))),
            h('div', null, h('span', null, 'Tahmini direnç'), h('b', null, `${est.defenseMin.toLocaleString('tr-TR')}–${est.defenseMax.toLocaleString('tr-TR')}`)),
            h('div', null, h('span', null, 'Mesafe'), h('b', null, est.distanceKm.toLocaleString('tr-TR') + ' km')),
            h('div', null, h('span', null, 'Varış süresi'), h('b', null, eta ? `${fmtDur(eta)} (${arriveClock})` : '—'))),
          h('div', { className: 'wm-chance' }, h('span', null, 'Kazanma şansı'), h('div', { className: 'wm-chance-bar' }, h('i', { style: { width: chance + '%', background: chanceCol } })), h('b', { style: { color: chanceCol } }, `%${chance}`)),
          h('p', { className: 'wm-modal-note' }, 'En yavaş birlik varış süresini belirler. Çatışma varıştan sonra 45 saniye sürer; kazanırsan ülke devletine geçer, sağ kalan birlikler geri döner.'),
          h('button', { type: 'button', className: 'wm-act wm-act-red wm-launch', disabled: busy || !power, onClick: launch },
            busy ? 'Emir veriliyor…' : power ? `Harekâtı başlat` : 'Birlik seç'))));
  }

  // ═════════════════════════════════════════════════════════════════════════
  function WorldMapScreen(props) {
    const { profile, setProfile, showNotif, onNavigate } = props;
    const notify = (m, t) => { try { showNotif ? showNotif(m, t) : alert(m); } catch (e) {} };
    const uid = profile && (profile.uid || profile.id);

    const [data, setData] = R.useState(cache);
    const [err, setErr] = R.useState(null);
    const [mode, setMode] = R.useState(() => { try { return localStorage.getItem('wm_mode') || 'siyasi'; } catch (e) { return 'siyasi'; } });
    const [selId, setSelId] = R.useState(null);
    const [query, setQuery] = R.useState('');
    const [searchOpen, setSearchOpen] = R.useState(false);
    const [view, setView] = R.useState({ scale: 1, k: 1 }); // gesture bitince güncellenir (etiketler için)
    const [own, setOwn, ownStatus, refreshOwn] = useWorldOwnership();
    const [busy, setBusy] = R.useState(null);
    // Harekâtlar (tüm devletler) — canlı konum için saniyede bir yeniden çizilir
    const [ops, setOps] = R.useState([]);
    const [skew, setSkew] = R.useState(0);
    const [nowTick, setNowTick] = R.useState(Date.now());
    const [opTarget, setOpTarget] = R.useState(null);
    R.useEffect(() => {
      if (!window.gameApi) return;
      const load = () => window.gameApi.call('/api/military/operations').then(d => { setOps(d.ops || []); if (d.now) setSkew(d.now - Date.now()); }).catch(() => {});
      load();
      const onUp = (e) => {
        const d = e.detail || {}, op = d.op; if (!op) return;
        if (d.now) setSkew(d.now - Date.now());
        setOps(list => { const i = list.findIndex(x => x.id === op.id); const next = list.slice(); if (i >= 0) next[i] = op; else next.unshift(op); return next; });
      };
      window.addEventListener('operation-update', onUp);
      const iv = setInterval(() => setNowTick(Date.now()), 1000), iv2 = setInterval(load, 60000);
      return () => { window.removeEventListener('operation-update', onUp); clearInterval(iv); clearInterval(iv2); };
    }, []);
    const [stageH, setStageH] = R.useState(null); // alt menüye kadar kalan yükseklik

    const beyliks = R.useMemo(() => {
      const b = Array.isArray(props.serverBeyliks) && props.serverBeyliks.length ? props.serverBeyliks : readLs('beyliks', []);
      return Array.isArray(b) ? b : Object.values(b || {});
    }, [props.serverBeyliks]);
    // Sunucunun gözünden beylik/liderlik bilgisi (beylik listesi henüz gelmediyse de doğru çalışsın)
    const [me, setMe] = R.useState(null);
    R.useEffect(() => { if (jwt()) apiCall('/api/world/me').then(setMe).catch(() => {}); }, [uid]);
    const myBeylik = R.useMemo(() => beyliks.find(b => b && (b.kurucuId === uid || (b.uyeler || []).includes(uid))) || (me && me.beylik) || null, [beyliks, uid, me]);
    const isLeader = !!(myBeylik && (myBeylik.kurucuId === uid || (me && me.isLeader && me.beylik && me.beylik.id === myBeylik.id)));
    const homeId = (profile && (profile.worldCountry || (profile.gameData && profile.gameData.worldCountry))) || (me && me.worldCountry) || 'TR';

    R.useEffect(() => { try { localStorage.setItem('wm_mode', mode); } catch (e) {} }, [mode]);

    // veri yükle
    const retry = R.useCallback(() => {
      setErr(null);
      loadWorld().then(setData).catch(e => setErr(e.message || 'Harita yüklenemedi'));
    }, []);
    R.useEffect(() => { if (!data) retry(); }, []);

    // ── renkler ────────────────────────────────────────────────────────────
    const fills = R.useMemo(() => {
      if (!data) return {};
      const f = {};
      for (const c of data.countries) {
        if (mode === 'kita') f[c.id] = CONTINENTS[c.cont] || '#4A5568';
        else if (mode === 'kaynak') f[c.id] = mix('#162031', '#E0B13A', c.stats.kaynak / 100);
        else {
          const o = own[c.id];
          if (o && o.renk) f[c.id] = o.renk;
          else { const h = hash(c.id); f[c.id] = `hsl(${h % 360},${14 + (h >>> 9) % 8}%,${20 + (h >>> 13) % 7}%)`; }
        }
      }
      return f;
    }, [data, mode, own]);

    // ── yakınlaştırma / kaydırma motoru ───────────────────────────────────
    const stageRef = R.useRef(null);
    const gRef = R.useRef(null);
    const T = R.useRef({ x: 0, y: 0, k: 1, base: 1, w: 0, h: 0, ready: false });
    const raf = R.useRef(0);
    const anim = R.useRef(0);

    const bounds = (t) => {
      const mw = data.W * t.base * t.k, mh = data.H * t.base * t.k;
      // kenar payı: harita ekrandan biraz büyükse az, çok büyükse en fazla 48px okyanus göster
      const px = Math.min(48, Math.max(0, (mw - t.w) / 2)), py = Math.min(48, Math.max(0, (mh - t.h) / 2));
      t.x = mw <= t.w ? (t.w - mw) / 2 : clamp(t.x, t.w - mw - px, px);
      t.y = mh <= t.h ? (t.h - mh) / 2 : clamp(t.y, t.h - mh - py, py);
    };
    const paint = () => {
      raf.current = 0;
      const t = T.current;
      if (gRef.current) gRef.current.setAttribute('transform', `translate(${t.x.toFixed(2)},${t.y.toFixed(2)}) scale(${(t.base * t.k).toFixed(5)})`);
    };
    const schedule = () => { if (!raf.current) raf.current = requestAnimationFrame(paint); };
    const commit = () => { const t = T.current; setView({ scale: t.base * t.k, k: t.k }); };

    const zoomAt = (factor, px, py, doCommit) => {
      const t = T.current;
      const nk = clamp(t.k * factor, 1, MAX_K);
      const s0 = t.base * t.k, s1 = t.base * nk;
      const mx = (px - t.x) / s0, my = (py - t.y) / s0;
      t.k = nk; t.x = px - mx * s1; t.y = py - my * s1;
      bounds(t); schedule(); if (doCommit) commit();
    };

    // belirli bir harita noktasına (mx,my) k yakınlığında uç
    const flyTo = (mx, my, k, offsetY) => {
      const t = T.current;
      cancelAnimationFrame(anim.current);
      const nk = clamp(k, 1, MAX_K);
      const s1 = t.base * nk;
      const tgt = { k: nk, x: t.w / 2 - mx * s1, y: (t.h - (offsetY || 0)) / 2 - my * s1 };
      const probe = { ...t, ...tgt }; bounds(probe); tgt.x = probe.x; tgt.y = probe.y;
      if (reduceMotion()) { Object.assign(t, tgt); schedule(); commit(); return; }
      const from = { x: t.x, y: t.y, k: t.k }, t0 = performance.now(), dur = 420;
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        // zoom'u logaritmik, konumu doğrusal karıştır
        t.k = from.k * Math.pow(tgt.k / from.k, e);
        t.x = from.x + (tgt.x - from.x) * e; t.y = from.y + (tgt.y - from.y) * e;
        paint();
        if (p < 1) anim.current = requestAnimationFrame(step); else commit();
      };
      anim.current = requestAnimationFrame(step);
    };

    // Sahne yüksekliği: ekranın görünen kısmına (alt menünün üstüne) sığsın — küçük telefonlarda
    // kart düğmeleri alt menünün arkasında kalmasın
    R.useEffect(() => {
      const fit = () => {
        const el = stageRef.current; if (!el) return;
        const sc = document.querySelector('.us-page-scroll');
        const nav = document.querySelector('.us-bottomnav');
        const top = el.getBoundingClientRect().top + (sc ? sc.scrollTop : 0); // sayfa en üstteyken konumu
        const bottom = nav ? nav.getBoundingClientRect().top : window.innerHeight;
        setStageH(clamp(Math.round(bottom - top - 10), 300, 720));
      };
      fit();
      const t = setTimeout(fit, 400); // üst bantlar (olay şeridi vb.) yerleşince tekrar ölç
      window.addEventListener('resize', fit);
      window.addEventListener('orientationchange', fit);
      return () => { clearTimeout(t); window.removeEventListener('resize', fit); window.removeEventListener('orientationchange', fit); };
    }, []);

    // boyut değişimi
    R.useEffect(() => {
      if (!data || !stageRef.current) return;
      const el = stageRef.current;
      const measure = () => {
        const t = T.current, w = el.clientWidth, h = el.clientHeight;
        if (!w || !h) return;
        const nb = Math.min(w / data.W, h / data.H);
        if (!t.ready) {
          // ilk açılış: İstanbul merkezli, Avrupa-Orta Doğu görünümü
          t.w = w; t.h = h; t.base = nb; t.k = clamp(3.2 * (data.W * nb < 500 ? 1 : 0.7), 1, MAX_K);
          const s = t.base * t.k; t.x = w / 2 - data.rose[0] * s; t.y = h / 2 - data.rose[1] * s;
          t.ready = true;
        } else {
          const cx = (t.w / 2 - t.x) / (t.base * t.k), cy = (t.h / 2 - t.y) / (t.base * t.k);
          t.w = w; t.h = h; t.base = nb;
          const s = t.base * t.k; t.x = w / 2 - cx * s; t.y = h / 2 - cy * s;
        }
        bounds(t); paint(); commit();
      };
      measure();
      let ro = null;
      if (window.ResizeObserver) { ro = new ResizeObserver(measure); ro.observe(el); }
      else window.addEventListener('resize', measure);
      return () => { ro ? ro.disconnect() : window.removeEventListener('resize', measure); cancelAnimationFrame(raf.current); cancelAnimationFrame(anim.current); };
    }, [data]);

    // fare tekerleği (passive:false gerekli)
    R.useEffect(() => {
      const el = stageRef.current;
      if (!el || !data) return;
      let wheelTimer = 0;
      const onWheel = (e) => {
        e.preventDefault();
        const r = el.getBoundingClientRect();
        zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0022)), e.clientX - r.left, e.clientY - r.top, false);
        clearTimeout(wheelTimer); wheelTimer = setTimeout(commit, 120);
      };
      el.addEventListener('wheel', onWheel, { passive: false });
      return () => { el.removeEventListener('wheel', onWheel); clearTimeout(wheelTimer); };
    }, [data]);

    // dokunma / fare: tek parmak kaydır, iki parmak yakınlaştır, dokun = seç
    const ptrs = R.useRef(new Map());
    const gest = R.useRef(null);
    const lastTap = R.useRef({ t: 0, x: 0, y: 0 });
    const local = (e) => { const r = stageRef.current.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

    const startPan = (p, targetId) => {
      const t = T.current;
      gest.current = { type: 'pan', sx: p.x, sy: p.y, tx: t.x, ty: t.y, t0: performance.now(), moved: false, targetId, pinched: gest.current && gest.current.pinched };
    };
    const onPointerDown = (e) => {
      if (!data || (e.pointerType === 'mouse' && e.button !== 0)) return;
      // Kart, zoom düğmeleri vb. katmanlar kendi tıklamalarını alsın (pointer capture tıklamayı yutar)
      if (e.target && e.target.closest && e.target.closest('.wm-sheet,.wm-zoom,.wm-legend,.wm-state,.wm-opchip')) return;
      cancelAnimationFrame(anim.current);
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) {}
      const p = local(e);
      ptrs.current.set(e.pointerId, p);
      if (ptrs.current.size === 1) {
        gest.current = null;
        startPan(p, e.target && e.target.getAttribute ? e.target.getAttribute('data-id') : null);
      } else if (ptrs.current.size === 2) {
        const [a, b] = Array.from(ptrs.current.values()), t = T.current;
        gest.current = { type: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, k0: t.k, x0: t.x, y0: t.y, pinched: true };
      }
    };
    const onPointerMove = (e) => {
      if (!ptrs.current.has(e.pointerId) || !gest.current) return;
      const p = local(e); ptrs.current.set(e.pointerId, p);
      const g = gest.current, t = T.current;
      if (g.type === 'pan' && ptrs.current.size === 1) {
        const dx = p.x - g.sx, dy = p.y - g.sy;
        if (!g.moved && Math.hypot(dx, dy) > 6) g.moved = true;
        if (g.moved) { t.x = g.tx + dx; t.y = g.ty + dy; bounds(t); schedule(); }
      } else if (g.type === 'pinch' && ptrs.current.size >= 2) {
        const [a, b] = Array.from(ptrs.current.values());
        const d = Math.hypot(a.x - b.x, a.y - b.y) || 1, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const s0 = t.base * g.k0;
        const mapX = (g.mx - g.x0) / s0, mapY = (g.my - g.y0) / s0;
        t.k = clamp(g.k0 * d / g.d0, 1, MAX_K);
        const s1 = t.base * t.k;
        t.x = mx - mapX * s1; t.y = my - mapY * s1;
        bounds(t); schedule();
      }
    };
    const onPointerUp = (e) => {
      if (!ptrs.current.has(e.pointerId)) return;
      ptrs.current.delete(e.pointerId);
      const g = gest.current;
      if (ptrs.current.size === 1) { // pinch bitti, kalan parmakla kaydırmaya devam
        const rest = Array.from(ptrs.current.values())[0];
        startPan(rest, null); gest.current.moved = true; commit(); return;
      }
      if (ptrs.current.size > 0) return;
      gest.current = null;
      if (!g) return;
      if (g.type === 'pan' && !g.moved && !g.pinched && e.type === 'pointerup' && performance.now() - g.t0 < 600) {
        const p = local(e), now = performance.now(), lt = lastTap.current;
        if (now - lt.t < 320 && Math.hypot(p.x - lt.x, p.y - lt.y) < 30) {
          lastTap.current = { t: 0, x: 0, y: 0 };
          zoomAt(2, p.x, p.y, true);
          return;
        }
        lastTap.current = { t: now, x: p.x, y: p.y };
        if (g.targetId) select(g.targetId, false); else setSelId(null);
      }
      commit();
    };

    // ── seçim ──────────────────────────────────────────────────────────────
    const select = (id, fly) => {
      if (!data || !data.byId[id]) return;
      setSelId(id); setSearchOpen(false);
      const c = data.byId[id], t = T.current;
      const sheetH = Math.min(230, t.h * 0.48);
      const wantK = clamp((t.w * 0.42) / Math.max(c.bw * t.base, 0.5), 1.6, 14);
      const s = t.base * t.k;
      const sx = c.cx * s + t.x, sy = c.cy * s + t.y;
      const hidden = sy > t.h - sheetH - 12 || sy < 12 || sx < 12 || sx > t.w - 12;
      if (fly || hidden) flyTo(c.cx, c.cy, fly ? Math.max(t.k, wantK) : t.k, sheetH);
    };

    const srvNow = nowTick + skew;
    const visOps = ops.filter(o => o.status === 'moving' || o.status === 'battle' || ((o.status === 'won' || o.status === 'lost') && srvNow - o.battleEndAt < 150000));
    const activeOps = visOps.filter(o => o.status === 'moving' || o.status === 'battle');
    const focusOp = (op) => {
      if (!data || !op) return;
      const g = opGeom(op, data.byId); if (!g) return;
      const t = T.current;
      const p = op.status === 'moving' ? Math.min(1, Math.max(0, (srvNow - op.departAt) / Math.max(1, op.arriveAt - op.departAt))) : 1;
      const pt = g.at(p);
      const span = Math.max(Math.abs(g.a.cx - g.b.cx), Math.abs(g.a.cy - g.b.cy), 20);
      setSelId(null);
      flyTo(pt.x, pt.y, clamp((t.w * 0.5) / (span * t.base), 1.5, 10), 0);
    };
    R.useEffect(() => {
      if (!data || !window._wmFocusOp || !ops.length) return;
      const op = ops.find(o => o.id === window._wmFocusOp);
      if (op) { window._wmFocusOp = null; setTimeout(() => focusOp(op), 350); }
    }, [data, ops]);
    // Ülke kartı / harekât penceresi açıkken rehber paneli gizlensin
    R.useEffect(() => {
      if (selId || opTarget) document.body.setAttribute('data-wm-sheet', '1'); else document.body.removeAttribute('data-wm-sheet');
    }, [!!selId, !!opTarget]);
    R.useEffect(() => () => document.body.removeAttribute('data-wm-sheet'), []);
    const opIdx = R.useRef(0);
    const nextOp = () => { if (!activeOps.length) return; opIdx.current = (opIdx.current + 1) % activeOps.length; focusOp(activeOps[opIdx.current]); };

    // ── eylemler ───────────────────────────────────────────────────────────
    const sel = data && selId ? data.byId[selId] : null;
    const selOwner = sel ? own[sel.id] : null;

    // Tüm eylemler sunucuda doğrulanır (liderlik, sikke, ülkenin boş olması); burada sadece
    // kullanıcıya erken geri bildirim veriyoruz.
    const run = async (key, fn) => {
      if (busy) return;
      setBusy(key);
      try { await fn(); }
      catch (e) { notify(e.message || 'İşlem tamamlanamadı', 'error'); if (e.status === 409 || e.status === 404) refreshOwn(); }
      finally { setBusy(null); }
    };
    const conquer = () => {
      if (!sel) return;
      if (!myBeylik) { notify('Toprak fethetmek için önce bir devlete katıl veya kendi devletini kur.', 'error'); return; }
      if (!isLeader) { notify('Fetih kararını yalnızca devlet lideri verebilir.', 'error'); return; }
      const c = sel, cost = c.stats.bedel;
      if ((profile.money || 0) < cost) { notify(`Yetersiz para: ${c.name} için ${money(cost)} gerekli.`, 'error'); return; }
      if (!window.confirm(`${c.name} için ${money(cost)} öde ve ${myBeylik.ad || 'beyliğinin'} topraklarına kat?`)) return;
      run('conquer', async () => {
        await syncMoney(profile.money);
        const d = await apiCall('/api/world/conquer', { code: c.id });
        if (typeof d.money === 'number' && setProfile) setProfile(p => ({ ...p, money: d.money }));
        setOwn(d.territories || {});
        notify(`🏛️ ${c.name} artık ${myBeylik.ad || 'beyliğinin'} toprağı!`, 'success');
        if (mode !== 'siyasi') setMode('siyasi');
      });
    };
    const declareWar = () => {
      if (!sel || !selOwner) return;
      if (!myBeylik || !isLeader) { notify('Savaşı yalnızca devlet lideri ilan edebilir.', 'error'); return; }
      const c = sel, owner = selOwner;
      const ownerB = beyliks.find(b => b && b.id === owner.beylikId);
      if (!window.confirm(`${owner.ad} beyliğine ${c.name} için savaş ilan edilsin mi? Savaş 1 saat sürer; kazanırsan ülke senin olur.`)) return;
      run('war', async () => {
        await apiCall('/api/beylik-war/declare', { attackerBeylik: myBeylik.ad, defenderBeylik: owner.ad, defenderLeaderId: ownerB ? ownerB.kurucuId : null, targetCountry: c.id });
        notify(`⚔️ ${c.name} için savaş ilan edildi! Devlet Savaşı ekranından desteğe çağır.`, 'success');
        onNavigate && onNavigate('beylik_savasi');
      });
    };
    const release = () => {
      if (!sel || !selOwner || !isLeader || !myBeylik || selOwner.beylikId !== myBeylik.id) return;
      const c = sel;
      if (!window.confirm(`${c.name} devletinin topraklarından çıkarılsın mı? Ödenen bedel iade edilmez.`)) return;
      run('release', async () => {
        const d = await apiCall('/api/world/release', { code: c.id });
        setOwn(d.territories || {});
        notify(`${c.name} bağımsızlığına kavuştu.`, 'info');
      });
    };
    const migrate = () => {
      if (!sel || sel.id === homeId) return;
      const c = sel;
      const first = !(profile && (profile.worldCountry || (profile.gameData && profile.gameData.worldCountry)));
      const cost = first ? 0 : MIGRATE_COST;
      if ((profile.money || 0) < cost) { notify(`Göç için ${money(cost)} gerekli.`, 'error'); return; }
      if (cost && !window.confirm(`${c.name} ülkesine ${money(cost)} karşılığında göç etmek istiyor musun?`)) return;
      run('migrate', async () => {
        if (cost) await syncMoney(profile.money);
        const d = await apiCall('/api/world/migrate', { code: c.id });
        setProfile && setProfile(p => ({ ...p, money: typeof d.money === 'number' ? d.money : p.money, worldCountry: c.id, gameData: { ...(p.gameData || {}), worldCountry: c.id } }));
        window.gameApi && window.gameApi.progress('migrate');
        notify(`${c.flag} Artık ${c.name} vatandaşısın!`, 'success');
      });
    };

    // ── türetilmiş veriler ─────────────────────────────────────────────────
    const ownedCount = Object.keys(own).length;
    const powers = R.useMemo(() => {
      if (!data) return [];
      const m = {};
      for (const [id, o] of Object.entries(own)) {
        const c = data.byId[id]; if (!c || !o) continue;
        const k = o.beylikId || o.ad;
        m[k] = m[k] || { ad: o.ad, renk: o.renk, n: 0, km2: 0, mine: myBeylik && o.beylikId === myBeylik.id };
        m[k].n++; m[k].km2 += c.km2;
      }
      return Object.values(m).sort((a, b) => b.km2 - a.km2).slice(0, 6);
    }, [own, data, myBeylik]);

    const matches = R.useMemo(() => {
      if (!data || !query.trim()) return [];
      const q = trLower(query.trim());
      return data.countries.filter(c => c.key.includes(q)).sort((a, b) => (a.key.startsWith(q) ? 0 : 1) - (b.key.startsWith(q) ? 0 : 1) || b.km2 - a.km2).slice(0, 6);
    }, [query, data]);

    // ekran ölçeğine göre görünür etiketler — büyükten küçüğe yerleştir, çakışanları atla
    const labels = R.useMemo(() => {
      if (!data) return [];
      const s = view.scale, out = [], boxes = [];
      const sorted = data.countries.slice().sort((a, b) => b.km2 - a.km2);
      for (const c of sorted) {
        const w = c.name.length * 5.9 + 6;
        if (c.bw * s < w + 4) continue;
        const dy = c.id === homeId ? 14 : 0; // vatan iğnesinin altına
        const x = c.cx * s, y = c.cy * s + dy;
        const box = [x - w / 2, y - 7, x + w / 2, y + 7];
        if (boxes.some(b => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
        boxes.push(box); out.push({ c, dy: dy / s });
        if (out.length > 120) break;
      }
      return out;
    }, [data, view.scale, homeId]);

    // ── görünüm ────────────────────────────────────────────────────────────
    const h = R.createElement;
    const home = data && data.byId[homeId];
    const s = view.scale || 1;

    const btn = (label, onClick, title, extra) => h('button', { type: 'button', onClick, 'aria-label': title, title, className: 'wm-zbtn', style: extra }, label);

    const legend = () => {
      if (mode === 'kita') return Object.entries(CONTINENTS).map(([k, v]) => h('span', { key: k, className: 'wm-lg' }, h('i', { style: { background: v } }), k));
      if (mode === 'kaynak') return h('span', { className: 'wm-lg wm-lg-ramp' }, 'Az', h('b', null), 'Çok');
      return [
        h('span', { key: 'b', className: 'wm-lg' }, h('i', { style: { background: 'hsl(210,16%,24%)' } }), 'Bağımsız'),
        myBeylik && h('span', { key: 'm', className: 'wm-lg' }, h('i', { style: { background: myBeylik.renk || C.gold } }), myBeylik.ad || 'Devletin'),
        h('span', { key: 'o', className: 'wm-lg' }, h('i', { className: 'wm-lg-multi' }), 'Diğer devletler'),
      ];
    };

    const bar = (label, value, color) => h('div', { className: 'wm-stat' },
      h('div', { className: 'wm-stat-top' }, h('span', null, label), h('b', null, value)),
      h('div', { className: 'wm-bar' }, h('div', { style: { width: value + '%', background: color } }))
    );

    let primary = null;
    if (sel) {
      const mineOwned = selOwner && myBeylik && selOwner.beylikId === myBeylik.id;
      if (!myBeylik) primary = h('button', { type: 'button', className: 'wm-act wm-act-gold', onClick: () => onNavigate && onNavigate('beylik_kur') }, '🏛️ Devlet kur');
      else if (mineOwned) primary = isLeader
        ? h('button', { type: 'button', className: 'wm-act', onClick: release, disabled: !!busy }, busy === 'release' ? 'Bırakılıyor…' : 'Toprağı bırak')
        : h('div', { className: 'wm-act wm-act-ghost' }, 'Devletinin toprağı');
      else if (selOwner) primary = h('button', { type: 'button', className: 'wm-act wm-act-red', onClick: declareWar, disabled: !isLeader || !!busy, title: isLeader ? '' : 'Yalnızca devlet lideri' }, busy === 'war' ? 'İlan ediliyor…' : '⚔️ Savaş ilan et');
      else primary = h('button', { type: 'button', className: 'wm-act wm-act-gold', onClick: conquer, disabled: !isLeader || !!busy, title: isLeader ? '' : 'Yalnızca devlet lideri' }, busy === 'conquer' ? 'Fethediliyor…' : `🏛️ Fethet ${money(sel.stats.bedel)}`);
    }

    return h('div', { className: 'wm-root' },
      h('style', null, WM_CSS),

      // Başlık + arama
      h('div', { className: 'wm-head' },
        h('div', { className: 'wm-title-row' },
          h('div', { style: { minWidth: 0 } },
            h('h1', { className: 'wm-title' }, 'Dünya Haritası'),
            h('div', { className: 'wm-sub' }, data ? `${data.countries.length} ülke, ${ownedCount ? ownedCount + ' tanesi fethedildi' : 'hepsi bağımsız'}` : 'Harita hazırlanıyor'),
            ownStatus === 'offline' && h('button', { type: 'button', className: 'wm-offline', onClick: refreshOwn }, 'Sunucuya bağlanılamadı, son bilinen harita gösteriliyor. Yenile')
          ),
          home && h('button', { type: 'button', className: 'wm-home', onClick: () => select(homeId, true), title: 'Vatanına git' }, h('span', { className: 'wm-home-flag' }, home.flag), h('span', null, home.name))
        ),
        h('div', { className: 'wm-search' },
          query && h('button', { type: 'button', className: 'wm-clear', 'aria-label': 'Aramayı temizle', onClick: () => { setQuery(''); setSearchOpen(false); } }, '✕'),
          h('input', {
            type: 'search', value: query, placeholder: 'Ülke ara…', 'aria-label': 'Ülke ara', enterKeyHint: 'search',
            onChange: e => { setQuery(e.target.value); setSearchOpen(true); },
            onFocus: () => setSearchOpen(true),
            onKeyDown: e => { if (e.key === 'Enter' && matches[0]) { select(matches[0].id, true); setQuery(''); e.target.blur(); } if (e.key === 'Escape') setSearchOpen(false); },
          }),
          searchOpen && matches.length > 0 && h('div', { className: 'wm-results', role: 'listbox' },
            matches.map(c => h('button', { key: c.id, type: 'button', role: 'option', className: 'wm-result', onMouseDown: ev => ev.preventDefault(), onClick: () => { select(c.id, true); setQuery(''); } },
              h('span', { className: 'wm-result-flag' }, c.flag), h('span', { className: 'wm-result-name' }, c.name), h('span', { className: 'wm-result-meta' }, c.cont)
            ))
          )
        ),
        h('div', { className: 'wm-modes', role: 'tablist' },
          MODES.map(m => h('button', { key: m.id, type: 'button', role: 'tab', 'aria-selected': mode === m.id, className: 'wm-mode' + (mode === m.id ? ' on' : ''), onClick: () => setMode(m.id) }, m.label))
        )
      ),

      // Harita sahnesi
      h('div', {
        ref: stageRef, className: 'wm-stage', style: stageH ? { height: stageH + 'px' } : undefined,
        onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp,
        onContextMenu: e => e.preventDefault(),
      },
        !data && !err && h('div', { className: 'wm-state' }, h('div', { className: 'wm-spin' }), 'Harita yükleniyor…'),
        err && h('div', { className: 'wm-state' }, h('div', null, err), h('button', { type: 'button', className: 'wm-act wm-act-gold', style: { marginTop: 12, flex: 'none' }, onClick: retry }, 'Tekrar dene')),
        data && h('svg', { className: 'wm-svg', role: 'img', 'aria-label': 'Dünya haritası' },
          h('defs', null,
            h('radialGradient', { id: 'wmSea', cx: '50%', cy: '40%', r: '75%' }, h('stop', { offset: '0%', stopColor: C.oceanHi }), h('stop', { offset: '100%', stopColor: C.ocean })),
            h('radialGradient', { id: 'wmBoom' }, h('stop', { offset: '0%', stopColor: '#FFF7D1' }), h('stop', { offset: '35%', stopColor: '#FFB547' }), h('stop', { offset: '70%', stopColor: '#E5484D', stopOpacity: 0.85 }), h('stop', { offset: '100%', stopColor: '#E5484D', stopOpacity: 0 }))
          ),
          h('rect', { width: '100%', height: '100%', fill: 'url(#wmSea)' }),
          h('g', { ref: gRef },
            h('path', { d: data.grat, className: 'wm-grat' }),
            h(CountryLayer, { countries: data.countries, fills }),
            // Kendi beyliğinin toprakları: altın kontur
            myBeylik && h('g', { className: 'wm-mine' }, Object.entries(own).filter(([, o]) => o && o.beylikId === myBeylik.id).map(([id]) => data.byId[id] && h('path', { key: id, d: data.byId[id].d }))),
            sel && h('path', { d: sel.d, className: 'wm-sel' }),
            h('g', { className: 'wm-labels', style: { fontSize: (10.5 / s) + 'px', strokeWidth: (3 / s) + 'px' } },
              labels.map(({ c, dy }) => h('text', { key: c.id, x: c.cx, y: c.cy + dy, dy: '0.35em' }, c.name))
            ),
            visOps.length > 0 && h(OpsLayer, { ops: visOps, byId: data.byId, s, now: srvNow, myStateId: myBeylik && myBeylik.id }),
            home && h('g', { className: 'wm-pin', transform: `translate(${home.cx},${home.cy}) scale(${1 / s})` },
              h('circle', { r: 9, className: 'wm-pin-pulse' }),
              h('circle', { r: 4.2, className: 'wm-pin-dot' })
            )
          )
        ),
        data && h('div', { className: 'wm-zoom' },
          btn('+', () => zoomAt(1.6, T.current.w / 2, T.current.h / 2, true), 'Yakınlaştır'),
          btn('−', () => zoomAt(1 / 1.6, T.current.w / 2, T.current.h / 2, true), 'Uzaklaştır'),
          btn('◎', () => flyTo(data.W / 2, data.H / 2, 1, 0), 'Tüm dünya', { fontSize: '1rem' })
        ),
        data && !sel && h('div', { className: 'wm-legend' }, legend()),
        data && activeOps.length > 0 && h('button', { type: 'button', className: 'wm-opchip', onClick: nextOp },
          h('span', { className: 'wm-opchip-dot' + (activeOps.some(o => o.status === 'battle') ? ' war' : '') }),
          activeOps.some(o => o.status === 'battle') ? `${activeOps.filter(o => o.status === 'battle').length} çatışma sürüyor` : `${activeOps.length} harekât yolda`),

        // Ülke kartı
        sel && h('div', { className: 'wm-sheet', role: 'dialog', 'aria-label': sel.name },
          h('div', { className: 'wm-sheet-head' },
            h('span', { className: 'wm-flag' }, sel.flag),
            h('div', { style: { minWidth: 0, flex: 1 } },
              h('div', { className: 'wm-name' }, sel.name),
              h('div', { className: 'wm-meta' }, sel.cont, ', ', Number(sel.km2).toLocaleString('tr-TR'), ' km²')
            ),
            sel.id === homeId && h('span', { className: 'wm-badge' }, 'Vatanın'),
            h('button', { type: 'button', className: 'wm-x', onClick: () => setSelId(null), 'aria-label': 'Kapat' }, '✕')
          ),
          h('div', { className: 'wm-owner' },
            h('i', { style: { background: selOwner ? selOwner.renk : 'hsl(210,16%,30%)' } }),
            selOwner
              ? h('span', { className: 'wm-owner-txt' }, h('b', null, selOwner.ad), selOwner.by ? ` yönetiminde, fatihi ${selOwner.by}` : ' yönetiminde')
              : h('span', { className: 'wm-owner-txt' }, 'Bağımsız ülke')
          ),
          h('div', { className: 'wm-stats' },
            bar('Kaynak', sel.stats.kaynak, C.gold),
            bar('Savunma', sel.stats.savunma, '#6E8FC4')
          ),
          h('div', { className: 'wm-acts' },
            primary,
            myBeylik && !(selOwner && selOwner.beylikId === myBeylik.id) && h('button', { type: 'button', className: 'wm-act wm-act-war', disabled: !isLeader, title: isLeader ? '' : 'Yalnızca devlet lideri', onClick: () => setOpTarget(sel) }, '🎖️ Harekât')
          ),
          h('div', { className: 'wm-acts2' },
            sel.id !== homeId && h('button', { type: 'button', className: 'wm-mini', onClick: migrate, disabled: !!busy }, busy === 'migrate' ? 'Göç ediliyor…' : '🧳 Göç et'),
            h('button', { type: 'button', className: 'wm-mini', onClick: () => onNavigate && onNavigate('kervan') }, '🚚 Ticaret'),
            h('button', { type: 'button', className: 'wm-mini', onClick: () => onNavigate && onNavigate('diplomasi') }, '🤝 Diplomasi'),
            myBeylik && h('button', { type: 'button', className: 'wm-mini', onClick: () => onNavigate && onNavigate('ordu') }, '🪖 Ordum')
          )
        )
      ),

      // Dünya güçleri
      h('section', { className: 'wm-panel' },
        h('h2', { className: 'wm-h2' }, 'Dünya güçleri'),
        powers.length === 0
          ? h('p', { className: 'wm-empty' }, isLeader
              ? 'Henüz hiçbir devlet toprak fethetmedi. Haritadan bağımsız bir ülke seç ve ilk fatih sen ol.'
              : myBeylik ? 'Henüz hiçbir devlet toprak fethetmedi. Fetih kararını devlet liderin verebilir.'
              : 'Henüz hiçbir devlet toprak fethetmedi. Fetih için bir devlete katıl ya da kendi devletini kur.')
          : h('ol', { className: 'wm-powers' }, powers.map((p, i) => h('li', { key: i, className: p.mine ? 'mine' : '' },
              h('i', { style: { background: p.renk || C.gold } }),
              h('span', { className: 'wm-pw-name' }, p.ad),
              h('span', { className: 'wm-pw-n' }, `${p.n} ülke`),
              h('span', { className: 'wm-pw-km' }, `${Math.round(p.km2 / 1000).toLocaleString('tr-TR')} bin km²`)
            )))
      ),

      opTarget && h(OperationModal, {
        target: opTarget, notify, onClose: () => setOpTarget(null),
        onLaunched: (op, now) => {
          setOpTarget(null); if (now) setSkew(now - Date.now());
          setOps(list => [op, ...list.filter(x => x.id !== op.id)]);
          setTimeout(() => focusOp(op), 200);
        },
      }),

      // Hızlı geçiş
      h('section', { className: 'wm-panel' },
        h('h2', { className: 'wm-h2' }, 'Savaş ve diplomasi'),
        h('div', { className: 'wm-links' }, QUICK_LINKS.map(l => h('button', { key: l.page, type: 'button', className: 'wm-link', onClick: () => onNavigate && onNavigate(l.page) },
          h('span', { className: 'wm-link-ic' }, l.icon), h('span', null, l.label)
        )))
      )
    );
  }

  const QUICK_LINKS = [
    { icon: '🏛️', label: 'Devletler', page: 'politics' },
    { icon: '⚔️', label: 'Devlet Savaşı', page: 'beylik_savasi' },
    { icon: '🗺️', label: 'Bölge Savaşı', page: 'bolge_savasi' },
    { icon: '🏰', label: 'Kale Kuşatma', page: 'kale_kusatma' },
    { icon: '🤝', label: 'Diplomasi', page: 'diplomasi' },
    { icon: '🐪', label: 'Konvoylar', page: 'kervan' },
    { icon: '🛡️', label: 'İttifak', page: 'alliance' },
    { icon: '🧭', label: 'Harekâtlar', page: 'sefer' },
    { icon: '👑', label: 'Cumhurbaşkanlığı', page: 'padisahlik' },
    { icon: '🏛️', label: 'Bölgeler', page: 'eyalet_harita' },
    { icon: '🏆', label: 'Sıralama', page: 'leaderboard' },
    { icon: '💬', label: 'Dünya Sohbeti', page: 'chat' },
  ];

  const WM_CSS = `
  .wm-root{padding:12px 12px 20px;color:${C.text};font-family:'Inter',sans-serif;background:${C.ocean};min-height:100%}
  .wm-head{position:relative;z-index:5}
  .wm-title-row{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-bottom:10px}
  .wm-title{font-family:'Rajdhani',sans-serif;font-size:1.32rem;font-weight:800;letter-spacing:.02em;line-height:1.1;color:${C.goldHi};margin:0}
  .wm-sub{font-size:.74rem;color:${C.muted};margin-top:3px}
  .wm-offline{display:block;margin-top:5px;padding:0;border:none;background:none;color:#E0A36B;font:500 .7rem 'Inter',sans-serif;text-align:left;cursor:pointer;text-decoration:underline;text-underline-offset:2px}
  .wm-home{display:flex;align-items:center;gap:6px;max-width:48%;padding:7px 11px;border-radius:999px;border:1px solid ${C.line};background:rgba(60,200,240,.08);color:${C.text};font:600 .74rem 'Inter',sans-serif;cursor:pointer;white-space:nowrap;overflow:hidden}
  .wm-home span:last-child{overflow:hidden;text-overflow:ellipsis}
  .wm-home-flag{font-size:1rem;line-height:1}
  .wm-search{position:relative;margin-bottom:9px}
  .wm-search input{width:100%;height:42px;padding:0 14px;border-radius:12px;border:1px solid rgba(230,237,245,.12);background:${C.surface};color:${C.text};font-family:'Inter',sans-serif;outline:none}
  .wm-search input{padding-right:40px}
  .wm-search input::-webkit-search-cancel-button,.wm-search input::-webkit-search-decoration{-webkit-appearance:none;appearance:none}
  .wm-clear{position:absolute;right:6px;top:6px;width:30px;height:30px;border:none;border-radius:8px;background:rgba(255,255,255,.06);color:${C.muted};cursor:pointer;z-index:1;font-size:.8rem}
  .wm-search input:focus{border-color:rgba(60,200,240,.55);box-shadow:0 0 0 3px rgba(60,200,240,.14)}
  .wm-results{position:absolute;left:0;right:0;top:46px;background:#0E1622;border:1px solid ${C.line};border-radius:12px;overflow:hidden;box-shadow:0 14px 40px rgba(0,0,0,.6)}
  .wm-result{display:flex;align-items:center;gap:10px;width:100%;padding:11px 12px;background:none;border:none;border-bottom:1px solid rgba(255,255,255,.05);color:${C.text};font:500 .85rem 'Inter',sans-serif;text-align:left;cursor:pointer}
  .wm-result:last-child{border-bottom:none}
  .wm-result:active,.wm-result:hover{background:rgba(60,200,240,.1)}
  .wm-result-flag{font-size:1.1rem;width:22px;text-align:center}
  .wm-result-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .wm-result-meta{font-size:.7rem;color:${C.muted}}
  .wm-modes{display:flex;gap:4px;padding:3px;border-radius:12px;background:${C.surface};border:1px solid rgba(230,237,245,.08);margin-bottom:10px}
  .wm-mode{flex:1;height:34px;border:none;border-radius:9px;background:none;color:${C.muted};font:600 .78rem 'Inter',sans-serif;cursor:pointer}
  .wm-mode.on{background:rgba(60,200,240,.16);color:${C.goldHi};box-shadow:inset 0 0 0 1px rgba(60,200,240,.35)}
  .wm-stage{position:relative;height:60vh;height:60dvh;min-height:300px;max-height:640px;border-radius:16px;overflow:hidden;border:1px solid ${C.line};background:${C.ocean};touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;cursor:grab;box-shadow:inset 0 0 60px rgba(0,0,0,.55)}
  .wm-stage:active{cursor:grabbing}
  .wm-svg{position:absolute;inset:0;width:100%;height:100%;display:block}
  .wm-grat{fill:none;stroke:#16304F;stroke-opacity:.55;stroke-width:.6;vector-effect:non-scaling-stroke}
  .wm-c{stroke:${C.edge};stroke-width:.7;vector-effect:non-scaling-stroke;stroke-linejoin:round;cursor:pointer}
  @media (hover:hover){.wm-c:hover{filter:brightness(1.4)}}
  .wm-mine path{fill:none;stroke:${C.goldHi};stroke-opacity:.55;stroke-width:1.2;vector-effect:non-scaling-stroke;pointer-events:none}
  .wm-sel{fill:rgba(232,201,107,.14);stroke:${C.goldHi};stroke-width:2.2;vector-effect:non-scaling-stroke;stroke-linejoin:round;pointer-events:none;filter:drop-shadow(0 0 4px rgba(232,201,107,.7))}
  .wm-labels{pointer-events:none;font-family:'Inter',sans-serif;font-weight:600;fill:#E9E3D6;fill-opacity:.88;stroke:#04080F;stroke-opacity:.85;paint-order:stroke;stroke-linejoin:round;text-anchor:middle}
  .wm-pin{pointer-events:none}
  .wm-pin-dot{fill:${C.goldHi};stroke:#04080F;stroke-width:1.6}
  .wm-pin-pulse{fill:${C.gold};fill-opacity:.35;transform-box:fill-box;transform-origin:center;animation:wmPulse 2.2s ease-out infinite}
  @keyframes wmPulse{0%{transform:scale(.4);opacity:.9}100%{transform:scale(1.6);opacity:0}}
  .wm-zoom{position:absolute;top:10px;right:10px;display:flex;flex-direction:column;gap:6px;z-index:3}
  .wm-zbtn{width:40px;height:40px;border-radius:12px;border:1px solid ${C.line};background:rgba(9,15,26,.88);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);color:${C.goldHi};font:700 1.25rem/1 'Inter',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}
  .wm-zbtn:active{background:rgba(60,200,240,.2)}
  .wm-legend{position:absolute;left:10px;bottom:10px;right:60px;display:flex;flex-wrap:wrap;gap:4px 10px;padding:7px 10px;border-radius:10px;background:rgba(6,11,20,.82);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);font-size:.68rem;color:#B9B4A9;pointer-events:none;width:max-content;max-width:calc(100% - 70px)}
  .wm-lg{display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
  .wm-lg i{width:10px;height:10px;border-radius:3px;display:inline-block;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}
  .wm-lg-multi{background:conic-gradient(#B8423C 0 25%,#5B8DD9 0 50%,#3E8C5A 0 75%,#3CC8F0 0)}
  .wm-lg-ramp b{display:inline-block;width:70px;height:8px;border-radius:4px;background:linear-gradient(90deg,#162031,#E0B13A)}
  .wm-state{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:${C.muted};font-size:.85rem;text-align:center;padding:20px}
  .wm-spin{width:28px;height:28px;border-radius:50%;border:2px solid rgba(60,200,240,.2);border-top-color:${C.gold};animation:spin .9s linear infinite}
  .wm-sheet{position:absolute;left:8px;right:8px;bottom:8px;z-index:4;background:rgba(10,17,29,.96);border:1px solid rgba(60,200,240,.28);border-radius:14px;padding:12px 12px 10px;box-shadow:0 -10px 40px rgba(0,0,0,.55);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);animation:wmSheet .22s ease-out;touch-action:auto;cursor:default}
  @keyframes wmSheet{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}
  .wm-sheet-head{display:flex;align-items:center;gap:10px}
  .wm-flag{font-size:1.9rem;line-height:1;flex-shrink:0}
  .wm-name{font-family:'Rajdhani',sans-serif;font-size:1.06rem;font-weight:800;color:${C.text};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .wm-meta{font-size:.72rem;color:${C.muted};margin-top:1px}
  .wm-x{width:34px;height:34px;flex-shrink:0;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:${C.muted};cursor:pointer;font-size:.85rem}
  .wm-owner{display:flex;align-items:center;gap:7px;margin:9px 0 8px;font-size:.78rem;color:#C9C3B6;min-width:0}
  .wm-owner-txt{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .wm-owner i{width:11px;height:11px;border-radius:3px;flex-shrink:0}
  .wm-owner b{color:${C.text}}
  .wm-badge{flex-shrink:0;padding:3px 8px;border-radius:999px;background:rgba(60,200,240,.16);color:${C.goldHi};font-size:.66rem;font-weight:700}
  .wm-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
  .wm-stat-top{display:flex;justify-content:space-between;font-size:.68rem;color:${C.muted};margin-bottom:4px}
  .wm-stat-top b{color:${C.text};font-weight:700}
  .wm-bar{height:5px;border-radius:3px;background:rgba(255,255,255,.07);overflow:hidden}
  .wm-bar div{height:100%;border-radius:3px}
  .wm-acts{display:flex;gap:6px}
  .wm-acts2{display:flex;gap:6px;margin-top:6px;overflow-x:auto;scrollbar-width:none}
  .wm-acts2::-webkit-scrollbar{display:none}
  .wm-mini{flex-shrink:0;height:32px;padding:0 10px;border-radius:9px;border:1px solid rgba(230,237,245,.1);background:rgba(255,255,255,.04);color:#C9D3DF;font:600 .72rem 'Inter',sans-serif;cursor:pointer;white-space:nowrap}
  .wm-mini:disabled{opacity:.45}
  .wm-act-war{flex:1.2;background:linear-gradient(180deg,#2A3B52,#1B2738);border-color:rgba(229,72,77,.6);color:#FFD5D6}
  /* harekât katmanı */
  .wm-ops{pointer-events:none}
  .wm-arc{fill:none;stroke-width:2;stroke-opacity:.85;vector-effect:non-scaling-stroke;stroke-dasharray:7 6;stroke-linecap:round}
  .wm-arc.run{animation:wmDash 1s linear infinite}
  @keyframes wmDash{to{stroke-dashoffset:-13}}
  .wm-base{fill:#04080F;stroke-width:2}
  .wm-unit{fill:#0B1422;stroke-width:2}
  .wm-unit-halo{opacity:.22;transform-box:fill-box;transform-origin:center;animation:wmHalo 1.6s ease-out infinite}
  @keyframes wmHalo{0%{transform:scale(.7);opacity:.35}100%{transform:scale(1.6);opacity:0}}
  .wm-unit-ic{color:#E6EDF5;fill:none;stroke:#E6EDF5;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  .wm-unit-eta{font:700 10px 'Inter',sans-serif;fill:#E6EDF5;text-anchor:middle;stroke:#04080F;stroke-width:3px;paint-order:stroke;font-variant-numeric:tabular-nums}
  .wm-unit-eta.mine{fill:#9BE6FB}
  .wm-fx-wave{fill:none;stroke:#E5484D;stroke-width:2;transform-box:fill-box;transform-origin:center;animation:wmWave 2.2s ease-out infinite}
  @keyframes wmWave{0%{transform:scale(.4);opacity:.9}100%{transform:scale(2.4);opacity:0}}
  .wm-fx-boom{fill:url(#wmBoom);transform-box:fill-box;transform-origin:center;opacity:0;animation:wmBoom 1.7s ease-out infinite}
  @keyframes wmBoom{0%{transform:scale(.1);opacity:0}12%{opacity:1}40%{transform:scale(1.15);opacity:.9}100%{transform:scale(1.5);opacity:0}}
  .wm-fx-smoke{fill:#6B7480;opacity:0;transform-box:fill-box;transform-origin:center;animation:wmSmoke 2.6s ease-out infinite}
  @keyframes wmSmoke{0%{transform:translateY(0) scale(.5);opacity:0}20%{opacity:.45}100%{transform:translateY(-18px) scale(1.8);opacity:0}}
  .wm-fx-tracer{stroke:#FFD27A;stroke-width:1.6;stroke-linecap:round;stroke-dasharray:6 60;animation:wmTracer .9s linear infinite}
  @keyframes wmTracer{from{stroke-dashoffset:66}to{stroke-dashoffset:0}}
  .wm-fx-label{font-family:'Inter',sans-serif;font-weight:700;fill:#FFB4B6;stroke:#04080F;stroke-opacity:.9;paint-order:stroke;text-anchor:middle}
  .wm-res{animation:wmResIn .5s ease-out}
  @keyframes wmResIn{from{opacity:0;transform:translateY(6px)}to{opacity:1}}
  .wm-res-w{fill:#3FB27F} .wm-res-l{fill:#F2A93B}
  .wm-res-t{font:800 10px 'Rajdhani',sans-serif;letter-spacing:.08em;fill:#04121C;text-anchor:middle}
  .wm-opchip{position:absolute;top:10px;left:10px;z-index:3;display:flex;align-items:center;gap:7px;height:34px;padding:0 12px;border-radius:999px;border:1px solid rgba(155,230,251,.25);background:rgba(9,15,26,.9);color:#E6EDF5;font:600 .74rem 'Inter',sans-serif;cursor:pointer;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
  .wm-opchip-dot{width:8px;height:8px;border-radius:50%;background:#3CC8F0;box-shadow:0 0 0 0 rgba(60,200,240,.6);animation:wmPing 1.4s infinite}
  .wm-opchip-dot.war{background:#E5484D;box-shadow:0 0 0 0 rgba(229,72,77,.6)}
  @keyframes wmPing{0%{box-shadow:0 0 0 0 currentColor}70%{box-shadow:0 0 0 8px rgba(0,0,0,0)}100%{box-shadow:0 0 0 0 rgba(0,0,0,0)}}
  /* harekât penceresi */
  .wm-modal-bg{position:fixed;inset:0;z-index:1000;background:rgba(2,6,12,.66);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);display:flex;align-items:flex-end;justify-content:center;animation:fadeIn .18s ease}
  .wm-modal{width:100%;max-width:480px;max-height:88%;overflow-y:auto;background:#0E1724;border:1px solid rgba(229,72,77,.35);border-bottom:none;border-radius:18px 18px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px));box-shadow:0 -20px 60px rgba(0,0,0,.6);animation:slideUp .25s ease}
  .wm-modal-h{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px}
  .wm-modal-k{font-size:.7rem;color:#FF9EA1;font-weight:700;letter-spacing:.04em}
  .wm-modal-t{font-family:'Rajdhani',sans-serif;font-size:1.25rem;font-weight:700;color:#E6EDF5;margin-top:2px}
  .wm-modal-note{font-size:.72rem;color:#8A9BB0;line-height:1.5;margin:8px 0}
  .wm-modal-err{color:#FFB4B6;font-size:.82rem}
  .wm-modal-load{display:flex;align-items:center;gap:10px;color:#8A9BB0;font-size:.82rem;padding:20px 0}
  .wm-sliders{display:flex;flex-direction:column;gap:10px;margin:6px 0 12px}
  .wm-sl{display:block}
  .wm-sl.off{opacity:.45}
  .wm-sl-h{display:flex;align-items:center;gap:7px;font-size:.8rem;font-weight:600;color:#C9D3DF;margin-bottom:5px}
  .wm-sl-h b{margin-left:auto;font-weight:700;color:#E6EDF5;font-variant-numeric:tabular-nums}
  .wm-sl input[type=range]{width:100%;accent-color:#E5484D;height:28px}
  .wm-sum{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .wm-sum div{background:rgba(255,255,255,.035);border-radius:10px;padding:8px 10px}
  .wm-sum span{display:block;font-size:.68rem;color:#8A9BB0}
  .wm-sum b{font-family:'Rajdhani',sans-serif;font-size:1.05rem;color:#E6EDF5}
  .wm-chance{display:flex;align-items:center;gap:10px;margin-top:10px;font-size:.76rem;color:#8A9BB0}
  .wm-chance-bar{flex:1;height:8px;border-radius:4px;background:rgba(255,255,255,.07);overflow:hidden}
  .wm-chance-bar i{display:block;height:100%;border-radius:4px;transition:width .3s ease, background .3s ease}
  .wm-chance b{font-family:'Rajdhani',sans-serif;font-size:1.1rem;min-width:44px;text-align:right}
  .wm-launch{width:100%;height:46px;margin-top:6px;font-size:.92rem}
  @media (prefers-reduced-motion: reduce){.wm-arc.run,.wm-unit-halo,.wm-fx-wave,.wm-fx-boom,.wm-fx-smoke,.wm-fx-tracer,.wm-opchip-dot{animation:none}.wm-fx-boom{opacity:.8}}
  .wm-act{flex:1;min-width:0;height:40px;padding:0 10px;border-radius:11px;border:1px solid rgba(230,237,245,.14);background:rgba(255,255,255,.05);color:${C.text};font:700 .78rem 'Inter',sans-serif;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;justify-content:center}
  .wm-act:disabled{opacity:.45;cursor:not-allowed}
  .wm-act-gold{flex:1.6;background:linear-gradient(180deg,#D8B23A,#A9851C);border-color:#9BE6FB;color:#0F1724}
  .wm-act-red{flex:1.6;background:linear-gradient(180deg,#C9524A,#94322C);border-color:#E07A72;color:#fff}
  .wm-act-ghost{flex:1.6;cursor:default;color:${C.goldHi};border-color:rgba(60,200,240,.3)}
  .wm-act-icon{flex:0 0 40px;padding:0;font-size:1.05rem}
  .wm-panel{margin-top:14px;padding:14px;border-radius:14px;background:${C.surface};border:1px solid rgba(230,237,245,.07)}
  .wm-h2{font-family:'Rajdhani',sans-serif;font-size:.95rem;font-weight:700;color:${C.goldHi};margin:0 0 10px}
  .wm-empty{font-size:.8rem;line-height:1.55;color:${C.muted};margin:0}
  .wm-powers{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
  .wm-powers li{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:10px;background:rgba(255,255,255,.03);font-size:.8rem}
  .wm-powers li.mine{background:rgba(60,200,240,.09);box-shadow:inset 0 0 0 1px rgba(60,200,240,.3)}
  .wm-powers i{width:12px;height:12px;border-radius:3px;flex-shrink:0}
  .wm-pw-name{flex:1;min-width:0;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .wm-pw-n{color:${C.goldHi};font-weight:700}
  .wm-pw-km{color:${C.muted};font-size:.72rem;min-width:78px;text-align:right}
  .wm-links{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
  .wm-link{display:flex;flex-direction:column;align-items:center;gap:5px;padding:12px 4px;border-radius:12px;border:1px solid rgba(230,237,245,.07);background:rgba(4,8,15,.6);color:${C.text};font:600 .7rem 'Inter',sans-serif;cursor:pointer;text-align:center}
  .wm-link:active{background:rgba(60,200,240,.1)}
  .wm-link-ic{font-size:1.35rem;line-height:1}
  .wm-root button:focus-visible,.wm-root input:focus-visible{outline:2px solid ${C.goldHi};outline-offset:2px}
  @media (max-width:360px){.wm-links{grid-template-columns:repeat(2,minmax(0,1fr))}.wm-title{font-size:1.15rem}.wm-act{font-size:.72rem}}
  @media (prefers-reduced-motion:reduce){.wm-pin-pulse,.wm-sheet{animation:none}}
  `;

  window.WorldMapScreen = WorldMapScreen;
  window.loadWorldMapData = loadWorld;
})();
