import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ViewToggle from '../components/ViewToggle';
import { useViewMode } from '../hooks/useViewMode';
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

const FORM_VACIO = { nombre: '', email: '', password: '', rol: 'gestor', empresaId: '' };

export default function Usuarios() {
  const { usuario: yo } = useAuth();
  const esSuperadmin = yo?.rol === 'superadmin';

  const [usuarios, setUsuarios]         = useState([]);
  const [empresas, setEmpresas]         = useState([]);
  const [cargando, setCargando]         = useState(true);
  const [modal, setModal]               = useState(null);
  const [form, setForm]                 = useState(FORM_VACIO);
  const [error, setError]               = useState('');
  const [guardando, setGuardando]       = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [resetando, setResetando]           = useState(null);
  const [passwordGenerada, setPasswordGenerada] = useState(null);
  const [copiado, setCopiado]               = useState(false);
  const [modo, setModo] = useViewMode('usuarios', 'cards');

  async function cargar() {
    setCargando(true);
    try {
      const [{ data: u }, { data: e }] = await Promise.all([
        api.get('/usuarios'),
        esSuperadmin ? api.get('/empresas') : Promise.resolve({ data: { empresas: [] } }),
      ]);
      setUsuarios(u.usuarios);
      setEmpresas(e.empresas);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  function abrirNuevo() { setForm(FORM_VACIO); setError(''); setModal('nuevo'); }
  function abrirEditar(u) { setForm({ nombre: u.nombre, email: u.email, password: '', rol: u.rol, empresaId: u.empresa_id ? String(u.empresa_id) : '' }); setError(''); setModal(u); }
  function onChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  async function guardar(e) {
    e.preventDefault();
    setError(''); setGuardando(true);
    try {
      if (modal === 'nuevo') {
        await api.post('/usuarios', form);
      } else {
        const payload = { nombre: form.nombre, email: form.email, rol: form.rol };
        if (esSuperadmin) payload.empresaId = form.empresaId || '';
        await api.put(`/usuarios/${modal.id}`, payload);
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

  async function confirmarReset() {
    try {
      const { data } = await api.post(`/usuarios/${resetando.id}/reset-password`);
      setResetando(null);
      setPasswordGenerada({ usuario: resetando, pwd: data.passwordTemporal });
      setCopiado(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al restaurar contraseña');
    }
  }

  function copiar() {
    navigator.clipboard.writeText(passwordGenerada.pwd);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
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
          <div className="page-header-actions">
            <ViewToggle mode={modo} onChange={setModo} />
            <button className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo usuario</button>
          </div>
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
        ) : usuarios.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">👥</div>
            <h3>Sin usuarios aún</h3>
            <p>Crea el primer usuario haciendo clic en "Nuevo usuario"</p>
          </div>
        ) : modo === 'cards' ? (
          <div className="cards-grid">
            {usuarios.map(u => (
              <div key={u.id} className="card">
                <div className="card-accent" />
                <div className="card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flex: 1, minWidth: 0 }}>
                    <Iniciales nombre={u.nombre} rol={u.rol} />
                    <div style={{ minWidth: 0 }}>
                      <div className="card-title" style={{ fontSize: '.95rem' }}>
                        {u.nombre}
                        {u.id === yo.id && <span style={{ color: 'var(--gris-400)', fontWeight: 400, fontSize: '.8rem', marginLeft: '.4rem' }}>(tú)</span>}
                      </div>
                      <div style={{ fontSize: '.8rem', color: 'var(--gris-500)', marginTop: '.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                    </div>
                  </div>
                  <RolBadge rol={u.rol} />
                </div>
                <div className="card-body">
                  <p><span>📅</span><span>Registro: {new Date(u.created_at).toLocaleDateString('es-CO')}</span></p>
                </div>
                {puedeEditar(u) && (
                  <div className="card-footer">
                    <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(u)}>Editar</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setResetando(u)} title="Restaurar contraseña">🔑</button>
                    <button className="btn btn-danger btn-sm"    onClick={() => setConfirmEliminar(u)}>Eliminar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
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
                          <span className="td-name">
                            {u.nombre}
                            {u.id === yo.id && <span className="td-muted" style={{ marginLeft: '.4rem' }}>(tú)</span>}
                          </span>
                        </div>
                      </td>
                      <td className="td-muted">{u.email}</td>
                      <td><RolBadge rol={u.rol} /></td>
                      <td className="td-muted">{new Date(u.created_at).toLocaleDateString('es-CO')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '.5rem' }}>
                          {puedeEditar(u) ? (
                            <>
                              <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(u)}>Editar</button>
                              <button className="btn btn-secondary btn-sm" onClick={() => setResetando(u)} title="Restaurar contraseña">🔑</button>
                              <button className="btn btn-danger btn-sm"    onClick={() => setConfirmEliminar(u)}>Eliminar</button>
                            </>
                          ) : <span className="td-muted">—</span>}
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
              {esSuperadmin && (
                <div className="form-group">
                  <label>Empresa asignada</label>
                  <select name="empresaId" value={form.empresaId} onChange={onChange}>
                    <option value="">Sin empresa</option>
                    {empresas.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
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

      {/* Confirmar restaurar contraseña */}
      {resetando && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Restaurar contraseña</h3>
              <button className="modal-close" onClick={() => setResetando(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--gris-600)', fontSize: '.9rem' }}>
              Se generará una contraseña aleatoria para <strong>{resetando.nombre}</strong>. El usuario deberá cambiarla al ingresar.
            </p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setResetando(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={confirmarReset}>Restaurar</button>
            </div>
          </div>
        </div>
      )}

      {/* Mostrar contraseña generada */}
      {passwordGenerada && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Contraseña restaurada</h3>
              <button className="modal-close" onClick={() => setPasswordGenerada(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--gris-600)', fontSize: '.9rem', marginBottom: '1rem' }}>
              Nueva contraseña temporal para <strong>{passwordGenerada.usuario.nombre}</strong>. Cópiala y compártela con el usuario.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', background: 'var(--gris-50,#f9fafb)', border: '1px solid var(--gris-200)', borderRadius: 8, padding: '.75rem 1rem' }}>
              <code style={{ flex: 1, fontSize: '1.1rem', fontWeight: 700, letterSpacing: '.1em', color: 'var(--gris-800)' }}>
                {passwordGenerada.pwd}
              </code>
              <button className="btn btn-secondary btn-sm" onClick={copiar} style={{ whiteSpace: 'nowrap' }}>
                {copiado ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
            <p style={{ fontSize: '.78rem', color: 'var(--gris-400)', marginTop: '.75rem' }}>
              ⚠ Esta contraseña no se volverá a mostrar. Guárdala antes de cerrar.
            </p>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setPasswordGenerada(null)}>Entendido</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
