// Dünya haritası üreticisi → assets/maps/world.svg
// Miller projeksiyonu, Türkçe ülke adları, ISO alpha-2 id'leri (KKTC, XK, SOL özel).
// Kurulum (sadece haritayı yeniden üretmek için gerekir, oyun çalışırken gerekmez):
//   npm i --no-save world-atlas@2 topojson-client@3 topojson-simplify@3 d3-geo@3 d3-geo-projection@4 i18n-iso-countries@7
// Kullanım: node scripts/gen-world-map.js assets/maps/world.svg 0.12
const fs = require('fs');
const topo = require('world-atlas/countries-50m.json');
const { feature } = require('topojson-client');
const { presimplify, simplify, quantile } = require('topojson-simplify');
const d3 = require('d3-geo');
const { geoMiller } = require('d3-geo-projection');
const iso = require('i18n-iso-countries');
iso.registerLocale(require('i18n-iso-countries/langs/tr.json'));

const out = process.argv[2];
const Q = parseFloat(process.argv[3] || '0.35');

// Short, game-friendly Turkish names (override the long official forms)
const NAME_OVERRIDE = {
  US: 'ABD', GB: 'Birleşik Krallık', RU: 'Rusya', CY: 'Güney Kıbrıs', KR: 'Güney Kore', KP: 'Kuzey Kore',
  AE: 'BAE', CD: 'Kongo DC', CG: 'Kongo', CF: 'Orta Afrika Cum.', DO: 'Dominik Cum.', CZ: 'Çekya',
  BA: 'Bosna-Hersek', MK: 'Kuzey Makedonya', IR: 'İran', SY: 'Suriye', LA: 'Laos', VN: 'Vietnam',
  TZ: 'Tanzanya', BO: 'Bolivya', VE: 'Venezuela', MD: 'Moldova', TW: 'Tayvan', PS: 'Filistin',
  BN: 'Brunei', FK: 'Falkland Adaları', SS: 'Güney Sudan', GQ: 'Ekvator Ginesi', TL: 'Doğu Timor',
  CI: 'Fildişi Sahili', SZ: 'Esvatini', FM: 'Mikronezya', VA: 'Vatikan', TF: 'Fransız Güney Toprakları',
  GS: 'G. Georgia Adaları', HM: 'Heard Adası', NL: 'Hollanda', PG: 'Papua Yeni Gine', SA: 'Suudi Arabistan',
  ZA: 'Güney Afrika', NZ: 'Yeni Zelanda', EH: 'Batı Sahra', VG: 'Virjin Adaları (BK)', VI: 'Virjin Adaları (ABD)',
  KN: 'St. Kitts ve Nevis', VC: 'St. Vincent', LC: 'Saint Lucia', ST: 'São Tomé', MF: 'Saint Martin', SX: 'Sint Maarten',
  BL: 'St. Barthélemy', PM: 'St. Pierre ve Miquelon', SH: 'Saint Helena', WF: 'Wallis ve Futuna', TC: 'Turks ve Caicos',
  MP: 'K. Mariana Adaları', UM: 'ABD Küçük Adaları', IO: 'Hint Okyanusu Bölgesi', AX: 'Åland', HK: 'Hong Kong', MO: 'Makao',
  MM: 'Myanmar', CV: 'Yeşil Burun', BQ: 'Karayip Hollandası', CW: 'Curaçao', AG: 'Antigua ve Barbuda', TT: 'Trinidad ve Tobago', MH: 'Marshall Adaları',
};
// Features without numeric ids in world-atlas
const SPECIAL = { 'N. Cyprus': ['KKTC', 'KKTC'], 'Kosovo': ['XK', 'Kosova'], 'Somaliland': ['SOL', 'Somaliland'] };
const DROP_NUM = new Set(['010']); // Antarctica
const DROP_NAME = new Set(['Indian Ocean Ter.', 'Siachen Glacier', 'Ashmore and Cartier Is.']);

// Continent by ISO alpha-2 (game regions, Turkish)
const C = {
  Avrupa: 'AL AD AT BY BE BA BG HR CZ DK EE FI FR DE GR HU IS IE IT XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SE CH UA GB VA AX FO GG JE IM GI',
  Asya: 'AF AM AZ BH BD BT BN KH CN CY GE IN ID IR IQ IL JP JO KZ KW KG LA LB MY MV MN MM NP KP OM PK PS PH QA SA SG KR LK SY TW TJ TH TL TR TM AE UZ VN YE HK MO KKTC',
  Afrika: 'DZ AO BJ BW BF BI CV CM CF TD KM CD CG CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU MA MZ NA NE NG RW ST SN SC SL SO ZA SS SD TZ TG TN UG ZM ZW EH SOL SH IO TF',
  'Kuzey Amerika': 'AG BS BB BZ CA CR CU DM DO SV GD GT HT HN JM MX NI PA KN LC VC TT US GL PR BM KY TC VG VI AI MS AW CW SX MF BL PM BQ',
  'Güney Amerika': 'AR BO BR CL CO EC GY PY PE SR UY VE FK GS',
  Okyanusya: 'AU FJ KI MH FM NR NZ PW PG WS SB TO TV VU NC PF WF CK NU AS GU MP UM HM NF PN',
};
const CONT = {};
for (const [k, v] of Object.entries(C)) v.split(' ').forEach(a => { CONT[a] = k; });

let t = presimplify(JSON.parse(JSON.stringify(topo)));
// Boost point weights so small countries keep their shape and the home region (Türkiye + çevresi) stays detailed.
{
  const geoms = t.objects.countries.geometries;
  const fullFc = feature(topo, topo.objects.countries);
  const FOCUS = new Set(['792','196','300','100','268','051','031','760','368','364','422','376','400','642','498','804','688','070','191','499','807','008','818','682']);
  const boost = new Map();
  const walk = (a, f) => Array.isArray(a) ? a.forEach(x => walk(x, f)) : f(a < 0 ? ~a : a);
  geoms.forEach((g, i) => {
    const km2 = d3.geoArea(fullFc.features[i]) * 6371 * 6371;
    let k = Math.max(1, Math.min(400, 200000 / Math.max(km2, 1)));
    if (FOCUS.has(g.id) || (!g.id && g.properties.name === 'N. Cyprus')) k = Math.max(k, 6);
    walk(g.arcs, ai => boost.set(ai, Math.max(boost.get(ai) || 1, k)));
  });
  t.arcs.forEach((arc, ai) => { const k = boost.get(ai) || 1; if (k > 1) arc.forEach(pt => { if (isFinite(pt[2])) pt[2] *= k; }); });
}
t = simplify(t, quantile(t, Q));
const fc = feature(t, t.objects.countries);
const full = feature(topo, topo.objects.countries); // unsimplified, for accurate area

const feats = [];
fc.features.forEach((f, i) => {
  const name = f.properties.name;
  if (DROP_NUM.has(f.id) || DROP_NAME.has(name)) return;
  let a2, tr;
  if (!f.id && SPECIAL[name]) { [a2, tr] = SPECIAL[name]; }
  else {
    a2 = iso.numericToAlpha2(f.id);
    if (!a2) { console.warn('no alpha2', f.id, name); return; }
    tr = NAME_OVERRIDE[a2] || iso.getName(a2, 'tr') || name;
  }
  const km2 = Math.round(d3.geoArea(full.features[i]) * 6371 * 6371);
  feats.push({ f, a2, tr, km2, cont: CONT[a2] || 'Diğer' });
});

const W = 1000;
// Clip to latitudes -56..84 so Antarctica area doesn't pad the map
const proj = geoMiller().rotate([-11, 0]);
const outline = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[-180 + 11.0001, -56], [180 + 10.9999, -56], [180 + 10.9999, 84], [-180 + 11.0001, 84], [-180 + 11.0001, -56]]] } };
proj.fitWidth(W, { type: 'FeatureCollection', features: feats.map(x => x.f) });
const bounds = d3.geoPath(proj).bounds({ type: 'FeatureCollection', features: feats.map(x => x.f) });
const H = Math.ceil(bounds[1][1] - bounds[0][1]);
proj.translate([proj.translate()[0], proj.translate()[1] - bounds[0][1]]);
const path = d3.geoPath(proj).digits(1);

// Graticule
const grat = d3.geoGraticule().step([30, 30]).extentMinor([[-180, -56], [180, 84]])();
const gratD = path(grat);

const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
let paths = '';
const unknown = [];
feats.sort((a, b) => a.tr.localeCompare(b.tr, 'tr'));
for (const x of feats) {
  const d = path(x.f);
  if (!d) continue;
  // label anchor: centroid of the largest polygon
  let big = x.f.geometry;
  if (big.type === 'MultiPolygon') {
    let best = null, ba = -1;
    for (const poly of big.coordinates) { const ar = d3.geoArea({ type: 'Polygon', coordinates: poly }); if (ar > ba) { ba = ar; best = poly; } }
    big = { type: 'Polygon', coordinates: best };
  }
  const [cx, cy] = path.centroid(big);
  const [[x0, y0], [x1, y1]] = path.bounds(x.f);
  if (x.cont === 'Diğer') unknown.push(x.a2 + ':' + x.tr);
  paths += `<path id="${x.a2}" data-name="${esc(x.tr)}" data-continent="${x.cont}" data-km2="${x.km2}" data-cx="${cx.toFixed(1)}" data-cy="${cy.toFixed(1)}" data-bw="${(x1 - x0).toFixed(1)}" d="${d}"/>\n`;
}
if (unknown.length) console.warn('no continent:', unknown.join(', '));

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Saltanat Online — Dünya Haritası (Miller projeksiyonu). Kaynak: Natural Earth 1:50m (public domain) via world-atlas. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<style>#countries path{fill:#1E2A3D;stroke:#0A111C;stroke-width:.4}#countries path:hover{fill:#C9A227}</style>
<rect width="${W}" height="${H}" fill="#04080F"/>
<path id="graticule" d="${gratD}" fill="none" stroke="#12243B" stroke-width=".5"/>
<g id="countries">
${paths}</g>
<circle id="istanbul" cx="${proj([28.98, 41.01])[0].toFixed(1)}" cy="${proj([28.98, 41.01])[1].toFixed(1)}" r="1.5" fill="#C9A227"/>
</svg>
`;
fs.writeFileSync(out, svg);
console.log('countries:', feats.length, 'size:', (svg.length / 1024).toFixed(1) + 'KB', 'viewBox', W, H);
