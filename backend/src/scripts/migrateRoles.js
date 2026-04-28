const pool = require('../db/connection');

async function migrar() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Primero eliminar constraint, luego actualizar datos, luego agregar nuevo constraint
    await client.query(`ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;`);

    await client.query(`UPDATE usuarios SET rol = 'superadmin' WHERE rol = 'admin'`);
    await client.query(`UPDATE usuarios SET rol = 'gestor'     WHERE rol IN ('usuario', 'tecnico')`);

    await client.query(`
      ALTER TABLE usuarios
        ADD CONSTRAINT usuarios_rol_check
        CHECK (rol IN ('superadmin', 'admin', 'gestor'));
    `);

    await client.query('COMMIT');
    console.log('Migración de roles completada.');
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
