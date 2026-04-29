const pool = require('../db/connection');

async function listarProveedores(empresaIds) {
  const { rows } = await pool.query(
    `SELECT p.*, emp.nombre AS empresa_nombre,
            u.nombre AS creado_por_nombre,
            COALESCE(
              json_agg(json_build_object('id', e.id, 'nombre', e.nombre))
              FILTER (WHERE e.id IS NOT NULL), '[]'
            ) AS especies
     FROM proveedores p
     LEFT JOIN empresas emp        ON emp.id  = p.empresa_id
     LEFT JOIN usuarios u          ON u.id    = p.creado_por
     LEFT JOIN proveedor_especies pe ON pe.proveedor_id = p.id
     LEFT JOIN especies e          ON e.id    = pe.especie_id
     WHERE p.empresa_id = ANY($1::int[])
     GROUP BY p.id, emp.nombre, u.nombre
     ORDER BY p.created_at DESC`,
    [empresaIds]
  );
  return rows;
}

async function buscarProveedorPorId(id) {
  const { rows } = await pool.query(
    `SELECT p.*, emp.nombre AS empresa_nombre,
            COALESCE(
              json_agg(json_build_object('id', e.id, 'nombre', e.nombre))
              FILTER (WHERE e.id IS NOT NULL), '[]'
            ) AS especies
     FROM proveedores p
     LEFT JOIN empresas emp        ON emp.id = p.empresa_id
     LEFT JOIN proveedor_especies pe ON pe.proveedor_id = p.id
     LEFT JOIN especies e          ON e.id  = pe.especie_id
     WHERE p.id = $1
     GROUP BY p.id, emp.nombre`,
    [id]
  );
  return rows[0] || null;
}

async function crearProveedor({ nombre, rut, contacto, telefono, correo, empresaId, creadoPor, especieIds = [] }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [p] } = await client.query(
      `INSERT INTO proveedores (nombre, rut, contacto, telefono, correo, empresa_id, creado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [nombre, rut || null, contacto || null, telefono || null, correo || null, empresaId, creadoPor]
    );
    for (const eid of especieIds) {
      await client.query(
        `INSERT INTO proveedor_especies (proveedor_id, especie_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [p.id, eid]
      );
    }
    await client.query('COMMIT');
    return buscarProveedorPorId(p.id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function actualizarProveedor(id, { nombre, rut, contacto, telefono, correo, especieIds }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [p] } = await client.query(
      `UPDATE proveedores
       SET nombre     = COALESCE($1, nombre),
           rut        = COALESCE($2, rut),
           contacto   = COALESCE($3, contacto),
           telefono   = COALESCE($4, telefono),
           correo     = COALESCE($5, correo),
           updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [nombre, rut, contacto, telefono, correo, id]
    );
    if (!p) { await client.query('ROLLBACK'); return null; }

    if (Array.isArray(especieIds)) {
      await client.query('DELETE FROM proveedor_especies WHERE proveedor_id = $1', [id]);
      for (const eid of especieIds) {
        await client.query(
          `INSERT INTO proveedor_especies (proveedor_id, especie_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [id, eid]
        );
      }
    }
    await client.query('COMMIT');
    return buscarProveedorPorId(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function eliminarProveedor(id) {
  const { rowCount } = await pool.query('DELETE FROM proveedores WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { listarProveedores, buscarProveedorPorId, crearProveedor, actualizarProveedor, eliminarProveedor };
