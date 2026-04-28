const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'semillas_db',
  user: process.env.DB_USER || 'semillas_user',
  password: process.env.DB_PASSWORD,
});

pool.on('error', (err) => {
  console.error('Error inesperado en cliente de PostgreSQL:', err);
  process.exit(-1);
});

module.exports = pool;
