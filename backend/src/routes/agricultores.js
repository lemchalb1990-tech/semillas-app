const express = require('express');
const { listarAgricultores, buscarAgricultorPorId, crearAgricultor, actualizarAgricultor, eliminarAgricultor } = require('../models/Agricultor');
const { empresasDeUsuario } = require('../models/Empresa');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

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
    if (ids.length === 0) return res.json({ agricultores: [] });
    const agricultores = await listarAgricultores(ids);
    res.json({ agricultores });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', verificarToken, soloAdmin, async (req, res) => {
  const { nombreContacto, telefono, contactoCampo, empresaId, campos, especieIds } = req.body;
  if (!nombreContacto) return res.status(400).json({ error: 'El nombre de contacto es obligatorio' });

  try {
    let empId = empresaId;
    if (req.usuario.rol === 'admin') {
      const ids = await empresasDeUsuario(req.usuario.id);
      if (ids.length === 0) return res.status(403).json({ error: 'No tienes empresa asignada' });
      empId = ids[0];
    }
    if (!empId) return res.status(400).json({ error: 'empresaId es obligatorio' });

    const agricultor = await crearAgricultor({
      nombreContacto, telefono, contactoCampo,
      empresaId: empId,
      creadoPor: req.usuario.id,
      campos: campos || [],
      especieIds: especieIds || [],
    });
    res.status(201).json({ agricultor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const existente = await buscarAgricultorPorId(id);
    if (!existente) return res.status(404).json({ error: 'Agricultor no encontrado' });

    if (req.usuario.rol === 'admin') {
      const ids = await empresasDeUsuario(req.usuario.id);
      if (!ids.includes(existente.empresa_id)) {
        return res.status(403).json({ error: 'No puedes modificar agricultores de otra empresa' });
      }
    }

    const { nombreContacto, telefono, contactoCampo, campos, especieIds } = req.body;
    const agricultor = await actualizarAgricultor(id, { nombreContacto, telefono, contactoCampo, campos, especieIds });
    res.json({ agricultor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const existente = await buscarAgricultorPorId(id);
    if (!existente) return res.status(404).json({ error: 'Agricultor no encontrado' });

    if (req.usuario.rol === 'admin') {
      const ids = await empresasDeUsuario(req.usuario.id);
      if (!ids.includes(existente.empresa_id)) {
        return res.status(403).json({ error: 'No puedes eliminar agricultores de otra empresa' });
      }
    }

    await eliminarAgricultor(id);
    res.json({ mensaje: 'Agricultor eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
