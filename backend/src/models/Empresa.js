const pool = require('../db/connection');

async function listarEmpresas() {
  const { rows } = await pool.query(`
    SELECT * FROM empresas ORDER BY created_at DESC
  `);
  return rows;
}

async function buscarEmpresaPorId(id) {
  const { rows } = await pool.query('SELECT * FROM empresas WHERE id = $1', [id]);
  return rows[0] || null;
}

async function crearEmpresa({ nombre, rut, nombreContacto, telefonoContacto, correoContacto }) {
  const { rows } = await pool.query(
    `INSERT INTO empresas (nombre, rut, nombre_contacto, telefono_contacto, correo_contacto)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [nombre, rut || null, nombreContacto || null, telefonoContacto || null, correoContacto || null]
  );
  return rows[0];
}

async function actualizarEmpresa(id, { nombre, rut, nombreContacto, telefonoContacto, correoContacto }) {
  const { rows } = await pool.query(
    `UPDATE empresas
     SET nombre            = COALESCE($1, nombre),
         rut               = COALESCE($2, rut),
         nombre_contacto   = COALESCE($3, nombre_contacto),
         telefono_contacto = COALESCE($4, telefono_contacto),
         correo_contacto   = COALESCE($5, correo_contacto),
         updated_at        = NOW()
     WHERE id = $6
     RETURNING *`,
    [nombre, rut, nombreContacto, telefonoContacto, correoContacto, id]
  );
  return rows[0] || null;
}

async function eliminarEmpresa(id) {
  const { rowCount } = await pool.query('DELETE FROM empresas WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { listarEmpresas, buscarEmpresaPorId, crearEmpresa, actualizarEmpresa, eliminarEmpresa };
