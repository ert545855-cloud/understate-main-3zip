"use strict";
// ═══════════════════════════════════════════════════════
// ALT NAVİGASYON BİLEŞENİ — Design System v9
// Active state: gold (#C9A227) underline + label — unified across all groups
// ═══════════════════════════════════════════════════════
const { useState: useStateNav } = React;

const NAV_GROUPS = [
  { id:'home', icon:'🏠', svgIcon:'home', label:'Ana Sayfa', rgb:'201,162,39', direct:true },
  {
    id:'ekonomi', icon:'💰', svgIcon:'money', label:'Ekonomi', rgb:'201,162,39',
    items:[
      { id:'jobs',            icon:'💼', svgIcon:'briefcase', label:'İşler',          rgb:'76,154,107'  },
      { id:'kariyer',         icon:'🏗️', svgIcon:'factory',   label:'Kariyer Çalışma', rgb:'201,162,39' },
      { id:'economy',         icon:'📊', svgIcon:'chart',     label:'Genel',          rgb:'76,154,107'  },
      { id:'farm',            icon:'🌾', svgIcon:'farm',      label:'Tarım',          rgb:'76,154,107'  },
      { id:'livestock',       icon:'🐄', svgIcon:'truck',     label:'Hayvancılık',    rgb:'76,154,107'  },
      { id:'market',          icon:'🛒', svgIcon:'money',     label:'Market',         rgb:'201,162,39'  },
      { id:'holdings',        icon:'🏢', svgIcon:'briefcase', label:'Şirketler',      rgb:'201,162,39'  },
      { id:'economic_empire', icon:'🏢', svgIcon:'chart',     label:'İmparatorluk',   rgb:'76,154,107'  },
      { id:'factory',         icon:'🏭', svgIcon:'factory',   label:'Fabrika',        rgb:'201,162,39'  },
      { id:'mining',          icon:'⛏️', svgIcon:'mining',    label:'Maden',          rgb:'136,147,161' },
      { id:'education',       icon:'🎓', svgIcon:'education', label:'Eğitim',         rgb:'201,162,39'  },
      { id:'unions',          icon:'🏭', svgIcon:'users',     label:'Sendikalar',     rgb:'76,154,107'  },
      { id:'daily',           icon:'📅', svgIcon:'tasks',     label:'Görevler',       rgb:'201,162,39'  },
    ],
  },
  {
    id:'savas', icon:'⚔️', svgIcon:'sword', label:'Savaş', rgb:'194,75,67',
    items:[
      { id:'army',             icon:'⚔️', svgIcon:'sword',   label:'Ordu',        rgb:'194,75,67'  },
      { id:'pvp',              icon:'🥊', svgIcon:'weapon',  label:'Dövüş',       rgb:'194,75,67'  },
      { id:'gang',             icon:'🔫', svgIcon:'weapon',  label:'Çete',        rgb:'194,75,67'  },
      { id:'family',           icon:'👨‍👩‍👧‍👦', svgIcon:'users',  label:'Aile',        rgb:'201,162,39' },
      { id:'tournament',       icon:'🎯', svgIcon:'trophy',  label:'Turnuva',     rgb:'194,75,67'  },
      { id:'crisis',           icon:'🚨', svgIcon:'shield',  label:'Kriz',        rgb:'194,75,67'  },
      { id:'army_system',      icon:'🪖', svgIcon:'shield',  label:'Genelkurmay', rgb:'194,75,67'  },
      { id:'independent_army', icon:'🪖', svgIcon:'sword',   label:'Ordu Sistemi',rgb:'194,75,67'  },
      { id:'protection_deals', icon:'🛡️', svgIcon:'shield',  label:'Koruma',      rgb:'194,75,67'  },
      { id:'gang_treasury',    icon:'💰', svgIcon:'bank',    label:'Çete Kasası', rgb:'194,75,67'  },
      { id:'crime',            icon:'⚖️', svgIcon:'law',    label:'Mahkeme',     rgb:'194,75,67'  },
    ],
  },
  {
    id:'devlet', icon:'🏛️', svgIcon:'government', label:'Devlet', rgb:'201,162,39',
    items:[
      { id:'politics',        icon:'🏛️', svgIcon:'government', label:'Siyaset',    rgb:'201,162,39' },
      { id:'yetkilerim',      icon:'⭐', svgIcon:'crown',       label:'Yetkilerim', rgb:'201,162,39' },
      { id:'election_events', icon:'🚨', svgIcon:'vote',        label:'Olaylar',    rgb:'194,75,67'  },
      { id:'teamwar',         icon:'⚔️', svgIcon:'sword',       label:'Savaş',      rgb:'194,75,67'  },
      { id:'citygov',         icon:'🏙️', svgIcon:'government',  label:'Yönetim',    rgb:'136,147,161'},
      { id:'police_ministry', icon:'🚔', svgIcon:'government',  label:'Polis',      rgb:'96,165,250' },
      { id:'taxgov',          icon:'🏦', svgIcon:'bank',        label:'Belediye',   rgb:'201,162,39' },
      { id:'citybuild',       icon:'🏗️', svgIcon:'factory',     label:'İnşaat',     rgb:'201,162,39' },
      { id:'map',             icon:'🗺️', svgIcon:'map',         label:'Harita',     rgb:'76,154,107' },
      { id:'alliance',        icon:'🤝', svgIcon:'users',       label:'İttifak',    rgb:'201,162,39' },
      { id:'world',           icon:'🌍', svgIcon:'map',         label:'Dünya',      rgb:'201,162,39' },
      { id:'npcplayers',      icon:'🤖', svgIcon:'user',        label:'NPC',        rgb:'136,147,161'},
      { id:'parti_etki',      icon:'⚡', svgIcon:'vote',        label:'Etki Puanı', rgb:'201,162,39' },
      { id:'party_center',    icon:'🏛️', svgIcon:'government',  label:'Meclis',     rgb:'201,162,39' },
      { id:'power_triangle',  icon:'⚡', svgIcon:'crown',       label:'Güç Üçgeni', rgb:'201,162,39' },
      { id:'tenders',         icon:'🏗️', svgIcon:'briefcase',   label:'İhaleler',   rgb:'201,162,39' },
      { id:'wiki',            icon:'📚', svgIcon:'education',   label:'Wiki',       rgb:'201,162,39' },
    ],
  },
  {
    id:'sosyal', icon:'👥', svgIcon:'users', label:'Sosyal', rgb:'136,147,161',
    items:[
      { id:'chat',         icon:'💬', svgIcon:'chat',      label:'Sohbet',    rgb:'136,147,161' },
      { id:'klanchat',     icon:'🔒', svgIcon:'shield',    label:'Klan',      rgb:'136,147,161' },
      { id:'dm',           icon:'📬', svgIcon:'chat',      label:'Mesaj',     rgb:'201,162,39'  },
      { id:'players',      icon:'👥', svgIcon:'users',     label:'Oyuncular', rgb:'201,162,39'  },
      { id:'social',       icon:'📱', svgIcon:'users',     label:'Sosyal',    rgb:'136,147,161' },
      { id:'newspaper',    icon:'📡', svgIcon:'newspaper', label:'Haber Ajansı', rgb:'201,162,39'  },
      { id:'football',     icon:'⚽', svgIcon:'trophy',    label:'Futbol',    rgb:'76,154,107'  },
      { id:'casino',       icon:'🎰', svgIcon:'crown',     label:'Kumarhane', rgb:'201,162,39'  },
      { id:'duyurular',    icon:'📣', svgIcon:'newspaper', label:'Duyurular', rgb:'201,162,39'  },
      { id:'leaderboard',  icon:'🏆', svgIcon:'trophy',    label:'Sıralama',  rgb:'201,162,39'  },
      { id:'achievements', icon:'🎖️', svgIcon:'crown',    label:'Başarılar', rgb:'201,162,39'  },
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

  const GOLD = '#F0B33E';
  const navH = 70;

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
            position:'fixed', bottom:navH+10,
            left:'50%', transform:'translateX(-50%)',
            width:'min(100vw, 480px)', zIndex:895,
            background:'#16224A',
            border:`1.5px solid ${GOLD}`,
            borderRadius:'22px',
            padding:'14px 12px 12px',
            boxShadow:'0 -8px 40px rgba(3,6,20,0.7)',
            maxHeight:'58vh', overflowY:'auto',
          }}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px',paddingLeft:'2px'}}>
              <span style={{fontSize:'0.92rem',fontWeight:800,color:'#F2F5FA',fontFamily:"'Syne',sans-serif",letterSpacing:'0.02em'}}>
                {currentGroup.icon}&nbsp;{NAV_GROUP_TKEYS[currentGroup.id] ? T(NAV_GROUP_TKEYS[currentGroup.id]) : currentGroup.label}
              </span>
              <button
                onClick={() => setOpenGroup(null)}
                style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.14)',borderRadius:'999px',color:'#8896B8',fontSize:'0.88rem',cursor:'pointer',padding:'4px 10px',lineHeight:1,fontFamily:"'Inter',sans-serif"}}
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
                      padding:'11px 4px', borderRadius:'16px',
                      border:`1px solid ${active ? `rgba(${it.rgb},0.5)` : 'rgba(255,255,255,0.09)'}`,
                      background: active ? `rgba(${it.rgb},0.16)` : 'rgba(255,255,255,0.04)',
                      cursor:'pointer', WebkitTapHighlightColor:'transparent',
                      transition:'all 0.12s', position:'relative',
                    }}
                  >
                    {it.svgIcon
                      ? <SvgIcon name={it.svgIcon} size={24} style={{filter:active?`drop-shadow(0 0 5px rgba(${it.rgb},0.7))`:'none'}} />
                      : <span style={{fontSize:'1.35rem',lineHeight:1,filter:active?`drop-shadow(0 0 5px rgba(${it.rgb},0.7))`:'none'}}>{it.icon}</span>
                    }
                    <span style={{
                      fontSize:'0.68rem', fontWeight:700,
                      color: active ? `rgb(${it.rgb})` : '#8896B8',
                      textAlign:'center', lineHeight:1.2,
                      letterSpacing:'0.01em',
                      fontFamily:"'Inter',sans-serif",
                    }}>
                      {T(NAV_ITEM_TKEYS&&NAV_ITEM_TKEYS[it.id]||it.id) || it.label}
                    </span>
                    {notifMap[it.id] > 0 && (
                      <span style={{position:'absolute',top:3,right:5,background:'#EF5350',color:'#F2F5FA',fontSize:'0.44rem',fontWeight:900,minWidth:'12px',height:'12px',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',padding:'0 2px'}}>
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

      {/* Main nav bar — rounded pill dock (Mayor Simulator style) */}
      <div style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:900,
        display:'flex', justifyContent:'center',
        paddingBottom:'calc(10px + env(safe-area-inset-bottom,0px))',
        pointerEvents:'none',
      }}>
        <div style={{
          display:'flex', gap:'6px',
          height:`${navH}px`, maxWidth:'480px', width:'calc(100% - 16px)',
          margin:'0 8px', padding:'6px',
          background:'#16224A',
          border:'1.5px solid rgba(255,255,255,0.1)',
          borderRadius:'999px',
          boxShadow:'0 -6px 28px rgba(3,6,20,0.6), 0 4px 18px rgba(3,6,20,0.5)',
          pointerEvents:'auto',
        }}>
          {allGroups.map(group => {
            const isActive = group.direct ? page===group.id : activeGroup===group.id;
            const isOpen   = openGroup===group.id;
            const hasNotif = !group.direct && (group.items||[]).some(i => notifMap[i.id] > 0);
            const lit      = isActive || isOpen;

            return (
              <button key={group.id} onClick={() => handleTabClick(group)}
                style={{
                  flex:1, display:'flex', flexDirection:'column',
                  alignItems:'center', justifyContent:'center', gap:'2px',
                  border: lit ? `1.5px solid ${GOLD}` : '1.5px solid transparent',
                  borderRadius:'999px',
                  background: lit ? 'rgba(240,179,62,0.16)' : 'transparent',
                  cursor:'pointer', WebkitTapHighlightColor:'transparent',
                  position:'relative', transition:'all 0.15s',
                }}
              >
                {group.svgIcon
                  ? <SvgIcon name={group.svgIcon} size={20}
                      style={{
                        transform: lit ? 'scale(1.1)' : 'scale(1)',
                        transition: 'transform 0.15s',
                        filter: lit ? `drop-shadow(0 0 5px rgba(240,179,62,0.65))` : 'none',
                      }}
                    />
                  : <span style={{
                      fontSize:'1.15rem', lineHeight:1,
                      transform: lit ? 'scale(1.1)' : 'scale(1)',
                      transition: 'transform 0.15s',
                      filter: lit ? `drop-shadow(0 0 5px rgba(240,179,62,0.65))` : 'none',
                      display:'inline-block',
                    }}>{group.icon}</span>
                }
                <span style={{
                  fontSize:'0.56rem', fontWeight:800,
                  letterSpacing:'0.01em', textTransform:'none',
                  color: lit ? GOLD : '#8896B8',
                  transition:'color 0.15s',
                  fontFamily:"'Inter',sans-serif",
                }}>
                  {NAV_GROUP_TKEYS[group.id] ? T(NAV_GROUP_TKEYS[group.id]) : group.label}
                </span>
                {hasNotif && (
                  <span style={{position:'absolute',top:2,right:'20%',width:'5px',height:'5px',borderRadius:'50%',background:'#EF5350'}} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
