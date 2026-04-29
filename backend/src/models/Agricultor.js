const pool = require('../db/connection');

const SELECT_AGRICULTOR = `
  SELECT a.*,
    emp.nombre AS empresa_nombre,
    u.nombre   AS creado_por_nombre,
    COALESCE((
      SELECT json_agg(json_build_object('id', ac.id, 'nombre', ac.nombre, 'ubicacion', ac.ubicacion)
                      ORDER BY ac.id)
      FROM agricultor_campos ac WHERE ac.agricultor_id = a.id
    ), '[]') AS campos,
    COALESCE((
      SELECT json_agg(json_build_object('id', e.id, 'nombre', e.nombre) ORDER BY e.nombre)
      FROM agricultor_especies ae JOIN especies e ON e.id = ae.especie_id
      WHERE ae.agricultor_id = a.id
    ), '[]') AS especies
  FROM agricultores a
  LEFT JOIN empresas emp ON emp.id = a.empresa_id
  LEFT JOIN usuarios u   ON u.id   = a.creado_por
`;

async function listarAgricultores(empresaIds) {
  const { rows } = await pool.query(
    `${SELECT_AGRICULTOR} WHERE a.empresa_id = ANY($1::int[]) ORDER BY a.created_at DESC`,
    [empresaIds]
  );
  return rows;
}

async function buscarAgricultorPorId(id) {
  const { rows } = await pool.query(
    `${SELECT_AGRICULTOR} WHERE a.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function crearAgricultor({ nombreContacto, telefono, contactoCampo, empresaId, creadoPor, campos = [], especieIds = [] }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [a] } = await client.query(
      `INSERT INTO agricultores (nombre_contacto, telefono, contacto_campo, empresa_id, creado_por)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [nombreContacto, telefono || null, contactoCampo || null, empresaId, creadoPor]
    );

    for (const c of campos) {
      if (c.nombre?.trim()) {
        await client.query(
          `INSERT INTO agricultor_campos (agricultor_id, nombre, ubicacion) VALUES ($1,$2,$3)`,
          [a.id, c.nombre.trim(), c.ubicacion || null]
        );
      }
    }

    for (const eid of especieIds) {
      await client.query(
        `INSERT INTO agricultor_especies (agricultor_id, especie_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [a.id, eid]
      );
    }

    await client.query('COMMIT');
    return buscarAgricultorPorId(a.id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function actualizarAgricultor(id, { nombreContacto, telefono, contactoCampo, campos, especieIds }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [a] } = await client.query(
      `UPDATE agricultores
       SET nombre_contacto = COALESCE($1, nombre_contacto),
           telefono        = COALESCE($2, telefono),
           contacto_campo  = COALESCE($3, contacto_campo),
           updated_at      = NOW()
       WHERE id = $4 RETURNING *`,
      [nombreContacto, telefono, contactoCampo, id]
    );
    if (!a) { await client.query('ROLLBACK'); return null; }

    if (Array.isArray(campos)) {
      await client.query('DELETE FROM agricultor_campos WHERE agricultor_id = $1', [id]);
      for (const c of campos) {
        if (c.nombre?.trim()) {
          await client.query(
            `INSERT INTO agricultor_campos (agricultor_id, nombre, ubicacion) VALUES ($1,$2,$3)`,
            [id, c.nombre.trim(), c.ubicacion || null]
          );
        }
      }
    }

    if (Array.isArray(especieIds)) {
      await client.query('DELETE FROM agricultor_especies WHERE agricultor_id = $1', [id]);
      for (const eid of especieIds) {
        await client.query(
          `INSERT INTO agricultor_especies (agricultor_id, especie_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [id, eid]
        );
      }
    }

    await client.query('COMMIT');
    return buscarAgricultorPorId(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function eliminarAgricultor(id) {
  const { rowCount } = await pool.query('DELETE FROM agricultores WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { listarAgricultores, buscarAgricultorPorId, crearAgricultor, actualizarAgricultor, eliminarAgricultor };
