// İtibar & Yaptırım Ekranı
window.ItibarScreen = function ItibarScreen({ profile, token, onlinePlayers }) {
  const [tab, setTab] = React.useState('aktif');
  const [reports, setReports] = React.useState([]);
  const [targetId, setTargetId] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [loading, setLoading] = React.useState('');
  const [msg, setMsg] = React.useState({ text:'', ok:true });

  const ds = { bg:'#0D1117', surface:'rgba(255,255,255,0.04)', gold:'#C9A227', border:'rgba(255,255,255,0.08)', text:'#EDE7DA', muted:'#8893A1', green:'#4CAF50', red:'#FF6B6B' };

  const itibarColor = (score) => score >= 80 ? ds.green : score >= 50 ? ds.gold : ds.red;
  const itibarLabel = (score) => score >= 80 ? '😇 Güvenilir' : score >= 50 ? '😐 Şüpheli' : '😈 Güvenilmez';

  const fetchReports = async () => {
    try {
      const r = await fetch('/api/itibar/reports', { headers:{'Authorization':'Bearer '+token} });
      const d = await r.json();
      if (d.success) setReports(d.reports);
    } catch {}
  };

  React.useEffect(() => {
    fetchReports();
    const iv = setInterval(fetchReports, 20000);
    if (window._socket) window._socket.on('itibar:report', fetchReports);
    return () => { clearInterval(iv); if(window._socket) window._socket.off('itibar:report'); };
  }, []);

  const show = (text, ok=true) => { setMsg({ text, ok }); setTimeout(() => setMsg({ text:'', ok:true }), 4000); };

  const postReport = async () => {
    if (!targetId) return show('Hedef seç', false);
    if (!reason.trim() || reason.length > 200) return show('Gerekçe yaz (max 200 karakter)', false);
    setLoading('report');
    try {
      const r = await fetch('/api/itibar/report', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: JSON.stringify({ reportedId: targetId, reason: reason.trim() })
      });
      const d = await r.json();
      if (d.success) { show('⚖️ Şikayet açıldı! Topluluk oylama yapacak.'); setTargetId(''); setReason(''); fetchReports(); setTab('aktif'); }
      else show(d.message || 'Hata', false);
    } catch { show('Hata', false); }
    setLoading('');
  };

  const vote = async (reportId, v) => {
    setLoading(`${reportId}-${v}`);
    try {
      const r = await fetch('/api/itibar/vote', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: JSON.stringify({ reportId, vote: v })
      });
      const d = await r.json();
      if (d.success) {
        show(`✅ Oy verildi: ${v === 'guilty' ? 'Suçlu' : 'Masum'}`);
        setReports(prev => prev.map(rep => rep.id === reportId
          ? { ...rep, guilty_votes: d.guiltyVotes, innocent_votes: d.innocentVotes, my_vote: v }
          : rep
        ));
      } else show(d.message || 'Hata', false);
    } catch { show('Hata', false); }
    setLoading('');
  };

  const timeLeft = (exp) => {
    const d = new Date(exp) - new Date();
    if (d <= 0) return 'Süresi doldu';
    const h = Math.floor(d/3600000), m = Math.floor((d%3600000)/60000);
    return `${h}s ${m}dk`;
  };

  return React.createElement('div', { style:{ minHeight:'100vh', background:ds.bg, padding:'1rem', paddingBottom:'5rem', color:ds.text }},
    // My itibar banner
    React.createElement('div', { style:{ background:`linear-gradient(135deg, rgba(201,162,39,0.08), transparent)`, border:`1px solid rgba(201,162,39,0.2)`, borderRadius:'14px', padding:'14px', marginBottom:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }},
      React.createElement('div', null,
        React.createElement('div', { style:{ fontSize:'0.75rem', color:ds.muted }}, 'Senin İtibar Puanın'),
        React.createElement('div', { style:{ fontWeight:900, fontSize:'1.6rem', color:itibarColor(profile?.itibar_score ?? 100) }}, profile?.itibar_score ?? 100),
        React.createElement('div', { style:{ fontSize:'0.8rem', color:itibarColor(profile?.itibar_score ?? 100) }}, itibarLabel(profile?.itibar_score ?? 100))
      ),
      React.createElement('div', { style:{ textAlign:'right', fontSize:'0.78rem', color:ds.muted }},
        React.createElement('div', null, '⚖️ Osmanlı Mahkemesi'),
        React.createElement('div', { style:{ marginTop:'4px' }}, '5+ oy ile karar verilir'),
        React.createElement('div', null, '%60 suçlu → 24s ban')
      )
    ),

    React.createElement('div', { style:{ display:'flex', gap:'8px', marginBottom:'1rem' }},
      ['aktif','sikayet'].map(t =>
        React.createElement('button', { key:t, onClick:()=>setTab(t),
          style:{ flex:1, padding:'8px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.85rem',
            background: tab===t ? ds.gold : ds.surface, color: tab===t ? '#000' : ds.muted }},
          t === 'aktif' ? `⚖️ Aktif Davalar (${reports.length})` : '📋 Şikayet Et'
        )
      )
    ),

    msg.text && React.createElement('div', { style:{ background: msg.ok ? 'rgba(80,200,80,0.08)' : 'rgba(255,80,80,0.08)', border:`1px solid ${msg.ok ? ds.green : ds.red}`, borderRadius:'8px', padding:'10px 14px', marginBottom:'1rem', fontSize:'0.82rem', color: msg.ok ? ds.green : ds.red }}, msg.text),

    tab === 'aktif' && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'10px' }},
      !reports.length && React.createElement('div', { style:{ textAlign:'center', padding:'3rem', color:ds.muted }}, '⚖️ Aktif dava yok.'),
      reports.map(rep => {
        const total = rep.guilty_votes + rep.innocent_votes;
        const guiltyPct = total > 0 ? Math.round((rep.guilty_votes / total) * 100) : 0;
        const isTarget = String(rep.reported_id) === String(profile?.id);
        const isReporter = String(rep.reporter_id) === String(profile?.id);
        const canVote = !rep.my_vote && !isTarget && !isReporter;
        return React.createElement('div', { key:rep.id,
          style:{ background: isTarget ? 'rgba(255,80,80,0.05)' : ds.surface, border:`1px solid ${isTarget ? 'rgba(255,80,80,0.25)' : ds.border}`, borderRadius:'12px', padding:'14px' }},
          React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }},
            React.createElement('div', null,
              React.createElement('div', { style:{ fontWeight:700 }}, `⚖️ ${rep.reported_name}${isTarget?' (SEN!)':''} şikayet edildi`),
              React.createElement('div', { style:{ fontSize:'0.77rem', color:ds.muted, marginTop:'2px' }}, `"${rep.reason}"`),
              React.createElement('div', { style:{ fontSize:'0.7rem', color:ds.muted, marginTop:'2px' }}, `Şikayetçi: ${rep.reporter_name} · ${timeLeft(rep.expires_at)}`)
            )
          ),
          // Vote bar
          total > 0 && React.createElement('div', { style:{ marginBottom:'8px' }},
            React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', fontSize:'0.72rem', color:ds.muted, marginBottom:'3px' }},
              React.createElement('span', null, `😡 Suçlu: ${rep.guilty_votes}`),
              React.createElement('span', null, `😇 Masum: ${rep.innocent_votes}`)
            ),
            React.createElement('div', { style:{ height:'6px', background:'rgba(255,255,255,0.06)', borderRadius:'3px', overflow:'hidden' }},
              React.createElement('div', { style:{ height:'100%', width:`${guiltyPct}%`, background:ds.red, borderRadius:'3px' }})
            )
          ),
          canVote && React.createElement('div', { style:{ display:'flex', gap:'8px' }},
            ['guilty','innocent'].map(v =>
              React.createElement('button', { key:v, onClick:()=>vote(rep.id, v), disabled:loading===`${rep.id}-${v}`,
                style:{ flex:1, padding:'7px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.8rem',
                  background: v==='guilty' ? 'rgba(255,80,80,0.15)' : 'rgba(80,200,80,0.12)',
                  color: v==='guilty' ? ds.red : ds.green }},
                v==='guilty' ? '😡 Suçlu' : '😇 Masum'
              )
            )
          ),
          rep.my_vote && React.createElement('div', { style:{ fontSize:'0.75rem', color:ds.muted, textAlign:'center' }}, `✅ Oy verdişin: ${rep.my_vote === 'guilty' ? 'Suçlu' : 'Masum'}`)
        );
      })
    ),

    tab === 'sikayet' && React.createElement('div', { style:{ background:ds.surface, border:`1px solid ${ds.border}`, borderRadius:'12px', padding:'16px' }},
      React.createElement('div', { style:{ fontWeight:700, marginBottom:'12px' }}, '📋 Şikayet Aç'),
      React.createElement('div', { style:{ fontSize:'0.78rem', color:ds.muted, marginBottom:'14px', lineHeight:1.5 }},
        'Şikayetin toplulukta 24 saat oylamaya açılır. 5+ oy ve %60 suçlu çıkarsa hedef 24 saat ticaret yasağı alır.'
      ),
      React.createElement('div', { style:{ marginBottom:'10px' }},
        React.createElement('label', { style:{ fontSize:'0.8rem', color:ds.muted, display:'block', marginBottom:'4px' }}, 'Şikayet Edilen:'),
        React.createElement('select', {
          value:targetId, onChange:e=>setTargetId(e.target.value),
          style:{ width:'100%', padding:'8px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', border:`1px solid ${ds.border}`, color:ds.text }},
          React.createElement('option', { value:'' }, '-- Kişi Seç --'),
          (onlinePlayers||[]).filter(p => String(p.id) !== String(profile?.id)).map(p =>
            React.createElement('option', { key:p.id, value:p.id }, p.username)
          )
        )
      ),
      React.createElement('textarea', {
        value:reason, onChange:e=>setReason(e.target.value.slice(0,200)),
        placeholder:'Şikayet gerekçesi... (max 200 karakter)',
        style:{ width:'100%', minHeight:'80px', padding:'8px', borderRadius:'8px', background:'rgba(255,255,255,0.04)', border:`1px solid ${ds.border}`, color:ds.text, fontSize:'0.85rem', resize:'vertical', boxSizing:'border-box', marginBottom:'10px' }
      }),
      React.createElement('button', { onClick:postReport, disabled:loading==='report',
        style:{ width:'100%', padding:'10px', borderRadius:'10px', border:'none', cursor:'pointer', fontWeight:700, background:'rgba(255,80,80,0.2)', color:ds.red }},
        loading==='report' ? '⏳ Açılıyor...' : '⚖️ Şikayet Aç'
      )
    )
  );
};
