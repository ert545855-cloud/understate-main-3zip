"use strict";
// ═══════════════════════════════════════════════════════
// SALTANAT ONLINE — Resmi Diplomasi
// Saldırmazlık, ittifak, haraç anlaşmaları (sunucu log'lu)
// ═══════════════════════════════════════════════════════

const ANLASMA_TIPLERI = [
  { id:'saldirmazlik', emoji:'🤝', ad:'Saldırmazlık Paktı',  acik:'Her iki taraf birbirine saldıramaz',       sure:7,  maliyet:5000,  renk:'#3E8C5A' },
  { id:'ittifak',      emoji:'⚔️', ad:'Savaş İttifakı',       acik:'Ortak düşmana karşı birlikte savaş',      sure:14, maliyet:20000, renk:'#5B8DD9' },
  { id:'harac',        emoji:'💰', ad:'Haraç Anlaşması',      acik:'Güçsüz taraf haftada 5.000🪙 öder',       sure:30, maliyet:0,     renk:'#B8423C' },
  { id:'ticaret',      emoji:'🛤️', ad:'Ticaret Anlaşması',    acik:'İki beylik arası gelir +10%',             sure:14, maliyet:8000,  renk:'#C89B3C' },
  { id:'savunma',      emoji:'🛡️', ad:'Savunma Paktı',        acik:'Biriniz saldırıya uğrarsa diğeri yardım', sure:21, maliyet:15000, renk:'#9C5FDB' },
];

const LS_DIPLO = 'rep_diplomasi';

// ── Sözleşme Geçmişi bileşeni ───────────────────────────────────────────────
function DiplomasiSozlesmeGecmisi({ profile, showNotif }) {
  const G='#C89B3C', M='#A9A6A0', T='#F5EBD7', S='#2D1800', R='#B8423C', GR='#3E8C5A';
  const token = (() => { try { return localStorage.getItem('rep_token')||''; } catch { return ''; } })();

  const [liste, setListe]   = React.useState([]);
  const [yukleniyor, setYuk]= React.useState(true);

  const yukle = () => {
    setYuk(true);
    fetch('/api/diplomacy/sozlesmeler', { headers:{ Authorization:`Bearer ${token}` } })
      .then(r=>r.json())
      .then(d=>{ if(d.success) setListe(d.sozlesmeler||[]); })
      .catch(()=>{})
      .finally(()=>setYuk(false));
  };

  React.useEffect(()=>{ yukle(); },[]);

  const TUR_EMOJIS = {
    ittifak:'⚔️', ateskes:'☮️', saldirmazlik:'🤝', harac:'💰', ticaret:'🛤️', savunma:'🛡️'
  };

  if (yukleniyor) return React.createElement('div',{style:{textAlign:'center',padding:'40px',color:M}},'⏳ Yükleniyor...');

  return React.createElement('div',null,
    React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontSize:'0.8rem',color:G,fontWeight:700,marginBottom:10}},'📋 SÖZLEŞME GEÇMİŞİ'),
    React.createElement('div',{style:{fontSize:'0.65rem',color:M,marginBottom:12}},'Tüm anlaşmalar ve ihanetler kalıcı olarak kayıtlıdır.'),
    !liste.length
      ? React.createElement('div',{style:{textAlign:'center',padding:'30px',color:M,fontSize:'0.8rem'}},'Henüz kayıtlı sözleşme yok.')
      : React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:6}},
          liste.map(s=>
            React.createElement('div',{key:s.id,style:{
              background:S, border:`1px solid ${s.durum==='bozuldu'?'rgba(184,66,60,0.4)':s.durum==='aktif'?'rgba(62,140,90,0.3)':'rgba(255,255,255,0.07)'}`,
              borderRadius:12, padding:'10px 14px',
            }},
              React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}},
                React.createElement('div',{style:{fontSize:'0.8rem',fontWeight:700,color:T}},
                  `${TUR_EMOJIS[s.tur]||'📜'} ${s.beylik_a_ad} ↔ ${s.beylik_b_ad}`),
                React.createElement('div',{style:{fontSize:'0.62rem',fontWeight:700,color:s.durum==='aktif'?GR:s.durum==='bozuldu'?R:M}},
                  s.durum==='aktif'?'✅ Aktif':s.durum==='bozuldu'?'💔 Bozuldu':'⏰ Süresi Doldu')
              ),
              React.createElement('div',{style:{fontSize:'0.65rem',color:M}},
                `${s.tur.charAt(0).toUpperCase()+s.tur.slice(1)} · ${new Date(s.olusturma_tarihi).toLocaleDateString('tr-TR')}`),
              s.durum==='bozuldu' && s.bozan_beylik_id &&
                React.createElement('div',{style:{fontSize:'0.62rem',color:R,marginTop:4,fontWeight:700}},
                  `⚠️ İhanetkâr: ${s.bozan_beylik_id}  |  İtibar -30`)
            )
          )
        )
  );
}

window.DiplomasiScreen = function DiplomasiScreen({ profile, setProfile, showNotif, setCurrentPage, serverBeyliks }) {
  const [anlasmalar, setAnlasmalar] = React.useState(() => { try { return JSON.parse(localStorage.getItem(LS_DIPLO)||'[]'); } catch { return []; } });
  const [aktifSekme, setAktifSekme] = React.useState('mevcut');
  const [yeniForm, setYeniForm] = React.useState({ tip:'saldirmazlik', hedefBeylik:null });
  const [onayBekle, setOnayBekle] = React.useState(null);

  const uid = profile?.id || profile?.uid;
  const beyliks = Array.isArray(serverBeyliks) ? serverBeyliks : (()=>{ try { return JSON.parse(localStorage.getItem('rep_beyliks')||'[]'); } catch { return []; }})();
  const benimBeylik = beyliks.find(b => b.kurucuId === uid || (b.uyeler||[]).includes(uid));
  const rakipler = beyliks.filter(b => b.id !== benimBeylik?.id);

  // Socket — gelen anlaşma tekliflerini dinle
  React.useEffect(() => {
    const s = window._socket;
    if (!s) return;
    const handler = (d) => {
      if (d.hedefBeylikId !== benimBeylik?.id) return;
      setOnayBekle(d);
      showNotif(`📜 ${d.saldiranBeylikAd} anlaşma teklif etti: ${d.tip}`, 'info', '📜');
    };
    s.on('diplomasi:teklif', handler);
    return () => s.off('diplomasi:teklif', handler);
  }, [benimBeylik?.id]);

  // Süresi dolmuş anlaşmaları temizle
  React.useEffect(() => {
    const guncel = anlasmalar.filter(a => a.bitisTs > Date.now());
    if (guncel.length !== anlasmalar.length) {
      setAnlasmalar(guncel);
      localStorage.setItem(LS_DIPLO, JSON.stringify(guncel));
    }
  }, []);

  function teklifGonder() {
    if (!benimBeylik) { showNotif('Beylik sahibi değilsiniz', 'error'); return; }
    if (!yeniForm.hedefBeylik) { showNotif('Hedef beylik seçin', 'error'); return; }
    const tip = ANLASMA_TIPLERI.find(t => t.id === yeniForm.tip);
    if ((profile?.money||0) < tip.maliyet && tip.maliyet > 0) {
      showNotif(`Yetersiz Sikke — ${tip.maliyet.toLocaleString('tr-TR')} gerekli`, 'error'); return;
    }
    const teklif = {
      id: `diplo_${Date.now()}`,
      tip: tip.id,
      tipAd: tip.ad,
      tipEmoji: tip.emoji,
      saldiranBeylikId: benimBeylik.id,
      saldiranBeylikAd: benimBeylik.ad,
      hedefBeylikId: yeniForm.hedefBeylik.id,
      hedefBeylikAd: yeniForm.hedefBeylik.ad,
      sure: tip.sure,
      ts: Date.now(),
    };
    try { window._socket?.emit('diplomasi:teklif', teklif); } catch(_) {}
    showNotif(`📜 ${yeniForm.hedefBeylik.ad}'na ${tip.ad} teklifi gönderildi`, 'success');
  }

  function onaylaAnlasma(teklif) {
    const tip = ANLASMA_TIPLERI.find(t => t.id === teklif.tip);
    const yeniAnlasma = { ...teklif, durumu:'aktif', baslangicTs: Date.now(), bitisTs: Date.now() + teklif.sure * 86400000 };
    const yeniListe = [...anlasmalar, yeniAnlasma];
    setAnlasmalar(yeniListe);
    localStorage.setItem(LS_DIPLO, JSON.stringify(yeniListe));
    try { window._socket?.emit('diplomasi:onay', { ...yeniAnlasma }); } catch(_) {}
    setOnayBekle(null);
    showNotif(`✅ ${tip.ad} anlaşması imzalandı!`, 'success');
  }

  function iptalEt(anlasmaId) {
    const yeni = anlasmalar.filter(a => a.id !== anlasmaId);
    setAnlasmalar(yeni);
    localStorage.setItem(LS_DIPLO, JSON.stringify(yeni));
    try { window._socket?.emit('diplomasi:iptal', { anlasmaId, beylikId: benimBeylik?.id }); } catch(_) {}
    showNotif('Anlaşma iptal edildi', 'info');
  }

  function kalanGun(bitisTs) {
    const fark = bitisTs - Date.now();
    if (fark <= 0) return 'Süresi Doldu';
    return `${Math.ceil(fark/86400000)} gün`;
  }

  const G='#C89B3C', BG='#0F0800', T='#F5EBD7', M='#A9A6A0';

  return React.createElement('div', { style:{minHeight:'100vh',background:BG,fontFamily:"'Inter',sans-serif",paddingBottom:90} },
    React.createElement('div', { style:{background:'linear-gradient(135deg,#1a1000,#2d1e00)',borderBottom:'1px solid rgba(200,155,60,0.25)',padding:'14px 16px'} },
      React.createElement('div', { style:{display:'flex',alignItems:'center',gap:10,marginBottom:10} },
        React.createElement('button', { onClick:()=>setCurrentPage('home'), style:{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'6px 10px',color:M,fontSize:'0.75rem',cursor:'pointer'} }, '← Geri'),
        React.createElement('span', { style:{fontSize:'1.4rem'} }, '🤝'),
        React.createElement('div', null,
          React.createElement('div', { style:{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:'1.1rem',color:G} }, 'Resmi Diplomasi'),
          React.createElement('div', { style:{fontSize:'0.62rem',color:M} }, 'Antlaşma — İttifak — Haraç')
        )
      ),
      React.createElement('div', { style:{display:'flex',gap:4} },
        [['mevcut','📜 Anlaşmalar'],['yeni','✍️ Teklif Et'],['gecmis','📋 Geçmiş']].map(([id,lb])=>
          React.createElement('button', { key:id, onClick:()=>setAktifSekme(id),
            style:{flex:1,padding:'7px 4px',borderRadius:10,border:`1px solid ${aktifSekme===id?G:'rgba(255,255,255,0.08)'}`,background:aktifSekme===id?'rgba(200,155,60,0.15)':'rgba(255,255,255,0.03)',color:aktifSekme===id?G:M,fontWeight:700,fontSize:'0.68rem',cursor:'pointer'} }, lb)
        )
      )
    ),

    React.createElement('div', { style:{padding:'12px'} },
      // Onay bekleyen teklif
      onayBekle && React.createElement('div', { style:{background:'rgba(200,155,60,0.1)',border:'2px solid rgba(200,155,60,0.4)',borderRadius:14,padding:'14px',marginBottom:14} },
        React.createElement('div', { style:{fontFamily:"'Cinzel',serif",fontSize:'0.85rem',fontWeight:800,color:G,marginBottom:6} }, '📜 Gelen Teklif!'),
        React.createElement('div', { style:{fontSize:'0.78rem',color:T,marginBottom:4} },
          `${onayBekle.saldiranBeylikAd} → ${ANLASMA_TIPLERI.find(t=>t.id===onayBekle.tip)?.ad||onayBekle.tip}`),
        React.createElement('div', { style:{display:'flex',gap:8,marginTop:10} },
          React.createElement('button', { onClick:()=>onaylaAnlasma(onayBekle), style:{flex:1,background:'#3E8C5A',border:'none',borderRadius:10,padding:'9px',color:'#fff',fontWeight:800,fontSize:'0.75rem',cursor:'pointer'} }, '✅ Kabul Et'),
          React.createElement('button', { onClick:()=>setOnayBekle(null), style:{flex:1,background:'rgba(184,66,60,0.15)',border:'1px solid rgba(184,66,60,0.4)',borderRadius:10,padding:'9px',color:'#B8423C',fontWeight:800,fontSize:'0.75rem',cursor:'pointer'} }, '❌ Reddet')
        )
      ),

      aktifSekme === 'mevcut' && React.createElement('div', null,
        anlasmalar.length === 0
          ? React.createElement('div', { style:{textAlign:'center',padding:'50px 20px',color:M,fontSize:'0.8rem'} }, 'Aktif anlaşma yok')
          : anlasmalar.map(a => {
              const tip = ANLASMA_TIPLERI.find(t=>t.id===a.tip);
              return React.createElement('div', { key:a.id,
                style:{background:'rgba(27,33,43,0.7)',border:`1px solid ${tip?.renk||G}33`,borderLeft:`3px solid ${tip?.renk||G}`,borderRadius:10,padding:'12px',marginBottom:8} },
                React.createElement('div', { style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4} },
                  React.createElement('div', { style:{display:'flex',alignItems:'center',gap:6} },
                    React.createElement('span', { style:{fontSize:'1.1rem'} }, tip?.emoji||'📜'),
                    React.createElement('span', { style:{fontSize:'0.82rem',fontWeight:700,color:T} }, tip?.ad||a.tip)
                  ),
                  React.createElement('span', { style:{fontSize:'0.62rem',color:M} }, kalanGun(a.bitisTs))
                ),
                React.createElement('div', { style:{fontSize:'0.68rem',color:M,marginBottom:8} }, `${a.saldiranBeylikAd} ↔ ${a.hedefBeylikAd}`),
                React.createElement('button', { onClick:()=>iptalEt(a.id), style:{padding:'4px 10px',borderRadius:8,border:'1px solid rgba(184,66,60,0.3)',background:'rgba(184,66,60,0.08)',color:'#B8423C',fontSize:'0.62rem',cursor:'pointer'} }, 'İptal Et')
              );
            })
      ),

      aktifSekme === 'yeni' && React.createElement('div', null,
        !benimBeylik
          ? React.createElement('div', { style:{textAlign:'center',padding:'40px',color:M,fontSize:'0.8rem'} }, 'Beylik sahibi olmalısınız')
          : React.createElement('div', null,
              React.createElement('div', { style:{fontFamily:"'Cinzel',serif",fontSize:'0.8rem',color:G,fontWeight:700,marginBottom:8} }, '✍️ Anlaşma Türü'),
              React.createElement('div', { style:{display:'flex',flexDirection:'column',gap:6,marginBottom:14} },
                ANLASMA_TIPLERI.map(tip =>
                  React.createElement('div', { key:tip.id, onClick:()=>setYeniForm(f=>({...f,tip:tip.id})),
                    style:{display:'flex',alignItems:'center',gap:10,background:yeniForm.tip===tip.id?`${tip.renk}15`:'rgba(27,33,43,0.7)',border:`1px solid ${yeniForm.tip===tip.id?tip.renk:'rgba(255,255,255,0.07)'}`,borderRadius:10,padding:'10px 12px',cursor:'pointer'} },
                    React.createElement('span', { style:{fontSize:'1.2rem'} }, tip.emoji),
                    React.createElement('div', { style:{flex:1} },
                      React.createElement('div', { style:{fontSize:'0.78rem',fontWeight:700,color:T} }, tip.ad),
                      React.createElement('div', { style:{fontSize:'0.62rem',color:M,marginTop:2} }, `${tip.acik} · ${tip.sure} gün · ${tip.maliyet?`🪙${tip.maliyet.toLocaleString('tr-TR')}`:'Ücretsiz'}`)
                    ),
                    yeniForm.tip===tip.id && React.createElement('div', { style:{width:16,height:16,borderRadius:'50%',background:tip.renk,flexShrink:0} })
                  )
                )
              ),
              React.createElement('div', { style:{fontFamily:"'Cinzel',serif",fontSize:'0.8rem',color:G,fontWeight:700,marginBottom:8} }, '🎯 Hedef Beylik'),
              React.createElement('div', { style:{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14} },
                rakipler.length===0
                  ? React.createElement('div', { style:{color:M,fontSize:'0.75rem'} }, 'Rakip beylik yok')
                  : rakipler.map(b =>
                      React.createElement('button', { key:b.id, onClick:()=>setYeniForm(f=>({...f,hedefBeylik:yeniForm.hedefBeylik?.id===b.id?null:b})),
                        style:{padding:'6px 12px',borderRadius:20,border:`1px solid ${yeniForm.hedefBeylik?.id===b.id?G:'rgba(255,255,255,0.1)'}`,background:yeniForm.hedefBeylik?.id===b.id?'rgba(200,155,60,0.15)':'rgba(255,255,255,0.03)',color:yeniForm.hedefBeylik?.id===b.id?G:M,fontSize:'0.7rem',fontWeight:700,cursor:'pointer'} },
                        `⚜️ ${b.ad}`)
                    )
              ),
              React.createElement('button', { onClick:teklifGonder, disabled:!yeniForm.hedefBeylik,
                style:{width:'100%',padding:'12px',borderRadius:12,border:'none',background:yeniForm.hedefBeylik?G:'rgba(255,255,255,0.06)',color:yeniForm.hedefBeylik?'#0F0800':M,fontWeight:800,fontSize:'0.82rem',cursor:yeniForm.hedefBeylik?'pointer':'not-allowed'} },
                '📜 Teklif Gönder')
            )
      ),

      aktifSekme === 'gecmis' && React.createElement(DiplomasiSozlesmeGecmisi, { profile, showNotif })
    )
  );
};
