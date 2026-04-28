const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const bcrypt         = require('bcryptjs');
const authRoutes     = require('./routes/auth');
const projectRoutes  = require('./routes/projects');
const usuariosRoutes = require('./routes/usuarios');
const empresasRoutes = require('./routes/empresas');
const pool           = require('./db/connection');

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
app.use('/api/empresas',  empresasRoutes);

// 404 genérico
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

async function migrarTablas() {
  let client;
  try {
    client = await pool.connect();

    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id            SERIAL PRIMARY KEY,
        nombre        VARCHAR(100) NOT NULL,
        email         VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        rol           VARCHAR(20) NOT NULL DEFAULT 'gestor'
                        CHECK (rol IN ('superadmin', 'admin', 'gestor')),
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS proyectos (
        id           SERIAL PRIMARY KEY,
        nombre       VARCHAR(200) NOT NULL,
        descripcion  TEXT,
        especie      VARCHAR(100),
        estado       VARCHAR(20) NOT NULL DEFAULT 'activo'
                       CHECK (estado IN ('activo','completado','pausado','cancelado')),
        fecha_inicio DATE,
        fecha_fin    DATE,
        ubicacion    VARCHAR(255),
        usuario_id   INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS empresas (
        id                SERIAL PRIMARY KEY,
        nombre            VARCHAR(200) NOT NULL,
        rut               VARCHAR(20),
        nombre_contacto   VARCHAR(100),
        telefono_contacto VARCHAR(30),
        correo_contacto   VARCHAR(100),
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS rut               VARCHAR(20);`);
    await client.query(`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS nombre_contacto   VARCHAR(100);`);
    await client.query(`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS telefono_contacto VARCHAR(30);`);
    await client.query(`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS correo_contacto   VARCHAR(100);`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS empresa_usuarios (
        empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (empresa_id, usuario_id)
      );
    `);

    await client.query(`
      ALTER TABLE proyectos
        ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id) ON DELETE SET NULL;
    `);

    console.log('Tablas verificadas/creadas correctamente');
    await seedDatos(client);
  } catch (err) {
    console.error('Error en migración (no crítico):', err.message);
  } finally {
    if (client) client.release();
  }
}

async function seedDatos(client) {
  const { rows } = await client.query('SELECT 1 FROM usuarios LIMIT 1');
  if (rows.length > 0) return; // ya hay datos, no hacer nada

  const hash = async (pwd) => bcrypt.hash(pwd, 10);

  const { rows: [luis] } = await client.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    ['Luis Chavez', 'luis@semillas.com', await hash('Admin2024!'), 'superadmin']
  );
  await client.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4)`,
    ['Jose Administrador', 'jose@semillas.com', await hash('Admin2024!'), 'admin']
  );
  await client.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4)`,
    ['Pedro Aguirre', 'pedro@semillas.com', await hash('Admin2024!'), 'gestor']
  );

  console.log('Datos iniciales creados: 3 usuarios');
  console.log('  superadmin → luis@semillas.com / Admin2024!');
  console.log('  admin      → jose@semillas.com / Admin2024!');
  console.log('  gestor     → pedro@semillas.com / Admin2024!');
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`  POST /api/auth/registro`);
  console.log(`  POST /api/auth/login`);
  console.log(`  GET  /api/auth/perfil`);
  console.log(`  GET  /api/proyectos`);
  console.log(`  POST /api/proyectos`);
  console.log(`  GET  /api/empresas`);
  console.log(`  POST /api/empresas`);
  migrarTablas();
});

module.exports = app;