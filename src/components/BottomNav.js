"use strict";
// ═══════════════════════════════════════════════════════
// ALT NAVİGASYON BİLEŞENİ — Design System v10
// Palette: bg=#0A0F17  surface=#152032  gold=#3CC8F0
// Active: gold pill  Inactive: muted #6B7687
// ═══════════════════════════════════════════════════════

const NAV_GROUPS = [
  { id:'home', icon:'🏠', svgIcon:'home', label:'Ana Sayfa', rgb:'60,200,240', direct:true },
  {
    id:'ekonomi', icon:'💰', svgIcon:'money', label:'Ekonomi', rgb:'60,200,240',
    items:[
      { id:'jobs',            icon:'💼', svgIcon:'briefcase', label:'İşler',          rgb:'76,154,107'  },
      { id:'kariyer',         icon:'🏗️', svgIcon:'factory',   label:'Kariyer',        rgb:'60,200,240' },
      { id:'economy',         icon:'📊', svgIcon:'chart',     label:'Genel',          rgb:'76,154,107'  },
      { id:'farm',            icon:'🌾', svgIcon:'farm',      label:'Tarım',          rgb:'76,154,107'  },
      { id:'livestock',       icon:'🐄', svgIcon:'truck',     label:'Hayvancılık',    rgb:'76,154,107'  },
      { id:'market',          icon:'🛒', svgIcon:'money',     label:'Market',         rgb:'60,200,240'  },
      { id:'holdings',        icon:'🏢', svgIcon:'briefcase', label:'Şirketler',      rgb:'60,200,240'  },
      { id:'economic_empire', icon:'🏢', svgIcon:'chart',     label:'Holding',        rgb:'76,154,107'  },
      { id:'factory',         icon:'🏭', svgIcon:'factory',   label:'Atölye',        rgb:'60,200,240'  },
      { id:'mining',          icon:'⛏️', svgIcon:'mining',    label:'Maden',          rgb:'136,147,161' },
      { id:'education',       icon:'🎓', svgIcon:'education', label:'Eğitim',         rgb:'60,200,240'  },
      { id:'lonca_sistemi',   icon:'🤝', svgIcon:'users',     label:'Sendikalar',       rgb:'76,154,107'  },
      { id:'daily',           icon:'📅', svgIcon:'tasks',     label:'Görevler',       rgb:'60,200,240'  },
      { id:'gunluk_pazar',    icon:'🛍️', svgIcon:'money',     label:'Günlük Pazar',   rgb:'76,154,107'  },
      { id:'auction',         icon:'🏺', svgIcon:'money',     label:'Artırma Evi',    rgb:'60,200,240'  },
      { id:'kervan',          icon:'🐪', svgIcon:'truck',     label:'Konvoylar',      rgb:'60,200,240'  },
      { id:'kervan_koruma',   icon:'🛡️', svgIcon:'shield',    label:'Konvoy Koruma',  rgb:'60,200,240'  },
      { id:'lonca_anlasma',   icon:'📜', svgIcon:'briefcase', label:'Sendika Anlaşması',rgb:'60,200,240'  },
      { id:'zanaat',          icon:'⚒️', svgIcon:'factory',   label:'Zanaat',         rgb:'76,154,107'  },
    ],
  },
  {
    id:'savas', icon:'⚔️', svgIcon:'tank', label:'Savaş', rgb:'229,72,77',
    items:[
      { id:'ordu',             icon:'🪖', svgIcon:'tank',    label:'Silahlı Kuvvetler', rgb:'229,72,77' },
      { id:'army',             icon:'⚔️', svgIcon:'soldier', label:'Kişisel Birlik', rgb:'194,75,67'  },
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
    id:'devlet', icon:'🏛️', svgIcon:'government', label:'Devlet', rgb:'60,200,240',
    items:[
      { id:'politics',        icon:'🏛️', svgIcon:'government', label:'Devletler',  rgb:'60,200,240' },
      { id:'yetkilerim',      icon:'⭐', svgIcon:'crown',       label:'Yetkilerim', rgb:'60,200,240' },
      { id:'election_events', icon:'🚨', svgIcon:'vote',        label:'Olaylar',    rgb:'194,75,67'  },
      { id:'teamwar',         icon:'⚔️', svgIcon:'sword',       label:'Savaş',      rgb:'194,75,67'  },
      { id:'citygov',         icon:'🏙️', svgIcon:'government',  label:'Yönetim',    rgb:'136,147,161'},
      { id:'taxgov',          icon:'🏦', svgIcon:'bank',        label:'Hazine',     rgb:'60,200,240' },
      { id:'citybuild',       icon:'🏗️', svgIcon:'factory',     label:'İnşaat',     rgb:'60,200,240' },
      { id:'map',             icon:'🗺️', svgIcon:'map',         label:'Harita',     rgb:'76,154,107' },
      { id:'alliance',        icon:'🤝', svgIcon:'users',       label:'İttifak',    rgb:'60,200,240' },
      { id:'sefer',           icon:'⚔️', svgIcon:'missile',     label:'Harekâtlar',     rgb:'194,75,67'  },
      { id:'bolge_savasi',    icon:'🗺️', svgIcon:'target',      label:'Bölge Savaşı', rgb:'194,75,67'  },
      { id:'kale_kusatma',    icon:'🏰', svgIcon:'shield',      label:'Kale Kuşatma', rgb:'194,75,67'  },
      { id:'duel_meydani',    icon:'🥊', svgIcon:'sword',       label:'Düello',       rgb:'194,75,67'  },
      { id:'suikast',         icon:'💀', svgIcon:'sword',       label:'Suikast',      rgb:'194,75,67'  },
      { id:'savas_kayit',     icon:'📋', svgIcon:'trophy',      label:'Savaş Sicili', rgb:'194,75,67'  },
      { id:'beylik_savasi',   icon:'🏛️', svgIcon:'crown',       label:'Devlet Savaşı',rgb:'194,75,67'  },
      { id:'lonca_turnuva',   icon:'🏆', svgIcon:'trophy',      label:'Turnuva',      rgb:'60,200,240' },
      { id:'npcplayers',      icon:'🤖', svgIcon:'user',        label:'NPC',        rgb:'136,147,161'},
      { id:'valilik',         icon:'👑', svgIcon:'crown',       label:'Valilik', rgb:'60,200,240' },
      { id:'saray',           icon:'🏰', svgIcon:'government',  label:'Külliye',      rgb:'60,200,240' },
      { id:'adalet',          icon:'⚖️', svgIcon:'law',         label:'Adalet',     rgb:'194,75,67'  },
      { id:'lonca',           icon:'⚒️', svgIcon:'briefcase',   label:'Sendikalar',   rgb:'60,200,240' },
      { id:'tenders',         icon:'🏗️', svgIcon:'briefcase',   label:'İhaleler',   rgb:'60,200,240' },
      { id:'wiki',            icon:'📚', svgIcon:'education',   label:'Wiki',       rgb:'60,200,240' },
      { id:'party_center',    icon:'🏛️', svgIcon:'scroll',      label:'Parti',       rgb:'60,200,240' },
    ],
  },
  {
    id:'sosyal', icon:'👥', svgIcon:'users', label:'Sosyal', rgb:'136,147,161',
    items:[
      { id:'envanter',     icon:'📦', svgIcon:'briefcase', label:'Envanter',     rgb:'60,200,240'  },
      { id:'chat',         icon:'💬', svgIcon:'chat',      label:'Sohbet',       rgb:'136,147,161' },
      { id:'klanchat',     icon:'🔒', svgIcon:'shield',    label:'Klan',         rgb:'136,147,161' },
      { id:'dm',           icon:'📬', svgIcon:'chat',      label:'Mesaj',        rgb:'60,200,240'  },
      { id:'players',      icon:'👥', svgIcon:'users',     label:'Oyuncular',    rgb:'60,200,240'  },
      { id:'social',       icon:'📱', svgIcon:'users',     label:'Sosyal',       rgb:'136,147,161' },
      { id:'newspaper',    icon:'📰', svgIcon:'newspaper', label:'Gazete',       rgb:'60,200,240'  },
      { id:'football',     icon:'⚽', svgIcon:'trophy',    label:'Futbol',       rgb:'76,154,107'  },
      { id:'duyuru_panosu',icon:'📣', svgIcon:'chat',      label:'İlan Panosu',  rgb:'60,200,240'  },
      { id:'saray_intrigi',icon:'🎴', svgIcon:'crown',     label:'Siyasi Kulis',rgb:'60,200,240'  },
      { id:'casino',       icon:'🎰', svgIcon:'crown',     label:'Kumarhane',    rgb:'60,200,240'  },
      { id:'duyurular',    icon:'📣', svgIcon:'newspaper', label:'Duyurular',    rgb:'60,200,240'  },
      { id:'leaderboard',  icon:'🏆', svgIcon:'medal-tiers', label:'Sıralama',   rgb:'60,200,240'  },
      { id:'achievements', icon:'🎖️', svgIcon:'crown',    label:'Başarılar',    rgb:'60,200,240'  },
      { id:'sezon',        icon:'🏅', svgIcon:'trophy',    label:'Sezon',        rgb:'60,200,240'  },
      { id:'karakter_koken',icon:'🧬',svgIcon:'user',      label:'Köken',        rgb:'136,147,161' },
      { id:'pazar_etkinlik',icon:'🎪',svgIcon:'money',     label:'Pazar Etk.',   rgb:'76,154,107'  },
      { id:'meyhane',      icon:'🍺', svgIcon:'users',     label:'Meyhane',      rgb:'136,147,161' },
      { id:'mektup',       icon:'📜', svgIcon:'chat',      label:'Mektuplar',    rgb:'60,200,240'  },
      { id:'itibar',       icon:'⭐', svgIcon:'crown',     label:'İtibar',       rgb:'60,200,240'  },
      { id:'fal_carki',       icon:'🎡', svgIcon:'trophy',    label:'Fal Çarkı',       rgb:'167,139,250' },
      { id:'gunluk_gorev',    icon:'📋', svgIcon:'tasks',     label:'Günlük Görev',    rgb:'60,200,240'  },
      { id:'hizli_merkez',    icon:'⚡', svgIcon:'money',     label:'Hızlı Merkez',    rgb:'60,200,240'  },
      { id:'rozet_koleksiyon',icon:'🏅', svgIcon:'trophy',    label:'Rozetler',         rgb:'60,200,240'  },
      { id:'unvan_sistemi',   icon:'🎖️', svgIcon:'crown',    label:'Unvanlar',         rgb:'60,200,240'  },
      { id:'arkadas_listesi', icon:'👫', svgIcon:'users',     label:'Arkadaşlar',       rgb:'136,147,161' },
      { id:'grup_mesaj',      icon:'💬', svgIcon:'chat',      label:'Grup Sohbet',      rgb:'136,147,161' },
      { id:'oyuncu_arama',    icon:'🔍', svgIcon:'users',     label:'Oyuncu Ara',       rgb:'136,147,161' },
      { id:'bildirim_gecmisi',icon:'🔔', svgIcon:'chat',      label:'Bildirimler',      rgb:'60,200,240'  },
      { id:'profil_kart',     icon:'📸', svgIcon:'user',      label:'Profil Kartı',     rgb:'60,200,240'  },
      { id:'macera_gunlugu',  icon:'📖', svgIcon:'education', label:'Macera Günlüğü',   rgb:'60,200,240'  },
    ],
  },
  {
    id:'kesfet', icon:'🧭', svgIcon:'globe', label:'Keşfet', rgb:'76,154,107',
    items:[
      { id:'world',           icon:'🌍', svgIcon:'globe',     label:'Dünya Haritası',  rgb:'60,200,240'  },
      { id:'yetenek_agaci',   icon:'🌳', svgIcon:'education', label:'Yetenek Ağacı',   rgb:'76,154,107'  },
      { id:'etkinlik_takvimi',icon:'📅', svgIcon:'tasks',     label:'Etkinlik Takvimi',rgb:'60,200,240'  },
      { id:'ferman',          icon:'📜', svgIcon:'law',       label:'Kararname Kabinesi',   rgb:'60,200,240'  },
      { id:'fiyat_grafik',    icon:'📊', svgIcon:'money',     label:'Pazar Grafiği',   rgb:'76,154,107'  },
    ],
  },
];

// Devlet grubuna Ruzname ekle
NAV_GROUPS.find(g => g.id === 'devlet')?.items?.push(
  { id:'ruzname',    icon:'📆', svgIcon:'tasks',  label:'Gündem',       rgb:'60,200,240' },
  { id:'padisahlik', icon:'👑', svgIcon:'throne', label:'Cumhurbaşkanlığı',    rgb:'60,200,240' }
);

const NAV_GROUP_TKEYS = { home:'home', ekonomi:'economy', savas:'battle', devlet:'state', sosyal:'social' };
const NAV_ITEMS = NAV_GROUPS.flatMap(g => g.direct ? [{ id:g.id, icon:g.icon, label:g.label, rgb:g.rgb }] : (g.items||[]));
window.NAV_ITEMS = NAV_ITEMS;

// ── Design tokens (namespaced to avoid global clashes) ──
const BN_DS = {
  bg:      'rgba(11, 15, 22, 0.97)',
  surface: '#152032',
  border:  'rgba(60,200,240,0.18)',
  gold:    '#3CC8F0',
  muted:   '#6B7687',
  text:    '#E6EDF5',
  navH:    68,
  radius:  22,
};

// İkon dosyası tanımlı değilse emoji göster (kırık resim yerine)
const _bnHasIcon = (name) => !!name && typeof window.hasIcon === 'function' && window.hasIcon(name);

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

  // Mobil: klavye açıkken (bir yazı alanı odaktayken) alt menüyü gizle — menü klavyenin
  // üstüne yapışıp sohbet/arama kutularını kapatıyordu
  const [kbOpen, setKbOpen] = React.useState(false);
  React.useEffect(() => {
    let coarse = false;
    try { coarse = window.matchMedia('(pointer: coarse)').matches; } catch (e) {}
    if (!coarse) return;
    const isField = (el) => !!el && (el.tagName === 'TEXTAREA' || el.isContentEditable ||
      (el.tagName === 'INPUT' && !/^(checkbox|radio|range|button|submit|reset|file|color|image)$/i.test(el.type || '')));
    let t = 0;
    const onIn  = (e) => { if (isField(e.target)) { clearTimeout(t); setKbOpen(true); } };
    const onOut = (e) => { if (isField(e.target)) { clearTimeout(t); t = setTimeout(() => setKbOpen(false), 150); } };
    document.addEventListener('focusin', onIn);
    document.addEventListener('focusout', onOut);
    return () => { clearTimeout(t); document.removeEventListener('focusin', onIn); document.removeEventListener('focusout', onOut); };
  }, []);
  React.useEffect(() => { try { window.dispatchEvent(new Event('us-nav-visibility')); } catch (e) {} }, [kbOpen]);

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
    !kbOpen && openGroup && currentGroup && React.createElement(React.Fragment, null,
      // Backdrop
      React.createElement('div', {
        onClick: () => setOpenGroup(null),
        style: { position:'fixed', inset:0, zIndex:890, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }
      }),
      // Panel
      React.createElement('div', {
        style: {
          position:'fixed',
          bottom:`calc(${BN_DS.navH + 14}px + env(safe-area-inset-bottom, 0px))`,
          left:8, right:8, margin:'0 auto',
          maxWidth:500,
          zIndex:895,
          background: BN_DS.surface,
          border:`1.5px solid ${BN_DS.border}`,
          borderRadius: 20,
          padding:'16px 14px 14px',
          boxShadow:'0 -12px 48px rgba(0,0,0,0.75), 0 0 0 1px rgba(60,200,240,0.06)',
          maxHeight:'min(60vh, calc(100% - 200px))', overflowY:'auto', overscrollBehavior:'contain', WebkitOverflowScrolling:'touch',
        }
      },
        // Panel header
        React.createElement('div', {
          style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, paddingLeft:2 }
        },
          React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:8 } },
            React.createElement('span', { style:{ fontSize:'1.1rem' } }, currentGroup.icon),
            React.createElement('span', { style:{ fontSize:'0.9rem', fontWeight:800, color:BN_DS.text, fontFamily:"'Rajdhani',sans-serif", letterSpacing:'0.04em', textTransform:'uppercase' } },
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
              _bnHasIcon(it.svgIcon)
                ? React.createElement(SvgIcon, { name:it.svgIcon, size:26, style:{ color: active ? clr : '#A9B6C6', filter: active ? `drop-shadow(0 0 5px rgba(${it.rgb},0.7))` : 'none', transition:'all 0.15s' } })
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
      className:'us-bottomnav',
      style:{
        position:'fixed', bottom:0, left:0, right:0, zIndex:900,
        display: kbOpen ? 'none' : 'flex', justifyContent:'center',
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
          boxShadow:'0 -4px 32px rgba(0,0,0,0.65), 0 -1px 0 rgba(60,200,240,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
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
          const groupRgb  = group.rgb || '60,200,240';

          return React.createElement('button', {
            key: group.id,
            'data-nav': group.id,
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
              _bnHasIcon(group.svgIcon)
                ? React.createElement(SvgIcon, { name:group.svgIcon, size:24, style:{ color: lit ? `rgb(${groupRgb})` : BN_DS.muted, filter: lit ? `drop-shadow(0 0 6px rgba(${groupRgb},0.75))` : 'none', transition:'color 0.18s, filter 0.18s, transform 0.18s', transform: lit ? 'translateY(-1px) scale(1.06)' : 'none' } })
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
