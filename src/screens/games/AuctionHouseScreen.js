// ═══════════════════════════════════════════════════════════════
// Açık Artırma Evi — AuctionHouseScreen
// ═══════════════════════════════════════════════════════════════
function AuctionHouseScreen({ profile, setProfile, showNotif }) {
  const { dark } = useTheme();
  const bg      = dark ? '#1A0E00' : '#F8FAFC';
  const surface = dark ? '#2D1800' : '#EDE7DA';
  const gold    = '#C89B3C';
  const text    = dark ? '#F5EBD7' : '#2D1800';
  const muted   = '#A9A6A0';

  const [tab, setTab]           = React.useState('active');   // active | my | bids
  const [auctions, setAuctions] = React.useState([]);
  const [loading, setLoading]   = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const [bidAmount, setBidAmount] = React.useState('');
  const [filterType, setFilterType] = React.useState('');

  // Yeni listeleme formu
  const [form, setForm] = React.useState({
    item_type: 'sikke', item_name: '', starting_price: '', buyout_price: '', duration_hours: '24'
  });

  const jwt = () => localStorage.getItem('us_jwt');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/auction';
      if (tab === 'my')   url = '/api/auction/my';
      if (tab === 'bids') url = '/api/auction/my-bids';
      if (tab === 'active' && filterType) url += `?item_type=${filterType}`;
      const headers = tab !== 'active' ? { Authorization: 'Bearer ' + jwt() } : {};
      const res  = await fetch(url, { headers });
      const data = await res.json();
      if (data.success) setAuctions(data.auctions || []);
    } catch(e) {} finally { setLoading(false); }
  }, [tab, filterType]);

  React.useEffect(() => { load(); }, [load]);

  // Socket: gerçek zamanlı güncelleme
  React.useEffect(() => {
    const s = window._socket;
    if (!s) return;
    const handler = (d) => {
      setAuctions(prev => prev.map(a => a.id === d.auctionId ? { ...a, current_price: d.newPrice, highest_bidder_name: d.bidder, bid_count: (a.bid_count||0)+1 } : a));
    };
    s.on('auction:update', handler);
    return () => s.off('auction:update', handler);
  }, []);

  const timeLeft = (endsAt) => {
    const ms = new Date(endsAt) - Date.now();
    if (ms <= 0) return 'Sona erdi';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}sa ${m}dk` : `${m}dk`;
  };

  const placeBid = async () => {
    if (!selected) return;
    const amount = parseInt(bidAmount);
    if (!amount) { showNotif('Geçerli bir teklif gir', 'error'); return; }
    try {
      const res  = await fetch(`/api/auction/${selected.id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt() },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (data.success) {
        showNotif(data.message || '✅ Teklif verildi!', 'success');
        setSelected(null); setBidAmount(''); load();
      } else showNotif(data.message || 'Hata', 'error');
    } catch(e) { showNotif('Bağlantı hatası', 'error'); }
  };

  const createListing = async () => {
    if (!form.item_name || !form.starting_price) { showNotif('Tüm alanları doldur', 'error'); return; }
    try {
      const res  = await fetch('/api/auction/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt() },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        showNotif('🏺 Artırma oluşturuldu!', 'success');
        setShowCreate(false); setForm({ item_type:'sikke', item_name:'', starting_price:'', buyout_price:'', duration_hours:'24' });
        setTab('my'); load();
      } else showNotif(data.message || 'Hata', 'error');
    } catch(e) { showNotif('Bağlantı hatası', 'error'); }
  };

  const ITEM_ICONS = { sikke:'🪙', altin:'⚜️', silah:'⚔️', mermi:'💣', esya:'📦' };
  const ITEM_NAMES = { sikke:'Sikke', altin:'Altın', silah:'Silah', mermi:'Mermi', esya:'Eşya' };

  const cardStyle = {
    background: surface, borderRadius: '10px', padding: '0.85rem',
    border: `1px solid ${dark ? 'rgba(200,155,60,0.15)' : 'rgba(0,0,0,0.07)'}`,
    marginBottom: '0.5rem', cursor: 'pointer'
  };

  return (
    <div style={{ padding: '1rem', background: bg, minHeight: '100%', color: text }}>
      {/* Başlık */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: '1.2rem', fontWeight: 900, color: gold }}>🏺 Artırma Evi</div>
          <div style={{ fontSize: '0.72rem', color: muted }}>Osmanlı çarşısında al-sat yap</div>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ background: gold, color: '#1A0E00', border: 'none', borderRadius: '8px', padding: '0.5rem 0.85rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
          + Listele
        </button>
      </div>

      {/* Sekmeler */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {[['active','🏛️ Aktif'],['my','📋 İlanlarım'],['bids','🤝 Tekliflerim']].map(([k,l]) => (
          <button key={k} onClick={() => { setTab(k); }}
            style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem',
              background: tab === k ? gold : surface, color: tab === k ? '#1A0E00' : muted }}>
            {l}
          </button>
        ))}
      </div>

      {/* Filtreler (sadece aktif sekmede) */}
      {tab === 'active' && (
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          {['','sikke','altin','silah','mermi','esya'].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              style={{ padding: '0.3rem 0.65rem', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.72rem',
                background: filterType === t ? gold : surface, color: filterType === t ? '#1A0E00' : muted, fontWeight: 600 }}>
              {t ? (ITEM_ICONS[t] + ' ' + ITEM_NAMES[t]) : '🔍 Tümü'}
            </button>
          ))}
        </div>
      )}

      {/* Artırma Listesi */}
      {loading ? (
        <div style={{ textAlign: 'center', color: muted, padding: '2rem' }}>⏳ Yükleniyor…</div>
      ) : auctions.length === 0 ? (
        <div style={{ textAlign: 'center', color: muted, padding: '2rem', fontSize: '0.85rem' }}>Henüz artırma yok</div>
      ) : auctions.map(a => (
        <div key={a.id} style={cardStyle} onClick={() => { setSelected(a); setBidAmount(''); }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '2rem' }}>{ITEM_ICONS[a.item_type] || '📦'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.item_name}</div>
              <div style={{ fontSize: '0.7rem', color: muted }}>{a.seller_username} · {a.bid_count} teklif · ⏳{timeLeft(a.ends_at)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, color: gold, fontSize: '0.9rem' }}>{Number(a.current_price).toLocaleString('tr-TR')} 🪙</div>
              {a.buyout_price && <div style={{ fontSize: '0.65rem', color: muted }}>Hemen al: {Number(a.buyout_price).toLocaleString('tr-TR')}</div>}
            </div>
          </div>
        </div>
      ))}

      {/* Teklif Modalı */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: dark ? '#2D1800' : '#fff', borderRadius: '16px', padding: '1.5rem', maxWidth: '380px', width: '100%', border: `1px solid ${gold}44` }}>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: '1.1rem', fontWeight: 800, color: gold, marginBottom: '0.5rem' }}>🏺 {selected.item_name}</div>
            <div style={{ fontSize: '0.8rem', color: muted, marginBottom: '1rem' }}>
              Satıcı: {selected.seller_username} · {selected.bid_count} teklif<br/>
              Güncel fiyat: <strong style={{ color: gold }}>{Number(selected.current_price).toLocaleString('tr-TR')} 🪙</strong><br/>
              Min. teklif: <strong>{Math.ceil(selected.current_price * 1.05).toLocaleString('tr-TR')} 🪙</strong><br/>
              {selected.buyout_price && <>Hemen al: <strong>{Number(selected.buyout_price).toLocaleString('tr-TR')} 🪙</strong><br/></>}
              Bitiş: {timeLeft(selected.ends_at)}
            </div>
            <input value={bidAmount} onChange={e => setBidAmount(e.target.value)} type="number"
              placeholder={`Min. ${Math.ceil(selected.current_price * 1.05).toLocaleString('tr-TR')}`}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: `1px solid ${gold}44`, background: dark?'#1A0E00':'#F5EBD7', color: text, fontSize: '0.9rem', marginBottom: '0.75rem', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setSelected(null)}
                style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', border: `1px solid ${gold}44`, background: 'transparent', color: muted, cursor: 'pointer', fontWeight: 600 }}>İptal</button>
              <button onClick={placeBid}
                style={{ flex: 2, padding: '0.65rem', borderRadius: '8px', border: 'none', background: gold, color: '#1A0E00', cursor: 'pointer', fontWeight: 700 }}>Teklif Ver 🤝</button>
            </div>
            {selected.buyout_price && (
              <button onClick={async () => { setBidAmount(selected.buyout_price); await placeBid(); }}
                style={{ width: '100%', marginTop: '0.5rem', padding: '0.65rem', borderRadius: '8px', border: 'none', background: '#3E8C5A', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
                ⚡ Hemen Al — {Number(selected.buyout_price).toLocaleString('tr-TR')} 🪙
              </button>
            )}
          </div>
        </div>
      )}

      {/* Yeni Listeleme Modalı */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: dark ? '#2D1800' : '#fff', borderRadius: '16px', padding: '1.5rem', maxWidth: '380px', width: '100%', border: `1px solid ${gold}44` }}>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: '1.1rem', fontWeight: 800, color: gold, marginBottom: '1rem' }}>🏺 Yeni İlan</div>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', color: muted }}>Eşya Türü</label>
              <select value={form.item_type} onChange={e => setForm(f => ({...f, item_type: e.target.value}))}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: `1px solid ${gold}44`, background: dark?'#1A0E00':'#F5EBD7', color: text, marginTop: '0.25rem' }}>
                {Object.entries(ITEM_NAMES).map(([k,v]) => <option key={k} value={k}>{ITEM_ICONS[k]} {v}</option>)}
              </select>
            </div>
            {[['item_name','Eşya Adı','text'],['starting_price','Başlangıç Fiyatı (🪙)','number'],['buyout_price','Hemen Al Fiyatı (opsiyonel)','number'],['duration_hours','Süre (saat, 1–72)','number']].map(([k,l,t]) => (
              <div key={k} style={{ marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', color: muted }}>{l}</label>
                <input value={form[k]} onChange={e => setForm(f => ({...f, [k]: e.target.value}))} type={t}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: `1px solid ${gold}44`, background: dark?'#1A0E00':'#F5EBD7', color: text, marginTop: '0.25rem', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button onClick={() => setShowCreate(false)}
                style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', border: `1px solid ${gold}44`, background: 'transparent', color: muted, cursor: 'pointer', fontWeight: 600 }}>İptal</button>
              <button onClick={createListing}
                style={{ flex: 2, padding: '0.65rem', borderRadius: '8px', border: 'none', background: gold, color: '#1A0E00', cursor: 'pointer', fontWeight: 700 }}>Listele 🏺</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
