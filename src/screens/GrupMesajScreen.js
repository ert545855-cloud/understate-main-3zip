window.GrupMesajScreen = function({ profile, onNavigate, showNotif }) {
  const G='#C89B3C',BG='#0F0800',T='#F5EBD7',M='#A9A6A0',S='#2D1800',GR='#3E8C5A',R='#B8423C';
  const jwt = () => localStorage.getItem('us_jwt')||'';
  const ROOMS = [
    {id:'genel',    name:'🌍 Genel Sohbet',  desc:'Tüm oyuncular'},
    {id:'ticaret',  name:'💰 Ticaret Odası', desc:'Alım-satım teklifleri'},
    {id:'savas',    name:'⚔️ Savaş Odası',   desc:'Savaş stratejileri'},
    {id:'devlet',   name:'🏛️ Divan',         desc:'Devlet meseleleri'},
    {id:'zanaat',   name:'⚒️ Zanaat Loncası', desc:'Zanaatkârlar toplantısı'},
  ];
  const [room, setRoom] = React.useState(ROOMS[0]);
  const [msgs, setMsgs] = React.useState([]);
  const [text, setText] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const endRef = React.useRef(null);

  React.useEffect(() => { loadMsgs(); }, [room.id]);
  React.useEffect(() => { endRef.current?.scrollIntoView({behavior:'smooth'}); }, [msgs]);

  const loadMsgs = async () => {
    setLoading(true);
    const r = await fetch(`/api/grup-mesaj/${room.id}`,{headers:{Authorization:'Bearer '+jwt()}}).then(r=>r.json()).catch(()=>({success:false}));
    if (r.success) setMsgs(r.messages||[]);
    setLoading(false);
  };

  const send = async () => {
    if (!text.trim()) return;
    const r = await fetch(`/api/grup-mesaj/${room.id}`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+jwt()},body:JSON.stringify({content:text.trim()})}).then(r=>r.json()).catch(()=>({success:false}));
    if (r.success) { setText(''); loadMsgs(); }
    else showNotif&&showNotif(r.message||'Hata','error');
  };

  const timeAgo = ts => {
    const ms=Date.now()-new Date(ts);
    if (ms<60000) return 'şimdi';
    if (ms<3600000) return Math.floor(ms/60000)+'dk';
    return Math.floor(ms/3600000)+'sa';
  };

  return React.createElement('div',{style:{minHeight:'100vh',background:BG,fontFamily:"'Inter',sans-serif",display:'flex',flexDirection:'column'}},
    // Header
    React.createElement('div',{style:{background:'linear-gradient(135deg,#1a0800,#2d1600)',borderBottom:'1px solid rgba(200,155,60,0.2)',padding:'14px 16px',flexShrink:0}},
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:10}},
        onNavigate&&React.createElement('button',{onClick:()=>onNavigate('home'),style:{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'6px 10px',color:M,fontSize:'0.75rem',cursor:'pointer'}},'← Geri'),
        React.createElement('span',{style:{fontSize:'1.5rem'}},'💬'),
        React.createElement('div',null,
          React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:'1.1rem',color:G}},room.name),
          React.createElement('div',{style:{fontSize:'0.62rem',color:M}},room.desc)
        )
      )
    ),
    // Room tabs
    React.createElement('div',{style:{display:'flex',gap:6,padding:'10px 12px',overflowX:'auto',borderBottom:'1px solid rgba(200,155,60,0.1)',flexShrink:0}},
      ROOMS.map(r=>
        React.createElement('button',{key:r.id,onClick:()=>setRoom(r),style:{flexShrink:0,padding:'6px 12px',borderRadius:20,border:`1px solid ${room.id===r.id?G:G+'33'}`,background:room.id===r.id?G+'22':'transparent',color:room.id===r.id?G:M,fontSize:'0.7rem',fontWeight:700,cursor:'pointer'}},r.name)
      )
    ),
    // Messages
    React.createElement('div',{style:{flex:1,overflowY:'auto',padding:'12px',paddingBottom:80}},
      loading&&React.createElement('div',{style:{textAlign:'center',color:M,padding:20}},'Yükleniyor...'),
      msgs.length===0&&!loading&&React.createElement('div',{style:{textAlign:'center',padding:48,color:M}},
        React.createElement('div',{style:{fontSize:'3rem',marginBottom:12}},'💬'),
        React.createElement('div',null,'Henüz mesaj yok — ilk sen yaz!')
      ),
      msgs.map((m,i)=>{
        const isMe = m.sender_id===profile?.id||m.sender_name===profile?.username;
        return React.createElement('div',{key:m.id||i,style:{display:'flex',justifyContent:isMe?'flex-end':'flex-start',marginBottom:8}},
          React.createElement('div',{style:{
            maxWidth:'75%',background:isMe?G+'22':S,
            border:`1px solid ${isMe?G+'44':'rgba(255,255,255,0.08)'}`,
            borderRadius:isMe?'16px 16px 4px 16px':'16px 16px 16px 4px',
            padding:'10px 12px'
          }},
            !isMe&&React.createElement('div',{style:{fontSize:'0.62rem',fontWeight:700,color:G,marginBottom:4}},m.sender_name||'Bilinmeyen'),
            React.createElement('div',{style:{fontSize:'0.85rem',color:T,lineHeight:1.4}},m.content),
            React.createElement('div',{style:{fontSize:'0.58rem',color:M,marginTop:4,textAlign:'right'}},timeAgo(m.created_at))
          )
        );
      }),
      React.createElement('div',{ref:endRef})
    ),
    // Input
    React.createElement('div',{style:{position:'fixed',bottom:68,left:0,right:0,padding:'10px 12px',background:'rgba(11,8,0,0.97)',borderTop:'1px solid rgba(200,155,60,0.15)',backdropFilter:'blur(12px)'}},
      React.createElement('div',{style:{display:'flex',gap:8}},
        React.createElement('input',{value:text,onChange:e=>setText(e.target.value),onKeyDown:e=>e.key==='Enter'&&!e.shiftKey&&send(),placeholder:`${room.name}'na mesaj yaz...`,style:{flex:1,padding:'10px 14px',borderRadius:12,border:'1px solid rgba(200,155,60,0.25)',background:S,color:T,fontSize:'0.85rem',outline:'none'}}),
        React.createElement('button',{onClick:send,disabled:!text.trim(),style:{padding:'10px 16px',borderRadius:12,border:'none',background:text.trim()?G:'rgba(255,255,255,0.1)',color:'#0F0800',fontWeight:700,fontSize:'0.9rem',cursor:text.trim()?'pointer':'not-allowed'}},'↑')
      )
    )
  );
};
