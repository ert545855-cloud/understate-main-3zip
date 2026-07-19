window.OyuncuAramaScreen = function({ profile, onNavigate, showNotif }) {
  const G='#C89B3C',BG='#0F0800',T='#F5EBD7',M='#A9A6A0',S='#2D1800',GR='#3E8C5A',R='#B8423C';
  const jwt = () => localStorage.getItem('us_jwt')||'';
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const search = async (q) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    const r = await fetch(`/api/players/search?q=${encodeURIComponent(q)}`,{headers:{Authorization:'Bearer '+jwt()}}).then(r=>r.json()).catch(()=>({success:false}));
    if (r.success) setResults(r.players||[]);
    setLoading(false);
  };

  const sendFriend = async (username) => {
    const r = await fetch('/api/arkadas/request',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+jwt()},body:JSON.stringify({username})}).then(r=>r.json()).catch(()=>({success:false}));
    showNotif&&showNotif(r.success?'✅ Arkadaşlık isteği gönderildi':r.message||'Hata',r.success?'success':'error');
  };

  const sendDM = (username) => { onNavigate&&onNavigate('dm'); };

  return React.createElement('div',{style:{minHeight:'100vh',background:BG,fontFamily:"'Inter',sans-serif",paddingBottom:80}},
    React.createElement('div',{style:{background:'linear-gradient(135deg,#1a0800,#2d1600)',borderBottom:'1px solid rgba(200,155,60,0.2)',padding:'14px 16px'}},
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:10}},
        onNavigate && React.createElement('button',{onClick:()=>onNavigate('home'),style:{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'6px 10px',color:M,fontSize:'0.75rem',cursor:'pointer'}},'← Geri'),
        React.createElement('span',{style:{fontSize:'1.5rem'}},'🔍'),
        React.createElement('div',null,
          React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:'1.1rem',color:G}},'Oyuncu Arama'),
          React.createElement('div',{style:{fontSize:'0.62rem',color:M}},'Username ile anlık arama')
        )
      )
    ),
    React.createElement('div',{style:{padding:'12px'}},
      React.createElement('div',{style:{position:'relative',marginBottom:16}},
        React.createElement('span',{style:{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:'1rem',pointerEvents:'none'}},'🔍'),
        React.createElement('input',{value:query,onChange:e=>search(e.target.value),placeholder:'Oyuncu adı ara...',autoFocus:true,
          style:{width:'100%',padding:'12px 12px 12px 40px',borderRadius:12,border:`2px solid ${query?G+'44':'rgba(255,255,255,0.1)'}`,background:S,color:T,fontSize:'0.9rem',boxSizing:'border-box',outline:'none',transition:'border-color 0.2s'}})
      ),
      loading && React.createElement('div',{style:{textAlign:'center',color:M,padding:20}},'Aranıyor...'),
      results.length>0 && React.createElement('div',null,
        results.map(p=>
          React.createElement('div',{key:p.id},
            React.createElement('div',{
              onClick:()=>setSelected(selected?.id===p.id?null:p),
              style:{background:selected?.id===p.id?G+'15':S,border:`1px solid ${selected?.id===p.id?G+'55':'rgba(200,155,60,0.15)'}`,borderRadius:12,padding:'12px 14px',marginBottom:8,cursor:'pointer',transition:'all 0.2s'}},
              React.createElement('div',{style:{display:'flex',alignItems:'center',gap:12}},
                React.createElement('div',{style:{width:42,height:42,borderRadius:'50%',background:`linear-gradient(135deg,${G},#A07828)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',fontWeight:900,color:'#0F0800',flexShrink:0}},p.username?.[0]?.toUpperCase()||'?'),
                React.createElement('div',{style:{flex:1}},
                  React.createElement('div',{style:{fontWeight:700,color:T,fontSize:'0.9rem'}},p.username),
                  React.createElement('div',{style:{fontSize:'0.65rem',color:M,marginTop:2}},`Seviye ${p.level||1}${p.active_title?' • '+p.active_title:''}`)
                ),
                React.createElement('span',{style:{color:M,fontSize:'0.9rem'}},selected?.id===p.id?'▲':'▼')
              )
            ),
            // Mini profil popup
            selected?.id===p.id && React.createElement('div',{style:{background:'rgba(45,24,0,0.95)',border:`1px solid ${G}33`,borderRadius:12,padding:'14px',marginBottom:8,marginTop:-4}},
              React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}},
                [{v:p.level||1,l:'Seviye',c:G},{v:p.score||0,l:'Skor',c:'#60A5FA'},{v:p.merit_points||0,l:'Liyakat',c:'#A78BFA'}].map(st=>
                  React.createElement('div',{key:st.l,style:{textAlign:'center',background:S,borderRadius:10,padding:'8px'}},
                    React.createElement('div',{style:{fontWeight:800,fontSize:'0.95rem',color:st.c}},st.v),
                    React.createElement('div',{style:{fontSize:'0.58rem',color:M}},st.l)
                  )
                )
              ),
              React.createElement('div',{style:{display:'flex',gap:8}},
                React.createElement('button',{onClick:()=>sendFriend(p.username),style:{flex:1,padding:'8px',borderRadius:9,border:`1px solid ${G}44`,background:G+'18',color:G,fontWeight:700,fontSize:'0.75rem',cursor:'pointer'}},'👫 Arkadaş Ekle'),
                React.createElement('button',{onClick:()=>sendDM(p.username),style:{flex:1,padding:'8px',borderRadius:9,border:`1px solid rgba(255,255,255,0.1)`,background:'rgba(255,255,255,0.04)',color:M,fontWeight:700,fontSize:'0.75rem',cursor:'pointer'}},'💬 Mesaj')
              )
            )
          )
        )
      ),
      query.length>=2 && results.length===0 && !loading && React.createElement('div',{style:{textAlign:'center',padding:48,color:M}},
        React.createElement('div',{style:{fontSize:'3rem',marginBottom:12}},'👤'),
        React.createElement('div',null,`"${query}" bulunamadı`)
      ),
      query.length<2 && React.createElement('div',{style:{textAlign:'center',padding:48,color:M}},
        React.createElement('div',{style:{fontSize:'3rem',marginBottom:12}},'🔍'),
        React.createElement('div',null,'En az 2 karakter gir')
      )
    )
  );
};
