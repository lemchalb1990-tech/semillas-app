import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/client';

const FORM_VACIO = { nombre: '', descripcion: '' };

function EmpresaModal({ empresa, onGuardar, onCerrar }) {
  const editando = !!empresa;
  const [form, setForm] = useState(editando ? { nombre: empresa.nombre, descripcion: empresa.descripcion || '' } : FORM_VACIO);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  function onChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
    setError(''); setGuardando(true);
    try {
      await onGuardar(form);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCerrar()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{editando ? 'Editar empresa' : 'Nueva empresa'}</h3>
          <button className="modal-close" onClick={onCerrar}>✕</button>
        </div>
        {error && <div className="alert alert-error">⚠ {error}</div>}
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Nombre de la empresa *</label>
            <input name="nombre" value={form.nombre} onChange={onChange} placeholder="Ej: AgroSemillas S.A.S" required />
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <textarea name="descripcion" value={form.descripcion} onChange={onChange} placeholder="Descripción de la empresa..." />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={guardando} style={{ minWidth: 120 }}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UsuariosModal({ empresa, onCerrar }) {
  const [usuarios, setUsuarios]       = useState([]);
  const [disponibles, setDisponibles] = useState([]);
  const [seleccionado, setSeleccionado] = useState('');
  const [cargando, setCargando]       = useState(true);

  async function cargar() {
    setCargando(true);
    try {
      const { data } = await api.get(`/empresas/${empresa.id}/usuarios`);
      setUsuarios(data.usuarios);
      setDisponibles(data.disponibles);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  async function asignar() {
    if (!seleccionado) return;
    await api.post(`/empresas/${empresa.id}/usuarios`, { usuarioId: parseInt(seleccionado) });
    setSeleccionado('');
    cargar();
  }

  async function desasignar(usuarioId) {
    await api.delete(`/empresas/${empresa.id}/usuarios/${usuarioId}`);
    cargar();
  }

  const ROL_LABEL = { superadmin: 'Superadmin', admin: 'Administrador', gestor: 'Gestor' };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCerrar()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h3>Usuarios de {empresa.nombre}</h3>
          <button className="modal-close" onClick={onCerrar}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1.25rem' }}>
          <select
            value={seleccionado}
            onChange={e => setSeleccionado(e.target.value)}
            style={{ flex: 1, padding: '.6rem .9rem', borderRadius: 8, border: '1.5px solid var(--gris-300)', fontSize: '.9rem' }}
          >
            <option value="">Seleccionar usuario para asignar...</option>
            {disponibles.map(u => (
              <option key={u.id} value={u.id}>{u.nombre} — {ROL_LABEL[u.rol]}</option>
            ))}
          </select>
          <button className="btn btn-primary" style={{ minWidth: 90 }} onClick={asignar} disabled={!seleccionado}>
            Asignar
          </button>
        </div>

        {cargando ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : usuarios.length === 0 ? (
          <div className="empty">
            <p>Sin usuarios asignados aún</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Rol</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="td-name">{u.nombre}</div>
                      <div className="td-muted">{u.email}</div>
                    </td>
                    <td><span className="badge badge-activo">{ROL_LABEL[u.rol]}</span></td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => desasignar(u.id)}>Remover</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCerrar}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

export default function Empresas() {
  const [empresas, setEmpresas]           = useState([]);
  const [cargando, setCargando]           = useState(true);
  const [modal, setModal]                 = useState(null);
  const [modalUsuarios, setModalUsuarios] = useState(null);
  const [confirmEliminar, setConfirmEliminar] = useState(null);

  async function cargar() {
    setCargando(true);
    try {
      const { data } = await api.get('/empresas');
      setEmpresas(data.empresas);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  async function guardar(form) {
    if (modal === 'nuevo') await api.post('/empresas', form);
    else await api.put(`/empresas/${modal.id}`, form);
    setModal(null);
    cargar();
  }

  async function eliminar(id) {
    await api.delete(`/empresas/${id}`);
    setConfirmEliminar(null);
    cargar();
  }

  return (
    <Layout>
      <div className="page">
        <div className="page-header">
          <div className="page-header-left">
            <h2>Gestión de Empresas</h2>
            <p>Administración de empresas y sus usuarios asignados</p>
          </div>
          <button className="btn btn-primary" onClick={() => setModal('nuevo')}>
            + Nueva empresa
          </button>
        </div>

        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-card-label">Total empresas</div>
            <div className="stat-card-value">{empresas.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Activas</div>
            <div className="stat-card-value verde">{empresas.filter(e => e.estado === 'activa').length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Usuarios asignados</div>
            <div className="stat-card-value azul">{empresas.reduce((s, e) => s + parseInt(e.total_usuarios), 0)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Proyectos totales</div>
            <div className="stat-card-value">{empresas.reduce((s, e) => s + parseInt(e.total_proyectos), 0)}</div>
          </div>
        </div>

        {cargando ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : empresas.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🏢</div>
            <h3>Sin empresas registradas</h3>
            <p>Crea la primera empresa haciendo clic en "Nueva empresa"</p>
          </div>
        ) : (
          <div className="table-wrap">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Empresa</th>
                    <th>Estado</th>
                    <th>Usuarios</th>
                    <th>Proyectos</th>
                    <th>Registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {empresas.map(e => (
                    <tr key={e.id}>
                      <td>
                        <div className="td-name">{e.nombre}</div>
                        {e.descripcion && <div className="td-muted">{e.descripcion}</div>}
                      </td>
                      <td>
                        <span className={`badge ${e.estado === 'activa' ? 'badge-activo' : 'badge-cancelado'}`}>
                          {e.estado}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setModalUsuarios(e)}
                          style={{ color: 'var(--azul)' }}
                        >
                          👥 {e.total_usuarios}
                        </button>
                      </td>
                      <td className="td-muted">{e.total_proyectos}</td>
                      <td className="td-muted">{new Date(e.created_at).toLocaleDateString('es-CO')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '.5rem' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setModal(e)}>Editar</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setConfirmEliminar(e)}>Eliminar</button>
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
        <EmpresaModal
          empresa={modal === 'nuevo' ? null : modal}
          onGuardar={guardar}
          onCerrar={() => setModal(null)}
        />
      )}

      {modalUsuarios && (
        <UsuariosModal empresa={modalUsuarios} onCerrar={() => setModalUsuarios(null)} />
      )}

      {confirmEliminar && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Eliminar empresa</h3>
              <button className="modal-close" onClick={() => setConfirmEliminar(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--gris-600)', fontSize: '.9rem' }}>
              ¿Eliminar <strong>{confirmEliminar.nombre}</strong>? Se removerán todas las asignaciones de usuarios. Esta acción no se puede deshacer.
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
