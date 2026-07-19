"use strict";
// ═══════════════════════════════════════════════════════
// ALT NAVİGASYON BİLEŞENİ — Design System v10
// Palette: bg=#11151C  surface=#1B212B  gold=#C9A227
// Active: gold pill  Inactive: muted #6B7687
// ═══════════════════════════════════════════════════════

const NAV_GROUPS = [
  { id:'home', icon:'🏠', svgIcon:'home', label:'Ana Sayfa', rgb:'201,162,39', direct:true },
  {
    id:'ekonomi', icon:'💰', svgIcon:'money', label:'Ekonomi', rgb:'201,162,39',
    items:[
      { id:'jobs',            icon:'💼', svgIcon:'briefcase', label:'İşler',          rgb:'76,154,107'  },
      { id:'kariyer',         icon:'🏗️', svgIcon:'factory',   label:'Kariyer',        rgb:'201,162,39' },
      { id:'economy',         icon:'📊', svgIcon:'chart',     label:'Genel',          rgb:'76,154,107'  },
      { id:'farm',            icon:'🌾', svgIcon:'farm',      label:'Tarım',          rgb:'76,154,107'  },
      { id:'livestock',       icon:'🐄', svgIcon:'truck',     label:'Hayvancılık',    rgb:'76,154,107'  },
      { id:'market',          icon:'🛒', svgIcon:'money',     label:'Market',         rgb:'201,162,39'  },
      { id:'holdings',        icon:'🏢', svgIcon:'briefcase', label:'Şirketler',      rgb:'201,162,39'  },
      { id:'economic_empire', icon:'👑', svgIcon:'chart',     label:'İmparatorluk',   rgb:'76,154,107'  },
      { id:'factory',         icon:'🏭', svgIcon:'factory',   label:'Atölye',        rgb:'201,162,39'  },
      { id:'mining',          icon:'⛏️', svgIcon:'mining',    label:'Maden',          rgb:'136,147,161' },
      { id:'education',       icon:'🎓', svgIcon:'education', label:'Eğitim',         rgb:'201,162,39'  },
      { id:'lonca_sistemi',   icon:'🤝', svgIcon:'users',     label:'Loncalar',       rgb:'76,154,107'  },
      { id:'daily',           icon:'📅', svgIcon:'tasks',     label:'Görevler',       rgb:'201,162,39'  },
      { id:'alet_atolyesi',   icon:'⚒️', svgIcon:'factory',   label:'Alet Atölyesi',  rgb:'200,155,60'  },
      { id:'gunluk_pazar',    icon:'🛍️', svgIcon:'money',     label:'Günlük Pazar',   rgb:'76,154,107'  },
      { id:'auction',         icon:'🏺', svgIcon:'money',     label:'Artırma Evi',    rgb:'201,162,39'  },
      { id:'kervan',          icon:'🐪', svgIcon:'truck',     label:'Kervanlar',      rgb:'201,162,39'  },
      { id:'kervan_koruma',   icon:'🛡️', svgIcon:'shield',    label:'Kervan Koruma',  rgb:'201,162,39'  },
      { id:'lonca_anlasma',   icon:'📜', svgIcon:'briefcase', label:'Lonca Anlaşması',rgb:'201,162,39'  },
      { id:'zanaat',          icon:'⚒️', svgIcon:'factory',   label:'Zanaat',         rgb:'76,154,107'  },
    ],
  },
  {
    id:'savas', icon:'⚔️', svgIcon:'sword', label:'Savaş', rgb:'194,75,67',
    items:[
      { id:'army',             icon:'⚔️', svgIcon:'sword',   label:'Ordu',          rgb:'194,75,67'  },
      { id:'ottoman_ordu',     icon:'🪖', svgIcon:'shield',  label:'Osmanlı Ordusu',rgb:'194,75,67'  },
      { id:'pvp',              icon:'🥊', svgIcon:'weapon',  label:'Dövüş',         rgb:'194,75,67'  },
      { id:'guc_puani',        icon:'⚡', svgIcon:'sword',   label:'Güç Puanı',     rgb:'194,75,67'  },
      { id:'tournament',       icon:'🎯', svgIcon:'trophy',  label:'Turnuva',       rgb:'194,75,67'  },
      { id:'crisis',           icon:'🚨', svgIcon:'shield',  label:'Kriz',          rgb:'194,75,67'  },
      { id:'army_system',      icon:'🪖', svgIcon:'shield',  label:'Seraskerlik',   rgb:'194,75,67'  },
      { id:'casus',            icon:'🕵️', svgIcon:'shield',  label:'Casusluk',      rgb:'194,75,67'  },
      { id:'casus_chain',      icon:'🔗', svgIcon:'shield',  label:'Casus Zinciri', rgb:'194,75,67'  },
      { id:'crime',            icon:'⚖️', svgIcon:'law',     label:'Mahkeme',       rgb:'194,75,67'  },
    ],
  },
  {
    id:'devlet', icon:'🏛️', svgIcon:'government', label:'Devlet', rgb:'201,162,39',
    items:[
      { id:'politics',        icon:'⚜️', svgIcon:'government', label:'Beylikler',  rgb:'201,162,39' },
      { id:'yetkilerim',      icon:'⭐', svgIcon:'crown',       label:'Yetkilerim', rgb:'201,162,39' },
      { id:'election_events', icon:'🚨', svgIcon:'vote',        label:'Olaylar',    rgb:'194,75,67'  },
      { id:'teamwar',         icon:'⚔️', svgIcon:'sword',       label:'Savaş',      rgb:'194,75,67'  },
      { id:'citygov',         icon:'🏙️', svgIcon:'government',  label:'Yönetim',    rgb:'136,147,161'},
      { id:'taxgov',          icon:'🏦', svgIcon:'bank',        label:'Hazine',     rgb:'201,162,39' },
      { id:'citybuild',       icon:'🏗️', svgIcon:'factory',     label:'İnşaat',     rgb:'201,162,39' },
      { id:'map',             icon:'🗺️', svgIcon:'map',         label:'Harita',     rgb:'76,154,107' },
      { id:'alliance',        icon:'🤝', svgIcon:'users',       label:'İttifak',    rgb:'201,162,39' },
      { id:'sefer',           icon:'⚔️', svgIcon:'sword',       label:'Seferler',     rgb:'194,75,67'  },
      { id:'bolge_savasi',    icon:'🗺️', svgIcon:'map',         label:'Bölge Savaşı', rgb:'194,75,67'  },
      { id:'kale_kusatma',    icon:'🏰', svgIcon:'shield',      label:'Kale Kuşatma', rgb:'194,75,67'  },
      { id:'duel_meydani',    icon:'🥊', svgIcon:'sword',       label:'Düello',       rgb:'194,75,67'  },
      { id:'suikast',         icon:'💀', svgIcon:'sword',       label:'Suikast',      rgb:'194,75,67'  },
      { id:'savas_kayit',     icon:'📋', svgIcon:'trophy',      label:'Savaş Sicili', rgb:'194,75,67'  },
      { id:'beylik_savasi',   icon:'⚜️', svgIcon:'crown',       label:'Beylik Savaşı',rgb:'194,75,67'  },
      { id:'lonca_turnuva',   icon:'🏆', svgIcon:'trophy',      label:'Turnuva',      rgb:'201,162,39' },
      { id:'world',           icon:'🌍', svgIcon:'map',         label:'Dünya',      rgb:'201,162,39' },
      { id:'npcplayers',      icon:'🤖', svgIcon:'user',        label:'NPC',        rgb:'136,147,161'},
      { id:'eyalet_harita',   icon:'🗺️', svgIcon:'map',         label:'Eyaletler',  rgb:'201,162,39' },
      { id:'valilik',         icon:'👑', svgIcon:'crown',       label:'Valilik Yönetim', rgb:'201,162,39' },
      { id:'saray',           icon:'🏰', svgIcon:'government',  label:'Saray',      rgb:'201,162,39' },
      { id:'adalet',          icon:'⚖️', svgIcon:'law',         label:'Adalet',     rgb:'194,75,67'  },
      { id:'lonca',           icon:'⚒️', svgIcon:'briefcase',   label:'Loncalar',   rgb:'201,162,39' },
      { id:'tenders',         icon:'🏗️', svgIcon:'briefcase',   label:'İhaleler',   rgb:'201,162,39' },
      { id:'wiki',            icon:'📚', svgIcon:'education',   label:'Wiki',       rgb:'201,162,39' },
    ],
  },
  {
    id:'sosyal', icon:'👥', svgIcon:'users', label:'Sosyal', rgb:'136,147,161',
    items:[
      { id:'envanter',     icon:'📦', svgIcon:'briefcase', label:'Envanter',     rgb:'201,162,39'  },
      { id:'chat',         icon:'💬', svgIcon:'chat',      label:'Sohbet',       rgb:'136,147,161' },
      { id:'klanchat',     icon:'🔒', svgIcon:'shield',    label:'Klan',         rgb:'136,147,161' },
      { id:'dm',           icon:'📬', svgIcon:'chat',      label:'Mesaj',        rgb:'201,162,39'  },
      { id:'players',      icon:'👥', svgIcon:'users',     label:'Oyuncular',    rgb:'201,162,39'  },
      { id:'social',       icon:'📱', svgIcon:'users',     label:'Sosyal',       rgb:'136,147,161' },
      { id:'newspaper',    icon:'📰', svgIcon:'newspaper', label:'Gazete',       rgb:'201,162,39'  },
      { id:'football',     icon:'⚽', svgIcon:'trophy',    label:'Futbol',       rgb:'76,154,107'  },
      { id:'duyuru_panosu',icon:'📣', svgIcon:'chat',      label:'İlan Panosu',  rgb:'201,162,39'  },
      { id:'saray_intrigi',icon:'🎴', svgIcon:'crown',     label:'Saray İntrigi',rgb:'201,162,39'  },
      { id:'casino',       icon:'🎰', svgIcon:'crown',     label:'Kumarhane',    rgb:'201,162,39'  },
      { id:'duyurular',    icon:'📣', svgIcon:'newspaper', label:'Duyurular',    rgb:'201,162,39'  },
      { id:'leaderboard',  icon:'🏆', svgIcon:'trophy',    label:'Sıralama',     rgb:'201,162,39'  },
      { id:'achievements', icon:'🎖️', svgIcon:'crown',    label:'Başarılar',    rgb:'201,162,39'  },
      { id:'sezon',        icon:'🏅', svgIcon:'trophy',    label:'Sezon',        rgb:'201,162,39'  },
      { id:'karakter_koken',icon:'🧬',svgIcon:'user',      label:'Köken',        rgb:'136,147,161' },
      { id:'pazar_etkinlik',icon:'🎪',svgIcon:'money',     label:'Pazar Etk.',   rgb:'76,154,107'  },
      { id:'meyhane',      icon:'🍺', svgIcon:'users',     label:'Meyhane',      rgb:'136,147,161' },
      { id:'mektup',       icon:'📜', svgIcon:'chat',      label:'Mektuplar',    rgb:'201,162,39'  },
      { id:'itibar',       icon:'⭐', svgIcon:'crown',     label:'İtibar',       rgb:'201,162,39'  },
      { id:'fal_carki',       icon:'🎡', svgIcon:'trophy',    label:'Fal Çarkı',       rgb:'167,139,250' },
      { id:'gunluk_gorev',    icon:'📋', svgIcon:'tasks',     label:'Günlük Görev',    rgb:'201,162,39'  },
      { id:'hizli_merkez',    icon:'⚡', svgIcon:'money',     label:'Hızlı Merkez',    rgb:'201,162,39'  },
      { id:'rozet_koleksiyon',icon:'🏅', svgIcon:'trophy',    label:'Rozetler',         rgb:'201,162,39'  },
      { id:'unvan_sistemi',   icon:'🎖️', svgIcon:'crown',    label:'Unvanlar',         rgb:'201,162,39'  },
      { id:'arkadas_listesi', icon:'👫', svgIcon:'users',     label:'Arkadaşlar',       rgb:'136,147,161' },
      { id:'grup_mesaj',      icon:'💬', svgIcon:'chat',      label:'Grup Sohbet',      rgb:'136,147,161' },
      { id:'oyuncu_arama',    icon:'🔍', svgIcon:'users',     label:'Oyuncu Ara',       rgb:'136,147,161' },
      { id:'bildirim_gecmisi',icon:'🔔', svgIcon:'chat',      label:'Bildirimler',      rgb:'201,162,39'  },
      { id:'profil_kart',     icon:'📸', svgIcon:'user',      label:'Profil Kartı',     rgb:'201,162,39'  },
      { id:'macera_gunlugu',  icon:'📖', svgIcon:'education', label:'Macera Günlüğü',   rgb:'201,162,39'  },
      { id:'osmanli_gunu',    icon:'🕌', svgIcon:'education', label:'Osmanlı Günü',     rgb:'201,162,39'  },
    ],
  },
  {
    id:'kesfet', icon:'🧭', svgIcon:'map', label:'Keşfet', rgb:'76,154,107',
    items:[
      { id:'yetenek_agaci',   icon:'🌳', svgIcon:'education', label:'Yetenek Ağacı',   rgb:'76,154,107'  },
      { id:'etkinlik_takvimi',icon:'📅', svgIcon:'tasks',     label:'Etkinlik Takvimi',rgb:'201,162,39'  },
      { id:'ferman',          icon:'📜', svgIcon:'law',       label:'Ferman Divanı',   rgb:'201,162,39'  },
      { id:'fiyat_grafik',    icon:'📊', svgIcon:'money',     label:'Pazar Grafiği',   rgb:'76,154,107'  },
    ],
  },
];

// Devlet grubuna Ruzname ekle
NAV_GROUPS.find(g => g.id === 'devlet')?.items?.push(
  { id:'ruzname', icon:'📆', svgIcon:'tasks', label:'Ruzname', rgb:'201,162,39' }
);

const NAV_GROUP_TKEYS = { home:'home', ekonomi:'economy', savas:'battle', devlet:'state', sosyal:'social' };
const NAV_ITEMS = NAV_GROUPS.flatMap(g => g.direct ? [{ id:g.id, icon:g.icon, label:g.label, rgb:g.rgb }] : (g.items||[]));
window.NAV_ITEMS = NAV_ITEMS;

// ── Design tokens (namespaced to avoid global clashes) ──
const BN_DS = {
  bg:      'rgba(11, 15, 22, 0.97)',
  surface: '#1B212B',
  border:  'rgba(201,162,39,0.18)',
  gold:    '#C9A227',
  muted:   '#6B7687',
  text:    '#EDE7DA',
  navH:    68,
  radius:  22,
};

function getActiveGroup(page) {
  if (page === 'home') return 'home';
  for (const g of NAV_GROUPS) {
    if (g.direct) continue;
    if (g.items && g.items.some(i => i.id === page)) return g.id;
  }
  return null;
}

function BottomNav({ page, onChange, items, notifMap }) {
  notifMap = notifMap || {};
  const T = useT();
  const [openGroup, setOpenGroup] = React.useState(null);
  const activeGroup = getActiveGroup(page);

  const allGroupIds = new Set(NAV_GROUPS.flatMap(g => g.direct ? [g.id] : (g.items||[]).map(i=>i.id)));
  const extraItems  = (items||[]).filter(i => !allGroupIds.has(i.id));
  const extraGroups = extraItems.map(i => ({ ...i, direct:true }));
  const allGroups   = [...NAV_GROUPS, ...extraGroups];

  const handleTabClick = (group) => {
    if (group.direct) { setOpenGroup(null); onChange(group.id); return; }
    setOpenGroup(prev => prev === group.id ? null : group.id);
  };

  const handleItemClick = (itemId) => { setOpenGroup(null); onChange(itemId); };
  const currentGroup = allGroups.find(g => g.id === openGroup);

  return React.createElement(React.Fragment, null,
    // ── Sub-menu panel ──────────────────────────────────
    openGroup && currentGroup && React.createElement(React.Fragment, null,
      // Backdrop
      React.createElement('div', {
        onClick: () => setOpenGroup(null),
        style: { position:'fixed', inset:0, zIndex:890, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }
      }),
      // Panel
      React.createElement('div', {
        style: {
          position:'fixed',
          bottom: BN_DS.navH + 12,
          left:'50%', transform:'translateX(-50%)',
          width:'min(96vw, 500px)',
          zIndex:895,
          background: BN_DS.surface,
          border:`1.5px solid ${BN_DS.border}`,
          borderRadius: 20,
          padding:'16px 14px 14px',
          boxShadow:'0 -12px 48px rgba(0,0,0,0.75), 0 0 0 1px rgba(201,162,39,0.06)',
          maxHeight:'58vh', overflowY:'auto',
        }
      },
        // Panel header
        React.createElement('div', {
          style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, paddingLeft:2 }
        },
          React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:8 } },
            React.createElement('span', { style:{ fontSize:'1.1rem' } }, currentGroup.icon),
            React.createElement('span', { style:{ fontSize:'0.9rem', fontWeight:800, color:BN_DS.text, fontFamily:"'Cinzel',serif", letterSpacing:'0.04em', textTransform:'uppercase' } },
              NAV_GROUP_TKEYS[currentGroup.id] ? T(NAV_GROUP_TKEYS[currentGroup.id]) : currentGroup.label
            )
          ),
          React.createElement('button', {
            onClick: () => setOpenGroup(null),
            style:{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:999, color:BN_DS.muted, fontSize:'0.8rem', cursor:'pointer', padding:'5px 12px', lineHeight:1, fontFamily:"'Inter',sans-serif" }
          }, '✕')
        ),
        // Divider
        React.createElement('div', { style:{ height:1, background:`linear-gradient(90deg,transparent,${BN_DS.border},transparent)`, marginBottom:12 } }),
        // Grid
        React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 } },
          (currentGroup.items||[]).map(it => {
            const active = page === it.id;
            const clr    = `rgb(${it.rgb})`;
            return React.createElement('button', {
              key: it.id,
              onClick: () => handleItemClick(it.id),
              style:{
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6,
                padding:'13px 4px 11px',
                borderRadius:14,
                border:`1.5px solid ${active ? `rgba(${it.rgb},0.45)` : 'rgba(255,255,255,0.07)'}`,
                background: active ? `rgba(${it.rgb},0.13)` : 'rgba(255,255,255,0.03)',
                cursor:'pointer', WebkitTapHighlightColor:'transparent',
                transition:'all 0.12s', position:'relative',
                boxShadow: active ? `0 0 18px rgba(${it.rgb},0.18)` : 'none',
              }
            },
              it.svgIcon
                ? React.createElement(SvgIcon, { name:it.svgIcon, size:22, style:{ filter: active ? `brightness(0) invert(1) sepia(1) saturate(4) hue-rotate(5deg) drop-shadow(0 0 6px rgba(${it.rgb},0.65))` : 'brightness(0) invert(1)', opacity:active?1:0.55, transition:'all 0.15s' } })
                : React.createElement('span', { style:{ fontSize:'1.25rem', lineHeight:1, filter:active?`drop-shadow(0 0 6px rgba(${it.rgb},0.65))`:'none', display:'inline-block', opacity:active?1:0.8 } }, it.icon),
              React.createElement('span', {
                style:{ fontSize:'0.63rem', fontWeight:700, color: active ? clr : BN_DS.muted, textAlign:'center', lineHeight:1.25, letterSpacing:'0.01em', fontFamily:"'Inter',sans-serif" }
              }, it.label),
              notifMap[it.id] > 0 && React.createElement('span', {
                style:{ position:'absolute', top:4, right:6, background:'#EF5350', color:'#fff', fontSize:'0.42rem', fontWeight:900, minWidth:'14px', height:'14px', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px', boxShadow:'0 2px 6px rgba(239,83,80,0.5)' }
              }, notifMap[it.id])
            );
          })
        )
      )
    ),

    // ── Main nav bar ────────────────────────────────────
    React.createElement('div', {
      style:{
        position:'fixed', bottom:0, left:0, right:0, zIndex:900,
        display:'flex', justifyContent:'center',
        padding:'0 8px calc(10px + env(safe-area-inset-bottom,0px)) 8px',
        pointerEvents:'none',
      }
    },
      React.createElement('div', {
        style:{
          display:'flex',
          height: BN_DS.navH,
          maxWidth:520, width:'100%',
          background: BN_DS.bg,
          border:`1.5px solid ${BN_DS.border}`,
          borderRadius: BN_DS.radius,
          boxShadow:'0 -4px 32px rgba(0,0,0,0.65), 0 -1px 0 rgba(201,162,39,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
          backdropFilter:'blur(28px)',
          WebkitBackdropFilter:'blur(28px)',
          padding:'5px 4px',
          gap:2,
          pointerEvents:'auto',
          overflow:'hidden',
        }
      },
        allGroups.map(group => {
          const isActive  = group.direct ? page===group.id : activeGroup===group.id;
          const isOpen    = openGroup===group.id;
          const lit       = isActive || isOpen;
          const hasNotif  = !group.direct && (group.items||[]).some(i => notifMap[i.id] > 0);
          const groupRgb  = group.rgb || '201,162,39';

          return React.createElement('button', {
            key: group.id,
            onClick: () => handleTabClick(group),
            style:{
              flex:1,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3,
              borderRadius: BN_DS.radius - 4,
              border:'none',
              background: lit
                ? `linear-gradient(160deg,rgba(${groupRgb},0.18) 0%,rgba(${groupRgb},0.09) 100%)`
                : 'transparent',
              cursor:'pointer',
              WebkitTapHighlightColor:'transparent',
              position:'relative',
              transition:'background 0.18s',
              padding:'4px 2px',
              outline: lit ? `1px solid rgba(${groupRgb},0.3)` : '1px solid transparent',
              outlineOffset:'-1px',
              minHeight: 'unset',
            }
          },
            // Icon container
            React.createElement('div', {
              style:{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }
            },
              group.svgIcon
                ? React.createElement(SvgIcon, { name:group.svgIcon, size:21, style:{ opacity: lit?1:0.5, filter: lit ? `brightness(0) invert(1) sepia(1) saturate(4) hue-rotate(5deg) drop-shadow(0 0 7px rgba(${groupRgb},0.7))` : 'brightness(0) invert(1)', transition:'opacity 0.18s, filter 0.18s' } })
                : React.createElement('span', { style:{ fontSize:'1.2rem', lineHeight:1, display:'inline-block', opacity: lit?1:0.5, filter: lit?`drop-shadow(0 0 7px rgba(${groupRgb},0.7))`:'none', transition:'opacity 0.18s, filter 0.18s' } }, group.icon),
              hasNotif && React.createElement('span', {
                style:{ position:'absolute', top:0, right:0, width:7, height:7, borderRadius:'50%', background:'#EF5350', border:'1.5px solid rgba(11,15,22,0.97)', boxShadow:'0 0 6px rgba(239,83,80,0.7)' }
              })
            ),
            // Label
            React.createElement('span', {
              style:{
                fontSize:'0.55rem',
                fontWeight: lit ? 800 : 500,
                letterSpacing:'0.01em',
                color: lit ? `rgb(${groupRgb})` : BN_DS.muted,
                transition:'color 0.18s',
                fontFamily:"'Inter',sans-serif",
                whiteSpace:'nowrap',
                lineHeight:1,
              }
            }, NAV_GROUP_TKEYS[group.id] ? T(NAV_GROUP_TKEYS[group.id]) : group.label),
            // Active underline
            lit && React.createElement('div', {
              style:{
                position:'absolute', bottom:4, left:'25%', right:'25%',
                height:2, borderRadius:2,
                background:`linear-gradient(90deg,transparent,rgba(${groupRgb},0.9),transparent)`,
              }
            })
          );
        })
      )
    )
  );
}
