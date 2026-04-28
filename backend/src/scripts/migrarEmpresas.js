const pool = require('../db/connection');

async function migrar() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS empresas (
        id          SERIAL PRIMARY KEY,
        nombre      VARCHAR(200) NOT NULL,
        descripcion TEXT,
        estado      VARCHAR(20) NOT NULL DEFAULT 'activa'
                      CHECK (estado IN ('activa', 'inactiva')),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS empresa_usuarios (
        empresa_id  INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (empresa_id, usuario_id)
      );
    `);

    await client.query(`
      ALTER TABLE proyectos
        ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id) ON DELETE SET NULL;
    `);

    await client.query('COMMIT');
    console.log('Migración de empresas completada.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en migración:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrar();
