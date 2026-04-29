const express = require('express');
const { listarUsuarios, buscarPorId, crearUsuario, actualizarUsuario, eliminarUsuario, resetearPassword } = require('../models/User');
const { empresasDeUsuario, asignarUsuario, desasignarUsuario } = require('../models/Empresa');
const { verificarToken, soloAdmin, nivelRol } = require('../middleware/auth');

const router = express.Router();
const ROLES_VALIDOS = ['superadmin', 'admin', 'gestor'];

// GET /api/usuarios  — superadmin ve todos, admin ve todos excepto superadmins
router.get('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    let usuarios = await listarUsuarios();
    if (req.usuario.rol === 'admin') {
      usuarios = usuarios.filter(u => u.rol !== 'superadmin');
    }
    res.json({ usuarios });
  } catch (err) {
    console.error('Error al listar usuarios:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/usuarios  — superadmin puede crear cualquier rol, admin solo admin/gestor
router.post('/', verificarToken, soloAdmin, async (req, res) => {
  const { nombre, email, password, rol, empresaId } = req.body;

  if (!nombre || !email || !password || !rol) {
    return res.status(400).json({ error: 'Nombre, email, contraseña y rol son obligatorios' });
  }
  if (!ROLES_VALIDOS.includes(rol)) {
    return res.status(400).json({ error: `Rol inválido. Valores: ${ROLES_VALIDOS.join(', ')}` });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }
  if (req.usuario.rol === 'admin' && nivelRol(rol) >= nivelRol('superadmin')) {
    return res.status(403).json({ error: 'No tienes permiso para crear superadministradores' });
  }

  try {
    const { buscarPorEmail } = require('../models/User');
    const existente = await buscarPorEmail(email);
    if (existente) return res.status(409).json({ error: 'El email ya está registrado' });

    const usuario = await crearUsuario({ nombre, email, password, rol });

    // Solo superadmin puede asignar empresa al crear usuario
    if (req.usuario.rol === 'superadmin' && empresaId) {
      await asignarUsuario(parseInt(empresaId), usuario.id);
    }

    res.status(201).json({ usuario });
  } catch (err) {
    console.error('Error al crear usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/usuarios/:id
router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const { nombre, email, rol } = req.body;

  if (rol && !ROLES_VALIDOS.includes(rol)) {
    return res.status(400).json({ error: `Rol inválido. Valores: ${ROLES_VALIDOS.join(', ')}` });
  }

  try {
    const objetivo = await buscarPorId(id);
    if (!objetivo) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Admin no puede modificar superadmins ni asignar ese rol
    if (req.usuario.rol === 'admin') {
      if (objetivo.rol === 'superadmin') {
        return res.status(403).json({ error: 'No tienes permiso para modificar superadministradores' });
      }
      if (rol === 'superadmin') {
        return res.status(403).json({ error: 'No puedes asignar el rol de superadministrador' });
      }
    }

    const usuario = await actualizarUsuario(id, { nombre, email, rol });

    // Solo superadmin puede reasignar empresa
    if (req.usuario.rol === 'superadmin' && empresaId !== undefined) {
      const actuales = await empresasDeUsuario(id);
      for (const eid of actuales) await desasignarUsuario(eid, id);
      if (empresaId) await asignarUsuario(parseInt(empresaId), id);
    }

    res.json({ usuario });
  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/usuarios/:id
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  if (id === req.usuario.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
  }

  try {
    const objetivo = await buscarPorId(id);
    if (!objetivo) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (req.usuario.rol === 'admin' && objetivo.rol === 'superadmin') {
      return res.status(403).json({ error: 'No tienes permiso para eliminar superadministradores' });
    }

    await eliminarUsuario(id);
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/usuarios/:id/reset-password — admin/superadmin restaura contraseña
router.post('/:id/reset-password', verificarToken, soloAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  if (id === req.usuario.id) return res.status(400).json({ error: 'No puedes restaurar tu propia contraseña desde aquí' });

  try {
    const objetivo = await buscarPorId(id);
    if (!objetivo) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (req.usuario.rol === 'admin' && objetivo.rol === 'superadmin') {
      return res.status(403).json({ error: 'No tienes permiso para modificar superadministradores' });
    }

    const passwordTemporal = await resetearPassword(id);
    res.json({ passwordTemporal });
  } catch (err) {
    console.error('Error al restaurar contraseña:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
