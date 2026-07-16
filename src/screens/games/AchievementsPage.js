// ═══════════════════════════════════════════════════════
// BAŞARI SAYFASI
// ═══════════════════════════════════════════════════════
function AchievementsPage({ profile }) {
  const { dark } = useTheme();
  const bg = dark ? '#1A0E00' : '#F8FAFC';
  const cu = profile || {};
  const allUsers = (() => { try { return JSON.parse(localStorage.getItem('rep_users')||'[]'); } catch{return [];} })();
  const factories = (() => { try { return JSON.parse(localStorage.getItem('rep_factories')||'[]'); } catch{return [];} })();
  const gangs = (() => { try { return JSON.parse(localStorage.getItem('rep_gangs')||'[]'); } catch{return [];} })();
  const parties = (() => { try { return JSON.parse(localStorage.getItem('rep_parties')||'[]'); } catch{return [];} })();

  const ACHIEVEMENTS = [
    {id:'first_million',icon:'💰',title:'İlk Milyoner',desc:'🪙1,000,000 birikir',check:p=>(p.money||0)+(p.bankMoney||0)>=1000000,color:'#C9A227'},
    {id:'billionaire',icon:'🏦',title:'Milyarder',desc:'🪙1,000,000,000 birikir',check:p=>(p.money||0)+(p.bankMoney||0)>=1000000000,color:'#C9A227'},
    {id:'lv10',icon:'⭐',title:'Tecrübeli',desc:'Seviye 10',check:p=>(p.level||1)>=10,color:'#C9A227'},
    {id:'lv50',icon:'🌟',title:'Efsanevi',desc:'Seviye 50',check:p=>(p.level||1)>=50,color:'#C9A227'},
    {id:'politician',icon:'🏛️',title:'Siyasetçi',desc:'Bir partiye katıl',check:p=>{const part=parties.find(pt=>(pt.members||[]).includes(p.username));return !!part;},color:'#C9A227'},
    {id:'gangster',icon:'🔫',title:'Sokak Köpeği',desc:'Bir çeteye katıl',check:p=>{const g=gangs.find(g=>(g.members||[]).includes(p.username));return !!g;},color:'#C24B43'},
    {id:'merit100',icon:'🏅',title:'Kahraman',desc:'100 liyakat puanı',check:p=>(p.meritPoints||0)>=100,color:'#C9A227'},
    {id:'merit1000',icon:'🏆',title:'Milli Kahraman',desc:'1000 liyakat puanı',check:p=>(p.meritPoints||0)>=1000,color:'#C9A227'},
    {id:'vip',icon:'👑',title:'VIP Üye',desc:'VIP ol',check:p=>p.vip||p.premium,color:'#C9A227'},
    {id:'factory_owner',icon:'🏭',title:'Zanaatkâr',desc:'Atölye kur',check:p=>factories.some(f=>f.owner===p.username),color:'#C9A227'},
    {id:'uc1000',icon:'💎',title:'UC Koleksiyoncusu',desc:'1000 Altın',check:p=>(p.underCoin||0)>=1000,color:'#7DD3FC'},
    {id:'admin',icon:'⚙️',title:'Oyun Yöneticisi',desc:'Admin ol',check:p=>p.role==='admin'||p.isAdmin,color:'#C24B43'},
    {id:'hp_full',icon:'❤️',title:'Sağlıklı Yaşam',desc:'Canı %100 olsun',check:p=>(p.hp||100)>=100,color:'#4C9A6B'},
    {id:'pvp10',icon:'⚔️',title:'Savaşçı',desc:'10 PvP savaşı',check:p=>{const b=(() => { try { return JSON.parse(localStorage.getItem('rep_pvpBattles')||'[]'); } catch{return [];} })(); return b.filter(x=>x.attacker===p.username).length>=10;},color:'#C24B43'},
    {id:'spy5',icon:'🕵️',title:'Ajan',desc:'5 başarılı operasyon',check:p=>{const ops=(() => { try { return JSON.parse(localStorage.getItem('rep_spyOps')||'[]'); } catch{return [];} })(); return ops.filter(o=>o.result==='success').length>=5;},color:'#C9A227'},
    {id:'social10',icon:'📱',title:'Influencer',desc:'10 gönderi paylaş',check:p=>{const posts=(() => { try { return JSON.parse(localStorage.getItem('rep_socialPosts')||'[]'); } catch{return [];} })(); return posts.filter(x=>x.author===p.username).length>=10;},color:'#C24B43'},
  ];

  const earned = ACHIEVEMENTS.filter(a => { try { return a.check(cu); } catch{return false;} });
  const notEarned = ACHIEVEMENTS.filter(a => { try { return !a.check(cu); } catch{return true;} });

  return (
    <div style={{padding:'1rem',background:bg,minHeight:'100%'}}>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:'1.3rem',fontWeight:900,color:'#C9A227',marginBottom:'0.5rem'}}>🏆 Başarılar</div>
      <div style={{fontSize:'0.82rem',color:'#999',marginBottom:'1rem',background:'rgba(255,215,0,0.07)',borderRadius:'8px',padding:'0.5rem 0.75rem',border:'1px solid rgba(255,215,0,0.2)'}}>
        {earned.length}/{ACHIEVEMENTS.length} başarı kazanıldı · %{Math.round(earned.length/ACHIEVEMENTS.length*100)} tamamlandı
      </div>
      {earned.length>0&&<div style={{marginBottom:'1rem'}}>
        <div style={{fontWeight:700,color:'#C9A227',fontSize:'0.85rem',marginBottom:'0.5rem'}}>✅ Kazanılan Başarılar ({earned.length})</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem'}}>
          {earned.map(a=>(
            <div key={a.id} style={{background:`rgba(255,215,0,0.06)`,border:`1px solid ${a.color}44`,borderRadius:'10px',padding:'0.75rem',display:'flex',gap:'0.5rem',alignItems:'center'}}>
              <span style={{fontSize:'1.5rem'}}>{a.icon}</span>
              <div><div style={{fontWeight:700,fontSize:'0.8rem',color:a.color}}>{a.title}</div><div style={{fontSize:'0.65rem',color:'#999'}}>{a.desc}</div></div>
            </div>
          ))}
        </div>
      </div>}
      <div>
        <div style={{fontWeight:700,color:'#666',fontSize:'0.85rem',marginBottom:'0.5rem'}}>🔒 Kilitli Başarılar ({notEarned.length})</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem'}}>
          {notEarned.map(a=>(
            <div key={a.id} style={{background:'rgba(237,231,218,0.02)',border:'1px solid rgba(237,231,218,0.08)',borderRadius:'10px',padding:'0.75rem',display:'flex',gap:'0.5rem',alignItems:'center',opacity:0.55}}>
              <span style={{fontSize:'1.5rem',filter:'grayscale(1)'}}>{a.icon}</span>
              <div><div style={{fontWeight:700,fontSize:'0.8rem',color:'#aaa'}}>{a.title}</div><div style={{fontSize:'0.65rem',color:'#666'}}>{a.desc}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

