const express = require('express');
const { listarProyectos, buscarPorId, crearProyecto, actualizarProyecto, eliminarProyecto } = require('../models/Project');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

const ESTADOS_VALIDOS = ['activo', 'completado', 'pausado', 'cancelado'];

// GET /api/proyectos
router.get('/', verificarToken, async (req, res) => {
  const pagina = parseInt(req.query.pagina) || 1;
  const limite = Math.min(parseInt(req.query.limite) || 20, 100);
  const { estado, especie } = req.query;

  if (estado && !ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({ error: `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}` });
  }

  try {
    const resultado = await listarProyectos({
      usuarioId: req.usuario.id,
      rol: req.usuario.rol,
      estado,
      especie,
      pagina,
      limite,
    });
    res.json({ ...resultado, pagina, limite });
  } catch (err) {
    console.error('Error al listar proyectos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/proyectos/:id
router.get('/:id', verificarToken, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const proyecto = await buscarPorId(id);
    if (!proyecto) return res.status(404).json({ error: 'Proyecto no encontrado' });

    if (req.usuario.rol !== 'admin' && proyecto.usuario_id !== req.usuario.id) {
      return res.status(403).json({ error: 'Sin acceso a este proyecto' });
    }

    res.json({ proyecto });
  } catch (err) {
    console.error('Error al obtener proyecto:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/proyectos
router.post('/', verificarToken, async (req, res) => {
  const { nombre, descripcion, especie, estado, fechaInicio, fechaFin, ubicacion, empresaId } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del proyecto es obligatorio' });
  }

  if (estado && !ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({ error: `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}` });
  }

  try {
    const proyecto = await crearProyecto({
      nombre, descripcion, especie, estado,
      fechaInicio, fechaFin, ubicacion,
      usuarioId: req.usuario.id,
      empresaId: empresaId || null,
    });
    res.status(201).json({ proyecto });
  } catch (err) {
    console.error('Error al crear proyecto:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/proyectos/:id
router.put('/:id', verificarToken, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const { nombre, descripcion, especie, estado, fechaInicio, fechaFin, ubicacion } = req.body;

  if (estado && !ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({ error: `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}` });
  }

  try {
    const existente = await buscarPorId(id);
    if (!existente) return res.status(404).json({ error: 'Proyecto no encontrado' });

    if (req.usuario.rol !== 'admin' && existente.usuario_id !== req.usuario.id) {
      return res.status(403).json({ error: 'Sin permiso para modificar este proyecto' });
    }

    const proyecto = await actualizarProyecto(id, { nombre, descripcion, especie, estado, fechaInicio, fechaFin, ubicacion });
    res.json({ proyecto });
  } catch (err) {
    console.error('Error al actualizar proyecto:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/proyectos/:id
router.delete('/:id', verificarToken, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const existente = await buscarPorId(id);
    if (!existente) return res.status(404).json({ error: 'Proyecto no encontrado' });

    if (req.usuario.rol !== 'admin' && existente.usuario_id !== req.usuario.id) {
      return res.status(403).json({ error: 'Sin permiso para eliminar este proyecto' });
    }

    await eliminarProyecto(id);
    res.json({ mensaje: 'Proyecto eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar proyecto:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
