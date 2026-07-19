window.RozetKoleksiyonScreen = function({ profile, onNavigate }) {
  const G='#C89B3C',BG='#0F0800',T='#F5EBD7',M='#A9A6A0',S='#2D1800',GR='#3E8C5A',R='#B8423C',P='#A78BFA';
  const lv = profile?.level||1;
  const money = profile?.money||0;
  const xp = profile?.xp||0;

  const BADGES = [
    // Seviye rozetleri
    {id:'lv5',   emoji:'🥉', name:'Çırak',            desc:'Seviye 5\'e ulaş',          cat:'Seviye',   earned: lv>=5,  color:'#CD7F32'},
    {id:'lv10',  emoji:'🥈', name:'Kalfa',             desc:'Seviye 10\'a ulaş',         cat:'Seviye',   earned: lv>=10, color:'#C0C0C0'},
    {id:'lv25',  emoji:'🥇', name:'Usta',              desc:'Seviye 25\'e ulaş',         cat:'Seviye',   earned: lv>=25, color:G},
    {id:'lv50',  emoji:'💎', name:'Üstad',             desc:'Seviye 50\'ye ulaş',        cat:'Seviye',   earned: lv>=50, color:P},
    {id:'lv99',  emoji:'👑', name:'Efsane',            desc:'Seviye 99\'a ulaş',         cat:'Seviye',   earned: lv>=99, color:'#FF8C00'},
    // Ekonomi rozetleri
    {id:'para1', emoji:'💰', name:'Esnaf',             desc:'100.000 Sikke kazan',       cat:'Ekonomi',  earned: money>=100000,   color:G},
    {id:'para2', emoji:'🏦', name:'Banker',            desc:'1.000.000 Sikke biriktir',  cat:'Ekonomi',  earned: money>=1000000,  color:G},
    {id:'para3', emoji:'💎', name:'Tâcir',             desc:'10M Sikke birikimi',        cat:'Ekonomi',  earned: money>=10000000, color:P},
    // XP rozetleri
    {id:'xp1',   emoji:'⭐', name:'Yolcu',             desc:'1.000 XP kazan',            cat:'Deneyim',  earned: xp>=1000,   color:G},
    {id:'xp2',   emoji:'🌟', name:'Seyyah',            desc:'10.000 XP kazan',           cat:'Deneyim',  earned: xp>=10000,  color:G},
    {id:'xp3',   emoji:'✨', name:'Destan Kahramanı',  desc:'100.000 XP kazan',          cat:'Deneyim',  earned: xp>=100000, color:P},
    // Özel rozetler
    {id:'login7',emoji:'🔥', name:'7 Gün Serisi',      desc:'7 gün üst üste giriş',      cat:'Özel',     earned: (()=>{ try{ const s=JSON.parse(localStorage.getItem('rep_loginStreak')||'{}'); return (s.count||0)>=7; }catch{return false;} })(), color:R},
    {id:'quiz7', emoji:'🧠', name:'Tarih Bilgesi',     desc:'7 gün quiz serisi',         cat:'Özel',     earned: (()=>{ try{ const s=JSON.parse(localStorage.getItem('rep_quizStreak')||'{}'); return (s.count||0)>=7; }catch{return false;} })(), color:P},
    {id:'ferman1',emoji:'📜',name:'Kalemşor',          desc:'İlk fermanını yayınla',     cat:'Devlet',   earned: (()=>{ try{ return !!JSON.parse(localStorage.getItem('rep_hasFerman')||'null'); }catch{return false;} })(), color:G},
    {id:'spin1', emoji:'🎡', name:'Şans Çocuğu',       desc:'Fal çarkını ilk çevir',     cat:'Özel',     earned: (()=>{ try{ const s=JSON.parse(localStorage.getItem('rep_falCarki')||'{}'); return !!s.lastSpun; }catch{return false;} })(), color:P},
    {id:'early', emoji:'🌅', name:'Kurucu',            desc:'Erken dönem oyuncusu',      cat:'Özel',     earned: lv>=1, color:G},
  ];

  const cats = ['Tümü',...new Set(BADGES.map(b=>b.cat))];
  const [filter, setFilter] = React.useState('Tümü');
  const earned = BADGES.filter(b=>b.earned).length;
  const filtered = filter==='Tümü' ? BADGES : BADGES.filter(b=>b.cat===filter);
  const pct = Math.round(earned/BADGES.length*100);

  return React.createElement('div',{style:{minHeight:'100vh',background:BG,fontFamily:"'Inter',sans-serif",paddingBottom:80}},
    React.createElement('div',{style:{background:'linear-gradient(135deg,#1a0800,#2d1600)',borderBottom:'1px solid rgba(200,155,60,0.2)',padding:'14px 16px'}},
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:10}},
        onNavigate && React.createElement('button',{onClick:()=>onNavigate('home'),style:{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'6px 10px',color:M,fontSize:'0.75rem',cursor:'pointer'}},'← Geri'),
        React.createElement('span',{style:{fontSize:'1.5rem'}},'🏅'),
        React.createElement('div',null,
          React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:'1.1rem',color:G}},'Rozet Koleksiyonu'),
          React.createElement('div',{style:{fontSize:'0.62rem',color:M}},`${earned}/${BADGES.length} rozet • %${pct} tamamlandı`)
        )
      )
    ),
    React.createElement('div',{style:{padding:'12px'}},
      // Progress bar
      React.createElement('div',{style:{background:S,borderRadius:14,padding:'14px',marginBottom:12,border:'1px solid rgba(200,155,60,0.15)'}},
        React.createElement('div',{style:{display:'flex',justifyContent:'space-between',marginBottom:8}},
          React.createElement('span',{style:{fontFamily:"'Cinzel',serif",fontSize:'0.8rem',color:G}},'İlerleme'),
          React.createElement('span',{style:{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.8rem',fontWeight:800,color:G}},`%${pct}`)
        ),
        React.createElement('div',{style:{height:10,background:'rgba(255,255,255,0.06)',borderRadius:5,overflow:'hidden'}},
          React.createElement('div',{style:{height:'100%',width:`${pct}%`,background:`linear-gradient(90deg,${G},#E8C06A)`,borderRadius:5,transition:'width 0.6s ease'}})
        )
      ),
      // Category filter chips
      React.createElement('div',{style:{display:'flex',gap:6,overflowX:'auto',paddingBottom:4,marginBottom:12}},
        cats.map(c=>
          React.createElement('button',{key:c,onClick:()=>setFilter(c),style:{flexShrink:0,padding:'5px 12px',borderRadius:20,border:`1px solid ${filter===c?G:G+'33'}`,background:filter===c?G+'22':'transparent',color:filter===c?G:M,fontSize:'0.7rem',fontWeight:700,cursor:'pointer'}},c)
        )
      ),
      // Badge grid
      React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}},
        filtered.map(b=>
          React.createElement('div',{key:b.id,style:{
            background: b.earned ? b.color+'15' : 'rgba(255,255,255,0.03)',
            border:`1px solid ${b.earned?b.color+'44':'rgba(255,255,255,0.07)'}`,
            borderRadius:14,padding:'14px 8px',textAlign:'center',
            opacity: b.earned ? 1 : 0.45,
            transition:'all 0.2s'
          }},
            React.createElement('div',{style:{fontSize:'2rem',marginBottom:6,filter: b.earned ? 'none' : 'grayscale(100%)'}},b.emoji),
            React.createElement('div',{style:{fontWeight:700,fontSize:'0.72rem',color:b.earned?b.color:M,marginBottom:3}},b.name),
            React.createElement('div',{style:{fontSize:'0.58rem',color:M,lineHeight:1.3}},b.desc),
            b.earned && React.createElement('div',{style:{marginTop:4,fontSize:'0.6rem',color:GR,fontWeight:700}},'✅ Kazanıldı')
          )
        )
      )
    )
  );
};
