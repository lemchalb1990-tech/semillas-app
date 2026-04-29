import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ViewToggle from '../components/ViewToggle';
import { useViewMode } from '../hooks/useViewMode';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const FORM_VACIO = { nombre: '' };

export default function Proveedores() {
  const { usuario } = useAuth();
  const esAdmin      = ['superadmin', 'admin'].includes(usuario?.rol);
  const esSuperadmin = usuario?.rol === 'superadmin';

  const [proveedores, setProveedores]   = useState([]);
  const [cargando, setCargando]         = useState(true);
  const [modal, setModal]               = useState(null);
  const [form, setForm]                 = useState(FORM_VACIO);
  const [error, setError]               = useState('');
  const [guardando, setGuardando]       = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [empresas, setEmpresas]         = useState([]);
  const [empresaId, setEmpresaId]       = useState('');
  const [especiesDisponibles, setEspeciesDisponibles] = useState([]);
  const [especiesSeleccionadas, setEspeciesSeleccionadas] = useState([]);
  const [modo, setModo]                 = useViewMode('proveedores', 'cards');

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try {
      const [{ data: p }, { data: e }, empData] = await Promise.all([
        api.get('/proveedores'),
        api.get('/especies'),
        esSuperadmin ? api.get('/empresas') : Promise.resolve({ data: { empresas: [] } }),
      ]);
      setProveedores(p.proveedores);
      setEspeciesDisponibles(e.especies);
      setEmpresas(empData.data.empresas);
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
    setEspeciesSeleccionadas([]);
    setError('');
  }

  function abrirEditar(p) {
    setModal(p);
    setForm({ nombre: p.nombre });
    setEspeciesSeleccionadas((p.especies || []).map(e => e.id));
    setError('');
  }

  function toggleEspecie(id) {
    setEspeciesSeleccionadas(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function especiesParaEmpresa() {
    if (!esSuperadmin) return especiesDisponibles;
    const eid = modal === 'nuevo' ? parseInt(empresaId) : modal?.empresa_id;
    if (!eid) return [];
    return especiesDisponibles.filter(e => e.empresa_id === eid);
  }

  async function guardar(ev) {
    ev.preventDefault();
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
    setGuardando(true); setError('');
    try {
      const payload = { nombre: form.nombre, especieIds: especiesSeleccionadas };
      if (modal === 'nuevo') {
        await api.post('/proveedores', { ...payload, empresaId: empresaId || undefined });
      } else {
        await api.put(`/proveedores/${modal.id}`, payload);
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
      await api.delete(`/proveedores/${id}`);
      setConfirmEliminar(null);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  }

  const agrupadosPorEmpresa = proveedores.reduce((acc, p) => {
    const key = p.empresa_nombre || 'Sin empresa';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const especiesFiltradas = especiesParaEmpresa();

  return (
    <Layout>
      <div className="page">
        <div className="page-header">
          <div className="page-header-left">
            <h2>Proveedores</h2>
            <p>Catálogo de proveedores por empresa</p>
          </div>
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
            <ViewToggle mode={modo} onChange={setModo} />
            {esAdmin && (
              <button className="btn btn-primary" onClick={abrirNueva}>+ Nuevo proveedor</button>
            )}
          </div>
        </div>

        {cargando ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : proveedores.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🏭</div>
            <h3>Sin proveedores aún</h3>
            {esAdmin && <p>Crea el primer proveedor haciendo clic en "Nuevo proveedor"</p>}
          </div>
        ) : modo === 'cards' ? (
          Object.entries(agrupadosPorEmpresa).map(([empresa, lista]) => (
            <div key={empresa} style={{ marginBottom: '2rem' }}>
              {esSuperadmin && (
                <p style={{ fontWeight: 700, color: 'var(--gris-600)', fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '.75rem' }}>
                  🏢 {empresa}
                </p>
              )}
              <div className="cards-grid">
                {lista.map(p => (
                  <div key={p.id} className="card">
                    <div className="card-accent" />
                    <div className="card-header">
                      <span className="card-title">🏭 {p.nombre}</span>
                    </div>
                    <div className="card-body">
                      {p.especies?.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem', marginTop: '.25rem' }}>
                          {p.especies.map(e => (
                            <span key={e.id} style={{
                              background: 'var(--verde-50, #f0fdf4)',
                              color: 'var(--verde-700, #15803d)',
                              border: '1px solid var(--verde-200, #bbf7d0)',
                              borderRadius: 20,
                              padding: '2px 10px',
                              fontSize: '.78rem',
                              fontWeight: 500,
                            }}>
                              🌿 {e.nombre}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: 'var(--gris-400)', fontSize: '.85rem', margin: 0 }}>Sin especies asignadas</p>
                      )}
                      <p style={{ marginTop: '.5rem' }}><span>👤</span><span>Creado por: {p.creado_por_nombre || '—'}</span></p>
                      <p><span>📅</span><span>{new Date(p.created_at).toLocaleDateString('es-CO')}</span></p>
                    </div>
                    {esAdmin && (
                      <div className="card-footer">
                        <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(p)}>Editar</button>
                        <button className="btn btn-danger btn-sm"    onClick={() => setConfirmEliminar(p)}>Eliminar</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          Object.entries(agrupadosPorEmpresa).map(([empresa, lista]) => (
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
                        <th>Especies</th>
                        <th>Creado por</th>
                        <th>Fecha</th>
                        {esAdmin && <th>Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {lista.map(p => (
                        <tr key={p.id}>
                          <td><strong>🏭 {p.nombre}</strong></td>
                          <td>
                            {p.especies?.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
                                {p.especies.map(e => (
                                  <span key={e.id} style={{
                                    background: 'var(--verde-50, #f0fdf4)',
                                    color: 'var(--verde-700, #15803d)',
                                    border: '1px solid var(--verde-200, #bbf7d0)',
                                    borderRadius: 20,
                                    padding: '2px 8px',
                                    fontSize: '.75rem',
                                    fontWeight: 500,
                                    whiteSpace: 'nowrap',
                                  }}>
                                    🌿 {e.nombre}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="td-muted">—</span>
                            )}
                          </td>
                          <td className="td-muted">{p.creado_por_nombre || '—'}</td>
                          <td className="td-muted">{new Date(p.created_at).toLocaleDateString('es-CO')}</td>
                          {esAdmin && (
                            <td>
                              <div style={{ display: 'flex', gap: '.5rem' }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(p)}>Editar</button>
                                <button className="btn btn-danger btn-sm"    onClick={() => setConfirmEliminar(p)}>Eliminar</button>
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
              <h3>{modal === 'nuevo' ? 'Nuevo proveedor' : 'Editar proveedor'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            {error && <div className="alert alert-error">⚠ {error}</div>}
            <form onSubmit={guardar}>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  value={form.nombre}
                  onChange={e => setForm({ nombre: e.target.value })}
                  placeholder="Nombre del proveedor"
                  required
                />
              </div>

              {esSuperadmin && modal === 'nuevo' && (
                <div className="form-group">
                  <label>Empresa *</label>
                  <select value={empresaId} onChange={e => { setEmpresaId(e.target.value); setEspeciesSeleccionadas([]); }} required>
                    <option value="">Seleccionar empresa</option>
                    {empresas.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Especies asignadas</label>
                {especiesFiltradas.length === 0 ? (
                  <p style={{ color: 'var(--gris-400)', fontSize: '.85rem', margin: 0 }}>
                    {esSuperadmin && modal === 'nuevo' && !empresaId
                      ? 'Selecciona una empresa primero'
                      : 'No hay especies disponibles'}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', padding: '.75rem', background: 'var(--gris-50, #f9fafb)', border: '1px solid var(--gris-200)', borderRadius: 8 }}>
                    {especiesFiltradas.map(e => {
                      const activa = especiesSeleccionadas.includes(e.id);
                      return (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => toggleEspecie(e.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '.3rem',
                            padding: '5px 12px',
                            borderRadius: 20,
                            border: activa ? '2px solid var(--verde-600, #16a34a)' : '2px solid var(--gris-300)',
                            background: activa ? 'var(--verde-50, #f0fdf4)' : '#fff',
                            color: activa ? 'var(--verde-700, #15803d)' : 'var(--gris-500)',
                            fontWeight: activa ? 600 : 400,
                            fontSize: '.85rem',
                            cursor: 'pointer',
                            transition: 'all .15s',
                          }}
                        >
                          {activa ? '✓' : '+'} 🌿 {e.nombre}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={guardando} style={{ minWidth: 150 }}>
                  {guardando ? 'Guardando...' : modal === 'nuevo' ? 'Crear proveedor' : 'Guardar cambios'}
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
              <h3>Eliminar proveedor</h3>
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
