// ═══════════════════════════════════════════════════════
// GAZETE SAYFASI
// ═══════════════════════════════════════════════════════
function NewspaperPage({ profile, setProfile, showNotif }) {
  const [papers, setPapers] = useLs('newspapers', []);
  const [tab, setTab] = useState('read');
  const [form, setForm] = useState({title:'',content:'',category:'Gündem'});
  const { dark } = useTheme();
  const bg = dark ? '#0F172A' : '#F8FAFC';
  const cu = profile || {};
  const updateUser = (upd) => {
    const next = {...cu,...upd};
    setProfile(next);
    localStorage.setItem('rep_userProfile', JSON.stringify(next));
    try { const u2 = JSON.parse(localStorage.getItem('rep_users')||'[]'); localStorage.setItem('rep_users', JSON.stringify(u2.map(u => u.id===next.id ? next : u))); } catch{}
  };
  const CATS = ['Gündem','Ekonomi','Siyaset','Spor','Suç','Özel'];
  const [gameEvents, setGameEvents] = useState(() => { try { return JSON.parse(localStorage.getItem('rep_gameEvents')||'[]'); } catch { return []; } });
  const [liveNow, setLiveNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      setLiveNow(Date.now());
      try { setGameEvents(JSON.parse(localStorage.getItem('rep_gameEvents')||'[]')); } catch{}
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const timeAgoShort = (ts) => {
    const d = Date.now() - ts;
    if (d < 60000) return `${Math.floor(d/1000)}sn`;
    if (d < 3600000) return `${Math.floor(d/60000)}dk`;
    if (d < 86400000) return `${Math.floor(d/3600000)}sa`;
    return `${Math.floor(d/86400000)}g`;
  };

  const publish = () => {
    if (!form.title.trim()||!form.content.trim()) { showNotif('❌ Başlık ve içerik gerekli!','error'); return; }
    if ((cu.money||0)<5000) { showNotif('❌ Yayın ücreti: ₺5,000','error'); return; }
    const paper = {id:Date.now(),title:form.title.trim(),content:form.content.trim(),category:form.category,author:cu.username,date:new Date().toLocaleDateString('tr-TR'),likes:0,views:0};
    setPapers(prev=>[paper,...prev].slice(0,100));
    updateUser({money:(cu.money||0)-5000,meritPoints:(cu.meritPoints||0)+5});
    setForm({title:'',content:'',category:'Gündem'});
    setTab('read');
    showNotif('✅ Makale yayınlandı! +5🏅','success');
  };

  const likeArticle = (id) => {
    const paper = papers.find(p=>p.id===id);
    setPapers(prev=>prev.map(p=>p.id===id?{...p,likes:(p.likes||0)+1}:p));
    if (paper?.author) {
      try {
        const inf = JSON.parse(localStorage.getItem('rep_mediaInfluence')||'{}');
        inf[paper.author] = (inf[paper.author]||0) + 1;
        localStorage.setItem('rep_mediaInfluence', JSON.stringify(inf));
      } catch{}
    }
  };

  return (
    <div style={{padding:'1rem',background:bg,minHeight:'100%'}}>
      <div style={{fontFamily:"'Syne',sans-serif",fontSize:'1.3rem',fontWeight:900,color:'#C9A227',marginBottom:'1rem'}}>📰 Gazete & Medya</div>
      <div style={{display:'flex',gap:'0.4rem',marginBottom:'1rem'}}>
        {[{k:'read',l:'📰 Haberler'},{k:'live',l:'🔴 Canlı'},{k:'eco',l:'📊 Bülten'},{k:'write',l:'✍️ Yaz'},{k:'influence',l:'🏆 Yazarlar'}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{padding:'0.4rem 1rem',borderRadius:'2rem',border:`1px solid ${tab===t.k?'#C9A227':'rgba(255,255,255,0.12)'}`,background:tab===t.k?'rgba(96,165,250,0.15)':'transparent',color:tab===t.k?'#C9A227':'#999',cursor:'pointer',fontWeight:tab===t.k?700:400,fontSize:'0.83rem',fontFamily:'inherit'}}>{t.l}</button>
        ))}
      </div>

      {tab==='live'&&<div>
        <div style={{background:'linear-gradient(135deg,rgba(194,75,67,0.1),rgba(11,21,39,0.97))',border:'1px solid rgba(194,75,67,0.25)',borderRadius:'12px',padding:'0.75rem',marginBottom:'0.75rem',display:'flex',alignItems:'center',gap:'0.5rem'}}>
          <div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#C24B43',animation:'pulse 1s infinite',flexShrink:0}}/>
          <div>
            <div style={{fontSize:'0.75rem',fontWeight:800,color:'#E08C87'}}>CANLI HABER AKIŞI</div>
            <div style={{fontSize:'0.62rem',color:'#8893A1'}}>Oyundaki tüm olaylar anlık olarak burada görünür. 5sn'de bir güncellenir.</div>
          </div>
        </div>
        {gameEvents.length===0&&<div style={{textAlign:'center',padding:'3rem 1rem',color:'#3B4E63'}}>
          <div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>📡</div>
          <div style={{fontSize:'0.85rem'}}>Henüz canlı olay yok.</div>
          <div style={{fontSize:'0.72rem',color:'#2A3A4A',marginTop:'0.25rem'}}>Çete savaşları, seçimler, fabrikalar başladıkça haberler burada görünecek.</div>
        </div>}
        {[...gameEvents].reverse().slice(0,40).map((ev,i)=>{
          const catColor = ev.category==='çete'?'#C24B43':ev.category==='siyaset'?'#8B5CF6':ev.category==='ekonomi'?'#4C9A6B':'#C9A227';
          return (
            <div key={ev.id||i} style={{display:'flex',gap:'0.65rem',padding:'0.65rem 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <div style={{fontSize:'1.5rem',width:'32px',textAlign:'center',flexShrink:0,lineHeight:1.2}}>{ev.icon||'📢'}</div>
              <div style={{flex:1}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'0.4rem'}}>
                  <div style={{fontWeight:700,fontSize:'0.83rem',color:'#EDE7DA',lineHeight:1.3}}>{ev.title}</div>
                  <div style={{fontSize:'0.62rem',color:'#4A5A6A',flexShrink:0,marginTop:'2px'}}>{timeAgoShort(ev.timestamp||ev.ts||Date.now())}</div>
                </div>
                {ev.description&&<div style={{fontSize:'0.72rem',color:'#7A8A9A',marginTop:'3px',lineHeight:1.4}}>{ev.description}</div>}
                {ev.category&&<span style={{display:'inline-block',marginTop:'4px',background:`${catColor}14`,border:`1px solid ${catColor}30`,borderRadius:'4px',padding:'1px 6px',fontSize:'0.6rem',color:catColor,fontWeight:700}}>{ev.category}</span>}
              </div>
            </div>
          );
        })}
      </div>}

      {tab==='read'&&<div>
        {papers.filter(p=>!p.isAuto).length===0&&<div style={{textAlign:'center',padding:'2rem',color:'#555'}}>
          <div style={{fontSize:'3rem',marginBottom:'0.5rem'}}>📰</div>
          Henüz oyuncu haberi yok. İlk makaleyi sen yaz!
        </div>}
        {papers.filter(p=>!p.isAuto).map(p=>(
          <div key={p.id} style={{background:'rgba(237,231,218,0.02)',border:'1px solid rgba(237,231,218,0.08)',borderRadius:'12px',padding:'1rem',marginBottom:'0.75rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.4rem'}}>
              <div style={{flex:1}}><div style={{fontWeight:700,fontSize:'0.95rem',color:'#EDE7DA',marginBottom:'0.15rem',lineHeight:1.3}}>{p.title}</div><div style={{fontSize:'0.68rem',color:'#999'}}>{p.author} · {p.date} · <span style={{background:'rgba(96,165,250,0.1)',color:'#C9A227',padding:'1px 6px',borderRadius:'4px'}}>{p.category}</span></div></div>
            </div>
            <div style={{fontSize:'0.82rem',color:'#bbb',lineHeight:1.6,marginBottom:'0.5rem'}}>{p.content}</div>
            <div style={{display:'flex',gap:'0.5rem'}}>
              <button onClick={()=>likeArticle(p.id)} style={{padding:'0.25rem 0.7rem',background:'rgba(194,75,67,0.08)',border:'1px solid rgba(194,75,67,0.2)',borderRadius:'6px',color:'#C24B43',cursor:'pointer',fontSize:'0.78rem',fontFamily:'inherit'}}>❤️ {p.likes||0}</button>
              <span style={{fontSize:'0.72rem',color:'#555',lineHeight:'26px'}}>👁 {(p.views||0)+1} okuma</span>
            </div>
          </div>
        ))}
      </div>}

      {tab==='eco'&&<div>
        <div style={{background:'linear-gradient(135deg,rgba(76,154,107,0.08),rgba(76,154,107,0.03))',border:'1px solid rgba(76,154,107,0.2)',borderRadius:'12px',padding:'0.7rem',marginBottom:'0.75rem'}}>
          <div style={{fontWeight:700,color:'#4C9A6B',fontSize:'0.8rem',marginBottom:'0.2rem'}}>📊 Ekonomi Bülteni — Otomatik Haberler</div>
          <div style={{fontSize:'0.68rem',color:'#8893A1',lineHeight:1.4}}>Enflasyon, faiz, döviz ve piyasa verilerine göre her 5 dakikada bir otomatik oluşturulan ekonomi haberleri.</div>
        </div>
        {papers.filter(p=>p.isAuto).length===0&&<div style={{textAlign:'center',padding:'2rem',color:'#555',fontSize:'0.82rem'}}>Henüz otomatik haber üretilmedi. Bir süre bekleyin...</div>}
        {papers.filter(p=>p.isAuto).map(p=>(
          <div key={p.id} style={{background:'rgba(76,154,107,0.04)',border:'1px solid rgba(76,154,107,0.14)',borderRadius:'12px',padding:'0.9rem',marginBottom:'0.6rem'}}>
            <div style={{fontWeight:700,fontSize:'0.88rem',color:'#EDE7DA',marginBottom:'0.3rem',lineHeight:1.35}}>{p.title}</div>
            <div style={{fontSize:'0.65rem',color:'#8893A1',marginBottom:'0.5rem',display:'flex',gap:'0.5rem',alignItems:'center'}}>
              <span style={{background:'rgba(76,154,107,0.12)',color:'#4C9A6B',padding:'1px 7px',borderRadius:'4px',fontWeight:700}}>{p.category}</span>
              <span>{p.author}</span>
              <span>·</span>
              <span>{p.date}</span>
            </div>
            <div style={{fontSize:'0.78rem',color:'#8899AA',lineHeight:1.55,marginBottom:'0.4rem'}}>{p.content}</div>
            <div style={{fontSize:'0.65rem',color:'#8893A1'}}>👁 {p.views||0} okuma · 🤖 Yapay Zeka Üretimi</div>
          </div>
        ))}
      </div>}

      {tab==='influence'&&<div>
        <div style={{background:'rgba(96,165,250,0.06)',border:'1px solid rgba(96,165,250,0.15)',borderRadius:'12px',padding:'0.75rem',marginBottom:'0.75rem'}}>
          <div style={{fontSize:'0.68rem',color:'#C9A227',fontWeight:700,textTransform:'uppercase',marginBottom:'0.4rem'}}>📡 Etki Puanı Sıralaması</div>
          <div style={{fontSize:'0.72rem',color:'#8893A1',lineHeight:1.4}}>Makalelerine beğeni aldıkça etki puanın artar. Yüksek etki puanı → daha fazla siyasi güç.</div>
        </div>
        {(()=>{
          const inf = (() => { try { return JSON.parse(localStorage.getItem('rep_mediaInfluence')||'{}'); } catch{return {};} })();
          const myInf = inf[cu.username] || 0;
          const sorted = Object.entries(inf).sort((a,b)=>b[1]-a[1]).slice(0,10);
          return (
            <div>
              <div style={{background:'rgba(201,162,39,0.07)',border:'1px solid rgba(201,162,39,0.2)',borderRadius:'12px',padding:'0.7rem',marginBottom:'0.6rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:'0.8rem',color:'#EDE7DA',fontWeight:700}}>📡 Etki Puanım</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:800,color:'#C9A227',fontSize:'1.1rem'}}>{myInf}</div>
              </div>
              {sorted.length === 0 && <div style={{textAlign:'center',color:'#8893A1',padding:'1.5rem',fontSize:'0.82rem'}}>Henüz kimse beğeni almadı.</div>}
              {sorted.map(([author, pts], i) => (
                <div key={author} style={{display:'flex',alignItems:'center',gap:'0.65rem',padding:'0.55rem 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                  <div style={{minWidth:'22px',textAlign:'center',fontWeight:800,color:i===0?'#C9A227':i===1?'#C0C0C0':i===2?'#CD7F32':'#8893A1',fontSize:'0.82rem'}}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</div>
                  <div style={{flex:1,fontWeight:700,color:author===cu.username?'#C9A227':'#EDE7DA',fontSize:'0.85rem'}}>{author}{author===cu.username?' (Sen)':''}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:'#C9A227',fontSize:'0.88rem'}}>📡 {pts}</div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>}

      {tab==='write'&&<div>
        <div style={{background:'rgba(96,165,250,0.05)',border:'1px solid rgba(96,165,250,0.2)',borderRadius:'12px',padding:'1rem',marginBottom:'0.75rem'}}>
          <div style={{fontSize:'0.8rem',color:'#C9A227',marginBottom:'0.5rem',fontWeight:700}}>📝 Makale Yayınla (₺5,000)</div>
          <div style={{marginBottom:'0.5rem'}}>
            <div style={{fontSize:'0.72rem',color:'#999',marginBottom:'0.25rem'}}>Kategori</div>
            <div style={{display:'flex',gap:'0.3rem',flexWrap:'wrap'}}>
              {CATS.map(c=><button key={c} onClick={()=>setForm(prev=>({...prev,category:c}))} style={{padding:'0.25rem 0.6rem',borderRadius:'1rem',border:`1px solid ${form.category===c?'#C9A227':'rgba(255,255,255,0.12)'}`,background:form.category===c?'rgba(96,165,250,0.15)':'transparent',color:form.category===c?'#C9A227':'#999',cursor:'pointer',fontSize:'0.75rem',fontFamily:'inherit'}}>{c}</button>)}
            </div>
          </div>
          <input value={form.title} onChange={e=>setForm(prev=>({...prev,title:e.target.value}))} placeholder="Makale başlığı..." style={{width:'100%',padding:'0.6rem 0.75rem',background:'rgba(237,231,218,0.03)',border:'1px solid rgba(237,231,218,0.1)',borderRadius:'8px',color:'#EDE7DA',fontSize:'0.9rem',outline:'none',marginBottom:'0.5rem',fontFamily:'inherit'}} />
          <textarea value={form.content} onChange={e=>setForm(prev=>({...prev,content:e.target.value}))} placeholder="Makale içeriği... (min 50 karakter)" rows={5} style={{width:'100%',padding:'0.6rem 0.75rem',background:'rgba(237,231,218,0.03)',border:'1px solid rgba(237,231,218,0.1)',borderRadius:'8px',color:'#EDE7DA',fontSize:'0.85rem',outline:'none',resize:'vertical',fontFamily:'inherit',marginBottom:'0.5rem'}} />
          <button onClick={publish} style={{width:'100%',padding:'0.65rem',background:'rgba(96,165,250,0.15)',border:'1px solid rgba(96,165,250,0.3)',borderRadius:'8px',color:'#C9A227',cursor:'pointer',fontWeight:700,fontFamily:'inherit',fontSize:'0.9rem'}}>📰 Yayınla (₺5,000)</button>
        </div>
      </div>}
    </div>
  );
}

