import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const ROLES_VALIDOS = ['superadmin', 'admin', 'gestor'];
const ROL_LABEL = { superadmin: 'Superadministrador', admin: 'Administrador', gestor: 'Gestor' };
const ROL_COLORS = {
  superadmin: { bg: '#7c3aed', color: '#ffffff' },
  admin:      { bg: '#dbeafe', color: '#1d4ed8' },
  gestor:     { bg: '#dcfce7', color: '#15803d' },
};

function RolBadge({ rol }) {
  const c = ROL_COLORS[rol] || { bg: '#f3f4f6', color: '#374151' };
  return (
    <span className="badge" style={{ background: c.bg, color: c.color }}>
      {ROL_LABEL[rol] || rol}
    </span>
  );
}

function Iniciales({ nombre, rol }) {
  const ini = nombre?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const bg = { superadmin: '#7c3aed', admin: '#1d4ed8', gestor: '#15803d' }[rol] || '#6b7280';
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      background: bg, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: '.8rem', flexShrink: 0,
    }}>
      {ini}
    </div>
  );
}

const FORM_VACIO = { nombre: '', email: '', password: '', rol: 'gestor' };

export default function Usuarios() {
  const { usuario: yo } = useAuth();
  const esSuperadmin = yo?.rol === 'superadmin';

  const [usuarios, setUsuarios]         = useState([]);
  const [cargando, setCargando]         = useState(true);
  const [modal, setModal]               = useState(null);
  const [form, setForm]                 = useState(FORM_VACIO);
  const [error, setError]               = useState('');
  const [guardando, setGuardando]       = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState(null);

  async function cargar() {
    setCargando(true);
    try {
      const { data } = await api.get('/usuarios');
      setUsuarios(data.usuarios);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  function abrirNuevo() { setForm(FORM_VACIO); setError(''); setModal('nuevo'); }
  function abrirEditar(u) { setForm({ nombre: u.nombre, email: u.email, password: '', rol: u.rol }); setError(''); setModal(u); }
  function onChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  async function guardar(e) {
    e.preventDefault();
    setError(''); setGuardando(true);
    try {
      if (modal === 'nuevo') {
        await api.post('/usuarios', form);
      } else {
        await api.put(`/usuarios/${modal.id}`, { nombre: form.nombre, email: form.email, rol: form.rol });
      }
      setModal(null);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id) {
    try { await api.delete(`/usuarios/${id}`); setConfirmEliminar(null); cargar(); }
    catch (err) { alert(err.response?.data?.error || 'Error al eliminar'); }
  }

  const rolesDisponibles = esSuperadmin ? ROLES_VALIDOS : ['admin', 'gestor'];

  function puedeEditar(u) {
    if (u.id === yo.id) return false;
    if (u.rol === 'superadmin' && !esSuperadmin) return false;
    return true;
  }

  const conteos = {
    total:      usuarios.length,
    superadmin: usuarios.filter(u => u.rol === 'superadmin').length,
    admin:      usuarios.filter(u => u.rol === 'admin').length,
    gestor:     usuarios.filter(u => u.rol === 'gestor').length,
  };

  return (
    <Layout>
      <div className="page">
        <div className="page-header">
          <div className="page-header-left">
            <h2>Gestión de Usuarios</h2>
            <p>Administración de cuentas y roles del sistema</p>
          </div>
          <button className="btn btn-primary" onClick={abrirNuevo}>
            + Nuevo usuario
          </button>
        </div>

        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-card-label">Total usuarios</div>
            <div className="stat-card-value">{conteos.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Superadmins</div>
            <div className="stat-card-value" style={{ color: '#7c3aed' }}>{conteos.superadmin}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Administradores</div>
            <div className="stat-card-value azul">{conteos.admin}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Gestores</div>
            <div className="stat-card-value verde">{conteos.gestor}</div>
          </div>
        </div>

        {cargando ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : (
          <div className="table-wrap">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                          <Iniciales nombre={u.nombre} rol={u.rol} />
                          <div>
                            <div className="td-name">
                              {u.nombre}
                              {u.id === yo.id && <span className="td-muted" style={{ marginLeft: '.4rem' }}>(tú)</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="td-muted">{u.email}</td>
                      <td><RolBadge rol={u.rol} /></td>
                      <td className="td-muted">{new Date(u.created_at).toLocaleDateString('es-CO')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '.5rem' }}>
                          {puedeEditar(u) && (
                            <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(u)}>Editar</button>
                          )}
                          {puedeEditar(u) && (
                            <button className="btn btn-danger btn-sm" onClick={() => setConfirmEliminar(u)}>Eliminar</button>
                          )}
                          {!puedeEditar(u) && <span className="td-muted" style={{ fontSize: '.78rem' }}>—</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{modal === 'nuevo' ? 'Nuevo usuario' : 'Editar usuario'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            {error && <div className="alert alert-error">⚠ {error}</div>}
            <form onSubmit={guardar}>
              <div className="form-group">
                <label>Nombre completo</label>
                <input name="nombre" value={form.nombre} onChange={onChange} required placeholder="Nombre del usuario" />
              </div>
              <div className="form-group">
                <label>Correo electrónico</label>
                <input type="email" name="email" value={form.email} onChange={onChange} required placeholder="correo@ejemplo.com" />
              </div>
              {modal === 'nuevo' && (
                <div className="form-group">
                  <label>Contraseña</label>
                  <input type="password" name="password" value={form.password} onChange={onChange} required placeholder="Mínimo 8 caracteres" />
                </div>
              )}
              <div className="form-group">
                <label>Rol del sistema</label>
                <select name="rol" value={form.rol} onChange={onChange}>
                  {rolesDisponibles.map(r => (
                    <option key={r} value={r}>{ROL_LABEL[r]}</option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={guardando} style={{ minWidth: 120 }}>
                  {guardando ? 'Guardando...' : modal === 'nuevo' ? 'Crear usuario' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmEliminar && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Eliminar usuario</h3>
              <button className="modal-close" onClick={() => setConfirmEliminar(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--gris-600)', fontSize: '.9rem' }}>
              ¿Eliminar a <strong>{confirmEliminar.nombre}</strong> con rol <strong>{ROL_LABEL[confirmEliminar.rol]}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmEliminar(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => eliminar(confirmEliminar.id)}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
