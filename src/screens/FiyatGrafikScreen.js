window.FiyatGrafikScreen = function({ profile, onNavigate }) {
  const G='#C89B3C',BG='#0F0800',T='#F5EBD7',M='#A9A6A0',S='#2D1800',GR='#3E8C5A',R='#B8423C';
  const [tab, setTab] = React.useState('grafik');
  const [selectedItem, setSelectedItem] = React.useState('bugday');

  const ITEMS = [
    {id:'bugday',   label:'🌾 Buğday',    base:120,  volatility:0.08, color:G},
    {id:'demir',    label:'🔩 Demir',      base:450,  volatility:0.12, color:'#A0AEC0'},
    {id:'baharat',  label:'🌶️ Baharat',   base:800,  volatility:0.18, color:R},
    {id:'ipek',     label:'🧵 İpek',       base:1200, volatility:0.15, color:'#F0A500'},
    {id:'altin_m',  label:'⚜️ Altın Mad.', base:3500, volatility:0.2,  color:G},
    {id:'kereste',  label:'🪵 Kereste',    base:280,  volatility:0.1,  color:'#8B5E3C'},
  ];

  // Deterministik fiyat geçmişi (seed tabanlı)
  const genHistory = (item, days=7) => {
    let price = item.base;
    const data = [];
    for (let i=days; i>=0; i--) {
      const seed = (item.id.charCodeAt(0)*31+i*17)%100/100;
      const change = (seed-0.48)*2*item.volatility;
      price = Math.max(item.base*0.5, Math.round(price*(1+change)));
      const d = new Date(Date.now()-i*86400000);
      data.push({ label: i===0?'Bugün':`${i}g`, price, date:d.toLocaleDateString('tr-TR',{day:'2-digit',month:'short'}) });
    }
    return data;
  };

  const item = ITEMS.find(i=>i.id===selectedItem)||ITEMS[0];
  const hist = genHistory(item);
  const min = Math.min(...hist.map(h=>h.price));
  const max = Math.max(...hist.map(h=>h.price));
  const range = max-min||1;
  const W=280, H=100, pad=8;
  const pts = hist.map((h,i)=>{
    const x = pad + i*(W-pad*2)/(hist.length-1);
    const y = H-pad - (h.price-min)/range*(H-pad*2);
    return {x,y,h};
  });
  const polyline = pts.map(p=>`${p.x},${p.y}`).join(' ');
  const areaPath = `M${pts[0].x},${H} L${polyline.split(' ').map(p=>`L${p}`).join(' ').slice(1)} L${pts[pts.length-1].x},${H} Z`;
  const last = hist[hist.length-1].price;
  const prev = hist[hist.length-2].price;
  const change = ((last-prev)/prev*100).toFixed(1);
  const up = last>=prev;

  // Döviz kuru (simulated)
  const KURLAR = [
    {from:'🪙 Sikke',  to:'⚜️ Altın', rate:'1 Altın = 50 Sikke',    change:'+2.1%', up:true},
    {from:'⚜️ Altın',  to:'💎 Liyakat','rate':'1 Liyakat = 5 Altın', change:'-0.8%', up:false},
    {from:'🪙 Sikke',  to:'💎 Liyakat','rate':'1 Liyakat = 250 Sikke',change:'+1.2%', up:true},
    {from:'⚜️ Altın',  to:'🗡️ Silah',  'rate':'1 Silah = 3 Altın',   change:'+0.5%', up:true},
  ];

  return React.createElement('div',{style:{minHeight:'100vh',background:BG,fontFamily:"'Inter',sans-serif",paddingBottom:80}},
    React.createElement('div',{style:{background:'linear-gradient(135deg,#1a0800,#2d1600)',borderBottom:'1px solid rgba(200,155,60,0.2)',padding:'14px 16px'}},
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:10}},
        onNavigate&&React.createElement('button',{onClick:()=>onNavigate('home'),style:{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'6px 10px',color:M,fontSize:'0.75rem',cursor:'pointer'}},'← Geri'),
        React.createElement('span',{style:{fontSize:'1.5rem'}},'📊'),
        React.createElement('div',null,
          React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:'1.1rem',color:G}},'Pazar & Döviz'),
          React.createElement('div',{style:{fontSize:'0.62rem',color:M}},'Fiyat grafiği ve kur takibi')
        )
      )
    ),
    React.createElement('div',{style:{padding:'12px'}},
      // Tabs
      React.createElement('div',{style:{display:'flex',gap:6,marginBottom:12}},
        [{id:'grafik',l:'📊 Fiyat Grafiği'},{id:'kur',l:'💱 Döviz Kuru'}].map(t=>
          React.createElement('button',{key:t.id,onClick:()=>setTab(t.id),style:{flex:1,padding:'8px',borderRadius:10,border:`2px solid ${tab===t.id?G:G+'22'}`,background:tab===t.id?G+'18':'transparent',color:tab===t.id?G:M,fontWeight:700,fontSize:'0.78rem',cursor:'pointer'}},t.l)
        )
      ),
      tab==='grafik'&&React.createElement('div',null,
        // Item selector
        React.createElement('div',{style:{display:'flex',gap:6,overflowX:'auto',paddingBottom:4,marginBottom:12}},
          ITEMS.map(it=>
            React.createElement('button',{key:it.id,onClick:()=>setSelectedItem(it.id),style:{flexShrink:0,padding:'5px 10px',borderRadius:20,border:`1px solid ${selectedItem===it.id?it.color:it.color+'33'}`,background:selectedItem===it.id?it.color+'22':'transparent',color:selectedItem===it.id?it.color:M,fontSize:'0.68rem',fontWeight:700,cursor:'pointer'}},it.label)
          )
        ),
        // Price header
        React.createElement('div',{style:{background:S,borderRadius:14,padding:'16px',marginBottom:12,border:`1px solid ${item.color}33`}},
          React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}},
            React.createElement('div',null,
              React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontSize:'0.8rem',color:M}},item.label),
              React.createElement('div',{style:{fontFamily:"'JetBrains Mono',monospace",fontSize:'1.8rem',fontWeight:900,color:item.color}},`🪙${last.toLocaleString('tr-TR')}`),
              React.createElement('div',{style:{fontSize:'0.72rem',fontWeight:700,color:up?GR:R}},`${up?'▲':'▼'} ${Math.abs(change)}% (7g)`)
            ),
            React.createElement('div',{style:{textAlign:'right',fontSize:'0.62rem',color:M}},
              React.createElement('div',null,`Min: 🪙${min.toLocaleString('tr-TR')}`),
              React.createElement('div',null,`Max: 🪙${max.toLocaleString('tr-TR')}`)
            )
          ),
          // SVG Chart
          React.createElement('svg',{width:'100%',viewBox:`0 0 ${W} ${H}`,style:{overflow:'visible'}},
            React.createElement('defs',null,
              React.createElement('linearGradient',{id:'areaGrad',x1:0,y1:0,x2:0,y2:1},
                React.createElement('stop',{offset:'0%',stopColor:item.color,stopOpacity:0.3}),
                React.createElement('stop',{offset:'100%',stopColor:item.color,stopOpacity:0})
              )
            ),
            React.createElement('path',{d:areaPath,fill:'url(#areaGrad)'}),
            React.createElement('polyline',{points:polyline,fill:'none',stroke:item.color,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'}),
            pts.map((p,i)=>React.createElement('circle',{key:i,cx:p.x,cy:p.y,r:i===pts.length-1?4:2,fill:item.color})),
            pts.map((p,i)=>i%2===0&&React.createElement('text',{key:'l'+i,x:p.x,y:H+2,textAnchor:'middle',fontSize:7,fill:M},p.h.label))
          )
        ),
        // Price table
        React.createElement('div',{style:{background:S,borderRadius:14,padding:'14px',border:'1px solid rgba(255,255,255,0.06)'}},
          React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontSize:'0.72rem',color:G,fontWeight:700,marginBottom:8}},'📋 7 Günlük Veri'),
          hist.slice().reverse().map((h,i)=>
            React.createElement('div',{key:i,style:{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}},
              React.createElement('span',{style:{fontSize:'0.72rem',color:M}},h.label==='Bugün'?'🟢 Bugün':h.date),
              React.createElement('span',{style:{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.75rem',fontWeight:700,color:i===0?item.color:T}},`🪙${h.price.toLocaleString('tr-TR')}`)
            )
          )
        )
      ),
      tab==='kur'&&React.createElement('div',null,
        React.createElement('div',{style:{background:S,borderRadius:14,padding:'14px',border:'1px solid rgba(200,155,60,0.15)',marginBottom:12}},
          React.createElement('div',{style:{fontFamily:"'Cinzel',serif",fontSize:'0.72rem',color:G,fontWeight:700,marginBottom:12}},'💱 Anlık Kurlar'),
          KURLAR.map((k,i)=>
            React.createElement('div',{key:i,style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:i<KURLAR.length-1?'1px solid rgba(255,255,255,0.05)':'none'}},
              React.createElement('div',null,
                React.createElement('div',{style:{fontSize:'0.75rem',color:T,fontWeight:600}},k.rate),
                React.createElement('div',{style:{fontSize:'0.62rem',color:M,marginTop:2}},`${k.from} → ${k.to}`)
              ),
              React.createElement('span',{style:{fontSize:'0.72rem',fontWeight:800,color:k.up?GR:R}},k.change)
            )
          )
        ),
        React.createElement('div',{style:{background:GR+'10',border:`1px solid ${GR}33`,borderRadius:14,padding:'12px'}},
          React.createElement('div',{style:{fontSize:'0.72rem',color:GR,fontWeight:700,marginBottom:4}},'💡 Bilgi'),
          React.createElement('div',{style:{fontSize:'0.72rem',color:M,lineHeight:1.5}},'Kurlar her gün güncellenir. Altın → Sikke dönüşümü banka üzerinden yapılır.')
        )
      )
    )
  );
};
