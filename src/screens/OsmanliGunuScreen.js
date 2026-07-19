window.OsmanliGunuScreen = function({ profile, onNavigate, showNotif }) {
  const G='#C89B3C',BG='#0F0800',T='#F5EBD7',M='#A9A6A0',S='#2D1800',GR='#3E8C5A',R='#B8423C';
  const SORULAR = [
    {q:'Osmanlı İmparatorluğu hangi yılda kuruldu?',a:'1299',opts:['1071','1299','1453','1517'],bilgi:'Osmanlı Devleti, 1299\'da Osman Bey tarafından kuruldu.'},
    {q:'İstanbul hangi tarihte fethedildi?',a:'1453',opts:['1354','1402','1453','1492'],bilgi:'İstanbul, 29 Mayıs 1453\'te Fatih Sultan Mehmed tarafından fethedildi.'},
    {q:'Kanuni Sultan Süleyman kaç yıl hükümdarlık etti?',a:'46',opts:['26','36','46','56'],bilgi:'Kanuni Sultan Süleyman 1520-1566 arasında 46 yıl hükümdarlık etti.'},
    {q:'Osmanlı donanmasının en büyük zaferi hangisidir?',a:'Preveze',opts:['Lepanto','Preveze','İnebahtı','Navarin'],bilgi:'1538\'deki Preveze Deniz Savaşı, Osmanlı\'nın en büyük deniz zaferlerinden biridir.'},
    {q:'Yeniçeri ocağı hangi padişah döneminde kaldırıldı?',a:'II. Mahmud',opts:['I. Mahmud','III. Selim','II. Mahmud','Abdülmecid'],bilgi:'II. Mahmud 1826\'da Yeniçeri Ocağı\'nı kaldırdı — bu olaya "Vaka-i Hayriye" denir.'},
    {q:'Osmanlı\'da en uzun saltanat süren padişah kimdir?',a:'II. Abdülhamid',opts:['I. Süleyman','II. Selim','II. Abdülhamid','Osman Gazi'],bilgi:'II. Abdülhamid 33 yıl (1876–1909) hükümdarlık yaptı.'},
    {q:'Topkapı Sarayı nerede inşa edildi?',a:'İstanbul',opts:['Bursa','Edirne','İstanbul','İznik'],bilgi:'Topkapı Sarayı, Fatih Sultan Mehmed tarafından 1459\'da İstanbul\'da inşa edildi.'},
    {q:'Osmanlı ordusunda "defterdar" ne anlama gelir?',a:'Hazine sorumlusu',opts:['Ordu komutanı','Kadı','Hazine sorumlusu','Saray şefi'],bilgi:'Defterdar, Osmanlı\'da maliye ve hazineden sorumlu üst düzey devlet görevlisidir.'},
    {q:'Sokullu Mehmed Paşa hangi dönemde sadrazamlık yaptı?',a:'Kanuni & II. Selim',opts:['Fatih dönemi','Yavuz dönemi','Kanuni & II. Selim','III. Murad dönemi'],bilgi:'Sokullu, Kanuni\'den II. Murad\'a kadar 14 yıl sadrazamlık yaptı.'},
    {q:'Celali İsyanları hangi yüzyılda yaşandı?',a:'17. yüzyıl',opts:['15. yüzyıl','16. yüzyıl','17. yüzyıl','18. yüzyıl'],bilgi:'Anadolu\'daki büyük Celali isyanları ağırlıklı olarak 17. yüzyılda yaşandı.'},
    {q:'Osmanlı\'da "Divan-ı Hümayun" nedir?',a:'Devlet meclisi',opts:['Ordu merkezi','Devlet meclisi','Saray mutfağı','Din mahkemesi'],bilgi:'Divan-ı Hümayun, padişahın başkanlığında toplanan yüksek devlet meclisidir.'},
    {q:'Mimar Sinan kaç cami inşa etmiştir?',a:'300+',opts:['50','150','300+','500+'],bilgi:'Mimar Sinan, 16. yüzyılda 300\'den fazla yapı inşa etmiş efsanevi Osmanlı mimarıdır.'},
    {q:'Osmanlı\'da "Kapı kulu" ne anlama gelir?',a:'Devşirme askerleri',opts:['Saray muhafızı','Devşirme askerleri','Süvari birliği','Deniz kuvvetleri'],bilgi:'Kapı kulları, sarayda ve orduda görev yapan devşirme kökenli askeri sınıftır.'},
    {q:'Lale Devri hangi padişah döneminde yaşandı?',a:'III. Ahmed',opts:['I. Mahmud','II. Mustafa','III. Ahmed','I. Abdülhamid'],bilgi:'Lale Devri, III. Ahmed\'in 1718-1730 yılları arasındaki barış ve refah dönemidir.'},
    {q:'Osmanlı\'nın son padişahı kimdir?',a:'Mehmed VI Vahideddin',opts:['Abdülmecid II','Mehmed VI Vahideddin','Abdülhamid II','V. Murad'],bilgi:'Mehmed VI Vahideddin, 1922\'de saltanatın kaldırılmasıyla tahtu terk eden son Osmanlı padişahıdır.'},
  ];

  const todayIdx = new Date().getDate() % SORULAR.length;
  const soru = SORULAR[todayIdx];
  const todayKey = new Date().toISOString().split('T')[0];
  const savedKey = `rep_osmanliGunu_${todayKey}`;

  const [selected, setSelected] = React.useState(null);
  const [showInfo, setShowInfo] = React.useState(false);
  const [streak, setStreak] = React.useState(0);

  React.useEffect(() => {
    const saved = (() => { try { return JSON.parse(localStorage.getItem(savedKey)||'null'); } catch { return null; } })();
    if (saved) { setSelected(saved.selected); setShowInfo(true); }
    const s = (() => { try { return JSON.parse(localStorage.getItem('rep_quizStreak')||'{}'); } catch { return {}; } })();
    setStreak(s.count||0);
  }, []);

  const answer = (opt) => {
    if (selected) return;
    setSelected(opt);
    setShowInfo(true);
    const correct = opt === soru.a;
    localStorage.setItem(savedKey, JSON.stringify({ selected: opt, correct }));
    // streak
    const s = (() => { try { return JSON.parse(localStorage.getItem('rep_quizStreak')||'{}'); } catch { return {}; } })();
    const yesterday = new Date(Date.now()-86400000).toISOString().split('T')[0];
    const newCount = (s.lastDate === yesterday || !s.lastDate) ? (s.count||0)+1 : 1;
    localStorage.setItem('rep_quizStreak', JSON.stringify({ lastDate: todayKey, count: newCount }));
    setStreak(newCount);
    if (correct) showNotif && showNotif('🎉 Doğru! +25 XP kazandın', 'success');
    else showNotif && showNotif('❌ Yanlış — tarihi bilgin artacak!', 'info');
  };

  const BILGILER = [
    {emoji:'📜',fact:'Osmanlı İmparatorluğu 600 yıl boyunca 3 kıta üzerinde hüküm sürdü.'},
    {emoji:'🌍',fact:'Zirve döneminde Osmanlı nüfusu 30 milyonu aşıyordu.'},
    {emoji:'⚓',fact:'Osmanlı donanması Akdeniz\'i yüzyıllarca kontrol altında tuttu.'},
    {emoji:'🕌',fact:'İstanbul\'daki Süleymaniye Camii 1557\'de Mimar Sinan tarafından tamamlandı.'},
    {emoji:'📊',fact:'Osmanlı\'nın en önemli gelir kaynakları tarım, ticaret ve cizye vergisiydi.'},
  ][todayIdx % 5];

  return React.createElement('div',{style:{minHeight:'100vh',background:BG,fontFamily:"'Inter',sans-serif",paddingBottom:80}},
    React.createElement('div',{style:{background:'linear-gradient(135deg,#1a0800,#2d1600)',borderBottom:'1px solid rgba(200,155,60,0.2)',padding:'14px 16px'}},
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:10}},
        onNavigate && React.createElement('button',{onClick:()=>onNavigate('home'),style:{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'6px 10px',color:M,fontSize:'0.75rem',cursor:'pointer'}},'← Geri'),
        React.createElement('span',{style:{fontSize:'1.5rem'}},'🕌'),
        React.createElement('div',null,
          React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:'1.1rem',color:G}},'Osmanlı Günü'),
          React.createElement('div',{style:{fontSize:'0.62rem',color:M}},`Her gün yeni soru • Quiz serisi: ${streak} gün`)
        )
      )
    ),
    React.createElement('div',{style:{padding:'12px'}},
      // Günlük bilgi
      React.createElement('div',{style:{background:`linear-gradient(135deg,${G}18,${S})`,border:`1px solid ${G}33`,borderRadius:14,padding:'14px',marginBottom:14}},
        React.createElement('div',{style:{fontSize:'0.65rem',fontWeight:700,color:G,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}},'📖 Günlük Osmanlı Bilgisi'),
        React.createElement('div',{style:{fontSize:'2rem',marginBottom:6}},BILGILER.emoji),
        React.createElement('div',{style:{fontSize:'0.85rem',color:T,lineHeight:1.6}},BILGILER.fact)
      ),
      // Quiz kartı
      React.createElement('div',{style:{background:S,border:`1px solid rgba(200,155,60,0.2)`,borderRadius:14,padding:'16px',marginBottom:12}},
        React.createElement('div',{style:{fontSize:'0.65rem',fontWeight:700,color:G,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}},'🎯 Günlük Quiz'),
        React.createElement('div',{style:{fontSize:'0.95rem',fontWeight:700,color:T,lineHeight:1.5,marginBottom:14}},soru.q),
        React.createElement('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}},
          soru.opts.map(opt=>{
            const isSelected = selected===opt, isCorrect=opt===soru.a;
            let bg='rgba(255,255,255,0.04)', border='rgba(255,255,255,0.1)', color=M;
            if (selected) {
              if (isCorrect) { bg=GR+'22'; border=GR; color=GR; }
              else if (isSelected && !isCorrect) { bg=R+'22'; border=R; color=R; }
            }
            return React.createElement('button',{key:opt,onClick:()=>answer(opt),disabled:!!selected,style:{padding:'10px 8px',borderRadius:10,border:`2px solid ${border}`,background:bg,color:color,fontWeight:600,fontSize:'0.8rem',cursor:selected?'default':'pointer',transition:'all 0.2s',textAlign:'left'}},
              isCorrect && selected ? '✅ '+opt : isSelected && !isCorrect ? '❌ '+opt : opt
            );
          })
        )
      ),
      // Açıklama
      showInfo && React.createElement('div',{style:{background:GR+'15',border:`1px solid ${GR}44`,borderRadius:14,padding:'14px'}},
        React.createElement('div',{style:{fontSize:'0.65rem',fontWeight:700,color:GR,marginBottom:6}},'💡 AÇIKLAMA'),
        React.createElement('div',{style:{fontSize:'0.82rem',color:T,lineHeight:1.6}},soru.bilgi)
      ),
      !selected && React.createElement('div',{style:{textAlign:'center',marginTop:12,fontSize:'0.72rem',color:M}},'Yarın yeni soru gelecek!')
    )
  );
};
