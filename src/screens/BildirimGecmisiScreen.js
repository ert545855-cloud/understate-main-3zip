window.BildirimGecmisiScreen = function({ profile, onNavigate }) {
  const G='#C89B3C',BG='#0F0800',T='#F5EBD7',M='#A9A6A0',S='#2D1800',GR='#3E8C5A',R='#B8423C',P='#A78BFA';
  const jwt = () => localStorage.getItem('us_jwt')||'';
  const [notifs, setNotifs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // DB bildirimlerini çek, localStorage ile birleştir
    const fetchNotifs = async () => {
      const api = await fetch('/api/notifications?limit=30',{headers:{Authorization:'Bearer '+jwt()}}).then(r=>r.json()).catch(()=>({success:false}));
      const local = (() => { try { return JSON.parse(localStorage.getItem('rep_notifHistory')||'[]'); } catch { return []; } })();
      const combined = [];
      if (api.success && api.notifications) combined.push(...api.notifications.map(n=>({...n,source:'server'})));
      combined.push(...local.map(n=>({...n,source:'local'})));
      combined.sort((a,b)=>new Date(b.created_at||b.ts||0)-new Date(a.created_at||a.ts||0));
      setNotifs(combined.slice(0,30));
      setLoading(false);
    };
    fetchNotifs();
  },[]);

  const iconFor = (type) => ({success:'✅',error:'❌',info:'ℹ️',warning:'⚠️',reward:'🎁',battle:'⚔️',social:'👥',economy:'💰'}[type]||'🔔');
  const colorFor = (type) => ({success:GR,error:R,info:'#60A5FA',warning:'#F97316',reward:G,battle:R,social:P,economy:G}[type]||G);

  const timeAgo = (ts) => {
    const ms = Date.now()-new Date(ts||0);
    if (ms<60000) return 'Şimdi';
    if (ms<3600000) return `${Math.floor(ms/60000)}dk`;
    if (ms<86400000) return `${Math.floor(ms/3600000)}sa`;
    return `${Math.floor(ms/86400000)}g`;
  };

  return React.createElement('div',{style:{minHeight:'100vh',background:BG,fontFamily:"'Inter',sans-serif",paddingBottom:80}},
    React.createElement('div',{style:{background:'linear-gradient(135deg,#1a0800,#2d1600)',borderBottom:'1px solid rgba(200,155,60,0.2)',padding:'14px 16px'}},
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:10}},
        onNavigate && React.createElement('button',{onClick:()=>onNavigate('home'),style:{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'6px 10px',color:M,fontSize:'0.75rem',cursor:'pointer'}},'← Geri'),
        React.createElement('span',{style:{fontSize:'1.5rem'}},'🔔'),
        React.createElement('div',null,
          React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:'1.1rem',color:G}},'Bildirim Geçmişi'),
          React.createElement('div',{style:{fontSize:'0.62rem',color:M}},`Son ${notifs.length} bildirim`)
        )
      )
    ),
    React.createElement('div',{style:{padding:'12px'}},
      loading
        ? React.createElement('div',{style:{textAlign:'center',color:M,padding:48}},'Yükleniyor...')
        : notifs.length===0
          ? React.createElement('div',{style:{textAlign:'center',padding:48,color:M}},
              React.createElement('div',{style:{fontSize:'3rem',marginBottom:12}},'🔕'),
              React.createElement('div',null,'Henüz bildirim yok')
            )
          : notifs.map((n,i)=>{
              const col = colorFor(n.type);
              return React.createElement('div',{key:n.id||i,style:{
                background:S, border:`1px solid ${col}22`,
                borderLeft:`3px solid ${col}`,
                borderRadius:12,padding:'12px 14px',marginBottom:8,
                display:'flex',alignItems:'flex-start',gap:10
              }},
                React.createElement('span',{style:{fontSize:'1.2rem',flexShrink:0}},iconFor(n.type)),
                React.createElement('div',{style:{flex:1}},
                  React.createElement('div',{style:{fontWeight:600,fontSize:'0.85rem',color:T,marginBottom:2}},n.title||n.message||n.text||'Bildirim'),
                  n.body&&React.createElement('div',{style:{fontSize:'0.72rem',color:M,lineHeight:1.4,marginBottom:4}},n.body),
                  React.createElement('div',{style:{fontSize:'0.62rem',color:M}},timeAgo(n.created_at||n.ts))
                ),
                !n.read&&React.createElement('div',{style:{width:7,height:7,borderRadius:'50%',background:col,flexShrink:0,marginTop:4}})
              );
            })
    )
  );
};
