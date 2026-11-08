const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não definido no .env');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected Postgres pool error:', err.message);
});

module.exports = { pool };
