window.UnvanSistemiScreen = function({ profile, onNavigate, showNotif }) {
  const G='#C89B3C',BG='#0F0800',T='#F5EBD7',M='#A9A6A0',S='#2D1800',GR='#3E8C5A',P='#A78BFA';
  const jwt = () => localStorage.getItem('us_jwt')||'';
  const [titles, setTitles] = React.useState([]);
  const [earned, setEarned] = React.useState([]);
  const [active, setActive] = React.useState(profile?.active_title||null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/unvan/list',{headers:{Authorization:'Bearer '+jwt()}})
      .then(r=>r.json()).then(d=>{
        if (d.success) { setTitles(d.titles); setEarned(d.earned); setActive(d.activeTitle); }
      }).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const equip = async (titleId) => {
    const r = await fetch('/api/unvan/equip',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+jwt()},body:JSON.stringify({title_id:titleId})}).then(r=>r.json()).catch(()=>({success:false}));
    if (r.success) { setActive(titleId); showNotif && showNotif('✅ Unvan güncellendi','success'); }
    else showNotif && showNotif(r.message||'Hata','error');
  };

  const earnedList = titles.filter(t=>earned.includes(t.id));
  const lockedList = titles.filter(t=>!earned.includes(t.id));

  return React.createElement('div',{style:{minHeight:'100vh',background:BG,fontFamily:"'Inter',sans-serif",paddingBottom:80}},
    React.createElement('div',{style:{background:'linear-gradient(135deg,#1a0800,#2d1600)',borderBottom:'1px solid rgba(200,155,60,0.2)',padding:'14px 16px'}},
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:10}},
        onNavigate && React.createElement('button',{onClick:()=>onNavigate('home'),style:{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'6px 10px',color:M,fontSize:'0.75rem',cursor:'pointer'}},'← Geri'),
        React.createElement('span',{style:{fontSize:'1.5rem'}},'🎖️'),
        React.createElement('div',null,
          React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:'1.1rem',color:G}},'Unvan Sistemi'),
          React.createElement('div',{style:{fontSize:'0.62rem',color:M}},`${earnedList.length}/${titles.length} unvan kazanıldı`)
        )
      )
    ),
    React.createElement('div',{style:{padding:'12px'}},
      // Aktif unvan
      React.createElement('div',{style:{background:`linear-gradient(135deg,${G}20,${S})`,border:`2px solid ${G}44`,borderRadius:14,padding:'16px',marginBottom:14,textAlign:'center'}},
        React.createElement('div',{style:{fontSize:'0.62rem',color:M,marginBottom:6}},'AKTİF UNVANIN'),
        (() => {
          const t = titles.find(t=>t.id===active);
          return t
            ? React.createElement(React.Fragment,null,
                React.createElement('div',{style:{fontSize:'2.5rem',marginBottom:4}},t.emoji),
                React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontSize:'1.2rem',fontWeight:900,color:G}},t.label)
              )
            : React.createElement('div',{style:{color:M,fontSize:'0.85rem'}},'Henüz unvan seçilmedi');
        })()
      ),
      // Kazanılanlar
      loading
        ? React.createElement('div',{style:{textAlign:'center',color:M,padding:40}},'Yükleniyor...')
        : React.createElement(React.Fragment,null,
            earnedList.length > 0 && React.createElement('div',null,
              React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontSize:'0.72rem',fontWeight:700,color:G,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8,display:'flex',alignItems:'center',gap:8}},
                '✅ Kazanılan Unvanlar',
                React.createElement('div',{style:{flex:1,height:1,background:'linear-gradient(90deg,rgba(200,155,60,0.3),transparent)'}})
              ),
              earnedList.map(t=>
                React.createElement('div',{key:t.id,style:{
                  background: active===t.id ? `${G}18` : S,
                  border:`1px solid ${active===t.id?G+'55':'rgba(200,155,60,0.15)'}`,
                  borderRadius:12,padding:'12px 14px',marginBottom:8,
                  display:'flex',alignItems:'center',gap:12
                }},
                  React.createElement('span',{style:{fontSize:'1.6rem'}},t.emoji),
                  React.createElement('div',{style:{flex:1}},
                    React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontWeight:800,fontSize:'0.9rem',color:active===t.id?G:T}},t.label),
                    React.createElement('div',{style:{fontSize:'0.62rem',color:M,marginTop:2}},t.label)
                  ),
                  active===t.id
                    ? React.createElement('span',{style:{fontSize:'0.7rem',color:G,fontWeight:700}},'✨ Aktif')
                    : React.createElement('button',{onClick:()=>equip(t.id),style:{padding:'6px 14px',borderRadius:9,border:'none',background:G,color:'#0F0800',fontWeight:700,fontSize:'0.72rem',cursor:'pointer'}},'Tak')
                )
              )
            ),
            lockedList.length > 0 && React.createElement('div',{style:{marginTop:14}},
              React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontSize:'0.72rem',fontWeight:700,color:M,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8,display:'flex',alignItems:'center',gap:8}},
                '🔒 Kilitli Unvanlar',
                React.createElement('div',{style:{flex:1,height:1,background:'linear-gradient(90deg,rgba(169,166,160,0.2),transparent)'}})
              ),
              lockedList.map(t=>
                React.createElement('div',{key:t.id,style:{
                  background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',
                  borderRadius:12,padding:'12px 14px',marginBottom:8,
                  display:'flex',alignItems:'center',gap:12,opacity:0.55
                }},
                  React.createElement('span',{style:{fontSize:'1.6rem',filter:'grayscale(100%)'}},t.emoji),
                  React.createElement('div',{style:{flex:1}},
                    React.createElement('div',{style:{fontWeight:700,fontSize:'0.9rem',color:M}},t.label),
                    React.createElement('div',{style:{fontSize:'0.62rem',color:M+'88',marginTop:2}},
                      t.req==='level'?`Seviye ${t.val} gerekli`:t.req==='money'?`${t.val.toLocaleString('tr-TR')} Sikke gerekli`:`${t.val} ${t.req} gerekli`
                    )
                  ),
                  React.createElement('span',{style:{fontSize:'1.1rem'}},'🔒')
                )
              )
            )
          )
    )
  );
};
