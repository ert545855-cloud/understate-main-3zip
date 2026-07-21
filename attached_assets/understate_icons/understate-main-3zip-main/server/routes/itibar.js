const express = require('express');
const router  = express.Router();
const db      = require('../services/dbService');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler }   = require('../middleware/asyncHandler');

/* GET /api/itibar/reports - active community reports */
router.get('/reports', authMiddleware, asyncHandler(async (req, res) => {
  await db.query(`UPDATE community_reports SET status='expired' WHERE expires_at < NOW() AND status='voting'`);
  const { rows } = await db.query(
    `SELECT r.*, u.username as reported_name, u2.username as reporter_name
     FROM community_reports r
     JOIN users u ON u.id=r.reported_id
     JOIN users u2 ON u2.id=r.reporter_id
     WHERE r.status='voting'
     ORDER BY r.created_at DESC LIMIT 20`
  );
  // Check which ones current user voted on
  const votedRows = await db.query(
    `SELECT report_id, vote FROM community_votes WHERE voter_id=$1`, [req.user.id]
  );
  const votedMap = {};
  votedRows.rows.forEach(v => { votedMap[v.report_id] = v.vote; });

  const enriched = rows.map(r => ({ ...r, my_vote: votedMap[r.id] || null }));
  res.json({ success: true, reports: enriched });
}));

/* POST /api/itibar/report */
router.post('/report', authMiddleware, asyncHandler(async (req, res) => {
  const { reportedId, reason } = req.body;
  if (!reportedId || reportedId === req.user.id) return res.status(400).json({ success: false });
  if (!reason?.trim() || reason.length > 200) return res.status(400).json({ success: false, message: 'Gerekçe gerekli (max 200 karakter)' });

  // 1 report per user per target per 24h
  const { rows: existing } = await db.query(
    `SELECT id FROM community_reports WHERE reporter_id=$1 AND reported_id=$2 AND created_at > NOW()-INTERVAL '24 hours'`,
    [req.user.id, reportedId]
  );
  if (existing.length) return res.status(400).json({ success: false, message: 'Bu kişiyi bugün zaten şikayet ettin' });

  const { rows: [report] } = await db.query(
    `INSERT INTO community_reports (reporter_id, reported_id, reason) VALUES ($1,$2,$3) RETURNING *`,
    [req.user.id, reportedId, reason.trim()]
  );

  if (global._io) global._io.emit('itibar:report', { reportId: report.id });
  res.json({ success: true, report });
}));

/* POST /api/itibar/vote */
router.post('/vote', authMiddleware, asyncHandler(async (req, res) => {
  const { reportId, vote } = req.body;
  if (!['guilty','innocent'].includes(vote)) return res.status(400).json({ success: false });

  const { rows: [report] } = await db.query(
    `SELECT * FROM community_reports WHERE id=$1 AND status='voting' AND expires_at > NOW()`, [reportId]
  );
  if (!report) return res.status(404).json({ success: false, message: 'Oylama bulunamadı veya süresi doldu' });
  if (String(report.reporter_id) === String(req.user.id) || String(report.reported_id) === String(req.user.id))
    return res.status(403).json({ success: false, message: 'Bu davada tarafsın' });

  try {
    await db.query(`INSERT INTO community_votes (report_id, voter_id, vote) VALUES ($1,$2,$3)`, [reportId, req.user.id, vote]);
  } catch {
    return res.status(400).json({ success: false, message: 'Zaten oy verdin' });
  }

  const col = vote === 'guilty' ? 'guilty_votes' : 'innocent_votes';
  const { rows: [updated] } = await db.query(
    `UPDATE community_reports SET ${col}=${col}+1 WHERE id=$1 RETURNING *`, [reportId]
  );

  // Auto-resolve if 10+ votes and one side has 60%+
  const total = updated.guilty_votes + updated.innocent_votes;
  if (total >= 5) {
    const guiltyPct = updated.guilty_votes / total;
    if (guiltyPct >= 0.6) {
      // Guilty: trade ban 24h, itibar -20
      await db.query(`UPDATE community_reports SET status='guilty', resolved_at=NOW() WHERE id=$1`, [reportId]);
      await db.query(
        `UPDATE users SET trade_banned_until=NOW()+INTERVAL '24 hours', itibar_score=GREATEST(0,itibar_score-20) WHERE id=$1`,
        [report.reported_id]
      );
      if (global._io) global._io.to(`user_${report.reported_id}`).emit('itibar:banned', {
        until: new Date(Date.now() + 86400000), reason: report.reason
      });
    } else if ((1 - guiltyPct) >= 0.6) {
      await db.query(`UPDATE community_reports SET status='innocent', resolved_at=NOW() WHERE id=$1`, [reportId]);
      await db.query(`UPDATE users SET itibar_score=LEAST(200,itibar_score+5) WHERE id=$1`, [report.reported_id]);
    }
  }

  res.json({ success: true, vote, guiltyVotes: updated.guilty_votes, innocentVotes: updated.innocent_votes });
}));

/* GET /api/itibar/profile/:userId */
router.get('/profile/:userId', authMiddleware, asyncHandler(async (req, res) => {
  const { rows: [u] } = await db.query(
    `SELECT username, itibar_score, trade_banned_until FROM users WHERE id=$1`, [req.params.userId]
  );
  if (!u) return res.status(404).json({ success: false });
  const { rows: history } = await db.query(
    `SELECT r.reason, r.status, r.guilty_votes, r.innocent_votes, r.created_at
     FROM community_reports r WHERE r.reported_id=$1 ORDER BY r.created_at DESC LIMIT 10`,
    [req.params.userId]
  );
  res.json({ success: true, user: u, history });
}));

module.exports = router;
