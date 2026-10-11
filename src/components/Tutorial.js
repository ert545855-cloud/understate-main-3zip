"use strict";
// ═══════════════════════════════════════════════════════════════════════════
// SİYASET RP — Sekreter Elif ile adım adım başlangıç rehberi (window.TutorialOverlay)
// • İlk girişte tanıtım, sonra alt menünün üstünde küçük görev paneli
// • Adımlar oyuncu gerçekten yaptıkça kendiliğinden tamamlanır (sayfa ziyareti,
//   para artışı, 'tutorial-event' olayları: migrate, deposit, factory, recruit, operation)
// • İlerleme localStorage'da (us_tutorial_v1) saklanır; bitince ödül verilir
// ═══════════════════════════════════════════════════════════════════════════
(function () {
  const R = React, h = R.createElement;
  const KEY = 'us_tutorial_v1';
  const REWARD = { money: 25000, xp: 100 };
  const NAV_GROUP = { world: 'kesfet', jobs: 'ekonomi', politics: 'devlet', ordu: 'savas' };
  // Altta yazı kutusu olan sayfalarda rehber gizlenir (gönder düğmesinin üstüne binmesin)
  const INPUT_PAGES = new Set(['chat', 'klanchat', 'dm', 'grup_mesaj', 'mektup']);

  // Adımlar. done(ctx) true olduğunda adım tamamlanır.
  const STEPS = [
    { id: 'hello', title: 'Hoş geldin', page: null,
      say: (n) => `Merhaba ${n}! Ben Elif, makam sekreterin. Siyaset RP'de devlet kurar, meclisi yönetir, ordunu büyütür ve dünya haritasında harekât başlatırsın. Seni adım adım hazırlayacağım.`,
      done: () => false, manual: 'Başlayalım' },
    { id: 'citizen', title: 'Vatanını seç', page: 'world',
      say: () => 'Önce bir vatan seçelim. Dünya Haritası\'nı aç, bir ülkeye dokun ve “Göç et”e bas. İlk seçim ücretsiz.',
      done: (c) => c.events.migrate || !!(c.profile && (c.profile.worldCountry || (c.profile.gameData && c.profile.gameData.worldCountry))) },
    { id: 'job', title: 'İlk maaşını al', page: 'jobs',
      say: () => 'Devlet kurmak para ister. İşler ekranından bir işte çalış; cüzdanın büyüdüğünde bu adım tamamlanır.',
      done: (c) => c.moneyUp },
    { id: 'state', title: 'Bir devlete katıl', page: 'politics', skippable: true,
      say: () => 'Tek başına sınırlı kalırsın. Devletler ekranından bir devlete katıl ya da yeterli paran olunca kendi devletini kur.',
      done: (c) => c.hasState },
    { id: 'army', title: 'Ordunu tanı', page: 'ordu',
      say: () => 'Silahlı Kuvvetler ekranında hazineyi, birlikleri ve fabrikaları görürsün. Bir göz at.',
      done: (c) => c.events.visit_ordu },
    { id: 'factory', title: 'Fabrika kur', page: 'ordu', skippable: true,
      say: () => 'Liderisen bir silah ya da tank fabrikası kur; üretim saat saat birikir. Lider değilsen hazineye bağış yapman da yeter.',
      done: (c) => c.events.factory || c.events.deposit },
    { id: 'recruit', title: 'Asker bas', page: 'ordu', skippable: true,
      say: () => 'Tüfek, insan gücü ve hazine yeterliyse “Asker bas” ile orduna 1.000\'erlik birlikler kat.',
      done: (c) => c.events.recruit },
    { id: 'operation', title: 'İlk harekât', page: 'world', skippable: true,
      say: () => 'Haritada bir hedefe dokun, “Harekât”a bas, birliklerini seç. Varış süresini ve kazanma şansını orada görürsün.',
      done: (c) => c.events.operation },
  ];

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null') || null; } catch (e) { return null; } };
  const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };

  // ── Sekreter Elif (özgün çizim) ────────────────────────────────────────────
  function Secretary({ size = 120, talking }) {
    return h('svg', { viewBox: '0 0 120 140', width: size, height: size * 140 / 120, className: 'tut-sec' + (talking ? ' talk' : ''), 'aria-hidden': true },
      h('defs', null,
        h('linearGradient', { id: 'tutBlz', x1: 0, y1: 0, x2: 0, y2: 1 }, h('stop', { offset: 0, stopColor: '#2A3E5E' }), h('stop', { offset: 1, stopColor: '#16233A' })),
        h('linearGradient', { id: 'tutTab', x1: 0, y1: 0, x2: 1, y2: 1 }, h('stop', { offset: 0, stopColor: '#9BE6FB' }), h('stop', { offset: 1, stopColor: '#2BA8D6' }))),
      h('g', { className: 'tut-bob' },
        // omuzlar / ceket
        h('path', { d: 'M14 140c2-26 18-40 46-42 28 2 44 16 46 42z', fill: 'url(#tutBlz)' }),
        h('path', { d: 'M48 100l12 22 12-22c-4-2-8-3-12-3s-8 1-12 3z', fill: '#F3F6FA' }),
        h('path', { d: 'M48 100l12 22-7 18H40c0-14 3-28 8-40zM72 100l-12 22 7 18h13c0-14-3-28-8-40z', fill: '#22344F' }),
        h('circle', { cx: 77, cy: 112, r: 2.2, fill: '#3CC8F0' }),
        // boyun
        h('path', { d: 'M53 84h14v16c-4 3-10 3-14 0z', fill: '#D9A483' }),
        // saç arka (topuz)
        h('circle', { cx: 60, cy: 22, r: 11, fill: '#2B1D16' }),
        h('ellipse', { cx: 60, cy: 52, rx: 27, ry: 30, fill: '#2B1D16' }),
        // yüz
        h('ellipse', { cx: 60, cy: 56, rx: 21, ry: 25, fill: '#E8B998' }),
        // saç ön perçem
        h('path', { d: 'M38 50c2-16 12-24 24-24 12 0 20 8 21 20-8-6-17-9-27-8-7 1-13 5-18 12z', fill: '#2B1D16' }),
        // kaşlar
        h('path', { d: 'M46 49c3-2 7-2 10 0M64 49c3-2 7-2 10 0', stroke: '#2B1D16', strokeWidth: 1.8, strokeLinecap: 'round', fill: 'none' }),
        // gözler (göz kırpar)
        h('g', { className: 'tut-eyes' },
          h('ellipse', { cx: 51, cy: 56, rx: 2.3, ry: 2.8, fill: '#1B1B22' }), h('ellipse', { cx: 69, cy: 56, rx: 2.3, ry: 2.8, fill: '#1B1B22' })),
        // gözlük
        h('g', { fill: 'none', stroke: '#3CC8F0', strokeWidth: 1.4 },
          h('rect', { x: 43.5, y: 51, width: 15, height: 11, rx: 4 }), h('rect', { x: 61.5, y: 51, width: 15, height: 11, rx: 4 }), h('path', { d: 'M58.5 56h3' })),
        // yanaklar, burun, ağız
        h('circle', { cx: 46, cy: 66, r: 3.2, fill: '#E58F7E', opacity: 0.35 }), h('circle', { cx: 74, cy: 66, r: 3.2, fill: '#E58F7E', opacity: 0.35 }),
        h('path', { d: 'M60 59v6l-2 1', stroke: '#C4876A', strokeWidth: 1.2, fill: 'none', strokeLinecap: 'round' }),
        h('path', { className: 'tut-mouth', d: 'M53 71c4 4 10 4 14 0', stroke: '#9E4A44', strokeWidth: 2, fill: 'none', strokeLinecap: 'round' }),
        h('ellipse', { className: 'tut-mouth-o', cx: 60, cy: 72, rx: 3.6, ry: 2.6, fill: '#9E4A44' }),
        // küpeler
        h('circle', { cx: 39, cy: 64, r: 1.6, fill: '#9BE6FB' }), h('circle', { cx: 81, cy: 64, r: 1.6, fill: '#9BE6FB' }),
        // tablet
        h('g', { transform: 'rotate(-12 92 120)' },
          h('rect', { x: 80, y: 104, width: 26, height: 34, rx: 4, fill: '#0D1726', stroke: '#2BA8D6', strokeWidth: 1.5 }),
          h('rect', { x: 83, y: 108, width: 20, height: 24, rx: 2, fill: 'url(#tutTab)', className: 'tut-screen' }),
          h('path', { d: 'M86 126l4-5 4 3 5-8', stroke: '#04121C', strokeWidth: 1.6, fill: 'none', strokeLinecap: 'round' })),
        h('ellipse', { cx: 88, cy: 128, rx: 6, ry: 5, fill: '#E8B998' })));
  }

  // Yazı makinesi efekti
  function Typed({ text, onTyping }) {
    const [n, setN] = R.useState(0);
    R.useEffect(() => {
      let reduce = false; try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
      if (reduce) { setN(text.length); onTyping && onTyping(false); return; }
      setN(0); onTyping && onTyping(true);
      let i = 0; const t = setInterval(() => { i += 2; setN(i); if (i >= text.length) { clearInterval(t); onTyping && onTyping(false); } }, 22);
      return () => clearInterval(t);
    }, [text]);
    return h('span', null, text.slice(0, n), n < text.length && h('span', { className: 'tut-caret' }, '▍'));
  }

  function TutorialOverlay({ page, profile, setProfile, onNavigate, showNotif }) {
    // Eksik/eski kayıtlara karşı varsayılanlarla birleştir
    const [st, setSt] = R.useState(() => Object.assign({ step: 0, done: false, completed: [], events: {}, baseMoney: null, open: true, intro: true }, load() || {}));
    const [talking, setTalking] = R.useState(false);
    const [celebrate, setCelebrate] = R.useState(false);
    const [typing, setTyping] = R.useState(false);
    const [kb, setKb] = R.useState(false);
    const uid = profile && (profile.uid || profile.id);
    R.useEffect(() => save(st), [st]);

    // Oyun olaylarını dinle
    R.useEffect(() => {
      const on = (e) => { const k = e.detail; if (!k) return; setSt(s => ({ ...s, events: { ...s.events, [k]: true } })); };
      window.addEventListener('tutorial-event', on);
      const isField = (el) => !!el && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !/^(checkbox|radio|range|button|submit)$/i.test(el.type || '')));
      const fi = (e) => { if (isField(e.target)) setKb(true); }, fo = (e) => { if (isField(e.target)) setTimeout(() => setKb(false), 150); };
      document.addEventListener('focusin', fi); document.addEventListener('focusout', fo);
      return () => { window.removeEventListener('tutorial-event', on); document.removeEventListener('focusin', fi); document.removeEventListener('focusout', fo); };
    }, []);

    const step = STEPS[Math.max(0, Math.min(Number(st.step) || 0, STEPS.length - 1))];
    // Adım başında parayı not al (maaş adımı için)
    R.useEffect(() => {
      if (st.done) return;
      if (step.id === 'job' && st.baseMoney == null && profile) setSt(s => ({ ...s, baseMoney: profile.money || 0 }));
    }, [st.step, st.done]);

    const hasState = (() => {
      try {
        const b = JSON.parse(localStorage.getItem('rep_beyliks') || '[]');
        const list = Array.isArray(b) ? b : Object.values(b || {});
        return list.some(x => x && (x.kurucuId === uid || (x.uyeler || []).includes(uid)));
      } catch (e) { return false; }
    })();
    const ctx = { profile, events: st.events || {}, hasState, moneyUp: st.baseMoney != null && profile && (profile.money || 0) > st.baseMoney };

    // Koşul sağlandıysa adımı tamamla
    R.useEffect(() => {
      if (st.done || st.intro || !step || step.manual) return;
      if (!step.done(ctx)) return;
      const t = setTimeout(() => advance(true), 500);
      return () => clearTimeout(t);
    });

    // Alt menüde hedef grubu parlat
    R.useEffect(() => {
      const grp = !st.done && !st.intro && step && step.page && page !== step.page ? NAV_GROUP[step.page] : '';
      if (grp) document.body.setAttribute('data-tut-nav', grp); else document.body.removeAttribute('data-tut-nav');
      return () => document.body.removeAttribute('data-tut-nav');
    }, [st.step, st.done, st.intro, page]);

    function advance(success) {
      setSt(s => {
        const completed = success ? Array.from(new Set([...(s.completed || []), STEPS[s.step].id])) : (s.completed || []);
        const next = s.step + 1;
        if (next >= STEPS.length) return { ...s, completed, step: STEPS.length - 1, done: true, open: true };
        return { ...s, completed, step: next, baseMoney: null, open: true };
      });
      if (success) { setCelebrate(true); setTimeout(() => setCelebrate(false), 1400); }
    }
    const finish = () => {
      if (!st.rewarded && setProfile) {
        setProfile(p => ({ ...p, money: (p.money || 0) + REWARD.money, xp: (p.xp || 0) + REWARD.xp }));
        try { showNotif && showNotif(`🎉 Rehber tamamlandı: +₺${REWARD.money.toLocaleString('tr-TR')} ve +${REWARD.xp} XP`, 'success'); } catch (e) {}
      }
      setSt(s => ({ ...s, rewarded: true, closed: true }));
    };

    // Hedef sayfaya gelince paneli küçült (talimat verildi, ekran oyuncunun)
    R.useEffect(() => {
      if (!st.done && !st.intro && step && step.page && page === step.page && st.open) setSt(s => ({ ...s, open: false }));
    }, [page, st.step]);

    if (st.closed || st.dismissed) return null;
    if (INPUT_PAGES.has(page) && !st.intro) return null;
    const name = (profile && profile.username) || 'Lider';
    const total = STEPS.length - 1; // ilk adım (tanışma) sayılmaz
    const doneCount = (st.completed || []).filter(id => id !== 'hello').length;
    const pct = Math.round(doneCount / total * 100);
    const css = h('style', null, TUT_CSS);

    // Tanıtım (ilk açılış)
    if (st.intro) {
      return h('div', { className: 'tut-intro-bg' }, css,
        h('div', { className: 'tut-intro', role: 'dialog', 'aria-label': 'Başlangıç rehberi' },
          h('div', { className: 'tut-intro-art' }, h(Secretary, { size: 132, talking })),
          h('div', { className: 'tut-bubble' }, h('div', { className: 'tut-who' }, 'Sekreter Elif'), h(Typed, { text: STEPS[0].say(name), onTyping: setTalking })),
          h('ol', { className: 'tut-preview' }, STEPS.slice(1).map((s, i) => h('li', { key: s.id, style: { animationDelay: (0.15 + i * 0.07) + 's' } }, h('span', null, i + 1), s.title))),
          h('div', { className: 'tut-row' },
            h('button', { className: 'tut-btn tut-btn-pri', onClick: () => { setSt(s => ({ ...s, intro: false, completed: ['hello'], step: 1 })); } }, 'Başlayalım'),
            h('button', { className: 'tut-btn', onClick: () => setSt(s => ({ ...s, dismissed: true })) }, 'Rehberi atla'))));
    }

    if (kb) return null;

    // Bitti
    if (st.done) {
      return h('div', { className: 'tut-dock' }, css,
        h('div', { className: 'tut-panel tut-final' },
          h('div', { className: 'tut-av' }, h(Secretary, { size: 52, talking })),
          h('div', { className: 'tut-body' },
            h('div', { className: 'tut-t' }, 'Hazırsın, ' + name + '!'),
            h('div', { className: 'tut-d' }, 'Tüm adımları tamamladın. Ödülün hazır; bundan sonrası senin siyasetine kalmış.'),
            h('button', { className: 'tut-btn tut-btn-pri', onClick: finish }, `Ödülü al: ₺${REWARD.money.toLocaleString('tr-TR')} + ${REWARD.xp} XP`)),
          h(Confetti, null)));
    }

    // Küçültülmüş balon
    if (!st.open) {
      return h('div', { className: 'tut-dock tut-dock-min' }, css,
        h('button', { className: 'tut-fab', onClick: () => setSt(s => ({ ...s, open: true })), 'aria-label': 'Rehberi aç' },
          h('svg', { viewBox: '0 0 44 44', className: 'tut-ring' }, h('circle', { cx: 22, cy: 22, r: 20, className: 'bg' }), h('circle', { cx: 22, cy: 22, r: 20, className: 'fg', style: { strokeDasharray: `${pct * 1.2566} 126` } })),
          h('span', { className: 'tut-fab-av' }, h(Secretary, { size: 34 })),
          h('span', { className: 'tut-fab-n' }, `${doneCount}/${total}`)));
    }

    const onTarget = step.page && page === step.page;
    return h('div', { className: 'tut-dock' }, css,
      h('div', { className: 'tut-panel' + (celebrate ? ' yay' : '') },
        h('div', { className: 'tut-av' }, h(Secretary, { size: 52, talking })),
        h('div', { className: 'tut-body' },
          h('div', { className: 'tut-top' },
            h('span', { className: 'tut-k' }, `Adım ${Math.max(1, st.step)}/${total}`),
            h('button', { className: 'tut-icon', onClick: () => setSt(s => ({ ...s, open: false })), 'aria-label': 'Küçült' }, '▾')),
          h('div', { className: 'tut-t' }, step.title),
          h('div', { className: 'tut-d' }, h(Typed, { key: step.id, text: step.say(name), onTyping: setTalking })),
          h('div', { className: 'tut-prog' }, h('i', { style: { width: pct + '%' } })),
          h('ul', { className: 'tut-steps' }, STEPS.slice(1).map((s, i) => {
            const isDone = (st.completed || []).includes(s.id), isCur = s.id === step.id;
            return h('li', { key: s.id, className: isDone ? 'ok' : isCur ? 'cur' : '', title: s.title }, isDone ? '✓' : i + 1);
          })),
          h('div', { className: 'tut-row' },
            step.page && !onTarget && h('button', { className: 'tut-btn tut-btn-pri', onClick: () => onNavigate && onNavigate(step.page) }, 'Göster'),
            onTarget && h('span', { className: 'tut-here' }, 'Doğru yerdesin, devam et'),
            step.skippable && h('button', { className: 'tut-btn', onClick: () => advance(false) }, 'Şimdilik geç'))),
        celebrate && h('div', { className: 'tut-yay' }, '✓')));
  }

  function Confetti() {
    const bits = [];
    for (let i = 0; i < 18; i++) bits.push(h('i', { key: i, style: { left: (5 + (i * 53) % 90) + '%', background: ['#3CC8F0', '#E5484D', '#3FB27F', '#F2A93B', '#9BE6FB'][i % 5], animationDelay: (i % 6) * 0.12 + 's' } }));
    return h('div', { className: 'tut-confetti', 'aria-hidden': true }, bits);
  }

  const TUT_CSS = `
  .tut-sec .tut-bob{animation:tutBob 3.2s ease-in-out infinite;transform-origin:60px 140px}
  @keyframes tutBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
  .tut-sec .tut-eyes{transform-box:fill-box;transform-origin:center;animation:tutBlink 4.2s infinite}
  @keyframes tutBlink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
  .tut-sec .tut-mouth-o{opacity:0}
  .tut-sec.talk .tut-mouth{animation:tutTalkA .26s steps(2) infinite}
  .tut-sec.talk .tut-mouth-o{animation:tutTalkB .26s steps(2) infinite}
  @keyframes tutTalkA{0%{opacity:1}50%{opacity:0}}
  @keyframes tutTalkB{0%{opacity:0}50%{opacity:1}}
  .tut-sec .tut-screen{animation:tutScreen 2.4s ease-in-out infinite}
  @keyframes tutScreen{0%,100%{opacity:.85}50%{opacity:1}}
  .tut-intro-bg{position:fixed;inset:0;z-index:1500;background:radial-gradient(80% 60% at 50% 30%,rgba(60,200,240,.14),rgba(4,8,15,.92) 70%);display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn .3s ease}
  .tut-intro{width:100%;max-width:400px;max-height:92%;overflow-y:auto;background:#0E1724;border:1px solid rgba(60,200,240,.3);border-radius:20px;padding:18px 16px 16px;box-shadow:0 30px 80px rgba(0,0,0,.6);animation:slideUp .35s ease}
  .tut-intro-art{display:flex;justify-content:center;margin-top:-6px}
  .tut-bubble{position:relative;background:#16233A;border:1px solid rgba(155,230,251,.25);border-radius:14px;padding:12px 14px;font-size:.86rem;line-height:1.55;color:#E6EDF5;min-height:96px}
  .tut-bubble:before{content:'';position:absolute;top:-8px;left:50%;margin-left:-8px;border:8px solid transparent;border-top:0;border-bottom-color:#16233A}
  .tut-who{font-family:'Rajdhani',sans-serif;font-weight:700;color:#9BE6FB;font-size:.9rem;margin-bottom:3px}
  .tut-caret{color:#3CC8F0;animation:pulse 1s infinite}
  .tut-preview{list-style:none;margin:12px 0 4px;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
  .tut-preview li{display:flex;align-items:center;gap:7px;font-size:.74rem;color:#B8C4D2;background:rgba(255,255,255,.03);border-radius:9px;padding:7px 8px;opacity:0;animation:tutIn .35s ease forwards}
  .tut-preview li span{width:18px;height:18px;border-radius:6px;background:rgba(60,200,240,.15);color:#9BE6FB;font-size:.66rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  @keyframes tutIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  .tut-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px}
  .tut-btn{height:36px;padding:0 14px;border-radius:10px;border:1px solid rgba(230,237,245,.14);background:rgba(255,255,255,.05);color:#C9D3DF;font:600 .78rem 'Inter',sans-serif;cursor:pointer}
  .tut-btn-pri{background:linear-gradient(180deg,#45D0F5,#1E9DCB);border-color:#7FDDF8;color:#04121C;font-weight:700}
  .tut-intro .tut-row .tut-btn{flex:1;height:42px}
  .tut-dock{position:fixed;left:10px;right:10px;bottom:calc(88px + env(safe-area-inset-bottom,0px));z-index:950;display:flex;justify-content:center;pointer-events:none}
  .tut-dock-min{justify-content:flex-end}
  body[data-wm-sheet] .tut-dock{display:none}
  .tut-panel{pointer-events:auto;position:relative;width:100%;max-width:460px;display:flex;gap:10px;background:rgba(14,23,36,.97);border:1px solid rgba(60,200,240,.3);border-radius:16px;padding:10px 12px;box-shadow:0 14px 40px rgba(0,0,0,.55);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);animation:slideUp .3s ease}
  .tut-panel.yay{animation:tutYay .6s ease}
  @keyframes tutYay{0%{transform:scale(1)}30%{transform:scale(1.03);border-color:#3FB27F}100%{transform:scale(1)}}
  .tut-av{flex-shrink:0;width:52px;height:60px;border-radius:12px;background:linear-gradient(180deg,#1A2A42,#101B2C);overflow:hidden;display:flex;align-items:flex-end;justify-content:center}
  .tut-body{flex:1;min-width:0}
  .tut-top{display:flex;align-items:center;justify-content:space-between}
  .tut-k{font-size:.66rem;color:#9BE6FB;font-weight:700;letter-spacing:.03em}
  .tut-icon{width:28px;height:24px;border:none;background:none;color:#8A9BB0;font-size:.95rem;cursor:pointer}
  .tut-t{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:1.05rem;color:#E6EDF5;line-height:1.15}
  .tut-d{font-size:.76rem;color:#B8C4D2;line-height:1.45;margin-top:3px;min-height:2.9em}
  .tut-prog{height:4px;border-radius:2px;background:rgba(255,255,255,.07);overflow:hidden;margin-top:8px}
  .tut-prog i{display:block;height:100%;border-radius:2px;background:linear-gradient(90deg,#3CC8F0,#3FB27F);transition:width .6s ease}
  .tut-steps{list-style:none;margin:7px 0 0;padding:0;display:flex;gap:5px}
  .tut-steps li{width:20px;height:20px;border-radius:6px;font-size:.62rem;font-weight:700;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.05);color:#6F8096}
  .tut-steps li.ok{background:rgba(63,178,127,.2);color:#6FDBA9}
  .tut-steps li.cur{background:rgba(60,200,240,.2);color:#9BE6FB;box-shadow:0 0 0 1px rgba(60,200,240,.5)}
  .tut-here{font-size:.72rem;color:#6FDBA9;font-weight:600}
  .tut-yay{position:absolute;right:12px;top:-14px;width:30px;height:30px;border-radius:50%;background:#3FB27F;color:#04121C;font-weight:800;display:flex;align-items:center;justify-content:center;animation:tutPop .6s ease}
  @keyframes tutPop{0%{transform:scale(0)}60%{transform:scale(1.25)}100%{transform:scale(1)}}
  .tut-fab{pointer-events:auto;position:relative;width:52px;height:52px;border-radius:50%;border:none;background:#0E1724;box-shadow:0 8px 24px rgba(0,0,0,.5);cursor:pointer;padding:0}
  .tut-ring{position:absolute;inset:0;width:52px;height:52px;transform:rotate(-90deg)}
  .tut-ring circle{fill:none;stroke-width:3}
  .tut-ring .bg{stroke:rgba(255,255,255,.1)} .tut-ring .fg{stroke:#3CC8F0;stroke-linecap:round;transition:stroke-dasharray .6s ease}
  .tut-fab-av{position:absolute;inset:6px;border-radius:50%;overflow:hidden;display:flex;align-items:flex-end;justify-content:center;background:#16233A}
  .tut-fab-n{position:absolute;right:-4px;top:-4px;background:#3CC8F0;color:#04121C;font:800 .6rem 'Inter',sans-serif;border-radius:999px;padding:2px 5px}
  .tut-final .tut-body .tut-btn{margin-top:8px;width:100%;height:40px}
  .tut-confetti{position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:16px}
  .tut-confetti i{position:absolute;top:-8px;width:6px;height:10px;border-radius:2px;animation:tutFall 1.8s ease-in infinite}
  @keyframes tutFall{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(140px) rotate(540deg);opacity:0}}
  body[data-tut-nav="kesfet"] .us-bottomnav button[data-nav="kesfet"],
  body[data-tut-nav="ekonomi"] .us-bottomnav button[data-nav="ekonomi"],
  body[data-tut-nav="devlet"] .us-bottomnav button[data-nav="devlet"],
  body[data-tut-nav="savas"] .us-bottomnav button[data-nav="savas"]{animation:tutNav 1.3s ease-in-out infinite}
  @keyframes tutNav{0%,100%{box-shadow:inset 0 0 0 1.5px rgba(60,200,240,.15)}50%{box-shadow:inset 0 0 0 1.5px rgba(60,200,240,.95),0 0 18px rgba(60,200,240,.45)}}
  @media (prefers-reduced-motion: reduce){.tut-sec *{animation:none!important}.tut-confetti{display:none}body[data-tut-nav] .us-bottomnav button{animation:none!important}}
  `;

  window.TutorialOverlay = TutorialOverlay;
  window.SecretaryAvatar = Secretary;
})();
