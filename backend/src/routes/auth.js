const express = require('express');
const jwt = require('jsonwebtoken');
const { crearUsuario, buscarPorEmail, buscarPorId, actualizarPerfil, verificarPassword } = require('../models/User');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();
const TOKEN_EXPIRA = '8h';
const JWT_SECRET = process.env.JWT_SECRET || 'semillas_jwt_secret_prod_2024';

function generarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRA }
  );
}

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  try {
    const existente = await buscarPorEmail(email);
    if (existente) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const usuario = await crearUsuario({ nombre, email, password });
    const token = generarToken(usuario);

    res.status(201).json({ token, usuario });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  try {
    const usuario = await buscarPorEmail(email);
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValida = await verificarPassword(password, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const { password_hash, ...usuarioSeguro } = usuario;
    const token = generarToken(usuarioSeguro);

    res.json({ token, usuario: usuarioSeguro });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/auth/perfil
router.get('/perfil', verificarToken, async (req, res) => {
  try {
    const usuario = await buscarPorId(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ usuario });
  } catch (err) {
    console.error('Error al obtener perfil:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/auth/perfil
router.put('/perfil', verificarToken, async (req, res) => {
  const { nombre, email } = req.body;

  if (!nombre && !email) {
    return res.status(400).json({ error: 'Debe enviar al menos un campo a actualizar' });
  }

  try {
    if (email) {
      const existente = await buscarPorEmail(email);
      if (existente && existente.id !== req.usuario.id) {
        return res.status(409).json({ error: 'El email ya está en uso por otra cuenta' });
      }
    }

    const usuario = await actualizarPerfil(req.usuario.id, { nombre, email });
    res.json({ usuario });
  } catch (err) {
    console.error('Error al actualizar perfil:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
