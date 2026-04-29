const express = require('express');
const { listarProveedores, buscarProveedorPorId, crearProveedor, actualizarProveedor, eliminarProveedor } = require('../models/Proveedor');
const { empresasDeUsuario } = require('../models/Empresa');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/proveedores — cada usuario ve solo los de sus empresas
router.get('/', verificarToken, async (req, res) => {
  try {
    let ids;
    if (req.usuario.rol === 'superadmin') {
      const pool = require('../db/connection');
      const { rows } = await pool.query('SELECT id FROM empresas');
      ids = rows.map(r => r.id);
    } else {
      ids = await empresasDeUsuario(req.usuario.id);
    }
    if (ids.length === 0) return res.json({ proveedores: [] });
    const proveedores = await listarProveedores(ids);
    res.json({ proveedores });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/proveedores — solo admin
router.post('/', verificarToken, soloAdmin, async (req, res) => {
  const { nombre, empresaId, especieIds } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

  try {
    let empId = empresaId;

    if (req.usuario.rol === 'admin') {
      const ids = await empresasDeUsuario(req.usuario.id);
      if (ids.length === 0) return res.status(403).json({ error: 'No tienes empresa asignada' });
      empId = ids[0];
    }

    if (!empId) return res.status(400).json({ error: 'empresaId es obligatorio' });

    const proveedor = await crearProveedor({
      nombre,
      empresaId: empId,
      creadoPor: req.usuario.id,
      especieIds: especieIds || [],
    });
    res.status(201).json({ proveedor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/proveedores/:id — solo admin de esa empresa
router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const existente = await buscarProveedorPorId(id);
    if (!existente) return res.status(404).json({ error: 'Proveedor no encontrado' });

    if (req.usuario.rol === 'admin') {
      const ids = await empresasDeUsuario(req.usuario.id);
      if (!ids.includes(existente.empresa_id)) {
        return res.status(403).json({ error: 'No puedes modificar proveedores de otra empresa' });
      }
    }

    const { nombre, especieIds } = req.body;
    const proveedor = await actualizarProveedor(id, { nombre, especieIds });
    res.json({ proveedor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/proveedores/:id — solo admin de esa empresa
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const existente = await buscarProveedorPorId(id);
    if (!existente) return res.status(404).json({ error: 'Proveedor no encontrado' });

    if (req.usuario.rol === 'admin') {
      const ids = await empresasDeUsuario(req.usuario.id);
      if (!ids.includes(existente.empresa_id)) {
        return res.status(403).json({ error: 'No puedes eliminar proveedores de otra empresa' });
      }
    }

    await eliminarProveedor(id);
    res.json({ mensaje: 'Proveedor eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
