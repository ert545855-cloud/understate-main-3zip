// ═══════════════════════════════════════════════════════════════
// Sefer / Kampanya Sistemi — SeferScreen
// ═══════════════════════════════════════════════════════════════
function SeferScreen({ profile, setProfile, showNotif }) {
  const { dark } = useTheme();
  const bg      = dark ? '#1A0E00' : '#F8FAFC';
  const surface = dark ? '#2D1800' : '#EDE7DA';
  const gold    = '#C89B3C';
  const text    = dark ? '#F5EBD7' : '#2D1800';
  const muted   = '#A9A6A0';
  const red     = '#B8423C';
  const green   = '#3E8C5A';

  const [tab, setTab]           = React.useState('active');
  const [campaigns, setCampaigns] = React.useState([]);
  const [targets, setTargets]   = React.useState([]);
  const [loading, setLoading]   = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);
  const [selTarget, setSelTarget]   = React.useState(0);
  const [recruitHours, setRecruitHours] = React.useState(12);
  const [tick, setTick] = React.useState(0);

  const jwt = () => localStorage.getItem('us_jwt');

  React.useEffect(() => {
    const t = setInterval(() => setTick(p => p+1), 10000);
    return () => clearInterval(t);
  }, []);

  React.useEffect(() => {
    fetch('/api/campaigns/targets').then(r => r.json()).then(d => { if(d.success) setTargets(d.targets || []); });
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const statusQ = tab === 'history' ? '?status=victory&status=defeat' : '';
      const url = tab === 'history' ? '/api/campaigns?status=victory' : '/api/campaigns?status=recruiting';
      const res = await fetch(url);
      const data = await res.json();
      // Tüm seferleri çek
      const [r1, r2, r3] = await Promise.all([
        fetch('/api/campaigns?status=recruiting').then(r=>r.json()),
        fetch('/api/campaigns?status=active').then(r=>r.json()),
        fetch('/api/campaigns?status=victory').then(r=>r.json()),
      ]);
      const all = [
        ...(r1.success ? r1.campaigns : []),
        ...(r2.success ? r2.campaigns : []),
        ...(r3.success ? r3.campaigns : []),
      ];
      setCampaigns(all);
    } catch(e) {} finally { setLoading(false); }
  }, [tab]);

  React.useEffect(() => { load(); }, [load, tick]);

  // Socket
  React.useEffect(() => {
    const s = window._socket;
    if (!s) return;
    const h1 = (d) => setCampaigns(prev => [d.campaign, ...prev]);
    const h2 = (d) => setCampaigns(prev => prev.map(c => c.id === d.id ? d : c));
    const h3 = (d) => {
      showNotif(d.victory ? `⚔️ ${d.name} seferi zaferle bitti!` : `💀 ${d.name} seferi yenilgiyle bitti`, d.victory ? 'success' : 'error');
      load();
    };
    s.on('campaign:new', h1);
    s.on('campaign:update', h2);
    s.on('campaign:resolved', h3);
    return () => { s.off('campaign:new', h1); s.off('campaign:update', h2); s.off('campaign:resolved', h3); };
  }, [load]);

  const createCampaign = async () => {
    try {
      const res  = await fetch('/api/campaigns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt() },
        body: JSON.stringify({ target_index: selTarget, recruit_hours: recruitHours })
      });
      const data = await res.json();
      if (data.success) {
        showNotif('⚔️ Sefer başlatıldı! Katılımcılar bekleniyor…', 'success');
        setShowCreate(false); load();
      } else showNotif(data.message || 'Hata', 'error');
    } catch(e) { showNotif('Bağlantı hatası', 'error'); }
  };

  const join = async (id) => {
    try {
      const res  = await fetch(`/api/campaigns/${id}/join`, {
        method: 'POST', headers: { Authorization: 'Bearer ' + jwt() }
      });
      const data = await res.json();
      if (data.success) { showNotif('⚔️ Sefere katıldın!', 'success'); load(); }
      else showNotif(data.message || 'Hata', 'error');
    } catch(e) { showNotif('Bağlantı hatası', 'error'); }
  };

  const leave = async (id) => {
    try {
      const res  = await fetch(`/api/campaigns/${id}/leave`, {
        method: 'POST', headers: { Authorization: 'Bearer ' + jwt() }
      });
      const data = await res.json();
      if (data.success) { showNotif('Seferden ayrıldın', 'success'); load(); }
      else showNotif(data.message || 'Hata', 'error');
    } catch(e) { showNotif('Bağlantı hatası', 'error'); }
  };

  const timeStr = (ms) => {
    if (ms <= 0) return 'Bitti';
    const h = Math.floor(ms/3600000), m = Math.ceil((ms%3600000)/60000);
    return h > 0 ? `${h}sa ${m}dk` : `${m}dk`;
  };

  const statusColor = { recruiting: gold, active: '#3B82F6', victory: green, defeat: red, cancelled: muted };
  const statusLabel = { recruiting: '⏳ Katılım Açık', active: '⚔️ Savaş Başladı', victory: '🏆 Zafer', defeat: '💀 Yenilgi', cancelled: 'İptal' };

  const filteredCampaigns = tab === 'history'
    ? campaigns.filter(c => ['victory','defeat'].includes(c.status))
    : campaigns.filter(c => ['recruiting','active'].includes(c.status));

  return (
    <div style={{ padding: '1rem', background: bg, minHeight: '100%', color: text }}>
      {/* Başlık */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: '1.2rem', fontWeight: 900, color: gold }}>⚔️ Seferler</div>
          <div style={{ fontSize: '0.72rem', color: muted }}>İttifak seferleri — birlikte savaş, birlikte kazan</div>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ background: red, color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 0.85rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
          + Sefer
        </button>
      </div>

      {/* Sekmeler */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
        {[['active','⚔️ Aktif'],['history','📜 Tarih']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
              background: tab===k ? gold : surface, color: tab===k ? '#1A0E00' : muted }}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: muted, padding: '2rem' }}>⏳</div>
      ) : filteredCampaigns.length === 0 ? (
        <div style={{ textAlign: 'center', color: muted, padding: '2rem', fontSize: '0.85rem' }}>
          {tab === 'active' ? 'Aktif sefer yok' : 'Henüz tamamlanmış sefer yok'}<br/><br/>
          {tab === 'active' && <button onClick={() => setShowCreate(true)} style={{ background: gold, color: '#1A0E00', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 700 }}>⚔️ Sefer Başlat</button>}
        </div>
      ) : filteredCampaigns.map(c => {
        const isParticipant = (c.participants||[]).some(p => p.user_id === profile?.id);
        const pct = Math.min(100, Math.round((c.participant_power / c.target_power) * 100));
        const timeLeft = c.status === 'recruiting' ? new Date(c.starts_at) - Date.now() : new Date(c.ends_at) - Date.now();
        return (
          <div key={c.id} style={{ background: surface, borderRadius: '12px', padding: '1rem', marginBottom: '0.65rem', border: `1px solid ${statusColor[c.status] || gold}44` }}>
            {/* Başlık */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: text }}>{c.name}</div>
                <div style={{ fontSize: '0.7rem', color: muted }}>🗡️ {c.organizer_name} · {c.participants?.length||0} katılımcı</div>
              </div>
              <span style={{ background: statusColor[c.status]+'22', color: statusColor[c.status], padding: '0.25rem 0.5rem', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                {statusLabel[c.status]}
              </span>
            </div>

            {/* Güç Barı */}
            <div style={{ marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: muted, marginBottom: '0.2rem' }}>
                <span>⚔️ {c.participant_power.toLocaleString('tr-TR')} güç toplandı</span>
                <span>Hedef: {c.target_power.toLocaleString('tr-TR')}</span>
              </div>
              <div style={{ height: '6px', background: dark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? green : gold, borderRadius: '3px', transition: 'width 0.3s' }} />
              </div>
            </div>

            {/* Ödüller */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              {[
                [`🪙 ${Math.floor(c.reward_sikke/(c.participants?.length||1)).toLocaleString('tr-TR')}`, gold],
                [`⭐ ${Math.floor(c.reward_xp/(c.participants?.length||1))} XP`, '#60A5FA'],
                [`💎 ${Math.floor(c.reward_merits/(c.participants?.length||1))} Liyakat`, '#A78BFA'],
              ].map(([l, col]) => (
                <span key={l} style={{ fontSize: '0.68rem', fontWeight: 700, color: col, background: col+'15', padding: '0.2rem 0.5rem', borderRadius: '12px' }}>{l}/kişi</span>
              ))}
            </div>

            {/* Süre */}
            {['recruiting','active'].includes(c.status) && (
              <div style={{ fontSize: '0.72rem', color: muted, marginBottom: '0.5rem' }}>
                {c.status === 'recruiting' ? `⏳ Sefer başlangıcı: ${timeStr(timeLeft)}` : `⚔️ Savaş bitiyor: ${timeStr(timeLeft)}`}
              </div>
            )}

            {/* Katıl / Ayrıl */}
            {c.status === 'recruiting' && (
              <button onClick={() => isParticipant ? leave(c.id) : join(c.id)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: 'none',
                  background: isParticipant ? muted+'44' : gold, color: isParticipant ? muted : '#1A0E00',
                  cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
                {isParticipant ? '❌ Ayrıl' : '⚔️ Katıl'}
              </button>
            )}
          </div>
        );
      })}

      {/* Sefer Oluştur Modalı */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: dark?'#2D1800':'#fff', borderRadius: '16px', padding: '1.5rem', maxWidth: '400px', width: '100%', border: `1px solid ${gold}44`, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: '1.1rem', fontWeight: 800, color: gold, marginBottom: '1rem' }}>⚔️ Sefer Başlat</div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.75rem', color: muted }}>Hedef Seç</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                {targets.map((t, i) => (
                  <button key={i} onClick={() => setSelTarget(i)}
                    style={{ padding: '0.65rem', borderRadius: '8px', border: `2px solid ${selTarget===i ? red : gold+'22'}`,
                      background: selTarget===i ? red+'22' : 'transparent', cursor: 'pointer', textAlign: 'left', color: text }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{t.name}</div>
                    <div style={{ fontSize: '0.68rem', color: muted }}>
                      Güç: {t.power.toLocaleString('tr-TR')} · 🪙{t.reward_sikke.toLocaleString('tr-TR')} · ⭐{t.reward_xp} XP · 💎{t.reward_merits}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.75rem', color: muted }}>Katılım Süresi (saat)</label>
              <input type="number" min={1} max={48} value={recruitHours} onChange={e => setRecruitHours(parseInt(e.target.value)||12)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: `1px solid ${gold}33`, background: dark?'#1A0E00':'#F5EBD7', color: text, marginTop: '0.25rem', boxSizing: 'border-box' }} />
              <div style={{ fontSize: '0.68rem', color: muted, marginTop: '0.2rem' }}>Bu süre dolduktan sonra savaş 1 saat sürer.</div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setShowCreate(false)}
                style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', border: `1px solid ${gold}44`, background: 'transparent', color: muted, cursor: 'pointer', fontWeight: 600 }}>İptal</button>
              <button onClick={createCampaign}
                style={{ flex: 2, padding: '0.65rem', borderRadius: '8px', border: 'none', background: red, color: '#fff', cursor: 'pointer', fontWeight: 700 }}>⚔️ Seferi Başlat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
