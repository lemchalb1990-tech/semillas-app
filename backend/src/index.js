const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes     = require('./routes/auth');
const projectRoutes  = require('./routes/projects');
const usuariosRoutes = require('./routes/usuarios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ mensaje: 'API Semillas funcionando correctamente' });
});

app.use('/api/auth',      authRoutes);
app.use('/api/proyectos', projectRoutes);
app.use('/api/usuarios',  usuariosRoutes);

// 404 genérico
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`  POST /api/auth/registro`);
  console.log(`  POST /api/auth/login`);
  console.log(`  GET  /api/auth/perfil`);
  console.log(`  GET  /api/proyectos`);
  console.log(`  POST /api/proyectos`);
});

module.exports = app;