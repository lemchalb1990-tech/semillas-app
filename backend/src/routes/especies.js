const express = require('express');
const { listarEspecies, buscarEspeciePorId, crearEspecie, actualizarEspecie, eliminarEspecie } = require('../models/Especie');
const { empresasDeUsuario } = require('../models/Empresa');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/especies — cada usuario ve solo las de sus empresas
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
    if (ids.length === 0) return res.json({ especies: [] });
    const especies = await listarEspecies(ids);
    res.json({ especies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/especies — solo admin (crea en su empresa)
router.post('/', verificarToken, soloAdmin, async (req, res) => {
  const { nombre, descripcion, empresaId } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

  try {
    let empId = empresaId;

    if (req.usuario.rol === 'admin') {
      const ids = await empresasDeUsuario(req.usuario.id);
      if (ids.length === 0) return res.status(403).json({ error: 'No tienes empresa asignada' });
      empId = ids[0];
    }

    if (!empId) return res.status(400).json({ error: 'empresaId es obligatorio' });

    const especie = await crearEspecie({ nombre, descripcion, empresaId: empId, creadoPor: req.usuario.id });
    res.status(201).json({ especie });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/especies/:id — solo admin de esa empresa
router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const existente = await buscarEspeciePorId(id);
    if (!existente) return res.status(404).json({ error: 'Especie no encontrada' });

    if (req.usuario.rol === 'admin') {
      const ids = await empresasDeUsuario(req.usuario.id);
      if (!ids.includes(existente.empresa_id)) {
        return res.status(403).json({ error: 'No puedes modificar especies de otra empresa' });
      }
    }

    const { nombre, descripcion } = req.body;
    const especie = await actualizarEspecie(id, { nombre, descripcion });
    res.json({ especie });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/especies/:id — solo admin de esa empresa
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const existente = await buscarEspeciePorId(id);
    if (!existente) return res.status(404).json({ error: 'Especie no encontrada' });

    if (req.usuario.rol === 'admin') {
      const ids = await empresasDeUsuario(req.usuario.id);
      if (!ids.includes(existente.empresa_id)) {
        return res.status(403).json({ error: 'No puedes eliminar especies de otra empresa' });
      }
    }

    await eliminarEspecie(id);
    res.json({ mensaje: 'Especie eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
