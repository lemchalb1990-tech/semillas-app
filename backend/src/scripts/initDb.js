const pool = require('../db/connection');

async function inicializar() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id           SERIAL PRIMARY KEY,
        nombre       VARCHAR(100) NOT NULL,
        email        VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        rol          VARCHAR(20) NOT NULL DEFAULT 'usuario'
                       CHECK (rol IN ('admin', 'tecnico', 'usuario')),
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS proyectos (
        id           SERIAL PRIMARY KEY,
        nombre       VARCHAR(200) NOT NULL,
        descripcion  TEXT,
        especie      VARCHAR(100),
        estado       VARCHAR(20) NOT NULL DEFAULT 'activo'
                       CHECK (estado IN ('activo','completado','pausado','cancelado')),
        fecha_inicio DATE,
        fecha_fin    DATE,
        ubicacion    VARCHAR(255),
        usuario_id   INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    console.log('Base de datos inicializada correctamente.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al inicializar la base de datos:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

inicializar();
