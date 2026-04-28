const express = require('express');
const {
  listarEmpresas, buscarEmpresaPorId, crearEmpresa, actualizarEmpresa, eliminarEmpresa,
  obtenerUsuariosDeEmpresa, asignarUsuario, desasignarUsuario,
} = require('../models/Empresa');
const { listarUsuarios } = require('../models/User');
const { verificarToken, soloSuperadmin, soloAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/empresas — superadmin ve todas, admin ve las suyas
router.get('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    let empresas = await listarEmpresas();
    if (req.usuario.rol === 'admin') {
      const { empresasDeUsuario } = require('../models/Empresa');
      const misEmpresas = await empresasDeUsuario(req.usuario.id);
      const misIds = misEmpresas.map(e => e.id);
      empresas = empresas.filter(e => misIds.includes(e.id));
    }
    res.json({ empresas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/empresas/:id
router.get('/:id', verificarToken, soloAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const empresa = await buscarEmpresaPorId(id);
    if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada' });
    res.json({ empresa });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/empresas — solo superadmin
router.post('/', verificarToken, soloSuperadmin, async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
  try {
    const empresa = await crearEmpresa({ nombre, descripcion });
    res.status(201).json({ empresa });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/empresas/:id — solo superadmin
router.put('/:id', verificarToken, soloSuperadmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  const { nombre, descripcion, estado } = req.body;
  try {
    const empresa = await actualizarEmpresa(id, { nombre, descripcion, estado });
    if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada' });
    res.json({ empresa });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/empresas/:id — solo superadmin
router.delete('/:id', verificarToken, soloSuperadmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const ok = await eliminarEmpresa(id);
    if (!ok) return res.status(404).json({ error: 'Empresa no encontrada' });
    res.json({ mensaje: 'Empresa eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/empresas/:id/usuarios
router.get('/:id/usuarios', verificarToken, soloAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const usuarios = await obtenerUsuariosDeEmpresa(id);
    // Usuarios disponibles para asignar (los que no están ya en la empresa)
    const todos = await listarUsuarios();
    const asignadosIds = usuarios.map(u => u.id);
    const disponibles = todos.filter(u => !asignadosIds.includes(u.id) && u.rol !== 'superadmin');
    res.json({ usuarios, disponibles });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/empresas/:id/usuarios — asignar usuario
router.post('/:id/usuarios', verificarToken, soloSuperadmin, async (req, res) => {
  const empresaId = parseInt(req.params.id);
  const { usuarioId } = req.body;
  if (!usuarioId) return res.status(400).json({ error: 'usuarioId es obligatorio' });
  try {
    await asignarUsuario(empresaId, usuarioId);
    res.json({ mensaje: 'Usuario asignado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/empresas/:id/usuarios/:usuarioId — desasignar usuario
router.delete('/:id/usuarios/:usuarioId', verificarToken, soloSuperadmin, async (req, res) => {
  const empresaId  = parseInt(req.params.id);
  const usuarioId  = parseInt(req.params.usuarioId);
  try {
    await desasignarUsuario(empresaId, usuarioId);
    res.json({ mensaje: 'Usuario removido de la empresa' });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
