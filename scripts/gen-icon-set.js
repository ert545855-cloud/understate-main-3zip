// assets/icons/*.svg → src/components/IconSet.js (satır içi SVG; renk currentColor ile temaya uyar)
// Kullanım: node scripts/gen-icon-set.js
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'assets', 'icons');
const out = {};
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.svg')).sort()) {
  const svg = fs.readFileSync(path.join(dir, f), 'utf8');
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s*\n\s*/g, '').trim();
  out[f.replace(/\.svg$/, '')] = inner;
}
const js = `"use strict";
// OTOMATİK ÜRETİLDİ — scripts/gen-icon-set.js (assets/icons/*.svg). Elle düzenleme.
window.US_ICONS = ${JSON.stringify(out, null, 0).replace(/","/g, '",\n  "').replace(/^\{/, '{\n  ').replace(/\}$/, '\n}')};
`;
fs.writeFileSync(path.join(__dirname, '..', 'src', 'components', 'IconSet.js'), js);
console.log('icons:', Object.keys(out).length);
