"use strict";
// ═══════════════════════════════════════════════════════
// SALTANAT ONLINE — Alet Atölyesi (Weapon Crafting)
// Madenden kazanılan hammaddeleri silaha dönüştür
// Her silah alet puanı verir → beylik güç puanını artırır
// ═══════════════════════════════════════════════════════

const ALET_HAMMADDELER = {
  demir:  { label:'Demir',   emoji:'🪨', color:'#8893A1' },
  kömür:  { label:'Kömür',   emoji:'🪨', color:'#4A4A4A' },
  altın:  { label:'Altın',   emoji:'🟡', color:'#C89B3C' },
  ahşap:  { label:'Ahşap',   emoji:'🪵', color:'#8B6A1A' },
  deri:   { label:'Deri',    emoji:'🟤', color:'#8B6A1A' },
};

const ALET_TARIFLER = [
  {
    id:'kilicl1', label:'Kılıç', emoji:'⚔️', kategori:'silah',
    seviye:1, aletPuani:20,
    malzeme:{ demir:10, ahşap:3 },
    sure:30, aciklama:'Temel savaş kılıcı. Piyadeler için standart silah.',
    sonrakiSeviye:'kilicl2',
  },
  {
    id:'kilicl2', label:'Kılıç (Lv.2)', emoji:'⚔️', kategori:'silah',
    seviye:2, aletPuani:45,
    malzeme:{ demir:20, ahşap:5, kömür:8 },
    sure:90, aciklama:'Sertleştirilmiş kılıç. Demircilikte ustalaşmış işçi ürünü.',
    oncekiSeviye:'kilicl1', sonrakiSeviye:'kilicl3',
  },
  {
    id:'kilicl3', label:'Kılıç (Lv.3)', emoji:'⚔️', kategori:'silah',
    seviye:3, aletPuani:90,
    malzeme:{ demir:35, altın:5, kömür:15 },
    sure:180, aciklama:'Altın kakmalı Osmanlı kılıcı. Emirlere layık silah.',
    oncekiSeviye:'kilicl2',
  },
  {
    id:'yayl1', label:'Yay', emoji:'🏹', kategori:'silah',
    seviye:1, aletPuani:50,
    malzeme:{ ahşap:8, deri:5 },
    sure:45, aciklama:'Akıncı yayı. Uzak mesafeden etkili.',
    sonrakiSeviye:'yayl2',
  },
  {
    id:'yayl2', label:'Yay (Lv.2)', emoji:'🏹', kategori:'silah',
    seviye:2, aletPuani:110,
    malzeme:{ ahşap:15, deri:10, kömür:5 },
    sure:120, aciklama:'Güçlendirilmiş kompozit yay. Menzil +30%.',
    oncekiSeviye:'yayl1', sonrakiSeviye:'yayl3',
  },
  {
    id:'yayl3', label:'Yay (Lv.3)', emoji:'🏹', kategori:'silah',
    seviye:3, aletPuani:200,
    malzeme:{ ahşap:25, deri:18, altın:3 },
    sure:240, aciklama:'Osmanlı geri-gerilmeli yayı. Akıncı birliklerinin gururu.',
    oncekiSeviye:'yayl2',
  },
  {
    id:'okl1', label:'Ok Demeti', emoji:'🪃', kategori:'silah',
    seviye:1, aletPuani:15,
    malzeme:{ ahşap:5, kömür:2 },
    sure:15, aciklama:'20 oktan oluşan demet. Yay ile birlikte kullanılır.',
    sonrakiSeviye:'okl2',
  },
  {
    id:'okl2', label:'Ok Demeti (Lv.2)', emoji:'🪃', kategori:'silah',
    seviye:2, aletPuani:35,
    malzeme:{ ahşap:10, demir:5, kömür:3 },
    sure:40, aciklama:'Demir uçlu oklar. Zırh delici etki.',
    oncekiSeviye:'okl1',
  },
  {
    id:'kalkanl1', label:'Kalkan', emoji:'🛡️', kategori:'savunma',
    seviye:1, aletPuani:10,
    malzeme:{ demir:8, ahşap:5 },
    sure:20, aciklama:'Yuvarlak demir kalkan. Temel koruma sağlar.',
    sonrakiSeviye:'kalkanl2',
  },
  {
    id:'kalkanl2', label:'Kalkan (Lv.2)', emoji:'🛡️', kategori:'savunma',
    seviye:2, aletPuani:25,
    malzeme:{ demir:18, kömür:6 },
    sure:60, aciklama:'Sertleştirilmiş kalkanlı koruma. Süvari kalkanı.',
    oncekiSeviye:'kalkanl1', sonrakiSeviye:'kalkanl3',
  },
  {
    id:'kalkanl3', label:'Kalkan (Lv.3)', emoji:'🛡️', kategori:'savunma',
    seviye:3, aletPuani:55,
    malzeme:{ demir:30, altın:2, kömür:10 },
    sure:120, aciklama:'Divitli büyük kalkan. Yeniçeri kalkanlı birliğinin simgesi.',
    oncekiSeviye:'kalkanl2',
  },
  {
    id:'mızrakl1', label:'Mızrak', emoji:'🗡️', kategori:'silah',
    seviye:1, aletPuani:25,
    malzeme:{ demir:6, ahşap:7 },
    sure:25, aciklama:'Uzun mızrak. Süvari saldırılarına karşı etkili.',
    sonrakiSeviye:'mızrakl2',
  },
  {
    id:'mızrakl2', label:'Mızrak (Lv.2)', emoji:'🗡️', kategori:'silah',
    seviye:2, aletPuani:60,
    malzeme:{ demir:14, ahşap:12, kömür:6 },
    sure:75, aciklama:'Çelik uçlu uzun mızrak. Piyade sıralamasının beli kemiği.',
    oncekiSeviye:'mızrakl1',
  },
  {
    id:'zirhl1', label:'Zırh', emoji:'🪬', kategori:'savunma',
    seviye:1, aletPuani:30,
    malzeme:{ demir:20, kömür:8 },
    sure:60, aciklama:'Zincir zırh. Fiziksel hasarı azaltır.',
    sonrakiSeviye:'zirhl2',
  },
  {
    id:'zirhl2', label:'Zırh (Lv.2)', emoji:'🪬', kategori:'savunma',
    seviye:2, aletPuani:75,
    malzeme:{ demir:38, altın:4, kömür:15 },
    sure:150, aciklama:'Levha zırh. Kapıkulu birlikleri için standart donatım.',
    oncekiSeviye:'zirhl1', sonrakiSeviye:'zirhl3',
  },
  {
    id:'zirhl3', label:'Zırh (Lv.3)', emoji:'🪬', kategori:'savunma',
    seviye:3, aletPuani:160,
    malzeme:{ demir:60, altın:10, kömür:25 },
    sure:300, aciklama:'Divanhane zırhı. Paşalara yakışır eksiksiz koruyucu donatım.',
    oncekiSeviye:'zirhl2',
  },
  {
    id:'topl1', label:'Top Güllesi', emoji:'💣', kategori:'agir',
    seviye:1, aletPuani:80,
    malzeme:{ demir:30, kömür:20 },
    sure:120, aciklama:'Dökme demir top güllesi. Osmanlı topçuluğunun temeli.',
    sonrakiSeviye:'topl2',
  },
  {
    id:'topl2', label:'Top Güllesi (Lv.2)', emoji:'💣', kategori:'agir',
    seviye:2, aletPuani:180,
    malzeme:{ demir:55, altın:8, kömür:35 },
    sure:300, aciklama:'Çelik çekirdekli ağır gülle. Kale surlarını yıkar.',
    oncekiSeviye:'topl1',
  },
];

const KATEGORI_RENK = { silah:'#C24B43', savunma:'#5B8DD9', agir:'#C89B3C' };
const KATEGORI_ETIKET = { silah:'Silahlar', savunma:'Savunma', agir:'Ağır Topçu' };

window.AletAtölyesiScreen = function AletAtölyesiScreen({ profile, setProfile, showNotif, onNavigate }) {
  const [tab, setTab] = React.useState('uret');
  const [kategori, setKategori] = React.useState('tümü');
  const [üretimler, setÜretimler] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('rep_üretimler') || '[]'); } catch { return []; }
  });
  const [üretimSayaci, setÜretimSayaci] = React.useState(Date.now());

  // Hammadde stoku
  const madencilik = (() => {
    try { return JSON.parse(localStorage.getItem('rep_madencilik') || '{}'); } catch { return {}; }
  })();
  const kaynaklar = madencilik.resources || {};

  // Ahşap + Deri — tarım/hayvancılıktan
  const gidaStok = (() => { try { return JSON.parse(localStorage.getItem('rep_gidaStok') || '{}'); } catch { return {}; } })();
  const ahşap = kaynaklar.wood || 0;
  const deri   = (kaynaklar.leather || 0) + (gidaStok.deri || 0);
  const stok = {
    demir: kaynaklar.iron || 0,
    kömür: kaynaklar.coal || 0,
    altın: kaynaklar.gold || 0,
    ahşap: ahşap,
    deri:  deri,
  };

  // Envanterden üretilmiş aletler
  const envanter = (() => { try { return JSON.parse(localStorage.getItem('rep_aletEnvanter') || '{}'); } catch { return {}; } })();
  // Toplam alet puanı
  const aletPuani = (profile?.aletPuani || 0) + Object.entries(envanter).reduce((s,[id,adet]) => {
    const t = ALET_TARIFLER.find(x=>x.id===id);
    return s + (t ? t.aletPuani * adet : 0);
  }, 0);

  // Üretim tetikleyicisi: süresi dolan işleri tamamla
  React.useEffect(() => {
    const interval = setInterval(() => {
      const şimdi = Date.now();
      const bitmişler = üretimler.filter(u => !u.tamamlandi && u.bitisZamani <= şimdi);
      if (bitmişler.length === 0) return;
      const yeniEnvanter = { ...envanter };
      let toplamAletPuani = profile?.aletPuani || 0;
      bitmişler.forEach(u => {
        const tarif = ALET_TARIFLER.find(t => t.id === u.tarifId);
        if (!tarif) return;
        yeniEnvanter[u.tarifId] = (yeniEnvanter[u.tarifId] || 0) + 1;
        toplamAletPuani += tarif.aletPuani;
        showNotif(`⚒️ ${tarif.emoji} ${tarif.label} üretildi! +${tarif.aletPuani} Alet Puanı`, 'success');
        // Canlı olaylar
        try { window._pushGameEvent?.('alet_uretildi', `⚒️ Alet Üretildi`, `${profile?.username||'Bir oyuncu'} ${tarif.label} üretti.`, '⚒️', 'alet'); } catch(_){}
      });
      localStorage.setItem('rep_aletEnvanter', JSON.stringify(yeniEnvanter));
      const yeniÜretimler = üretimler.map(u => bitmişler.find(b=>b.id===u.id) ? {...u, tamamlandi:true} : u);
      setÜretimler(yeniÜretimler);
      localStorage.setItem('rep_üretimler', JSON.stringify(yeniÜretimler));
      const np = {...profile, aletPuani: toplamAletPuani};
      setProfile(np);
      localStorage.setItem('rep_userProfile', JSON.stringify(np));
      // Güç puanı güncelle
      window._gucPuaniGuncelle?.();
    }, 2000);
    return () => clearInterval(interval);
  }, [üretimler, profile]);

  const üretimBaslat = (tarif) => {
    // Malzeme kontrolü
    for (const [k, miktar] of Object.entries(tarif.malzeme)) {
      if ((stok[k] || 0) < miktar) {
        showNotif(`❌ Yeterli ${ALET_HAMMADDELER[k]?.label || k} yok (${stok[k] || 0}/${miktar})`, 'error');
        return;
      }
    }
    // Malzeme düş
    const yeniKaynaklar = { ...kaynaklar };
    const yeniGıda = { ...gidaStok };
    for (const [k, miktar] of Object.entries(tarif.malzeme)) {
      if (k === 'demir') yeniKaynaklar.iron = (yeniKaynaklar.iron || 0) - miktar;
      else if (k === 'kömür') yeniKaynaklar.coal = (yeniKaynaklar.coal || 0) - miktar;
      else if (k === 'altın') yeniKaynaklar.gold = (yeniKaynaklar.gold || 0) - miktar;
      else if (k === 'ahşap') yeniKaynaklar.wood = (yeniKaynaklar.wood || 0) - miktar;
      else if (k === 'deri') {
        const kMik = Math.min(kaynaklar.leather || 0, miktar);
        yeniKaynaklar.leather = (yeniKaynaklar.leather || 0) - kMik;
        if (miktar - kMik > 0) yeniGıda.deri = (yeniGıda.deri || 0) - (miktar - kMik);
      }
    }
    localStorage.setItem('rep_madencilik', JSON.stringify({ ...madencilik, resources: yeniKaynaklar }));
    localStorage.setItem('rep_gidaStok', JSON.stringify(yeniGıda));
    const yeniÜretim = {
      id: 'ur_' + Date.now(),
      tarifId: tarif.id,
      baslamaZamani: Date.now(),
      bitisZamani: Date.now() + tarif.sure * 1000,
      tamamlandi: false,
    };
    const güncelÜretimler = [...üretimler, yeniÜretim];
    setÜretimler(güncelÜretimler);
    localStorage.setItem('rep_üretimler', JSON.stringify(güncelÜretimler));
    showNotif(`⚒️ ${tarif.emoji} ${tarif.label} üretimi başladı! (${tarif.sure}s)`, 'info');
  };

  const filtreliTarifler = ALET_TARIFLER.filter(t => kategori === 'tümü' || t.kategori === kategori);
  const aktifÜretimler = üretimler.filter(u => !u.tamamlandi);

  const GOLD = '#C89B3C';
  const BG   = '#1A0E00';
  const SURF = '#2D1800';

  const kGüç = ALET_TARIFLER.filter(t => t.seviye >= 2).length; // gelişmiş alet sayısı

  return React.createElement('div', { style:{minHeight:'100vh',background:BG,fontFamily:"'Inter',sans-serif",paddingBottom:90}},
    // Header
    React.createElement('div', { style:{background:'linear-gradient(135deg,#2D1800,#3D2200,#2D1800)',borderBottom:'1px solid rgba(200,155,60,0.3)',padding:'14px 16px 10px'}},
      React.createElement('div', {style:{display:'flex',alignItems:'center',gap:10,marginBottom:8}},
        React.createElement('div', {style:{fontSize:'1.6rem'}}, '⚒️'),
        React.createElement('div', null,
          React.createElement('div', {style:{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:'1.15rem',color:GOLD}}, 'Alet Atölyesi'),
          React.createElement('div', {style:{fontSize:'0.68rem',color:'#A9A6A0'}}, 'Hammaddeyi silaha dönüştür — Beyliğini güçlendir'),
        ),
      ),
      // Güç puanı banner
      React.createElement('div', {style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}},
        [
          ['⚒️','Alet Puanı', aletPuani.toLocaleString('tr-TR'), '#C89B3C'],
          ['🪨','Demir/Kömür', `${stok.demir}/${stok.kömür}`, '#8893A1'],
          ['🟡','Altın', stok.altın.toString(), '#C89B3C'],
        ].map(([ic,lb,v,c]) =>
          React.createElement('div', {key:lb, style:{background:'rgba(0,0,0,0.3)',borderRadius:8,padding:'6px 8px',textAlign:'center'}},
            React.createElement('div', {style:{fontSize:'0.58rem',color:'#A9A6A0',marginBottom:2}}, `${ic} ${lb}`),
            React.createElement('div', {style:{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.82rem',fontWeight:700,color:c}}, v),
          )
        ),
      ),
    ),

    // Tabs
    React.createElement('div', {style:{display:'flex',background:'#1F0F00',borderBottom:'1px solid rgba(200,155,60,0.12)'}},
      [['uret','⚒️ Üretim'],['envanter','📦 Envanter'],['aktif','🔄 İşlemler'+( aktifÜretimler.length>0 ? ` (${aktifÜretimler.length})`:'' )]].map(([id,label]) =>
        React.createElement('button',{key:id,onClick:()=>setTab(id),style:{flex:1,padding:'10px 4px',border:'none',background:tab===id?'rgba(200,155,60,0.12)':'transparent',color:tab===id?GOLD:'#8893A1',fontWeight:700,fontSize:'0.73rem',cursor:'pointer',borderBottom:tab===id?`2px solid ${GOLD}`:'2px solid transparent'}},label)
      )
    ),

    // İçerik
    React.createElement('div', {style:{padding:'12px'}},

      // ── Üretim Sekmesi ──
      tab === 'uret' && React.createElement('div', null,
        // Kategori filtresi
        React.createElement('div', {style:{display:'flex',gap:6,marginBottom:12,overflowX:'auto',scrollbarWidth:'none'}},
          [['tümü','Tümü','#8893A1'],['silah','Silahlar','#C24B43'],['savunma','Savunma','#5B8DD9'],['agir','Ağır','#C89B3C']].map(([id,lb,c])=>
            React.createElement('button',{key:id,onClick:()=>setKategori(id),style:{padding:'6px 14px',borderRadius:20,border:`1px solid ${kategori===id?c:'rgba(255,255,255,0.1)'}`,background:kategori===id?`rgba(${c==='#C24B43'?'194,75,67':c==='#5B8DD9'?'91,141,217':'200,155,60'},0.15)`:'transparent',color:kategori===id?c:'#8893A1',fontWeight:700,fontSize:'0.72rem',cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}},lb)
          )
        ),
        filtreliTarifler.map(tarif => {
          const aktifVar = aktifÜretimler.find(u => u.tarifId === tarif.id);
          const malzemeYeter = Object.entries(tarif.malzeme).every(([k,m]) => (stok[k]||0)>=m);
          return React.createElement('div', {key:tarif.id, style:{background:SURF,border:`1px solid ${malzemeYeter?'rgba(200,155,60,0.2)':'rgba(255,255,255,0.06)'}`,borderRadius:12,padding:'12px',marginBottom:8}},
            React.createElement('div', {style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}},
              React.createElement('div', {style:{display:'flex',alignItems:'center',gap:8}},
                React.createElement('span', {style:{fontSize:'1.4rem'}}, tarif.emoji),
                React.createElement('div', null,
                  React.createElement('div', {style:{fontWeight:800,color:'#EDE7DA',fontSize:'0.88rem'}}, tarif.label),
                  React.createElement('div', {style:{fontSize:'0.65rem',color:'#8893A1',marginTop:2}}, tarif.aciklama),
                ),
              ),
              React.createElement('div', {style:{textAlign:'right'}},
                React.createElement('div', {style:{fontFamily:"'JetBrains Mono',monospace",fontWeight:800,color:KATEGORI_RENK[tarif.kategori],fontSize:'0.9rem'}}, `+${tarif.aletPuani} AP`),
                React.createElement('div', {style:{fontSize:'0.6rem',color:'#8893A1'}}, `${tarif.sure}s`),
              ),
            ),
            // Malzeme listesi
            React.createElement('div', {style:{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}},
              Object.entries(tarif.malzeme).map(([k,m]) => {
                const var_ = stok[k] || 0;
                const yeter = var_ >= m;
                return React.createElement('div', {key:k, style:{background:`rgba(${yeter?'76,154,107':'194,75,67'},0.1)`,border:`1px solid rgba(${yeter?'76,154,107':'194,75,67'},0.3)`,borderRadius:6,padding:'3px 8px',fontSize:'0.65rem',color:yeter?'#4C9A6B':'#C24B43',fontWeight:700}},
                  `${ALET_HAMMADDELER[k]?.emoji||'🪨'} ${ALET_HAMMADDELER[k]?.label||k}: ${var_}/${m}`
                );
              })
            ),
            aktifVar
              ? React.createElement('div', {style:{padding:'8px 12px',background:'rgba(201,162,39,0.08)',border:'1px solid rgba(201,162,39,0.2)',borderRadius:8,fontSize:'0.72rem',color:GOLD,fontWeight:700}},
                  '⏳ Üretim devam ediyor...'
                )
              : React.createElement('button', {onClick:()=>üretimBaslat(tarif),disabled:!malzemeYeter,style:{width:'100%',padding:'8px',borderRadius:8,border:'none',background:malzemeYeter?'linear-gradient(135deg,#C89B3C,#8B6A1A)':'rgba(255,255,255,0.05)',color:malzemeYeter?'#0F0800':'#6B7687',fontWeight:800,fontSize:'0.82rem',cursor:malzemeYeter?'pointer':'not-allowed'}},
                  malzemeYeter ? `⚒️ Üret (${tarif.sure}s)` : '❌ Hammadde Yetersiz'
                ),
          );
        })
      ),

      // ── Envanter Sekmesi ──
      tab === 'envanter' && React.createElement('div', null,
        React.createElement('div', {style:{background:SURF,border:'1px solid rgba(200,155,60,0.2)',borderRadius:12,padding:14,marginBottom:12}},
          React.createElement('div', {style:{fontFamily:"'Cinzel',serif",fontSize:'0.72rem',fontWeight:700,color:GOLD,marginBottom:8}}, '⚒️ TOPLAM ALET PUANI'),
          React.createElement('div', {style:{fontFamily:"'JetBrains Mono',monospace",fontSize:'2rem',fontWeight:900,color:GOLD}}, aletPuani.toLocaleString('tr-TR')),
          React.createElement('div', {style:{fontSize:'0.65rem',color:'#8893A1',marginTop:4}}, 'Alet puanları beyliğinin güç puanına katılır'),
        ),
        Object.keys(ALET_HAMMADDELER).map(k => {
          const items = ALET_TARIFLER.filter(t => (envanter[t.id] || 0) > 0 && Object.keys(t.malzeme).includes(k) === false);
          return null;
        }),
        Object.entries(envanter).filter(([_,adet])=>adet>0).length === 0
          ? React.createElement('div', {style:{textAlign:'center',padding:'40px 20px',color:'#8893A1',fontSize:'0.8rem'}},
              React.createElement('div', {style:{fontSize:'2rem',marginBottom:8}}, '📦'),
              'Henüz üretilmiş alet yok. Hammadde topla ve üretim başlat!'
            )
          : React.createElement('div', null,
              React.createElement('div', {style:{fontFamily:"'Cinzel',serif",fontSize:'0.65rem',fontWeight:700,color:'#8893A1',marginBottom:10,letterSpacing:'0.1em'}}, 'ÜRETİLMİŞ ALETLER'),
              Object.entries(envanter).filter(([_,adet])=>adet>0).map(([id, adet]) => {
                const tarif = ALET_TARIFLER.find(t=>t.id===id);
                if (!tarif) return null;
                return React.createElement('div', {key:id, style:{background:SURF,border:'1px solid rgba(200,155,60,0.15)',borderRadius:10,padding:'10px 12px',marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}},
                  React.createElement('div', {style:{display:'flex',alignItems:'center',gap:8}},
                    React.createElement('span', {style:{fontSize:'1.3rem'}}, tarif.emoji),
                    React.createElement('div', null,
                      React.createElement('div', {style:{fontWeight:700,color:'#EDE7DA',fontSize:'0.85rem'}}, tarif.label),
                      React.createElement('div', {style:{fontSize:'0.63rem',color:'#8893A1'}}, `Seviye ${tarif.seviye} · ${tarif.aletPuani} AP/adet`),
                    ),
                  ),
                  React.createElement('div', {style:{textAlign:'right'}},
                    React.createElement('div', {style:{fontFamily:"'JetBrains Mono',monospace",fontWeight:800,color:GOLD,fontSize:'1rem'}}, `×${adet}`),
                    React.createElement('div', {style:{fontSize:'0.63rem',color:'#4C9A6B'}}, `Toplam: +${(tarif.aletPuani*adet).toLocaleString('tr-TR')} AP`),
                  ),
                );
              })
            ),
      ),

      // ── Aktif İşlemler ──
      tab === 'aktif' && React.createElement('div', null,
        aktifÜretimler.length === 0
          ? React.createElement('div', {style:{textAlign:'center',padding:'40px 20px',color:'#8893A1',fontSize:'0.8rem'}},
              React.createElement('div', {style:{fontSize:'2rem',marginBottom:8}}, '🔄'),
              'Aktif üretim işlemi yok.'
            )
          : aktifÜretimler.map(u => {
              const tarif = ALET_TARIFLER.find(t=>t.id===u.tarifId);
              if (!tarif) return null;
              const kalan = Math.max(0, Math.ceil((u.bitisZamani - Date.now()) / 1000));
              const ilerleme = Math.min(100, Math.round(((Date.now()-u.baslamaZamani)/(u.bitisZamani-u.baslamaZamani))*100));
              return React.createElement('div', {key:u.id, style:{background:SURF,border:'1px solid rgba(200,155,60,0.2)',borderRadius:12,padding:12,marginBottom:8}},
                React.createElement('div', {style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}},
                  React.createElement('div', {style:{fontWeight:800,color:'#EDE7DA',fontSize:'0.85rem'}}, `${tarif.emoji} ${tarif.label}`),
                  React.createElement('div', {style:{fontSize:'0.72rem',color:GOLD,fontWeight:700}}, kalan>0 ? `${kalan}s kaldı` : '✅ Hazır!'),
                ),
                React.createElement('div', {style:{height:6,background:'rgba(255,255,255,0.08)',borderRadius:3,overflow:'hidden'}},
                  React.createElement('div', {style:{height:'100%',width:`${ilerleme}%`,background:`linear-gradient(90deg,${GOLD},#E8B85A)`,borderRadius:3,transition:'width 1s linear'}}),
                ),
                React.createElement('div', {style:{fontSize:'0.62rem',color:'#8893A1',marginTop:4}}, `%${ilerleme} tamamlandı · +${tarif.aletPuani} AP`),
              );
            })
      ),
    ),
  );
};
