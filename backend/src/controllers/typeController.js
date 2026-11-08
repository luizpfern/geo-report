const { pool } = require('../config/database');

async function listReportTypes(_req, res) {
  try {
    const result = await pool.query(
      'SELECT id, name, code, description FROM report_types ORDER BY id ASC'
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('listReportTypes error:', err.message);
    return res.status(500).json({ error: 'Erro ao buscar tipos de relato' });
  }
}

module.exports = { listReportTypes };
