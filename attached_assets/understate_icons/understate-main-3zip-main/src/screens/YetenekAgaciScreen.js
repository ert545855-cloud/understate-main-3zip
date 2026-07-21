window.YetenekAgaciScreen = function({ profile, onNavigate, showNotif }) {
  const G='#C89B3C',BG='#0F0800',T='#F5EBD7',M='#A9A6A0',S='#2D1800',GR='#3E8C5A',R='#B8423C',P='#A78BFA';
  const BRANCHES = {
    askeri: { label:'Askeri', emoji:'⚔️', color:R, skills:[
      {id:'guc1',    name:'Güç Egzersizi',  emoji:'💪', desc:'+5% savaş gücü',      cost:1, tier:1},
      {id:'silah1',  name:'Silah Bakımı',   emoji:'🗡️', desc:'+10 silah etkinliği', cost:1, tier:1},
      {id:'savunma1',name:'Kalkan Ustalığı',emoji:'🛡️', desc:'+8% savunma',         cost:2, tier:2},
      {id:'strateji',name:'Harp Stratejisi',emoji:'🗺️', desc:'+15% savaş ödülü',   cost:2, tier:2},
      {id:'komutan', name:'Komutanlık',      emoji:'🎖️', desc:'+20% ordu gücü',      cost:3, tier:3},
    ]},
    ticaret: { label:'Ticaret', emoji:'💰', color:G, skills:[
      {id:'pazarlik',name:'Pazarlık',        emoji:'🤝', desc:'-10% alış fiyatı',    cost:1, tier:1},
      {id:'muhasebe',name:'Muhasebe',        emoji:'📊', desc:'+5% faiz geliri',     cost:1, tier:1},
      {id:'kervanci',name:'Kervan Yönetimi', emoji:'🐪', desc:'+20% kervan kârı',   cost:2, tier:2},
      {id:'lonca1',  name:'Lonca Üyeliği',  emoji:'⚒️', desc:'+15% zanaat XP',     cost:2, tier:2},
      {id:'tacir',   name:'Büyük Tâcir',    emoji:'💎', desc:'+30% ticaret geliri', cost:3, tier:3},
    ]},
    devlet: { label:'Devlet', emoji:'🏛️', color:P, skills:[
      {id:'hitabet', name:'Hitabet',         emoji:'📜', desc:'+10% ferman etkisi',  cost:1, tier:1},
      {id:'hukuk1',  name:'Hukuk Bilgisi',  emoji:'⚖️', desc:'+5% vergi geliri',   cost:1, tier:1},
      {id:'diplomasi',name:'Diplomasi',      emoji:'🕊️', desc:'+15% ittifak bonus', cost:2, tier:2},
      {id:'yonetim', name:'Yönetim Sanatı', emoji:'👑', desc:'+10% vali performansı',cost:2, tier:2},
      {id:'vezirlik',name:'Vezirlik Yolu',  emoji:'⚜️', desc:'+25% devlet puanı',  cost:3, tier:3},
    ]},
  };

  const availPoints = Math.floor((profile?.level||1) / 3);
  const [tab, setTab] = React.useState('askeri');
  const [learned, setLearned] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('rep_skills')||'{}'); } catch { return {}; }
  });

  const spentPoints = Object.values(learned).reduce((s,sk) => {
    for (const [bk, br] of Object.entries(BRANCHES)) {
      const skill = br.skills.find(s => s.id === sk);
      if (skill) s += skill.cost;
    }
    return s;
  }, 0);
  const remaining = availPoints - spentPoints;

  const learn = (skill, branchKey) => {
    if (learned[skill.id]) { showNotif && showNotif('Bu yetenek zaten öğrenildi','info'); return; }
    if (remaining < skill.cost) { showNotif && showNotif(`Yeterli puan yok (${skill.cost} gerekli)`,'error'); return; }
    // Tier 2 için tier 1 şartı
    if (skill.tier >= 2) {
      const br = BRANCHES[branchKey];
      const tier1Learned = br.skills.filter(s => s.tier < skill.tier && learned[s.id]).length;
      if (tier1Learned === 0) { showNotif && showNotif('Önce alt tier yeteneklerini öğren','error'); return; }
    }
    const upd = { ...learned, [skill.id]: skill.id };
    setLearned(upd);
    localStorage.setItem('rep_skills', JSON.stringify(upd));
    showNotif && showNotif(`✅ ${skill.name} öğrenildi!`, 'success');
  };

  const br = BRANCHES[tab];
  const TIER_LABELS = {1:'Temel',2:'İleri',3:'Ustalık'};

  return React.createElement('div',{style:{minHeight:'100vh',background:BG,fontFamily:"'Inter',sans-serif",paddingBottom:80}},
    // Header
    React.createElement('div',{style:{background:'linear-gradient(135deg,#1a0800,#2d1600)',borderBottom:'1px solid rgba(200,155,60,0.2)',padding:'14px 16px'}},
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:10}},
        onNavigate && React.createElement('button',{onClick:()=>onNavigate('home'),style:{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'6px 10px',color:M,fontSize:'0.75rem',cursor:'pointer'}},'← Geri'),
        React.createElement('span',{style:{fontSize:'1.5rem'}},'🌳'),
        React.createElement('div',null,
          React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:'1.1rem',color:G}},'Yetenek Ağacı'),
          React.createElement('div',{style:{fontSize:'0.62rem',color:M}},`Kullanılabilir: ${remaining} puan • Toplam: ${availPoints}`)
        )
      )
    ),
    React.createElement('div',{style:{padding:'12px'}},
      // Puan özeti
      React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}},
        [{v:availPoints,l:'Toplam Puan',c:G},{v:spentPoints,l:'Harcanan',c:R},{v:remaining,l:'Kalan',c:GR}].map(i=>
          React.createElement('div',{key:i.l,style:{background:S,borderRadius:12,padding:'10px',textAlign:'center',border:`1px solid ${i.c}22`}},
            React.createElement('div',{style:{fontFamily:"'JetBrains Mono',monospace",fontSize:'1.4rem',fontWeight:900,color:i.c}},i.v),
            React.createElement('div',{style:{fontSize:'0.6rem',color:M}},i.l)
          )
        )
      ),
      // Branch tabs
      React.createElement('div',{style:{display:'flex',gap:6,marginBottom:14}},
        Object.entries(BRANCHES).map(([k,br])=>
          React.createElement('button',{key:k,onClick:()=>setTab(k),style:{flex:1,padding:'8px',borderRadius:10,border:`2px solid ${tab===k?br.color:br.color+'22'}`,background:tab===k?br.color+'18':'transparent',color:tab===k?br.color:M,fontWeight:700,fontSize:'0.75rem',cursor:'pointer',transition:'all 0.2s'}},
            `${br.emoji} ${br.label}`)
        )
      ),
      // Skills by tier
      [1,2,3].map(tier=>
        React.createElement('div',{key:tier,style:{marginBottom:12}},
          React.createElement('div',{style:{fontSize:'0.65rem',fontWeight:700,color:br.color,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}},
            `Tier ${tier} — ${TIER_LABELS[tier]}`),
          React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}},
            br.skills.filter(s=>s.tier===tier).map(skill=>{
              const done = !!learned[skill.id];
              return React.createElement('div',{key:skill.id,style:{
                background:done?br.color+'15':S,border:`1px solid ${done?br.color:br.color+'22'}`,
                borderRadius:12,padding:'12px',opacity:done?0.9:1}},
                React.createElement('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:4}},
                  React.createElement('span',{style:{fontSize:'1.3rem'}},skill.emoji),
                  React.createElement('div',null,
                    React.createElement('div',{style:{fontWeight:700,fontSize:'0.82rem',color:done?br.color:T}},skill.name),
                    React.createElement('div',{style:{fontSize:'0.62rem',color:M}},skill.desc)
                  )
                ),
                React.createElement('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:6}},
                  React.createElement('span',{style:{fontSize:'0.62rem',color:br.color}},`💡 ${skill.cost} puan`),
                  done
                    ? React.createElement('span',{style:{fontSize:'0.7rem',color:GR,fontWeight:700}},'✅ Öğrenildi')
                    : React.createElement('button',{onClick:()=>learn(skill,tab),style:{padding:'5px 12px',borderRadius:8,border:'none',background:remaining>=skill.cost?br.color:'rgba(255,255,255,0.1)',color:remaining>=skill.cost?'#0F0800':M,fontWeight:700,fontSize:'0.7rem',cursor:remaining>=skill.cost?'pointer':'not-allowed'}},'Öğren')
                )
              );
            })
          )
        )
      )
    )
  );
};
