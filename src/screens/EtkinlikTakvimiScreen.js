window.EtkinlikTakvimiScreen = function({ profile, onNavigate }) {
  const G='#C89B3C',BG='#0F0800',T='#F5EBD7',M='#A9A6A0',S='#2D1800',GR='#3E8C5A',R='#B8423C',P='#A78BFA';
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => { const iv=setInterval(()=>setNow(Date.now()),1000); return ()=>clearInterval(iv); }, []);

  const pad = n => String(n).padStart(2,'0');
  const countdown = (end) => {
    const ms = end - now;
    if (ms<=0) return '⏰ Sona erdi';
    const h=Math.floor(ms/3600000), m=Math.floor(ms%3600000/60000), s=Math.floor(ms%60000/1000);
    const d=Math.floor(h/24);
    if (d>0) return `${d}g ${pad(h%24)}:${pad(m)}:${pad(s)}`;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const EVENTS = [
    {id:'e1',  emoji:'🎡', name:'Fal Çarkı Sıfırlama',  desc:'Günlük fal çarkı sıfırlanıyor',    color:P,    end: new Date(todayStart).setHours(24),    page:'fal_carki',   type:'Günlük'},
    {id:'e2',  emoji:'📋', name:'Günlük Görev Sıfırla', desc:'Görevler gece yarısı yenilenir',   color:G,    end: new Date(todayStart).setHours(24),    page:'gunluk_gorev',type:'Günlük'},
    {id:'e3',  emoji:'🕌', name:'Osmanlı Günü Sorusu',  desc:'Yeni soru yarın gün doğumunda',    color:G,    end: new Date(todayStart).setHours(24),    page:'osmanli_gunu', type:'Günlük'},
    {id:'e4',  emoji:'🏅', name:'Sezon Sonu',           desc:'Sezon sıralama ödülleri dağıtımı', color:'#60A5FA', end: Date.now()+7*86400000,           page:'sezon',        type:'Sezon'},
    {id:'e5',  emoji:'⚔️', name:'Haftalık Turnuva',     desc:'En güçlü savaşçı büyük ödül alır', color:R,   end: Date.now()+3*86400000+43200000,      page:'lonca_turnuva',type:'Haftalık'},
    {id:'e6',  emoji:'🐪', name:'Kervan Festivali',     desc:'Kervan koruma ödülleri x2',         color:'#F97316', end: Date.now()+2*86400000,          page:'kervan_koruma',type:'Özel'},
    {id:'e7',  emoji:'⚒️', name:'Zanaat Haftası',       desc:'Tüm zanaat XP x1.5 bonus',          color:GR,  end: Date.now()+5*86400000,               page:'zanaat',       type:'Özel'},
    {id:'e8',  emoji:'💰', name:'Pazar Etkinliği',      desc:'Özel mallar ve indirimler',          color:G,   end: Date.now()+86400000,                 page:'pazar_etkinlik',type:'Günlük'},
  ];

  const cats = ['Tümü','Günlük','Haftalık','Sezon','Özel'];
  const [filter, setFilter] = React.useState('Tümü');
  const filtered = filter==='Tümü' ? EVENTS : EVENTS.filter(e=>e.type===filter);

  const typeColor = {Günlük:G, Haftalık:R, Sezon:'#60A5FA', Özel:'#F97316'};

  return React.createElement('div',{style:{minHeight:'100vh',background:BG,fontFamily:"'Inter',sans-serif",paddingBottom:80}},
    React.createElement('div',{style:{background:'linear-gradient(135deg,#1a0800,#2d1600)',borderBottom:'1px solid rgba(200,155,60,0.2)',padding:'14px 16px'}},
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:10}},
        onNavigate && React.createElement('button',{onClick:()=>onNavigate('home'),style:{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'6px 10px',color:M,fontSize:'0.75rem',cursor:'pointer'}},'← Geri'),
        React.createElement('span',{style:{fontSize:'1.5rem'}},'📅'),
        React.createElement('div',null,
          React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:'1.1rem',color:G}},'Etkinlik Takvimi'),
          React.createElement('div',{style:{fontSize:'0.62rem',color:M}},'Aktif etkinlikler ve geri sayımlar')
        )
      )
    ),
    React.createElement('div',{style:{padding:'12px'}},
      // Category chips
      React.createElement('div',{style:{display:'flex',gap:6,overflowX:'auto',paddingBottom:4,marginBottom:12}},
        cats.map(c=>
          React.createElement('button',{key:c,onClick:()=>setFilter(c),style:{flexShrink:0,padding:'5px 12px',borderRadius:20,border:`1px solid ${filter===c?G:G+'33'}`,background:filter===c?G+'22':'transparent',color:filter===c?G:M,fontSize:'0.7rem',fontWeight:700,cursor:'pointer'}},c)
        )
      ),
      // Event cards
      filtered.map(ev=>{
        const ms = ev.end - now;
        const urgent = ms>0 && ms < 3600000; // son 1 saat
        return React.createElement('div',{key:ev.id,
          onClick:()=>onNavigate&&onNavigate(ev.page),
          style:{background:S,border:`1px solid ${urgent?R:ev.color}33`,borderRadius:14,padding:'14px',marginBottom:10,cursor:'pointer',transition:'all 0.2s',position:'relative',overflow:'hidden'}},
          urgent && React.createElement('div',{style:{position:'absolute',top:0,left:0,right:0,height:2,background:R,animation:'pulse 1s ease infinite'}}),
          React.createElement('div',{style:{display:'flex',alignItems:'flex-start',gap:12}},
            React.createElement('div',{style:{width:44,height:44,borderRadius:12,background:ev.color+'22',border:`1px solid ${ev.color}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',flexShrink:0}},ev.emoji),
            React.createElement('div',{style:{flex:1}},
              React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}},
                React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontWeight:800,fontSize:'0.88rem',color:T}},ev.name),
                React.createElement('span',{style:{fontSize:'0.6rem',padding:'2px 8px',borderRadius:20,border:`1px solid ${typeColor[ev.type]||G}44`,color:typeColor[ev.type]||G,background:(typeColor[ev.type]||G)+'11'}},ev.type)
              ),
              React.createElement('div',{style:{fontSize:'0.72rem',color:M,marginBottom:8}},ev.desc),
              React.createElement('div',{style:{display:'flex',alignItems:'center',gap:6}},
                React.createElement('span',{style:{fontSize:'0.65rem',color:M}},'⏱'),
                React.createElement('span',{style:{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.85rem',fontWeight:800,color:urgent?R:ev.color}},countdown(ev.end)),
                React.createElement('span',{style:{fontSize:'0.7rem',color:ev.color,marginLeft:'auto'}},'→ Git')
              )
            )
          )
        );
      })
    )
  );
};
