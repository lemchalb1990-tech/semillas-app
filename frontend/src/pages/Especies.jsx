import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ViewToggle from '../components/ViewToggle';
import { useViewMode } from '../hooks/useViewMode';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const FORM_VACIO = { nombre: '', descripcion: '' };

export default function Especies() {
  const { usuario } = useAuth();
  const esAdmin      = ['superadmin', 'admin'].includes(usuario?.rol);
  const esSuperadmin = usuario?.rol === 'superadmin';

  const [especies, setEspecies]     = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [modal, setModal]           = useState(null);
  const [form, setForm]             = useState(FORM_VACIO);
  const [error, setError]           = useState('');
  const [guardando, setGuardando]   = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [empresas, setEmpresas]     = useState([]);
  const [empresaId, setEmpresaId]   = useState('');
  const [modo, setModo, esMobil]    = useViewMode('especies', 'cards');

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try {
      const [{ data: e }, { data: emp }] = await Promise.all([
        api.get('/especies'),
        esSuperadmin ? api.get('/empresas') : Promise.resolve({ data: { empresas: [] } }),
      ]);
      setEspecies(e.especies);
      setEmpresas(emp.empresas);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  function abrirNueva() {
    setModal('nuevo');
    setForm(FORM_VACIO);
    setEmpresaId('');
    setError('');
  }

  function abrirEditar(e) {
    setModal(e);
    setForm({ nombre: e.nombre, descripcion: e.descripcion || '' });
    setError('');
  }

  async function guardar(ev) {
    ev.preventDefault();
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
    setGuardando(true); setError('');
    try {
      if (modal === 'nuevo') {
        await api.post('/especies', { ...form, empresaId: empresaId || undefined });
      } else {
        await api.put(`/especies/${modal.id}`, form);
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
    try {
      await api.delete(`/especies/${id}`);
      setConfirmEliminar(null);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  }

  const agrupadasPorEmpresa = especies.reduce((acc, e) => {
    const key = e.empresa_nombre || 'Sin empresa';
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  return (
    <Layout>
      <div className="page">
        <div className="page-header">
          <div className="page-header-left">
            <h2>Especies</h2>
            <p>Catálogo de especies por empresa</p>
          </div>
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
            {!esMobil && <ViewToggle mode={modo} onChange={setModo} />}
            {esAdmin && (
              <button className="btn btn-primary" onClick={abrirNueva}>+ Nueva especie</button>
            )}
          </div>
        </div>

        {cargando ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : especies.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🌿</div>
            <h3>Sin especies aún</h3>
            {esAdmin && <p>Crea la primera especie haciendo clic en "Nueva especie"</p>}
          </div>
        ) : modo === 'cards' ? (
          Object.entries(agrupadasPorEmpresa).map(([empresa, lista]) => (
            <div key={empresa} style={{ marginBottom: '2rem' }}>
              {esSuperadmin && (
                <p style={{ fontWeight: 700, color: 'var(--gris-600)', fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '.75rem' }}>
                  🏢 {empresa}
                </p>
              )}
              <div className="cards-grid">
                {lista.map(e => (
                  <div key={e.id} className="card">
                    <div className="card-accent" />
                    <div className="card-header">
                      <span className="card-title">🌿 {e.nombre}</span>
                    </div>
                    <div className="card-body">
                      {e.descripcion && <p><span></span><span>{e.descripcion}</span></p>}
                    </div>
                    {esAdmin && (
                      <div className="card-footer">
                        <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(e)}>Editar</button>
                        <button className="btn btn-danger btn-sm"    onClick={() => setConfirmEliminar(e)}>Eliminar</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          Object.entries(agrupadasPorEmpresa).map(([empresa, lista]) => (
            <div key={empresa} style={{ marginBottom: '2rem' }}>
              {esSuperadmin && (
                <p style={{ fontWeight: 700, color: 'var(--gris-600)', fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '.75rem' }}>
                  🏢 {empresa}
                </p>
              )}
              <div className="table-wrap">
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Creado por</th>
                        <th>Fecha</th>
                        {esAdmin && <th>Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {lista.map(e => (
                        <tr key={e.id}>
                          <td><strong>🌿 {e.nombre}</strong></td>
                          <td className="td-muted">{e.descripcion || '—'}</td>
                          <td className="td-muted">{e.creado_por_nombre || '—'}</td>
                          <td className="td-muted">{new Date(e.created_at).toLocaleDateString('es-CO')}</td>
                          {esAdmin && (
                            <td>
                              <div style={{ display: 'flex', gap: '.5rem' }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(e)}>Editar</button>
                                <button className="btn btn-danger btn-sm"    onClick={() => setConfirmEliminar(e)}>Eliminar</button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal crear/editar */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{modal === 'nuevo' ? 'Nueva especie' : 'Editar especie'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            {error && <div className="alert alert-error">⚠ {error}</div>}
            <form onSubmit={guardar}>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Zea mays"
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Descripción opcional de la especie..."
                />
              </div>
              {esSuperadmin && modal === 'nuevo' && (
                <div className="form-group">
                  <label>Empresa *</label>
                  <select value={empresaId} onChange={e => setEmpresaId(e.target.value)} required>
                    <option value="">Seleccionar empresa</option>
                    {empresas.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={guardando} style={{ minWidth: 130 }}>
                  {guardando ? 'Guardando...' : modal === 'nuevo' ? 'Crear especie' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmar eliminar */}
      {confirmEliminar && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Eliminar especie</h3>
              <button className="modal-close" onClick={() => setConfirmEliminar(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--gris-600)', fontSize: '.9rem' }}>
              ¿Eliminar <strong>{confirmEliminar.nombre}</strong>? Esta acción no se puede deshacer.
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
