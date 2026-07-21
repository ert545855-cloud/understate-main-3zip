"use strict";
// ═══════════════════════════════════════════════════════
// SALTANAT ONLINE — Osmanlı SVG Haritası
// Tıklanabilir, gerçekçi eyalet haritası
// ═══════════════════════════════════════════════════════

// Her eyaletin SVG polygon koordinatları (viewBox: 0 0 520 370)
// Bölge renkleri ve eyalet pozisyonları
const MAP_EYALETLER = [
  // ── RUMELI ───────────────────────────────────────────
  { id:'budin',      ad:'Budin',       bolge:'Rumeli',     labelX:78,  labelY:52,  renk:'#8B6BF2',
    d:'M55,28 L100,22 L118,38 L112,62 L84,70 L58,60 Z' },
  { id:'erdel',      ad:'Erdel',       bolge:'Rumeli',     labelX:130, labelY:48,  renk:'#8B6BF2',
    d:'M112,28 L150,24 L158,36 L152,58 L130,65 L112,62 Z' },
  { id:'bosna',      ad:'Bosna',       bolge:'Rumeli',     labelX:75,  labelY:88,  renk:'#8B6BF2',
    d:'M48,70 L84,70 L90,85 L80,104 L56,108 L44,92 Z' },
  { id:'rumeli',     ad:'Rumeli',      bolge:'Rumeli',     labelX:138, labelY:82,  renk:'#8B6BF2',
    d:'M84,70 L152,58 L162,72 L158,96 L140,105 L106,108 L90,98 Z' },
  { id:'mora',       ad:'Mora',        bolge:'Rumeli',     labelX:125, labelY:140, renk:'#8B6BF2',
    d:'M112,112 L145,108 L148,128 L138,150 L120,155 L108,138 Z' },
  { id:'kefe',       ad:'Kefe',        bolge:'Rumeli',     labelX:212, labelY:35,  renk:'#8B6BF2',
    d:'M192,18 L232,16 L238,34 L226,48 L202,50 L190,38 Z' },

  // ── ANADOLU ──────────────────────────────────────────
  { id:'anadolu',    ad:'Anadolu',     bolge:'Anadolu',    labelX:198, labelY:105, renk:'#C89B3C',
    d:'M162,80 L210,74 L220,85 L218,112 L200,125 L172,120 L158,108 Z' },
  { id:'karaman',    ad:'Karaman',     bolge:'Anadolu',    labelX:208, labelY:138, renk:'#C89B3C',
    d:'M172,120 L218,112 L226,128 L218,150 L196,155 L174,142 Z' },
  { id:'sivas',      ad:'Sivas',       bolge:'Anadolu',    labelX:250, labelY:90,  renk:'#C89B3C',
    d:'M220,74 L265,70 L275,84 L268,108 L248,112 L222,108 Z' },
  { id:'trabzon',    ad:'Trabzon',     bolge:'Anadolu',    labelX:287, labelY:68,  renk:'#C89B3C',
    d:'M265,55 L310,52 L316,66 L306,80 L278,82 L266,70 Z' },
  { id:'erzurum',    ad:'Erzurum',     bolge:'Anadolu',    labelX:315, labelY:88,  renk:'#C89B3C',
    d:'M278,78 L316,74 L328,86 L322,106 L302,110 L280,100 Z' },
  { id:'van',        ad:'Van',         bolge:'Anadolu',    labelX:345, labelY:105, renk:'#C89B3C',
    d:'M322,94 L358,90 L368,104 L362,122 L340,126 L322,114 Z' },
  { id:'diyarbekir', ad:'Diyarbekir',  bolge:'Anadolu',    labelX:322, labelY:130, renk:'#C89B3C',
    d:'M300,116 L340,112 L350,126 L340,148 L316,150 L298,136 Z' },

  // ── ARAP DİYARI ──────────────────────────────────────
  { id:'halep',      ad:'Halep',       bolge:'Arap Diyarı',labelX:308, labelY:155, renk:'#3E8C5A',
    d:'M280,140 L320,136 L330,150 L322,168 L300,172 L278,158 Z' },
  { id:'musul',      ad:'Musul',       bolge:'Arap Diyarı',labelX:358, labelY:135, renk:'#3E8C5A',
    d:'M344,118 L382,112 L390,128 L382,148 L358,152 L344,138 Z' },
  { id:'sam',        ad:'Şam',         bolge:'Arap Diyarı',labelX:297, labelY:185, renk:'#3E8C5A',
    d:'M276,168 L318,162 L326,178 L316,202 L292,206 L272,190 Z' },
  { id:'bagdat',     ad:'Bağdat',      bolge:'Arap Diyarı',labelX:372, labelY:162, renk:'#3E8C5A',
    d:'M352,146 L395,140 L405,158 L396,180 L368,184 L350,168 Z' },
  { id:'basra',      ad:'Basra',       bolge:'Arap Diyarı',labelX:388, labelY:198, renk:'#3E8C5A',
    d:'M365,180 L405,172 L414,192 L406,212 L380,216 L362,200 Z' },
  { id:'hicaz',      ad:'Hicaz',       bolge:'Arap Diyarı',labelX:325, labelY:235, renk:'#3E8C5A',
    d:'M300,215 L348,208 L358,228 L346,258 L318,265 L296,248 Z' },
  { id:'lahsa',      ad:'Lahsa',       bolge:'Arap Diyarı',labelX:398, labelY:230, renk:'#3E8C5A',
    d:'M374,210 L415,204 L422,226 L412,248 L386,252 L370,234 Z' },
  { id:'yemen',      ad:'Yemen',       bolge:'Arap Diyarı',labelX:358, labelY:285, renk:'#3E8C5A',
    d:'M330,262 L380,255 L392,275 L382,300 L350,306 L326,288 Z' },

  // ── KUZEY AFRİKA ─────────────────────────────────────
  { id:'misir',      ad:'Mısır',       bolge:'Kuzey Afrika',labelX:218, labelY:202, renk:'#B8423C',
    d:'M186,182 L248,175 L258,198 L248,225 L216,228 L182,208 Z' },
  { id:'habes',      ad:'Habeş',       bolge:'Kuzey Afrika',labelX:290, labelY:265, renk:'#B8423C',
    d:'M262,242 L310,236 L318,258 L306,282 L276,288 L258,268 Z' },
  { id:'trablusgarp',ad:'Trablusgarp', bolge:'Kuzey Afrika',labelX:155, labelY:192, renk:'#B8423C',
    d:'M126,172 L186,168 L192,188 L182,212 L148,216 L122,196 Z' },
  { id:'tunus',      ad:'Tunus',       bolge:'Kuzey Afrika',labelX:112, labelY:172, renk:'#B8423C',
    d:'M90,158 L132,152 L138,168 L128,188 L100,192 L86,174 Z' },
  { id:'cezayir',    ad:'Cezayir',     bolge:'Kuzey Afrika',labelX:68,  labelY:168, renk:'#B8423C',
    d:'M36,148 L92,142 L96,162 L86,188 L52,192 L32,172 Z' },

  // ── ADALAR ───────────────────────────────────────────
  { id:'kibris',     ad:'Kıbrıs',      bolge:'Adalar',     labelX:263, labelY:168, renk:'#38BDF8',
    d:'M248,160 L280,158 L284,172 L268,178 L248,172 Z' },
  { id:'girit',      ad:'Girit',       bolge:'Adalar',     labelX:162, labelY:158, renk:'#38BDF8',
    d:'M138,150 L190,148 L196,158 L188,168 L140,170 Z' },
];

const MAP_BOLGE_RENKLERI = {
  'Anadolu':      '#C89B3C',
  'Rumeli':       '#8B6BF2',
  'Arap Diyarı':  '#3E8C5A',
  'Kuzey Afrika': '#B8423C',
  'Adalar':       '#38BDF8',
};

// Osmanlı eyalet verisi (aynı id'lerle eşleşiyor)
const EYALET_DATA = {
  budin:       { ad:'Budin Eyaleti',       merkez:'Budapeşte', gelir:14000, asker:10000, aciklama:'Macaristan\'ın başkenti, Avrupa\'nın kilidi.' },
  erdel:       { ad:'Erdel Eyaleti',       merkez:'Kolojvar',  gelir:10000, asker:6000,  aciklama:'Transilvanya prensi, Osmanlı vassalı.' },
  bosna:       { ad:'Bosna Eyaleti',       merkez:'Saraybosna',gelir:9000,  asker:8000,  aciklama:'Batı Balkanların kapısı.' },
  rumeli:      { ad:'Rumeli Eyaleti',      merkez:'Sofya',     gelir:18000, asker:12000, aciklama:'İmparatorluğun en kalabalık ve zengin eyaleti.' },
  mora:        { ad:'Mora Eyaleti',        merkez:'Korent',    gelir:7000,  asker:4000,  aciklama:'Antik Yunanistan\'ın mirası.' },
  kefe:        { ad:'Kefe Eyaleti',        merkez:'Kefe',      gelir:11000, asker:15000, aciklama:'Kırım\'ın stratejik kapısı, Tatar süvarileri.' },
  anadolu:     { ad:'Anadolu Eyaleti',     merkez:'Kütahya',   gelir:12000, asker:8000,  aciklama:'İmparatorluğun kalbi, eski Selçuklu toprakları.' },
  karaman:     { ad:'Karaman Eyaleti',     merkez:'Konya',     gelir:8000,  asker:5000,  aciklama:'Orta Anadolu\'nun bereketli ovaları.' },
  sivas:       { ad:'Sivas Eyaleti',       merkez:'Sivas',     gelir:7000,  asker:6000,  aciklama:'İç Anadolu\'nun stratejik kalesi.' },
  trabzon:     { ad:'Trabzon Eyaleti',     merkez:'Trabzon',   gelir:9000,  asker:4000,  aciklama:'Karadeniz ticaretinin merkezi.' },
  erzurum:     { ad:'Erzurum Eyaleti',     merkez:'Erzurum',   gelir:6000,  asker:9000,  aciklama:'Doğu sınırının kalkanı, savaşçı halkı.' },
  van:         { ad:'Van Eyaleti',         merkez:'Van',       gelir:5000,  asker:7000,  aciklama:'Göl kıyısının güzide eyaleti.' },
  diyarbekir:  { ad:'Diyarbekir Eyaleti',  merkez:'Diyarbakır',gelir:8500,  asker:7500,  aciklama:'Güneydoğu\'nun siyah bazalt şehri.' },
  halep:       { ad:'Halep Eyaleti',       merkez:'Halep',     gelir:12000, asker:6000,  aciklama:'İpek Yolu\'nun kilit noktası.' },
  musul:       { ad:'Musul Eyaleti',       merkez:'Musul',     gelir:8000,  asker:6000,  aciklama:'Kuzey Mezopotamya\'nın merkezi.' },
  sam:         { ad:'Şam Eyaleti',         merkez:'Şam',       gelir:15000, asker:8000,  aciklama:'Baharat yolunun kalbi.' },
  bagdat:      { ad:'Bağdat Eyaleti',      merkez:'Bağdat',    gelir:16000, asker:9000,  aciklama:'Halifeliğin kadim başkenti.' },
  basra:       { ad:'Basra Eyaleti',       merkez:'Basra',     gelir:10000, asker:5000,  aciklama:'Hint Okyanusu ticaret kapısı.' },
  hicaz:       { ad:'Hicaz Eyaleti',       merkez:'Mekke',     gelir:8000,  asker:3000,  aciklama:'İki kutsal şehrin mukaddes toprakları.' },
  lahsa:       { ad:'Lahsa Eyaleti',       merkez:'Lahsa',     gelir:6000,  asker:3000,  aciklama:'Körfez kıyılarının inci avcıları.' },
  yemen:       { ad:'Yemen Eyaleti',       merkez:'Sana',      gelir:7000,  asker:4000,  aciklama:'Kahvenin anavatanı, deniz ticareti merkezi.' },
  misir:       { ad:'Mısır Eyaleti',       merkez:'Kahire',    gelir:25000, asker:10000, aciklama:'Nil\'in nimeti, imparatorluğun tahıl ambarı.' },
  habes:       { ad:'Habeş Eyaleti',       merkez:'Masava',    gelir:4000,  asker:3000,  aciklama:'Doğu Afrika kıyılarının stratejik noktası.' },
  trablusgarp: { ad:'Trablusgarp Eyaleti', merkez:'Trablusgarp',gelir:7000, asker:5000,  aciklama:'Akdeniz\'in güneyinde korsanların sığınağı.' },
  tunus:       { ad:'Tunus Eyaleti',       merkez:'Tunus',     gelir:8500,  asker:5000,  aciklama:'Akdeniz ticaretinin güney kapısı.' },
  cezayir:     { ad:'Cezayir Eyaleti',     merkez:'Cezayir',   gelir:10000, asker:8000,  aciklama:'Kuzey Afrika\'nın en güçlü eyaleti.' },
  kibris:      { ad:'Kıbrıs Eyaleti',      merkez:'Lefkoşa',   gelir:9000,  asker:4000,  aciklama:'Akdeniz\'in mücevheri.' },
  girit:       { ad:'Girit Eyaleti',       merkez:'Kandiye',   gelir:8000,  asker:5000,  aciklama:'Ege\'nin en büyük adası.' },
};

window.OttomanMapScreen = function OttomanMapScreen({ cu, setCurrentPage, allUsers }) {
  const [secili, setSecili] = React.useState(null);
  const [valiVerisi, setValiVerisi] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('rep_valiVerisi') || '{}'); } catch { return {}; }
  });
  const [gorsel, setGorsel] = React.useState('harita'); // 'harita' | 'liste'
  const [hoverId, setHoverId] = React.useState(null);

  const isSultan = cu?.role === 'admin' || cu?.isAdmin;
  const kullaniciValiEyaleti = Object.entries(valiVerisi).find(([,v]) => v.valiId === cu?.id)?.[0];

  const valiAtama = (eyaletId) => {
    if (!cu?.id) return;
    if (kullaniciValiEyaleti && kullaniciValiEyaleti !== eyaletId) {
      alert('Zaten başka bir eyaletin valisisiniz!'); return;
    }
    const yeni = { ...valiVerisi, [eyaletId]: { valiId: cu.id, valiAdi: cu.username, atamaTarihi: Date.now() } };
    setValiVerisi(yeni);
    localStorage.setItem('rep_valiVerisi', JSON.stringify(yeni));
    try { window._socket?.emit('eyaletValiAtama', { eyaletId, valiAdi: cu.username, action: 'atama' }); } catch(_) {}
    setSecili(null);
  };

  const valiCikar = (eyaletId) => {
    if (!isSultan && valiVerisi[eyaletId]?.valiId !== cu?.id) return;
    const yeni = { ...valiVerisi };
    delete yeni[eyaletId];
    setValiVerisi(yeni);
    localStorage.setItem('rep_valiVerisi', JSON.stringify(yeni));
    try { window._socket?.emit('eyaletValiAtama', { eyaletId, action: 'cikart' }); } catch(_) {}
    setSecili(null);
  };

  const GOLD = '#C89B3C';
  const BG   = '#1A0E00';
  const toplam = MAP_EYALETLER.length;
  const doluSayi = Object.keys(valiVerisi).length;

  // Seçili eyalet verisi
  const seciliData = secili ? EYALET_DATA[secili.id] : null;
  const seciliVali = secili ? valiVerisi[secili.id] : null;
  const seciliBenimmi = seciliVali?.valiId === cu?.id;

  return React.createElement('div', {
    style: { minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif", paddingBottom: 80 }
  },
    // ── Header ──
    React.createElement('div', {
      style: { background: 'linear-gradient(135deg,#2D1800,#3D2200,#2D1800)', borderBottom: '1px solid rgba(200,155,60,0.3)', padding: '12px 14px 10px' }
    },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 } },
        React.createElement('button', {
          onClick: () => setCurrentPage('home'),
          style: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '5px 10px', color: '#A9A6A0', fontSize: '0.72rem', cursor: 'pointer' }
        }, '← Geri'),
        React.createElement('div', { style: { fontSize: '1.3rem' } }, '🗺️'),
        React.createElement('div', null,
          React.createElement('div', { style: { fontFamily: "'Cinzel',serif", fontWeight: 900, fontSize: '1.1rem', color: GOLD } }, 'Osmanlı Eyaletleri'),
          React.createElement('div', { style: { fontSize: '0.65rem', color: '#A9A6A0' } }, `${toplam} eyalet · ${doluSayi} valili · ${toplam-doluSayi} boş`)
        ),
        // Görsel toggle
        React.createElement('div', { style: { marginLeft: 'auto', display: 'flex', gap: 4 } },
          ['harita','liste'].map(g =>
            React.createElement('button', {
              key: g,
              onClick: () => setGorsel(g),
              style: { padding: '5px 10px', borderRadius: 8, border: `1px solid ${gorsel===g ? GOLD : 'rgba(255,255,255,0.1)'}`, background: gorsel===g ? 'rgba(200,155,60,0.15)' : 'rgba(255,255,255,0.04)', color: gorsel===g ? GOLD : '#A9A6A0', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }
            }, g === 'harita' ? '🗺️ Harita' : '📋 Liste')
          )
        )
      ),
      // İstatistikler
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 } },
        [
          ['💰','Toplam Gelir', MAP_EYALETLER.reduce((s,e)=>s+(EYALET_DATA[e.id]?.gelir||0),0).toLocaleString('tr')+'🪙'],
          ['⚔️','Toplam Asker', MAP_EYALETLER.reduce((s,e)=>s+(EYALET_DATA[e.id]?.asker||0),0).toLocaleString('tr')],
          ['👑','Dolu Valilik', `${doluSayi}/${toplam}`],
        ].map(([ic,lb,val]) =>
          React.createElement('div', { key: lb, style: { background: 'rgba(200,155,60,0.07)', border: '1px solid rgba(200,155,60,0.15)', borderRadius: 8, padding: '6px', textAlign: 'center' } },
            React.createElement('div', { style: { fontSize: '0.85rem' } }, ic),
            React.createElement('div', { style: { fontSize: '0.58rem', color: '#A9A6A0' } }, lb),
            React.createElement('div', { style: { fontSize: '0.72rem', fontWeight: 700, color: GOLD, fontFamily: "'JetBrains Mono',monospace" } }, val)
          )
        )
      )
    ),

    // ── SVG HARİTA GÖRÜNÜMÜ ──
    gorsel === 'harita' && React.createElement('div', { style: { padding: '8px 8px' } },
      // Bölge renk açıklaması
      React.createElement('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, padding: '0 4px' } },
        Object.entries(BOLGE_RENKLERI).map(([ad, renk]) =>
          React.createElement('div', { key: ad, style: { display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.62rem', color: '#A9A6A0' } },
            React.createElement('div', { style: { width: 10, height: 10, borderRadius: 2, background: renk, flexShrink: 0 } }),
            ad
          )
        )
      ),
      // SVG Harita
      React.createElement('div', { style: { background: 'linear-gradient(160deg,#0a1628 0%,#0d2040 40%,#102436 100%)', borderRadius: 16, border: '1px solid rgba(200,155,60,0.2)', overflow: 'hidden', position: 'relative' } },
        React.createElement('svg', {
          viewBox: '0 0 520 320',
          style: { width: '100%', height: 'auto', display: 'block' },
        },
          // Deniz arka planı (hafif dalgalı görünüm)
          React.createElement('defs', null,
            React.createElement('pattern', { id: 'deniz', x: 0, y: 0, width: 20, height: 20, patternUnits: 'userSpaceOnUse' },
              React.createElement('path', { d: 'M0,10 Q5,6 10,10 Q15,14 20,10', stroke: 'rgba(56,189,248,0.06)', strokeWidth: 0.5, fill: 'none' })
            ),
            React.createElement('filter', { id: 'glow' },
              React.createElement('feGaussianBlur', { stdDeviation: 1.5, result: 'coloredBlur' }),
              React.createElement('feMerge', null,
                React.createElement('feMergeNode', { in: 'coloredBlur' }),
                React.createElement('feMergeNode', { in: 'SourceGraphic' })
              )
            )
          ),
          React.createElement('rect', { x: 0, y: 0, width: 520, height: 320, fill: 'url(#deniz)' }),

          // Eyalet polygon'ları
          MAP_EYALETLER.map(eyalet => {
            const vali = valiVerisi[eyalet.id];
            const benimEyalet = vali?.valiId === cu?.id;
            const isHover = hoverId === eyalet.id;
            const isSecili = secili?.id === eyalet.id;
            const renk = eyalet.renk;
            const opacity = isHover || isSecili ? 0.85 : benimEyalet ? 0.7 : 0.45;

            return React.createElement('g', { key: eyalet.id },
              React.createElement('polygon', {
                points: eyalet.d.replace(/[MLZ]/g,'').trim().split(' ').join(' '),
                fill: renk,
                fillOpacity: opacity,
                stroke: isSecili ? '#fff' : benimEyalet ? GOLD : 'rgba(255,255,255,0.25)',
                strokeWidth: isSecili ? 1.5 : benimEyalet ? 1.2 : 0.5,
                style: { cursor: 'pointer', filter: isHover ? 'brightness(1.3)' : 'none', transition: 'all 0.15s' },
                onClick: () => setSecili(eyalet),
                onMouseEnter: () => setHoverId(eyalet.id),
                onMouseLeave: () => setHoverId(null),
              }),
              // Vali işareti
              vali && React.createElement('circle', {
                cx: eyalet.labelX,
                cy: eyalet.labelY - 8,
                r: 3,
                fill: GOLD,
                style: { pointerEvents: 'none' }
              }),
              // Eyalet adı
              React.createElement('text', {
                x: eyalet.labelX,
                y: eyalet.labelY + (MAP_EYALETLER.indexOf(eyalet) % 2 === 0 ? 4 : 4),
                textAnchor: 'middle',
                fontSize: eyalet.id === 'rumeli' || eyalet.id === 'misir' ? 5.5 : 4.8,
                fontWeight: 700,
                fill: '#fff',
                fillOpacity: 0.9,
                style: { pointerEvents: 'none', userSelect: 'none', fontFamily: 'Inter, sans-serif' }
              }, eyalet.ad)
            );
          }),

          // İstanbul yıldızı (özel)
          React.createElement('g', null,
            React.createElement('circle', { cx: 170, cy: 76, r: 3.5, fill: '#FFD700', stroke: '#fff', strokeWidth: 0.8, style: { filter: 'drop-shadow(0 0 3px gold)' } }),
            React.createElement('text', { x: 180, y: 72, fontSize: 4.5, fill: GOLD, fontWeight: 700, style: { userSelect: 'none' } }, '★ İstanbul')
          )
        )
      ),
      // Tıklama ipucu
      React.createElement('div', { style: { textAlign: 'center', fontSize: '0.65rem', color: '#A9A6A0', marginTop: 6 } },
        '📍 Eyalete dokunun → detay ve vali atama'
      )
    ),

    // ── LİSTE GÖRÜNÜMÜ ──
    gorsel === 'liste' && React.createElement('div', { style: { padding: '8px 10px' } },
      Object.entries(
        MAP_EYALETLER.reduce((acc, e) => { (acc[e.bolge] = acc[e.bolge]||[]).push(e); return acc; }, {})
      ).map(([bolge, eyaletler]) =>
        React.createElement('div', { key: bolge, style: { marginBottom: 14 } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 } },
            React.createElement('div', { style: { width: 10, height: 10, borderRadius: 2, background: MAP_BOLGE_RENKLERI[bolge] } }),
            React.createElement('div', { style: { fontSize: '0.68rem', fontWeight: 700, color: '#A9A6A0', textTransform: 'uppercase', letterSpacing: '0.08em' } }, bolge)
          ),
          eyaletler.map(e => {
            const data = EYALET_DATA[e.id] || {};
            const vali = valiVerisi[e.id];
            const benimEyalet = vali?.valiId === cu?.id;
            return React.createElement('div', {
              key: e.id,
              onClick: () => setSecili(e),
              style: { background: benimEyalet ? 'rgba(200,155,60,0.1)' : 'rgba(45,24,0,0.8)', border: `1px solid ${benimEyalet ? 'rgba(200,155,60,0.4)' : 'rgba(255,255,255,0.06)'}`, borderLeft: `3px solid ${e.renk}`, borderRadius: 10, padding: '10px 12px', marginBottom: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }
            },
              React.createElement('div', { style: { flex: 1 } },
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
                  React.createElement('span', { style: { fontWeight: 700, color: '#F5EBD7', fontSize: '0.82rem' } }, data.ad || e.ad),
                  benimEyalet && React.createElement('span', { style: { fontSize: '0.58rem', background: 'rgba(200,155,60,0.2)', border: '1px solid rgba(200,155,60,0.4)', borderRadius: 5, padding: '1px 5px', color: GOLD, fontWeight: 700 } }, 'VALİNİZ')
                ),
                React.createElement('div', { style: { fontSize: '0.62rem', color: '#A9A6A0', marginTop: 2 } },
                  `📍 ${data.merkez} · 💰 ${(data.gelir||0).toLocaleString('tr')}🪙 · ⚔️ ${(data.asker||0).toLocaleString('tr')}`
                )
              ),
              React.createElement('div', { style: { textAlign: 'right', flexShrink: 0 } },
                vali
                  ? React.createElement('div', null,
                      React.createElement('div', { style: { fontSize: '0.58rem', color: '#A9A6A0' } }, '👑 Vali'),
                      React.createElement('div', { style: { fontSize: '0.7rem', fontWeight: 700, color: GOLD } }, vali.valiAdi)
                    )
                  : React.createElement('div', { style: { fontSize: '0.62rem', color: '#B8423C', fontWeight: 600 } }, '⚠️ Boş')
              )
            );
          })
        )
      )
    ),

    // ── DETAY MODAL ──
    secili && React.createElement('div', {
      style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
      onClick: e => { if(e.target===e.currentTarget) setSecili(null); }
    },
      React.createElement('div', { style: { background: '#2D1800', border: '1px solid rgba(200,155,60,0.35)', borderRadius: 18, padding: '1.25rem', maxWidth: 370, width: '100%', maxHeight: '88vh', overflowY: 'auto' } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 } },
          React.createElement('div', { style: { width: 48, height: 48, borderRadius: 12, background: `${secili.renk}22`, border: `2px solid ${secili.renk}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' } }, '🏰'),
          React.createElement('div', null,
            React.createElement('div', { style: { fontFamily: "'Cinzel',serif", fontSize: '1.05rem', fontWeight: 900, color: secili.renk } }, seciliData?.ad || secili.ad),
            React.createElement('div', { style: { fontSize: '0.68rem', color: '#A9A6A0' } }, `📍 ${seciliData?.merkez||''} · ${secili.bolge}`)
          )
        ),
        seciliData?.aciklama && React.createElement('div', { style: { fontSize: '0.75rem', color: '#A9A6A0', lineHeight: 1.5, marginBottom: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '10px 12px', fontStyle: 'italic' } }, seciliData.aciklama),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 } },
          [
            ['💰','Günlük Gelir', `${(seciliData?.gelir||0).toLocaleString('tr')} 🪙`],
            ['⚔️','Asker Gücü', (seciliData?.asker||0).toLocaleString('tr')],
          ].map(([ic,lb,val]) =>
            React.createElement('div', { key: lb, style: { background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px' } },
              React.createElement('div', { style: { fontSize: '0.62rem', color: '#A9A6A0' } }, `${ic} ${lb}`),
              React.createElement('div', { style: { fontSize: '0.9rem', fontWeight: 700, color: '#F5EBD7', fontFamily: "'JetBrains Mono',monospace" } }, val)
            )
          )
        ),
        // Vali durumu
        React.createElement('div', { style: { marginBottom: 14 } },
          React.createElement('div', { style: { fontSize: '0.7rem', color: '#A9A6A0', marginBottom: 6, fontWeight: 700 } }, '👑 MEVCUT VALİ'),
          seciliVali
            ? React.createElement('div', { style: { background: 'rgba(200,155,60,0.08)', border: '1px solid rgba(200,155,60,0.22)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
                React.createElement('div', null,
                  React.createElement('div', { style: { fontSize: '0.85rem', fontWeight: 700, color: GOLD } }, `👑 ${seciliVali.valiAdi}`),
                  React.createElement('div', { style: { fontSize: '0.6rem', color: '#A9A6A0' } }, `Atanma: ${new Date(seciliVali.atamaTarihi).toLocaleDateString('tr')}`)
                ),
                (isSultan || seciliBenimmi) && React.createElement('button', {
                  onClick: () => valiCikar(secili.id),
                  style: { background: 'rgba(184,66,60,0.15)', border: '1px solid rgba(184,66,60,0.35)', borderRadius: 8, padding: '5px 10px', color: '#B8423C', fontSize: '0.7rem', cursor: 'pointer' }
                }, 'Görevden Al')
              )
            : React.createElement('div', { style: { background: 'rgba(184,66,60,0.06)', border: '1px solid rgba(184,66,60,0.2)', borderRadius: 10, padding: '10px 12px', fontSize: '0.75rem', color: '#B8423C' } }, '⚠️ Bu eyalet valisi atanmayı bekliyor')
        ),
        // Aksiyon
        React.createElement('div', { style: { display: 'flex', gap: 8 } },
          !seciliVali && cu?.id && React.createElement('button', {
            onClick: () => valiAtama(secili.id),
            disabled: !!kullaniciValiEyaleti && kullaniciValiEyaleti !== secili.id,
            style: { flex: 1, padding: '10px 14px', borderRadius: 12, border: 'none', background: (kullaniciValiEyaleti && kullaniciValiEyaleti!==secili.id) ? '#2a2a2a' : `linear-gradient(135deg,${GOLD},#8B6A1A)`, color: (kullaniciValiEyaleti && kullaniciValiEyaleti!==secili.id) ? '#555' : '#0F0800', fontWeight: 800, fontSize: '0.82rem', cursor: (kullaniciValiEyaleti && kullaniciValiEyaleti!==secili.id) ? 'not-allowed' : 'pointer' }
          }, kullaniciValiEyaleti && kullaniciValiEyaleti!==secili.id ? '⚠️ Başka eyaletiniz var' : '👑 Vali Ol'),
          React.createElement('button', {
            onClick: () => setSecili(null),
            style: { padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#A9A6A0', fontSize: '0.82rem', cursor: 'pointer' }
          }, 'Kapat')
        )
      )
    )
  );
};
