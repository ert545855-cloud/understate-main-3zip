"use strict";
// ═══════════════════════════════════════════════════════
// HEADER BİLEŞENİ — Design System v9
// Note: hooks (useState/useEffect/useContext) come from app.js global scope at call time
// ═══════════════════════════════════════════════════════

const _HEADER_LANGS = [
  { code:'tr', flag:'🇹🇷', label:'TR' },
  { code:'en', flag:'🇬🇧', label:'EN' },
  { code:'az', flag:'🇦🇿', label:'AZ' },
  { code:'de', flag:'🇩🇪', label:'DE' },
];

function Header({ profile, notifCount, onNotif, page, onNavigate }) {
  const onlineCnt = useOnlineCount();
  const lvl       = getLevelInfo(profile?.xp || 0);
  const T         = useT();
  const lang      = useContext(LangCtx);
  const [_parties] = useLs('parties', []);
  const [_gangs]   = useLs('gangs', []);
  // Normalize: DB/socket may return object maps; ensure arrays before .find()
  const parties = Array.isArray(_parties) ? _parties : Object.values(_parties || {});
  const gangs   = Array.isArray(_gangs)   ? _gangs   : Object.values(_gangs   || {});
  const uid     = profile?.uid || profile?.id;
  const myParty = uid ? parties.find(p => p && (p.leaderId===uid || (Array.isArray(p.members) ? p.members.includes(uid) : false))) : null;
  const myGang  = uid ? gangs.find(g  => g  && (g.leaderId===uid  || (Array.isArray(g.members) ? g.members.includes(uid)  : false))) : null;
  const orgLabel = myParty ? `🏛️ ${myParty.name}` : myGang ? `💀 ${myGang.name}` : null;

  const [showLangMenu, setShowLangMenu] = useState(false);

  const changeLang = (code) => {
    localStorage.setItem('rep_uiLang', code);
    window.dispatchEvent(new CustomEvent('lang-change', { detail: { lang: code } }));
    setShowLangMenu(false);
  };

  const currentLang = _HEADER_LANGS.find(l => l.code === (lang||'tr')) || _HEADER_LANGS[0];

  return (
    <div style={{
      position:'sticky', top:0, zIndex:100,
      background:'#0C1330',
      borderBottom:'1px solid rgba(255,255,255,0.1)',
      boxShadow:'0 2px 16px rgba(3,6,20,0.6)',
    }}>
      {/* News ticker */}
      <div style={{
        height:'20px', background:'rgba(0,0,0,0.3)',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        overflow:'hidden', display:'flex', alignItems:'center',
      }}>
        <div style={{
          whiteSpace:'nowrap', fontSize:'0.56rem',
          fontFamily:"'JetBrains Mono',monospace",
          color:'#8896B8',
          animation:'ticker 35s linear infinite',
          paddingLeft:'100%',
        }}>
          🟢 {onlineCnt} {T('tickerOnline')} &nbsp;•&nbsp; 💰 TECH +2.4% &nbsp;ENERGY -1.1% &nbsp;BANK +3.2% &nbsp;•&nbsp; 🏛️ {T('tickerParliament')} &nbsp;•&nbsp; ⚔️ {T('tickerConflict')} &nbsp;•&nbsp; 🎓 {T('tickerUniversity')} &nbsp;•&nbsp; 📈 {T('tickerMarket')} &nbsp;•&nbsp; 🗳️ {T('tickerElection')} &nbsp;•&nbsp; 🟢 {onlineCnt} {T('tickerOnline')} &nbsp;•&nbsp; 💰 TECH +2.4%
        </div>
      </div>

      {/* Main header row */}
      <div style={{display:'flex',alignItems:'center',padding:'0.36rem 0.75rem',gap:'0.4rem'}}>

        {/* Avatar + name */}
        <div
          onClick={()=>onNavigate&&onNavigate('profile')}
          style={{display:'flex',alignItems:'center',gap:'0.42rem',flex:1,minWidth:0,cursor:'pointer',WebkitTapHighlightColor:'transparent'}}
        >
          <Avatar profile={profile} size={34} />
          <div style={{display:'flex',flexDirection:'column',justifyContent:'center',minWidth:0}}>
            <div style={{
              fontFamily:"'Inter',sans-serif", fontSize:'0.77rem', fontWeight:700,
              color:'#F2F5FA', lineHeight:1.2,
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            }}>
              {profile?.username || '—'}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'0.28rem',flexWrap:'nowrap',overflow:'hidden'}}>
              <span style={{fontSize:'0.55rem',color:'#F0B33E',fontWeight:700,whiteSpace:'nowrap',fontFamily:"'Inter',sans-serif"}}>
                {lvl.title}
              </span>
              {orgLabel && <>
                <span style={{fontSize:'0.48rem',color:'rgba(255,255,255,0.25)'}}>•</span>
                <span style={{fontSize:'0.55rem',color:'#8896B8',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',fontFamily:"'Inter',sans-serif"}}>
                  {orgLabel}
                </span>
              </>}
            </div>
          </div>
        </div>

        {/* Money pill (Mayor HUD style) */}
        <div style={{
          display:'flex', alignItems:'center', gap:'4px',
          padding:'0.3rem 0.6rem',
          background:'rgba(62,207,122,0.14)',
          border:'1.5px solid rgba(62,207,122,0.4)',
          borderRadius:'999px', flexShrink:0,
        }}>
          <span style={{fontSize:'0.72rem'}}>💰</span>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.66rem',fontWeight:800,color:'#3ECF7A',lineHeight:1}}>
            {fmtWord(profile?.money)}
          </div>
        </div>

        {/* UC pill */}
        <div style={{
          display:'flex', alignItems:'center', gap:'4px',
          padding:'0.3rem 0.6rem',
          background:'rgba(139,107,242,0.16)',
          border:'1.5px solid rgba(139,107,242,0.42)',
          borderRadius:'999px', flexShrink:0,
        }}>
          <span style={{fontSize:'0.72rem'}}>💎</span>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.66rem',fontWeight:800,color:'#8B6BF2',lineHeight:1}}>
            {fmt(profile?.underCoin||0)}
          </div>
        </div>

        {/* Language selector */}
        <div style={{position:'relative',flexShrink:0}}>
          <button
            onClick={()=>setShowLangMenu(p=>!p)}
            style={{
              background:'rgba(255,255,255,0.06)',
              border:'1px solid rgba(255,255,255,0.14)',
              borderRadius:'999px', padding:'0.3rem 0.5rem',
              cursor:'pointer', fontSize:'0.78rem',
              color:'#8896B8', display:'flex', alignItems:'center',
              gap:'2px', lineHeight:1,
              fontFamily:"'Inter',sans-serif",
            }}
            title={T('language')||'Dil'}
          >
            <span>{currentLang.flag}</span>
          </button>
          {showLangMenu && (
            <div style={{
              position:'absolute', top:'calc(100% + 4px)', right:0,
              background:'#16224A', border:'1px solid rgba(255,255,255,0.14)',
              borderRadius:'14px', padding:'4px', zIndex:200,
              display:'flex', flexDirection:'column', gap:'2px',
              boxShadow:'0 8px 24px rgba(3,6,20,0.7)',
              minWidth:'80px',
            }}>
              {_HEADER_LANGS.map(l => (
                <button key={l.code}
                  onClick={()=>changeLang(l.code)}
                  style={{
                    background: l.code===(lang||'tr') ? 'rgba(240,179,62,0.18)' : 'transparent',
                    border: l.code===(lang||'tr') ? '1px solid rgba(240,179,62,0.4)' : '1px solid transparent',
                    borderRadius:'999px', padding:'5px 10px',
                    cursor:'pointer', display:'flex', alignItems:'center', gap:'6px',
                    color: l.code===(lang||'tr') ? '#F0B33E' : '#F2F5FA',
                    fontSize:'0.75rem', fontFamily:"'Inter',sans-serif", fontWeight:600,
                    whiteSpace:'nowrap',
                  }}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Online count */}
        <div
          onClick={()=>onNavigate&&onNavigate('players')}
          style={{
            display:'flex', alignItems:'center', gap:'3px',
            padding:'0.3rem 0.55rem',
            background:'rgba(62,207,122,0.08)',
            border:'1px solid rgba(62,207,122,0.2)',
            borderRadius:'999px', cursor:'pointer', flexShrink:0,
          }}
          title="Çevrimiçi oyuncular"
        >
          <span style={{width:'5px',height:'5px',borderRadius:'50%',background:'#3ECF7A',display:'inline-block',boxShadow:'0 0 4px #3ECF7A'}}/>
          <span style={{fontSize:'0.57rem',color:'#3ECF7A',fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>
            {onlineCnt}
          </span>
        </div>

        {/* Notifications bell */}
        <button
          onClick={onNotif}
          style={{
            position:'relative',
            background:'rgba(255,255,255,0.06)',
            border:'1px solid rgba(255,255,255,0.14)',
            borderRadius:'999px', padding:'0.3rem 0.48rem',
            cursor:'pointer', fontSize:'0.86rem',
            color:'#8896B8', flexShrink:0,
          }}
        >
          🔔
          {notifCount > 0 && (
            <span style={{
              position:'absolute', top:'-3px', right:'-3px',
              background:'#EF5350', color:'#F2F5FA',
              fontSize:'0.49rem', fontWeight:900,
              minWidth:'13px', height:'13px', borderRadius:'7px',
              display:'flex', alignItems:'center', justifyContent:'center',
              padding:'0 2px', border:'2px solid #0C1330',
            }}>
              {notifCount}
            </span>
          )}
        </button>
      </div>

      {/* Close lang menu when clicking outside */}
      {showLangMenu && (
        <div
          onClick={()=>setShowLangMenu(false)}
          style={{position:'fixed',inset:0,zIndex:199}}
        />
      )}

      <style>{`@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
    </div>
  );
}
