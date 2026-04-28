const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const esProd = process.env.NODE_ENV === 'production' || process.env.PORT === '80';

const pool = new Pool(
  esProd
    ? {
        host:     'semilla-app_semilla-db',
        port:     5432,
        database: 'semilla-app',
        user:     'postgres',
        password: '20718fee096cb2a40b07',
      }
    : {
        host:     process.env.DB_HOST     || 'localhost',
        port:     parseInt(process.env.DB_PORT) || 5433,
        database: process.env.DB_NAME     || 'semilla',
        user:     process.env.DB_USER     || 'postgres',
        password: process.env.DB_PASSWORD || 'db.7513122',
      }
);

pool.on('error', (err) => {
  console.error('Error inesperado en cliente de PostgreSQL:', err.message);
});

module.exports = pool;
