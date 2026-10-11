"use strict";
// ═══════════════════════════════════════════════════════════════════════════
// SİYASET RP — SİLAHLI KUVVETLER (window.MilitaryScreen)
// Devlet hazinesi, silah/tank/topçu/İHA fabrikaları, asker basma, harekât takibi.
// Sunucu: server/routes/military.js  •  Canlı güncelleme: 'operation-update' olayı
// ═══════════════════════════════════════════════════════════════════════════
(function () {
  const R = React, h = R.createElement;
  const C = {
    bg: '#0A0F17', surface: '#111A26', surface2: '#16212F', line: 'rgba(120,170,220,0.14)',
    accent: '#3CC8F0', accentHi: '#9BE6FB', red: '#E5484D', green: '#3FB27F', amber: '#F2A93B',
    text: '#E6EDF5', muted: '#8A9BB0',
  };
  const UNITS = [
    { k: 'piyade', ad: 'Asker',  icon: 'soldier',   tip: 'Tüfekle donatılır, her biri 1 güç' },
    { k: 'tank',   ad: 'Tank',   icon: 'tank',      tip: 'Zırhlı birlik, 60 güç' },
    { k: 'topcu',  ad: 'Obüs',   icon: 'artillery', tip: 'Ağır topçu, 35 güç' },
    { k: 'iha',    ad: 'İHA',    icon: 'drone',     tip: 'Hızlı, kayıpları az, 45 güç' },
  ];
  const FAC_ICON = { silah: 'rifle', tank: 'tank', topcu: 'artillery', iha: 'drone' };
  const STATUS = {
    moving:    { t: 'Yolda',        c: C.accent },
    battle:    { t: 'Çatışmada',    c: C.red },
    won:       { t: 'Zafer',        c: C.green },
    lost:      { t: 'Püskürtüldü',  c: C.amber },
    cancelled: { t: 'Geri çekildi', c: C.muted },
  };
  const api = () => window.gameApi;
  const num = (n) => api().fmtNum(n);
  const short = (n) => {
    n = Number(n || 0);
    if (n >= 1e9) return (n / 1e9).toFixed(1).replace('.0', '') + ' Mr';
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + ' M';
    if (n >= 1e4) return Math.round(n / 1e3) + ' bin';
    return num(n);
  };
  const Icon = ({ name, size = 22, color }) => (window.SvgIcon ? h(window.SvgIcon, { name, size, style: { color } }) : null);

  // Sayı değişince yumuşak geçiş
  function Counter({ value, fmt }) {
    const [shown, setShown] = R.useState(value);
    const from = R.useRef(value);
    R.useEffect(() => {
      let reduce = false; try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
      if (reduce || from.current === value) { setShown(value); from.current = value; return; }
      const a = from.current, b = value, t0 = performance.now(); let raf;
      const step = (t) => { const p = Math.min(1, (t - t0) / 650), e = 1 - Math.pow(1 - p, 3); setShown(Math.round(a + (b - a) * e)); if (p < 1) raf = requestAnimationFrame(step); else from.current = b; };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }, [value]);
    return h('span', null, (fmt || num)(shown));
  }

  function useNow(ms) {
    const [now, setNow] = R.useState(Date.now());
    R.useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
    return now;
  }

  function MilitaryScreen({ profile, setProfile, showNotif, onNavigate }) {
    const notify = (m, t) => { try { showNotif ? showNotif(m, t) : alert(m); } catch (e) {} };
    const [data, setData] = R.useState(null);
    const [err, setErr] = R.useState(null);
    const [busy, setBusy] = R.useState(null);
    const [gift, setGift] = R.useState('');
    const [batches, setBatches] = R.useState(1);
    const [recvAt, setRecvAt] = R.useState(Date.now());
    const [skew, setSkew] = R.useState(0); // sunucu saati - istemci saati
    const now = useNow(1000);

    const load = R.useCallback(() => api().call('/api/military/me')
      .then(d => { setData(d); setErr(null); setRecvAt(Date.now()); if (d.now) setSkew(d.now - Date.now()); })
      .catch(e => setErr(e.message)), []);
    R.useEffect(() => {
      load(); api().progress('visit_ordu');
      let t = 0;
      const onOp = () => { clearTimeout(t); t = setTimeout(load, 600); };
      window.addEventListener('operation-update', onOp);
      const iv = setInterval(load, 30000);
      return () => { window.removeEventListener('operation-update', onOp); clearInterval(iv); clearTimeout(t); };
    }, []);

    const run = async (key, fn) => {
      if (busy) return; setBusy(key);
      try { await fn(); } catch (e) { notify(e.message || 'İşlem tamamlanamadı', 'error'); } finally { setBusy(null); }
    };

    const css = h('style', null, MIL_CSS);
    if (err && !data) return h('div', { className: 'ml-root' }, css,
      h('div', { className: 'ml-empty' }, h('div', { className: 'ml-empty-t' }, 'Silahlı Kuvvetler açılamadı'), h('p', null, err),
        h('button', { className: 'ml-btn ml-btn-pri', onClick: load }, 'Tekrar dene')));
    if (!data) return h('div', { className: 'ml-root' }, css, h('div', { className: 'ml-empty' }, h('div', { className: 'ml-spin' }), 'Karargâh bağlanıyor…'));

    const rules = data.rules;
    if (!data.state) {
      return h('div', { className: 'ml-root' }, css,
        h('div', { className: 'ml-hero' }, h(Icon, { name: 'tank', size: 44, color: C.accent }),
          h('h1', { className: 'ml-h1' }, 'Silahlı Kuvvetler'),
          h('p', { className: 'ml-lead' }, 'Ordu kurmak, fabrika açmak ve harekât başlatmak için bir devlete katıl ya da kendi devletini kur.'),
          h('div', { className: 'ml-row' },
            h('button', { className: 'ml-btn ml-btn-pri', onClick: () => onNavigate && onNavigate('politics') }, 'Devletlere göz at'),
            h('button', { className: 'ml-btn', onClick: () => onNavigate && onNavigate('world') }, 'Dünya Haritası'))));
    }

    const st = data.state, mil = data.mil, leader = st.isLeader;
    // Canlı üretim: son okumadan bu yana geçen süreyi ekle (sunucu da aynı formülü kullanır)
    const rate = { tufek: 0, tank: 0, topcu: 0, iha: 0 };
    for (const f of data.factories) { const d = rules.factories[f.type]; if (d) rate[d.out] += d.perHour * f.level; }
    const hrs = (now - recvAt) / 3600000;
    const live = { ...mil };
    for (const k of Object.keys(rate)) live[k] = (mil[k] || 0) + Math.floor(rate[k] * hrs);
    live.manpower = Math.min(mil.manpowerCap, mil.manpower + Math.floor(mil.manpowerCap * rules.manpower.regenPctHour * hrs));
    const power = UNITS.reduce((s, u) => s + (live[u.k] || 0) * rules.power[u.k], 0);

    const n = batches * rules.recruit.batch, rcost = batches * rules.recruit.costPerBatch;
    const reqs = [
      { t: 'Tüfek', have: live.tufek, need: n },
      { t: 'İnsan gücü', have: live.manpower, need: n },
      { t: 'Hazine', have: mil.hazine, need: rcost, money: true },
    ];
    const canRecruit = leader && reqs.every(r => r.have >= r.need);

    const deposit = (amt) => run('deposit', async () => {
      const amount = Math.floor(Number(amt) || 0);
      if (amount < rules.minDeposit) throw new Error(`En az ${num(rules.minDeposit)} bağışlayabilirsin.`);
      if ((profile.money || 0) < amount) throw new Error('Bu kadar paran yok.');
      await api().syncMoney(profile.money);
      const d = await api().call('/api/military/deposit', { amount });
      if (typeof d.money === 'number' && setProfile) setProfile(p => ({ ...p, money: d.money }));
      setData(x => ({ ...x, mil: d.mil })); setRecvAt(Date.now()); setGift('');
      notify(`🏛️ Hazineye ₺${num(amount)} bağışladın`, 'success'); api().progress('deposit');
    });
    const build = (type) => run('f_' + type, async () => {
      const d = await api().call('/api/military/factory', { type });
      notify(`🏭 ${rules.factories[type].ad} kuruldu, üretim başladı`, 'success'); api().progress('factory');
      await load();
    });
    const upgrade = (f) => run('u_' + f.id, async () => {
      await api().call('/api/military/factory/upgrade', { id: f.id });
      notify(`⬆️ ${rules.factories[f.type].ad} seviye ${f.level + 1} oldu`, 'success');
      await load();
    });
    const recruit = () => run('recruit', async () => {
      const d = await api().call('/api/military/recruit', { batches });
      setData(x => ({ ...x, mil: d.mil })); setRecvAt(Date.now());
      notify(`🪖 ${num(d.recruited)} asker orduya katıldı`, 'success'); api().progress('recruit');
    });
    const cancel = (op) => run('c_' + op.id, async () => {
      if (!window.confirm(`${op.targetName} harekâtındaki birlikler geri çağrılsın mı?`)) return;
      await api().call('/api/military/operation/cancel', { id: op.id });
      notify('Birlikler geri çağrıldı', 'info'); await load();
    });
    const watch = (op) => { window._wmFocusOp = op.id; onNavigate && onNavigate('world'); };

    const srvNow = now + skew;
    const facCount = (t) => data.factories.filter(f => f.type === t).length;

    return h('div', { className: 'ml-root' }, css,
      // Başlık
      h('header', { className: 'ml-head' },
        h('div', null,
          h('h1', { className: 'ml-h1' }, 'Silahlı Kuvvetler'),
          h('div', { className: 'ml-sub' },
            h('span', { className: 'ml-dot', style: { background: st.renk } }), st.ad,
            h('span', { className: 'ml-sep' }), api().flagOf(st.capital), ' Başkent: ', st.capitalName || st.capital,
            h('span', { className: 'ml-sep' }), `${st.owned} ülke`)),
        h('button', { className: 'ml-btn ml-btn-pri ml-btn-sm', onClick: () => onNavigate && onNavigate('world') }, h(Icon, { name: 'target', size: 16 }), 'Harekât')),

      // Durum şeridi
      h('section', { className: 'ml-hud' },
        h('div', { className: 'ml-hud-i' }, h('label', null, 'Hazine'), h('b', null, '₺', h(Counter, { value: mil.hazine, fmt: short }))),
        h('div', { className: 'ml-hud-i' }, h('label', null, 'Toplam güç'), h('b', { style: { color: C.accentHi } }, h(Counter, { value: power, fmt: short }))),
        h('div', { className: 'ml-hud-i ml-hud-wide' },
          h('label', null, 'İnsan gücü ', h('span', null, `${short(live.manpower)} / ${short(mil.manpowerCap)}`)),
          h('div', { className: 'ml-bar' }, h('i', { style: { width: Math.min(100, live.manpower / mil.manpowerCap * 100) + '%' } })))),

      // Bağış
      h('section', { className: 'ml-card' },
        h('div', { className: 'ml-card-h' }, h('h2', null, 'Hazineye bağış'), h('span', { className: 'ml-note' }, `Cüzdanın ₺${short(profile.money)}`)),
        h('div', { className: 'ml-gift' },
          h('input', { type: 'number', inputMode: 'numeric', min: rules.minDeposit, placeholder: 'Tutar', value: gift, onChange: e => setGift(e.target.value), 'aria-label': 'Bağış tutarı' }),
          h('button', { className: 'ml-btn ml-btn-pri', disabled: busy === 'deposit', onClick: () => deposit(gift) }, busy === 'deposit' ? 'Gönderiliyor…' : 'Bağışla')),
        h('div', { className: 'ml-chips' }, [10000, 100000, 1000000].map(v => h('button', { key: v, className: 'ml-chip', onClick: () => setGift(String(v)) }, '₺' + short(v))))),

      // Birlikler
      h('section', { className: 'ml-card' },
        h('div', { className: 'ml-card-h' }, h('h2', null, 'Birlikler'), h('span', { className: 'ml-note' }, `Tüfek stoğu ${short(live.tufek)}${rate.tufek ? ` (+${short(rate.tufek)}/sa)` : ''}`)),
        h('div', { className: 'ml-units' }, UNITS.map(u => h('div', { key: u.k, className: 'ml-unit', title: u.tip },
          h('div', { className: 'ml-unit-ic' }, h(Icon, { name: u.icon, size: 26, color: C.accent })),
          h('div', { className: 'ml-unit-n' }, h(Counter, { value: live[u.k] || 0 })),
          h('div', { className: 'ml-unit-l' }, u.ad, rate[u.k] ? h('em', null, ` +${rate[u.k]}/sa`) : null))))),

      // Asker bas
      h('section', { className: 'ml-card' },
        h('div', { className: 'ml-card-h' }, h('h2', null, 'Asker bas'), h('span', { className: 'ml-note' }, '1 parti = 1.000 asker')),
        h('div', { className: 'ml-rec' },
          h('div', { className: 'ml-step' },
            h('button', { className: 'ml-step-b', onClick: () => setBatches(b => Math.max(1, b - 1)), 'aria-label': 'Azalt' }, '−'),
            h('div', { className: 'ml-step-v' }, h('b', null, num(n)), h('span', null, 'asker')),
            h('button', { className: 'ml-step-b', onClick: () => setBatches(b => Math.min(100, b + 1)), 'aria-label': 'Artır' }, '+')),
          h('ul', { className: 'ml-reqs' }, reqs.map(r => h('li', { key: r.t, className: r.have >= r.need ? 'ok' : 'no' },
            h('span', null, r.t), h('b', null, (r.money ? '₺' : '') + short(r.need)), h('i', null, r.have >= r.need ? '✓' : '✕'))))),
        h('button', { className: 'ml-btn ml-btn-pri ml-btn-wide', disabled: !canRecruit || busy === 'recruit', onClick: recruit },
          busy === 'recruit' ? 'Eğitiliyor…' : leader ? `${num(n)} asker bas` : 'Asker basma kararı liderin'),
        live.tufek < n && h('p', { className: 'ml-hint' }, 'Tüfek yetmiyor: silah fabrikası kur ya da üretimi bekle.')),

      // Fabrikalar
      h('section', { className: 'ml-card' },
        h('div', { className: 'ml-card-h' }, h('h2', null, 'Fabrikalar'), h('span', { className: 'ml-note' }, leader ? 'Hazineden ödenir' : 'Kurma kararı liderin')),
        h('div', { className: 'ml-facs' }, Object.entries(rules.factories).map(([type, d]) => h('div', { key: type, className: 'ml-fac' },
          h('div', { className: 'ml-fac-top' }, h(Icon, { name: FAC_ICON[type], size: 24, color: C.accent }), h('span', { className: 'ml-fac-n' }, `${facCount(type)}/${rules.maxPerType}`)),
          h('div', { className: 'ml-fac-t' }, d.ad),
          h('div', { className: 'ml-fac-d' }, `+${num(d.perHour)} ${d.urun.toLowerCase()}/sa`),
          h('button', { className: 'ml-btn ml-btn-sm ml-btn-wide', disabled: !leader || busy === 'f_' + type || facCount(type) >= rules.maxPerType || mil.hazine < d.cost, onClick: () => build(type) },
            busy === 'f_' + type ? 'Kuruluyor…' : `Kur ₺${short(d.cost)}`)))),
        data.factories.length > 0 && h('ul', { className: 'ml-lines' }, data.factories.map(f => {
          const d = rules.factories[f.type];
          return h('li', { key: f.id },
            h(Icon, { name: FAC_ICON[f.type], size: 20, color: C.accentHi }),
            h('div', { className: 'ml-line-m' },
              h('div', { className: 'ml-line-t' }, d.ad, h('span', null, ` Sv.${f.level}`)),
              h('div', { className: 'ml-conv' }, h('i', null)),
              h('div', { className: 'ml-line-d' }, `+${num(d.perHour * f.level)} ${d.urun.toLowerCase()}/sa`)),
            leader && f.level < rules.maxLevel && h('button', { className: 'ml-btn ml-btn-sm', disabled: busy === 'u_' + f.id || mil.hazine < d.cost * f.level, onClick: () => upgrade(f) },
              busy === 'u_' + f.id ? '…' : `Yükselt ₺${short(d.cost * f.level)}`));
        }))),

      // Harekâtlar
      h('section', { className: 'ml-card' },
        h('div', { className: 'ml-card-h' }, h('h2', null, 'Harekâtlar'), h('span', { className: 'ml-note' }, 'Hedefi Dünya Haritası\'ndan seç')),
        data.ops.length === 0
          ? h('div', { className: 'ml-none' }, h('p', null, 'Henüz harekât yok. Haritada bir ülkeye dokun ve “Askeri harekât” ile birliklerini gönder.'),
              h('button', { className: 'ml-btn ml-btn-pri', onClick: () => onNavigate && onNavigate('world') }, 'Hedef seç'))
          : h('ul', { className: 'ml-ops' }, data.ops.map(op => {
              const S = STATUS[op.status] || STATUS.moving;
              const total = Math.max(1, op.arriveAt - op.departAt);
              const p = op.status === 'moving' ? Math.min(1, Math.max(0, (srvNow - op.departAt) / total)) : 1;
              const left = op.status === 'moving' ? (op.arriveAt - srvNow) / 1000 : op.status === 'battle' ? (op.battleEndAt - srvNow) / 1000 : 0;
              const u = op.units;
              return h('li', { key: op.id, className: 'ml-op ml-op-' + op.status },
                h('div', { className: 'ml-op-h' },
                  h('span', { className: 'ml-op-f' }, api().flagOf(op.target)),
                  h('div', { className: 'ml-op-m' },
                    h('div', { className: 'ml-op-t' }, op.targetName, h('span', { className: 'ml-badge', style: { color: S.c, borderColor: S.c } }, S.t)),
                    h('div', { className: 'ml-op-u' }, [u.piyade && `${short(u.piyade)} asker`, u.tank && `${u.tank} tank`, u.topcu && `${u.topcu} obüs`, u.iha && `${u.iha} İHA`].filter(Boolean).join(', '), ` · ${num(op.distanceKm)} km`))),
                window.BattleFX && (op.status === 'moving' || op.status === 'battle') && h(window.BattleFX, {
                  mode: op.status === 'battle' ? 'battle' : 'march', height: 84,
                  label: op.status === 'battle' ? `${op.targetName} cephesinde çatışma` : `${op.targetName} yolunda`,
                  sub: op.status === 'battle' ? `Bitmesine ${api().fmtDur(left)}` : `Varışa ${api().fmtDur(left)}, ${num(op.distanceKm)} km`,
                }),
                (op.status === 'moving' || op.status === 'battle') && h('div', { className: 'ml-op-p' },
                  h('div', { className: 'ml-bar' + (op.status === 'battle' ? ' ml-bar-war' : '') }, h('i', { style: { width: (p * 100) + '%' } })),
                  h('span', null, op.status === 'moving' ? `Varış: ${api().fmtDur(left)}` : `Çatışma: ${api().fmtDur(left)}`)),
                op.result && h('div', { className: 'ml-op-r' },
                  op.result.won ? `Zafer: ${op.targetName} ele geçirildi.` : `${op.targetName} savunması kırılamadı.`,
                  ` Güç ${short(op.attackPower)} / ${short(op.defensePower)}, kayıp %${op.result.lossPct}.`),
                h('div', { className: 'ml-row' },
                  h('button', { className: 'ml-btn ml-btn-sm', onClick: () => watch(op) }, h(Icon, { name: 'globe', size: 15 }), 'Haritada izle'),
                  leader && op.status === 'moving' && h('button', { className: 'ml-btn ml-btn-sm ml-btn-ghost', disabled: busy === 'c_' + op.id, onClick: () => cancel(op) }, 'Geri çağır')));
            })))
    );
  }

  const MIL_CSS = `
  .ml-root{padding:14px 12px 24px;color:${C.text};font-family:'Inter',sans-serif;background:radial-gradient(120% 60% at 50% -10%, rgba(60,200,240,.08), transparent 60%), ${C.bg};min-height:100%}
  .ml-head{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-bottom:12px}
  .ml-h1{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:1.7rem;letter-spacing:.02em;line-height:1;margin:0;color:${C.text}}
  .ml-sub{display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin-top:5px;font-size:.76rem;color:${C.muted}}
  .ml-dot{width:9px;height:9px;border-radius:3px;display:inline-block}
  .ml-sep{width:3px;height:3px;border-radius:50%;background:${C.muted};opacity:.6;margin:0 3px}
  .ml-hud{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:12px}
  .ml-hud-i{background:${C.surface};border:1px solid ${C.line};border-radius:12px;padding:10px 12px;min-width:0}
  .ml-hud-wide{grid-column:1 / -1}
  .ml-hud-i label{display:flex;justify-content:space-between;font-size:.7rem;color:${C.muted};margin-bottom:4px}
  .ml-hud-i label span{color:${C.text};font-weight:600}
  .ml-hud-i b{font-family:'Rajdhani',sans-serif;font-size:1.45rem;font-weight:700;letter-spacing:.01em}
  .ml-bar{height:7px;border-radius:4px;background:rgba(255,255,255,.07);overflow:hidden;position:relative}
  .ml-bar i{display:block;height:100%;border-radius:4px;background:linear-gradient(90deg,${C.accent},${C.accentHi});transition:width .8s ease}
  .ml-bar-war i{background:repeating-linear-gradient(45deg,${C.red} 0 8px,#B5363A 8px 16px);background-size:200% 100%;animation:mlStripe 1s linear infinite}
  @keyframes mlStripe{to{background-position:-32px 0}}
  .ml-card{background:${C.surface};border:1px solid ${C.line};border-radius:14px;padding:14px;margin-bottom:12px}
  .ml-card-h{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:10px}
  .ml-card-h h2{font-family:'Rajdhani',sans-serif;font-size:1.12rem;font-weight:700;margin:0;letter-spacing:.02em}
  .ml-note{font-size:.7rem;color:${C.muted};text-align:right}
  .ml-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:40px;padding:0 14px;border-radius:11px;border:1px solid rgba(155,230,251,.25);background:rgba(60,200,240,.08);color:${C.text};font:600 .82rem 'Inter',sans-serif;cursor:pointer;white-space:nowrap;transition:transform .12s ease, background .15s ease}
  .ml-btn:active:not(:disabled){transform:scale(.97)}
  .ml-btn:disabled{opacity:.42;cursor:not-allowed}
  .ml-btn-pri{background:linear-gradient(180deg,#45D0F5,#1E9DCB);border-color:#7FDDF8;color:#04121C;font-weight:700}
  .ml-btn-ghost{background:transparent;border-color:rgba(255,255,255,.12);color:${C.muted}}
  .ml-btn-sm{height:34px;padding:0 11px;font-size:.76rem}
  .ml-btn-wide{width:100%}
  .ml-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
  .ml-gift{display:flex;gap:8px}
  .ml-gift input{flex:1;min-width:0;height:40px;padding:0 12px;border-radius:11px;border:1px solid ${C.line};background:${C.bg};color:${C.text};font-family:'Inter',sans-serif;outline:none}
  .ml-gift input:focus{border-color:${C.accent}}
  .ml-chips{display:flex;gap:6px;margin-top:8px}
  .ml-chip{height:30px;padding:0 12px;border-radius:999px;border:1px solid ${C.line};background:transparent;color:${C.muted};font:600 .74rem 'Inter',sans-serif;cursor:pointer}
  .ml-units{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .ml-unit{background:${C.surface2};border:1px solid ${C.line};border-radius:12px;padding:10px 12px;display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:10px;align-items:center}
  .ml-unit-ic{grid-row:1 / span 2;width:40px;height:40px;border-radius:10px;background:rgba(60,200,240,.08);display:flex;align-items:center;justify-content:center}
  .ml-unit-n{font-family:'Rajdhani',sans-serif;font-size:1.35rem;font-weight:700;line-height:1}
  .ml-unit-l{font-size:.72rem;color:${C.muted}}
  .ml-unit-l em{font-style:normal;color:${C.green}}
  .ml-rec{display:flex;gap:12px;align-items:center;margin-bottom:10px}
  .ml-step{display:flex;align-items:center;gap:6px;flex-shrink:0}
  .ml-step-b{width:36px;height:36px;border-radius:10px;border:1px solid ${C.line};background:${C.surface2};color:${C.text};font-size:1.2rem;cursor:pointer}
  .ml-step-v{text-align:center;min-width:64px}
  .ml-step-v b{display:block;font-family:'Rajdhani',sans-serif;font-size:1.25rem;line-height:1}
  .ml-step-v span{font-size:.66rem;color:${C.muted}}
  .ml-reqs{list-style:none;margin:0;padding:0;flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
  .ml-reqs li{display:flex;align-items:center;gap:6px;font-size:.74rem;color:${C.muted}}
  .ml-reqs li span{flex:1}
  .ml-reqs li b{color:${C.text};font-weight:600}
  .ml-reqs li i{font-style:normal;width:16px;text-align:center}
  .ml-reqs li.ok i{color:${C.green}} .ml-reqs li.no i{color:${C.red}} .ml-reqs li.no b{color:${C.red}}
  .ml-hint{font-size:.72rem;color:${C.amber};margin:8px 0 0}
  .ml-facs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .ml-fac{background:${C.surface2};border:1px solid ${C.line};border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:4px}
  .ml-fac-top{display:flex;justify-content:space-between;align-items:center}
  .ml-fac-n{font-size:.7rem;color:${C.muted};font-weight:600}
  .ml-fac-t{font-weight:700;font-size:.82rem}
  .ml-fac-d{font-size:.7rem;color:${C.green};margin-bottom:4px}
  .ml-lines{list-style:none;margin:10px 0 0;padding:0;display:flex;flex-direction:column;gap:6px}
  .ml-lines li{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.025)}
  .ml-line-m{flex:1;min-width:0}
  .ml-line-t{font-size:.8rem;font-weight:600} .ml-line-t span{color:${C.accentHi};font-weight:700}
  .ml-line-d{font-size:.68rem;color:${C.muted};margin-top:3px}
  .ml-conv{height:4px;border-radius:2px;margin-top:5px;background:rgba(255,255,255,.06);overflow:hidden}
  .ml-conv i{display:block;height:100%;width:40%;border-radius:2px;background:linear-gradient(90deg,transparent,${C.accent},transparent);animation:mlConv 1.8s linear infinite}
  @keyframes mlConv{from{transform:translateX(-100%)}to{transform:translateX(260%)}}
  .ml-none p{font-size:.8rem;color:${C.muted};line-height:1.5;margin:0 0 10px}
  .ml-ops{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
  .ml-op{border:1px solid ${C.line};border-radius:12px;padding:10px 12px;background:${C.surface2}}
  .ml-op-battle{border-color:rgba(229,72,77,.5);box-shadow:0 0 0 1px rgba(229,72,77,.15), 0 0 24px rgba(229,72,77,.12)}
  .ml-op-h{display:flex;gap:10px;align-items:center}
  .ml-op-f{font-size:1.6rem;line-height:1}
  .ml-op-m{flex:1;min-width:0}
  .ml-op-t{display:flex;align-items:center;gap:8px;font-weight:700;font-size:.9rem}
  .ml-badge{font-size:.64rem;font-weight:700;border:1px solid;border-radius:999px;padding:1px 8px}
  .ml-op-u{font-size:.72rem;color:${C.muted};margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .ml-op-p{margin-top:8px}
  .ml-op-p span{display:block;font-size:.72rem;color:${C.text};margin-top:5px;font-variant-numeric:tabular-nums}
  .ml-op-r{font-size:.74rem;color:${C.muted};margin-top:8px;line-height:1.45}
  .ml-hero{text-align:center;padding:40px 10px}
  .ml-lead{color:${C.muted};font-size:.86rem;line-height:1.55;max-width:340px;margin:10px auto 6px}
  .ml-hero .ml-row{justify-content:center}
  .ml-empty{min-height:50vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:${C.muted};text-align:center;padding:20px}
  .ml-empty-t{font-family:'Rajdhani',sans-serif;font-size:1.3rem;color:${C.text};font-weight:700}
  .ml-spin{width:30px;height:30px;border-radius:50%;border:2px solid rgba(60,200,240,.2);border-top-color:${C.accent};animation:spin .9s linear infinite}
  .ml-root button:focus-visible,.ml-root input:focus-visible{outline:2px solid ${C.accentHi};outline-offset:2px}
  @media (prefers-reduced-motion: reduce){.ml-conv i,.ml-bar-war i{animation:none}}
  `;

  window.MilitaryScreen = MilitaryScreen;
})();
