window.FermanScreen = function({ profile, onNavigate, showNotif }) {
  const G='#C89B3C',BG='#0F0800',T='#F5EBD7',M='#A9A6A0',S='#2D1800',GR='#3E8C5A',R='#B8423C';
  const jwt = () => localStorage.getItem('us_jwt')||'';
  const [fermanlar, setFermanlar] = React.useState([]);
  const [tab, setTab] = React.useState('liste');
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [category, setCategory] = React.useState('genel');
  const [sending, setSending] = React.useState(false);
  const [reactions, setReactions] = React.useState({});

  React.useEffect(() => { loadFermanlar(); }, []);

  const loadFermanlar = async () => {
    const r = await fetch('/api/ferman').then(r=>r.json()).catch(()=>({success:false}));
    if (r.success) setFermanlar(r.fermanlar||[]);
  };

  const send = async () => {
    if (!title.trim()||!content.trim()) { showNotif&&showNotif('Başlık ve içerik gerekli','error'); return; }
    setSending(true);
    const r = await fetch('/api/ferman',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+jwt()},body:JSON.stringify({title,content,category})}).then(r=>r.json()).catch(()=>({success:false}));
    if (r.success) {
      showNotif&&showNotif('📜 Ferman yayınlandı!','success');
      localStorage.setItem('rep_hasFerman','true');
      setTitle(''); setContent(''); setTab('liste');
      loadFermanlar();
    } else showNotif&&showNotif(r.message||'Hata','error');
    setSending(false);
  };

  const react = async (id, reaction) => {
    const r = await fetch(`/api/ferman/${id}/react`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+jwt()},body:JSON.stringify({reaction})}).then(r=>r.json()).catch(()=>({success:false}));
    if (r.success) {
      setFermanlar(prev=>prev.map(f=>f.id===id?{...f,likes:r.likes,dislikes:r.dislikes}:f));
      setReactions(p=>({...p,[id]:reaction}));
    }
  };

  const CATS = [{v:'genel',l:'Genel'},{v:'askeriye',l:'Askeriye'},{v:'ekonomi',l:'Ekonomi'},{v:'adalet',l:'Adalet'},{v:'din',l:'Din'}];

  return React.createElement('div',{style:{minHeight:'100vh',background:BG,fontFamily:"'Inter',sans-serif",paddingBottom:80}},
    React.createElement('div',{style:{background:'linear-gradient(135deg,#1a0800,#2d1600)',borderBottom:'1px solid rgba(200,155,60,0.2)',padding:'14px 16px'}},
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:10}},
        onNavigate && React.createElement('button',{onClick:()=>onNavigate('home'),style:{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'6px 10px',color:M,fontSize:'0.75rem',cursor:'pointer'}},'← Geri'),
        React.createElement('span',{style:{fontSize:'1.5rem'}},'📜'),
        React.createElement('div',{style:{flex:1}},
          React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:'1.1rem',color:G}},'Ferman Divanı'),
          React.createElement('div',{style:{fontSize:'0.62rem',color:M}},'Padişah fermanları halkın sesi')
        )
      )
    ),
    React.createElement('div',{style:{padding:'12px'}},
      // Tabs
      React.createElement('div',{style:{display:'flex',gap:6,marginBottom:12}},
        [{id:'liste',l:'📜 Fermanlar'},{id:'yayinla',l:'✍️ Yayınla'}].map(t=>
          React.createElement('button',{key:t.id,onClick:()=>setTab(t.id),style:{flex:1,padding:'9px',borderRadius:10,border:`2px solid ${tab===t.id?G:G+'22'}`,background:tab===t.id?G+'18':'transparent',color:tab===t.id?G:M,fontWeight:700,fontSize:'0.78rem',cursor:'pointer'}},t.l)
        )
      ),
      tab==='liste' && React.createElement('div',null,
        fermanlar.length===0
          ? React.createElement('div',{style:{textAlign:'center',padding:48,color:M}},
              React.createElement('div',{style:{fontSize:'3rem',marginBottom:12}},'📜'),
              React.createElement('div',null,'Henüz ferman yayınlanmamış')
            )
          : fermanlar.map(f=>{
              const myRxn = reactions[f.id];
              const total = (f.likes||0)+(f.dislikes||0)||1;
              const likePct = Math.round((f.likes||0)/total*100);
              return React.createElement('div',{key:f.id,style:{background:S,border:'1px solid rgba(200,155,60,0.15)',borderRadius:14,padding:'14px',marginBottom:10}},
                React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}},
                  React.createElement('div',null,
                    React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontWeight:800,fontSize:'0.9rem',color:T}},f.title),
                    React.createElement('div',{style:{fontSize:'0.62rem',color:M,marginTop:2}},`${f.author_name||'Anonim'} • ${f.category||'genel'}`)
                  ),
                  React.createElement('span',{style:{fontSize:'0.6rem',color:M}},new Date(f.created_at).toLocaleDateString('tr-TR'))
                ),
                React.createElement('div',{style:{fontSize:'0.82rem',color:M,lineHeight:1.6,marginBottom:10}},f.content),
                // Satisfaction bar
                React.createElement('div',{style:{height:4,borderRadius:2,background:'rgba(255,255,255,0.06)',overflow:'hidden',marginBottom:8}},
                  React.createElement('div',{style:{height:'100%',width:`${likePct}%`,background:GR,borderRadius:2,transition:'width 0.4s'}})
                ),
                React.createElement('div',{style:{display:'flex',gap:8,alignItems:'center'}},
                  React.createElement('button',{onClick:()=>react(f.id,'like'),style:{padding:'5px 12px',borderRadius:20,border:`1px solid ${myRxn==='like'?GR:GR+'33'}`,background:myRxn==='like'?GR+'22':'transparent',color:myRxn==='like'?GR:M,fontSize:'0.72rem',fontWeight:700,cursor:'pointer'}},`👍 ${f.likes||0}`),
                  React.createElement('button',{onClick:()=>react(f.id,'dislike'),style:{padding:'5px 12px',borderRadius:20,border:`1px solid ${myRxn==='dislike'?R:R+'33'}`,background:myRxn==='dislike'?R+'22':'transparent',color:myRxn==='dislike'?R:M,fontSize:'0.72rem',fontWeight:700,cursor:'pointer'}},`👎 ${f.dislikes||0}`),
                  React.createElement('span',{style:{fontSize:'0.62rem',color:M,marginLeft:'auto'}},`%${likePct} memnuniyet`)
                )
              );
            })
      ),
      tab==='yayinla' && React.createElement('div',null,
        React.createElement('div',{style:{background:S,border:'1px solid rgba(200,155,60,0.15)',borderRadius:14,padding:'16px'}},
          React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontSize:'0.9rem',color:G,fontWeight:800,marginBottom:14}},'📜 Yeni Ferman Yayınla'),
          React.createElement('input',{value:title,onChange:e=>setTitle(e.target.value),placeholder:'Ferman başlığı...',style:{width:'100%',padding:'10px',borderRadius:9,border:'1px solid rgba(200,155,60,0.25)',background:'#1A0E00',color:T,fontSize:'0.85rem',marginBottom:8,boxSizing:'border-box'}}),
          React.createElement('select',{value:category,onChange:e=>setCategory(e.target.value),style:{width:'100%',padding:'10px',borderRadius:9,border:'1px solid rgba(200,155,60,0.25)',background:'#1A0E00',color:T,fontSize:'0.85rem',marginBottom:8,boxSizing:'border-box'}},
            CATS.map(c=>React.createElement('option',{key:c.v,value:c.v},c.l))
          ),
          React.createElement('textarea',{value:content,onChange:e=>setContent(e.target.value),placeholder:'Ferman içeriği...',rows:5,style:{width:'100%',padding:'10px',borderRadius:9,border:'1px solid rgba(200,155,60,0.25)',background:'#1A0E00',color:T,fontSize:'0.82rem',marginBottom:12,boxSizing:'border-box',resize:'vertical'}}),
          React.createElement('button',{onClick:send,disabled:sending,style:{width:'100%',padding:'12px',borderRadius:10,border:'none',background:`linear-gradient(135deg,${G},#A07828)`,color:'#0F0800',fontWeight:800,fontSize:'0.9rem',cursor:sending?'not-allowed':'pointer'}},
            sending?'⏳ Yayınlanıyor...':'📜 Fermanı Yayınla')
        )
      )
    )
  );
};
