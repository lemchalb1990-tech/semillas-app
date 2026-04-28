const pool = require('../db/connection');

async function listarProyectos({ usuarioId, rol, estado, especie, pagina = 1, limite = 20 }) {
  const offset = (pagina - 1) * limite;
  const condiciones = [];
  const valores = [];
  let idx = 1;

  if (rol === 'gestor') {
    condiciones.push(`p.usuario_id = $${idx++}`);
    valores.push(usuarioId);
  }

  if (estado) {
    condiciones.push(`p.estado = $${idx++}`);
    valores.push(estado);
  }

  if (especie) {
    condiciones.push(`p.especie ILIKE $${idx++}`);
    valores.push(`%${especie}%`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT p.*, u.nombre AS responsable
     FROM proyectos p
     LEFT JOIN usuarios u ON u.id = p.usuario_id
     ${where}
     ORDER BY p.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    [...valores, limite, offset]
  );

  const { rows: total } = await pool.query(
    `SELECT COUNT(*) FROM proyectos p ${where}`,
    valores
  );

  return { proyectos: rows, total: parseInt(total[0].count) };
}

async function buscarPorId(id) {
  const { rows } = await pool.query(
    `SELECT p.*, u.nombre AS responsable
     FROM proyectos p
     LEFT JOIN usuarios u ON u.id = p.usuario_id
     WHERE p.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function crearProyecto({ nombre, descripcion, especie, estado = 'activo', fechaInicio, fechaFin, ubicacion, usuarioId }) {
  const { rows } = await pool.query(
    `INSERT INTO proyectos (nombre, descripcion, especie, estado, fecha_inicio, fecha_fin, ubicacion, usuario_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [nombre, descripcion, especie, estado, fechaInicio || null, fechaFin || null, ubicacion, usuarioId]
  );
  return rows[0];
}

async function actualizarProyecto(id, { nombre, descripcion, especie, estado, fechaInicio, fechaFin, ubicacion }) {
  const { rows } = await pool.query(
    `UPDATE proyectos
     SET nombre       = COALESCE($1, nombre),
         descripcion  = COALESCE($2, descripcion),
         especie      = COALESCE($3, especie),
         estado       = COALESCE($4, estado),
         fecha_inicio = COALESCE($5, fecha_inicio),
         fecha_fin    = COALESCE($6, fecha_fin),
         ubicacion    = COALESCE($7, ubicacion),
         updated_at   = NOW()
     WHERE id = $8
     RETURNING *`,
    [nombre, descripcion, especie, estado, fechaInicio, fechaFin, ubicacion, id]
  );
  return rows[0] || null;
}

async function eliminarProyecto(id) {
  const { rowCount } = await pool.query('DELETE FROM proyectos WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { listarProyectos, buscarPorId, crearProyecto, actualizarProyecto, eliminarProyecto };
