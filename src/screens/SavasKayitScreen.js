// Savaş Kayıt Defteri + ELO Sıralaması
window.SavasKayitScreen = function SavasKayitScreen({ profile, token }) {
  const [tab, setTab] = React.useState('kayit');
  const [logs, setLogs] = React.useState([]);
  const [elo, setElo] = React.useState(null);
  const [leaderboard, setLeaderboard] = React.useState([]);
  const [challenge, setChallenge] = React.useState({ challenges:[], progress:{} });
  const [weeklyTop, setWeeklyTop] = React.useState([]);
  const [claimLoading, setClaimLoading] = React.useState('');
  const [msg, setMsg] = React.useState('');

  const ds = { bg:'#0D1117', surface:'rgba(255,255,255,0.04)', gold:'#C9A227', border:'rgba(255,255,255,0.08)', text:'#EDE7DA', muted:'#8893A1', red:'#FF6B6B', green:'#4CAF50' };

  const leagueColors = { bronz:'#CD7F32', 'gümüş':'#C0C0C0', altın:'#FFD700', vezir:'#9B59B6', 'sultanî':'#E74C3C' };
  const leagueIcons  = { bronz:'🥉', 'gümüş':'🥈', altın:'🥇', vezir:'⚜️', 'sultanî':'👑' };

  const fetchAll = async () => {
    try {
      const [lr, er, lbr, cr, wr] = await Promise.all([
        fetch('/api/war/log',           { headers:{'Authorization':'Bearer '+token} }),
        fetch('/api/war/elo',           { headers:{'Authorization':'Bearer '+token} }),
        fetch('/api/war/leaderboard',   { headers:{'Authorization':'Bearer '+token} }),
        fetch('/api/war/daily-challenge',{ headers:{'Authorization':'Bearer '+token} }),
        fetch('/api/war/weekly-top',    { headers:{'Authorization':'Bearer '+token} }),
      ]);
      const [ld, ed, lbd, cd, wd] = await Promise.all([lr.json(), er.json(), lbr.json(), cr.json(), wr.json()]);
      if (ld.success) setLogs(ld.logs);
      if (ed.success) setElo(ed.elo);
      if (lbd.success) setLeaderboard(lbd.leaderboard);
      if (cd.success) setChallenge({ challenges: cd.challenges||[], progress: cd.progress||{} });
      if (wd.success) setWeeklyTop(wd.top);
    } catch {}
  };

  React.useEffect(() => { fetchAll(); }, []);

  const claimChallenge = async (id) => {
    setClaimLoading(id);
    try {
      const r = await fetch('/api/war/claim-challenge', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: JSON.stringify({ challengeId: id })
      });
      const d = await r.json();
      setMsg(d.success ? `🎁 Ödül alındı! +${d.reward_money||0} 🪙 +${d.reward_xp||0} XP` : d.message || 'Hata');
      if (d.success) fetchAll();
    } catch { setMsg('Hata'); }
    setClaimLoading('');
    setTimeout(() => setMsg(''), 3000);
  };

  const fightTypeLabel = (t) => ({ pvp:'⚔️ PvP', siege:'🏰 Kuşatma', region:'🗺️ Bölge', duel:'🥊 Düello', tournament:'🏆 Turnuva', suikast:'💀 Suikast' })[t] || t;

  return React.createElement('div', { style:{ minHeight:'100vh', background:ds.bg, padding:'1rem', paddingBottom:'5rem', color:ds.text }},
    // ELO Banner
    elo && React.createElement('div', { style:{ background:`linear-gradient(135deg, ${leagueColors[elo.war_league]||'#888'}22, transparent)`, border:`1px solid ${leagueColors[elo.war_league]||'#888'}55`, borderRadius:'14px', padding:'14px', marginBottom:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }},
      React.createElement('div', null,
        React.createElement('div', { style:{ fontSize:'0.75rem', color:ds.muted }}, 'Savaş Puanı (ELO)'),
        React.createElement('div', { style:{ fontWeight:900, fontSize:'1.6rem', color:leagueColors[elo.war_league]||ds.gold }}, elo.war_elo),
        React.createElement('div', { style:{ fontSize:'0.8rem', fontWeight:700, color:leagueColors[elo.war_league]||ds.gold }}, `${leagueIcons[elo.war_league]||''} ${(elo.war_league||'').toUpperCase()}`)
      ),
      React.createElement('div', { style:{ textAlign:'right' }},
        React.createElement('div', { style:{ fontSize:'0.75rem', color:ds.muted }}, 'Galibiyet Serisi'),
        React.createElement('div', { style:{ fontWeight:900, fontSize:'1.4rem', color:ds.gold }}, `🔥${elo.win_streak||0}`),
        React.createElement('div', { style:{ fontSize:'0.72rem', color:ds.muted }}, `Maks: ${elo.max_streak||0}`)
      )
    ),

    // Tabs
    React.createElement('div', { style:{ display:'flex', gap:'5px', marginBottom:'1rem', flexWrap:'wrap' }},
      ['kayit','elo','gorev','haftalik'].map(t =>
        React.createElement('button', { key:t, onClick:()=>setTab(t),
          style:{ padding:'7px 10px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.72rem',
            background: tab===t ? ds.gold : ds.surface, color: tab===t ? '#000' : ds.muted }},
          { kayit:'📋 Kayıt', elo:'🏆 ELO Sıralaması', gorev:'🎯 Günlük Görev', haftalik:'📅 Haftalık Top 3' }[t]
        )
      )
    ),

    msg && React.createElement('div', { style:{ background:'rgba(201,162,39,0.12)', border:`1px solid ${ds.gold}`, borderRadius:'8px', padding:'10px 14px', marginBottom:'1rem', fontSize:'0.82rem', color:ds.gold }}, msg),

    tab === 'kayit' && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'6px' }},
      !logs.length && React.createElement('div', { style:{ textAlign:'center', padding:'3rem', color:ds.muted }}, '📋 Henüz savaş kaydı yok.'),
      logs.map(l => {
        const iWon = String(l.winner_id) === String(profile?.id);
        const isAtk = String(l.attacker_id) === String(profile?.id);
        return React.createElement('div', { key:l.id,
          style:{ background: iWon ? 'rgba(80,200,80,0.05)' : 'rgba(255,80,80,0.05)',
            border:`1px solid ${iWon ? 'rgba(80,200,80,0.2)' : 'rgba(255,80,80,0.2)'}`, borderRadius:'10px', padding:'10px 12px' }},
          React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center' }},
            React.createElement('div', null,
              React.createElement('div', { style:{ fontWeight:700, fontSize:'0.85rem' }},
                `${iWon ? '🏆' : '💀'} ${l.attacker_name} vs ${l.defender_name}`
              ),
              React.createElement('div', { style:{ fontSize:'0.72rem', color:ds.muted, marginTop:'2px' }},
                `${fightTypeLabel(l.fight_type)} · Güç: ${l.attacker_power} vs ${l.defender_power}`
              )
            ),
            React.createElement('div', { style:{ textAlign:'right' }},
              l.loot_money > 0 && React.createElement('div', { style:{ fontSize:'0.82rem', fontWeight:700, color:iWon ? ds.green : ds.red }},
                `${iWon ? '+' : '-'}${l.loot_money} 🪙`
              ),
              React.createElement('div', { style:{ fontSize:'0.7rem', color:ds.muted }},
                new Date(l.created_at).toLocaleDateString('tr-TR')
              )
            )
          ),
          l.is_revenge && React.createElement('div', { style:{ fontSize:'0.7rem', color:'#FF9500', marginTop:'3px' }}, '🔥 İntikam Savaşı!')
        );
      })
    ),

    tab === 'elo' && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'6px' }},
      leaderboard.map((u, i) => {
        const isMe = String(u.id) === String(profile?.id);
        return React.createElement('div', { key:u.id,
          style:{ background: isMe ? 'rgba(201,162,39,0.1)' : ds.surface, border:`1px solid ${isMe ? ds.gold : ds.border}`, borderRadius:'10px', padding:'10px 12px', display:'flex', alignItems:'center', gap:'10px' }},
          React.createElement('div', { style:{ fontWeight:900, fontSize:'1rem', color:ds.muted, width:'24px', textAlign:'center' }}, i+1),
          React.createElement('div', { style:{ flex:1 }},
            React.createElement('div', { style:{ fontWeight:700 }}, `${u.username}${isMe?' (Sen)':''}`),
            React.createElement('div', { style:{ fontSize:'0.72rem', color:ds.muted }}, `🔥 Seri: ${u.win_streak||0} · Lv.${u.level}`)
          ),
          React.createElement('div', { style:{ textAlign:'right' }},
            React.createElement('div', { style:{ fontWeight:900, color:leagueColors[u.war_league]||ds.gold }}, u.war_elo),
            React.createElement('div', { style:{ fontSize:'0.72rem', color:leagueColors[u.war_league]||ds.muted }}, `${leagueIcons[u.war_league]||''} ${(u.war_league||'').toUpperCase()}`)
          )
        );
      })
    ),

    tab === 'gorev' && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'10px' }},
      React.createElement('p', { style:{ fontSize:'0.78rem', color:ds.muted, margin:'0 0 4px' }}, '🎯 Her gün 3 farklı savaş görevi. Tamamla, ödülü al!'),
      (challenge.challenges||[]).map(c => {
        const prog = parseInt(challenge.progress?.[c.type]||0);
        const pct  = Math.min(100, (prog / c.target) * 100);
        const done = prog >= c.target;
        const claimed = challenge.progress?.[`${c.id}_claimed`];
        return React.createElement('div', { key:c.id,
          style:{ background:ds.surface, border:`1px solid ${done ? 'rgba(80,200,80,0.3)' : ds.border}`, borderRadius:'12px', padding:'14px' }},
          React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }},
            React.createElement('div', { style:{ fontWeight:700 }}, c.desc),
            React.createElement('div', { style:{ fontSize:'0.82rem', color:done ? ds.green : ds.muted }}, `${Math.min(prog, c.target)}/${c.target}`)
          ),
          React.createElement('div', { style:{ height:'6px', background:'rgba(255,255,255,0.06)', borderRadius:'3px', marginBottom:'8px', overflow:'hidden' }},
            React.createElement('div', { style:{ height:'100%', width:`${pct}%`, background: done ? ds.green : ds.gold, borderRadius:'3px', transition:'width 0.4s' }})
          ),
          React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center' }},
            React.createElement('div', { style:{ fontSize:'0.75rem', color:ds.muted }},
              `Ödül: ${c.reward_money ? `+${c.reward_money} 🪙` : ''} ${c.reward_xp ? `+${c.reward_xp} XP` : ''}`
            ),
            done && !claimed && React.createElement('button', { onClick:()=>claimChallenge(c.id), disabled:claimLoading===c.id,
              style:{ padding:'5px 14px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.8rem', background:ds.green, color:'#000' }},
              '🎁 Al'
            ),
            claimed && React.createElement('span', { style:{ fontSize:'0.75rem', color:ds.muted }}, '✅ Alındı')
          )
        );
      })
    ),

    tab === 'haftalik' && React.createElement('div', null,
      React.createElement('div', { style:{ fontWeight:700, marginBottom:'10px' }}, '📅 Bu Haftanın En İyi 3 Savaşçısı'),
      !weeklyTop.length && React.createElement('div', { style:{ textAlign:'center', padding:'2rem', color:ds.muted }}, 'Henüz bu hafta savaş yok.'),
      weeklyTop.map((u, i) =>
        React.createElement('div', { key:u.user_id, style:{ background:ds.surface, border:`1px solid ${i===0?ds.gold:ds.border}`, borderRadius:'12px', padding:'14px', marginBottom:'8px', display:'flex', alignItems:'center', gap:'12px' }},
          React.createElement('div', { style:{ fontSize:'1.8rem' }}, ['🥇','🥈','🥉'][i]),
          React.createElement('div', { style:{ flex:1 }},
            React.createElement('div', { style:{ fontWeight:700 }}, u.username),
            React.createElement('div', { style:{ fontSize:'0.78rem', color:ds.muted }}, `${u.battles_fought} savaş / ${u.battles_won} galibiyet`)
          ),
          React.createElement('div', { style:{ fontWeight:900, color:ds.gold }}, `${u.battles_won} 🏆`)
        )
      )
    )
  );
};
