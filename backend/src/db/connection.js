const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  host:     process.env.DB_HOST     || 'semilla-app_semilla-db',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'semilla',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'db.7513122',
});

pool.on('error', (err) => {
  console.error('Error inesperado en cliente de PostgreSQL:', err.message);
});

module.exports = pool;
