window.ArkadasListesiScreen = function({ profile, onNavigate, showNotif }) {
  const G='#C89B3C',BG='#0F0800',T='#F5EBD7',M='#A9A6A0',S='#2D1800',GR='#3E8C5A',R='#B8423C';
  const jwt = () => localStorage.getItem('us_jwt')||'';
  const [friends, setFriends] = React.useState([]);
  const [requests, setRequests] = React.useState([]);
  const [tab, setTab] = React.useState('liste');
  const [searchUser, setSearchUser] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const [fr, rq] = await Promise.all([
      fetch('/api/arkadas',{headers:{Authorization:'Bearer '+jwt()}}).then(r=>r.json()).catch(()=>({success:false})),
      fetch('/api/arkadas/requests',{headers:{Authorization:'Bearer '+jwt()}}).then(r=>r.json()).catch(()=>({success:false})),
    ]);
    if (fr.success) setFriends(fr.friends||[]);
    if (rq.success) setRequests(rq.requests||[]);
    setLoading(false);
  };

  const sendRequest = async () => {
    if (!searchUser.trim()) return;
    const r = await fetch('/api/arkadas/request',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+jwt()},body:JSON.stringify({username:searchUser.trim()})}).then(r=>r.json()).catch(()=>({success:false}));
    if (r.success) { showNotif&&showNotif('✅ İstek gönderildi','success'); setSearchUser(''); }
    else showNotif&&showNotif(r.message||'Hata','error');
  };

  const respond = async (id, action) => {
    const r = await fetch('/api/arkadas/respond',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+jwt()},body:JSON.stringify({friendship_id:id,action})}).then(r=>r.json()).catch(()=>({success:false}));
    if (r.success) { showNotif&&showNotif(action==='accept'?'✅ Arkadaş eklendi':'İstek reddedildi','success'); loadAll(); }
  };

  return React.createElement('div',{style:{minHeight:'100vh',background:BG,fontFamily:"'Inter',sans-serif",paddingBottom:80}},
    React.createElement('div',{style:{background:'linear-gradient(135deg,#1a0800,#2d1600)',borderBottom:'1px solid rgba(200,155,60,0.2)',padding:'14px 16px'}},
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:10}},
        onNavigate && React.createElement('button',{onClick:()=>onNavigate('home'),style:{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'6px 10px',color:M,fontSize:'0.75rem',cursor:'pointer'}},'← Geri'),
        React.createElement('span',{style:{fontSize:'1.5rem'}},'👫'),
        React.createElement('div',null,
          React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:'1.1rem',color:G}},'Arkadaşlar'),
          React.createElement('div',{style:{fontSize:'0.62rem',color:M}},`${friends.length} arkadaş • ${requests.length} bekleyen istek`)
        )
      )
    ),
    React.createElement('div',{style:{padding:'12px'}},
      // Arama kutusu
      React.createElement('div',{style:{display:'flex',gap:8,marginBottom:12}},
        React.createElement('input',{value:searchUser,onChange:e=>setSearchUser(e.target.value),onKeyDown:e=>e.key==='Enter'&&sendRequest(),placeholder:'Oyuncu adı ile arkadaş ekle...',style:{flex:1,padding:'10px',borderRadius:10,border:'1px solid rgba(200,155,60,0.25)',background:S,color:T,fontSize:'0.85rem'}}),
        React.createElement('button',{onClick:sendRequest,style:{padding:'10px 14px',borderRadius:10,border:'none',background:G,color:'#0F0800',fontWeight:700,fontSize:'0.8rem',cursor:'pointer'}},'+ Ekle')
      ),
      // Tabs
      React.createElement('div',{style:{display:'flex',gap:6,marginBottom:12}},
        [{id:'liste',l:`👫 Arkadaşlar (${friends.length})`},{id:'istekler',l:`📬 İstekler (${requests.length})`}].map(t=>
          React.createElement('button',{key:t.id,onClick:()=>setTab(t.id),style:{flex:1,padding:'8px',borderRadius:10,border:`2px solid ${tab===t.id?G:G+'22'}`,background:tab===t.id?G+'18':'transparent',color:tab===t.id?G:M,fontWeight:700,fontSize:'0.75rem',cursor:'pointer'}},t.l)
        )
      ),
      loading
        ? React.createElement('div',{style:{textAlign:'center',color:M,padding:40}},'Yükleniyor...')
        : tab==='liste'
          ? friends.length===0
            ? React.createElement('div',{style:{textAlign:'center',padding:48,color:M}},
                React.createElement('div',{style:{fontSize:'3rem',marginBottom:12}},'👥'),
                React.createElement('div',null,'Henüz arkadaşın yok'),
                React.createElement('div',{style:{fontSize:'0.72rem',marginTop:6}},'Yukarıdan oyuncu adı ile istek gönder')
              )
            : friends.map(f=>
                React.createElement('div',{key:f.id,style:{background:S,border:'1px solid rgba(200,155,60,0.15)',borderRadius:12,padding:'12px 14px',marginBottom:8,display:'flex',alignItems:'center',gap:12}},
                  React.createElement('div',{style:{width:40,height:40,borderRadius:'50%',background:`linear-gradient(135deg,${G},#A07828)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',fontWeight:900,color:'#0F0800'}},f.username?.[0]?.toUpperCase()||'?'),
                  React.createElement('div',{style:{flex:1}},
                    React.createElement('div',{style:{fontWeight:700,color:T}},f.username),
                    React.createElement('div',{style:{fontSize:'0.62rem',color:M}},`Seviye ${f.level||1}${f.active_title?' • '+f.active_title:''}`)
                  ),
                  React.createElement('button',{onClick:()=>onNavigate&&onNavigate('dm'),style:{padding:'5px 12px',borderRadius:9,border:`1px solid ${G}44`,background:'transparent',color:G,fontSize:'0.72rem',cursor:'pointer'}},'💬')
                )
              )
          : requests.length===0
            ? React.createElement('div',{style:{textAlign:'center',padding:48,color:M}},'Bekleyen istek yok')
            : requests.map(r=>
                React.createElement('div',{key:r.id,style:{background:S,border:'1px solid rgba(200,155,60,0.15)',borderRadius:12,padding:'12px 14px',marginBottom:8,display:'flex',alignItems:'center',gap:12}},
                  React.createElement('div',{style:{width:40,height:40,borderRadius:'50%',background:'rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem'}},r.username?.[0]?.toUpperCase()||'?'),
                  React.createElement('div',{style:{flex:1}},
                    React.createElement('div',{style:{fontWeight:700,color:T}},r.username),
                    React.createElement('div',{style:{fontSize:'0.62rem',color:M}},`Seviye ${r.level||1}`)
                  ),
                  React.createElement('div',{style:{display:'flex',gap:6}},
                    React.createElement('button',{onClick:()=>respond(r.id,'accept'),style:{padding:'6px 12px',borderRadius:8,border:'none',background:GR,color:'#fff',fontWeight:700,fontSize:'0.72rem',cursor:'pointer'}},'✅'),
                    React.createElement('button',{onClick:()=>respond(r.id,'reject'),style:{padding:'6px 12px',borderRadius:8,border:'none',background:R,color:'#fff',fontWeight:700,fontSize:'0.72rem',cursor:'pointer'}},'❌')
                  )
                )
              )
    )
  );
};
