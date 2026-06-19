// ═══════════════════════════════════════════════════════
// KRİZ YÖNETİMİ SAYFASI
// ═══════════════════════════════════════════════════════
function CrisisPage({ profile, setProfile, showNotif }) {
  const [crises, setCrises] = useLs('activeCrises', []);
  const [crisisLog, setCrisisLog] = useLs('crisisLog', []);
  const { dark } = useTheme();
  const bg = dark ? '#0F172A' : '#F8FAFC';
  const cu = profile || {};
  const uid = cu.uid || cu.id;
  const now = Date.now();

  const CRISIS_TEMPLATES = [
    {id:'earthquake',name:'Deprem',icon:'🌍',desc:'Büyük bir deprem şehri vurdu! Altyapı ciddi hasar gördü.',severity:'Kritik',color:'#C24B43',poolTarget:500000,duration:12*3600000},
    {id:'economic',name:'Ekonomik Kriz',icon:'📉',desc:'Piyasalar çöküyor, enflasyon tırmanıyor.',severity:'Yüksek',color:'#C9A227',poolTarget:300000,duration:8*3600000},
    {id:'pandemic',name:'Salgın Hastalık',icon:'🦠',desc:'Tehlikeli bir salgın hızla yayılıyor.',severity:'Kritik',color:'#C9A227',poolTarget:750000,duration:24*3600000},
    {id:'political',name:'Siyasi Kriz',icon:'🏛️',desc:'Hükümet krizi derinleşiyor, meclis kilitlendi.',severity:'Orta',color:'#C9A227',poolTarget:200000,duration:6*3600000},
    {id:'war',name:'Savaş Tehdidi',icon:'⚔️',desc:'Sınırda gerilim tırmanıyor, ordu alarma geçti.',severity:'Yüksek',color:'#C24B43',poolTarget:1000000,duration:18*3600000},
    {id:'flood',name:'Sel Felaketi',icon:'🌊',desc:'Şiddetli yağışlar sel baskınına neden oldu.',severity:'Yüksek',color:'#C9A227',poolTarget:400000,duration:10*3600000},
  ];

  useEffect(() => {
    const lastGen = parseInt(localStorage.getItem('rep_lastCrisisGen')||'0');
    const GEN_INTERVAL = 2*3600000;
    const nowTs = Date.now();
    if (nowTs - lastGen > GEN_INTERVAL) {
      const active = crises.filter(c => c.active && (nowTs-c.startTime)<c.duration);
      if (active.length < 2) {
        const tmpl = CRISIS_TEMPLATES[Math.floor(Math.random()*CRISIS_TEMPLATES.length)];
        const crisis = {
          id:genId(), type:tmpl.id, name:tmpl.name, icon:tmpl.icon, desc:tmpl.desc,
          severity:tmpl.severity, color:tmpl.color, startTime:nowTs, duration:tmpl.duration,
          poolTarget:tmpl.poolTarget, poolCurrent:0, contributions:{}, active:true,
        };
        setCrises(prev => [crisis,...prev.filter(c=>c.active&&(nowTs-c.startTime)<c.duration)].slice(0,5));
        setCrisisLog(prev => [{id:genId(),icon:crisis.icon,text:`🚨 Otomatik uyarı: ${crisis.name} krizi başladı!`,time:new Date().toLocaleTimeString('tr-TR')},...prev].slice(0,50));
        localStorage.setItem('rep_lastCrisisGen', String(nowTs));
      }
    }
  }, []);

  const contribute = (crisisId, amount) => {
    if (!amount||amount<=0) return;
    if ((cu.money||0)<amount) { showNotif('❌ Yetersiz bakiye!','error'); return; }
    let resolved = false;
    setCrises(prev => prev.map(c => {
      if (c.id!==crisisId) return c;
      const newPool = (c.poolCurrent||0)+amount;
      resolved = newPool >= c.poolTarget;
      return {...c, poolCurrent:newPool, contributions:{...(c.contributions||{}),[uid]:((c.contributions||{})[uid]||0)+amount}, active:!resolved, resolvedAt:resolved?Date.now():undefined};
    }));
    const xpGain = Math.floor(amount/1000);
    const meritGain = Math.floor(amount/10000);
    setProfile(pr => { const np={...pr,money:(pr.money||0)-amount,xp:(pr.xp||0)+xpGain,meritPoints:(pr.meritPoints||0)+meritGain}; localStorage.setItem('rep_userProfile',JSON.stringify(np)); return np; });
    const crisis = crises.find(c=>c.id===crisisId);
    if (crisis && (crisis.poolCurrent||0)+amount >= crisis.poolTarget) {
      setCrisisLog(prev => [{id:genId(),icon:'✅',text:`${crisis.name} krizi havuz doldurularak çözüldü!`,time:new Date().toLocaleTimeString('tr-TR')},...prev].slice(0,50));
      showNotif(`✅ ${crisis.name} krizi çözüldü! Katkın için teşekkürler. +${xpGain} XP`,'success');
    } else {
      showNotif(`💪 Havuza ${fmtWord(amount)} katkı! +${xpGain} XP +${meritGain}🏅`,'success');
    }
  };

  const activeCrises = crises.filter(c => c.active && (now-c.startTime)<c.duration);

  return (
    <div style={{padding:'1rem',background:bg,minHeight:'100%'}}>
      <div style={{fontFamily:"'Syne',sans-serif",fontSize:'1.3rem',fontWeight:900,color:'#C24B43',marginBottom:'0.3rem'}}>🚨 Kriz Merkezi</div>
      <div style={{fontSize:'0.78rem',color:'#8893A1',marginBottom:'1rem'}}>Krizler sistem tarafından otomatik oluşturulur. Havuza para katkısı yaparak çöz, XP ve Puan kazan!</div>

      {activeCrises.length===0 && (
        <Card style={{textAlign:'center',padding:'2rem',marginBottom:'1rem'}}>
          <div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>✅</div>
          <div style={{fontWeight:700,color:'#4C9A6B',marginBottom:'0.3rem'}}>Şu an aktif kriz yok</div>
          <div style={{fontSize:'0.78rem',color:'#8893A1'}}>Sistem her 2 saatte bir kriz üretebilir</div>
        </Card>
      )}

      {activeCrises.map(c=>{
        const pct = Math.min(100,Math.round((c.poolCurrent||0)/c.poolTarget*100));
        const timeLeft = Math.ceil(Math.max(0,c.duration-(now-c.startTime))/3600000);
        const myContrib = (c.contributions||{})[uid]||0;
        const remaining = c.poolTarget-(c.poolCurrent||0);
        return (
          <div key={c.id} style={{background:'rgba(194,75,67,0.05)',border:`1px solid ${c.color||'#C24B43'}44`,borderRadius:'14px',padding:'1rem',marginBottom:'0.75rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.6rem'}}>
              <div style={{display:'flex',alignItems:'center',gap:'0.6rem'}}>
                <span style={{fontSize:'2rem'}}>{c.icon}</span>
                <div>
                  <div style={{fontWeight:800,color:c.color||'#C24B43',fontSize:'0.95rem'}}>{c.name}</div>
                  <div style={{fontSize:'0.7rem',color:'#8893A1',maxWidth:'180px'}}>{c.desc}</div>
                </div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:'0.72rem',color:'#C9A227',fontWeight:700}}>⏰ {timeLeft}sa</div>
                <Tag color='red'>{c.severity}</Tag>
              </div>
            </div>
            <div style={{marginBottom:'0.65rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.68rem',color:'#8893A1',marginBottom:'4px'}}>
                <span style={{color:'#4C9A6B',fontWeight:700}}>💰 Havuz: {fmtWord(c.poolCurrent||0)}</span>
                <span>Hedef: {fmtWord(c.poolTarget)}</span>
              </div>
              <div style={{height:'8px',background:'rgba(237,231,218,0.05)',borderRadius:'100px',overflow:'hidden',marginBottom:'4px'}}>
                <div style={{height:'100%',width:`${pct}%`,background:`linear-gradient(90deg,#4C9A6B,${c.color||'#C24B43'})`,borderRadius:'100px',transition:'width 0.5s'}} />
              </div>
              <div style={{fontSize:'0.62rem',color:'#8893A1'}}>{pct}% tamamlandı • {fmtWord(remaining)} daha gerekli</div>
              {myContrib>0&&<div style={{fontSize:'0.65rem',color:'#4C9A6B',marginTop:'2px'}}>✅ Senin katkın: {fmtWord(myContrib)}</div>}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.35rem',marginBottom:'0.35rem'}}>
              {[10000,25000,50000,100000].map(amt=>{
                const can=(cu.money||0)>=amt;
                return (
                  <button key={amt} onClick={()=>can&&contribute(c.id,amt)} disabled={!can}
                    style={{padding:'0.45rem 0.2rem',borderRadius:'8px',border:`1px solid ${can?'rgba(76,154,107,0.3)':'rgba(255,255,255,0.06)'}`,background:can?'rgba(76,154,107,0.08)':'rgba(255,255,255,0.02)',color:can?'#4C9A6B':'#3B4E63',cursor:can?'pointer':'not-allowed',fontWeight:700,fontSize:'0.65rem',fontFamily:"'Inter',sans-serif"}}>
                    {fmtWord(amt)}
                  </button>
                );
              })}
            </div>
            <div style={{fontSize:'0.62rem',color:'#8893A1'}}>Katkı yap → XP + Puan kazan • Kriz çözülünce katkıcılar ödüllenir</div>
          </div>
        );
      })}

      {crisisLog.length>0 && (
        <div style={{background:'rgba(237,231,218,0.02)',border:'1px solid rgba(237,231,218,0.08)',borderRadius:'12px',padding:'1rem'}}>
          <div style={{fontWeight:700,color:'#8893A1',marginBottom:'0.5rem',fontSize:'0.85rem'}}>📋 Kriz Kayıtları</div>
          {crisisLog.slice(0,10).map((c,i)=>(
            <div key={i} style={{display:'flex',gap:'0.5rem',padding:'0.3rem 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <span style={{fontSize:'1rem',flexShrink:0}}>{c.icon}</span>
              <div style={{flex:1,fontSize:'0.75rem',color:'#8893A1'}}>{c.text}</div>
              <div style={{fontSize:'0.62rem',color:'#8893A1',flexShrink:0}}>{c.time}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

