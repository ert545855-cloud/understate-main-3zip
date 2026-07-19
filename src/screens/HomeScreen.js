function HomePage({ profile, onNavigate }) {
  const lvl = getLevelInfo(profile?.xp || 0);
  const onlineCnt = useOnlineCount();
  const [news] = useLs('liveNews', []);
  const [activity] = useLs('activityFeed', []);
  const [announcements] = useLs('announcements', []);
  const [annModal, setAnnModal] = useState(null);
  const [dailyState, setDailyState] = useLs('dailyTaskProgress', {});
  const [streakData, setStreakData] = useState(null);
  const [streakClaiming, setStreakClaiming] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportText, setSupportText] = useState('');
  const [supportSent, setSupportSent] = useState(false);

  const jwt = () => localStorage.getItem('us_jwt') || '';

  React.useEffect(() => {
    const fetchStreak = async () => {
      try {
        const token = jwt();
        if (!token) return;
        const r = await fetch('/api/streak', { headers: { Authorization: 'Bearer ' + token } });
        const d = await r.json();
        if (d.success) setStreakData(d.streak);
      } catch {}
    };
    const fetchNotifs = async () => {
      try {
        const token = jwt();
        if (!token) return;
        const r = await fetch('/api/notifications?unread=true', { headers: { Authorization: 'Bearer ' + token } });
        const d = await r.json();
        if (d.success) setNotifCount(d.unreadCount || 0);
      } catch {}
    };
    fetchStreak();
    fetchNotifs();
  }, [profile?.id]);

  const claimStreakAPI = async () => {
    if (streakClaiming) return;
    setStreakClaiming(true);
    try {
      const r = await fetch('/api/streak/claim', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + jwt() },
      });
      const d = await r.json();
      if (d.ok) {
        setStreakData(s => ({ ...s, current_streak: d.streak, last_claim_date: new Date().toISOString().slice(0,10) }));
        window.dispatchEvent(new CustomEvent('user-profile-updated'));
      }
    } catch {}
    setStreakClaiming(false);
  };
  const money = profile?.money || 0;
  const { dark } = useTheme();
  const T = useT();
  const playerLevel = profile?.level || 1;
  const uid = profile?.uid || profile?.id;

  const sendSupportMsg = () => {
    const t = supportText.trim();
    if (!t) return;
    const msg = {
      id: Date.now() + '_' + Math.random().toString(36).slice(2,7),
      from: profile?.username || 'Anonim',
      userId: profile?.uid || '',
      text: t,
      ts: Date.now(),
      status: 'pending',
      replies: [],
    };
    try {
      const prev = JSON.parse(localStorage.getItem('rep_supportMsgs')||'[]');
      const upd = Array.isArray(prev) ? [...prev, msg] : [msg];
      localStorage.setItem('rep_supportMsgs', JSON.stringify(upd));
      window.dispatchEvent(new CustomEvent('fb-sync', {detail:{key:'supportMsgs',value:upd}}));
      // Support mesajı socket üzerinden admin'e ilet
      const _sockS = window._socket || window._gameSocket;
      if (_sockS?.connected) {
        _sockS.emit('support:message', { msg });
      }
    } catch(e) {}
    setSupportSent(true);
    setSupportText('');
    setTimeout(() => { setSupportSent(false); setSupportOpen(false); }, 2200);
  };

  const fmtShort = (n) => {
    const abs = Math.abs(n||0);
    if (abs>=1e9)  return (n/1e9).toFixed(1)+'B';
    if (abs>=1e6)  return (n/1e6).toFixed(1)+'M';
    if (abs>=1e3)  return (n/1e3).toFixed(1)+'K';
    return String(Math.floor(n||0));
  };

  const todayKey = new Date().toDateString();

  const ALL_TASKS = [
    { id:'login',     name:'Günlük Giriş Yap',       page:'home',      icon:'📅', minLv:1,  maxLv:99, target:1,  reward:500,   xpReward:50,  unit:'giriş' },
    { id:'job5',      name:'İş Yap (5 kez)',           page:'jobs',      icon:'💼', minLv:1,  maxLv:99, target:5,  reward:2000,  xpReward:100, unit:'iş' },
    { id:'chat3',     name:'Sohbete Katıl (3 mesaj)',  page:'chat',      icon:'💬', minLv:1,  maxLv:99, target:3,  reward:1000,  xpReward:75,  unit:'mesaj' },
    { id:'trade1',    name:'Borsa İşlemi Yap',         page:'economy',   icon:'📈', minLv:2,  maxLv:99, target:1,  reward:5000,  xpReward:150, unit:'işlem' },
    { id:'farm1',     name:'Tarım Hasatı Yap',         page:'economy',   icon:'🌾', minLv:2,  maxLv:99, target:1,  reward:3000,  xpReward:120, unit:'hasat' },
    { id:'gang1',     name:'Çeteye Katıl/Savaş',       page:'gang',      icon:'⚔️', minLv:1,  maxLv:5,  target:1,  reward:2500,  xpReward:100, unit:'aksiyon' },
    { id:'vote1',     name:'Siyasi Oy Kullan',         page:'politics',  icon:'🗳️', minLv:3,  maxLv:99, target:1,  reward:3000,  xpReward:200, unit:'oy' },
    { id:'factory1',  name:'İmalathane Üret (1 kez)',      page:'factory',   icon:'🏭', minLv:5,  maxLv:99, target:1,  reward:8000,  xpReward:250, unit:'üretim' },
    { id:'spy1',      name:'İstihbarat Operasyonu',    page:'spy',       icon:'🕵️', minLv:5,  maxLv:99, target:1,  reward:5000,  xpReward:200, unit:'operasyon' },
    { id:'build1',    name:'İnşaat Başlat',            page:'citybuild', icon:'🏗️', minLv:3,  maxLv:99, target:1,  reward:7000,  xpReward:220, unit:'inşaat' },
  ];

  const todayProgress = dailyState[todayKey] || {};

  const claimTask = (task, e) => {
    e.stopPropagation();
    const prog = todayProgress[task.id] || 0;
    if (prog < task.target) { onNavigate(task.page); return; }
    if (todayProgress[task.id+'_claimed']) return;
    const newState = { ...dailyState, [todayKey]: { ...todayProgress, [task.id+'_claimed']:true } };
    setDailyState(newState);
    try {
      const p = JSON.parse(localStorage.getItem('rep_userProfile')||'{}');
      const np = {...p, money:(p.money||0)+task.reward, xp:(p.xp||0)+task.xpReward};
      localStorage.setItem('rep_userProfile', JSON.stringify(np));
      window.dispatchEvent(new CustomEvent('user-profile-updated'));
    } catch(e){}
  };

  useEffect(() => {
    const today = new Date().toDateString();
    const s = JSON.parse(localStorage.getItem('rep_dailyTaskProgress')||'{}');
    const todayS = s[today] || {};
    if (!todayS['login']) {
      const newS = {...s, [today]: {...todayS, login:1}};
      localStorage.setItem('rep_dailyTaskProgress', JSON.stringify(newS));
      setDailyState(newS);
    }
  }, []);

  const taskList = ALL_TASKS.filter(t => playerLevel >= t.minLv && playerLevel <= t.maxLv).slice(0, 4);

  const dynamicActivity = [
    { text:`${profile?.username||'Sen'} oyuna giriş yaptı`, color:'#C9A227', time:'Az önce' },
    { text:'Şehirde yeni bir bina inşa edildi', color:'#C9A227', time:'5dk' },
    { text:'Çete savaşı başladı', color:'#C24B43', time:'12dk' },
    { text:`Lv.${playerLevel} — ${lvl.title}`, color:'#4C9A6B', time:'1sa' },
    { text:'Borsa: TECH +2.4%', color:'#C9A227', time:'2sa' },
  ];
  const recentActivity = (Array.isArray(activity) && activity.length > 0 ? activity : dynamicActivity).slice(0, 5);

  const defaultAnn = [
    {id:'ann1',title:'Seçim Krizi!',body:'Seçim sonuçları tartışmalı, siyasi gerilim tırmanıyor.',category:'Siyaset',icon:'🏛️',ts:Date.now()-3600000},
    {id:'ann2',title:'Ekonomi Uyarısı',body:'Merkez Bankası faiz kararı açıkladı.',category:'Ekonomi',icon:'💰',ts:Date.now()-7200000},
  ];
  const annList = [...announcements, ...defaultAnn].slice(0,5);
  const catColor = {Siyaset:'#C24B43',Ekonomi:'#C9A227',Hukuk:'#C9A227',Etkinlik:'#4C9A6B',Sistem:'#C9A227'};

  const allAchievements = 16;
  const earnedAch = (() => {
    try {
      const cu = profile || {};
      const parties = JSON.parse(localStorage.getItem('rep_parties')||'[]');
      const gangs = JSON.parse(localStorage.getItem('rep_gangs')||'[]');
      let count = 0;
      if ((cu.money||0)+(cu.bankMoney||0)>=1000000) count++;
      if ((cu.money||0)+(cu.bankMoney||0)>=1000000000) count++;
      if ((cu.level||1)>=10) count++;
      if ((cu.level||1)>=50) count++;
      if (parties.find(p=>(p.members||[]).includes(cu.username))) count++;
      if (gangs.find(g=>(g.members||[]).includes(cu.username))) count++;
      if ((cu.meritPoints||0)>=100) count++;
      if ((cu.meritPoints||0)>=1000) count++;
      if (cu.vip||cu.premium) count++;
      if ((cu.underCoin||0)>=1000) count++;
      if (cu.role==='admin') count++;
      if ((cu.hp||100)>=100) count++;
      return count;
    } catch{ return 0; }
  })();

  const stocks = (() => { try { return JSON.parse(localStorage.getItem('rep_stockMarket')||'{}'); } catch{ return {}; } })();
  const portfolio = (() => { try { return JSON.parse(localStorage.getItem('rep_stockPortfolio')||'{}'); } catch{ return {}; } })();
  const portfolioVal = Object.entries(portfolio).reduce((s,[sym,h])=>s+(stocks[sym]||0)*(h.qty||0),0);
  const portfolioChange = portfolioVal > 0 ? `+${fmtShort(portfolioVal)}` : `+${fmtShort(money*0.02||150)}`;

  const unreadDMs = (() => { try { const msgs = JSON.parse(localStorage.getItem('rep_directMessages')||'[]'); return msgs.filter(m=>m.to===uid&&!m.read).length; } catch{ return 0; } })();
  const unreadCount = notifCount > 0 ? notifCount : (unreadDMs + (news?.length||0));

  return (
    <div style={{padding:'0 0.75rem 1rem',background:'#0F0800',minHeight:'100%'}}>
      {/* ── Welcome card (stays dark) ── */}
      <div style={{borderRadius:'12px',marginBottom:'0.75rem',boxShadow:'0 6px 24px rgba(0,0,0,0.18)',marginTop:'0.75rem',overflow:'hidden'}}>
        {/* Banner */}
        {profile?.bannerUrl && (
          <div style={{height:'90px',backgroundImage:`url(${profile.bannerUrl})`,backgroundSize:'cover',backgroundPosition:'center',position:'relative'}}>
            <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,rgba(0,0,0,0.05),rgba(15,28,56,0.85))'}}/>
            {/* avatar üst sağ */}
            <div onClick={()=>onNavigate('profile')} style={{position:'absolute',bottom:'-22px',right:'1rem',cursor:'pointer',zIndex:2}}>
              <div style={{width:'52px',height:'52px',borderRadius:'50%',border:'3px solid #1A2744',overflow:'hidden',background:'linear-gradient(135deg,#1a3a5c,#0a1a2e)'}}>
                {(profile?.avatarUrl||profile?.photoUrl) ? (
                  <img src={profile.avatarUrl||profile.photoUrl} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" onError={e=>e.target.style.display='none'}/>
                ) : (
                  <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.3rem'}}>{profile?.gender==='female'?'👩':'👨'}</div>
                )}
              </div>
            </div>
          </div>
        )}
        <div style={{background:'#1B212B',padding:'1.2rem',paddingTop: profile?.bannerUrl ? '1.5rem' : '1.2rem'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.75rem'}}>
            <div>
              <div style={{fontSize:'0.72rem',color:'#8893A1',marginBottom:'0.2rem',fontWeight:600}}>{T('playerProfile')}</div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:'1.35rem',fontWeight:900,color:'#EDE7DA'}}>{profile?.username||'Oyuncu'}</div>
              <div style={{fontSize:'0.65rem',color:'#8893A1',marginTop:'0.1rem'}}>{lvl.title} • {lvl.pct}% {T('nextLevel')}</div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
              {!profile?.bannerUrl && (
                <div onClick={()=>onNavigate('profile')} style={{cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'0.3rem'}}>
                  <Avatar profile={profile} size={62} />
                  <div style={{fontSize:'0.58rem',color:'rgba(255,255,255,0.45)',fontWeight:600}}>{T('viewProfile')}</div>
                </div>
              )}
              <button onClick={()=>onNavigate('oyun_ayarlari')} title="Oyun Ayarları" style={{background:'rgba(200,155,60,0.1)',border:'1px solid rgba(200,155,60,0.25)',borderRadius:'10px',padding:'8px 10px',color:'#C9A227',fontSize:'1.1rem',cursor:'pointer',lineHeight:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'}}>
                ⚙️
                <span style={{fontSize:'0.45rem',color:'rgba(200,155,60,0.6)',fontWeight:700,letterSpacing:'0.05em'}}>AYARLAR</span>
              </button>
            </div>
          </div>
        <div style={{marginBottom:'0.6rem'}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.6rem',color:'#8893A1',marginBottom:'4px'}}>
            <span>{lvl.xp?.toLocaleString()} XP</span><span>→ {lvl.next?.xp?.toLocaleString()} XP</span>
          </div>
          <div style={{height:'4px',background:'rgba(237,231,218,0.07)',borderRadius:'2px',overflow:'hidden'}}>
            <div style={{height:'100%',width:`${lvl.pct}%`,background:'linear-gradient(90deg,#C9A227,#E5C14B)',borderRadius:'2px',transition:'width 0.5s'}}/>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.5rem'}}>
          {[
            {label:T('levelLabel'),value:lvl.lvl,icon:'⭐'},
            {label:T('prestigeLabel'),value:fmtShort(profile?.meritPoints||0),icon:'🏅'},
            {label:T('moneyLabel'),value:'🪙'+fmtShort(money),icon:'💰'},
          ].map(({label,value,icon})=>(
            <div key={label} style={{textAlign:'center',background:'rgba(237,231,218,0.05)',borderRadius:'10px',padding:'0.5rem 0.2rem'}}>
              <div style={{fontSize:'0.75rem',marginBottom:'0.1rem'}}>{icon}</div>
              <div style={{fontSize:'0.52rem',color:'#8893A1',textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:700,marginBottom:'0.1rem'}}>{label}</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'1rem',fontWeight:900,color:'#EDE7DA'}}>{value}</div>
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* ── Sadakat Puanı Banner ── */}
      <div onClick={()=>onNavigate('sadakat')} style={{background:'linear-gradient(135deg,rgba(200,155,60,0.14),rgba(45,24,0,0.9))',border:'1px solid rgba(200,155,60,0.28)',borderRadius:'10px',padding:'0.75rem 1rem',marginBottom:'0.55rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',WebkitTapHighlightColor:'transparent'}}>
        <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
          <span style={{fontSize:'1.2rem'}}>💎</span>
          <div>
            <div style={{fontSize:'0.6rem',color:'#8893A1',textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:700}}>Sadakat Puanı</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'1.15rem',fontWeight:900,color:'#C89B3C'}}>{(profile?.loyaltyPoints||0).toLocaleString('tr-TR')}</div>
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:'0.6rem',color:'#8893A1',marginBottom:3}}>Beylik kurmak için 150.000</div>
          <div style={{background:'rgba(200,155,60,0.15)',border:'1px solid rgba(200,155,60,0.3)',borderRadius:8,padding:'4px 10px',fontSize:'0.65rem',color:'#C89B3C',fontWeight:700}}>Görevler →</div>
        </div>
      </div>

      {/* ── 2-column stat cards ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.55rem',marginBottom:'0.75rem'}}>
        {[
          {icon:'🔔',label:T('notifications'),value:unreadCount||0,sub:unreadCount>0?`${unreadCount} ${T('unread')}`:T('allClaimed'),color:'#C9A227',page:'chat'},
          {icon:'🏆',label:T('achievements'),value:`${earnedAch}/${allAchievements}`,sub:`%${Math.round(earnedAch/(allAchievements||1)*100)} tamamlandı`,color:'#C9A227',page:'achievements'},
          {icon:'📈',label:T('economy'),value:portfolioChange,sub:T('portfolio'),color:'#4C9A6B',positive:true,page:'economy'},
          {icon:'⚡',label:T('players'),value:onlineCnt||0,sub:T('online'),color:'#C9A227',page:'players'},
        ].map((item)=>(
          <div key={item.label} onClick={()=>onNavigate(item.page)}
            style={{background:'#1B212B',border:'1px solid rgba(237,231,218,0.08)',borderRadius:'10px',padding:'0.9rem 0.85rem',cursor:'pointer',transition:'all 0.15s',WebkitTapHighlightColor:'transparent'}}>
            <div style={{display:'flex',alignItems:'center',gap:'0.35rem',marginBottom:'0.35rem'}}>
              <span style={{fontSize:'1rem'}}>{item.icon}</span>
              <span style={{fontSize:'0.65rem',fontWeight:700,color:'#8893A1',textTransform:'uppercase',letterSpacing:'0.05em'}}>{item.label}</span>
            </div>
            {(() => { const LV = window.LedgerValue; return LV
              ? React.createElement(LV, {value:item.value, prefix:false, color:item.positive?'#4C9A6B':'#EDE7DA', style:{alignItems:'flex-start',background:'none',border:'none',padding:'0',marginBottom:'0.2rem'}})
              : React.createElement('div',{style:{fontFamily:"'JetBrains Mono',monospace",fontSize:'1.3rem',fontWeight:900,color:item.positive?'#4C9A6B':'#EDE7DA',lineHeight:1,marginBottom:'0.2rem'}},item.value);
            })()}
            <div style={{fontSize:'0.63rem',color:'#8893A1'}}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Streak Card ── */}
      {streakData !== null && (() => {
        const streak = streakData?.current_streak || 0;
        const today = new Date().toISOString().slice(0,10);
        const claimed = streakData?.last_claim_date === today;
        const REWARDS = [500,1000,2000,3000,5000,8000,15000];
        const todayReward = REWARDS[Math.min(streak, REWARDS.length-1)];
        const nextReward = REWARDS[Math.min(streak+1, REWARDS.length-1)];
        return (
          <div style={{background:'#1B212B',borderRadius:'10px',padding:'1rem',marginBottom:'0.75rem',boxShadow:'0 4px 16px rgba(0,0,0,0.15)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.65rem'}}>
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                <span style={{fontSize:'1.4rem'}}>🔥</span>
                <div>
                  <div style={{fontFamily:"'Cinzel',serif",fontSize:'0.95rem',fontWeight:800,color:'#EDE7DA'}}>{streak} Günlük Seri</div>
                  <div style={{fontSize:'0.62rem',color:'rgba(255,255,255,0.45)'}}>En uzun: {streakData?.longest_streak || 0} gün</div>
                </div>
              </div>
              {!claimed ? (
                <button onClick={claimStreakAPI} disabled={streakClaiming}
                  style={{background:'linear-gradient(135deg,#C9A227,#A07D1C)',border:'none',borderRadius:'10px',padding:'0.5rem 1rem',color:'#EDE7DA',fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:'0.78rem',cursor:'pointer'}}>
                  {streakClaiming ? '⏳' : `🎁 +🪙${todayReward.toLocaleString('tr-TR')}`}
                </button>
              ) : (
                <div style={{fontSize:'0.72rem',color:'#4C9A6B',fontWeight:700}}>✅ {T('claimedToday')}</div>
              )}
            </div>
            <div style={{display:'flex',gap:'4px'}}>
              {[1,2,3,4,5,6,7].map(d=>{
                const active = d <= streak;
                const isToday = d === streak+1 && !claimed;
                return (
                  <div key={d} style={{flex:1,height:'6px',borderRadius:'100px',background:active?'#C9A227':isToday?'rgba(201,162,39,0.3)':'rgba(255,255,255,0.08)',transition:'all 0.3s'}} />
                );
              })}
            </div>
            {!claimed && <div style={{fontSize:'0.62rem',color:'#8893A1',marginTop:'0.4rem'}}>Yarın: +🪙{nextReward.toLocaleString('tr-TR')} • Zinciri kırma!</div>}
          </div>
        );
      })()}

      {/* ── Daily Tasks ── */}
      <div style={{background:'#1B212B',border:'1px solid rgba(237,231,218,0.08)',borderRadius:'10px',padding:'1rem',marginBottom:'0.75rem',boxShadow:'none'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.8rem'}}>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:'1rem',fontWeight:800,color:'#EDE7DA'}}>{T('dailyTasks')}</div>
          <span style={{fontSize:'0.65rem',color:'#8893A1',fontWeight:600}}>{todayKey}</span>
        </div>
        {taskList.map((task,i)=>{
          const prog = todayProgress[task.id] || 0;
          const pct = Math.min(100, Math.round(prog/task.target*100));
          const done = prog >= task.target;
          const claimed = !!todayProgress[task.id+'_claimed'];
          return (
            <div key={task.id} style={{marginBottom:i<taskList.length-1?'0.85rem':'0'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.25rem'}}>
                <div style={{display:'flex',alignItems:'center',gap:'0.4rem'}}>
                  <span style={{fontSize:'0.95rem'}}>{task.icon}</span>
                  <span style={{fontSize:'0.82rem',fontWeight:600,color:claimed?'#8893A1':'#EDE7DA',textDecoration:claimed?'line-through':'none'}}>{task.name}</span>
                </div>
                {claimed ? (
                  <span style={{fontSize:'0.65rem',color:'#4C9A6B',fontWeight:800}}>✅ Alındı</span>
                ) : done ? (
                  <button onClick={(e)=>claimTask(task,e)} style={{fontSize:'0.65rem',fontWeight:800,color:'#EDE7DA',background:'#4C9A6B',border:'none',borderRadius:'8px',padding:'0.2rem 0.55rem',cursor:'pointer'}}>🎁 Al</button>
                ) : (
                  <button onClick={(e)=>{e.stopPropagation();onNavigate(task.page);}} style={{fontSize:'0.65rem',fontWeight:700,color:'#C9A227',background:'none',border:'none',cursor:'pointer'}}>→ Git</button>
                )}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                <div style={{flex:1,height:'5px',background:'rgba(237,231,218,0.1)',borderRadius:'100px',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${pct}%`,background:claimed?'#4C9A6B':'linear-gradient(90deg,#C9A227,#C9A227)',borderRadius:'100px',transition:'width 0.5s'}} />
                </div>
                <span style={{fontSize:'0.6rem',color:'#8893A1',fontWeight:600,flexShrink:0}}>{prog}/{task.target}</span>
              </div>
              <div style={{fontSize:'0.6rem',color:'#8893A1',marginTop:'0.15rem'}}>🎁 +🪙{task.reward.toLocaleString('tr-TR')} • +{task.xpReward} XP</div>
            </div>
          );
        })}
      </div>

      {/* ── Announcements (açılır pencereli) ── */}
      <div style={{background:'#1B212B',border:'1px solid rgba(237,231,218,0.08)',borderRadius:'10px',padding:'1rem',marginBottom:'0.75rem',boxShadow:'none'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.7rem'}}>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:'1rem',fontWeight:800,color:'#EDE7DA'}}>{T('announcements2')}</div>
          <button onClick={()=>onNavigate('duyurular')} style={{fontSize:'0.68rem',color:'#C9A227',fontWeight:700,background:'none',border:'none',cursor:'pointer'}}>Tümü →</button>
        </div>
        {annList.slice(0,3).map(a=>(
          <button key={a.id||a.ts} onClick={()=>setAnnModal(a)}
            style={{width:'100%',display:'flex',alignItems:'center',gap:'0.6rem',padding:'0.5rem 0',borderBottom:'1px solid rgba(0,0,0,0.05)',background:'none',border:'none',cursor:'pointer',textAlign:'left'}}>
            <span style={{fontSize:'1.2rem',flexShrink:0}}>{a.icon||'📣'}</span>
            <div style={{flex:1,overflow:'hidden'}}>
              <div style={{fontSize:'0.82rem',fontWeight:700,color:'#EDE7DA',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.title}</div>
              <div style={{fontSize:'0.68rem',color:catColor[a.category]||'#8893A1',fontWeight:600}}>{a.category} • {timeAgo(a.ts)}</div>
            </div>
            <span style={{fontSize:'0.7rem',color:'#8893A1',flexShrink:0}}>›</span>
          </button>
        ))}
      </div>

      {/* ── Recent Activity ── */}
      <div style={{background:'#1B212B',border:'1px solid rgba(237,231,218,0.08)',borderRadius:'10px',padding:'1rem',boxShadow:'none',marginBottom:'0.75rem'}}>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:'1rem',fontWeight:800,color:'#EDE7DA',marginBottom:'0.7rem'}}>Son Aktiviteler</div>
        {recentActivity.map((item,i,arr)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:'0.6rem',padding:'0.55rem 0',borderBottom:i<arr.length-1?'1px solid rgba(0,0,0,0.05)':'none'}}>
            <div style={{width:'8px',height:'8px',borderRadius:'50%',background:item.color||'#C9A227',flexShrink:0}} />
            <span style={{flex:1,fontSize:'0.82rem',color:'#8893A1',fontWeight:500}}>{item.text||item.desc||item.content||'Aktivite'}</span>
            <span style={{fontSize:'0.67rem',color:'#8893A1'}}>{item.time||timeAgo(item.ts)}</span>
          </div>
        ))}
      </div>

      {/* ── YENİ: Günlük Aktiviteler Kısayolu ── */}
      <div style={{marginBottom:'0.75rem'}}>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:'0.72rem',fontWeight:700,color:'#C9A227',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'0.45rem',display:'flex',alignItems:'center',gap:6}}>
          <span>⚡</span> Günlük Aktiviteler
          <div style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(200,155,60,0.3),transparent)',marginLeft:4}} />
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.45rem'}}>
          {[
            {icon:'🎡',label:'Fal Çarkı',page:'fal_carki',color:'#A78BFA',desc:'Günde 1 çevirme'},
            {icon:'📋',label:'Günlük Görev',page:'gunluk_gorev',color:'#C9A227',desc:'Ödül kazan'},
            {icon:'⚡',label:'Hızlı Merkez',page:'hizli_merkez',color:'#60A5FA',desc:'Transfer & stat'},
          ].map((a) => (
            <button key={a.page} onClick={() => onNavigate(a.page)}
              style={{background:'#1B212B',border:`1px solid ${a.color}22`,borderRadius:'14px',padding:'0.75rem 0.5rem',display:'flex',flexDirection:'column',alignItems:'center',gap:'0.2rem',cursor:'pointer',WebkitTapHighlightColor:'transparent',transition:'all 0.15s',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:a.color,opacity:0.6}} />
              <span style={{fontSize:'1.5rem',lineHeight:1}}>{a.icon}</span>
              <span style={{fontSize:'0.68rem',fontWeight:800,color:'#EDE7DA',textAlign:'center',lineHeight:1.2}}>{a.label}</span>
              <span style={{fontSize:'0.56rem',color:'#8893A1',textAlign:'center'}}>{a.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── YENİ: Zanaat & Kervan Sistemi ── */}
      <div style={{marginBottom:'0.75rem'}}>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:'0.72rem',fontWeight:700,color:'#C9A227',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'0.45rem',display:'flex',alignItems:'center',gap:6}}>
          <span>🏺</span> Zanaat & Ticaret
          <div style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(200,155,60,0.3),transparent)',marginLeft:4}} />
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.45rem'}}>
          {[
            {icon:'⚒️',label:'Zanaat',page:'zanaat',color:'#3E8C5A',desc:'Usta ol'},
            {icon:'🛡️',label:'Kervan Koru',page:'kervan_koruma',color:'#F97316',desc:'Sikke kazan'},
            {icon:'🤝',label:'Lonca Anlaşma',page:'lonca_anlasma',color:'#C9A227',desc:'Ticaret yap'},
          ].map((a) => (
            <button key={a.page} onClick={() => onNavigate(a.page)}
              style={{background:'#1B212B',border:`1px solid ${a.color}22`,borderRadius:'14px',padding:'0.75rem 0.5rem',display:'flex',flexDirection:'column',alignItems:'center',gap:'0.2rem',cursor:'pointer',WebkitTapHighlightColor:'transparent',transition:'all 0.15s',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:a.color,opacity:0.6}} />
              <span style={{fontSize:'1.5rem',lineHeight:1}}>{a.icon}</span>
              <span style={{fontSize:'0.68rem',fontWeight:800,color:'#EDE7DA',textAlign:'center',lineHeight:1.2}}>{a.label}</span>
              <span style={{fontSize:'0.56rem',color:'#8893A1',textAlign:'center'}}>{a.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── YENİ: Strateji Kısayolları ── */}
      <div style={{marginBottom:'0.75rem'}}>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:'0.72rem',fontWeight:700,color:'#C9A227',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'0.45rem',display:'flex',alignItems:'center',gap:6}}>
          <span>⚔️</span> Strateji & Casusluk
          <div style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(200,155,60,0.3),transparent)',marginLeft:4}} />
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.45rem'}}>
          {[
            {icon:'🕵️',label:'Casus Zinciri',page:'casus_chain',color:'#B8423C',desc:'3 aşamalı görev'},
            {icon:'🏅',label:'Sezon',page:'sezon',color:'#60A5FA',desc:'Sıralama & ödül'},
            {icon:'⭐',label:'İtibar',page:'itibar',color:'#F9A825',desc:'Şöhretini artır'},
          ].map((a) => (
            <button key={a.page} onClick={() => onNavigate(a.page)}
              style={{background:'#1B212B',border:`1px solid ${a.color}22`,borderRadius:'14px',padding:'0.75rem 0.5rem',display:'flex',flexDirection:'column',alignItems:'center',gap:'0.2rem',cursor:'pointer',WebkitTapHighlightColor:'transparent',transition:'all 0.15s',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:a.color,opacity:0.6}} />
              <span style={{fontSize:'1.5rem',lineHeight:1}}>{a.icon}</span>
              <span style={{fontSize:'0.68rem',fontWeight:800,color:'#EDE7DA',textAlign:'center',lineHeight:1.2}}>{a.label}</span>
              <span style={{fontSize:'0.56rem',color:'#8893A1',textAlign:'center'}}>{a.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── YENİ: Sosyal & Karakter ── */}
      <div style={{marginBottom:'0.75rem'}}>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:'0.72rem',fontWeight:700,color:'#C9A227',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'0.45rem',display:'flex',alignItems:'center',gap:6}}>
          <span>👥</span> Sosyal & Karakter
          <div style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(200,155,60,0.3),transparent)',marginLeft:4}} />
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.45rem'}}>
          {[
            {icon:'👫',label:'Arkadaşlar',page:'arkadas_listesi',color:'#A78BFA'},
            {icon:'🎖️',label:'Unvanlar',  page:'unvan_sistemi', color:'#C9A227'},
            {icon:'🏅',label:'Rozetler',  page:'rozet_koleksiyon',color:'#C9A227'},
            {icon:'📸',label:'Kart Paylaş',page:'profil_kart',  color:'#60A5FA'},
            {icon:'📖',label:'Maceram',   page:'macera_gunlugu',color:'#A78BFA'},
            {icon:'🔍',label:'Oyuncu Ara',page:'oyuncu_arama', color:'#60A5FA'},
            {icon:'💬',label:'Grup Chat', page:'grup_mesaj',    color:'#136,147,161'},
            {icon:'🔔',label:'Bildirimler',page:'bildirim_gecmisi',color:'#C9A227'},
          ].map((a,i)=>(
            <button key={i} onClick={()=>onNavigate(a.page)}
              style={{background:'#1B212B',border:`1px solid ${a.color}22`,borderRadius:'14px',padding:'0.7rem 0.3rem',display:'flex',flexDirection:'column',alignItems:'center',gap:'0.2rem',cursor:'pointer',WebkitTapHighlightColor:'transparent',transition:'all 0.15s',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:a.color,opacity:0.5}} />
              <span style={{fontSize:'1.3rem',lineHeight:1}}>{a.icon}</span>
              <span style={{fontSize:'0.6rem',fontWeight:700,color:'#EDE7DA',textAlign:'center',lineHeight:1.2}}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── YENİ: Devlet & Keşfet ── */}
      <div style={{marginBottom:'0.75rem'}}>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:'0.72rem',fontWeight:700,color:'#C9A227',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'0.45rem',display:'flex',alignItems:'center',gap:6}}>
          <span>🏛️</span> Devlet & Keşfet
          <div style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(200,155,60,0.3),transparent)',marginLeft:4}} />
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.45rem'}}>
          {[
            {icon:'📜',label:'Ferman',     page:'ferman',          color:'#C9A227'},
            {icon:'🌳',label:'Yetenekler', page:'yetenek_agaci',   color:'#3E8C5A'},
            {icon:'📅',label:'Etkinlikler',page:'etkinlik_takvimi',color:'#C9A227'},
            {icon:'🕌',label:'Osmanlı Günü',page:'osmanli_gunu',   color:'#C9A227'},
            {icon:'📊',label:'Pazar Graf.',page:'fiyat_grafik',    color:'#3E8C5A'},
          ].map((a,i)=>(
            <button key={i} onClick={()=>onNavigate(a.page)}
              style={{background:'#1B212B',border:`1px solid ${a.color}22`,borderRadius:'14px',padding:'0.7rem 0.3rem',display:'flex',flexDirection:'column',alignItems:'center',gap:'0.2rem',cursor:'pointer',WebkitTapHighlightColor:'transparent',transition:'all 0.15s',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:a.color,opacity:0.5}} />
              <span style={{fontSize:'1.3rem',lineHeight:1}}>{a.icon}</span>
              <span style={{fontSize:'0.6rem',fontWeight:700,color:'#EDE7DA',textAlign:'center',lineHeight:1.2}}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Hızlı Erişim (orijinal) ── */}
      <div style={{background:'#1B212B',border:'1px solid rgba(237,231,218,0.08)',borderRadius:'10px',padding:'1rem',boxShadow:'none'}}>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:'1rem',fontWeight:800,color:'#EDE7DA',marginBottom:'0.75rem'}}>Hızlı Erişim</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.45rem'}}>
          {[
            {icon:'💼',label:'İşler',page:'jobs'},
            {icon:'📈',label:'Borsa',page:'economy'},
            {icon:'🏗️',label:'İnşaat',page:'citybuild'},
            {icon:'⚔️',label:'Savaş',page:'map'},
            {icon:'🗳️',label:'Seçim',page:'politics'},
            {icon:'🏆',label:'Sıralama',page:'leaderboard'},
            {icon:'🎰',label:'Kumarhane',page:'casino'},
            {icon:'🤝',label:'İttifak',page:'alliance'},
          ].map((a,i) => (
            <button key={i} onClick={() => onNavigate(a.page)}
              style={{background:'#0F0800',border:'1px solid rgba(237,231,218,0.07)',borderRadius:'14px',padding:'0.7rem 0.3rem',display:'flex',flexDirection:'column',alignItems:'center',gap:'0.25rem',cursor:'pointer',WebkitTapHighlightColor:'transparent',transition:'all 0.15s'}}>
              <span style={{fontSize:'1.45rem',lineHeight:1}}>{a.icon}</span>
              <span style={{fontSize:'0.65rem',fontWeight:700,color:'#8893A1',textAlign:'center',lineHeight:1.2}}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Destek Talebi Butonu ── */}
      <button onClick={()=>setSupportOpen(true)}
        style={{width:'100%',display:'flex',alignItems:'center',gap:'0.75rem',background:'linear-gradient(135deg,rgba(194,75,67,0.08),rgba(201,162,39,0.05))',border:'1px solid rgba(194,75,67,0.2)',borderRadius:'10px',padding:'0.85rem 1rem',cursor:'pointer',fontFamily:"'Inter',sans-serif",textAlign:'left',marginBottom:'0.75rem',WebkitTapHighlightColor:'transparent'}}>
        <span style={{fontSize:'1.5rem'}}>🆘</span>
        <div>
          <div style={{fontSize:'0.9rem',fontWeight:800,color:'#C24B43'}}>Destek Talebi</div>
          <div style={{fontSize:'0.7rem',color:'#8893A1'}}>Sorun mu var? Bize bildir, yardım edelim.</div>
        </div>
        <span style={{marginLeft:'auto',fontSize:'0.8rem',color:'#C24B43'}}>→</span>
      </button>

      {/* ── Destek Cevapları (admin cevap verdiyse göster) ── */}
      {(()=>{
        const myMsgs = (() => {
          try { const all=JSON.parse(localStorage.getItem('rep_supportMsgs')||'[]'); return Array.isArray(all)?all.filter(m=>m.userId===profile?.uid&&m.replies&&m.replies.length>0):[] } catch{return [];}
        })();
        if(!myMsgs.length) return null;
        return (
          <div style={{background:'rgba(96,165,250,0.06)',border:'1px solid rgba(96,165,250,0.25)',borderRadius:'10px',padding:'0.85rem 1rem',marginBottom:'0.75rem'}}>
            <div style={{fontSize:'0.78rem',fontWeight:800,color:'#C9A227',marginBottom:'0.5rem'}}>💬 Destek Cevaplarınız</div>
            {myMsgs.slice(-3).map(m=>(
              <div key={m.id} style={{marginBottom:'0.5rem',paddingBottom:'0.5rem',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <div style={{fontSize:'0.72rem',color:'#8893A1',marginBottom:'0.2rem'}}>{new Date(m.ts).toLocaleDateString('tr-TR')} — {m.text.length>60?m.text.slice(0,60)+'…':m.text}</div>
                {m.replies.map((r,i)=>(
                  <div key={i} style={{background:'rgba(96,165,250,0.1)',border:'1px solid rgba(96,165,250,0.2)',borderRadius:'8px',padding:'0.45rem 0.6rem',fontSize:'0.8rem',color:'#E5C14B'}}>
                    🔑 {r.text}
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      })()}

      {supportOpen && (
        <div onClick={()=>setSupportOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',zIndex:3000,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#1B212B',borderRadius:'24px 24px 0 0',padding:'1.5rem 1.25rem',width:'100%',maxWidth:'480px',animation:'slideUp 0.25s ease',boxShadow:'0 -8px 40px rgba(0,0,0,0.2)'}}>
            {supportSent ? (
              <div style={{textAlign:'center',padding:'1.5rem 0'}}>
                <div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>✅</div>
                <div style={{fontSize:'1rem',fontWeight:800,color:'#4C9A6B'}}>Talebiniz İletildi!</div>
                <div style={{fontSize:'0.8rem',color:'#8893A1',marginTop:'0.35rem'}}>En kısa sürede cevap verilecek.</div>
              </div>
            ) : (
              <>
                <div style={{display:'flex',alignItems:'center',gap:'0.6rem',marginBottom:'1rem'}}>
                  <span style={{fontSize:'1.5rem'}}>🆘</span>
                  <div style={{fontSize:'1rem',fontWeight:800,color:'#EDE7DA'}}>Destek Talebi</div>
                  <button onClick={()=>setSupportOpen(false)} style={{marginLeft:'auto',background:'#F1F5F9',border:'none',borderRadius:'8px',padding:'0.3rem 0.65rem',cursor:'pointer',color:'#8893A1',fontSize:'0.85rem'}}>✕</button>
                </div>
                <div style={{fontSize:'0.8rem',color:'#8893A1',marginBottom:'0.6rem'}}>Kullanıcı: <strong>{profile?.username}</strong></div>
                <textarea value={supportText} onChange={e=>setSupportText(e.target.value)}
                  placeholder="Sorununuzu veya talebinizi yazın..."
                  rows={4}
                  style={{width:'100%',padding:'0.75rem',border:'1.5px solid rgba(201,162,39,0.25)',borderRadius:'12px',fontFamily:"'Inter',sans-serif",fontSize:'0.9rem',color:'#EDE7DA',resize:'none',outline:'none',boxSizing:'border-box',background:'#1B212B'}}
                />
                <button onClick={sendSupportMsg} disabled={!supportText.trim()}
                  style={{width:'100%',padding:'0.8rem',borderRadius:'14px',border:'none',background:supportText.trim()?'#C24B43':'#E2E8F0',color:supportText.trim()?'#fff':'#94A3B8',fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:'0.92rem',cursor:supportText.trim()?'pointer':'default',marginTop:'0.65rem',transition:'all 0.15s'}}>
                  🆘 Destek Talebi Gönder
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Duyuru Modal ── */}
      {annModal && (
        <div onClick={()=>setAnnModal(null)} style={{position:'fixed',inset:0,background:'rgba(17,21,28,0.9)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#1B212B',borderRadius:'14px',padding:'1.5rem',width:'100%',maxWidth:'400px',animation:'slideUp 0.2s ease',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'1rem'}}>
              <span style={{fontSize:'2rem'}}>{annModal.icon||'📣'}</span>
              <div>
                <div style={{fontSize:'1rem',fontWeight:800,color:'#EDE7DA'}}>{annModal.title}</div>
                <div style={{fontSize:'0.72rem',color:catColor[annModal.category]||'#8893A1',fontWeight:700}}>{annModal.category} • {timeAgo(annModal.ts)}</div>
              </div>
            </div>
            <div style={{fontSize:'0.88rem',color:'#334155',lineHeight:'1.65',marginBottom:'1.25rem'}}>{annModal.body||annModal.text}</div>
            <button onClick={()=>setAnnModal(null)} style={{width:'100%',padding:'0.7rem',borderRadius:'12px',border:'none',background:'#C9A227',color:'#EDE7DA',fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:'0.9rem',cursor:'pointer'}}>Kapat</button>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// ADMIN PANEL
// ═══════════════════════════════════════════════════════

const ADMIN_POSITIONS = [
  {key:'padisah',   title:'Padişah',       icon:'👑'},
  {key:'divan_reisi',   title:'Divan Reisi',        icon:'🏛️'},
  {key:'divan üyesi',     title:'Divan Üyesi',          icon:'📜'},
  {key:'icisleri_bakani',  title:'İçişleri Bakanı',       icon:'🛡️'},
  {key:'vali', title:'Nahiye Valisi',      icon:'🏙️'},
  {key:'vali',             title:'Vali',                  icon:'🏢'},
  {key:'seraskerlik',      title:'Serasker',   icon:'⚔️'},
  {key:'ticaret_bakani',   title:'Ticaret Bakanı',        icon:'📊'},
  {key:'maliye_bakani',    title:'Maliye Bakanı',         icon:'💰'},
];

function AdminElectionTab({ elections_multi, setElections_multi, setMsg, cs, inp }) {
  const [candInput, setCandInput] = useState({});

  const PARTY_BASED_KEYS = ['divan_reisi', 'divan üyesi'];

  const getTopParties = () => {
    try {
      const parties = JSON.parse(localStorage.getItem('rep_parties')||'[]');
      return [...parties].sort((a,b)=>(b.support||0)-(a.support||0)).slice(0, 10);
    } catch { return []; }
  };

  const loadPartyCandidates = (key) => {
    const topParties = getTopParties();
    if (topParties.length === 0) { setMsg('⚠️ Henüz kayıtlı parti yok'); return; }
    const cands = topParties.map(p => ({
      username: p.leaderName || p.name,
      id: p.leaderId || p.id,
      partyName: p.name,
      partyColor: p.color || '#C9A227',
    }));
    const votes = {};
    cands.forEach(c => { votes[c.username] = 0; });
    setElections_multi(prev=>({...prev,[key]:{...(prev[key]||{active:false,userVotedIds:[]}),candidates:cands,votes}}));
    setMsg(`✅ İlk 10 parti liderlik adayları yüklendi (${cands.length} aday)`);
  };

  const startPos = (key) => {
    setElections_multi(prev=>({...prev,[key]:{...(prev[key]||{}),active:true,candidates:(prev[key]?.candidates||[]),votes:(prev[key]?.votes||{}),userVotedIds:(prev[key]?.userVotedIds||[])}}));
    setMsg(`✅ ${ADMIN_POSITIONS.find(p=>p.key===key)?.title} seçimi başlatıldı!`);
  };
  const endPos = (key) => {
    const el = elections_multi[key]||{};
    const cands = el.candidates||[];
    const votes = el.votes||{};
    const sorted = [...cands].sort((a,b)=>(votes[b.username]||0)-(votes[a.username]||0));
    const winner = sorted[0];
    if (winner) {
      const cab = (()=>{try{return JSON.parse(localStorage.getItem('rep_cabinet')||'{}');}catch{return{};}})();
      const title = ADMIN_POSITIONS.find(p=>p.key===key)?.title;
      cab[title] = winner.username;
      localStorage.setItem('rep_cabinet', JSON.stringify(cab));
      const users = (()=>{try{return JSON.parse(localStorage.getItem('rep_users')||'[]');}catch{return[];}})();
      const updated = users.map(u=>u.username===winner.username?{...u,position:title}:u);
      localStorage.setItem('rep_users', JSON.stringify(updated));
    }
    setElections_multi(prev=>({...prev,[key]:{...prev[key],active:false,winner:winner?.username||null}}));
    const posTitle = ADMIN_POSITIONS.find(p=>p.key===key)?.title;
    setMsg(`🏆 ${posTitle} seçimi bitti! Kazanan: ${winner?.username||'Yok'}`);
    if (winner) { try { window._pushGameEvent?.('secim_sonucu', `🏆 ${posTitle} Seçimi Bitti!`, `${winner.username} yeni ${posTitle} seçildi!`, '🏆', 'seçim'); } catch(e){} }
  };
  const addCand = (key) => {
    const uname = (candInput[key]||'').trim();
    if (!uname) return;
    const users = (()=>{try{return JSON.parse(localStorage.getItem('rep_users')||'[]');}catch{return[];}})();
    const found = users.find(u=>u.username===uname);
    const cand = found ? {username:found.username,id:found.id} : {username:uname,id:'manual_'+Date.now()};
    setElections_multi(prev=>{
      const existing = prev[key]?.candidates||[];
      if (existing.find(c=>c.username===uname)) { setMsg('⚠️ Bu kullanıcı zaten aday!'); return prev; }
      return {...prev,[key]:{...(prev[key]||{active:false,votes:{},userVotedIds:[]}),candidates:[...existing,cand],votes:{...(prev[key]?.votes||{}),[uname]:0}}};
    });
    setCandInput(p=>({...p,[key]:''}));
    setMsg(`✅ ${uname} → ${ADMIN_POSITIONS.find(p=>p.key===key)?.title} adayı eklendi`);
  };
  const removeCand = (key, username) => {
    setElections_multi(prev=>({...prev,[key]:{...prev[key],candidates:(prev[key]?.candidates||[]).filter(c=>c.username!==username)}}));
  };
  const resetPos = (key) => {
    if(!window.confirm('Bu seçimi sıfırla?')) return;
    setElections_multi(prev=>({...prev,[key]:{active:false,candidates:[],votes:{},userVotedIds:[],winner:null}}));
    setMsg(`↺ ${ADMIN_POSITIONS.find(p=>p.key===key)?.title} seçimi sıfırlandı`);
  };
  return (
    <div>
      <div style={{fontSize:'0.7rem',color:'#8893A1',marginBottom:'0.65rem'}}>Her makam için bağımsız seçim yönetin. Parti liderleri aday gösterir, oylamayı siz başlatırsınız.</div>
      {ADMIN_POSITIONS.map(pos=>{
        const el = elections_multi[pos.key]||{};
        const cands = el.candidates||[];
        const votes = el.votes||{};
        const sorted = [...cands].sort((a,b)=>(votes[b.username]||0)-(votes[a.username]||0));
        const totalV = sorted.reduce((s,c)=>s+(votes[c.username]||0),0);
        return (
          <div key={pos.key} style={{...cs,border:`1px solid ${el.active?'rgba(76,154,107,0.3)':'rgba(255,215,0,0.15)'}`,marginBottom:'0.5rem'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.5rem'}}>
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                <span style={{fontSize:'1.2rem'}}>{pos.icon}</span>
                <div>
                  <div style={{fontWeight:800,color:'#C9A227',fontSize:'0.85rem'}}>{pos.title}</div>
                  <div style={{fontSize:'0.65rem',color:'#8893A1'}}>
                    {cands.length} aday •
                    {el.active ? <span style={{color:'#4C9A6B'}}> 🟢 Aktif</span> : el.winner ? <span style={{color:'#C9A227'}}> 🏆 {el.winner}</span> : <span style={{color:'#8893A1'}}> ⏸ Pasif</span>}
                  </div>
                </div>
              </div>
              <div style={{display:'flex',gap:'0.3rem',flexWrap:'wrap',justifyContent:'flex-end'}}>
                {!el.active
                  ? <button onClick={()=>startPos(pos.key)} style={{padding:'0.35rem 0.65rem',borderRadius:'8px',border:'1px solid rgba(76,154,107,0.4)',background:'rgba(76,154,107,0.08)',color:'#4C9A6B',cursor:'pointer',fontWeight:700,fontSize:'0.72rem',minHeight:32}}>▶ Başlat</button>
                  : <button onClick={()=>endPos(pos.key)} style={{padding:'0.35rem 0.65rem',borderRadius:'8px',border:'1px solid rgba(201,162,39,0.3)',background:'rgba(201,162,39,0.08)',color:'#C9A227',cursor:'pointer',fontWeight:700,fontSize:'0.72rem',minHeight:32}}>🏁 Bitir</button>}
                <button onClick={()=>resetPos(pos.key)} style={{padding:'0.35rem 0.55rem',borderRadius:'8px',border:'1px solid rgba(194,75,67,0.25)',background:'rgba(194,75,67,0.08)',color:'#E08C87',cursor:'pointer',fontWeight:700,fontSize:'0.72rem',minHeight:32}}>↺</button>
              </div>
            </div>
            {PARTY_BASED_KEYS.includes(pos.key) ? (
              <div style={{marginBottom:'0.4rem'}}>
                <div style={{fontSize:'0.65rem',color:'#C9A227',marginBottom:'0.35rem',fontWeight:700}}>⚑ Parti Bazlı Seçim — İlk 10 Parti Otomatik Aday</div>
                <button onClick={()=>loadPartyCandidates(pos.key)} style={{padding:'0.38rem 0.75rem',borderRadius:'8px',border:'1px solid rgba(201,162,39,0.35)',background:'rgba(167,139,250,0.1)',color:'#C9A227',cursor:'pointer',fontWeight:700,fontSize:'0.73rem',minHeight:32}}>🔄 Parti Liderlerini Yükle</button>
              </div>
            ) : (
              <div style={{display:'flex',gap:'0.35rem',marginBottom:'0.4rem'}}>
                <input value={candInput[pos.key]||''} onChange={e=>setCandInput(p=>({...p,[pos.key]:e.target.value}))}
                  onKeyDown={e=>e.key==='Enter'&&addCand(pos.key)}
                  placeholder="Kullanıcı adı ekle..." style={{...inp,flex:1,padding:'0.38rem 0.6rem',fontSize:'0.8rem'}}/>
                <button onClick={()=>addCand(pos.key)} style={{padding:'0.38rem 0.65rem',borderRadius:'8px',border:'1px solid rgba(255,215,0,0.4)',background:'rgba(255,215,0,0.1)',color:'#C9A227',cursor:'pointer',fontWeight:700,fontSize:'0.75rem',whiteSpace:'nowrap',minHeight:34}}>+ Ekle</button>
              </div>
            )}
            {cands.length>0 && (
              <div style={{display:'flex',flexWrap:'wrap',gap:'0.3rem'}}>
                {sorted.map((c,i)=>{
                  const pct = totalV>0?Math.round((votes[c.username]||0)/totalV*100):0;
                  return (
                    <div key={c.username} style={{background:'rgba(237,231,218,0.04)',border:`1px solid ${i===0&&totalV>0?'rgba(201,162,39,0.4)':'rgba(255,255,255,0.08)'}`,borderRadius:'8px',padding:'3px 8px',display:'flex',alignItems:'center',gap:'0.3rem',fontSize:'0.72rem'}}>
                      <span style={{color:i===0&&totalV>0?'#C9A227':'#94A3B8'}}>{i===0&&totalV>0?'🥇':i===1&&totalV>0?'🥈':i===2&&totalV>0?'🥉':'·'} {c.username}</span>
                      {totalV>0&&<span style={{color:'#8893A1',fontSize:'0.6rem'}}>({votes[c.username]||0} oy · {pct}%)</span>}
                      {!el.active&&<span onClick={()=>removeCand(pos.key,c.username)} style={{cursor:'pointer',color:'#C24B43',fontSize:'0.85rem',lineHeight:1,marginLeft:'0.15rem'}}>×</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AdminMakamlarTab({ allUsers, setAllUsersRaw, setMsg, cs, inp }) {
  const [cab, setCab] = useState(()=>{try{return JSON.parse(localStorage.getItem('rep_cabinet')||'{}');}catch{return{};}});
  const [assignInputs, setAssignInputs] = useState({});
  const saveCab = (newCab) => { setCab(newCab); localStorage.setItem('rep_cabinet', JSON.stringify(newCab)); };
  const assign = (title) => {
    const uname = (assignInputs[title]||'').trim();
    if (!uname) { setMsg('Kullanıcı adı girin'); return; }
    const users = (()=>{try{return JSON.parse(localStorage.getItem('rep_users')||'[]');}catch{return[];}})();
    const nc = {...cab,[title]:uname};
    saveCab(nc);
    const updated = users.map(u=>u.username===uname?{...u,position:title}:u);
    localStorage.setItem('rep_users',JSON.stringify(updated));
    setAllUsersRaw(updated);
    setAssignInputs(p=>({...p,[title]:''}));
    setMsg(`✅ ${uname} → ${title} atandı!`);
  };
  const remove = (title) => {
    const uname = cab[title];
    const nc = {...cab};
    delete nc[title];
    saveCab(nc);
    if (uname) {
      const users = (()=>{try{return JSON.parse(localStorage.getItem('rep_users')||'[]');}catch{return[];}})();
      const updated = users.map(u=>u.username===uname?{...u,position:'Vatandaş'}:u);
      localStorage.setItem('rep_users',JSON.stringify(updated));
      setAllUsersRaw(updated);
    }
    setMsg(`🗑️ ${title} makamı boşaltıldı`);
  };
  const giveVIP = (u) => {
    const users=(()=>{try{return JSON.parse(localStorage.getItem('rep_users')||'[]');}catch{return[];}})();
    const expiry=Date.now()+30*24*3600000;
    const upd=users.map(x=>x.id===u.id?{...x,premium:true,premiumExpiry:expiry,vip:true}:x);
    localStorage.setItem('rep_users',JSON.stringify(upd));
    setAllUsersRaw(upd);
    setMsg(`✅ ${u.username} → 30 gün VIP`);
  };
  const giveEdu = (u) => {
    const users=(()=>{try{return JSON.parse(localStorage.getItem('rep_users')||'[]');}catch{return[];}})();
    const expiry=Date.now()+30*24*3600000;
    const upd=users.map(x=>x.id===u.id?{...x,eduPackage:true,eduPackageExpiry:expiry,packages:{...(x.packages||{}),edu:true}}:x);
    localStorage.setItem('rep_users',JSON.stringify(upd));
    setAllUsersRaw(upd);
    setMsg(`✅ ${u.username} → Eğitim Paketi`);
  };
  return (
    <div>
      <div style={{fontSize:'0.7rem',color:'#8893A1',marginBottom:'0.65rem'}}>Kullanıcıları makama direkt atayın. Seçim kazandıklarında da buraya yansır.</div>
      {ADMIN_POSITIONS.map(m=>{
        const current = cab[m.title]||null;
        return (
          <div key={m.key} style={{...cs,border:`1px solid ${current?'rgba(255,215,0,0.2)':'rgba(255,255,255,0.06)'}`,marginBottom:'0.45rem'}}>
            <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.4rem'}}>
              <span style={{fontSize:'1.1rem'}}>{m.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,color:'#C9A227',fontSize:'0.82rem'}}>{m.title}</div>
                <div style={{fontSize:'0.67rem',color:current?'#4C9A6B':'#3B4E63'}}>{current?`👤 ${current}`:'Boş — Atanmamış'}</div>
              </div>
              {current&&<button onClick={()=>remove(m.title)} style={{padding:'0.25rem 0.5rem',borderRadius:'6px',border:'1px solid rgba(194,75,67,0.3)',background:'rgba(194,75,67,0.08)',color:'#E08C87',cursor:'pointer',fontSize:'0.68rem',fontWeight:700,minHeight:28}}>✕</button>}
            </div>
            <div style={{display:'flex',gap:'0.35rem'}}>
              <input value={assignInputs[m.title]||''} onChange={e=>setAssignInputs(p=>({...p,[m.title]:e.target.value}))}
                onKeyDown={e=>e.key==='Enter'&&assign(m.title)}
                placeholder="Kullanıcı adı..." style={{...inp,flex:1,padding:'0.38rem 0.6rem',fontSize:'0.8rem'}}/>
              <button onClick={()=>assign(m.title)} style={{padding:'0.38rem 0.7rem',borderRadius:'8px',border:'1px solid rgba(255,215,0,0.4)',background:'rgba(255,215,0,0.1)',color:'#C9A227',cursor:'pointer',fontWeight:700,fontSize:'0.75rem',minHeight:34}}>Ata</button>
            </div>
          </div>
        );
      })}
      <div style={{...cs,borderColor:'rgba(201,162,39,0.25)',marginTop:'0.75rem'}}>
        <div style={{fontWeight:800,color:'#C9A227',fontSize:'0.82rem',marginBottom:'0.6rem'}}>💎 VIP & Paket Ver</div>
        {[...allUsers].filter(u=>!u.isBot).slice(0,20).map(u=>(
          <div key={u.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.38rem 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
            <div style={{fontSize:'0.78rem',color:'#EDE7DA',fontWeight:600}}>{u.username}</div>
            <div style={{display:'flex',gap:'0.3rem'}}>
              <button onClick={()=>giveVIP(u)} style={{padding:'0.2rem 0.5rem',borderRadius:'6px',border:'1px solid rgba(236,72,153,0.4)',background:'rgba(236,72,153,0.1)',color:'#F472B6',cursor:'pointer',fontSize:'0.65rem',fontWeight:700}}>💎 VIP</button>
              <button onClick={()=>giveEdu(u)} style={{padding:'0.2rem 0.5rem',borderRadius:'6px',border:'1px solid rgba(201,162,39,0.35)',background:'rgba(201,162,39,0.1)',color:'#C9A227',cursor:'pointer',fontSize:'0.65rem',fontWeight:700}}>📚 Edu</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const ACHIEVEMENTS_LIST = [
  { id:'first_money',   icon:'💰', title:'İlk Kazanç',      desc:'🪙1.000 kazan',                   check: u => (u.money||0) >= 1000 },
  { id:'first_10k',     icon:'💵', title:'Para Babası',      desc:'🪙10.000 kazan',                  check: u => (u.money||0) >= 10000 },
  { id:'first_100k',    icon:'💸', title:'Varlıklı',         desc:'🪙100.000 kazan',                 check: u => (u.money||0) >= 100000 },
  { id:'millionaire',   icon:'💎', title:'Milyoner',         desc:'🪙1.000.000 kazan',               check: u => (u.money||0) >= 1000000 },
  { id:'billionaire',   icon:'🏆', title:'Milyarder',        desc:'🪙1 Milyar kazan',                check: u => (u.money||0) >= 1e9 },
  { id:'first_party',   icon:'🏛️', title:'Siyasetçi',        desc:'Bir partiye katıl',               check: (u,s) => !!(s.parties||[]).find(p=>(p.members||[]).includes(u.uid)) },
  { id:'party_leader',  icon:'👑', title:'Parti Lideri',     desc:'Bir parti kur',                   check: (u,s) => !!(s.parties||[]).find(p=>p.leaderId===u.uid) },
  { id:'first_holding', icon:'🏢', title:'İşadamı',          desc:'İlk şirketini kur',               check: (u,s) => (s.holdings||[]).some(h=>h.owner===u.uid) },
  { id:'investor',      icon:'📈', title:'Yatırımcı',        desc:'Hisse senedi al',                 check: (u,s) => Object.keys(s.stockPortfolio||{}).length > 0 },
  { id:'gang_member',   icon:'💀', title:'Yeraltı Üyesi',    desc:'Bir çeteye katıl',                check: (u,s) => !!(s.gangs||[]).find(g=>(g.members||[]).includes(u.uid)) },
  { id:'law_voter',     icon:'⚖️', title:'Demokrat',         desc:'Bir yasaya oy ver',               check: (u,s) => (s.laws||[]).some(l=>l.votes?.voters?.[u.uid]) },
  { id:'elected',       icon:'🗳️', title:'Seçmen',           desc:'Seçimde oy kullan',               check: (u,s) => !!(s.elections?.votes?.[u.uid]) },
  { id:'farmer',        icon:'🌾', title:'Çiftçi',           desc:'İlk hasatı yap',                  check: (u,s) => (s.userFarms||[]).some(f=>f.harvested) },
  { id:'chatty',        icon:'💬', title:'Sosyalci',         desc:'10 mesaj gönder',                 check: u => (u.msgCount||0) >= 10 },
  { id:'level5',        icon:'⭐', title:'Tecrübeli',         desc:'Seviye 5\'e ulaş',                check: u => (u.level||1) >= 5 },
  { id:'level10',       icon:'🌟', title:'Uzman',            desc:'Seviye 10\'a ulaş',               check: u => (u.level||1) >= 10 },
  { id:'premium',       icon:'💎', title:'VIP Üye',          desc:'Premium satın al',                check: u => !!u.premium },
  { id:'alliance',      icon:'🤝', title:'Müttefik',         desc:'Bir ittifaka katıl',              check: (u,s) => !!(s.alliances||[]).find(a=>(a.members||[]).includes(u.uid)) },
];

function AdminSupportTab({ setMsg, inp, cs }) {
  const [supportMsgs, setSupportMsgsLocal] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rep_supportMsgs')||'[]'); } catch{return[];}
  });
  const [replyTexts, setReplyTexts] = useState({});

  const refresh = () => {
    try { setSupportMsgsLocal(JSON.parse(localStorage.getItem('rep_supportMsgs')||'[]')); } catch{}
  };
  const sendReply = (msgId) => {
    const text = (replyTexts[msgId]||'').trim();
    if (!text) return;
    try {
      const all = JSON.parse(localStorage.getItem('rep_supportMsgs')||'[]');
      const upd = all.map(m => m.id===msgId ? {...m, replies:[...(m.replies||[]),{text,by:'Admin',ts:Date.now()}], status:'replied'} : m);
      localStorage.setItem('rep_supportMsgs', JSON.stringify(upd));
      window.dispatchEvent(new CustomEvent('fb-sync',{detail:{key:'supportMsgs',value:upd}}));
      setSupportMsgsLocal(upd);
      setReplyTexts(prev => ({...prev,[msgId]:''}));
      setMsg('✅ Yanıt gönderildi');
    } catch(e){}
  };
  const deleteMsg = (msgId) => {
    try {
      const all = JSON.parse(localStorage.getItem('rep_supportMsgs')||'[]');
      const upd = all.filter(m => m.id!==msgId);
      localStorage.setItem('rep_supportMsgs', JSON.stringify(upd));
      window.dispatchEvent(new CustomEvent('fb-sync',{detail:{key:'supportMsgs',value:upd}}));
      setSupportMsgsLocal(upd);
      setMsg('🗑️ Mesaj silindi');
    } catch(e){}
  };
  return (
    <div>
      <div style={{...cs,display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.65rem'}}>
        <div>
          <div style={{fontWeight:800,color:'#EDE7DA',fontSize:'0.9rem'}}>💬 Destek Mesajları</div>
          <div style={{fontSize:'0.7rem',color:'#8893A1',marginTop:'0.2rem'}}>{supportMsgs.length} mesaj • {supportMsgs.filter(m=>m.status==='pending').length} yanıtsız</div>
        </div>
        <button onClick={refresh} style={{padding:'0.3rem 0.65rem',borderRadius:'8px',border:'1px solid rgba(237,231,218,0.1)',background:'rgba(237,231,218,0.03)',color:'#8893A1',fontSize:'0.72rem',cursor:'pointer',fontFamily:"'Inter',sans-serif",fontWeight:700}}>🔄 Yenile</button>
      </div>
      {supportMsgs.length === 0 && <div style={{...cs,textAlign:'center',color:'#8893A1',padding:'2rem',fontSize:'0.85rem'}}>Henüz destek mesajı yok</div>}
      {[...supportMsgs].reverse().map(m => (
        <div key={m.id} style={{...cs,border:`1px solid ${m.status==='pending'?'rgba(194,75,67,0.25)':'rgba(76,154,107,0.2)'}`,marginBottom:'0.5rem'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.5rem'}}>
            <div>
              <div style={{fontWeight:700,color:'#EDE7DA',fontSize:'0.85rem'}}>👤 {m.from||'Anonim'}</div>
              <div style={{fontSize:'0.65rem',color:'#8893A1'}}>{new Date(m.ts).toLocaleString('tr-TR')} • <span style={{color:m.status==='pending'?'#C24B43':'#4C9A6B',fontWeight:700}}>{m.status==='pending'?'⏳ Yanıtsız':'✅ Yanıtlandı'}</span></div>
            </div>
            <button onClick={()=>deleteMsg(m.id)} style={{padding:'0.2rem 0.5rem',borderRadius:'6px',border:'1px solid rgba(194,75,67,0.25)',background:'rgba(194,75,67,0.08)',color:'#C24B43',fontSize:'0.7rem',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>🗑️</button>
          </div>
          <div style={{background:'rgba(237,231,218,0.02)',borderRadius:'8px',padding:'0.6rem 0.75rem',fontSize:'0.82rem',color:'#C8D3DC',marginBottom:'0.5rem',lineHeight:1.5}}>{m.text}</div>
          {(m.replies||[]).map((r,i)=>(
            <div key={i} style={{background:'rgba(76,154,107,0.06)',borderRadius:'8px',padding:'0.4rem 0.75rem',fontSize:'0.78rem',color:'#4C9A6B',marginBottom:'0.3rem'}}>
              <span style={{fontWeight:700}}>⭐ {r.by}:</span> {r.text}
            </div>
          ))}
          <div style={{display:'flex',gap:'0.4rem',marginTop:'0.4rem'}}>
            <input value={replyTexts[m.id]||''} onChange={e=>setReplyTexts(prev=>({...prev,[m.id]:e.target.value}))} placeholder="Yanıt yaz..." style={{...inp,flex:1,fontSize:'0.78rem',padding:'0.4rem 0.65rem'}} />
            <button onClick={()=>sendReply(m.id)} style={{padding:'0.4rem 0.75rem',borderRadius:'8px',border:'none',background:'#4C9A6B',color:'#EDE7DA',fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:'0.75rem',cursor:'pointer',whiteSpace:'nowrap'}}>Yanıtla</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminPushTab({ setMsg, cs, inp }) {
  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody] = useState('');
  const [pushUrl, setPushUrl] = useState('/');
  const [pushLoading, setPushLoading] = useState(false);
  const [pushResult, setPushResult] = useState(null);
  const [targetUserId, setTargetUserId] = useState('');
  const [pushMode, setPushMode] = useState('all');

  const sendPush = async () => {
    if (!pushTitle.trim() || !pushBody.trim()) { setMsg('⚠️ Başlık ve mesaj gerekli'); return; }
    setPushLoading(true); setPushResult(null);
    const jwt = localStorage.getItem('us_jwt') || '';
    const apiBase = window._SOCKET_URL || '';
    const endpoint = pushMode === 'all'
      ? apiBase + '/api/push/broadcast'
      : apiBase + '/api/push/send/' + targetUserId.trim();
    try {
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
        body: JSON.stringify({ title: pushTitle, body: pushBody, url: pushUrl || '/' })
      });
      const d = await r.json();
      setPushResult(d);
      if (d.success || d.sent >= 0) setMsg('✅ Push gönderildi: ' + (d.sent||0) + ' alıcı');
      else setMsg('⚠️ ' + (d.message || 'Gönderme hatası'));
    } catch(e) { setMsg('❌ Hata: ' + e.message); }
    setPushLoading(false);
  };

  return (
    <div style={cs}>
      <div style={{fontWeight:700,color:'#EDE7DA',marginBottom:'0.75rem',fontSize:'0.9rem'}}>📲 Push Bildirim Yayını</div>

      <div style={{display:'flex',gap:'0.5rem',marginBottom:'0.65rem'}}>
        {[['all','🌍 Tüm Kullanıcılar'],['user','👤 Belirli Kullanıcı']].map(([v,l])=>(
          <button key={v} onClick={()=>setPushMode(v)}
            style={{flex:1,padding:'0.45rem',borderRadius:'8px',border:'1px solid '+(pushMode===v?'rgba(194,75,67,0.4)':'rgba(255,255,255,0.08)'),background:pushMode===v?'rgba(194,75,67,0.12)':'rgba(255,255,255,0.03)',color:pushMode===v?'#E08C87':'#8893A1',fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:'0.75rem',cursor:'pointer'}}>
            {l}
          </button>
        ))}
      </div>

      {pushMode === 'user' && (
        <input value={targetUserId} onChange={e=>setTargetUserId(e.target.value)} placeholder="Kullanıcı ID (UUID)" style={{...inp,marginBottom:'0.5rem'}} />
      )}

      <input value={pushTitle} onChange={e=>setPushTitle(e.target.value)} placeholder="Bildirim başlığı" style={{...inp,marginBottom:'0.5rem'}} />
      <textarea value={pushBody} onChange={e=>setPushBody(e.target.value)} placeholder="Bildirim mesajı..." rows={3}
        style={{...inp,marginBottom:'0.5rem',resize:'vertical',height:'70px'}} />
      <input value={pushUrl} onChange={e=>setPushUrl(e.target.value)} placeholder="Yönlendirme URL (ör: /)" style={{...inp,marginBottom:'0.65rem'}} />

      <button onClick={sendPush} disabled={pushLoading}
        style={{width:'100%',padding:'0.75rem',borderRadius:'10px',border:'none',background:pushLoading?'rgba(194,75,67,0.3)':'rgba(194,75,67,0.85)',color:'#EDE7DA',fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:'0.9rem',cursor:pushLoading?'not-allowed':'pointer'}}>
        {pushLoading ? '⏳ Gönderiliyor...' : '📲 Push Gönder'}
      </button>

      {pushResult && (
        <div style={{marginTop:'0.75rem',background:'rgba(76,154,107,0.07)',border:'1px solid rgba(76,154,107,0.2)',borderRadius:'8px',padding:'0.6rem 0.85rem',fontSize:'0.8rem',color:'#4C9A6B'}}>
          ✅ Gönderildi: {pushResult.sent||0} / {pushResult.total||0} aboneye
          {pushResult.errors > 0 && React.createElement('span',{style:{color:'#E08C87',marginLeft:'0.5rem'}},'('+pushResult.errors+' hata)')}
        </div>
      )}
    </div>
  );
}

function AdminPage({ profile, showNotif, onNavigate }) {
  const [tab, setTab] = useState('dashboard');
  const [allUsers, setAllUsersRaw] = useState(() => {
    try { const v = localStorage.getItem('rep_users'); return v ? JSON.parse(v) : []; } catch { return []; }
  });
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [giftAmount, setGiftAmount] = useState('');
  const [giftUC, setGiftUC] = useState('');
  const [banReason, setBanReason] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [announcements, setAnnouncements] = useLs('announcements', []);
  const [msg, setMsg] = useState('');
  const [editMoney, setEditMoney] = useState('');
  const [tabLog, setTabLog] = useState('all');
  const [elections_adm, setElections_adm] = useLs('rep_elections', {phase:'idle',candidates:[],votes:{}});
  const onlineCnt = useOnlineCount();

  const isAdmin = profile?.role === 'admin';

  const refreshUsers = () => {
    try { const v = localStorage.getItem('rep_users'); setAllUsersRaw(v ? JSON.parse(v) : []); } catch {}
  };

  const saveUsers = (updated) => {
    localStorage.setItem('rep_users', JSON.stringify(updated));
    setAllUsersRaw(updated);
  };

  const filteredUsers = allUsers.filter(u =>
    !search.trim() ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const banToggle = (u) => {
    const newBanned = !u.banned;
    const updated = allUsers.map(x => x.id===u.id ? {...x, banned:newBanned, banReason:newBanned?(banReason||'Admin kararı'):''} : x);
    saveUsers(updated);
    if (selectedUser?.id === u.id) setSelectedUser({...selectedUser, banned:newBanned});
    setMsg(`${newBanned?'🚫 Kullanıcı banlandı':'✅ Ban kaldırıldı'}: ${u.username}`);
    setBanReason('');
  };

  const giveMoney = (u) => {
    const amt = parseInt(giftAmount);
    if (!amt || amt <= 0) { setMsg('Geçerli bir miktar girin'); return; }
    // ── Supabase'e yaz ──────────────────────────────────────────────────────
    const jwt = localStorage.getItem('us_jwt') || '';
    const apiBase = window._SOCKET_URL || window.__ENV__?.API_BASE || '';
    fetch(apiBase + '/api/admin/users/' + u.id + '/money', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
      body: JSON.stringify({ amount: amt, operation: 'add', reason: 'Admin hediye' })
    }).then(r => r.json()).then(data => {
      if (data.success) {
        const newMoney = data.newMoney !== undefined ? data.newMoney : (u.money||0)+amt;
        const updated = allUsers.map(x => x.id===u.id ? {...x, money: newMoney} : x);
        saveUsers(updated);
        const currentUserId = localStorage.getItem('userId');
        if (currentUserId === u.id) {
          try { const p=JSON.parse(localStorage.getItem('rep_userProfile')||'{}'); const np={...p,money:newMoney}; localStorage.setItem('rep_userProfile',JSON.stringify(np)); window.dispatchEvent(new CustomEvent('fb-sync',{detail:{key:'userProfile',value:np}})); } catch(e){}
        }
        if (selectedUser?.id === u.id) setSelectedUser({...selectedUser, money: newMoney});
        setGiftAmount('');
        setMsg('✅ ' + u.username + ' kullanıcısına ' + fmtM(amt) + ' verildi (DB güncellendi)');
      } else {
        setMsg('❌ Hata: ' + (data.message || 'API hatası'));
      }
    }).catch(e => {
      // API başarısız olursa en azından local güncelle
      const updated = allUsers.map(x => x.id===u.id ? {...x, money:(x.money||0)+amt} : x);
      saveUsers(updated);
      setGiftAmount('');
      setMsg('⚠️ ' + u.username + ' local güncellendi (sunucu hatası: ' + e.message + ')');
    });
  };

  const giveUC = (u) => {
    const amt = parseInt(giftUC);
    if (!amt || amt <= 0) { setMsg('Geçerli bir Altın miktarı girin'); return; }
    const jwt = localStorage.getItem('us_jwt') || '';
    const apiBase = window._SOCKET_URL || window.__ENV__?.API_BASE || '';
    // Altın için de admin money endpoint'ini kullan (altin alanı)
    fetch(apiBase + '/api/admin/users/' + u.id + '/coins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
      body: JSON.stringify({ amount: amt, operation: 'add', reason: 'Admin Altın hediye' })
    }).then(r => r.json()).then(data => {
      const newUC = data.success && data.newCoins !== undefined ? data.newCoins : (u.underCoin||0)+amt;
      const updated = allUsers.map(x => x.id===u.id ? {...x, underCoin: newUC} : x);
      saveUsers(updated);
      const currentUserId = localStorage.getItem('userId');
      if (currentUserId === u.id) {
        try { const p=JSON.parse(localStorage.getItem('rep_userProfile')||'{}'); const np={...p,underCoin:newUC}; localStorage.setItem('rep_userProfile',JSON.stringify(np)); window.dispatchEvent(new CustomEvent('fb-sync',{detail:{key:'userProfile',value:np}})); } catch(e){}
      }
      if (selectedUser?.id === u.id) setSelectedUser({...selectedUser, underCoin: newUC});
      setGiftUC('');
      setMsg(data.success ? ('✅ ' + u.username + ' kullanıcısına ' + amt + ' Altın verildi') : ('⚠️ Local güncellendi: ' + (data.message||'')));
    }).catch(() => {
      const updated = allUsers.map(x => x.id===u.id ? {...x, underCoin:(x.underCoin||0)+amt} : x);
      saveUsers(updated);
      setGiftUC('');
      setMsg('⚠️ ' + u.username + ' Altın local güncellendi (sunucu bağlantı hatası)');
    });
  };

  const setMoneyDirect = (u) => {
    const amt = parseInt(editMoney);
    if (isNaN(amt)) { setMsg('Geçerli bir miktar girin'); return; }
    const jwt = localStorage.getItem('us_jwt') || '';
    const apiBase = window._SOCKET_URL || window.__ENV__?.API_BASE || '';
    fetch(apiBase + '/api/admin/users/' + u.id + '/money', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
      body: JSON.stringify({ amount: amt, operation: 'set', reason: 'Admin direkt ayarlama' })
    }).then(r => r.json()).then(data => {
      if (data.success) {
        const newMoney = data.newMoney !== undefined ? data.newMoney : amt;
        const updated = allUsers.map(x => x.id===u.id ? {...x, money: newMoney} : x);
        saveUsers(updated);
        const currentUserId = localStorage.getItem('userId');
        if (currentUserId === u.id) {
          try { const p=JSON.parse(localStorage.getItem('rep_userProfile')||'{}'); const np={...p,money:newMoney}; localStorage.setItem('rep_userProfile',JSON.stringify(np)); window.dispatchEvent(new CustomEvent('fb-sync',{detail:{key:'userProfile',value:np}})); } catch(e){}
        }
        if (selectedUser?.id === u.id) setSelectedUser({...selectedUser, money: newMoney});
        setEditMoney('');
        setMsg('✅ ' + u.username + ' bakiyesi ' + fmtM(newMoney) + ' olarak ayarlandı (DB güncellendi)');
      } else {
        setMsg('❌ Hata: ' + (data.message || 'API hatası'));
      }
    }).catch(e => {
      const updated = allUsers.map(x => x.id===u.id ? {...x, money:amt} : x);
      saveUsers(updated);
      setEditMoney('');
      setMsg('⚠️ Local güncellendi (sunucu hatası: ' + e.message + ')');
    });
  };

  const makeAdmin = (u) => {
    const updated = allUsers.map(x => x.id===u.id ? {...x, role: x.role==='admin'?'user':'admin'} : x);
    saveUsers(updated);
    if (selectedUser?.id === u.id) setSelectedUser({...selectedUser, role: selectedUser.role==='admin'?'user':'admin'});
    setMsg(`✅ ${u.username} rolü güncellendi`);
  };

  const giveEduPackage = (u) => {
    const expiry = Date.now() + 30*24*60*60*1000;
    const updated = allUsers.map(x => x.id===u.id ? {...x, eduPackage:true, eduPackageExpiry:expiry, packages:{...(x.packages||{}),edu:true}} : x);
    saveUsers(updated);
    if (selectedUser?.id === u.id) setSelectedUser({...selectedUser, eduPackage:true, eduPackageExpiry:expiry, packages:{...(selectedUser.packages||{}),edu:true}});
    setMsg(`✅ ${u.username} kullanıcısına 30 günlük Eğitim Paketi verildi`);
  };

  const giveMaxEdu = (u) => {
    const updated = allUsers.map(x => x.id===u.id ? {...x, education:{...(x.education||{}), diploma:'profesor', activeLevel:null, clicksDone:0, lastClick:0}} : x);
    saveUsers(updated);
    if (selectedUser?.id === u.id) setSelectedUser({...selectedUser, education:{...(selectedUser.education||{}), diploma:'profesor', activeLevel:null, clicksDone:0, lastClick:0}});
    setMsg(`✅ ${u.username} kullanıcısına Profesör diploması verildi`);
  };

  const resetUser = (u) => {
    const updated = allUsers.map(x => x.id===u.id ? {...x, money:10000, xp:0, level:1, underCoin:50, banned:false} : x);
    saveUsers(updated);
    if (selectedUser?.id === u.id) setSelectedUser({...selectedUser, money:10000, xp:0, level:1, underCoin:50});
    setMsg(`✅ ${u.username} sıfırlandı`);
  };

  const deleteUser = (u) => {
    const updated = allUsers.filter(x => x.id !== u.id);
    saveUsers(updated);
    setSelectedUser(null);
    setMsg(`✅ ${u.username} silindi`);
  };

  const [annTitle, setAnnTitle] = useState('');
  const [annCategory, setAnnCategory] = useState('Sistem');
  const [annIcon, setAnnIcon] = useState('📢');
  const [annImage, setAnnImage] = useState('');

  const sendAnnouncement = () => {
    if (!annTitle.trim()) { setMsg('Duyuru başlığı girin'); return; }
    if (!announcement.trim()) { setMsg('Duyuru metni girin'); return; }
    const ann = {
      id:genId(), title:annTitle.trim(), text:announcement.trim(), body:announcement.trim(),
      by:profile?.username||'Admin', ts:Date.now(), type:'system',
      category:annCategory, icon:annIcon, imageUrl:annImage.trim()||undefined
    };
    const newAnns = [ann, ...announcements].slice(0, 50);
    setAnnouncements(newAnns);
    try{window._socket?.emit('announcement:new',{announcement:ann});window._socket?.emit('announcement:sync',{announcements:newAnns});}catch(e){}
    setAnnouncement(''); setAnnTitle(''); setAnnImage('');
    setMsg('✅ Duyuru yayınlandı');
    showNotif?.('📢 Sistem duyurusu yayınlandı', 'info');
  };

  const totalMoney = allUsers.reduce((s,u)=>s+(u.money||0), 0);
  const bannedCount = allUsers.filter(u=>u.banned).length;
  const adminCount = allUsers.filter(u=>u.role==='admin').length;

  const cs = {background:'rgba(237,231,218,0.03)',borderRadius:'14px',padding:'1rem',border:'1px solid rgba(237,231,218,0.08)',marginBottom:'0.65rem'};
  const inp = {width:'100%',background:'rgba(237,231,218,0.03)',border:'1px solid rgba(237,231,218,0.1)',borderRadius:'10px',padding:'0.55rem 0.8rem',color:'#EDE7DA',fontFamily:"'Inter',sans-serif",fontSize:'15px',outline:'none',boxSizing:'border-box'};
  const tabs = [['dashboard','📊 Panel'],['users','👥 Kullanıcılar'],['manage','🛡️ Yönet'],['announce','📢 Duyuru'],['push','📲 Push'],['support','💬 Destek'],['logs','📋 Log'],['economy','💰 Ekonomi'],['tools','🛠️ Araçlar'],['election','🗳️ Seçim'],['makamlar','👑 Makamlar']];
  const [elections_multi, setElections_multi] = useLs('rep_elections_multi', {});

  return (
    <div style={{padding:'0.7rem',minHeight:'100%',background:'rgba(6,12,24,0.99)'}}>
      <div style={{background:'linear-gradient(135deg,rgba(194,75,67,0.15),rgba(11,21,39,0.95))',border:'1px solid rgba(194,75,67,0.25)',borderRadius:'10px',padding:'1rem 1.25rem',marginBottom:'0.75rem'}}>
        <div style={{fontSize:'0.6rem',color:'#E08C87',fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:'0.2rem'}}>⚙️ YÖNETİM PANELİ</div>
        <div style={{fontSize:'1.1rem',fontWeight:900,color:'#EDE7DA',fontFamily:"'Cinzel',serif"}}>Admin: {profile?.username}</div>
        <div style={{fontSize:'0.7rem',color:'#8893A1',marginTop:'0.1rem'}}>{allUsers.length} kullanıcı • {onlineCnt} online • {bannedCount} banlı</div>
      </div>

      <div style={{display:'flex',gap:'4px',overflowX:'auto',scrollbarWidth:'none',marginBottom:'0.75rem'}}>
        {tabs.map(([id,label]) => (
          <button key={id} onClick={()=>{setTab(id);if(id!=='manage')setSelectedUser(null);}}
            style={{padding:'0.38rem 0.7rem',borderRadius:'8px',border:`1px solid ${tab===id?'rgba(194,75,67,0.4)':'rgba(255,255,255,0.07)'}`,background:tab===id?'rgba(194,75,67,0.12)':'rgba(255,255,255,0.03)',color:tab===id?'#E08C87':'#8893A1',fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:'0.72rem',cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>
            {label}
          </button>
        ))}
      </div>

      {msg && (
        <div style={{background:'rgba(76,154,107,0.08)',border:'1px solid rgba(76,154,107,0.2)',borderRadius:'10px',padding:'0.55rem 0.8rem',fontSize:'0.78rem',color:'#4C9A6B',marginBottom:'0.65rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>{msg}</span>
          <button onClick={()=>setMsg('')} style={{background:'none',border:'none',color:'#8893A1',cursor:'pointer',fontSize:'1rem',lineHeight:1}}>✕</button>
        </div>
      )}

      {/* ── DASHBOARD ── */}
      {tab==='dashboard' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',marginBottom:'0.65rem'}}>
            {[
              ['👥','Toplam Kullanıcı', allUsers.length, '#C9A227'],
              ['🟢','Şu An Online', onlineCnt, '#4C9A6B'],
              ['🚫','Banlı', bannedCount, '#C24B43'],
              ['⭐','Admin', adminCount, '#C9A227'],
              ['💰','Toplam Servet', fmtM(totalMoney), '#4C9A6B'],
              ['🎮','Sürüm', 'v8.0', '#C9A227'],
            ].map(([ic,lbl,val,c]) => (
              <div key={lbl} style={{...cs,textAlign:'center',padding:'0.75rem'}}>
                <div style={{fontSize:'1.3rem',marginBottom:'0.1rem'}}>{ic}</div>
                <div style={{fontSize:'0.95rem',fontWeight:900,color:c}}>{val}</div>
                <div style={{fontSize:'0.6rem',color:'#8893A1',fontWeight:700,textTransform:'uppercase'}}>{lbl}</div>
              </div>
            ))}
          </div>

          <div style={cs}>
            <div style={{fontWeight:800,color:'#EDE7DA',marginBottom:'0.65rem',fontSize:'0.85rem'}}>🏆 En Zengin Oyuncular</div>
            {[...allUsers].sort((a,b)=>(b.money||0)-(a.money||0)).slice(0,5).map((u,i)=>(
              <div key={u.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.4rem 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                  <span style={{fontSize:'0.85rem'}}>{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
                  <div>
                    <div style={{fontSize:'0.8rem',fontWeight:700,color:u.banned?'#C24B43':'#EDE7DA'}}>{u.username} {u.banned?'🚫':''}{u.role==='admin'?'⭐':''}</div>
                    <div style={{fontSize:'0.65rem',color:'#8893A1'}}>Lv.{u.level||1} • {u.city||'?'}</div>
                  </div>
                </div>
                <div style={{color:'#4C9A6B',fontWeight:800,fontSize:'0.82rem'}}>{fmtM(u.money||0)}</div>
              </div>
            ))}
            {allUsers.length===0 && <div style={{color:'#8893A1',fontSize:'0.8rem',textAlign:'center',padding:'1rem'}}>Henüz kayıtlı kullanıcı yok</div>}
          </div>

          <div style={cs}>
            <div style={{fontWeight:800,color:'#EDE7DA',marginBottom:'0.65rem',fontSize:'0.85rem'}}>⚡ Hızlı Erişim</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'0.4rem'}}>
              {[['👥','Kullanıcılar','users'],['🛡️','Yönet','manage'],['📢','Duyuru','announce'],['📋','Loglar','logs'],['🛠️','Araçlar','tools']].map(([ic,lbl,t])=>(
                <button key={t} onClick={()=>setTab(t)} style={{padding:'0.4rem 0.75rem',borderRadius:'8px',border:'1px solid rgba(237,231,218,0.1)',background:'rgba(237,231,218,0.03)',color:'#8893A1',fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:'0.75rem',cursor:'pointer'}}>{ic} {lbl}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── KULLANICILAR ── */}
      {tab==='users' && (
        <div>
          <div style={{display:'flex',gap:'0.5rem',marginBottom:'0.65rem'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="İsim veya e-posta ara..." style={{...inp,flex:1}} />
            <button onClick={refreshUsers} style={{padding:'0.55rem 0.75rem',borderRadius:'10px',border:'1px solid rgba(237,231,218,0.1)',background:'rgba(237,231,218,0.03)',color:'#8893A1',cursor:'pointer',fontWeight:700,fontSize:'0.8rem',whiteSpace:'nowrap'}}>↻</button>
          </div>
          <div style={{fontSize:'0.7rem',color:'#8893A1',marginBottom:'0.5rem'}}>{filteredUsers.length} kullanıcı gösteriliyor</div>
          {filteredUsers.map(u => (
            <div key={u.id} style={{...cs,marginBottom:'0.4rem',padding:'0.75rem',border:`1px solid ${u.banned?'rgba(194,75,67,0.2)':'rgba(255,255,255,0.06)'}`,cursor:'pointer'}}
              onClick={()=>{setSelectedUser(u);setTab('manage');}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:'0.6rem'}}>
                  <div style={{width:'32px',height:'32px',borderRadius:'50%',background:u.banned?'rgba(194,75,67,0.2)':'rgba(201,162,39,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.9rem',flexShrink:0}}>
                    {u.role==='admin'?'⭐':u.banned?'🚫':'👤'}
                  </div>
                  <div>
                    <div style={{fontSize:'0.85rem',fontWeight:700,color:u.banned?'#E08C87':u.role==='admin'?'#C9A227':'#EDE7DA'}}>{u.username}</div>
                    <div style={{fontSize:'0.65rem',color:'#8893A1'}}>{u.email} • Lv.{u.level||1} • {u.city||'?'}</div>
                  </div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{color:'#4C9A6B',fontWeight:700,fontSize:'0.82rem'}}>{fmtM(u.money||0)}</div>
                  <div style={{fontSize:'0.6rem',color:'#8893A1'}}>{u.underCoin||0} Altın</div>
                </div>
              </div>
            </div>
          ))}
          {filteredUsers.length===0 && <div style={{...cs,textAlign:'center',color:'#8893A1',padding:'2rem'}}>Kullanıcı bulunamadı</div>}
        </div>
      )}

      {/* ── YÖNET ── */}
      {tab==='manage' && (
        <div>
          {!selectedUser ? (
            <div>
              <div style={{color:'#8893A1',fontSize:'0.8rem',marginBottom:'0.65rem'}}>Yönetmek için Kullanıcılar sekmesinden bir kullanıcı seç</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'0.4rem'}}>
                {allUsers.slice(0,10).map(u => (
                  <button key={u.id} onClick={()=>setSelectedUser(u)}
                    style={{padding:'0.35rem 0.75rem',borderRadius:'8px',border:'1px solid rgba(237,231,218,0.1)',background:'rgba(237,231,218,0.03)',color:'#8893A1',fontFamily:"'Inter',sans-serif",fontSize:'0.78rem',cursor:'pointer',fontWeight:600}}>
                    {u.role==='admin'?'⭐':u.banned?'🚫':'👤'} {u.username}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div style={{...cs,background:'linear-gradient(135deg,rgba(201,162,39,0.08),rgba(11,21,39,0.9))'}}>
                <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'0.75rem'}}>
                  <div style={{width:'44px',height:'44px',borderRadius:'50%',background:selectedUser.banned?'rgba(194,75,67,0.2)':'rgba(201,162,39,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',flexShrink:0}}>
                    {selectedUser.role==='admin'?'⭐':selectedUser.banned?'🚫':'👤'}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:900,color:'#EDE7DA',fontSize:'1rem'}}>{selectedUser.username}</div>
                    <div style={{fontSize:'0.7rem',color:'#8893A1'}}>{selectedUser.email} • {selectedUser.city||'?'} • Lv.{selectedUser.level||1}</div>
                    <div style={{fontSize:'0.7rem',marginTop:'0.15rem'}}>
                      {selectedUser.banned && <span style={{color:'#C24B43',fontWeight:700}}>🚫 Banlı: {selectedUser.banReason}</span>}
                      {selectedUser.role==='admin' && <span style={{color:'#C9A227',fontWeight:700}}>⭐ Admin</span>}
                    </div>
                  </div>
                  <button onClick={()=>setSelectedUser(null)} style={{background:'rgba(237,231,218,0.05)',border:'1px solid rgba(237,231,218,0.1)',borderRadius:'8px',padding:'0.3rem 0.6rem',color:'#8893A1',cursor:'pointer',fontWeight:700,fontSize:'0.78rem'}}>✕</button>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.4rem',marginBottom:'0.75rem'}}>
                  {[['💰',fmtM(selectedUser.money||0),'Para'],['💎',selectedUser.underCoin||0,'Altın'],['⭐',selectedUser.level||1,'Seviye'],['📊',selectedUser.xp||0,'XP'],['❤️',selectedUser.hp||100,'HP'],['🏙️',selectedUser.city||'?','Şehir']].map(([ic,v,l])=>(
                    <div key={l} style={{background:'rgba(237,231,218,0.02)',borderRadius:'8px',padding:'0.4rem',textAlign:'center'}}>
                      <div style={{fontSize:'0.9rem'}}>{ic}</div>
                      <div style={{fontWeight:700,color:'#EDE7DA',fontSize:'0.75rem'}}>{v}</div>
                      <div style={{fontSize:'0.55rem',color:'#8893A1',textTransform:'uppercase'}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Para ver */}
              <div style={cs}>
                <div style={{fontWeight:700,color:'#4C9A6B',marginBottom:'0.5rem',fontSize:'0.8rem'}}>💰 Para İşlemleri</div>
                <div style={{display:'flex',gap:'0.4rem',marginBottom:'0.4rem'}}>
                  <input type="number" value={giftAmount} onChange={e=>setGiftAmount(e.target.value)} placeholder="Verilecek para" style={{...inp,flex:1}} />
                  <button onClick={()=>giveMoney(selectedUser)} style={{padding:'0.55rem 0.75rem',borderRadius:'10px',border:'none',background:'#4C9A6B',color:'#EDE7DA',fontWeight:700,fontSize:'0.78rem',cursor:'pointer',whiteSpace:'nowrap'}}>+ Ver</button>
                </div>
                <div style={{display:'flex',gap:'0.4rem',marginBottom:'0.4rem'}}>
                  <input type="number" value={editMoney} onChange={e=>setEditMoney(e.target.value)} placeholder="Bakiyeyi direkt ayarla" style={{...inp,flex:1}} />
                  <button onClick={()=>setMoneyDirect(selectedUser)} style={{padding:'0.55rem 0.75rem',borderRadius:'10px',border:'none',background:'#C9A227',color:'#000',fontWeight:700,fontSize:'0.78rem',cursor:'pointer',whiteSpace:'nowrap'}}>Ayarla</button>
                </div>
                <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap'}}>
                  {[1000,5000,10000,50000,100000,1000000].map(n=>(
                    <button key={n} onClick={()=>{setGiftAmount(String(n));}} style={{padding:'0.25rem 0.55rem',borderRadius:'7px',border:'1px solid rgba(237,231,218,0.08)',background:'rgba(237,231,218,0.02)',color:'#8893A1',fontSize:'0.68rem',cursor:'pointer',fontWeight:700}}>{fmtM(n)}</button>
                  ))}
                </div>
              </div>

              {/* Altın ver */}
              <div style={cs}>
                <div style={{fontWeight:700,color:'#C9A227',marginBottom:'0.5rem',fontSize:'0.8rem'}}>💎 Altın İşlemleri</div>
                <div style={{display:'flex',gap:'0.4rem'}}>
                  <input type="number" value={giftUC} onChange={e=>setGiftUC(e.target.value)} placeholder="Verilecek Altın" style={{...inp,flex:1}} />
                  <button onClick={()=>giveUC(selectedUser)} style={{padding:'0.55rem 0.75rem',borderRadius:'10px',border:'none',background:'#C9A227',color:'#EDE7DA',fontWeight:700,fontSize:'0.78rem',cursor:'pointer',whiteSpace:'nowrap'}}>+ Ver</button>
                </div>
              </div>

              {/* Ban işlemleri */}
              <div style={cs}>
                <div style={{fontWeight:700,color:'#C24B43',marginBottom:'0.5rem',fontSize:'0.8rem'}}>🚫 Ban İşlemleri</div>
                {!selectedUser.banned && (
                  <input value={banReason} onChange={e=>setBanReason(e.target.value)} placeholder="Ban sebebi (isteğe bağlı)" style={{...inp,marginBottom:'0.4rem'}} />
                )}
                <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap'}}>
                  <button onClick={()=>banToggle(selectedUser)}
                    style={{padding:'0.45rem 0.85rem',borderRadius:'10px',border:'none',background:selectedUser.banned?'#4C9A6B':'#C24B43',color:'#EDE7DA',fontWeight:700,fontSize:'0.78rem',cursor:'pointer'}}>
                    {selectedUser.banned ? '✅ Banı Kaldır' : '🚫 Banla'}
                  </button>
                  <button onClick={()=>makeAdmin(selectedUser)}
                    style={{padding:'0.45rem 0.85rem',borderRadius:'10px',border:'none',background:selectedUser.role==='admin'?'#64748B':'#C9A227',color:selectedUser.role==='admin'?'#fff':'#000',fontWeight:700,fontSize:'0.78rem',cursor:'pointer'}}>
                    {selectedUser.role==='admin' ? '↓ Admin Al' : '⭐ Admin Yap'}
                  </button>
                  <button onClick={()=>resetUser(selectedUser)}
                    style={{padding:'0.45rem 0.85rem',borderRadius:'10px',border:'1px solid rgba(201,162,39,0.25)',background:'rgba(201,162,39,0.08)',color:'#C9A227',fontWeight:700,fontSize:'0.78rem',cursor:'pointer'}}>
                    ↺ Sıfırla
                  </button>
                  <button onClick={()=>giveEduPackage(selectedUser)}
                    style={{padding:'0.45rem 0.85rem',borderRadius:'10px',border:'1px solid rgba(201,162,39,0.35)',background:'rgba(201,162,39,0.15)',color:'#C9A227',fontWeight:700,fontSize:'0.78rem',cursor:'pointer'}}>
                    🎓 Edu Paketi
                  </button>
                  <button onClick={()=>giveMaxEdu(selectedUser)}
                    style={{padding:'0.45rem 0.85rem',borderRadius:'10px',border:'1px solid rgba(249,115,22,0.4)',background:'rgba(249,115,22,0.15)',color:'#FB923C',fontWeight:700,fontSize:'0.78rem',cursor:'pointer'}}>
                    🏛️ Profesör Yap
                  </button>
                  <button onClick={()=>{if(window.confirm('Kullanıcıyı sil?'))deleteUser(selectedUser);}}
                    style={{padding:'0.45rem 0.85rem',borderRadius:'10px',border:'1px solid rgba(194,75,67,0.25)',background:'rgba(194,75,67,0.08)',color:'#C24B43',fontWeight:700,fontSize:'0.78rem',cursor:'pointer'}}>
                    🗑️ Sil
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── DUYURU ── */}
      {tab==='announce' && (
        <div>
          <div style={cs}>
            <div style={{fontWeight:800,color:'#EDE7DA',marginBottom:'0.75rem',fontSize:'0.85rem'}}>📢 Sistem Duyurusu Yayınla</div>
            <div style={{marginBottom:'0.5rem'}}>
              <div style={{fontSize:'0.7rem',color:'#8893A1',fontWeight:700,marginBottom:'0.3rem'}}>Başlık *</div>
              <input value={annTitle} onChange={e=>setAnnTitle(e.target.value)} placeholder="Duyuru başlığı..."
                style={{...inp,marginBottom:0}} />
            </div>
            <div style={{marginBottom:'0.5rem'}}>
              <div style={{fontSize:'0.7rem',color:'#8893A1',fontWeight:700,marginBottom:'0.3rem'}}>Kategori & İkon</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:'0.4rem'}}>
                <select value={annCategory} onChange={e=>setAnnCategory(e.target.value)}
                  style={{...inp,marginBottom:0,background:'rgba(237,231,218,0.03)',color:'#EDE7DA'}}>
                  {['Sistem','Siyaset','Ekonomi','Hukuk','Etkinlik','Güvenlik','Eğitim'].map(c=>(
                    <option key={c} value={c} style={{background:'#0F0800'}}>{c}</option>
                  ))}
                </select>
                <select value={annIcon} onChange={e=>setAnnIcon(e.target.value)}
                  style={{...inp,marginBottom:0,width:'60px',background:'rgba(237,231,218,0.03)',color:'#EDE7DA',textAlign:'center'}}>
                  {['📢','🏛️','💰','⚖️','🎉','🚔','🎓','⚠️','🔥','📌'].map(ic=>(
                    <option key={ic} value={ic} style={{background:'#0F0800'}}>{ic}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{marginBottom:'0.5rem'}}>
              <div style={{fontSize:'0.7rem',color:'#8893A1',fontWeight:700,marginBottom:'0.3rem'}}>Duyuru Metni *</div>
              <textarea value={announcement} onChange={e=>setAnnouncement(e.target.value)} placeholder="Duyuru içeriği... (tüm oyunculara görünür)" rows={4}
                style={{...inp,resize:'vertical',marginBottom:0}} />
            </div>
            <div style={{marginBottom:'0.65rem'}}>
              <div style={{fontSize:'0.7rem',color:'#8893A1',fontWeight:700,marginBottom:'0.3rem'}}>Görsel URL (isteğe bağlı)</div>
              <input value={annImage} onChange={e=>setAnnImage(e.target.value)} placeholder="https://... (resim bağlantısı)"
                style={{...inp,marginBottom:0}} />
              {annImage && <img src={annImage} alt="önizleme" style={{marginTop:'0.4rem',maxHeight:'80px',borderRadius:'8px',objectFit:'cover',width:'100%'}} onError={e=>e.target.style.display='none'} />}
            </div>
            <button onClick={sendAnnouncement} style={{width:'100%',padding:'0.7rem',borderRadius:'10px',border:'none',background:'linear-gradient(135deg,#C9A227,#C9A227)',color:'#EDE7DA',fontWeight:700,fontSize:'0.85rem',cursor:'pointer'}}>
              {annIcon} Duyuruyu Yayınla
            </button>
          </div>

          <div style={cs}>
            <div style={{fontWeight:700,color:'#EDE7DA',marginBottom:'0.65rem',fontSize:'0.85rem'}}>📋 Son Duyurular ({announcements.length})</div>
            {announcements.length===0 && <div style={{color:'#8893A1',fontSize:'0.8rem',textAlign:'center',padding:'1rem'}}>Henüz duyuru yok</div>}
            {announcements.map(a => (
              <div key={a.id} style={{padding:'0.6rem',borderBottom:'1px solid rgba(255,255,255,0.04)',borderRadius:'8px',marginBottom:'0.3rem'}}>
                {a.imageUrl && <img src={a.imageUrl} alt="" style={{width:'100%',maxHeight:'100px',objectFit:'cover',borderRadius:'8px',marginBottom:'0.4rem'}} onError={e=>e.target.style.display='none'} />}
                <div style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'0.2rem'}}>
                  <span style={{fontSize:'0.9rem'}}>{a.icon||'📢'}</span>
                  <span style={{fontSize:'0.82rem',fontWeight:800,color:'#EDE7DA'}}>{a.title||a.text}</span>
                  {a.category && <span style={{fontSize:'0.55rem',padding:'0.1rem 0.4rem',borderRadius:'6px',background:'rgba(201,162,39,0.14)',color:'#C9A227',fontWeight:700}}>{a.category}</span>}
                </div>
                {a.title && <div style={{fontSize:'0.78rem',color:'#8893A1',marginBottom:'0.2rem'}}>{a.body||a.text}</div>}
                <div style={{fontSize:'0.62rem',color:'#8893A1'}}>{a.by} • {timeAgo(a.ts)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DESTEK MESAJLARI ── */}
      {tab==='support' && <AdminSupportTab setMsg={setMsg} inp={inp} cs={cs} />}

      {/* ── LOG ── */}
      {tab==='logs' && (
        <div>
          <div style={{display:'flex',gap:'4px',marginBottom:'0.65rem',overflowX:'auto',scrollbarWidth:'none'}}>
            {[['all','Tümü'],['banned','Banlılar'],['admin','Adminler'],['rich','En Zengin']].map(([id,lbl])=>(
              <button key={id} onClick={()=>setTabLog(id)}
                style={{padding:'0.3rem 0.65rem',borderRadius:'7px',border:`1px solid ${tabLog===id?'rgba(194,75,67,0.4)':'rgba(255,255,255,0.07)'}`,background:tabLog===id?'rgba(194,75,67,0.1)':'rgba(255,255,255,0.03)',color:tabLog===id?'#E08C87':'#8893A1',fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:'0.72rem',cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>
                {lbl}
              </button>
            ))}
          </div>
          {(tabLog==='all'?allUsers:tabLog==='banned'?allUsers.filter(u=>u.banned):tabLog==='admin'?allUsers.filter(u=>u.role==='admin'):[...allUsers].sort((a,b)=>(b.money||0)-(a.money||0)).slice(0,20))
            .map(u => (
            <div key={u.id} style={{...cs,marginBottom:'0.35rem',padding:'0.65rem',cursor:'pointer'}} onClick={()=>{setSelectedUser(u);setTab('manage');}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <div style={{fontSize:'0.82rem',fontWeight:700,color:u.banned?'#E08C87':u.role==='admin'?'#C9A227':'#EDE7DA'}}>{u.role==='admin'?'⭐ ':u.banned?'🚫 ':''}{u.username}</div>
                  <div style={{fontSize:'0.65rem',color:'#8893A1'}}>{u.email||'—'} • {u.city||'?'} • Lv.{u.level||1}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{color:'#4C9A6B',fontWeight:700,fontSize:'0.75rem'}}>{fmtM(u.money||0)}</div>
                  <div style={{fontSize:'0.6rem',color:'#8893A1'}}>{u.underCoin||0} Altın</div>
                </div>
              </div>
            </div>
          ))}
          {allUsers.length===0 && <div style={{...cs,textAlign:'center',color:'#8893A1',padding:'2rem'}}>Henüz kullanıcı yok</div>}
        </div>
      )}

      {/* ── EKONOMİ ── */}
      {tab==='economy' && (
        <div>
          <div style={cs}>
            <div style={{fontWeight:800,color:'#EDE7DA',marginBottom:'0.65rem',fontSize:'0.85rem'}}>💰 Ekonomi Özeti</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',marginBottom:'0.65rem'}}>
              {[
                ['💰','Toplam Para', fmtM(totalMoney), '#4C9A6B'],
                ['📊','Ort. Bakiye', fmtM(allUsers.length>0?Math.floor(totalMoney/allUsers.length):0), '#C9A227'],
                ['💎','Toplam VIP', allUsers.filter(u=>u.premium).length, '#C9A227'],
                ['🪙','Toplam Altın', allUsers.reduce((s,u)=>s+(u.underCoin||0),0).toLocaleString('tr-TR'), '#C9A227'],
              ].map(([ic,lbl,val,c]) => (
                <div key={lbl} style={{...cs,textAlign:'center',padding:'0.75rem',marginBottom:0}}>
                  <div style={{fontSize:'1.1rem'}}>{ic}</div>
                  <div style={{fontSize:'0.9rem',fontWeight:900,color:c}}>{val}</div>
                  <div style={{fontSize:'0.58rem',color:'#8893A1',fontWeight:700,textTransform:'uppercase'}}>{lbl}</div>
                </div>
              ))}
            </div>
            <div style={{fontWeight:700,color:'#EDE7DA',marginBottom:'0.5rem',fontSize:'0.82rem'}}>💎 VIP Üyeler</div>
            {allUsers.filter(u=>u.premium).length === 0
              ? <div style={{color:'#8893A1',fontSize:'0.78rem',textAlign:'center',padding:'0.75rem'}}>Henüz VIP üye yok</div>
              : allUsers.filter(u=>u.premium).map(u=>(
                <div key={u.id} style={{display:'flex',justifyContent:'space-between',padding:'0.35rem 0',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:'0.78rem'}}>
                  <span style={{color:'#C9A227',fontWeight:700}}>💎 {u.username}</span>
                  <span style={{color:'#8893A1'}}>{fmtM(u.money||0)}</span>
                </div>
              ))
            }
          </div>
          <div style={cs}>
            <div style={{fontWeight:800,color:'#EDE7DA',marginBottom:'0.65rem',fontSize:'0.85rem'}}>🏢 Holdingler</div>
            {(() => {
              try {
                const hs = JSON.parse(localStorage.getItem('rep_holdings')||'[]');
                const totalHoldings = hs.length;
                const totalAssets = hs.reduce((s,h)=>s+(h.value||0),0);
                return (
                  <div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem'}}>
                      {[['🏢','Toplam Şirket',totalHoldings,'#C9A227'],['💰','Toplam Değer',fmtM(totalAssets),'#4C9A6B']].map(([ic,lbl,val,c])=>(
                        <div key={lbl} style={{background:'rgba(237,231,218,0.02)',borderRadius:'10px',padding:'0.65rem',textAlign:'center'}}>
                          <div style={{fontSize:'1.1rem'}}>{ic}</div>
                          <div style={{fontWeight:800,color:c}}>{val}</div>
                          <div style={{fontSize:'0.6rem',color:'#8893A1',textTransform:'uppercase'}}>{lbl}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              } catch { return <div style={{color:'#8893A1',fontSize:'0.78rem'}}>Veri yok</div>; }
            })()}
          </div>
          <div style={cs}>
            <div style={{fontWeight:800,color:'#EDE7DA',marginBottom:'0.65rem',fontSize:'0.85rem'}}>🏛️ Partiler & Çeteler</div>
            {(() => {
              const parties = JSON.parse(localStorage.getItem('rep_parties')||'[]');
              const gangs = JSON.parse(localStorage.getItem('rep_gangs')||'[]');
              return (
                <div>
                  {[['🏛️','Parti Sayısı',parties.length,'#C9A227'],['🔫','Çete/Aile',gangs.length,'#C24B43']].map(([ic,lbl,val,c])=>(
                    <div key={lbl} style={{display:'flex',justifyContent:'space-between',padding:'0.4rem 0',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:'0.78rem'}}>
                      <span style={{color:'#8893A1'}}>{ic} {lbl}</span>
                      <span style={{color:c,fontWeight:700}}>{val}</span>
                    </div>
                  ))}
                  {parties.slice(0,5).map(p=>(
                    <div key={p.id} style={{display:'flex',justifyContent:'space-between',padding:'0.3rem 0',borderBottom:'1px solid rgba(255,255,255,0.03)',fontSize:'0.72rem'}}>
                      <span style={{color:'#C9A227'}}>🏛️ {p.name}</span>
                      <span style={{color:'#8893A1'}}>{p.memberCount||0} üye • 🪙{(p.treasury||0).toLocaleString('tr-TR')} hazine</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}


      {/* ── ARAÇLAR ── */}
      {tab==='tools' && (
        <div>
          <div style={cs}>
            <div style={{fontWeight:800,color:'#EDE7DA',marginBottom:'0.75rem',fontSize:'0.85rem'}}>🛠️ Sistem Araçları</div>
            <div style={{display:'grid',gap:'0.5rem'}}>
              {[
                ['↻ Oyunu Yenile', '#C9A227', ()=>window.location.reload()],
                ['👤 Profilime Git', '#C9A227', ()=>onNavigate('profile')],
                ['🏠 Ana Sayfaya Git', '#4C9A6B', ()=>onNavigate('home')],
                ['🧹 Yerel Veriyi Temizle (DİKKAT!)', '#C24B43', ()=>{ if(window.confirm('TÜM yerel veriler silinecek! Emin misin?')){localStorage.clear();window.location.reload();} }],
              ].map(([lbl,clr,fn])=>(
                <button key={lbl} onClick={fn} style={{padding:'0.75rem',borderRadius:'10px',border:`1px solid ${clr}33`,background:`${clr}18`,color:clr,fontWeight:700,fontSize:'0.82rem',cursor:'pointer',textAlign:'left'}}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
          <div style={cs}>
            <div style={{fontWeight:800,color:'#EDE7DA',marginBottom:'0.5rem',fontSize:'0.85rem'}}>ℹ️ Sistem Bilgisi</div>
            {[
              ['Oyun', 'Saltanat Online v8.0'],
              ['Kullanıcı Sayısı', allUsers.length],
              ['Online Sayısı', onlineCnt],
              ['Banlı Kullanıcı', bannedCount],
              ['Admin Sayısı', adminCount],
              ['Toplam Servet', fmtM(totalMoney)],
              ['Platform', 'Firebase RTDB + LocalStorage'],
            ].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'0.4rem 0',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:'0.78rem'}}>
                <span style={{color:'#8893A1'}}>{k}</span>
                <span style={{color:'#EDE7DA',fontWeight:700}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SEÇİM YÖNETİMİ (9 Pozisyon) ── */}
      {tab==='election' && <AdminElectionTab elections_multi={elections_multi} setElections_multi={setElections_multi} setMsg={setMsg} cs={cs} inp={inp} />}

      {/* ── MAKAMLAR ── */}
      {tab==='makamlar' && <AdminMakamlarTab allUsers={allUsers} setAllUsersRaw={setAllUsersRaw} setMsg={setMsg} cs={cs} inp={inp} />}

      {/* ── PUSH BROADCAST ── */}
      {tab==='push' && <AdminPushTab setMsg={setMsg} cs={cs} inp={inp} />}
    </div>
  );
}


// ═══════════════════════════════════════════════════════
// DÜNYA SAYFASI
// ═══════════════════════════════════════════════════════
