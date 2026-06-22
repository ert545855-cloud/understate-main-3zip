// ═══════════════════════════════════════════════════════
// ÇETE / AİLE SAYFASI
// ═══════════════════════════════════════════════════════
function GangPage({ profile, setProfile, showNotif, typeFilter, gangWars, setGangWars }) {
  const [gangs, setGangs] = useLs('gangs', []);
  const [sub, setSub] = useState('gangs');
  const [createModal, setCreateModal] = useState(false);
  const [gForm, setGForm] = useState({ name:'', type:'gang', desc:'' });
  const [gangCooldowns, setGangCooldowns] = useLs('gangCooldowns', {});
  const [transferModal, setTransferModal] = useState(false);
  const [transferTarget, setTransferTarget] = useState('');
  const [disbandConfirm, setDisbandConfirm] = useState(false);
  const [donateModal, setDonateModal] = useState(false);
  const [donateAmt, setDonateAmt] = useState('');
  const [halefModal, setHalefModal] = useState(false);
  const [halefTarget, setHalefTarget] = useState('');
  const [rankMenuUid, setRankMenuUid] = useState(null);

  // ── Çete Savaşları — state app.js'ten prop olarak gelir ─────────────────
  const [warModal, setWarModal] = useState(false);
  const [warTarget, setWarTarget] = useState(null);
  const [warNow, setWarNow] = useState(Date.now());

  useEffect(() => { const t = setInterval(()=>setWarNow(Date.now()), 1000); return ()=>clearInterval(t); }, []);

  // Auto-resolve süresi dolan savaşlar
  useEffect(() => {
    const expired = gangWars.filter(w => w.status==='active' && warNow >= w.endsAt);
    if (!expired.length) return;
    const resolved = gangWars.map(w => {
      if (w.status!=='active'||warNow<w.endsAt) return w;
      // Güç hesabı: çete bazı + katılanların silah/mermi gücü
      const atkPow = (w.attackerPower||10) + (w.attackerParticipants||[]).reduce((s,p)=>s+((p.weapons||0)*5)+((p.ammo||0)*3),0);
      const defPow = (w.defenderPower||10) + (w.defenderParticipants||[]).reduce((s,p)=>s+((p.weapons||0)*5)+((p.ammo||0)*3),0);
      const bonus = w.policeBonus||0; // devlet polisi savunmaya katkı
      const totalDef = defPow + bonus;
      const atkWinP = atkPow / (atkPow + totalDef);
      const winner = Math.random() < atkWinP ? 'attacker' : 'defender';
      const reward = { money: Math.floor(Math.random()*500000)+200000, territory: 1, ammo: Math.floor(Math.random()*20)+10 };
      // Ödül/ceza: galibin çetesini güncelle
      setGangs(prev => prev.map(g => {
        if (g.id===w.attackerId && winner==='attacker') return {...g, treasury:(g.treasury||0)+reward.money, territory:(g.territory||0)+reward.territory, ammo:(g.ammo||0)+reward.ammo, power:(g.power||10)+5};
        if (g.id===w.defenderId && winner==='defender') return {...g, treasury:(g.treasury||0)+Math.floor(reward.money*0.5), ammo:(g.ammo||0)+Math.floor(reward.ammo/2)};
        if (g.id===w.attackerId && winner==='defender') return {...g, power:Math.max(5,(g.power||10)-3)};
        return g;
      }));
      try {
        window._pushGameEvent?.('cete_savasi', `⚔️ Savaş Bitti: ${w.attackerName} vs ${w.defenderName}`,
          `${winner==='attacker'?w.attackerName:w.defenderName} galip geldi! Ödül: ₺${(reward.money).toLocaleString()}`, '⚔️', 'çete');
      } catch(e){}
      return {...w, status:'resolved', winner, reward, resolvedAt:Date.now(), atkFinalPow:atkPow, defFinalPow:totalDef};
    });
    setGangWars(resolved);
    // Resolve olan savaşları sunucuya bildir
    resolved.filter(w => w.status === 'resolved' && gangWars.find(ow => ow.id === w.id && ow.status === 'active')).forEach(w => {
      try { window._socket?.emit('gang:war:resolve', { war: { ...w, winnerId: w.winner === 'attacker' ? w.attackerId : w.defenderId, winnerName: w.winner === 'attacker' ? w.attackerName : w.defenderName } }); } catch(e) {}
    });
  }, [warNow]);

  const gangTotalPower = (g) => (g?.power||10) + ((g?.weapons||0)*5) + ((g?.ammo||0)*3);

  const declareWar = (targetGang) => {
    if (!myGang || !isGangLeader) { showNotif('Sadece çete lideri savaş ilan edebilir','error'); return; }
    if (myGang.type==='family') { showNotif('Aileler savaş ilan edemez','error'); return; }
    if (targetGang.type==='family') { showNotif('Ailelere savaş ilan edilemez','error'); return; }
    if (targetGang.id===myGang.id) { showNotif('Kendinize savaş ilan edemezsiniz','error'); return; }
    const existing = gangWars.find(w=>w.status==='active'&&(w.attackerId===myGang.id||w.defenderId===myGang.id));
    if (existing) { showNotif('Zaten aktif bir savaşınız var','error'); return; }
    if ((myGang.treasury||0) < 100000) { showNotif('Savaş ilanı için ₺100.000 kasa gerekmeli','error'); return; }
    const war = {
      id: genId(),
      attackerId: myGang.id, attackerName: myGang.name, attackerPower: gangTotalPower(myGang),
      defenderId: targetGang.id, defenderName: targetGang.name, defenderPower: gangTotalPower(targetGang),
      startedAt: Date.now(), endsAt: Date.now() + 12*3600000,
      status: 'active', attackerParticipants: [], defenderParticipants: [],
      policeBonus: 0, winner: null,
    };
    setGangWars(prev => [war, ...prev]);
    setGangs(prev => prev.map(g => g.id===myGang.id ? {...g, treasury:(g.treasury||0)-100000} : g));
    setWarModal(false); setWarTarget(null);
    showNotif(`⚔️ ${targetGang.name}'e savaş ilan edildi! 12 saat içinde sonuçlanacak.`, 'success');
    try { window._socket?.emit('gang:war:declare', { war }); } catch(e) {}
    try { window._pushGameEvent?.('cete_savasi_ilani', `⚔️ Savaş İlanı!`, `${myGang.name} → ${targetGang.name} savaş ilan etti!`, '⚔️', 'çete'); } catch(e){}
  };

  const joinWar = (war) => {
    if (!myGang) { showNotif('Bir çeteye üye ol','error'); return; }
    const side = war.attackerId===myGang.id ? 'attacker' : war.defenderId===myGang.id ? 'defender' : null;
    if (!side) { showNotif('Bu savaşa katılamazsın','error'); return; }
    const partArr = side==='attacker' ? war.attackerParticipants : war.defenderParticipants;
    if ((partArr||[]).find(p=>p.uid===uid)) { showNotif('Zaten savaşa katıldın','info'); return; }
    const userWeapons = profile?.weapons||0;
    const userAmmo = profile?.ammo||0;
    const newPart = { uid, username:profile?.username, weapons:userWeapons, ammo:userAmmo, joinedAt:Date.now() };
    const updWar = side==='attacker'
      ? {...war, attackerParticipants:[...(war.attackerParticipants||[]), newPart]}
      : {...war, defenderParticipants:[...(war.defenderParticipants||[]), newPart]};
    setGangWars(prev => prev.map(w => w.id===war.id ? updWar : w));
    const powAdd = userWeapons*5 + userAmmo*3;
    showNotif(`⚔️ Savaşa katıldın! Katkın: +${powAdd} güç (${userWeapons} silah + ${userAmmo} mermi)`, 'success');
    try { window._socket?.emit('gang:war:join', { warId: war.id, side, weaponPower: powAdd }); } catch(e) {}
  };

  const uid = profile?.uid || profile?.id;
  const filteredGangs = typeFilter ? gangs.filter(g=>g.type===typeFilter) : gangs;
  const myGang = gangs.find(g => (!typeFilter || g.type===typeFilter) && (g.leaderId===uid || (g.members||[]).includes(uid)));
  const isMyGangMatchFilter = !!myGang;
  const isGangLeader = !!uid && myGang?.leaderId === uid;

  const createGang = () => {
    if (!gForm.name.trim()) { showNotif('İsim gerekli','error'); return; }
    if (myGang) { showNotif(`Zaten bir ${isFamily?'aileye':'çeteye'} üyesin`,'error'); return; }
    if (profile?.party) { showNotif('🏛️ Parti üyeleri çete veya aile kuramazlar. Önce partiden ayrılın.','error'); return; }
    const actualType = typeFilter || gForm.type;
    const cost = actualType==='family' ? 500000 : 100000;
    if ((profile?.money||0) < cost) { showNotif(`${actualType==='family'?'Aile kurmak için ₺500.000':'Çete kurmak için ₺100.000'} gerekli`,'error'); return; }
    const gang = {
      id:genId(), name:gForm.name.trim(), type:actualType, desc:gForm.desc,
      leaderId:uid, leaderName:profile?.username,
      members:[uid], memberCount:1, treasury:0,
      power:10, territory:0, reputation:0, createdAt:Date.now()
    };
    setGangs(prev => { const next=[...prev, gang]; try{window._socket?.emit('gang:create',{gang});window._socket?.emit('gang:sync',{gangs:next});}catch(e){}; return next; });
    setProfile(p => { const field=actualType==='family'?'family':'gang'; const np={...p,[field]:gang.id,money:(p.money||0)-cost}; localStorage.setItem('rep_userProfile',JSON.stringify(np)); return np; });
    setCreateModal(false);
    setGForm({name:'',type:'gang',desc:''});
    showNotif(`${gang.type==='family'?'👨‍👩‍👧‍👦':'⚔️'} ${gang.name} kuruldu!`,'success');
    try { window._pushGameEvent?.(gang.type==='family'?'aile_kuruldu':'cete_kuruldu', `${gang.type==='family'?'👨‍👩‍👧‍👦':'⚔️'} ${gang.name} kuruldu!`, `${profile?.username||'Bir oyuncu'} yeni bir ${gang.type==='family'?'aile':'çete'} kurdu.`, gang.type==='family'?'👨‍👩‍👧‍👦':'⚔️', gang.type==='family'?'aile':'çete'); } catch(e){} 
  };

  const joinGang = (gang) => {
    if (myGang) { showNotif(`Zaten bir ${isFamily?'aileye':'çeteye'} üyesin`,'error'); return; }
    if (profile?.party) { showNotif('🏛️ Parti üyeleri çete veya aileye katılamaz. Önce partiden ayrılın.','error'); return; }
    setGangs(prev => { const next=prev.map(g => g.id===gang.id ? {...g, members:[...(g.members||[]),uid], memberCount:(g.memberCount||0)+1, power:(g.power||10)+50} : g); try{window._socket?.emit('gang:join',{gangId:gang.id});window._socket?.emit('gang:sync',{gangs:next});}catch(e){}; return next; });
    setProfile(p => { const field=gang.type==='family'?'family':'gang'; const np={...p,[field]:gang.id}; localStorage.setItem('rep_userProfile',JSON.stringify(np)); return np; });
    showNotif(`✅ ${gang.name}'e katıldın! Çete gücüne +50 eklendi.`,'success');
  };

  const leaveGang = () => {
    if (!myGang) return;
    if (isGangLeader) {
      if (!myGang.successorId) { showNotif('Lider ayrılamaz. Önce "Halef Belirle" ile bir halef seç veya liderliği devret.','error'); return; }
      setGangs(prev => { const next=prev.map(g => g.id===myGang.id ? {...g, leaderId:g.successorId, leaderName:g.successorName, successorId:null, successorName:null, members:(g.members||[]).filter(m=>m!==uid), memberCount:Math.max(0,(g.memberCount||1)-1), power:Math.max(10,(g.power||10)-50)} : g); try{window._socket?.emit('gang:sync',{gangs:next});}catch(e){}; return next; });
      setProfile(p => { const field=myGang.type==='family'?'family':'gang'; const np={...p,[field]:null}; localStorage.setItem('rep_userProfile',JSON.stringify(np)); return np; });
      showNotif(`👑 Liderlik ${myGang.successorName}'e otomatik devredildi. Çeteden ayrıldın.`,'success');
      return;
    }
    setGangs(prev => { const next=prev.map(g => g.id===myGang.id ? {...g,members:(g.members||[]).filter(m=>m!==uid),memberCount:Math.max(0,(g.memberCount||1)-1),power:Math.max(10,(g.power||10)-50)} : g); try{window._socket?.emit('gang:leave',{gangId:myGang.id});window._socket?.emit('gang:sync',{gangs:next});}catch(e){}; return next; });
    setProfile(p => { const field=myGang.type==='family'?'family':'gang'; const np={...p,[field]:null}; localStorage.setItem('rep_userProfile',JSON.stringify(np)); return np; });
    showNotif('Çeteden ayrıldın. -50 güç.','info');
  };

  const setGangSuccessor = () => {
    if (!isGangLeader || !halefTarget.trim()) { showNotif('Kullanıcı adı girin','error'); return; }
    const users = (()=>{ try{return JSON.parse(localStorage.getItem('rep_users')||'[]');}catch{return[];} })();
    const tgt = users.find(u => u.username===halefTarget.trim());
    if (!tgt) { showNotif('Kullanıcı bulunamadı','error'); return; }
    const tgtId = tgt.id||tgt.uid;
    if (!(myGang.members||[]).includes(tgtId)) { showNotif('Bu kişi çetede değil','error'); return; }
    if (tgtId===uid) { showNotif('Kendinizi halef seçemezsiniz','error'); return; }
    setGangs(prev => prev.map(g => g.id===myGang.id ? {...g, successorId:tgtId, successorName:tgt.username} : g));
    setHalefModal(false); setHalefTarget('');
    showNotif(`👑 ${tgt.username} halef olarak belirlendi. Ayrıldığında liderlik otomatik devrolur.`,'success');
  };

  const clearSuccessor = () => {
    setGangs(prev => prev.map(g => g.id===myGang.id ? {...g, successorId:null, successorName:null} : g));
    showNotif('Halef seçimi iptal edildi','info');
  };

  const changeMemberRank = (muid, rank) => {
    if (!isGangLeader) return;
    setGangs(prev => prev.map(g => g.id===myGang.id ? {...g, ranks:{...(g.ranks||{}), [muid]:rank}} : g));
    setRankMenuUid(null);
    showNotif(`Rütbe güncellendi ✓`,'success');
  };

  const kickMember = (muid) => {
    if (!isGangLeader) return;
    setGangs(prev => prev.map(g => g.id===myGang.id ? {...g,members:(g.members||[]).filter(m=>m!==muid),memberCount:Math.max(0,(g.memberCount||1)-1),power:Math.max(10,(g.power||10)-50)} : g));
    showNotif('Üye çeteden çıkarıldı. -50 güç.','info');
  };

  const donateToGang = () => {
    const amt = parseInt(donateAmt);
    if (!amt||amt<=0) { showNotif('Geçerli tutar girin','error'); return; }
    if ((profile?.money||0)<amt) { showNotif('Yetersiz para','error'); return; }
    setGangs(prev => prev.map(g => g.id===myGang.id ? {...g,treasury:(g.treasury||0)+amt} : g));
    setProfile(p => { const np={...p,money:(p.money||0)-amt}; localStorage.setItem('rep_userProfile',JSON.stringify(np)); return np; });
    setDonateModal(false); setDonateAmt('');
    showNotif(`💰 ${fmtWord(amt)} kasaya yatırıldı`,'success');
  };

  const gangAction = (actionId, cdMs, fn) => {
    const key = `gang_${myGang?.id}_${actionId}`;
    const rem = cdMs - (Date.now()-(gangCooldowns[key]||0));
    if (rem > 0) { showNotif(`⏳ ${Math.ceil(rem/3600000)}s sonra tekrar`,'error'); return; }
    fn();
    setGangCooldowns(prev => ({...prev,[key]:Date.now()}));
  };

  const transferGangLeadership = () => {
    if (!isGangLeader||!transferTarget.trim()) { showNotif('Kullanıcı adı girin','error'); return; }
    const users = (() => { try { return JSON.parse(localStorage.getItem('rep_users')||'[]'); } catch{return[];} })();
    const tgt = users.find(u => u.username===transferTarget.trim());
    if (!tgt) { showNotif('Kullanıcı bulunamadı','error'); return; }
    if (!(myGang.members||[]).includes(tgt.id||tgt.uid)) { showNotif('Bu kişi çetede değil','error'); return; }
    setGangs(prev => prev.map(g => g.id===myGang.id ? {...g,leaderId:tgt.id||tgt.uid,leaderName:tgt.username} : g));
    setTransferModal(false); setTransferTarget('');
    showNotif(`👑 Liderlik ${tgt.username} kişisine devredildi`,'success');
  };

  const disbandGang = () => {
    if (!isGangLeader) return;
    setGangs(prev => { const next=prev.filter(g => g.id!==myGang.id); try{window._socket?.emit('gang:disband',{gangId:myGang.id});window._socket?.emit('gang:sync',{gangs:next});}catch(e){}; return next; });
    setProfile(p => { const field=myGang.type==='family'?'family':'gang'; const np={...p,[field]:null}; localStorage.setItem('rep_userProfile',JSON.stringify(np)); return np; });
    setDisbandConfirm(false);
    showNotif(`${myGang.type==='family'?'👨‍👩‍👧‍👦':'⚔️'} ${myGang.name} dağıtıldı`,'info');
  };

  const inpSt = {width:'100%',background:'rgba(237,231,218,0.03)',border:'1px solid rgba(237,231,218,0.1)',borderRadius:'10px',padding:'0.65rem 0.9rem',color:'#EDE7DA',fontFamily:"'Inter',sans-serif",fontSize:'16px',outline:'none',boxSizing:'border-box'};
  const isFamily = typeFilter==='family';
  const activeWar = gangWars.find(w=>w.status==='active'&&myGang&&(w.attackerId===myGang.id||w.defenderId===myGang.id));
  const subItems = isMyGangMatchFilter
    ? (isFamily
        ? [{id:'gangs',label:'👨‍👩‍👧‍👦 Liste'},{id:'management',label:'⚙️ Yönetim'}]
        : [{id:'gangs',label:'⚔️ Liste'},{id:'management',label:'⚙️ Yönetim'},{id:'wars',label:activeWar?'⚔️ Savaş 🔴':'⚔️ Savaşlar'},{id:'attack',label:'🥊 Suç'},{id:'territory',label:'🗺️ Bölge'},{id:'weapons',label:'🔫 Silah'}])
    : (isFamily
        ? [{id:'gangs',label:'👨‍👩‍👧‍👦 Aileler'}]
        : [{id:'gangs',label:'⚔️ Çeteler'},{id:'wars',label:'⚔️ Savaşlar'},{id:'attack',label:'🥊 Suç'},{id:'territory',label:'🗺️ Bölge'}]);

  return (
    <div>
      <div style={{display:'flex',gap:'4px',padding:'0.5rem 0.7rem',overflowX:'auto',scrollbarWidth:'none',background:'rgba(6,12,24,0.97)',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
        {subItems.map(s=>(
          <button key={s.id} onClick={()=>setSub(s.id)}
            style={{padding:'0.38rem 0.75rem',borderRadius:'8px',border:`1px solid ${sub===s.id?'rgba(194,75,67,0.4)':'rgba(255,255,255,0.07)'}`,background:sub===s.id?'rgba(194,75,67,0.12)':'rgba(255,255,255,0.03)',color:sub===s.id?'#E08C87':'#8893A1',fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:'0.76rem',cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>
            {s.label}
          </button>
        ))}
      </div>
      <div style={{padding:'0.7rem'}}>

        {sub==='gangs' && (
          <div>
            {myGang && (
              <div style={{background:'linear-gradient(135deg,rgba(194,75,67,0.1),rgba(11,21,39,0.95))',border:'1px solid rgba(194,75,67,0.25)',borderRadius:'14px',padding:'1rem',marginBottom:'0.75rem'}}>
                <div style={{display:'flex',alignItems:'center',gap:'0.6rem',marginBottom:'0.5rem'}}>
                  <div style={{fontSize:'1.5rem'}}>{myGang.type==='family'?'👨‍👩‍👧‍👦':'⚔️'}</div>
                  <div>
                    <div style={{fontWeight:900,color:'#EDE7DA',fontSize:'1rem'}}>{myGang.name}</div>
                    <div style={{fontSize:'0.7rem',color:'#8893A1'}}>{myGang.memberCount} üye • Güç: {(myGang.power||10)+((myGang.weapons||0)*5)+((myGang.ammo||0)*3)} • {isGangLeader?'👑 Lidersin':'Üye'}</div>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.35rem',marginBottom:'0.5rem'}}>
                  {[['💰','Kasa',fmtWord(myGang.treasury||0)],['⚡','Güç',(myGang.power||10)+((myGang.weapons||0)*5)+((myGang.ammo||0)*3)],['🗺️','Bölge',myGang.territory||0]].map(([ic,lb,v])=>(
                    <div key={lb} style={{background:'rgba(237,231,218,0.03)',borderRadius:'8px',padding:'0.4rem',textAlign:'center'}}>
                      <div style={{fontSize:'0.9rem'}}>{ic}</div>
                      <div style={{fontWeight:700,color:'#EDE7DA',fontSize:'0.78rem'}}>{v}</div>
                      <div style={{fontSize:'0.55rem',color:'#8893A1',textTransform:'uppercase'}}>{lb}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap'}}>
                  <Btn variant='ghost' size='sm' onClick={()=>setSub('management')}>⚙️ Yönet</Btn>
                  <Btn variant='ghost' size='sm' onClick={()=>setDonateModal(true)}>💰 Bağış</Btn>
                  {!isGangLeader && <Btn variant='danger' size='sm' onClick={leaveGang}>🚪 Ayrıl</Btn>}
                </div>
              </div>
            )}
            {!myGang && (
              <div style={{marginBottom:'0.75rem'}}>
                {!isFamily && <Btn variant='danger' size='sm' style={{width:'100%',marginBottom:'0.4rem'}} onClick={()=>{setGForm(p=>({...p,type:'gang'}));setCreateModal(true);}}>⚔️ Çete Kur (₺2 Mlr)</Btn>}
                {isFamily && <Btn variant='ghost' size='sm' style={{width:'100%'}} onClick={()=>{setGForm(p=>({...p,type:'family'}));setCreateModal(true);}}>👨‍👩‍👧‍👦 Aile Kur (₺5 Mlr)</Btn>}
              </div>
            )}
            {filteredGangs.map(gang => (
              <Card key={gang.id} style={{marginBottom:'0.5rem',padding:'0.85rem',border:`1px solid ${gang.id===myGang?.id?'rgba(194,75,67,0.3)':gang.type==='family'?'rgba(201,162,39,0.15)':'rgba(194,75,67,0.1)'}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{fontWeight:800,color:'#EDE7DA',fontSize:'0.9rem'}}>{gang.type==='family'?'👨‍👩‍👧‍👦':'⚔️'} {gang.name}</div>
                    <div style={{fontSize:'0.7rem',color:'#8893A1'}}>{gang.memberCount} üye • Güç: {(gang.power||10)+((gang.weapons||0)*5)+((gang.ammo||0)*3)} • {fmtWord(gang.treasury||0)} kasa</div>
                  </div>
                  <div style={{display:'flex',gap:'0.3rem',alignItems:'center'}}>
                    {gang.id===myGang?.id && <Tag color='red'>Üyesin</Tag>}
                    {!myGang && <Btn variant='ghost' size='sm' onClick={()=>joinGang(gang)}>Katıl</Btn>}
                  </div>
                </div>
              </Card>
            ))}
            {filteredGangs.length===0 && <div style={{textAlign:'center',color:'#8893A1',padding:'2rem',fontSize:'0.85rem'}}>{isFamily?'Henüz aile yok. İlk sen kur! 👨‍👩‍👧‍👦':'Henüz çete yok. İlk sen kur! ⚔️'}</div>}
          </div>
        )}

        {sub==='management' && (
          <div>
            {!myGang ? (
              <Card style={{textAlign:'center',padding:'2rem'}}><div style={{fontSize:'2rem',marginBottom:'0.5rem'}}>⚔️</div><div style={{color:'#8893A1',fontSize:'0.85rem'}}>Yönetim için bir çeteye katıl</div></Card>
            ) : (
              <div>
                <Card style={{marginBottom:'0.65rem',background:'linear-gradient(135deg,rgba(194,75,67,0.08),rgba(11,21,39,0.95))'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.65rem'}}>
                    <div style={{fontSize:'1.5rem'}}>{myGang.type==='family'?'👨‍👩‍👧‍👦':'⚔️'}</div>
                    <div style={{fontWeight:900,color:'#EDE7DA',fontSize:'1rem'}}>{myGang.name}</div>
                    {isGangLeader&&<Tag color='red'>👑 Lider</Tag>}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.35rem',marginBottom:'0.5rem'}}>
                    {[['👑','Lider',myGang.leaderName||'?'],['👥','Üye',myGang.memberCount||1],['⚡','Güç',(myGang.power||10)+((myGang.weapons||0)*5)+((myGang.ammo||0)*3)],['💰','Kasa',fmtWord(myGang.treasury||0)]].map(([ic,lb,v])=>(
                      <div key={lb} style={{background:'rgba(237,231,218,0.03)',borderRadius:'8px',padding:'0.4rem',textAlign:'center'}}>
                        <div style={{fontSize:'0.8rem'}}>{ic}</div>
                        <div style={{fontWeight:700,color:'#EDE7DA',fontSize:'0.7rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v}</div>
                        <div style={{fontSize:'0.52rem',color:'#8893A1',textTransform:'uppercase'}}>{lb}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap'}}>
                    <Btn variant='ghost' size='sm' onClick={()=>setDonateModal(true)}>💰 Kasa Yatır</Btn>
                    {!isGangLeader && <Btn variant='danger' size='sm' onClick={leaveGang}>🚪 Ayrıl</Btn>}
                  </div>
                </Card>

                {isGangLeader && (
                  <Card style={{marginBottom:'0.65rem',border:'1px solid rgba(194,75,67,0.2)'}}>
                    <div style={{fontWeight:700,color:'#E08C87',marginBottom:'0.65rem',fontSize:'0.82rem',textTransform:'uppercase',letterSpacing:'0.06em'}}>👑 Lider Yetkileri</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.4rem',marginBottom:'0.5rem'}}>
                      {[
                        {id:'harac',label:'💰 Haraç Topla',cd:2*3600000,fn:()=>{const g=Math.floor((myGang.power||10)*150);setGangs(prev=>prev.map(x=>x.id===myGang.id?{...x,treasury:(x.treasury||0)+g}:x));showNotif(`💰 Haraç! +${fmtWord(g)} kasa`,'success');}},
                        {id:'bolge',label:'🗺️ Bölge Al',cd:3*3600000,fn:()=>{setGangs(prev=>prev.map(x=>x.id===myGang.id?{...x,territory:(x.territory||0)+1,power:(x.power||10)+2}:x));setProfile(pr=>{const np={...pr,xp:(pr.xp||0)+150};localStorage.setItem('rep_userProfile',JSON.stringify(np));return np;});showNotif('🗺️ Yeni bölge! +1 bölge, +2 güç, +150 XP','success');}},
                        {id:'savunma',label:'🛡️ Güvenli Alan',cd:4*3600000,fn:()=>{setGangs(prev=>prev.map(x=>x.id===myGang.id?{...x,power:(x.power||10)+5}:x));showNotif('🛡️ Güvenli alan! +5 güç','success');}},
                        {id:'baskin',label:'⚔️ Baskın',cd:6*3600000,fn:()=>{const won=Math.random()<0.55;const prize=won?Math.floor((myGang.power||10)*200):0;if(won){setGangs(prev=>prev.map(x=>x.id===myGang.id?{...x,power:(x.power||10)+3}:x));setProfile(pr=>{const np={...pr,money:(pr.money||0)+prize,xp:(pr.xp||0)+200};localStorage.setItem('rep_userProfile',JSON.stringify(np));return np;});}else{setGangs(prev=>prev.map(x=>x.id===myGang.id?{...x,power:Math.max(5,(x.power||10)-2)}:x));}showNotif(won?`⚔️ Baskın başarılı! +${fmtWord(prize)}`:'⚔️ Başarısız! -2 güç',won?'success':'error');}},
                      ].map(a=>{
                        const key=`gang_${myGang.id}_${a.id}`;
                        const rem=Math.max(0,a.cd-(Date.now()-(gangCooldowns[key]||0)));
                        return (
                          <button key={a.id} onClick={()=>gangAction(a.id,a.cd,a.fn)} disabled={rem>0}
                            style={{padding:'0.55rem 0.4rem',background:rem>0?'rgba(255,255,255,0.03)':'rgba(194,75,67,0.08)',border:`1px solid ${rem>0?'rgba(255,255,255,0.07)':'rgba(194,75,67,0.2)'}`,borderRadius:'10px',color:rem>0?'#3B4E63':'#E08C87',cursor:rem>0?'not-allowed':'pointer',fontWeight:700,fontSize:'0.72rem',fontFamily:"'Inter',sans-serif",textAlign:'center',lineHeight:1.3}}>
                            {a.label}{rem>0&&<div style={{fontSize:'0.6rem',marginTop:'2px',color:'#8893A1'}}>⏳{Math.ceil(rem/3600000)}s</div>}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap',borderTop:'1px solid rgba(255,255,255,0.05)',paddingTop:'0.5rem'}}>
                      <Btn variant='ghost' size='sm' onClick={()=>setHalefModal(true)}>🎖️ Halef Belirle</Btn>
                      <Btn variant='ghost' size='sm' onClick={()=>setTransferModal(true)}>🔄 Liderliği Devret</Btn>
                      <Btn variant='danger' size='sm' onClick={leaveGang}>🚪 Ayrıl</Btn>
                      <Btn variant='danger' size='sm' onClick={()=>setDisbandConfirm(true)}>🗑️ Dağıt</Btn>
                    </div>
                  </Card>
                )}

                {/* HALEF KARTI */}
                {isGangLeader && (
                  <Card style={{marginBottom:'0.65rem',background:'rgba(201,162,39,0.06)',border:'1px solid rgba(201,162,39,0.2)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.35rem'}}>
                      <div style={{fontWeight:700,color:'#C9A227',fontSize:'0.82rem'}}>🎖️ Halef (Vasiyet)</div>
                      <button onClick={()=>setHalefModal(true)} style={{background:'rgba(201,162,39,0.12)',border:'1px solid rgba(201,162,39,0.25)',borderRadius:'6px',padding:'2px 8px',color:'#C9A227',cursor:'pointer',fontSize:'0.68rem',fontWeight:700}}>Değiştir</button>
                    </div>
                    {myGang.successorId ? (
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <div style={{fontSize:'0.82rem',color:'#EDE7DA'}}>
                          <span style={{marginRight:'0.4rem'}}>👑</span>
                          <strong>{myGang.successorName}</strong>
                          <span style={{color:'#8893A1',fontSize:'0.7rem',marginLeft:'0.4rem'}}>— Ayrıldığında otomatik lider olur</span>
                        </div>
                        <button onClick={clearSuccessor} style={{background:'rgba(194,75,67,0.08)',border:'1px solid rgba(194,75,67,0.2)',borderRadius:'6px',padding:'2px 8px',color:'#E08C87',cursor:'pointer',fontSize:'0.65rem',fontWeight:700}}>İptal</button>
                      </div>
                    ) : (
                      <div style={{fontSize:'0.78rem',color:'#8893A1'}}>Henüz halef belirlenmedi. Liderin ayrılmak için halef belirlemesi gerekir.</div>
                    )}
                  </Card>
                )}

                <Card>
                  <div style={{fontWeight:700,color:'#EDE7DA',marginBottom:'0.65rem',fontSize:'0.85rem'}}>👥 Üyeler ({myGang.memberCount||1})</div>
                  {(()=>{
                    const RANKS = ['👤 Çaylak','🔫 Asker','⚡ Kapodecima','💀 Underboss'];
                    return (myGang.members||[]).map((muid,i)=>{
                      const isLeaderRow = muid===myGang.leaderId;
                      const memberRank = isLeaderRow ? '👑 Lider' : ((myGang.ranks||{})[muid] || '👤 Çaylak');
                      const isSuccessor = muid===myGang.successorId;
                      return (
                        <div key={muid} style={{borderBottom:'1px solid rgba(255,255,255,0.04)',paddingBottom:'0.35rem',marginBottom:'0.35rem'}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                              <div style={{width:'28px',height:'28px',borderRadius:'50%',background:isLeaderRow?'rgba(194,75,67,0.15)':isSuccessor?'rgba(201,162,39,0.15)':'rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.85rem'}}>
                                {isLeaderRow?'👑':isSuccessor?'🎖️':'👤'}
                              </div>
                              <div>
                                <div style={{fontSize:'0.82rem',fontWeight:700,color:muid===uid?'#E08C87':'#EDE7DA'}}>
                                  {muid===uid?profile?.username:`Üye #${i+1}`}
                                  {isSuccessor&&<span style={{marginLeft:'0.3rem',fontSize:'0.65rem',color:'#C9A227',fontWeight:700}}>HALEF</span>}
                                </div>
                                <div style={{fontSize:'0.65rem',color:'#8893A1'}}>{memberRank}</div>
                              </div>
                            </div>
                            {isGangLeader&&!isLeaderRow&&(
                              <div style={{display:'flex',gap:'0.3rem'}}>
                                <button onClick={()=>setRankMenuUid(rankMenuUid===muid?null:muid)} style={{background:'rgba(237,231,218,0.05)',border:'1px solid rgba(237,231,218,0.1)',borderRadius:'6px',padding:'2px 7px',color:'#8893A1',cursor:'pointer',fontSize:'0.65rem',fontWeight:700}}>Rütbe</button>
                                <button onClick={()=>kickMember(muid)} style={{background:'rgba(194,75,67,0.08)',border:'1px solid rgba(194,75,67,0.2)',borderRadius:'6px',padding:'2px 8px',color:'#E08C87',cursor:'pointer',fontSize:'0.65rem',fontWeight:700}}>Çıkar</button>
                              </div>
                            )}
                          </div>
                          {rankMenuUid===muid&&(
                            <div style={{display:'flex',gap:'0.3rem',flexWrap:'wrap',marginTop:'0.35rem',paddingLeft:'2.2rem'}}>
                              {RANKS.map(r=>(
                                <button key={r} onClick={()=>changeMemberRank(muid,r)}
                                  style={{background:memberRank===r?'rgba(194,75,67,0.15)':'rgba(255,255,255,0.05)',border:`1px solid ${memberRank===r?'rgba(194,75,67,0.35)':'rgba(255,255,255,0.08)'}`,borderRadius:'6px',padding:'2px 7px',color:memberRank===r?'#E08C87':'#8BA0B5',cursor:'pointer',fontSize:'0.65rem',fontWeight:700}}>
                                  {r}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </Card>
              </div>
            )}
          </div>
        )}

        {sub==='wars' && (
          <div>
            {/* Aktif Savaş Kartı */}
            {activeWar && (()=>{
              const isAttacker = activeWar.attackerId===myGang?.id;
              const side = isAttacker ? 'attacker' : 'defender';
              const alreadyJoined = (isAttacker ? activeWar.attackerParticipants : activeWar.defenderParticipants)||[];
              const userJoined = alreadyJoined.find(p=>p.uid===uid);
              const remaining = Math.max(0, activeWar.endsAt - warNow);
              const h=Math.floor(remaining/3600000), m=Math.floor((remaining%3600000)/60000), s=Math.floor((remaining%60000)/1000);
              const atkTotPow = (activeWar.attackerPower||10) + (activeWar.attackerParticipants||[]).reduce((s,p)=>s+((p.weapons||0)*5)+((p.ammo||0)*3),0);
              const defTotPow = (activeWar.defenderPower||10) + (activeWar.defenderParticipants||[]).reduce((s,p)=>s+((p.weapons||0)*5)+((p.ammo||0)*3),0) + (activeWar.policeBonus||0);
              const atkWinPct = Math.round(atkTotPow/(atkTotPow+defTotPow)*100);
              return (
                <div style={{background:'linear-gradient(135deg,rgba(194,75,67,0.12),rgba(11,21,39,0.97))',border:'2px solid rgba(194,75,67,0.4)',borderRadius:'14px',padding:'1rem',marginBottom:'0.75rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.6rem'}}>
                    <div style={{fontWeight:900,color:'#E08C87',fontSize:'0.95rem'}}>⚔️ AKTİF SAVAŞ</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",color:'#C24B43',fontWeight:700,fontSize:'0.8rem'}}>{h}s {m}dk {s}sn</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.75rem'}}>
                    <div style={{flex:1,textAlign:'center'}}>
                      <div style={{fontSize:'0.7rem',color:isAttacker?'#E08C87':'#8893A1',fontWeight:700}}>⚔️ SALDIRAN</div>
                      <div style={{fontWeight:800,color:'#EDE7DA',fontSize:'0.88rem'}}>{activeWar.attackerName}</div>
                      <div style={{fontSize:'0.68rem',color:'#4C9A6B',fontWeight:700}}>💪 {atkTotPow} güç</div>
                      <div style={{fontSize:'0.6rem',color:'#8893A1'}}>{(activeWar.attackerParticipants||[]).length} katılımcı</div>
                    </div>
                    <div style={{textAlign:'center',padding:'0.5rem'}}>
                      <div style={{fontSize:'1.5rem'}}>⚔️</div>
                      <div style={{fontSize:'0.6rem',color:'#C9A227',fontWeight:700}}>%{atkWinPct}</div>
                      <div style={{fontSize:'0.55rem',color:'#8893A1'}}>Atk şans</div>
                    </div>
                    <div style={{flex:1,textAlign:'center'}}>
                      <div style={{fontSize:'0.7rem',color:!isAttacker?'#4C9A6B':'#8893A1',fontWeight:700}}>🛡️ SAVUNAN</div>
                      <div style={{fontWeight:800,color:'#EDE7DA',fontSize:'0.88rem'}}>{activeWar.defenderName}</div>
                      <div style={{fontSize:'0.68rem',color:'#4C9A6B',fontWeight:700}}>💪 {defTotPow} güç</div>
                      <div style={{fontSize:'0.6rem',color:'#8893A1'}}>{(activeWar.defenderParticipants||[]).length} katılımcı{activeWar.policeBonus>0?` + 🚔 +${activeWar.policeBonus}`:''}</div>
                    </div>
                  </div>
                  {!userJoined ? (
                    <button onClick={()=>joinWar(activeWar)}
                      style={{width:'100%',padding:'0.65rem',borderRadius:'10px',border:'none',background:'linear-gradient(135deg,#C24B43,#E08C87)',color:'#fff',fontWeight:800,fontSize:'0.85rem',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>
                      {isAttacker ? '⚔️ Saldırıya Katıl' : '🛡️ Savunmaya Katıl'} (+{(profile?.weapons||0)*5+(profile?.ammo||0)*3} güç)
                    </button>
                  ) : (
                    <div style={{textAlign:'center',padding:'0.5rem',background:'rgba(76,154,107,0.08)',border:'1px solid rgba(76,154,107,0.2)',borderRadius:'10px',color:'#4C9A6B',fontSize:'0.8rem',fontWeight:700}}>
                      ✅ Katıldın! {userJoined.weapons} silah + {userJoined.ammo} mermi ile savaşıyorsun.
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Savaş İlan Et */}
            {myGang && isGangLeader && !activeWar && !isFamily && (
              <div style={{marginBottom:'0.75rem'}}>
                <button onClick={()=>setWarModal(true)}
                  style={{width:'100%',padding:'0.7rem',borderRadius:'12px',border:'1px solid rgba(194,75,67,0.3)',background:'rgba(194,75,67,0.08)',color:'#E08C87',fontWeight:800,fontSize:'0.85rem',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>
                  ⚔️ Savaş İlan Et (₺100.000 kasa)
                </button>
              </div>
            )}

            {/* Savaş Geçmişi */}
            <div style={{fontWeight:700,color:'#8893A1',fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'0.5rem'}}>
              Son Savaşlar
            </div>
            {gangWars.length===0 && <div style={{textAlign:'center',padding:'2rem',color:'#3B4E63',fontSize:'0.82rem'}}>Henüz savaş yok.</div>}
            {gangWars.slice(0,10).map(w=>{
              const isMine = myGang && (w.attackerId===myGang.id||w.defenderId===myGang.id);
              const isWinner = w.winner && ((w.winner==='attacker'&&w.attackerId===myGang?.id)||(w.winner==='defender'&&w.defenderId===myGang?.id));
              return (
                <div key={w.id} style={{background:'rgba(237,231,218,0.02)',border:`1px solid ${w.status==='active'?'rgba(194,75,67,0.3)':isWinner?'rgba(76,154,107,0.25)':'rgba(255,255,255,0.06)'}`,borderRadius:'10px',padding:'0.75rem',marginBottom:'0.5rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div>
                      <div style={{fontSize:'0.82rem',fontWeight:700,color:'#EDE7DA'}}>{w.attackerName} ⚔️ {w.defenderName}</div>
                      <div style={{fontSize:'0.65rem',color:'#8893A1',marginTop:'2px'}}>
                        {w.status==='active' ? '🔴 Devam ediyor' :
                          w.winner==='attacker' ? `🏆 ${w.attackerName} kazandı` : `🛡️ ${w.defenderName} kazandı`}
                        {w.reward && ` • Ödül: ₺${(w.reward.money).toLocaleString()}`}
                      </div>
                    </div>
                    {isMine && w.status==='active' && (
                      <div style={{background:'rgba(194,75,67,0.12)',border:'1px solid rgba(194,75,67,0.25)',borderRadius:'6px',padding:'2px 8px',color:'#E08C87',fontSize:'0.65rem',fontWeight:700}}>ÜYESİN</div>
                    )}
                    {w.status==='resolved' && (
                      <div style={{fontSize:'0.65rem',color:isWinner?'#4C9A6B':'#C24B43',fontWeight:700}}>{isWinner?'🏆 GELDİ':'💀 KAYBETTİ'}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {sub==='attack' && (
          <div>
            {[['🥊','Sokak Kavgası',80,'₺500-2.000',500],['🔫','Gasp Girişimi',60,'₺2.000-8.000',3000],['💣','Banka Soygunu',30,'₺20K-100K',10000],['🚗','Araba Hırsızlığı',70,'₺5.000-15.000',2000]].map(([ic,name,rate,earn,fine])=>(
              <button key={name} onClick={()=>{
                const success=Math.random()*100<rate;
                const amount=success?Math.floor(Math.random()*(rate===30?80000:rate===60?6000:rate===70?10000:1500)+2000):0;
                const penalty=success?0:fine;
                setProfile(p=>{const np={...p,money:(p.money||0)+amount-penalty,xp:(p.xp||0)+(success?100:20)};localStorage.setItem('rep_userProfile',JSON.stringify(np));return np;});
                showNotif(success?`🎉 Başarılı! +${fmtWord(amount)}`:`😔 Başarısız! -${fmtWord(penalty)} ceza`,success?'success':'error');
                if (success && amount >= 20000) { try { window._pushGameEvent?.('suc_basarili', `${ic} ${name}`, `${profile?.username||'Bir çete üyesi'} başarılı! +₺${amount.toLocaleString()} ganimet.`, ic, 'çete'); } catch(e){} }
              }}
                style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.85rem',background:'rgba(20,36,60,0.8)',border:'1px solid rgba(194,75,67,0.15)',borderRadius:'12px',width:'100%',marginBottom:'0.5rem',cursor:'pointer',WebkitTapHighlightColor:'transparent'}}>
                <span style={{fontSize:'1.5rem',width:'32px',textAlign:'center',flexShrink:0}}>{ic}</span>
                <div style={{flex:1,textAlign:'left'}}>
                  <div style={{fontWeight:800,color:'#EDE7DA',fontSize:'0.9rem'}}>{name}</div>
                  <div style={{fontSize:'0.67rem',color:'#4C9A6B'}}>%{rate} başarı • Kazanç: {earn}</div>
                  <div style={{fontSize:'0.65rem',color:'#C24B43'}}>Ceza riski: {fmtWord(fine)}</div>
                </div>
                <span style={{color:'#C24B43',fontSize:'0.85rem'}}>→</span>
              </button>
            ))}
          </div>
        )}

        {sub==='territory' && (
          <div>
            {window.TurkeyMapScreen ? (
              React.createElement(window.TurkeyMapScreen, {
                profile,
                gangs,
                families: (()=>{ try{return JSON.parse(localStorage.getItem('rep_families')||'[]');}catch{return[];} })(),
                showNotif,
                mode: 'gang',
              })
            ) : (
              <TerritorySystem profile={profile} setProfile={setProfile} showNotif={showNotif} myGang={myGang} gangs={gangs} setGangs={setGangs} isGangLeader={isGangLeader} />
            )}
          </div>
        )}

        {sub==='weapons' && (
          <WeaponSystem profile={profile} setProfile={setProfile} showNotif={showNotif} myGang={myGang} gangs={gangs} setGangs={setGangs} isGangLeader={isGangLeader} />
        )}
      </div>

      {createModal && (
        <Modal title={(typeFilter||gForm.type)==='gang'?'⚔️ Çete Kur':'👨‍👩‍👧‍👦 Aile Kur'} onClose={()=>{setCreateModal(false);setGForm({name:'',type:'gang',desc:''});}}>
          <div style={{marginBottom:'0.85rem'}}>
            <div style={{fontSize:'0.72rem',color:'#8893A1',marginBottom:'0.4rem',fontWeight:700}}>İsim</div>
            <input value={gForm.name} onChange={e=>setGForm(p=>({...p,name:e.target.value}))} placeholder={(typeFilter||gForm.type)==='gang'?'Çete adı...':'Aile adı...'} style={inpSt} />
          </div>
          <div style={{marginBottom:'0.85rem'}}>
            <div style={{fontSize:'0.72rem',color:'#8893A1',marginBottom:'0.4rem',fontWeight:700}}>Açıklama (opsiyonel)</div>
            <textarea value={gForm.desc} onChange={e=>setGForm(p=>({...p,desc:e.target.value}))} placeholder="Kısa bir açıklama..." rows={2}
              style={{width:'100%',background:'rgba(237,231,218,0.03)',border:'1px solid rgba(237,231,218,0.1)',borderRadius:'10px',padding:'0.65rem 0.9rem',color:'#EDE7DA',fontFamily:"'Inter',sans-serif",fontSize:'14px',outline:'none',resize:'none',boxSizing:'border-box'}} />
          </div>
          <div style={{background:'rgba(194,75,67,0.08)',border:'1px solid rgba(194,75,67,0.2)',borderRadius:'10px',padding:'0.65rem',fontSize:'0.78rem',color:'#E08C87',marginBottom:'1rem'}}>
            💡 Kurmak için gereken: {fmtWord((typeFilter||gForm.type)==='family'?5000000000:2000000000)} • Bakiye: {fmtWord(profile?.money)}
          </div>
          <Btn variant='danger' size='full' onClick={createGang}>{(typeFilter||gForm.type)==='gang'?'⚔️ Çeteyi Kur':'👨‍👩‍👧‍👦 Aileyi Kur'}</Btn>
        </Modal>
      )}

      {donateModal&&(
        <Modal title="💰 Kasaya Para Yatır" onClose={()=>{setDonateModal(false);setDonateAmt('');}}>
          <div style={{marginBottom:'1rem'}}>
            <div style={{fontSize:'0.72rem',color:'#8893A1',marginBottom:'0.4rem',fontWeight:700}}>Tutar</div>
            <input type="number" value={donateAmt} onChange={e=>setDonateAmt(e.target.value)} placeholder="₺ Tutar" style={inpSt} />
            <div style={{display:'flex',gap:'0.4rem',marginTop:'0.5rem',flexWrap:'wrap'}}>
              {[5000,10000,25000,50000].map(n=><button key={n} onClick={()=>setDonateAmt(String(n))} style={{padding:'0.3rem 0.65rem',borderRadius:'8px',border:'1px solid rgba(237,231,218,0.1)',background:'rgba(237,231,218,0.03)',color:'#8893A1',fontSize:'0.72rem',cursor:'pointer',fontWeight:700}}>{fmtWord(n)}</button>)}
            </div>
          </div>
          <Btn variant='danger' size='full' onClick={donateToGang}>💰 Yatır</Btn>
        </Modal>
      )}

      {transferModal&&(
        <Modal title="🔄 Liderliği Devret" onClose={()=>{setTransferModal(false);setTransferTarget('');}}>
          <div style={{background:'rgba(194,75,67,0.08)',border:'1px solid rgba(194,75,67,0.2)',borderRadius:'10px',padding:'0.65rem',fontSize:'0.78rem',color:'#E08C87',marginBottom:'1rem'}}>
            ⚠️ Liderliği devrettikten sonra artık lider yetkilerine sahip olmayacaksın.
          </div>
          <div style={{marginBottom:'1rem'}}>
            <div style={{fontSize:'0.72rem',color:'#8893A1',marginBottom:'0.4rem',fontWeight:700}}>Yeni Lider Kullanıcı Adı</div>
            <input value={transferTarget} onChange={e=>setTransferTarget(e.target.value)} placeholder="Çete üyesinin kullanıcı adı" style={inpSt} />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem'}}>
            <Btn variant='ghost' size='md' onClick={()=>{setTransferModal(false);setTransferTarget('');}}>İptal</Btn>
            <Btn variant='danger' size='md' onClick={transferGangLeadership}>🔄 Devret</Btn>
          </div>
        </Modal>
      )}

      {disbandConfirm&&(
        <Modal title="🗑️ Çeteyi Dağıt" onClose={()=>setDisbandConfirm(false)}>
          <div style={{background:'rgba(194,75,67,0.08)',border:'1px solid rgba(194,75,67,0.2)',borderRadius:'10px',padding:'0.65rem',fontSize:'0.78rem',color:'#E08C87',marginBottom:'1rem'}}>
            ⚠️ Bu işlem geri alınamaz! <strong>{myGang?.name}</strong> kalıcı olarak dağıtılacak.
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem'}}>
            <Btn variant='ghost' size='md' onClick={()=>setDisbandConfirm(false)}>İptal</Btn>
            <Btn variant='red' size='md' onClick={disbandGang}>🗑️ Dağıt</Btn>
          </div>
        </Modal>
      )}

      {halefModal&&(
        <Modal title="🎖️ Halef Belirle" onClose={()=>{setHalefModal(false);setHalefTarget('');}}>
          <div style={{background:'rgba(201,162,39,0.06)',border:'1px solid rgba(201,162,39,0.25)',borderRadius:'10px',padding:'0.65rem',fontSize:'0.78rem',color:'#C9A227',marginBottom:'1rem'}}>
            👑 Ayrıldığında liderlik otomatik bu kişiye devredilir. İstediğinde iptal edebilirsin.
          </div>
          {myGang?.successorId && (
            <div style={{background:'rgba(237,231,218,0.03)',borderRadius:'8px',padding:'0.5rem 0.75rem',marginBottom:'0.75rem',fontSize:'0.78rem',color:'#8893A1'}}>
              Mevcut halef: <strong style={{color:'#C9A227'}}>{myGang.successorName}</strong>
            </div>
          )}
          <div style={{marginBottom:'1rem'}}>
            <div style={{fontSize:'0.72rem',color:'#8893A1',marginBottom:'0.4rem',fontWeight:700}}>Yeni Halef Kullanıcı Adı</div>
            <input value={halefTarget} onChange={e=>setHalefTarget(e.target.value)} placeholder="Çete üyesinin kullanıcı adı"
              style={{width:'100%',background:'rgba(237,231,218,0.03)',border:'1px solid rgba(237,231,218,0.1)',borderRadius:'10px',padding:'0.65rem 0.9rem',color:'#EDE7DA',fontFamily:"'Inter',sans-serif",fontSize:'16px',outline:'none',boxSizing:'border-box'}} />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem'}}>
            <Btn variant='ghost' size='md' onClick={()=>{setHalefModal(false);setHalefTarget('');}}>İptal</Btn>
            <Btn variant='ghost' size='md' onClick={setGangSuccessor} style={{background:'rgba(201,162,39,0.12)',border:'1px solid rgba(201,162,39,0.25)',color:'#C9A227'}}>🎖️ Halef Belirle</Btn>
          </div>
        </Modal>
      )}

      {/* Savaş İlan Et Modal */}
      {warModal && (
        <Modal title="⚔️ Savaş İlan Et" onClose={()=>{setWarModal(false);setWarTarget(null);}}>
          <div style={{background:'rgba(194,75,67,0.08)',border:'1px solid rgba(194,75,67,0.2)',borderRadius:'10px',padding:'0.65rem',fontSize:'0.78rem',color:'#E08C87',marginBottom:'1rem',lineHeight:1.5}}>
            ⚠️ Savaş 12 saat sürer. Kasanızdan ₺100.000 kesilir.<br/>
            Üyeleriniz savaşa katılarak güç katkısında bulunabilir (silah × 5 + mermi × 3).<br/>
            Galip çete: toprak +1, hazine ödülü, mermi ödülü kazanır.
          </div>
          <div style={{fontSize:'0.72rem',color:'#8893A1',fontWeight:700,marginBottom:'0.5rem',textTransform:'uppercase',letterSpacing:'0.06em'}}>Hedef Çete Seç</div>
          <div style={{maxHeight:'320px',overflowY:'auto'}}>
            {gangs.filter(g=>g.type==='gang'&&g.id!==myGang?.id&&!gangWars.find(w=>w.status==='active'&&(w.attackerId===g.id||w.defenderId===g.id))).map(g=>{
              const isSelected = warTarget?.id===g.id;
              return (
                <button key={g.id} onClick={()=>setWarTarget(g)}
                  style={{width:'100%',display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.65rem',borderRadius:'10px',border:`1px solid ${isSelected?'rgba(194,75,67,0.4)':'rgba(237,231,218,0.07)'}`,background:isSelected?'rgba(194,75,67,0.1)':'rgba(237,231,218,0.02)',marginBottom:'0.4rem',cursor:'pointer',textAlign:'left'}}>
                  <span style={{fontSize:'1.3rem'}}>⚔️</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,color:'#EDE7DA',fontSize:'0.85rem'}}>{g.name}</div>
                    <div style={{fontSize:'0.65rem',color:'#8893A1'}}>{g.memberCount} üye • 💪 {gangTotalPower(g)} güç</div>
                  </div>
                  {isSelected && <span style={{color:'#E08C87',fontWeight:700}}>✓</span>}
                </button>
              );
            })}
            {gangs.filter(g=>g.type==='gang'&&g.id!==myGang?.id).length===0 && (
              <div style={{textAlign:'center',padding:'1.5rem',color:'#3B4E63',fontSize:'0.82rem'}}>Savaş ilan edilecek başka çete yok.</div>
            )}
          </div>
          {warTarget && (
            <div style={{marginTop:'0.75rem',background:'rgba(237,231,218,0.03)',border:'1px solid rgba(237,231,218,0.08)',borderRadius:'10px',padding:'0.65rem',fontSize:'0.78rem',color:'#8893A1'}}>
              🎯 Hedef: <strong style={{color:'#EDE7DA'}}>{warTarget.name}</strong> — {gangTotalPower(warTarget)} güç<br/>
              🏴 Senin gücün: <strong style={{color:'#E08C87'}}>{gangTotalPower(myGang)}</strong>
            </div>
          )}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',marginTop:'0.75rem'}}>
            <Btn variant='ghost' size='md' onClick={()=>{setWarModal(false);setWarTarget(null);}}>İptal</Btn>
            <Btn variant='danger' size='md' onClick={()=>warTarget&&declareWar(warTarget)} style={{opacity:warTarget?1:0.4}}>⚔️ Savaş İlan Et</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

