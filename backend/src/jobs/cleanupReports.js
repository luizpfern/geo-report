const { pool } = require('../config/database');

const INTERVAL_MS = 60 * 60 * 1000; // 1 hora

async function cleanupOldReports() {
  try {
    const result = await pool.query(
      `DELETE FROM reports WHERE created_at < NOW() - INTERVAL '24 hours'`
    );
    const removed = result.rowCount || 0;
    if (removed > 0) {
      console.log(`Cleanup: removidos ${removed} alerta(s) com mais de 24h`);
    }
  } catch (err) {
    console.error('Cleanup failed:', err.message);
  }
}

function startCleanupJob() {
  cleanupOldReports();
  setInterval(cleanupOldReports, INTERVAL_MS);
  console.log('Cleanup job ativo: alertas > 24h a cada 1h');
}

module.exports = { startCleanupJob, cleanupOldReports };
