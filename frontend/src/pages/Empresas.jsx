import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ViewToggle from '../components/ViewToggle';
import { useViewMode } from '../hooks/useViewMode';
import api from '../api/client';

const FORM_VACIO = { nombre: '', rut: '', nombreContacto: '', telefonoContacto: '', correoContacto: '' };

export default function Empresas() {
  const [empresas, setEmpresas]       = useState([]);
  const [cargando, setCargando]       = useState(true);
  const [modal, setModal]             = useState(false);
  const [form, setForm]               = useState(FORM_VACIO);
  const [editando, setEditando]       = useState(null);
  const [error, setError]             = useState('');
  const [guardando, setGuardando]     = useState(false);
  const [panelUsuarios, setPanelUsuarios] = useState(null);
  const [modo, setModo] = useViewMode('empresas', 'cards');
  const [asignados, setAsignados]     = useState([]);
  const [disponibles, setDisponibles] = useState([]);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    try {
      const { data } = await api.get('/empresas');
      setEmpresas(data.empresas);
    } catch {
      setError('Error al cargar empresas');
    } finally {
      setCargando(false);
    }
  }

  async function abrirPanel(empresa) {
    setPanelUsuarios(empresa);
    const { data } = await api.get(`/empresas/${empresa.id}/usuarios`);
    setAsignados(data.asignados);
    setDisponibles(data.disponibles);
  }

  async function asignar(usuarioId) {
    await api.post(`/empresas/${panelUsuarios.id}/usuarios`, { usuarioId });
    const { data } = await api.get(`/empresas/${panelUsuarios.id}/usuarios`);
    setAsignados(data.asignados);
    setDisponibles(data.disponibles);
  }

  async function desasignar(usuarioId) {
    await api.delete(`/empresas/${panelUsuarios.id}/usuarios/${usuarioId}`);
    const { data } = await api.get(`/empresas/${panelUsuarios.id}/usuarios`);
    setAsignados(data.asignados);
    setDisponibles(data.disponibles);
  }

  function abrirNueva() {
    setEditando(null);
    setForm(FORM_VACIO);
    setError('');
    setModal(true);
  }

  function abrirEditar(e) {
    setEditando(e.id);
    setForm({
      nombre:           e.nombre,
      rut:              e.rut || '',
      nombreContacto:   e.nombre_contacto || '',
      telefonoContacto: e.telefono_contacto || '',
      correoContacto:   e.correo_contacto || '',
    });
    setError('');
    setModal(true);
  }

  async function guardar(ev) {
    ev.preventDefault();
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
    setGuardando(true);
    setError('');
    try {
      if (editando) {
        await api.put(`/empresas/${editando}`, form);
      } else {
        await api.post('/empresas', form);
      }
      setModal(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar esta empresa?')) return;
    try {
      await api.delete(`/empresas/${id}`);
      cargar();
    } catch {
      alert('Error al eliminar');
    }
  }

  const ROL_LABEL = { admin: 'Administrador', gestor: 'Gestor' };

  return (
    <Layout>
      <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Gestión de Empresas</h2>
          <p>Administración de empresas y usuarios asignados</p>
        </div>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          <ViewToggle mode={modo} onChange={setModo} />
          <button className="btn btn-primary" onClick={abrirNueva}>+ Nueva empresa</button>
        </div>
      </div>

      {cargando ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : empresas.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🏢</div>
          <h3>Sin empresas aún</h3>
          <p>Crea la primera empresa haciendo clic en "Nueva empresa"</p>
        </div>
      ) : modo === 'cards' ? (
        <div className="cards-grid">
          {empresas.map(e => (
            <div key={e.id} className="card">
              <div className="card-accent" />
              <div className="card-header">
                <span className="card-title">{e.nombre}</span>
                <span className="badge" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                  {e.total_usuarios ?? 0} accesos
                </span>
              </div>
              <div className="card-body">
                {e.rut               && <p><span>🪪</span><span><strong>RUT:</strong> {e.rut}</span></p>}
                {e.nombre_contacto   && <p><span>👤</span><span>{e.nombre_contacto}</span></p>}
                {e.telefono_contacto && <p><span>📞</span><span>{e.telefono_contacto}</span></p>}
                {e.correo_contacto   && <p><span>✉️</span><span>{e.correo_contacto}</span></p>}
              </div>
              <div className="card-footer">
                <button className="btn btn-primary btn-sm"   onClick={() => abrirPanel(e)}>Usuarios</button>
                <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(e)}>Editar</button>
                <button className="btn btn-danger btn-sm"    onClick={() => eliminar(e.id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-wrap">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>RUT</th>
                  <th>Contacto</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th style={{ textAlign: 'center' }}>N° Accesos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {empresas.map(e => (
                  <tr key={e.id}>
                    <td><strong>{e.nombre}</strong></td>
                    <td className="td-muted">{e.rut || '—'}</td>
                    <td className="td-muted">{e.nombre_contacto || '—'}</td>
                    <td className="td-muted">{e.telefono_contacto || '—'}</td>
                    <td className="td-muted">{e.correo_contacto || '—'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{e.total_usuarios ?? 0}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '.5rem' }}>
                        <button className="btn btn-primary btn-sm"   onClick={() => abrirPanel(e)}>Usuarios</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(e)}>Editar</button>
                        <button className="btn btn-danger btn-sm"    onClick={() => eliminar(e.id)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal empresa */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editando ? 'Editar empresa' : 'Nueva empresa'}</h2>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={guardar} className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label>Nombre *</label>
                <input className="form-control" value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Razón social" required />
              </div>
              <div className="form-group">
                <label>RUT</label>
                <input className="form-control" value={form.rut}
                  onChange={e => setForm({ ...form, rut: e.target.value })}
                  placeholder="12.345.678-9" />
              </div>
              <div className="form-group">
                <label>Nombre de contacto</label>
                <input className="form-control" value={form.nombreContacto}
                  onChange={e => setForm({ ...form, nombreContacto: e.target.value })}
                  placeholder="Nombre completo" />
              </div>
              <div className="form-group">
                <label>Teléfono de contacto</label>
                <input className="form-control" value={form.telefonoContacto}
                  onChange={e => setForm({ ...form, telefonoContacto: e.target.value })}
                  placeholder="+56 9 1234 5678" />
              </div>
              <div className="form-group">
                <label>Correo de contacto</label>
                <input className="form-control" type="email" value={form.correoContacto}
                  onChange={e => setForm({ ...form, correoContacto: e.target.value })}
                  placeholder="contacto@empresa.cl" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={guardando}>
                  {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>{/* fin .page */}

      {/* Panel de usuarios */}
      {panelUsuarios && (
        <div className="modal-overlay" onClick={() => setPanelUsuarios(null)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Usuarios — {panelUsuarios.nombre}</h2>
              <button className="modal-close" onClick={() => setPanelUsuarios(null)}>✕</button>
            </div>
            <div className="modal-body">

              <p style={{ fontWeight: 600, marginBottom: '.5rem' }}>Asignados</p>
              {asignados.length === 0 ? (
                <p style={{ color: 'var(--gris-500)', fontSize: '.875rem', marginBottom: '1rem' }}>
                  Sin usuarios asignados aún.
                </p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.25rem' }}>
                  {asignados.map(u => (
                    <li key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.5rem 0', borderBottom: '1px solid var(--gris-200)' }}>
                      <span>
                        <strong>{u.nombre}</strong>
                        <span style={{ marginLeft: '.5rem', fontSize: '.75rem', color: 'var(--gris-500)' }}>
                          {ROL_LABEL[u.rol] || u.rol}
                        </span>
                      </span>
                      <button className="btn btn-sm btn-danger" onClick={() => desasignar(u.id)}>Quitar</button>
                    </li>
                  ))}
                </ul>
              )}

              <p style={{ fontWeight: 600, marginBottom: '.5rem' }}>Agregar usuario</p>
              {disponibles.length === 0 ? (
                <p style={{ color: 'var(--gris-500)', fontSize: '.875rem' }}>
                  No hay más usuarios disponibles.
                </p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {disponibles.map(u => (
                    <li key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.5rem 0', borderBottom: '1px solid var(--gris-200)' }}>
                      <span>
                        <strong>{u.nombre}</strong>
                        <span style={{ marginLeft: '.5rem', fontSize: '.75rem', color: 'var(--gris-500)' }}>
                          {ROL_LABEL[u.rol] || u.rol}
                        </span>
                      </span>
                      <button className="btn btn-sm btn-primary" onClick={() => asignar(u.id)}>Asignar</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
