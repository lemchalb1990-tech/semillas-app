import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ViewToggle from '../components/ViewToggle';
import MapPicker from '../components/MapPicker';
import { useViewMode } from '../hooks/useViewMode';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const FORM_VACIO = { nombreContacto: '', telefono: '', contactoCampo: '' };
const CAMPO_VACIO = { nombre: '', ubicacion: '' };

export default function Agricultores() {
  const { usuario } = useAuth();
  const esAdmin      = ['superadmin', 'admin'].includes(usuario?.rol);
  const esSuperadmin = usuario?.rol === 'superadmin';

  const [agricultores, setAgricultores]   = useState([]);
  const [cargando, setCargando]           = useState(true);
  const [modal, setModal]                 = useState(null);
  const [form, setForm]                   = useState(FORM_VACIO);
  const [campos, setCampos]               = useState([{ ...CAMPO_VACIO }]);
  const [error, setError]                 = useState('');
  const [guardando, setGuardando]         = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [empresas, setEmpresas]           = useState([]);
  const [empresaId, setEmpresaId]         = useState('');
  const [especiesDisponibles, setEspeciesDisponibles] = useState([]);
  const [especiesSeleccionadas, setEspeciesSeleccionadas] = useState([]);
  const [filtroNombre, setFiltroNombre]   = useState('');
  const [filtroEspecie, setFiltroEspecie] = useState('');
  const [mapaIdx, setMapaIdx]             = useState(null);
  const [modo, setModo, esMobil]          = useViewMode('agricultores', 'cards');

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try {
      const [{ data: ag }, { data: e }, empData] = await Promise.all([
        api.get('/agricultores'),
        api.get('/especies'),
        esSuperadmin ? api.get('/empresas') : Promise.resolve({ data: { empresas: [] } }),
      ]);
      setAgricultores(ag.agricultores);
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
    setCampos([{ ...CAMPO_VACIO }]);
    setEmpresaId('');
    setEspeciesSeleccionadas([]);
    setError('');
  }

  function abrirEditar(ag) {
    setModal(ag);
    setForm({ nombreContacto: ag.nombre_contacto, telefono: ag.telefono || '', contactoCampo: ag.contacto_campo || '' });
    setCampos(ag.campos?.length > 0 ? ag.campos.map(c => ({ nombre: c.nombre, ubicacion: c.ubicacion || '' })) : [{ ...CAMPO_VACIO }]);
    setEspeciesSeleccionadas((ag.especies || []).map(e => e.id));
    setError('');
  }

  function setCampoField(idx, field, value) {
    setCampos(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  }

  function agregarCampo() {
    setCampos(prev => [...prev, { ...CAMPO_VACIO }]);
  }

  function quitarCampo(idx) {
    setCampos(prev => prev.length === 1 ? [{ ...CAMPO_VACIO }] : prev.filter((_, i) => i !== idx));
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
    if (!form.nombreContacto.trim()) { setError('El nombre de contacto es obligatorio'); return; }
    setGuardando(true); setError('');
    try {
      const camposValidos = campos.filter(c => c.nombre.trim());
      const payload = { ...form, campos: camposValidos, especieIds: especiesSeleccionadas };
      if (modal === 'nuevo') {
        await api.post('/agricultores', { ...payload, empresaId: empresaId || undefined });
      } else {
        await api.put(`/agricultores/${modal.id}`, payload);
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
      await api.delete(`/agricultores/${id}`);
      setConfirmEliminar(null);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  }

  const agricultoresFiltrados = agricultores.filter(ag => {
    const coincideNombre  = ag.nombre_contacto.toLowerCase().includes(filtroNombre.toLowerCase());
    const coincideEspecie = !filtroEspecie || (ag.especies || []).some(e => e.id === parseInt(filtroEspecie));
    return coincideNombre && coincideEspecie;
  });

  const agrupadosPorEmpresa = agricultoresFiltrados.reduce((acc, ag) => {
    const key = ag.empresa_nombre || 'Sin empresa';
    if (!acc[key]) acc[key] = [];
    acc[key].push(ag);
    return acc;
  }, {});

  const especiesFiltradas = especiesParaEmpresa();

  return (
    <Layout>
      <div className="page">
        <div className="page-header">
          <div className="page-header-left">
            <h2>Agricultores</h2>
            <p>Registro de agricultores y sus campos</p>
          </div>
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
            {!esMobil && <ViewToggle mode={modo} onChange={setModo} />}
            {esAdmin && (
              <button className="btn btn-primary" onClick={abrirNueva}>+ Nuevo agricultor</button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="filtros">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre..."
            value={filtroNombre}
            onChange={e => setFiltroNombre(e.target.value)}
          />
          <select value={filtroEspecie} onChange={e => setFiltroEspecie(e.target.value)}>
            <option value="">Todas las especies</option>
            {especiesDisponibles.map(e => (
              <option key={e.id} value={e.id}>🌿 {e.nombre}</option>
            ))}
          </select>
          {(filtroNombre || filtroEspecie) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFiltroNombre(''); setFiltroEspecie(''); }}>
              ✕ Limpiar filtros
            </button>
          )}
        </div>

        {cargando ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : agricultores.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🧑‍🌾</div>
            <h3>Sin agricultores aún</h3>
            {esAdmin && <p>Crea el primer agricultor haciendo clic en "Nuevo agricultor"</p>}
          </div>
        ) : agricultoresFiltrados.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🔍</div>
            <h3>Sin resultados</h3>
            <p>No hay agricultores que coincidan con los filtros aplicados.</p>
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
                {lista.map(ag => (
                  <div key={ag.id} className="card">
                    <div className="card-accent" />
                    <div className="card-header">
                      <span className="card-title">🧑‍🌾 {ag.nombre_contacto}</span>
                    </div>
                    <div className="card-body">
                      {ag.telefono      && <p><span>📞</span><span>{ag.telefono}</span></p>}
                      {ag.contacto_campo && <p><span>👤</span><span>{ag.contacto_campo}</span></p>}

                      {ag.campos?.length > 0 && (
                        <div style={{ marginTop: '.5rem' }}>
                          <p style={{ fontWeight: 600, fontSize: '.8rem', color: 'var(--gris-500)', marginBottom: '.3rem' }}>CAMPOS</p>
                          {ag.campos.map((c, i) => (
                            <p key={i}><span>🌾</span><span>{c.nombre}{c.ubicacion ? ` — ${c.ubicacion}` : ''}</span></p>
                          ))}
                        </div>
                      )}

                      {ag.especies?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem', marginTop: '.5rem' }}>
                          {ag.especies.map(e => (
                            <span key={e.id} style={{
                              background: 'var(--verde-50, #f0fdf4)',
                              color: 'var(--verde-700, #15803d)',
                              border: '1px solid var(--verde-200, #bbf7d0)',
                              borderRadius: 20,
                              padding: '2px 10px',
                              fontSize: '.78rem',
                              fontWeight: 500,
                            }}>🌿 {e.nombre}</span>
                          ))}
                        </div>
                      )}

                      <p style={{ marginTop: '.5rem' }}><span>📅</span><span>{new Date(ag.created_at).toLocaleDateString('es-CO')}</span></p>
                    </div>
                    {esAdmin && (
                      <div className="card-footer">
                        <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(ag)}>Editar</button>
                        <button className="btn btn-danger btn-sm"    onClick={() => setConfirmEliminar(ag)}>Eliminar</button>
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
                        <th>Nombre contacto</th>
                        <th>Teléfono</th>
                        <th>Contacto campo</th>
                        <th>Campos</th>
                        <th>Especies</th>
                        <th>Fecha</th>
                        {esAdmin && <th>Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {lista.map(ag => (
                        <tr key={ag.id}>
                          <td><strong>🧑‍🌾 {ag.nombre_contacto}</strong></td>
                          <td className="td-muted">{ag.telefono || '—'}</td>
                          <td className="td-muted">{ag.contacto_campo || '—'}</td>
                          <td>
                            {ag.campos?.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '.2rem' }}>
                                {ag.campos.map((c, i) => (
                                  <span key={i} style={{ fontSize: '.82rem' }}>🌾 {c.nombre}{c.ubicacion ? ` — ${c.ubicacion}` : ''}</span>
                                ))}
                              </div>
                            ) : <span className="td-muted">—</span>}
                          </td>
                          <td>
                            {ag.especies?.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
                                {ag.especies.map(e => (
                                  <span key={e.id} style={{
                                    background: 'var(--verde-50, #f0fdf4)',
                                    color: 'var(--verde-700, #15803d)',
                                    border: '1px solid var(--verde-200, #bbf7d0)',
                                    borderRadius: 20,
                                    padding: '2px 8px',
                                    fontSize: '.75rem',
                                    fontWeight: 500,
                                    whiteSpace: 'nowrap',
                                  }}>🌿 {e.nombre}</span>
                                ))}
                              </div>
                            ) : <span className="td-muted">—</span>}
                          </td>
                          <td className="td-muted">{new Date(ag.created_at).toLocaleDateString('es-CO')}</td>
                          {esAdmin && (
                            <td>
                              <div style={{ display: 'flex', gap: '.5rem' }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(ag)}>Editar</button>
                                <button className="btn btn-danger btn-sm"    onClick={() => setConfirmEliminar(ag)}>Eliminar</button>
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
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>{modal === 'nuevo' ? 'Nuevo agricultor' : 'Editar agricultor'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            {error && <div className="alert alert-error">⚠ {error}</div>}
            <form onSubmit={guardar}>

              {/* Datos de contacto */}
              <p style={{ fontWeight: 600, fontSize: '.8rem', color: 'var(--gris-500)', textTransform: 'uppercase', letterSpacing: '.6px', margin: '0 0 .75rem' }}>Datos de contacto</p>
              <div className="form-group">
                <label>Nombre de contacto *</label>
                <input
                  value={form.nombreContacto}
                  onChange={e => setForm({ ...form, nombreContacto: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                  required
                />
              </div>
              <div className="form-2col">
                <div className="form-group">
                  <label>N° Teléfono</label>
                  <input
                    value={form.telefono}
                    onChange={e => setForm({ ...form, telefono: e.target.value })}
                    placeholder="+56 9 1234 5678"
                  />
                </div>
                <div className="form-group">
                  <label>Contacto de campo</label>
                  <input
                    value={form.contactoCampo}
                    onChange={e => setForm({ ...form, contactoCampo: e.target.value })}
                    placeholder="Nombre del encargado"
                  />
                </div>
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

              {/* Campos */}
              <div style={{ borderTop: '1px solid var(--gris-100)', margin: '1rem 0 .75rem', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '.8rem', color: 'var(--gris-500)', textTransform: 'uppercase', letterSpacing: '.6px', margin: 0 }}>Campos</p>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={agregarCampo}>+ Agregar campo</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                  {campos.map((c, idx) => (
                    <div key={idx} className="campos-row">
                      <div className="form-group" style={{ margin: 0 }}>
                        {idx === 0 && <label>Nombre del campo</label>}
                        <input
                          value={c.nombre}
                          onChange={e => setCampoField(idx, 'nombre', e.target.value)}
                          placeholder="Ej: Parcela Norte"
                        />
                      </div>
                      <div className="form-group campo-ubicacion" style={{ margin: 0 }}>
                        {idx === 0 && <label>Ubicación</label>}
                        <input
                          value={c.ubicacion}
                          onChange={e => setCampoField(idx, 'ubicacion', e.target.value)}
                          placeholder="Seleccionar en mapa..."
                          readOnly
                          style={{ cursor: 'pointer', background: c.ubicacion ? '#fff' : 'var(--gris-50,#f9fafb)' }}
                          onClick={() => setMapaIdx(idx)}
                        />
                      </div>
                      <button
                        type="button"
                        className="campo-mapa-btn"
                        onClick={() => setMapaIdx(idx)}
                        style={{ background: 'none', border: '1px solid var(--gris-200)', borderRadius: 6, color: 'var(--gris-500)', cursor: 'pointer', fontSize: '1rem', padding: '6px 8px', lineHeight: 1 }}
                        title="Abrir mapa"
                      >🗺️</button>
                      <button
                        type="button"
                        className="campo-quitar-btn"
                        onClick={() => quitarCampo(idx)}
                        style={{ background: 'none', border: 'none', color: 'var(--gris-400)', cursor: 'pointer', fontSize: '1.1rem', padding: '6px', lineHeight: 1 }}
                        title="Quitar campo"
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Especies */}
              <div style={{ borderTop: '1px solid var(--gris-100)', margin: '0 0 .75rem', paddingTop: '1rem' }}>
                <p style={{ fontWeight: 600, fontSize: '.8rem', color: 'var(--gris-500)', textTransform: 'uppercase', letterSpacing: '.6px', margin: '0 0 .75rem' }}>Especies asignadas</p>
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
                <button type="submit" className="btn btn-primary" disabled={guardando} style={{ minWidth: 160 }}>
                  {guardando ? 'Guardando...' : modal === 'nuevo' ? 'Crear agricultor' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mapa picker */}
      {mapaIdx !== null && (
        <MapPicker
          valorInicial={campos[mapaIdx]?.ubicacion}
          onAceptar={dir => { setCampoField(mapaIdx, 'ubicacion', dir); setMapaIdx(null); }}
          onCancelar={() => setMapaIdx(null)}
        />
      )}

      {/* Confirmar eliminar */}
      {confirmEliminar && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Eliminar agricultor</h3>
              <button className="modal-close" onClick={() => setConfirmEliminar(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--gris-600)', fontSize: '.9rem' }}>
              ¿Eliminar a <strong>{confirmEliminar.nombre_contacto}</strong>? Esta acción no se puede deshacer.
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
