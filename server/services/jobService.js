/**
 * Job Service — Osmanlı Dönemi Meslekler
 * Sunucu taraflı cooldown doğrulama ve ödül hesaplama.
 * Her meslek sadakat puanı da kazandırır.
 */
const db = require('./dbService');
const logger = require('../utils/logger');

// Frontend JOBS_LIST ile ID'ler senkron olmalı
const STANDARD_JOBS = [
  { id:'hammal',       name:'Hammal',              icon:'💪', earn:600,    cd:300000,   minLevel:1,  sadakat:2   },
  { id:'carsi_bekcisi',name:'Çarşı Bekçisi',       icon:'🏮', earn:900,    cd:300000,   minLevel:1,  sadakat:3   },
  { id:'ciftci',       name:'Çiftçi',              icon:'🌾', earn:1400,   cd:600000,   minLevel:1,  sadakat:5   },
  { id:'demirci',      name:'Demirci Çırak',        icon:'⚒️', earn:3200,   cd:1200000,  minLevel:2,  sadakat:8   },
  { id:'nalbant',      name:'Nalbant',             icon:'🐴', earn:5500,   cd:1800000,  minLevel:3,  sadakat:12  },
  { id:'dokumaci',     name:'Dokumacı',            icon:'🧵', earn:7000,   cd:2400000,  minLevel:3,  sadakat:15  },
  { id:'lonca_usta',   name:'Lonca Ustası',        icon:'🔨', earn:14000,  cd:3600000,  minLevel:5,  sadakat:25  },
  { id:'tuccar',       name:'Tüccar',              icon:'⚖️', earn:25000,  cd:7200000,  minLevel:5,  sadakat:40  },
  { id:'katip',        name:'Kâtip',               icon:'📜', earn:45000,  cd:14400000, minLevel:8,  sadakat:65  },
  { id:'sipahi',       name:'Sipahi',              icon:'🏇', earn:70000,  cd:21600000, minLevel:10, sadakat:100 },
  { id:'yeniceiri',    name:'Yeniçeri Neferi',     icon:'⚔️', earn:90000,  cd:28800000, minLevel:10, sadakat:130 },
  { id:'mutefarrika',  name:'Müteferrika',         icon:'🛡️', earn:150000, cd:43200000, minLevel:15, sadakat:200 },
  { id:'defterdar',    name:'Defterdar Naibi',     icon:'📊', earn:300000, cd:86400000, minLevel:20, sadakat:350 },
  { id:'kazasker',     name:'Kazasker Yardımcısı', icon:'⚖️', earn:600000, cd:86400000, minLevel:30, sadakat:600 },
];

const JOB_MAP = Object.fromEntries(STANDARD_JOBS.map(j => [j.id, j]));

async function getCooldowns(userId) {
  try {
    const { rows } = await db.query(
      'SELECT job_id, last_done_at FROM job_cooldowns WHERE user_id = $1',
      [userId]
    );
    const result = {};
    for (const r of rows) result[r.job_id] = Number(r.last_done_at);
    return result;
  } catch (err) {
    logger.warn('[Job] getCooldowns:', err.message);
    return {};
  }
}

async function doJob({ userId, jobId, playerLevel }) {
  try {
    const job = JOB_MAP[jobId];
    if (!job) return { ok: false, msg: 'Geçersiz meslek' };
    if ((playerLevel || 1) < job.minLevel) return { ok: false, msg: `Bu meslek için Seviye ${job.minLevel} gerekli!` };

    const now = Date.now();

    // Cooldown DB kontrolü
    const { rows } = await db.query(
      'SELECT last_done_at FROM job_cooldowns WHERE user_id = $1 AND job_id = $2',
      [userId, jobId]
    );
    if (rows.length > 0) {
      const lastDone = Number(rows[0].last_done_at);
      const remaining = job.cd - (now - lastDone);
      if (remaining > 0) {
        const h = Math.floor(remaining / 3600000);
        const m = Math.ceil((remaining % 3600000) / 60000);
        const s = Math.ceil((remaining % 60000) / 1000);
        const timeStr = h > 0 ? `${h}sa ${m}dk` : m > 0 ? `${m}dk ${s}s` : `${s}s`;
        return { ok: false, msg: `⏳ ${timeStr} bekle!`, remaining };
      }
    }

    // Cooldown güncelle
    await db.query(
      `INSERT INTO job_cooldowns (user_id, job_id, last_done_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, job_id) DO UPDATE SET last_done_at = $3`,
      [userId, jobId, now]
    );

    const earned  = job.earn;
    const xpGain  = Math.max(5, Math.floor(job.earn / 300));
    const sadakat = job.sadakat || 0;

    // Altın şansı (büyük meslekler için)
    let ucEarned = 0;
    if (job.earn >= 50000)      ucEarned = Math.floor(Math.random() * 3 + 1);
    else if (job.earn >= 10000) ucEarned = Math.random() < 0.25 ? 1 : 0;

    return { ok: true, earned, xpGain, ucEarned, sadakat, job };
  } catch (err) {
    logger.warn('[Job] doJob:', err.message);
    return { ok: false, msg: 'Sunucu hatası' };
  }
}

module.exports = { STANDARD_JOBS, JOB_MAP, getCooldowns, doJob };
