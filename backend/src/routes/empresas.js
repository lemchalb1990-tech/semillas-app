const express = require('express');
const {
  listarEmpresas, buscarEmpresaPorId, crearEmpresa, actualizarEmpresa, eliminarEmpresa,
  obtenerUsuariosDeEmpresa, usuariosDisponibles, asignarUsuario, desasignarUsuario,
} = require('../models/Empresa');
const { verificarToken, soloSuperadmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/empresas — todos los autenticados pueden ver
router.get('/', verificarToken, async (req, res) => {
  try {
    const empresas = await listarEmpresas();
    res.json({ empresas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/empresas/:id
router.get('/:id', verificarToken, async (req, res) => {
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
  const { nombre, rut, nombreContacto, telefonoContacto, correoContacto } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
  try {
    const empresa = await crearEmpresa({ nombre, rut, nombreContacto, telefonoContacto, correoContacto });
    res.status(201).json({ empresa });
  } catch (err) {
    console.error('Error crear empresa:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/empresas/:id — solo superadmin
router.put('/:id', verificarToken, soloSuperadmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  const { nombre, rut, nombreContacto, telefonoContacto, correoContacto } = req.body;
  try {
    const empresa = await actualizarEmpresa(id, { nombre, rut, nombreContacto, telefonoContacto, correoContacto });
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
router.get('/:id/usuarios', verificarToken, soloSuperadmin, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const [asignados, disponibles] = await Promise.all([
      obtenerUsuariosDeEmpresa(id),
      usuariosDisponibles(id),
    ]);
    res.json({ asignados, disponibles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/empresas/:id/usuarios
router.post('/:id/usuarios', verificarToken, soloSuperadmin, async (req, res) => {
  const empresaId = parseInt(req.params.id);
  const { usuarioId } = req.body;
  if (!usuarioId) return res.status(400).json({ error: 'usuarioId requerido' });
  try {
    await asignarUsuario(empresaId, usuarioId);
    res.json({ mensaje: 'Usuario asignado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/empresas/:id/usuarios/:usuarioId
router.delete('/:id/usuarios/:usuarioId', verificarToken, soloSuperadmin, async (req, res) => {
  const empresaId = parseInt(req.params.id);
  const usuarioId = parseInt(req.params.usuarioId);
  try {
    await desasignarUsuario(empresaId, usuarioId);
    res.json({ mensaje: 'Usuario removido' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
