"use strict";
// ═══════════════════════════════════════════════════════
// SALTANAT ONLINE — Eyalet İnşaatı
// Vali olduğun eyalete kışla/sur/pazar/cami inşa et
// ═══════════════════════════════════════════════════════

const BINA_TIPLERI = [
  { id:'sur',     emoji:'🏰', ad:'Burç ve Sur',     acik:'Eyalet savunmasını +25% artırır',       maliyet:{ sikke:50000,  sure:7200  }, seviye:1, maksLevel:5, bonus:'savunma+25%/sev' },
  { id:'kisla',   emoji:'⚔️', ad:'Kışla',            acik:'Ordu eğitim kapasitesi ve gücü +20%',  maliyet:{ sikke:80000,  sure:14400 }, seviye:1, maksLevel:3, bonus:'ordu+20%/sev' },
  { id:'pazar',   emoji:'🛒', ad:'Çarşı ve Pazar',  acik:'Eyalet vergi gelirini +30% artırır',    maliyet:{ sikke:60000,  sure:10800 }, seviye:1, maksLevel:5, bonus:'gelir+30%/sev' },
  { id:'cami',    emoji:'🕌', ad:'Cami ve Medrese', acik:'Sadakat puanı kazanımı +10%',           maliyet:{ sikke:40000,  sure:5400  }, seviye:1, maksLevel:3, bonus:'sadakat+10%/sev' },
  { id:'tersane', emoji:'⚓', ad:'Tersane',          acik:'Deniz ticaret geliri +40%',             maliyet:{ sikke:120000, sure:28800 }, seviye:1, maksLevel:2, bonus:'denizGelir+40%/sev' },
  { id:'saraychı',emoji:'🏛️', ad:'Küçük Saray',     acik:'Beylik prestiji +100/gün',              maliyet:{ sikke:200000, sure:43200 }, seviye:1, maksLevel:1, bonus:'prestij+100/gün' },
];

const LS_INSAAT = 'rep_eyaletInsaat';

window.EyaletInsaatScreen = function EyaletInsaatScreen({ profile, setProfile, showNotif, setCurrentPage, eyaletValiVerisi }) {
  const [insaatlar, setInsaatlar] = React.useState(() => { try { return JSON.parse(localStorage.getItem(LS_INSAAT)||'{}'); } catch { return {}; } });
  const [aktifInsaat, setAktifInsaat] = React.useState([]);
  const [secilenEyalet, setSecilenEyalet] = React.useState(null);
  const [detay, setDetay] = React.useState(null);

  const uid = profile?.id || profile?.uid;
  const valiVerisi = eyaletValiVerisi || (() => { try { return JSON.parse(localStorage.getItem('rep_valiVerisi')||'{}'); } catch { return {}; }})();
  const benimsEyaletler = Object.entries(valiVerisi).filter(([,v]) => v.valiId === uid).map(([id]) => id);

  React.useEffect(() => {
    // Tamamlanan inşaatları kontrol et
    const iv = setInterval(() => {
      const now = Date.now();
      const aktif = JSON.parse(localStorage.getItem('rep_aktifInsaat')||'[]');
      const biten = aktif.filter(i => i.bitisTs <= now);
      if (biten.length > 0) {
        biten.forEach(i => {
          showNotif(`🏗️ ${i.binaAd} tamamlandı! (${i.eyaletId})`, 'success');
          const guncel = JSON.parse(localStorage.getItem(LS_INSAAT)||'{}');
          if (!guncel[i.eyaletId]) guncel[i.eyaletId] = {};
          guncel[i.eyaletId][i.binaId] = (guncel[i.eyaletId][i.binaId]||0) + 1;
          localStorage.setItem(LS_INSAAT, JSON.stringify(guncel));
          setInsaatlar({ ...guncel });
          try { window._socket?.emit('eyaletInsaat:tamamlandi', { eyaletId: i.eyaletId, binaId: i.binaId, valiId: uid }); } catch(_) {}
        });
        const kalanlar = aktif.filter(i => i.bitisTs > now);
        localStorage.setItem('rep_aktifInsaat', JSON.stringify(kalanlar));
        setAktifInsaat(kalanlar);
      } else {
        setAktifInsaat(aktif);
      }
    }, 5000);
    setAktifInsaat(JSON.parse(localStorage.getItem('rep_aktifInsaat')||'[]'));
    return () => clearInterval(iv);
  }, []);

  function insa(bina, eyaletId) {
    if ((profile?.money||0) < bina.maliyet.sikke) { showNotif(`Yetersiz Sikke — ${bina.maliyet.sikke.toLocaleString('tr-TR')} gerekli`, 'error'); return; }
    const mevcutSev = insaatlar[eyaletId]?.[bina.id] || 0;
    if (mevcutSev >= bina.maksLevel) { showNotif('Maksimum seviyeye ulaşıldı!', 'error'); return; }
    const simdikAktif = JSON.parse(localStorage.getItem('rep_aktifInsaat')||'[]');
    if (simdikAktif.find(i => i.eyaletId === eyaletId && i.binaId === bina.id)) {
      showNotif('Bu bina zaten inşaatta', 'error'); return;
    }
    const np = { ...profile, money: (profile.money||0) - bina.maliyet.sikke };
    setProfile(np);
    localStorage.setItem('rep_userProfile', JSON.stringify(np));

    const yeniInsaat = { id:`ins_${Date.now()}`, eyaletId, binaId: bina.id, binaAd: bina.ad, binaEmoji: bina.emoji, baslangicTs: Date.now(), bitisTs: Date.now() + bina.maliyet.sure * 1000, hedefSev: mevcutSev + 1 };
    const yeniAktif = [...simdikAktif, yeniInsaat];
    localStorage.setItem('rep_aktifInsaat', JSON.stringify(yeniAktif));
    setAktifInsaat(yeniAktif);
    try { window._socket?.emit('eyaletInsaat:baslat', { eyaletId, binaId: bina.id, valiId: uid, bitisTs: yeniInsaat.bitisTs }); } catch(_) {}
    showNotif(`🏗️ ${bina.ad} inşaatı başladı!`, 'success');
    setDetay(null);
  }

  function kalanSure(bitisTs) {
    const fark = bitisTs - Date.now();
    if (fark <= 0) return 'Tamamlanıyor...';
    const s = Math.floor(fark/1000);
    if (s < 3600) return `${Math.floor(s/60)}dk ${s%60}sn`;
    return `${Math.floor(s/3600)}s ${Math.floor((s%3600)/60)}dk`;
  }

  const G='#C89B3C', BG='#0F0800', T='#F5EBD7', M='#A9A6A0';

  return React.createElement('div', { style:{minHeight:'100vh',background:BG,fontFamily:"'Inter',sans-serif",paddingBottom:90} },
    React.createElement('div', { style:{background:'linear-gradient(135deg,#1a1000,#2d1e00)',borderBottom:'1px solid rgba(200,155,60,0.25)',padding:'14px 16px'} },
      React.createElement('div', { style:{display:'flex',alignItems:'center',gap:10} },
        React.createElement('button', { onClick:()=>setCurrentPage('home'), style:{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'6px 10px',color:M,fontSize:'0.75rem',cursor:'pointer'} }, '← Geri'),
        React.createElement('span', { style:{fontSize:'1.4rem'} }, '🏗️'),
        React.createElement('div', null,
          React.createElement('div', { style:{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:'1.1rem',color:G} }, 'Eyalet İnşaatı'),
          React.createElement('div', { style:{fontSize:'0.62rem',color:M} }, 'Valilik ettiğin eyaletleri geliştir')
        )
      )
    ),

    React.createElement('div', { style:{padding:'12px'} },
      benimsEyaletler.length === 0
        ? React.createElement('div', { style:{textAlign:'center',padding:'60px 20px'} },
            React.createElement('div', { style:{fontSize:'3rem',marginBottom:12} }, '🏰'),
            React.createElement('div', { style:{fontFamily:"'Cinzel',serif",fontSize:'1.1rem',color:T,marginBottom:8} }, 'Eyalet Valisi Değilsiniz'),
            React.createElement('div', { style:{fontSize:'0.78rem',color:M,lineHeight:1.6,marginBottom:16} }, 'İnşaat yapabilmek için önce bir eyalette vali olmanız gerekiyor.'),
            React.createElement('button', { onClick:()=>setCurrentPage('eyalet_liste'), style:{background:G,border:'none',borderRadius:10,padding:'10px 20px',color:'#0F0800',fontWeight:800,fontSize:'0.8rem',cursor:'pointer'} }, '🏰 Eyaletlere Git')
          )
        : React.createElement('div', null,
            // Aktif inşaatlar
            aktifInsaat.length > 0 && React.createElement('div', { style:{marginBottom:14} },
              React.createElement('div', { style:{fontSize:'0.65rem',color:G,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6} }, '⏳ İnşaat Devam Ediyor'),
              aktifInsaat.map(ins => {
                const kalan = ins.bitisTs - Date.now();
                const toplam = ins.bitisTs - ins.baslangicTs;
                const ilerleme = Math.max(0, Math.min(100, ((toplam-kalan)/toplam)*100));
                return React.createElement('div', { key:ins.id, style:{background:'rgba(200,155,60,0.06)',border:'1px solid rgba(200,155,60,0.2)',borderRadius:10,padding:'10px 12px',marginBottom:6} },
                  React.createElement('div', { style:{display:'flex',justifyContent:'space-between',marginBottom:4} },
                    React.createElement('span', { style:{fontSize:'0.78rem',fontWeight:700,color:T} }, `${ins.binaEmoji} ${ins.binaAd} — ${ins.eyaletId}`),
                    React.createElement('span', { style:{fontSize:'0.68rem',color:G,fontFamily:"'JetBrains Mono',monospace"} }, kalanSure(ins.bitisTs))
                  ),
                  React.createElement('div', { style:{height:4,background:'rgba(255,255,255,0.06)',borderRadius:4,overflow:'hidden'} },
                    React.createElement('div', { style:{height:'100%',width:`${ilerleme}%`,background:G,borderRadius:4} }))
                );
              })
            ),

            // Eyalet seçimi
            React.createElement('div', { style:{marginBottom:12} },
              React.createElement('div', { style:{fontSize:'0.65rem',color:G,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6} }, '🏰 Eyaletin'),
              React.createElement('div', { style:{display:'flex',gap:6,flexWrap:'wrap'} },
                benimsEyaletler.map(eId =>
                  React.createElement('button', { key:eId, onClick:()=>setSecilenEyalet(secilenEyalet===eId?null:eId),
                    style:{padding:'7px 14px',borderRadius:20,border:`1px solid ${secilenEyalet===eId?G:'rgba(255,255,255,0.1)'}`,background:secilenEyalet===eId?'rgba(200,155,60,0.15)':'rgba(255,255,255,0.03)',color:secilenEyalet===eId?G:M,fontSize:'0.72rem',fontWeight:700,cursor:'pointer'} }, `🏰 ${eId}`)
                )
              )
            ),

            // Bina listesi
            secilenEyalet && React.createElement('div', null,
              React.createElement('div', { style:{fontFamily:"'Cinzel',serif",fontSize:'0.8rem',color:G,fontWeight:700,marginBottom:8} }, `🏗️ ${secilenEyalet} — Binalar`),
              React.createElement('div', { style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8} },
                BINA_TIPLERI.map(bina => {
                  const mevcut = insaatlar[secilenEyalet]?.[bina.id] || 0;
                  const aktifBuInsaat = aktifInsaat.find(i => i.eyaletId===secilenEyalet && i.binaId===bina.id);
                  const maksUlasti = mevcut >= bina.maksLevel;
                  return React.createElement('div', { key:bina.id, style:{background:'rgba(27,33,43,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'12px'} },
                    React.createElement('div', { style:{fontSize:'1.5rem',marginBottom:6} }, bina.emoji),
                    React.createElement('div', { style:{fontSize:'0.78rem',fontWeight:700,color:T,marginBottom:2} }, bina.ad),
                    React.createElement('div', { style:{fontSize:'0.6rem',color:M,lineHeight:1.4,marginBottom:6} }, bina.acik),
                    // Seviye göstergesi
                    React.createElement('div', { style:{display:'flex',gap:3,marginBottom:8} },
                      Array.from({length:bina.maksLevel}).map((_,i) =>
                        React.createElement('div', { key:i, style:{height:4,flex:1,borderRadius:2,background:i<mevcut?G:'rgba(255,255,255,0.1)'} })
                      )
                    ),
                    React.createElement('div', { style:{fontSize:'0.6rem',color:M,marginBottom:8} }, `Lv.${mevcut}/${bina.maksLevel} · ${bina.bonus}`),
                    aktifBuInsaat
                      ? React.createElement('div', { style:{fontSize:'0.62rem',color:G,fontWeight:700,textAlign:'center'} }, '⏳ İnşaatta')
                      : maksUlasti
                        ? React.createElement('div', { style:{fontSize:'0.62rem',color:'#3E8C5A',fontWeight:700,textAlign:'center'} }, '✅ Tamamlandı')
                        : React.createElement('button', { onClick:()=>insa(bina,secilenEyalet),
                            style:{width:'100%',padding:'6px',borderRadius:8,border:'none',background:G,color:'#0F0800',fontWeight:800,fontSize:'0.65rem',cursor:'pointer'} },
                          `İnşa Et — 🪙${bina.maliyet.sikke.toLocaleString('tr-TR')}`)
                  );
                })
              )
            )
          )
    )
  );
};
