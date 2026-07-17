"use strict";
// ═══════════════════════════════════════════════════════
// SALTANAT ONLINE — Osmanlı Ordusu Yönetimi
// Yeniçeri, Akıncı, Sipahi, Azap, Kapıkulu — gerçek teçhizat sistemi
// Gıda tüketimi + Hayvancılıktan sefer hızı
// ═══════════════════════════════════════════════════════

const ORDU_BIRLIKLERI = [
  {
    id:'yeniceri', label:'Yeniçeri', emoji:'🪖',
    aciklama:'Sultanın seçkin piyade kuvveti. Yüksek disiplin ve ağır zırh.',
    güç:50, gıdaTüketim:3, maas:2000,
    gereksinimler:{ zırh:1, kilicl1:1 },
    kategori:'piyade', renk:'#C24B43',
    seferHız:1.0,
  },
  {
    id:'akinci', label:'Akıncı', emoji:'🏹',
    aciklama:'Hafif süvari keşifçiler. Sefer hızında en hızlı birimler.',
    güç:35, gıdaTüketim:4, maas:1500,
    gereksinimler:{ yayl1:1 },
    kategori:'süvari', renk:'#5B8DD9',
    seferHız:1.5, // hayvancılık eti ile +0.3 bonus
  },
  {
    id:'sipahi', label:'Sipahi', emoji:'⚔️',
    aciklama:'Tımarlı sipahiler. Orta ağır süvari, toprağa bağlı asker.',
    güç:45, gıdaTüketim:5, maas:2500,
    gereksinimler:{ kilicl1:1, kalkanl1:1 },
    kategori:'süvari', renk:'#C89B3C',
    seferHız:1.3,
  },
  {
    id:'azap', label:'Azap', emoji:'🗡️',
    aciklama:'Gönüllü hafif piyade. Düşük maliyet, ön saflarda tutar.',
    güç:20, gıdaTüketim:2, maas:500,
    gereksinimler:{ mızrakl1:1 },
    kategori:'piyade', renk:'#4C9A6B',
    seferHız:0.9,
  },
  {
    id:'kapikulu', label:'Kapıkulu Süvarisi', emoji:'🦅',
    aciklama:'Sultanın hassa süvarisi. En güçlü birimler, en yüksek maliyet.',
    güç:80, gıdaTüketim:6, maas:5000,
    gereksinimler:{ kilicl2:1, zirhl1:1 },
    kategori:'elit', renk:'#8B6BF2',
    seferHız:1.4,
  },
  {
    id:'topcu', label:'Topçu', emoji:'💣',
    aciklama:'Osmanlı topçu birliği. Kale yıkımında uzman, sahada ağır ateş.',
    güç:70, gıdaTüketim:4, maas:4000,
    gereksinimler:{ topl1:2 },
    kategori:'agir', renk:'#C89B3C',
    seferHız:0.7,
  },
];

const SEFER_BÖLGELERI = [
  { id:'karaorman', label:'Karaorman Sancağı', emoji:'🌲', mesafe:2, ödül:{ sikke:5000, madenPuani:20 } },
  { id:'altinova',  label:'Altınova Eyaleti',  emoji:'🌾', mesafe:4, ödül:{ sikke:12000, gidaPuani:30 } },
  { id:'demirkapi', label:'Demirkapı Sancağı', emoji:'🏔️', mesafe:6, ödül:{ sikke:25000, aletPuani:40 } },
  { id:'gunestepe', label:'Güneştepe Kalesi',  emoji:'☀️', mesafe:8, ödül:{ sikke:40000, liyakat:50 } },
  { id:'karatas',   label:'Karataş Limanı',    emoji:'⚓', mesafe:10, ödül:{ sikke:70000, altın:5 } },
];

window.OttomanOrdusScreen = function OttomanOrdusScreen({ profile, setProfile, showNotif, onNavigate }) {
  const [tab, setTab] = React.useState('birlikler');
  const [sefer, setSefer] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('rep_aktifSefer') || 'null'); } catch { return null; }
  });
  const [sayaç, setSayaç] = React.useState(Date.now());

  React.useEffect(() => {
    const t = setInterval(() => setSayaç(Date.now()), 2000);
    return () => clearInterval(t);
  }, []);

  // Ordu verisi
  const ordu = (() => { try { return JSON.parse(localStorage.getItem('rep_osmOrdu') || '{}'); } catch { return {}; } })();
  const birlikSayilari = ordu.birlikler || {};

  // Gıda stoku
  const gidaStok = (() => { try { return JSON.parse(localStorage.getItem('rep_gidaStok') || '{}'); } catch { return {}; } })();
  // Hayvancılık eti (sefer hız bonusu)
  const etStoku = gidaStok.et || 0;
  const seferHızBonusu = etStoku >= 20 ? 0.3 : etStoku >= 10 ? 0.15 : 0;

  // Alet envanteri (gereksinimler için)
  const aletEnv = (() => { try { return JSON.parse(localStorage.getItem('rep_aletEnvanter') || '{}'); } catch { return {}; } })();

  // Toplam ordu gücü
  const toplamGüç = ORDU_BIRLIKLERI.reduce((s, b) => s + (birlikSayilari[b.id]||0) * b.güç, 0);
  // Günlük gıda tüketimi
  const günlükGıda = ORDU_BIRLIKLERI.reduce((s, b) => s + (birlikSayilari[b.id]||0) * b.gıdaTüketim, 0);
  // Aylık maaş
  const aylıkMaaş = ORDU_BIRLIKLERI.reduce((s, b) => s + (birlikSayilari[b.id]||0) * b.maas, 0);
  const toplamAsker = Object.values(birlikSayilari).reduce((s, v) => s + v, 0);

  const askİste = (birlik, adet=1) => {
    // Gereksinim kontrolü
    for (const [aletId, miktar] of Object.entries(birlik.gereksinimler || {})) {
      if ((aletEnv[aletId] || 0) < miktar * adet) {
        const aletAdı = aletId.replace(/l\d$/, '');
        showNotif(`❌ ${birlik.label} için ${aletId} gerekiyor (Alet Atölyesi'nden üret)`, 'error');
        return;
      }
    }
    if ((profile?.money || 0) < birlik.maas * adet) {
      showNotif(`❌ ${birlik.label} için 🪙${(birlik.maas*adet).toLocaleString('tr-TR')} maaş gerekli`, 'error');
      return;
    }
    // Aletleri düş
    const yeniAlet = { ...aletEnv };
    for (const [aletId, miktar] of Object.entries(birlik.gereksinimler || {})) {
      yeniAlet[aletId] = (yeniAlet[aletId] || 0) - miktar * adet;
    }
    localStorage.setItem('rep_aletEnvanter', JSON.stringify(yeniAlet));
    const yeniOrdu = { ...ordu, birlikler: { ...birlikSayilari, [birlik.id]: (birlikSayilari[birlik.id]||0) + adet } };
    localStorage.setItem('rep_osmOrdu', JSON.stringify(yeniOrdu));
    const np = { ...profile, money: (profile.money||0) - birlik.maas*adet };
    setProfile(np);
    localStorage.setItem('rep_userProfile', JSON.stringify(np));
    showNotif(`✅ ${adet} ${birlik.emoji} ${birlik.label} askere alındı!`, 'success');
    try { window._pushGameEvent?.('asker_alindi', '🪖 Askere Alım', `${profile?.username||'Bir oyuncu'} ${birlik.label} askere aldı.`, '🪖', 'ordu'); } catch(_){}
    window._gucPuaniGuncelle?.();
  };

  const seferBaslat = (bölge) => {
    if (toplamAsker === 0) { showNotif('❌ Önce asker topla!', 'error'); return; }
    const süre = bölge.mesafe * 60 * 1000 * (1 / (1 + seferHızBonusu)); // et bonusu sefer süresini kısaltır
    const yeniSefer = {
      id: 'sefer_' + Date.now(),
      bölgeId: bölge.id,
      bölgeLabel: bölge.label,
      başlamaZamanı: Date.now(),
      bitişZamanı: Date.now() + süre,
      ödül: bölge.ödül,
      askerSayısı: toplamAsker,
      güç: toplamGüç,
      seferHızBonusu,
    };
    localStorage.setItem('rep_aktifSefer', JSON.stringify(yeniSefer));
    setSefer(yeniSefer);
    showNotif(`🪖 ${bölge.emoji} ${bölge.label} seferi başladı! (${Math.round(süre/60000)} dakika)`, 'info');
    if (etStoku >= 10) showNotif('🐄 Hayvancılık eti sefer hızını artırdı!', 'success');
  };

  const seferTamamla = () => {
    if (!sefer) return;
    const ödül = sefer.ödül;
    let np = { ...profile };
    if (ödül.sikke) np.money = (np.money||0) + ödül.sikke;
    if (ödül.liyakat) np.merit_points = (np.merit_points||0) + ödül.liyakat;
    if (ödül.altın) { np.altin = (np.altin||0) + ödül.altın; np.underCoin = np.altin; }
    if (ödül.madenPuani) np.madenPuani = (np.madenPuani||0) + ödül.madenPuani;
    if (ödül.gidaPuani) np.gidaPuani = (np.gidaPuani||0) + ödül.gidaPuani;
    if (ödül.aletPuani) np.aletPuani = (np.aletPuani||0) + ödül.aletPuani;
    setProfile(np);
    localStorage.setItem('rep_userProfile', JSON.stringify(np));
    localStorage.removeItem('rep_aktifSefer');
    setSefer(null);
    const ödülMetin = Object.entries(ödül).map(([k,v]) => `+${v} ${k}`).join(', ');
    showNotif(`🏆 ${sefer.bölgeLabel} seferi tamamlandı! ${ödülMetin}`, 'success');
    try { window._pushGameEvent?.('sefer_tamamlandi', '🏆 Sefer Tamamlandı', `${profile?.username||'Bir oyuncu'} ${sefer.bölgeLabel} seferinden zaferle döndü!`, '🏆', 'sefer'); } catch(_){}
    window._gucPuaniGuncelle?.();
  };

  const GOLD = '#C89B3C';
  const BG = '#1A0E00';
  const SURF = '#2D1800';

  return React.createElement('div', {style:{minHeight:'100vh',background:BG,fontFamily:"'Inter',sans-serif",paddingBottom:90}},
    // Header
    React.createElement('div', {style:{background:'linear-gradient(135deg,#2D1800,#3D2200,#2D1800)',borderBottom:'1px solid rgba(200,155,60,0.3)',padding:'14px 16px 10px'}},
      React.createElement('div', {style:{display:'flex',alignItems:'center',gap:10,marginBottom:8}},
        React.createElement('span', {style:{fontSize:'1.6rem'}}, '🪖'),
        React.createElement('div', null,
          React.createElement('div', {style:{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:'1.15rem',color:GOLD}}, 'Osmanlı Ordusu'),
          React.createElement('div', {style:{fontSize:'0.68rem',color:'#A9A6A0'}}, 'Yeniçeri · Akıncı · Sipahi · Topçu'),
        ),
      ),
      React.createElement('div', {style:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:5}},
        [
          ['⚔️','Ordu Gücü', toplamGüç.toLocaleString(), '#C24B43'],
          ['🪖','Asker', toplamAsker.toString(), '#C89B3C'],
          ['🌾','Günlük Gıda', `-${günlükGıda}`, '#4C9A6B'],
          ['🐄','Et Stoku', etStoku.toString(), seferHızBonusu>0?'#4C9A6B':'#8893A1'],
        ].map(([ic,lb,v,c]) =>
          React.createElement('div',{key:lb,style:{background:'rgba(0,0,0,0.35)',borderRadius:7,padding:'5px 6px',textAlign:'center'}},
            React.createElement('div',{style:{fontSize:'0.55rem',color:'#8893A1',marginBottom:1}},`${ic} ${lb}`),
            React.createElement('div',{style:{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.78rem',fontWeight:800,color:c}},v),
          )
        )
      ),
      seferHızBonusu > 0 && React.createElement('div',{style:{marginTop:6,background:'rgba(76,154,107,0.1)',border:'1px solid rgba(76,154,107,0.3)',borderRadius:7,padding:'4px 8px',fontSize:'0.65rem',color:'#4C9A6B',fontWeight:700}},
        `🐄 Hayvancılık Bonusu: Sefer hızı +${Math.round(seferHızBonusu*100)}% (${etStoku} et stokta)`
      ),
    ),

    // Tabs
    React.createElement('div',{style:{display:'flex',background:'#1F0F00',borderBottom:'1px solid rgba(200,155,60,0.12)'}},
      [['birlikler','🪖 Birlikler'],['sefer','🗺️ Sefer'],['besle','🌾 İaşe']].map(([id,lb])=>
        React.createElement('button',{key:id,onClick:()=>setTab(id),style:{flex:1,padding:'10px 4px',border:'none',background:tab===id?'rgba(200,155,60,0.12)':'transparent',color:tab===id?GOLD:'#8893A1',fontWeight:700,fontSize:'0.73rem',cursor:'pointer',borderBottom:tab===id?`2px solid ${GOLD}`:'2px solid transparent'}},lb)
      )
    ),

    React.createElement('div',{style:{padding:12}},

      // ── Birlikler ──
      tab==='birlikler' && React.createElement('div', null,
        ORDU_BIRLIKLERI.map(birlik => {
          const mevcut = birlikSayilari[birlik.id] || 0;
          const gereksinimKarşılandı = Object.entries(birlik.gereksinimler||{}).every(([aId,m])=>(aletEnv[aId]||0)>=m);
          const paraBekleniyor = (profile?.money||0) >= birlik.maas;
          const işeAlınabilir = gereksinimKarşılandı && paraBekleniyor;
          return React.createElement('div',{key:birlik.id,style:{background:SURF,border:`1px solid rgba(${birlik.renk.replace('#','').match(/../g).map(h=>parseInt(h,16)).join(',')},0.25)`,borderRadius:12,padding:12,marginBottom:8}},
            React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}},
              React.createElement('div',{style:{display:'flex',alignItems:'center',gap:8}},
                React.createElement('span',{style:{fontSize:'1.4rem'}},birlik.emoji),
                React.createElement('div',null,
                  React.createElement('div',{style:{fontWeight:800,color:'#EDE7DA',fontSize:'0.88rem'}},birlik.label),
                  React.createElement('div',{style:{fontSize:'0.63rem',color:'#8893A1',marginTop:2}},birlik.aciklama),
                ),
              ),
              React.createElement('div',{style:{textAlign:'right'}},
                React.createElement('div',{style:{fontFamily:"'JetBrains Mono',monospace",fontWeight:800,color:birlik.renk,fontSize:'0.9rem'}},`⚔️${birlik.güç}`),
                React.createElement('div',{style:{fontSize:'0.6rem',color:'#8893A1'}},`🌾-${birlik.gıdaTüketim}/gün`),
              ),
            ),
            React.createElement('div',{style:{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}},
              [
                [`🪙 Maaş: ${(birlik.maas).toLocaleString('tr-TR')}`, paraBekleniyor?'#4C9A6B':'#C24B43'],
                [`🪖 Mevcut: ${mevcut}`, '#C89B3C'],
                birlik.seferHız!==1.0 && [`🚀 Sefer: ×${birlik.seferHız}`, '#5B8DD9'],
              ].filter(Boolean).map(([t,c],i)=>React.createElement('span',{key:i,style:{fontSize:'0.63rem',color:c,fontWeight:700,background:`rgba(${c==='#4C9A6B'?'76,154,107':c==='#C24B43'?'194,75,67':c==='#C89B3C'?'200,155,60':'91,141,217'},0.1)`,border:`1px solid ${c}44`,borderRadius:6,padding:'2px 8px'}},t))
            ),
            // Gereksinim
            Object.keys(birlik.gereksinimler||{}).length > 0 && React.createElement('div',{style:{fontSize:'0.63rem',color:gereksinimKarşılandı?'#4C9A6B':'#C24B43',marginBottom:6,fontWeight:700}},
              `⚒️ Gerekli: ${Object.entries(birlik.gereksinimler).map(([a,m])=>`${a}×${m}`).join(', ')} ${gereksinimKarşılandı?'✅':'(Alet Atölyesi\'nden üret)'}`
            ),
            React.createElement('button',{onClick:()=>askİste(birlik,1),disabled:!işeAlınabilir,style:{width:'100%',padding:'8px',borderRadius:8,border:'none',background:işeAlınabilir?`linear-gradient(135deg,${birlik.renk},${birlik.renk}99)`:'rgba(255,255,255,0.05)',color:işeAlınabilir?'#FFF':'#6B7687',fontWeight:800,fontSize:'0.8rem',cursor:işeAlınabilir?'pointer':'not-allowed'}},
              işeAlınabilir ? `+ 1 ${birlik.label} Askere Al` : '❌ Gereksinimler Karşılanmadı'
            ),
          );
        })
      ),

      // ── Sefer ──
      tab==='sefer' && React.createElement('div', null,
        sefer && React.createElement('div',{style:{background:'rgba(201,162,39,0.08)',border:'1px solid rgba(201,162,39,0.3)',borderRadius:12,padding:14,marginBottom:12}},
          React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontWeight:800,color:GOLD,marginBottom:6,fontSize:'0.88rem'}}, `🚀 ${sefer.bölgeLabel} — Aktif Sefer`),
          (() => {
            const kalan = Math.max(0, Math.ceil((sefer.bitişZamanı - sayaç) / 1000));
            const tamamlandi = sayaç >= sefer.bitişZamanı;
            const ilerleme = tamamlandi ? 100 : Math.round(((sayaç-sefer.başlamaZamanı)/(sefer.bitişZamanı-sefer.başlamaZamanı))*100);
            return React.createElement('div', null,
              React.createElement('div',{style:{height:8,background:'rgba(255,255,255,0.08)',borderRadius:4,overflow:'hidden',marginBottom:6}},
                React.createElement('div',{style:{height:'100%',width:`${ilerleme}%`,background:`linear-gradient(90deg,${GOLD},#E8B85A)`,borderRadius:4,transition:'width 2s linear'}}),
              ),
              tamamlandi
                ? React.createElement('button',{onClick:seferTamamla,style:{width:'100%',padding:'10px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#4C9A6B,#3E7A55)',color:'#FFF',fontWeight:800,fontSize:'0.88rem',cursor:'pointer'}}, '🏆 Seferi Tamamla ve Ganimeti Topla!')
                : React.createElement('div',{style:{fontSize:'0.72rem',color:'#A9A6A0'}}, `⏳ ${Math.floor(kalan/60)}d ${kalan%60}s kaldı · %${ilerleme} tamamlandı`),
            );
          })(),
        ),
        !sefer && React.createElement('div', null,
          React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontSize:'0.7rem',fontWeight:700,color:'#8893A1',marginBottom:10,letterSpacing:'0.1em'}}, 'SEFER HEDEFLERİ'),
          toplamAsker === 0 && React.createElement('div',{style:{background:'rgba(194,75,67,0.08)',border:'1px solid rgba(194,75,67,0.2)',borderRadius:10,padding:10,marginBottom:10,fontSize:'0.75rem',color:'#C24B43',fontWeight:700}},
            '⚠️ Sefer için en az 1 asker gerekli. Birlikler sekmesinden asker al.'
          ),
          SEFER_BÖLGELERI.map(b => {
            const süre = b.mesafe * 60 * (1 / (1 + seferHızBonusu));
            return React.createElement('div',{key:b.id,style:{background:SURF,border:'1px solid rgba(200,155,60,0.15)',borderRadius:12,padding:12,marginBottom:8}},
              React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}},
                React.createElement('div',null,
                  React.createElement('div',{style:{fontWeight:800,color:'#EDE7DA',fontSize:'0.88rem'}},`${b.emoji} ${b.label}`),
                  React.createElement('div',{style:{fontSize:'0.62rem',color:'#8893A1',marginTop:2}},`Mesafe: ${b.mesafe} · ${Math.round(süre)} dakika`),
                ),
                React.createElement('div',{style:{textAlign:'right'}},
                  Object.entries(b.ödül).map(([k,v])=>React.createElement('div',{key:k,style:{fontSize:'0.65rem',fontWeight:700,color:'#4C9A6B'}},`+${v} ${k}`))
                ),
              ),
              React.createElement('button',{onClick:()=>seferBaslat(b),disabled:!sefer&&toplamAsker===0,style:{width:'100%',padding:'8px',borderRadius:8,border:'none',background:toplamAsker>0?'linear-gradient(135deg,#C89B3C,#8B6A1A)':'rgba(255,255,255,0.05)',color:toplamAsker>0?'#0F0800':'#6B7687',fontWeight:800,fontSize:'0.8rem',cursor:toplamAsker>0?'pointer':'not-allowed'}},
                `🚀 Sefere Çık (${Math.round(süre)}dk)`
              ),
            );
          })
        ),
      ),

      // ── İaşe (Beslenme) ──
      tab==='besle' && React.createElement('div', null,
        React.createElement('div',{style:{background:SURF,border:'1px solid rgba(200,155,60,0.2)',borderRadius:12,padding:14,marginBottom:12}},
          React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontWeight:800,color:GOLD,marginBottom:10,fontSize:'0.88rem'}}, '🌾 ORDU İAŞESİ'),
          [
            ['🌾','Gıda Puanı (Tarım)',profile?.gidaPuani||0,'#4C9A6B'],
            ['🐄','Et Stoku (Hayvancılık)',etStoku,'#C89B3C'],
            ['⚔️','Günlük Tüketim',günlükGıda,'#C24B43'],
            ['📅','Gıda Yeterliliği',günlükGıda>0?`${Math.floor((profile?.gidaPuani||0)/Math.max(1,günlükGıda))} gün`:'Sonsuz','#4C9A6B'],
          ].map(([ic,lb,v,c])=>React.createElement('div',{key:lb,style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}},
            React.createElement('span',{style:{fontSize:'0.75rem',color:'#A9A6A0'}},`${ic} ${lb}`),
            React.createElement('span',{style:{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.82rem',fontWeight:700,color:c}},typeof v==='number'?v.toLocaleString('tr-TR'):v),
          ))
        ),
        React.createElement('div',{style:{background:'rgba(76,154,107,0.08)',border:'1px solid rgba(76,154,107,0.2)',borderRadius:12,padding:14,marginBottom:10}},
          React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontWeight:700,color:'#4C9A6B',marginBottom:8,fontSize:'0.8rem'}}, '🐄 HAYVANCILLIK BONUSLARI'),
          [
            ['0-9 et','Bonus yok','#8893A1'],
            ['10-19 et','Sefer hızı +15%','#C89B3C'],
            ['20+ et','Sefer hızı +30%','#4C9A6B'],
          ].map(([koşul,efekt,c])=>React.createElement('div',{key:koşul,style:{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}},
            React.createElement('span',{style:{fontSize:'0.72rem',color:'#8893A1'}},koşul),
            React.createElement('span',{style:{fontSize:'0.72rem',fontWeight:700,color:c}},efekt),
          ))
        ),
        React.createElement('div',{style:{background:'rgba(200,155,60,0.05)',border:'1px solid rgba(200,155,60,0.15)',borderRadius:10,padding:10,fontSize:'0.7rem',color:'#A9A6A0',lineHeight:1.6}},
          '💡 Tarımdan hasat yap → Gıda Puanı kazan → Ordu süresiz beslensin. Hayvancılıktan et üret → Seferlerde hız bonusu kazan.'
        ),
      ),
    ),
  );
};
