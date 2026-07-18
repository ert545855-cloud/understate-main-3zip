// ═══════════════════════════════════════════════════════
// SEZON SİSTEMİ — 30 Günlük Sezonlar, Sıralama & Ödüller
// ═══════════════════════════════════════════════════════
window.SezonScreen = function SezonScreen({ profile, token, onNavigate }) {
  const [sezon, setSezon] = React.useState(null);
  const [ranking, setRanking] = React.useState([]);
  const [myRank, setMyRank] = React.useState(null);
  const [rewards, setRewards] = React.useState([]);
  const [tab, setTab] = React.useState('bilgi');
  const [loading, setLoading] = React.useState(true);
  const [msg, setMsg] = React.useState({ text: '', ok: true });

  const ds = {
    bg: '#0D1117', surface: 'rgba(255,255,255,0.04)',
    gold: '#C9A227', border: 'rgba(255,255,255,0.08)',
    text: '#EDE7DA', muted: '#8893A1',
    green: '#4CAF50', red: '#FF6B6B',
    card: 'rgba(30,35,48,0.95)',
  };

  const show = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg({ text: '', ok: true }), 4000);
  };

  const fetchSezon = async () => {
    setLoading(true);
    const jwt = token || localStorage.getItem('us_jwt') || '';
    try {
      const headers = { Authorization: 'Bearer ' + jwt };
      const [sr, rr] = await Promise.all([
        fetch('/api/sezon/current', { headers }),
        fetch('/api/sezon/ranking', { headers }),
      ]);
      const [sd, rd] = await Promise.all([sr.json(), rr.json()]);
      if (sd.success) {
        setSezon(sd.sezon);
        setRewards(sd.rewards || []);
      }
      if (rd.success) {
        setRanking(rd.ranking || []);
        const myEntry = (rd.ranking || []).find(r => r.userId === (profile?.id || profile?.uid));
        setMyRank(myEntry || null);
      }
    } catch (e) {
      show('Veri yüklenemedi', false);
    }
    setLoading(false);
  };

  React.useEffect(() => { fetchSezon(); }, []);

  // Sezon bitimine kalan süre hesapla
  const calcRemaining = (endDate) => {
    if (!endDate) return '—';
    const diff = new Date(endDate) - new Date();
    if (diff <= 0) return 'Bitti';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return `${days} gün ${hours} saat`;
    return `${hours} saat`;
  };

  const pct = sezon
    ? Math.min(100, Math.round(
        (new Date() - new Date(sezon.startDate)) /
        (new Date(sezon.endDate) - new Date(sezon.startDate)) * 100
      ))
    : 0;

  const TIER_COLORS = {
    'Padişah': '#C9A227',
    'Vezir': '#A0A0A0',
    'Bey': '#CD7F32',
    'Ağa': '#4C9A6B',
    'Vatandaş': '#8893A1',
  };

  const getTier = (rank) => {
    if (rank <= 1) return 'Padişah';
    if (rank <= 3) return 'Vezir';
    if (rank <= 10) return 'Bey';
    if (rank <= 50) return 'Ağa';
    return 'Vatandaş';
  };

  const SEASON_THEMES = [
    { id: 'kış', emoji: '❄️', label: 'Kış Seferi', color: '#4FC3F7' },
    { id: 'ilkbahar', emoji: '🌸', label: 'Bahar Zaferi', color: '#81C784' },
    { id: 'yaz', emoji: '☀️', label: 'Yaz Hâkimiyeti', color: '#FFB74D' },
    { id: 'sonbahar', emoji: '🍂', label: 'Sonbahar Mirası', color: '#FF8A65' },
  ];

  const currentTheme = sezon
    ? SEASON_THEMES.find(t => t.id === sezon.theme) || SEASON_THEMES[0]
    : SEASON_THEMES[0];

  return React.createElement('div', {
    style: { minHeight: '100vh', background: ds.bg, color: ds.text, fontFamily: "'Inter', sans-serif", paddingBottom: '80px' }
  },
    // Header
    React.createElement('div', {
      style: {
        background: `linear-gradient(135deg, rgba(${sezon?.theme === 'kış' ? '79,195,247' : sezon?.theme === 'ilkbahar' ? '129,199,132' : sezon?.theme === 'sonbahar' ? '255,138,101' : '255,183,77'},0.15) 0%, rgba(10,18,36,0.95) 100%)`,
        padding: '1.25rem 1rem 1rem',
        borderBottom: `1px solid ${ds.border}`,
      }
    },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' } },
        React.createElement('span', { style: { fontSize: '2rem' } }, currentTheme.emoji),
        React.createElement('div', null,
          React.createElement('div', { style: { fontFamily: "'Cinzel', serif", fontSize: '1.1rem', fontWeight: 800, color: ds.gold } },
            sezon ? `${currentTheme.label} - Sezon ${sezon.number}` : 'Sezon Bilgisi'
          ),
          React.createElement('div', { style: { fontSize: '0.72rem', color: ds.muted } },
            sezon ? `Bitiş: ${calcRemaining(sezon.endDate)}` : 'Yükleniyor...'
          )
        )
      ),
      // Progress bar
      sezon && React.createElement('div', null,
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: ds.muted, marginBottom: '0.3rem' } },
          React.createElement('span', null, 'Sezon İlerlemesi'),
          React.createElement('span', null, `%${pct}`)
        ),
        React.createElement('div', { style: { height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' } },
          React.createElement('div', {
            style: { height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${currentTheme.color}, ${ds.gold})`, borderRadius: '3px', transition: 'width 0.5s ease' }
          })
        )
      ),
      // My rank badge
      myRank && React.createElement('div', {
        style: { marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.2)', borderRadius: '8px', padding: '0.45rem 0.75rem' }
      },
        React.createElement('span', null, '🏅'),
        React.createElement('span', { style: { fontSize: '0.8rem', fontWeight: 700, color: ds.gold } },
          `Sıralamanız: #${myRank.rank} — ${getTier(myRank.rank)}`
        ),
        React.createElement('span', { style: { marginLeft: 'auto', fontSize: '0.75rem', color: ds.muted } },
          `${(myRank.score || 0).toLocaleString('tr-TR')} puan`
        )
      )
    ),

    // Tabs
    React.createElement('div', {
      style: { display: 'flex', gap: '0', borderBottom: `1px solid ${ds.border}`, background: 'rgba(0,0,0,0.3)' }
    },
      [
        { id: 'bilgi', label: '📋 Bilgi' },
        { id: 'siralama', label: '🏆 Sıralama' },
        { id: 'oduller', label: '🎁 Ödüller' },
      ].map(t => React.createElement('button', {
        key: t.id,
        onClick: () => setTab(t.id),
        style: {
          flex: 1, padding: '0.65rem', border: 'none', cursor: 'pointer',
          background: tab === t.id ? 'rgba(201,162,39,0.12)' : 'transparent',
          color: tab === t.id ? ds.gold : ds.muted,
          fontSize: '0.75rem', fontWeight: 700, fontFamily: "'Inter', sans-serif",
          borderBottom: tab === t.id ? `2px solid ${ds.gold}` : '2px solid transparent',
          transition: 'all 0.2s',
        }
      }, t.label))
    ),

    // Content
    React.createElement('div', { style: { padding: '1rem' } },
      msg.text && React.createElement('div', {
        style: { background: msg.ok ? 'rgba(76,154,107,0.12)' : 'rgba(194,75,67,0.12)', border: `1px solid ${msg.ok ? '#4C9A6B' : '#C24B43'}`, borderRadius: '8px', padding: '0.6rem 0.75rem', marginBottom: '0.75rem', fontSize: '0.8rem', color: msg.ok ? '#4C9A6B' : '#C24B43' }
      }, msg.text),

      loading && React.createElement('div', { style: { textAlign: 'center', padding: '2rem', color: ds.muted } }, '⏳ Yükleniyor...'),

      !loading && tab === 'bilgi' && React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' } },
        // Season info card
        React.createElement('div', { style: { background: ds.card, border: `1px solid ${ds.border}`, borderRadius: '12px', padding: '1rem' } },
          React.createElement('div', { style: { fontFamily: "'Cinzel', serif", fontSize: '0.85rem', fontWeight: 700, color: ds.gold, marginBottom: '0.75rem' } },
            '⚜️ Sezon Nasıl Çalışır?'
          ),
          [
            ['📅', 'Süre', '30 gün boyunca sürer. Her ay yeni sezon başlar.'],
            ['⭐', 'Puan Kazan', 'Savaş gal, lonca görevi, zanaat üretimi ve günlük görevlerle puan kazan.'],
            ['🏆', 'Sıralama', 'En yüksek puanlı oyuncular Padişah, Vezir, Bey unvanı kazanır.'],
            ['🎁', 'Ödüller', 'Sezon sonunda sıralamana göre özel ödüller ve unvanlar verilir.'],
            ['🔄', 'Sıfırlama', 'Her sezon sonunda puanlar sıfırlanır, unvanlar profilde kalır.'],
          ].map(([icon, title, desc]) => React.createElement('div', {
            key: title,
            style: { display: 'flex', gap: '0.65rem', alignItems: 'flex-start', marginBottom: '0.65rem' }
          },
            React.createElement('span', { style: { fontSize: '1rem', flexShrink: 0, marginTop: '0.1rem' } }, icon),
            React.createElement('div', null,
              React.createElement('div', { style: { fontSize: '0.8rem', fontWeight: 700, color: ds.text } }, title),
              React.createElement('div', { style: { fontSize: '0.72rem', color: ds.muted, lineHeight: 1.4 } }, desc)
            )
          ))
        ),

        // Point sources
        React.createElement('div', { style: { background: ds.card, border: `1px solid ${ds.border}`, borderRadius: '12px', padding: '1rem' } },
          React.createElement('div', { style: { fontFamily: "'Cinzel', serif", fontSize: '0.85rem', fontWeight: 700, color: ds.gold, marginBottom: '0.75rem' } },
            '⚡ Puan Kaynakları'
          ),
          [
            { action: '⚔️ Savaş Gali', pts: '+50 puan', color: '#C24B43' },
            { action: '🏰 Kale Kuşatma', pts: '+100 puan', color: '#C24B43' },
            { action: '🎯 Düello Zaferi', pts: '+30 puan', color: '#C9A227' },
            { action: '⚒️ Zanaat Üretimi', pts: '+10 puan', color: '#4C9A6B' },
            { action: '📅 Günlük Görev', pts: '+20 puan', color: '#4C9A6B' },
            { action: '🤝 Lonca Görevi', pts: '+25 puan', color: '#4C9A6B' },
            { action: '🗳️ Seçime Katılım', pts: '+15 puan', color: '#8893A1' },
            { action: '📜 Kervan Tamamlama', pts: '+35 puan', color: '#C9A227' },
          ].map(({ action, pts, color }) => React.createElement('div', {
            key: action,
            style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0', borderBottom: `1px solid ${ds.border}` }
          },
            React.createElement('span', { style: { fontSize: '0.8rem', color: ds.text } }, action),
            React.createElement('span', { style: { fontSize: '0.78rem', fontWeight: 700, color } }, pts)
          ))
        ),

        // Tiers
        React.createElement('div', { style: { background: ds.card, border: `1px solid ${ds.border}`, borderRadius: '12px', padding: '1rem' } },
          React.createElement('div', { style: { fontFamily: "'Cinzel', serif", fontSize: '0.85rem', fontWeight: 700, color: ds.gold, marginBottom: '0.75rem' } },
            '👑 Unvan Kademeleri'
          ),
          [
            { tier: 'Padişah', rank: '#1', color: '#C9A227', icon: '👑', bonus: '500 ⚜️ + Özel çerçeve' },
            { tier: 'Vezir', rank: '#2-3', color: '#A0A0A0', icon: '⭐', bonus: '250 ⚜️ + Gümüş çerçeve' },
            { tier: 'Bey', rank: '#4-10', color: '#CD7F32', icon: '🥉', bonus: '100 ⚜️ + Bronz çerçeve' },
            { tier: 'Ağa', rank: '#11-50', color: '#4C9A6B', icon: '🏅', bonus: '50 ⚜️ + Ağa rozeti' },
            { tier: 'Vatandaş', rank: '#51+', color: '#8893A1', icon: '🎖️', bonus: '10 ⚜️ Katılım ödülü' },
          ].map(({ tier, rank, color, icon, bonus }) => React.createElement('div', {
            key: tier,
            style: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.55rem 0', borderBottom: `1px solid ${ds.border}` }
          },
            React.createElement('span', { style: { fontSize: '1.2rem' } }, icon),
            React.createElement('div', { style: { flex: 1 } },
              React.createElement('div', { style: { fontSize: '0.82rem', fontWeight: 700, color } }, tier),
              React.createElement('div', { style: { fontSize: '0.7rem', color: ds.muted } }, rank + ' sıra'),
            ),
            React.createElement('div', { style: { fontSize: '0.7rem', color: ds.muted, textAlign: 'right' } }, bonus)
          ))
        )
      ),

      !loading && tab === 'siralama' && React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '0.5rem' } },
        ranking.length === 0
          ? React.createElement('div', { style: { textAlign: 'center', padding: '2rem', color: ds.muted } },
            React.createElement('div', { style: { fontSize: '2rem', marginBottom: '0.5rem' } }, '🏆'),
            React.createElement('div', null, 'Henüz sıralama yok'),
            React.createElement('div', { style: { fontSize: '0.75rem', marginTop: '0.25rem' } }, 'Sezon etkinliklerine katılarak ilk sıraya gir!')
          )
          : ranking.map((r, idx) => {
            const tier = getTier(r.rank);
            const tierColor = TIER_COLORS[tier] || ds.muted;
            const isMe = r.userId === (profile?.id || profile?.uid);
            const medals = ['🥇', '🥈', '🥉'];
            return React.createElement('div', {
              key: r.userId || idx,
              style: {
                background: isMe ? 'rgba(201,162,39,0.1)' : ds.card,
                border: `1px solid ${isMe ? 'rgba(201,162,39,0.35)' : ds.border}`,
                borderRadius: '10px', padding: '0.75rem',
                display: 'flex', alignItems: 'center', gap: '0.65rem',
              }
            },
              React.createElement('div', { style: { width: '28px', textAlign: 'center', fontSize: idx < 3 ? '1.2rem' : '0.85rem', fontWeight: 700, color: idx < 3 ? tierColor : ds.muted } },
                idx < 3 ? medals[idx] : `#${r.rank}`
              ),
              React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                React.createElement('div', { style: { fontSize: '0.83rem', fontWeight: 700, color: isMe ? ds.gold : ds.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
                  r.username + (isMe ? ' (Sen)' : '')
                ),
                React.createElement('div', { style: { fontSize: '0.68rem', color: tierColor, fontWeight: 700 } }, tier)
              ),
              React.createElement('div', { style: { textAlign: 'right' } },
                React.createElement('div', { style: { fontSize: '0.83rem', fontWeight: 700, color: ds.gold } },
                  (r.score || 0).toLocaleString('tr-TR')
                ),
                React.createElement('div', { style: { fontSize: '0.65rem', color: ds.muted } }, 'puan')
              )
            );
          })
      ),

      !loading && tab === 'oduller' && React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' } },
        React.createElement('div', { style: { background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.2)', borderRadius: '10px', padding: '0.75rem', fontSize: '0.78rem', color: ds.gold, lineHeight: 1.5 } },
          '🎁 Ödüller sezon sonunda otomatik olarak hesabınıza aktarılır. Sezon boyunca puan kazanmaya devam edin!'
        ),

        [
          {
            tier: 'Padişah 👑', rank: 'Sıra #1', color: '#C9A227',
            rewards: ['500 ⚜️ Altın', 'Padişah profil çerçevesi', '"Sultan" özel unvanı', 'Efsanevi ekipman paketi'],
          },
          {
            tier: 'Vezir ⭐', rank: 'Sıra #2-3', color: '#A0A0A0',
            rewards: ['250 ⚜️ Altın', 'Vezir profil çerçevesi', '"Sadrazam" unvanı', 'Nadir ekipman paketi'],
          },
          {
            tier: 'Bey 🥉', rank: 'Sıra #4-10', color: '#CD7F32',
            rewards: ['100 ⚜️ Altın', 'Bey profil çerçevesi', '"Bey" unvanı', 'Orta ekipman paketi'],
          },
          {
            tier: 'Ağa 🏅', rank: 'Sıra #11-50', color: '#4C9A6B',
            rewards: ['50 ⚜️ Altın', '"Ağa" unvanı', 'Küçük ekipman paketi'],
          },
          {
            tier: 'Vatandaş 🎖️', rank: 'Sıra #51+', color: '#8893A1',
            rewards: ['10 ⚜️ Altın', 'Katılım rozeti'],
          },
        ].map(({ tier, rank, color, rewards: rList }) => React.createElement('div', {
          key: tier,
          style: { background: ds.card, border: `1px solid ${ds.border}`, borderRadius: '12px', overflow: 'hidden' }
        },
          React.createElement('div', { style: { background: `rgba(${color === '#C9A227' ? '201,162,39' : color === '#A0A0A0' ? '160,160,160' : color === '#CD7F32' ? '205,127,50' : color === '#4C9A6B' ? '76,154,107' : '136,147,161'},0.12)`, padding: '0.65rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            React.createElement('span', { style: { fontSize: '0.85rem', fontWeight: 800, color, fontFamily: "'Cinzel', serif" } }, tier),
            React.createElement('span', { style: { fontSize: '0.7rem', color: ds.muted } }, rank)
          ),
          React.createElement('div', { style: { padding: '0.65rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' } },
            rList.map(r => React.createElement('div', {
              key: r, style: { display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: ds.text }
            },
              React.createElement('span', { style: { color: ds.gold } }, '✦'),
              r
            ))
          )
        ))
      )
    )
  );
};
