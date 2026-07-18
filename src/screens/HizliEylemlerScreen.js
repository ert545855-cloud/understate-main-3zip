// ═══════════════════════════════════════════════════════════════
// SALTANAT ONLINE — Hızlı Eylemler Merkezi
// Para transfer · Özellik özeti · Anlık istatistikler
// ═══════════════════════════════════════════════════════════════
window.HizliEylemlerScreen = function HizliEylemlerScreen({ profile, onNavigate, showNotif }) {
  const G='#C89B3C', BG='#0F0800', T='#F5EBD7', M='#A9A6A0', S='#2D1800', GR='#3E8C5A', R='#B8423C';
  const jwt = () => localStorage.getItem('us_jwt') || '';

  const [transferTab, setTransferTab] = React.useState(false);
  const [toUser,  setToUser]  = React.useState('');
  const [amount,  setAmount]  = React.useState('');
  const [note,    setNote]    = React.useState('');
  const [sending, setSending] = React.useState(false);

  const sendTransfer = async () => {
    if (!toUser.trim() || !amount) { showNotif && showNotif('Kullanıcı adı ve miktar girin', 'error'); return; }
    setSending(true);
    try {
      const r = await fetch('/api/transfer/send', {
        method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+jwt() },
        body: JSON.stringify({ to_username: toUser.trim(), amount: parseInt(amount), note })
      });
      const d = await r.json();
      if (d.success) {
        showNotif && showNotif(`✅ 🪙${parseInt(amount).toLocaleString('tr-TR')} → ${toUser} gönderildi`, 'success');
        setTransferTab(false); setToUser(''); setAmount(''); setNote('');
      } else showNotif && showNotif(d.message || 'Hata', 'error');
    } catch { showNotif && showNotif('Bağlantı hatası', 'error'); }
    setSending(false);
  };

  const eylemler = [
    { id:'fal_carki',   emoji:'🎡', label:'Fal Çarkı',       desc:'Günde 1 bedava çevirme', color:'#A78BFA' },
    { id:'gunluk_gorev',emoji:'📋', label:'Günlük Görevler', desc:'Günlük ödüller kazan',   color:G         },
    { id:'zanaat',      emoji:'⚒️', label:'Zanaat',          desc:'Üretim yap, usta ol',    color:GR        },
    { id:'casus_chain', emoji:'🕵️', label:'Casus Zinciri',   desc:'3 aşamalı görev',        color:R         },
    { id:'kervan_koruma',emoji:'🐪',label:'Kervan Koru',     desc:'Sikke kazan yolda',      color:'#F97316' },
    { id:'sezon',       emoji:'🏅', label:'Sezon',           desc:'Sıralama ve ödüller',    color:'#60A5FA' },
    { id:'achievements',emoji:'🎖️', label:'Başarılar',       desc:'Rozetleri topla',        color:'#E8C06A' },
    { id:'itibar',      emoji:'⭐', label:'İtibar',          desc:'Şöhretini artır',        color:'#F9A825' },
    { id:'lonca_anlasma',emoji:'🤝',label:'Lonca Anlaşma',  desc:'Ticaret yap',            color:GR        },
    { id:'pazar_etkinlik',emoji:'🎪',label:'Pazar Etkinliği',desc:'Özel fırsatlar',         color:'#F97316' },
  ];

  // Güç hesaplama
  const guç = (profile?.level||1)*10 + (profile?.weapons||0)*5 + (profile?.ammo||0)*3;
  const stats = [
    { icon:'⚔️', val: guç,                           lbl:'Güç'      },
    { icon:'💰', val: (profile?.money||0).toLocaleString('tr-TR'), lbl:'Sikke' },
    { icon:'⚜️', val: profile?.altin||0,              lbl:'Altın'    },
    { icon:'⭐', val: profile?.xp||0,                 lbl:'XP'       },
    { icon:'🏆', val: profile?.level||1,              lbl:'Seviye'   },
    { icon:'💎', val: profile?.merit_points||0,       lbl:'Liyakat'  },
  ];

  return React.createElement('div', { style:{ minHeight:'100vh', background:BG, fontFamily:"'Inter',sans-serif", paddingBottom:80 }},

    // Header
    React.createElement('div', { style:{ background:'linear-gradient(135deg,#0f0800,#2a1500)', borderBottom:'1px solid rgba(200,155,60,0.2)', padding:'14px 16px' }},
      React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between' }},
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:10 }},
          onNavigate && React.createElement('button', { onClick:()=>onNavigate('home'),
            style:{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'6px 10px', color:M, fontSize:'0.75rem', cursor:'pointer' }}, '← Geri'),
          React.createElement('span', { style:{ fontSize:'1.5rem' }}, '⚡'),
          React.createElement('div', null,
            React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontWeight:900, fontSize:'1.1rem', color:G }}, 'Hızlı Merkez'),
            React.createElement('div', { style:{ fontSize:'0.62rem', color:M }}, profile?.username || '')
          )
        ),
        React.createElement('button', { onClick:()=>setTransferTab(p=>!p),
          style:{ background:G, color:'#0F0800', border:'none', borderRadius:9, padding:'8px 14px', fontWeight:700, fontSize:'0.75rem', cursor:'pointer' }},
          '💸 Transfer')
      )
    ),

    React.createElement('div', { style:{ padding:'12px' }},

      // Transfer formu (açılır)
      transferTab && React.createElement('div', { style:{ background:S, borderRadius:14, padding:'16px', marginBottom:14, border:`1px solid ${G}33` }},
        React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'0.9rem', color:G, fontWeight:800, marginBottom:12 }}, '💸 Hızlı Para Transferi'),
        React.createElement('input', { type:'text', placeholder:'Oyuncu adı (username)', value:toUser, onChange:e=>setToUser(e.target.value),
          style:{ width:'100%', padding:'10px', borderRadius:9, border:'1px solid rgba(200,155,60,0.25)', background:'#1A0E00', color:T, fontSize:'0.85rem', marginBottom:8, boxSizing:'border-box' }}),
        React.createElement('input', { type:'number', placeholder:'Miktar (🪙 Sikke)', value:amount, onChange:e=>setAmount(e.target.value),
          style:{ width:'100%', padding:'10px', borderRadius:9, border:'1px solid rgba(200,155,60,0.25)', background:'#1A0E00', color:T, fontSize:'0.85rem', marginBottom:8, boxSizing:'border-box' }}),
        React.createElement('input', { type:'text', placeholder:'Not (isteğe bağlı)', value:note, onChange:e=>setNote(e.target.value),
          style:{ width:'100%', padding:'10px', borderRadius:9, border:'1px solid rgba(200,155,60,0.25)', background:'#1A0E00', color:T, fontSize:'0.85rem', marginBottom:10, boxSizing:'border-box' }}),
        React.createElement('div', { style:{ display:'flex', gap:6 }},
          React.createElement('button', { onClick:()=>setTransferTab(false),
            style:{ flex:1, padding:'9px', borderRadius:9, border:`1px solid ${G}44`, background:'transparent', color:M, cursor:'pointer' }}, 'İptal'),
          React.createElement('button', { onClick:sendTransfer, disabled:sending,
            style:{ flex:2, padding:'9px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${G},#A07828)`, color:'#0F0800', fontWeight:700, cursor:'pointer' }},
            sending ? '⏳ Gönderiliyor…' : '💸 Gönder')
        )
      ),

      // İstatistik ızgarası
      React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }},
        stats.map(s => React.createElement('div', { key:s.lbl, style:{
          background:S, borderRadius:12, padding:'10px 6px', textAlign:'center',
          border:'1px solid rgba(200,155,60,0.15)'
        }},
          React.createElement('div', { style:{ fontSize:'1.1rem', marginBottom:3 }}, s.icon),
          React.createElement('div', { style:{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.82rem', fontWeight:800, color:G }}, s.val),
          React.createElement('div', { style:{ fontSize:'0.58rem', color:M, textTransform:'uppercase', letterSpacing:'0.06em' }}, s.lbl)
        ))
      ),

      // Hızlı eylem karoları
      React.createElement('div', { style:{ fontFamily:"'Cinzel',serif", fontSize:'0.75rem', color:G, fontWeight:700, marginBottom:10 }}, '⚡ Hızlı Erişim'),
      React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }},
        eylemler.map(e => React.createElement('button', { key:e.id, onClick:()=>onNavigate && onNavigate(e.id),
          style:{ background:S, border:`1px solid rgba(255,255,255,0.07)`, borderRadius:12, padding:'12px',
            cursor:'pointer', textAlign:'left', transition:'border-color 0.2s, transform 0.1s' },
          onMouseEnter:ev=>{ev.currentTarget.style.borderColor=e.color+'44';ev.currentTarget.style.transform='translateY(-1px)'},
          onMouseLeave:ev=>{ev.currentTarget.style.borderColor='rgba(255,255,255,0.07)';ev.currentTarget.style.transform='none'} },
          React.createElement('div', { style:{ fontSize:'1.4rem', marginBottom:4 }}, e.emoji),
          React.createElement('div', { style:{ fontWeight:700, fontSize:'0.82rem', color:T, marginBottom:2 }}, e.label),
          React.createElement('div', { style:{ fontSize:'0.62rem', color:M, lineHeight:1.3 }}, e.desc)
        ))
      )
    )
  );
};
