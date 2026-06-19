"use strict";
// ═══════════════════════════════════════════════════════
// ALT NAVİGASYON BİLEŞENİ — Design System v9
// Active state: gold (#C9A227) underline + label — unified across all groups
// ═══════════════════════════════════════════════════════
const { useState: useStateNav } = React;

const NAV_GROUPS = [
  { id:'home', icon:'🏠', label:'Ana Sayfa', rgb:'201,162,39', direct:true },
  {
    id:'ekonomi', icon:'💰', svgIcon:'money', label:'Ekonomi', rgb:'201,162,39',
    items:[
      { id:'jobs',            icon:'💼', svgIcon:'briefcase', label:'İşler',          rgb:'76,154,107'  },
      { id:'kariyer',         icon:'🏗️',                      label:'Kariyer Çalışma', rgb:'201,162,39' },
      { id:'economy',         icon:'📊', svgIcon:'chart',     label:'Genel',          rgb:'76,154,107'  },
      { id:'farm',            icon:'🌾',                      label:'Tarım',          rgb:'76,154,107'  },
      { id:'livestock',       icon:'🐄',                      label:'Hayvancılık',    rgb:'76,154,107'  },
      { id:'market',          icon:'🛒',                      label:'Market',         rgb:'201,162,39'  },
      { id:'holdings',        icon:'🏢',                      label:'Şirketler',      rgb:'201,162,39'  },
      { id:'economic_empire', icon:'🏢',                      label:'İmparatorluk',   rgb:'76,154,107'  },
      { id:'factory',         icon:'🏭', svgIcon:'factory',   label:'Fabrika',        rgb:'201,162,39'  },
      { id:'mining',          icon:'⛏️',                     label:'Maden',          rgb:'136,147,161' },
      { id:'education',       icon:'🎓', svgIcon:'education', label:'Eğitim',         rgb:'96,165,250'  },
      { id:'unions',          icon:'🏭',                      label:'Sendikalar',     rgb:'76,154,107'  },
      { id:'daily',           icon:'📅',                      label:'Görevler',       rgb:'201,162,39'  },
    ],
  },
  {
    id:'savas', icon:'⚔️', label:'Savaş', rgb:'194,75,67',
    items:[
      { id:'army',             icon:'⚔️',                   label:'Ordu',        rgb:'194,75,67'  },
      { id:'pvp',              icon:'🥊',                   label:'Dövüş',       rgb:'194,75,67'  },
      { id:'gang',             icon:'🔫', svgIcon:'weapon', label:'Çete',        rgb:'194,75,67'  },
      { id:'family',           icon:'👨‍👩‍👧‍👦',                  label:'Aile',        rgb:'201,162,39' },
      { id:'tournament',       icon:'🎯',                   label:'Turnuva',     rgb:'194,75,67'  },
      { id:'crisis',           icon:'🚨',                   label:'Kriz',        rgb:'194,75,67'  },
      { id:'army_system',      icon:'🪖',                   label:'Genelkurmay', rgb:'194,75,67'  },
      { id:'independent_army', icon:'🪖',                   label:'Ordu Sistemi',rgb:'194,75,67'  },
      { id:'protection_deals', icon:'🛡️',                   label:'Koruma',      rgb:'194,75,67'  },
      { id:'gang_treasury',    icon:'💰',                   label:'Çete Kasası', rgb:'194,75,67'  },
      { id:'crime',            icon:'⚖️', svgIcon:'law',   label:'Mahkeme',     rgb:'194,75,67'  },
    ],
  },
  {
    id:'devlet', icon:'🏛️', svgIcon:'government', label:'Devlet', rgb:'201,162,39',
    items:[
      { id:'politics',        icon:'🏛️', svgIcon:'government', label:'Siyaset',    rgb:'201,162,39' },
      { id:'yetkilerim',      icon:'⭐',                        label:'Yetkilerim', rgb:'201,162,39' },
      { id:'election_events', icon:'🚨',                        label:'Olaylar',    rgb:'194,75,67'  },
      { id:'teamwar',         icon:'⚔️',                       label:'Savaş',      rgb:'194,75,67'  },
      { id:'citygov',         icon:'🏙️',                       label:'Yönetim',    rgb:'136,147,161'},
      { id:'taxgov',          icon:'🏦', svgIcon:'bank',        label:'Belediye',   rgb:'201,162,39' },
      { id:'citybuild',       icon:'🏗️',                       label:'İnşaat',     rgb:'201,162,39' },
      { id:'map',             icon:'🗺️', svgIcon:'map',         label:'Harita',     rgb:'76,154,107' },
      { id:'alliance',        icon:'🤝',                        label:'İttifak',    rgb:'96,165,250' },
      { id:'world',           icon:'🌍',                        label:'Dünya',      rgb:'96,165,250' },
      { id:'npcplayers',      icon:'🤖',                        label:'NPC',        rgb:'136,147,161'},
      { id:'parti_etki',      icon:'⚡',                        label:'Etki Puanı', rgb:'201,162,39' },
      { id:'party_center',    icon:'🏛️',                        label:'Meclis',     rgb:'201,162,39' },
      { id:'power_triangle',  icon:'⚡',                        label:'Güç Üçgeni', rgb:'201,162,39' },
      { id:'tenders',         icon:'🏗️',                        label:'İhaleler',   rgb:'201,162,39' },
      { id:'wiki',            icon:'📚',                        label:'Wiki',       rgb:'96,165,250' },
    ],
  },
  {
    id:'sosyal', icon:'👥', label:'Sosyal', rgb:'136,147,161',
    items:[
      { id:'chat',         icon:'💬', label:'Sohbet',    rgb:'136,147,161' },
      { id:'klanchat',     icon:'🔒', label:'Klan',      rgb:'136,147,161' },
      { id:'dm',           icon:'📬', label:'Mesaj',     rgb:'96,165,250'  },
      { id:'players',      icon:'👥', label:'Oyuncular', rgb:'96,165,250'  },
      { id:'social',       icon:'📱', label:'Sosyal',    rgb:'136,147,161' },
      { id:'newspaper',    icon:'📰', label:'Gazete',    rgb:'96,165,250'  },
      { id:'football',     icon:'⚽', label:'Futbol',    rgb:'76,154,107'  },
      { id:'casino',       icon:'🎰', label:'Kumarhane', rgb:'201,162,39'  },
      { id:'duyurular',    icon:'📣', label:'Duyurular', rgb:'201,162,39'  },
      { id:'leaderboard',  icon:'🏆', label:'Sıralama',  rgb:'201,162,39'  },
      { id:'achievements', icon:'🎖️', label:'Başarılar', rgb:'201,162,39'  },
    ],
  },
];

const NAV_GROUP_TKEYS = { home:'home', ekonomi:'economy', savas:'battle', devlet:'state', sosyal:'social' };
const NAV_ITEMS = NAV_GROUPS.flatMap(g => g.direct ? [{ id:g.id, icon:g.icon, label:g.label, rgb:g.rgb }] : (g.items||[]));
window.NAV_ITEMS = NAV_ITEMS;

function getActiveGroup(page) {
  if (page === 'home') return 'home';
  for (const g of NAV_GROUPS) {
    if (g.direct) continue;
    if (g.items && g.items.some(i => i.id === page)) return g.id;
  }
  return null;
}

function BottomNav({ page, onChange, items, notifMap={} }) {
  const T = useT();
  const [openGroup, setOpenGroup] = useStateNav(null);
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

  const GOLD = '#C9A227';
  const navH = 62;

  return (
    <>
      {/* Sub-menu panel */}
      {openGroup && currentGroup && (
        <>
          <div
            onClick={() => setOpenGroup(null)}
            style={{position:'fixed',inset:0,zIndex:890,background:'rgba(0,0,0,0.55)'}}
          />
          <div style={{
            position:'fixed', bottom:navH,
            left:'50%', transform:'translateX(-50%)',
            width:'min(100vw, 480px)', zIndex:895,
            background:'#1B212B',
            borderTop:`2px solid ${GOLD}`,
            borderRadius:'16px 16px 0 0',
            padding:'14px 12px 10px',
            boxShadow:'0 -8px 40px rgba(0,0,0,0.6)',
            maxHeight:'58vh', overflowY:'auto',
          }}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px',paddingLeft:'2px'}}>
              <span style={{fontSize:'0.92rem',fontWeight:800,color:'#EDE7DA',fontFamily:"'Syne',sans-serif",letterSpacing:'0.04em'}}>
                {currentGroup.icon}&nbsp;{NAV_GROUP_TKEYS[currentGroup.id] ? T(NAV_GROUP_TKEYS[currentGroup.id]) : currentGroup.label}
              </span>
              <button
                onClick={() => setOpenGroup(null)}
                style={{background:'rgba(237,231,218,0.07)',border:'1px solid rgba(237,231,218,0.1)',borderRadius:'8px',color:'#8893A1',fontSize:'0.88rem',cursor:'pointer',padding:'4px 10px',lineHeight:1,fontFamily:"'Inter',sans-serif"}}
              >✕</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px'}}>
              {(currentGroup.items||[]).map(it => {
                const active = page === it.id;
                return (
                  <button key={it.id} onClick={() => handleItemClick(it.id)}
                    style={{
                      display:'flex', flexDirection:'column', alignItems:'center',
                      justifyContent:'center', gap:'5px',
                      padding:'11px 4px', borderRadius:'12px',
                      border:`1px solid ${active ? `rgba(${it.rgb},0.45)` : 'rgba(237,231,218,0.07)'}`,
                      background: active ? `rgba(${it.rgb},0.14)` : 'rgba(237,231,218,0.03)',
                      cursor:'pointer', WebkitTapHighlightColor:'transparent',
                      transition:'all 0.12s', position:'relative',
                    }}
                  >
                    {it.svgIcon
                      ? <SvgIcon name={it.svgIcon} size={24} style={{filter:active?`drop-shadow(0 0 5px rgba(${it.rgb},0.7))`:'none'}} />
                      : <span style={{fontSize:'1.35rem',lineHeight:1,filter:active?`drop-shadow(0 0 5px rgba(${it.rgb},0.7))`:'none'}}>{it.icon}</span>
                    }
                    <span style={{
                      fontSize:'0.57rem', fontWeight:700,
                      color: active ? `rgb(${it.rgb})` : '#8893A1',
                      textAlign:'center', lineHeight:1.2,
                      letterSpacing:'0.01em',
                      fontFamily:"'Inter',sans-serif",
                    }}>
                      {T(NAV_ITEM_TKEYS&&NAV_ITEM_TKEYS[it.id]||it.id) || it.label}
                    </span>
                    {notifMap[it.id] > 0 && (
                      <span style={{position:'absolute',top:3,right:5,background:'#C24B43',color:'#EDE7DA',fontSize:'0.44rem',fontWeight:900,minWidth:'12px',height:'12px',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',padding:'0 2px'}}>
                        {notifMap[it.id]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Main nav bar */}
      <div style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:900,
        background:'#1B212B',
        borderTop:'1px solid rgba(237,231,218,0.08)',
        paddingBottom:'env(safe-area-inset-bottom,0px)',
        boxShadow:'0 -4px 20px rgba(0,0,0,0.5)',
      }}>
        <div style={{display:'flex',height:`${navH}px`,maxWidth:'480px',margin:'0 auto'}}>
          {allGroups.map(group => {
            const isActive = group.direct ? page===group.id : activeGroup===group.id;
            const isOpen   = openGroup===group.id;
            const hasNotif = !group.direct && (group.items||[]).some(i => notifMap[i.id] > 0);
            const lit      = isActive || isOpen;

            return (
              <button key={group.id} onClick={() => handleTabClick(group)}
                style={{
                  flex:1, display:'flex', flexDirection:'column',
                  alignItems:'center', justifyContent:'center', gap:'3px',
                  border:'none',
                  background: isOpen ? 'rgba(201,162,39,0.07)' : 'transparent',
                  cursor:'pointer', WebkitTapHighlightColor:'transparent',
                  position:'relative', transition:'background 0.15s',
                  borderTop: lit ? `2px solid ${GOLD}` : '2px solid transparent',
                }}
              >
                {group.svgIcon
                  ? <SvgIcon name={group.svgIcon} size={21}
                      style={{
                        transform: lit ? 'scale(1.1)' : 'scale(1)',
                        transition: 'transform 0.15s',
                        filter: lit ? `drop-shadow(0 0 5px rgba(201,162,39,0.65))` : 'none',
                      }}
                    />
                  : <span style={{
                      fontSize:'1.22rem', lineHeight:1,
                      transform: lit ? 'scale(1.1)' : 'scale(1)',
                      transition: 'transform 0.15s',
                      filter: lit ? `drop-shadow(0 0 5px rgba(201,162,39,0.65))` : 'none',
                      display:'inline-block',
                    }}>{group.icon}</span>
                }
                <span style={{
                  fontSize:'0.48rem', fontWeight:800,
                  letterSpacing:'0.05em', textTransform:'uppercase',
                  color: lit ? GOLD : '#8893A1',
                  transition:'color 0.15s',
                  fontFamily:"'Inter',sans-serif",
                }}>
                  {NAV_GROUP_TKEYS[group.id] ? T(NAV_GROUP_TKEYS[group.id]) : group.label}
                </span>
                {hasNotif && (
                  <span style={{position:'absolute',top:5,right:'16%',width:'5px',height:'5px',borderRadius:'50%',background:'#C24B43'}} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
