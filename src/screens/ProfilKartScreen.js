window.ProfilKartScreen = function({ profile, onNavigate }) {
  const G='#C89B3C',BG='#0F0800',T='#F5EBD7',M='#A9A6A0',S='#2D1800',GR='#3E8C5A',R='#B8423C',P='#A78BFA';
  const [copied, setCopied] = React.useState(false);
  const lv = profile?.level||1;
  const streak = (() => { try { return JSON.parse(localStorage.getItem('rep_loginStreak')||'{}').count||0; } catch { return 0; } })();
  const skills = (() => { try { return Object.keys(JSON.parse(localStorage.getItem('rep_skills')||'{}')).length; } catch { return 0; } })();
  const title = profile?.active_title||'Yolcu';
  const pwr = lv*10 + (profile?.weapons||0)*5 + (profile?.ammo||0)*3;

  const LEVEL_TITLES = {1:'🚶',5:'⚔️',10:'🛒',15:'🕌',20:'👑',25:'🐎',35:'🪖',50:'🎖️',70:'⚜️',99:'🌟'};
  const avatar = Object.entries(LEVEL_TITLES).reverse().find(([l])=>lv>=parseInt(l))?.[1]||'🚶';

  const shareText = `🌙 SALTANAT ONLİNE — Profil Kartım\n👤 ${profile?.username||'Oyuncu'}\n🎖️ ${title}\n⭐ Seviye ${lv}\n⚡ Güç: ${pwr}\n💰 ${((profile?.money||0)).toLocaleString('tr-TR')} Sikke\n🔥 ${streak} Gün Seri\n\nSen de katıl!`;

  const copy = () => {
    navigator.clipboard.writeText(shareText).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}).catch(()=>{});
  };

  const STATS = [
    {emoji:'⭐',label:'Seviye',value:lv,color:G},
    {emoji:'⚡',label:'Güç',value:pwr,color:R},
    {emoji:'💰',label:'Sikke',value:((profile?.money||0)).toLocaleString('tr-TR'),color:G},
    {emoji:'🔥',label:'Seri',value:streak+'g',color:R},
    {emoji:'🌳',label:'Yetenek',value:skills,color:GR},
    {emoji:'💎',label:'Liyakat',value:profile?.merit_points||0,color:P},
  ];

  return React.createElement('div',{style:{minHeight:'100vh',background:BG,fontFamily:"'Inter',sans-serif",paddingBottom:80}},
    React.createElement('div',{style:{background:'linear-gradient(135deg,#1a0800,#2d1600)',borderBottom:'1px solid rgba(200,155,60,0.2)',padding:'14px 16px'}},
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:10}},
        onNavigate&&React.createElement('button',{onClick:()=>onNavigate('home'),style:{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'6px 10px',color:M,fontSize:'0.75rem',cursor:'pointer'}},'← Geri'),
        React.createElement('span',{style:{fontSize:'1.5rem'}},'📸'),
        React.createElement('div',null,
          React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:'1.1rem',color:G}},'Profil Kartı'),
          React.createElement('div',{style:{fontSize:'0.62rem',color:M}},'Sosyal medyada paylaş')
        )
      )
    ),
    React.createElement('div',{style:{padding:'16px'}},
      // Kart
      React.createElement('div',{style:{
        background:`linear-gradient(135deg,#1A0E00 0%,#2D1800 40%,#1A0E00 100%)`,
        border:`2px solid ${G}55`,borderRadius:20,padding:'24px',marginBottom:16,
        position:'relative',overflow:'hidden',
        boxShadow:`0 8px 40px rgba(200,155,60,0.25), 0 0 0 1px rgba(200,155,60,0.1)`
      }},
        // Decorative pattern
        React.createElement('div',{style:{position:'absolute',top:-30,right:-30,fontSize:'8rem',opacity:0.04,pointerEvents:'none'}},'⚜️'),
        React.createElement('div',{style:{position:'absolute',bottom:-20,left:-20,fontSize:'6rem',opacity:0.04,pointerEvents:'none'}},'🌙'),
        // Header
        React.createElement('div',{style:{display:'flex',alignItems:'center',gap:16,marginBottom:20}},
          React.createElement('div',{style:{width:64,height:64,borderRadius:'50%',background:`linear-gradient(135deg,${G},#6B4C00)`,border:`3px solid ${G}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2rem',boxShadow:`0 4px 16px rgba(200,155,60,0.4)`}},avatar),
          React.createElement('div',null,
            React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:'1.4rem',color:G}},profile?.username||'Oyuncu'),
            React.createElement('div',{style:{fontSize:'0.75rem',color:T,marginTop:2}},`🎖️ ${title}`),
            React.createElement('div',{style:{fontSize:'0.62rem',color:M,marginTop:2}},'SALTANAT ONLİNE')
          )
        ),
        // Stats grid
        React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}},
          STATS.map(s=>React.createElement('div',{key:s.label,style:{background:'rgba(0,0,0,0.3)',borderRadius:12,padding:'10px 6px',textAlign:'center',border:`1px solid ${s.color}22`}},
            React.createElement('div',{style:{fontSize:'1rem',marginBottom:2}},s.emoji),
            React.createElement('div',{style:{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.85rem',fontWeight:900,color:s.color}},s.value),
            React.createElement('div',{style:{fontSize:'0.55rem',color:M,textTransform:'uppercase',letterSpacing:'0.06em'}},s.label)
          ))
        ),
        // Footer
        React.createElement('div',{style:{borderTop:`1px solid ${G}22`,paddingTop:12,display:'flex',justifyContent:'space-between',alignItems:'center'}},
          React.createElement('div',{style:{fontSize:'0.6rem',color:M}},'saltanat.online'),
          React.createElement('div',{style:{fontSize:'0.6rem',color:G,fontWeight:700}},`🌙 ${new Date().toLocaleDateString('tr-TR')}`)
        )
      ),
      // Paylaş metni
      React.createElement('div',{style:{background:S,borderRadius:14,padding:'14px',marginBottom:12,border:'1px solid rgba(200,155,60,0.15)'}},
        React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontSize:'0.72rem',color:G,fontWeight:700,marginBottom:8}},'📋 Paylaşım Metni'),
        React.createElement('pre',{style:{fontSize:'0.72rem',color:M,lineHeight:1.6,whiteSpace:'pre-wrap',margin:0}},shareText)
      ),
      // Butonlar
      React.createElement('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}},
        React.createElement('button',{onClick:copy,style:{padding:'12px',borderRadius:12,border:'none',background:copied?GR:`linear-gradient(135deg,${G},#A07828)`,color:'#0F0800',fontWeight:800,fontSize:'0.85rem',cursor:'pointer',transition:'all 0.2s'}},copied?'✅ Kopyalandı!':'📋 Metni Kopyala'),
        React.createElement('button',{onClick:()=>{const url=`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;window.open(url,'_blank');},style:{padding:'12px',borderRadius:12,border:`1px solid rgba(255,255,255,0.15)`,background:'rgba(255,255,255,0.06)',color:T,fontWeight:700,fontSize:'0.85rem',cursor:'pointer'}},
          '🐦 Twitter/X\'te Paylaş')
      ),
      // Kozmetik butonu
      React.createElement('div',{style:{marginTop:8}},
        React.createElement('button',{onClick:()=>onNavigate&&onNavigate('_kozmetik_modal_'+Date.now()),
          style:{width:'100%',padding:'12px',borderRadius:12,border:`1px solid rgba(200,155,60,0.3)`,background:'rgba(200,155,60,0.08)',color:G,fontWeight:700,fontSize:'0.82rem',cursor:'pointer'},
          onClick:()=>{
            const tok=localStorage.getItem('rep_token')||'';
            fetch('/api/cosmetics/liste',{headers:{Authorization:`Bearer ${tok}`}})
              .then(r=>r.json())
              .then(d=>{
                if(!d.success) return;
                const modal=document.createElement('div');
                modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
                modal.innerHTML=`<div style="background:#1A0E00;border:1px solid rgba(200,155,60,0.3);border-radius:16px;padding:20px;max-width:400px;width:100%;max-height:80vh;overflow-y:auto">
                  <div style="font-family:'Cinzel',serif;font-size:1rem;font-weight:800;color:#C89B3C;margin-bottom:12px">🎨 KOZMETİK MAĞAZA</div>
                  <div style="font-size:0.68rem;color:#A9A6A0;margin-bottom:14px">Görsel özelleştirmeler — rekabete etkisi yoktur</div>
                  ${(d.liste||[]).map(k=>`
                    <div style="display:flex;align-items:center;justify-content:space-between;background:#2D1800;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px 12px;margin-bottom:6px">
                      <div>
                        <div style="font-size:0.82rem;font-weight:700;color:#F5EBD7">${k.emoji} ${k.ad}</div>
                        <div style="font-size:0.62rem;color:#A9A6A0;margin-top:2px">${k.aciklama}</div>
                      </div>
                      <button onclick="(async()=>{
                        if(${k.sahipMi}){this.disabled=true;return;}
                        this.textContent='...';
                        const r=await fetch('/api/cosmetics/satin-al',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+localStorage.getItem('rep_token')},body:JSON.stringify({kozmetikId:'${k.id}'})});
                        const dd=await r.json();
                        alert(dd.message||dd.error||'Hata');
                        document.body.removeChild(document.body.querySelector('[data-kozm]'));
                      })()" style="padding:6px 12px;border-radius:8px;border:none;background:${k.sahipMi?'rgba(62,140,90,0.2)':'rgba(200,155,60,0.85)'};color:${k.sahipMi?'#3E8C5A':'#0F0800'};font-weight:700;font-size:0.7rem;cursor:pointer;white-space:nowrap">${k.sahipMi?'✅ Sahip':k.maliyet.toLocaleString('tr-TR')+' 🪙'}</button>
                    </div>`).join('')}
                  <button onclick="document.body.removeChild(this.closest('[data-kozm]')||this.parentNode.parentNode)" style="width:100%;padding:10px;border-radius:10px;border:none;background:rgba(255,255,255,0.06);color:#A9A6A0;font-weight:700;cursor:pointer;margin-top:8px">Kapat</button>
                </div>`;
                modal.setAttribute('data-kozm','1');
                modal.addEventListener('click',e=>{if(e.target===modal)document.body.removeChild(modal);});
                document.body.appendChild(modal);
              }).catch(()=>alert('Kozmetik yüklenemedi'));
          }
        },'🎨 Kozmetik Mağaza')
      )
    )
  );
};
