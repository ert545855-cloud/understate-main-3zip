// ═══════════════════════════════════════════════════════════════
// Kervan & Ticaret Yolları — TicariYollarScreen
// ═══════════════════════════════════════════════════════════════
function TicariYollarScreen({ profile, setProfile, showNotif }) {
  const { dark } = useTheme();
  const bg      = dark ? '#1A0E00' : '#F8FAFC';
  const surface = dark ? '#2D1800' : '#EDE7DA';
  const gold    = '#C89B3C';
  const text    = dark ? '#F5EBD7' : '#2D1800';
  const muted   = '#A9A6A0';

  const [tab, setTab]             = React.useState('my');   // my | active | send
  const [caravans, setCaravans]   = React.useState([]);
  const [allActive, setAllActive] = React.useState([]);
  const [loading, setLoading]     = React.useState(false);
  const [config, setConfig]       = React.useState({ cargoTypes: {}, provinces: [] });

  const [form, setForm] = React.useState({ origin: '', destination: '', cargo_type: 'tahil', cargo_amount: 100 });

  const jwt = () => localStorage.getItem('us_jwt');

  React.useEffect(() => {
    fetch('/api/caravans/config').then(r => r.json()).then(d => { if (d.success) setConfig(d); });
  }, []);

  const loadMy = React.useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/caravans', { headers: { Authorization: 'Bearer ' + jwt() } });
      const data = await res.json();
      if (data.success) setCaravans(data.caravans || []);
    } catch(e) {} finally { setLoading(false); }
  }, []);

  const loadActive = React.useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/caravans/active', { headers: { Authorization: 'Bearer ' + jwt() } });
      const data = await res.json();
      if (data.success) setAllActive(data.caravans || []);
    } catch(e) {} finally { setLoading(false); }
  }, []);

  React.useEffect(() => {
    if (tab === 'my' || tab === 'send') loadMy();
    if (tab === 'active') loadActive();
  }, [tab]);

  const sendCaravan = async () => {
    if (!form.origin || !form.destination) { showNotif('Şehir seç', 'error'); return; }
    try {
      const res  = await fetch('/api/caravans/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt() },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        showNotif('🐪 Kervan yola çıktı!', 'success');
        setTab('my'); loadMy();
      } else showNotif(data.message || 'Hata', 'error');
    } catch(e) { showNotif('Bağlantı hatası', 'error'); }
  };

  const collect = async (id) => {
    try {
      const res  = await fetch(`/api/caravans/${id}/collect`, {
        method: 'POST', headers: { Authorization: 'Bearer ' + jwt() }
      });
      const data = await res.json();
      if (data.success) {
        showNotif(data.message, 'success');
        setProfile(p => { const np = { ...p, money: (p.money||0) + data.income }; localStorage.setItem('rep_userProfile', JSON.stringify(np)); return np; });
        loadMy();
      } else showNotif(data.message || 'Hata', 'error');
    } catch(e) { showNotif('Bağlantı hatası', 'error'); }
  };

  const raid = async (id) => {
    try {
      const res  = await fetch(`/api/caravans/${id}/raid`, {
        method: 'POST', headers: { Authorization: 'Bearer ' + jwt() }
      });
      const data = await res.json();
      if (data.success) {
        if (data.result === 'raided') showNotif(`⚔️ Kervan soyuldu! +${data.loot?.toLocaleString('tr-TR')} 🪙`, 'success');
        else showNotif(data.message || '🛡️ Saldırı püskürtüldü!', 'error');
        loadActive();
      } else showNotif('Hata', 'error');
    } catch(e) { showNotif('Bağlantı hatası', 'error'); }
  };

  const statusColor = { travelling: gold, arrived: '#3E8C5A', raided: '#B8423C', collected: muted };
  const statusText  = { travelling: '🐪 Yolda', arrived: '✅ Vardı', raided: '⚔️ Soyuldu', collected: '✓ Toplandı' };
  const CARGO_ICONS = { tahil:'🌾', baharat:'🫙', kumas:'🧵', maden:'⛏️', ipek:'🪡' };

  const timeStr = (ms) => {
    const h = Math.floor(ms / 3600000), m = Math.ceil((ms%3600000)/60000);
    return h > 0 ? `${h}sa ${m}dk` : `${m}dk`;
  };

  return (
    <div style={{ padding: '1rem', background: bg, minHeight: '100%', color: text }}>
      <div style={{ fontFamily: "'Cinzel',serif", fontSize: '1.2rem', fontWeight: 900, color: gold, marginBottom: '0.25rem' }}>🐪 Ticaret Yolları</div>
      <div style={{ fontSize: '0.72rem', color: muted, marginBottom: '1rem' }}>Kervan gönder, şehirler arası ticaret yap</div>

      {/* Sekmeler */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
        {[['my','📋 Kervanlarım'],['send','+ Gönder'],['active','🗺️ Aktif Kervanlar']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.72rem',
              background: tab===k ? gold : surface, color: tab===k ? '#1A0E00' : muted }}>
            {l}
          </button>
        ))}
      </div>

      {/* Kervan Gönder */}
      {tab === 'send' && (
        <div style={{ background: surface, borderRadius: '12px', padding: '1rem', border: `1px solid ${gold}22` }}>
          <div style={{ fontWeight: 700, color: gold, marginBottom: '0.75rem', fontSize: '0.9rem' }}>🐪 Yeni Kervan</div>
          <div style={{ fontSize: '0.72rem', color: muted, marginBottom: '0.75rem' }}>
            Aynı anda en fazla 3 aktif kervan gönderebilirsin.<br/>
            Kervanlar başka oyuncular tarafından soyulabilir!
          </div>
          {[['origin','Kalkış Şehri'],['destination','Varış Şehri']].map(([k,l]) => (
            <div key={k} style={{ marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', color: muted }}>{l}</label>
              <select value={form[k]} onChange={e => setForm(f => ({...f, [k]: e.target.value}))}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: `1px solid ${gold}33`, background: dark?'#1A0E00':'#F5EBD7', color: text, marginTop: '0.25rem' }}>
                <option value="">— Şehir Seç —</option>
                {config.provinces.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          ))}
          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', color: muted }}>Kargo Türü</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: '0.25rem' }}>
              {Object.entries(config.cargoTypes).map(([k,v]) => (
                <button key={k} onClick={() => setForm(f => ({...f, cargo_type: k}))}
                  style={{ padding: '0.6rem', borderRadius: '8px', border: `2px solid ${form.cargo_type===k ? gold : gold+'22'}`,
                    background: form.cargo_type===k ? gold+'22' : 'transparent', cursor: 'pointer', fontSize: '0.78rem', color: text, textAlign: 'left' }}>
                  <span style={{ fontSize: '1.1rem' }}>{CARGO_ICONS[k]}</span> {v.name}<br/>
                  <span style={{ fontSize: '0.65rem', color: muted }}>+{v.baseIncome.toLocaleString()} 🪙 · {v.travelHours}sa</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.75rem', color: muted }}>Miktar (10–1000)</label>
            <input type="number" min={10} max={1000} value={form.cargo_amount}
              onChange={e => setForm(f => ({...f, cargo_amount: parseInt(e.target.value)||100}))}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: `1px solid ${gold}33`, background: dark?'#1A0E00':'#F5EBD7', color: text, marginTop: '0.25rem', boxSizing: 'border-box' }} />
          </div>
          <button onClick={sendCaravan}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: gold, color: '#1A0E00', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
            🐪 Kervanı Yola Çıkar
          </button>
        </div>
      )}

      {/* Kendi Kervanlarım */}
      {tab === 'my' && (loading ? (
        <div style={{ textAlign: 'center', color: muted, padding: '2rem' }}>⏳</div>
      ) : caravans.length === 0 ? (
        <div style={{ textAlign: 'center', color: muted, padding: '2rem', fontSize: '0.85rem' }}>
          Henüz kervan yok<br/><br/>
          <button onClick={() => setTab('send')} style={{ background: gold, color: '#1A0E00', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 700 }}>🐪 Kervan Gönder</button>
        </div>
      ) : caravans.map(c => {
        const remaining = new Date(c.arrives_at) - Date.now();
        const isArrived = c.status === 'arrived';
        return (
          <div key={c.id} style={{ background: surface, borderRadius: '10px', padding: '0.85rem', marginBottom: '0.5rem', border: `1px solid ${statusColor[c.status] || gold}33` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.8rem' }}>{CARGO_ICONS[c.cargo_type] || '📦'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{c.origin} → {c.destination}</div>
                <div style={{ fontSize: '0.7rem', color: muted }}>{c.cargo_amount} birim kargo · +{Number(c.income).toLocaleString('tr-TR')} 🪙</div>
                <div style={{ fontSize: '0.7rem', color: statusColor[c.status] || gold, marginTop: '0.2rem', fontWeight: 600 }}>
                  {statusText[c.status]} {c.status==='travelling' && remaining>0 ? `· ${timeStr(remaining)} kaldı` : ''}
                </div>
              </div>
              {isArrived && (
                <button onClick={() => collect(c.id)}
                  style={{ background: '#3E8C5A', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 0.75rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
                  Topla 💰
                </button>
              )}
            </div>
          </div>
        );
      }))}

      {/* Aktif Kervanlar (soyulabilir) */}
      {tab === 'active' && (loading ? (
        <div style={{ textAlign: 'center', color: muted, padding: '2rem' }}>⏳</div>
      ) : allActive.length === 0 ? (
        <div style={{ textAlign: 'center', color: muted, padding: '2rem', fontSize: '0.85rem' }}>Şu an yolda başka kervan yok</div>
      ) : (
        <div>
          <div style={{ fontSize: '0.75rem', color: muted, marginBottom: '0.75rem', background: '#B8423C22', borderRadius: '8px', padding: '0.5rem 0.75rem', border: '1px solid #B8423C44' }}>
            ⚠️ Bu kervanları soyabilirsin. Başarı şansa ve güç farkına bağlıdır.
          </div>
          {allActive.map(c => (
            <div key={c.id} style={{ background: surface, borderRadius: '10px', padding: '0.85rem', marginBottom: '0.5rem', border: `1px solid ${gold}22` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '1.8rem' }}>{CARGO_ICONS[c.cargo_type] || '📦'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{c.origin} → {c.destination}</div>
                  <div style={{ fontSize: '0.7rem', color: muted }}>{c.owner_username} · {c.cargo_amount} birim</div>
                  <div style={{ fontSize: '0.7rem', color: gold }}>⏳ {timeStr(new Date(c.arrives_at) - Date.now())} kaldı</div>
                </div>
                <button onClick={() => raid(c.id)}
                  style={{ background: '#B8423C', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 0.65rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>
                  ⚔️ Soy
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
