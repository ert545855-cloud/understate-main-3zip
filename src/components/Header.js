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
  const [parties] = useLs('parties', []);
  const [gangs]   = useLs('gangs', []);
  const uid     = profile?.uid || profile?.id;
  const myParty = uid ? parties.find(p => p.leaderId===uid || (p.members||[]).includes(uid)) : null;
  const myGang  = uid ? gangs.find(g => g.leaderId===uid || (g.members||[]).includes(uid)) : null;
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
      background:'#11151C',
      borderBottom:'1px solid rgba(237,231,218,0.08)',
      boxShadow:'0 2px 16px rgba(0,0,0,0.5)',
    }}>
      {/* News ticker */}
      <div style={{
        height:'20px', background:'rgba(0,0,0,0.28)',
        borderBottom:'1px solid rgba(237,231,218,0.05)',
        overflow:'hidden', display:'flex', alignItems:'center',
      }}>
        <div style={{
          whiteSpace:'nowrap', fontSize:'0.56rem',
          fontFamily:"'JetBrains Mono',monospace",
          color:'#8893A1',
          animation:'ticker 35s linear infinite',
          paddingLeft:'100%',
        }}>
          🟢 {onlineCnt} çevrimiçi &nbsp;•&nbsp; 💰 TECH +2.4% &nbsp;ENERGY -1.1% &nbsp;BANK +3.2% &nbsp;•&nbsp; 🏛️ Parlamento: Anayasa değişikliği oylaması &nbsp;•&nbsp; ⚔️ Aktif çatışma: Kuzey bölgesi &nbsp;•&nbsp; 🎓 Yeni üniversite kuruldu &nbsp;•&nbsp; 💼 İşsizlik %12.4 &nbsp;•&nbsp; 📈 Borsa rekor: 10 yılın zirvesi &nbsp;•&nbsp; 🗳️ Seçim: 30 gün kaldı &nbsp;•&nbsp; 🟢 {onlineCnt} çevrimiçi &nbsp;•&nbsp; 💰 TECH +2.4%
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
              color:'#EDE7DA', lineHeight:1.2,
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            }}>
              {profile?.username || '—'}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'0.28rem',flexWrap:'nowrap',overflow:'hidden'}}>
              <span style={{fontSize:'0.55rem',color:'#C9A227',fontWeight:700,whiteSpace:'nowrap',fontFamily:"'Inter',sans-serif"}}>
                {lvl.title}
              </span>
              {orgLabel && <>
                <span style={{fontSize:'0.48rem',color:'rgba(237,231,218,0.2)'}}>•</span>
                <span style={{fontSize:'0.55rem',color:'#8893A1',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',fontFamily:"'Inter',sans-serif"}}>
                  {orgLabel}
                </span>
              </>}
            </div>
          </div>
        </div>

        {/* Money ledger */}
        <div style={{
          textAlign:'center', padding:'0.15rem 0.38rem',
          background:'rgba(76,154,107,0.07)',
          border:'1px solid rgba(76,154,107,0.18)',
          borderTop:'2px solid #4C9A6B',
          borderRadius:'8px', flexShrink:0,
        }}>
          <div style={{fontSize:'0.39rem',color:'#4C9A6B',textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:700,fontFamily:"'Inter',sans-serif"}}>
            {T('money')}
          </div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.64rem',fontWeight:700,color:'#4C9A6B',lineHeight:1.3}}>
            {fmtWord(profile?.money)}
          </div>
        </div>

        {/* UC ledger */}
        <div style={{
          textAlign:'center', padding:'0.15rem 0.38rem',
          background:'rgba(201,162,39,0.07)',
          border:'1px solid rgba(201,162,39,0.18)',
          borderTop:'2px solid #C9A227',
          borderRadius:'8px', flexShrink:0,
        }}>
          <div style={{fontSize:'0.39rem',color:'#C9A227',textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:700,fontFamily:"'Inter',sans-serif"}}>
            {T('uc')}
          </div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.64rem',fontWeight:700,color:'#C9A227',lineHeight:1.3}}>
            {fmt(profile?.underCoin||0)}
          </div>
        </div>

        {/* Language selector */}
        <div style={{position:'relative',flexShrink:0}}>
          <button
            onClick={()=>setShowLangMenu(p=>!p)}
            style={{
              background:'rgba(237,231,218,0.05)',
              border:'1px solid rgba(237,231,218,0.1)',
              borderRadius:'8px', padding:'0.28rem 0.4rem',
              cursor:'pointer', fontSize:'0.78rem',
              color:'#8893A1', display:'flex', alignItems:'center',
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
              background:'#1B212B', border:'1px solid rgba(237,231,218,0.12)',
              borderRadius:'10px', padding:'4px', zIndex:200,
              display:'flex', flexDirection:'column', gap:'2px',
              boxShadow:'0 8px 24px rgba(0,0,0,0.6)',
              minWidth:'80px',
            }}>
              {_HEADER_LANGS.map(l => (
                <button key={l.code}
                  onClick={()=>changeLang(l.code)}
                  style={{
                    background: l.code===(lang||'tr') ? 'rgba(201,162,39,0.15)' : 'transparent',
                    border: l.code===(lang||'tr') ? '1px solid rgba(201,162,39,0.3)' : '1px solid transparent',
                    borderRadius:'7px', padding:'5px 8px',
                    cursor:'pointer', display:'flex', alignItems:'center', gap:'6px',
                    color: l.code===(lang||'tr') ? '#C9A227' : '#EDE7DA',
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
            padding:'0.15rem 0.36rem',
            background:'rgba(76,154,107,0.06)',
            border:'1px solid rgba(76,154,107,0.16)',
            borderRadius:'8px', cursor:'pointer', flexShrink:0,
          }}
          title="Çevrimiçi oyuncular"
        >
          <span style={{width:'5px',height:'5px',borderRadius:'50%',background:'#4C9A6B',display:'inline-block',boxShadow:'0 0 4px #4C9A6B'}}/>
          <span style={{fontSize:'0.57rem',color:'#4C9A6B',fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>
            {onlineCnt}
          </span>
        </div>

        {/* Notifications bell */}
        <button
          onClick={onNotif}
          style={{
            position:'relative',
            background:'rgba(237,231,218,0.05)',
            border:'1px solid rgba(237,231,218,0.1)',
            borderRadius:'8px', padding:'0.28rem 0.42rem',
            cursor:'pointer', fontSize:'0.86rem',
            color:'#8893A1', flexShrink:0,
          }}
        >
          🔔
          {notifCount > 0 && (
            <span style={{
              position:'absolute', top:'-3px', right:'-3px',
              background:'#C24B43', color:'#EDE7DA',
              fontSize:'0.49rem', fontWeight:900,
              minWidth:'13px', height:'13px', borderRadius:'7px',
              display:'flex', alignItems:'center', justifyContent:'center',
              padding:'0 2px', border:'2px solid #11151C',
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
