window.MaceraGunluguScreen = function({ profile, onNavigate }) {
  const G='#C89B3C',BG='#0F0800',T='#F5EBD7',M='#A9A6A0',S='#2D1800',GR='#3E8C5A',R='#B8423C',P='#A78BFA';
  const jwt = () => localStorage.getItem('us_jwt')||'';
  const [log, setLog] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      const api = await fetch('/api/adventure-log',{headers:{Authorization:'Bearer '+jwt()}}).then(r=>r.json()).catch(()=>({success:false}));
      // API + auto-generate from profile activity
      const entries = [];
      if (api.success) entries.push(...(api.log||[]));
      // Local history
      const streak = (() => { try { return JSON.parse(localStorage.getItem('rep_loginStreak')||'{}'); } catch { return {}; } })();
      if (streak.count>0) entries.push({event_type:'streak',title:`🔥 ${streak.count} Günlük Giriş Serisi`,description:'Sadık oyuncu',xp_earned:0,sikke_earned:0,created_at:new Date().toISOString()});
      const skills = (() => { try { return Object.keys(JSON.parse(localStorage.getItem('rep_skills')||'{}')); } catch { return []; } })();
      if (skills.length>0) entries.push({event_type:'skill',title:`🌳 ${skills.length} Yetenek Öğrenildi`,description:`Son öğrenilen: ${skills[skills.length-1]||''}`,xp_earned:skills.length*10,sikke_earned:0,created_at:new Date().toISOString()});
      const lv = profile?.level||1;
      if (lv>=5) entries.push({event_type:'level',title:`🏆 Seviye ${lv}`,description:'Deneyimli savaşçı',xp_earned:0,sikke_earned:1000,created_at:new Date(Date.now()-86400000).toISOString()});
      if ((profile?.money||0)>10000) entries.push({event_type:'economy',title:'💰 İlk Büyük Servet',description:`${((profile?.money||0)).toLocaleString('tr-TR')} Sikke birikimi`,xp_earned:0,sikke_earned:0,created_at:new Date(Date.now()-2*86400000).toISOString()});
      entries.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
      setLog(entries.slice(0,20));
      setLoading(false);
    };
    load();
  },[]);

  const iconFor = t=>({level:'🏆',skill:'🌳',economy:'💰',battle:'⚔️',ferman:'📜',craft:'⚒️',kervan:'🐪',casus:'🕵️',streak:'🔥',social:'👥'}[t]||'📖');
  const colorFor = t=>({level:G,skill:'#3E8C5A',economy:G,battle:R,ferman:G,craft:GR,kervan:'#F97316',casus:R,streak:R,social:P}[t]||G);

  const timeAgo = ts => {
    const ms = Date.now()-new Date(ts||0);
    if (ms<60000) return 'Az önce';
    if (ms<3600000) return `${Math.floor(ms/60000)} dakika önce`;
    if (ms<86400000) return `${Math.floor(ms/3600000)} saat önce`;
    return `${Math.floor(ms/86400000)} gün önce`;
  };

  return React.createElement('div',{style:{minHeight:'100vh',background:BG,fontFamily:"'Inter',sans-serif",paddingBottom:80}},
    React.createElement('div',{style:{background:'linear-gradient(135deg,#1a0800,#2d1600)',borderBottom:'1px solid rgba(200,155,60,0.2)',padding:'14px 16px'}},
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:10}},
        onNavigate&&React.createElement('button',{onClick:()=>onNavigate('home'),style:{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'6px 10px',color:M,fontSize:'0.75rem',cursor:'pointer'}},'← Geri'),
        React.createElement('span',{style:{fontSize:'1.5rem'}},'📖'),
        React.createElement('div',null,
          React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:'1.1rem',color:G}},'Macera Günlüğü'),
          React.createElement('div',{style:{fontSize:'0.62rem',color:M}},`${profile?.username||'Oyuncu'}'nin hikayesi`)
        )
      )
    ),
    // Profil özeti
    React.createElement('div',{style:{background:`linear-gradient(135deg,${G}15,${S})`,borderBottom:`1px solid ${G}22`,padding:'14px 16px'}},
      React.createElement('div',{style:{display:'flex',gap:16,justifyContent:'space-around'}},
        [{v:`Seviye ${profile?.level||1}`,l:'Mevcut Rütbe',c:G},{v:`${(profile?.xp||0).toLocaleString('tr-TR')} XP`,l:'Toplam Deneyim',c:P},{v:`${(profile?.money||0).toLocaleString('tr-TR')}🪙`,l:'Hazine',c:G}].map(s=>
          React.createElement('div',{key:s.l,style:{textAlign:'center'}},
            React.createElement('div',{style:{fontWeight:800,fontSize:'0.85rem',color:s.c}},s.v),
            React.createElement('div',{style:{fontSize:'0.58rem',color:M,marginTop:2}},s.l)
          )
        )
      )
    ),
    React.createElement('div',{style:{padding:'12px'}},
      loading
        ? React.createElement('div',{style:{textAlign:'center',color:M,padding:48}},'Günlük yükleniyor...')
        : log.length===0
          ? React.createElement('div',{style:{textAlign:'center',padding:48,color:M}},
              React.createElement('div',{style:{fontSize:'3rem',marginBottom:12}},'📖'),
              React.createElement('div',null,'Henüz macera başlamadı!'),
              React.createElement('div',{style:{fontSize:'0.72rem',marginTop:6}},'Oyun oynamaya başla, hikaye yazılmaya başlayacak.')
            )
          : React.createElement('div',{style:{position:'relative'}},
              // Timeline çizgisi
              React.createElement('div',{style:{position:'absolute',left:20,top:0,bottom:0,width:2,background:`linear-gradient(to bottom,${G}44,transparent)`}}),
              log.map((entry,i)=>{
                const col = colorFor(entry.event_type);
                return React.createElement('div',{key:i,style:{display:'flex',gap:12,marginBottom:16,paddingLeft:4}},
                  React.createElement('div',{style:{width:34,height:34,borderRadius:'50%',background:`${col}22`,border:`2px solid ${col}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem',flexShrink:0,zIndex:1,background:BG}},iconFor(entry.event_type)),
                  React.createElement('div',{style:{background:S,border:`1px solid ${col}22`,borderRadius:12,padding:'10px 14px',flex:1}},
                    React.createElement('div',{style:{fontWeight:700,fontSize:'0.85rem',color:T,marginBottom:2}},entry.title),
                    entry.description&&React.createElement('div',{style:{fontSize:'0.72rem',color:M,marginBottom:6,lineHeight:1.4}},entry.description),
                    React.createElement('div',{style:{display:'flex',gap:10,alignItems:'center'}},
                      entry.xp_earned>0&&React.createElement('span',{style:{fontSize:'0.62rem',color:P}},`+${entry.xp_earned} XP`),
                      entry.sikke_earned>0&&React.createElement('span',{style:{fontSize:'0.62rem',color:G}},`+${entry.sikke_earned}🪙`),
                      React.createElement('span',{style:{fontSize:'0.6rem',color:M,marginLeft:'auto'}},timeAgo(entry.created_at))
                    )
                  )
                );
              })
            )
    )
  );
};
