import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import ProyectoModal from '../components/ProyectoModal';
import ViewToggle from '../components/ViewToggle';
import { useViewMode } from '../hooks/useViewMode';
import api from '../api/client';

const ESTADOS = ['', 'activo', 'completado', 'pausado', 'cancelado'];

function badgeClass(estado) {
  const m = { activo: 'badge-activo', completado: 'badge-completado', pausado: 'badge-pausado', cancelado: 'badge-cancelado' };
  return `badge ${m[estado] || ''}`;
}

function formatFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Dashboard() {
  const [proyectos, setProyectos]       = useState([]);
  const [total, setTotal]               = useState(0);
  const [cargando, setCargando]         = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroEspecie, setFiltroEspecie] = useState('');
  const [modal, setModal]               = useState(null);
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [modo, setModo] = useViewMode('proyectos', 'cards');

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = {};
      if (filtroEstado)  params.estado  = filtroEstado;
      if (filtroEspecie) params.especie = filtroEspecie;
      const { data } = await api.get('/proyectos', { params });
      setProyectos(data.proyectos);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, [filtroEstado, filtroEspecie]);

  useEffect(() => { cargar(); }, [cargar]);

  async function guardarProyecto(form) {
    if (modal === 'nuevo') await api.post('/proyectos', form);
    else                   await api.put(`/proyectos/${modal.id}`, form);
    setModal(null);
    cargar();
  }

  async function eliminar(id) {
    await api.delete(`/proyectos/${id}`);
    setConfirmEliminar(null);
    cargar();
  }

  const conteos = {
    activo:     proyectos.filter(p => p.estado === 'activo').length,
    completado: proyectos.filter(p => p.estado === 'completado').length,
    pausado:    proyectos.filter(p => p.estado === 'pausado').length,
  };

  return (
    <Layout>
      <div className="page">
        <div className="page-header">
          <div className="page-header-left">
            <h2>Proyectos de Semillas</h2>
            <p>Gestión y seguimiento de desarrollos agrícola</p>
          </div>
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
            <ViewToggle mode={modo} onChange={setModo} />
            <button className="btn btn-primary" onClick={() => setModal('nuevo')}>
              + Nuevo proyecto
            </button>
          </div>
        </div>

        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-card-label">Total</div>
            <div className="stat-card-value">{total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Activos</div>
            <div className="stat-card-value verde">{conteos.activo}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Completados</div>
            <div className="stat-card-value azul">{conteos.completado}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Pausados</div>
            <div className="stat-card-value rojo">{conteos.pausado}</div>
          </div>
        </div>

        <div className="filtros">
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            {ESTADOS.map(e => <option key={e} value={e}>{e || 'Todos los estados'}</option>)}
          </select>
          <input
            value={filtroEspecie}
            onChange={e => setFiltroEspecie(e.target.value)}
            placeholder="🔍 Buscar por especie..."
          />
          {(filtroEstado || filtroEspecie) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFiltroEstado(''); setFiltroEspecie(''); }}>
              ✕ Limpiar filtros
            </button>
          )}
        </div>

        {cargando ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : proyectos.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🌱</div>
            <h3>Sin proyectos aún</h3>
            <p>Crea tu primer proyecto haciendo clic en "Nuevo proyecto"</p>
          </div>
        ) : modo === 'cards' ? (
          <div className="cards-grid">
            {proyectos.map(p => (
              <div key={p.id} className="card">
                <div className="card-accent" />
                <div className="card-header">
                  <span className="card-title">{p.nombre}</span>
                  <span className={badgeClass(p.estado)}>{p.estado}</span>
                </div>
                <div className="card-body">
                  {p.empresa_nombre && <p><span>🏢</span><span>{p.empresa_nombre}</span></p>}
                  {p.especie   && <p><span>🌿</span><span><strong>Especie:</strong> {p.especie}</span></p>}
                  {p.ubicacion && <p><span>📍</span><span>{p.ubicacion}</span></p>}
                  <p><span>📅</span><span>{formatFecha(p.fecha_inicio)} → {formatFecha(p.fecha_fin)}</span></p>
                  <p><span>👤</span><span>{p.responsable}</span></p>
                  {p.descripcion && <p className="desc">{p.descripcion}</p>}
                </div>
                <div className="card-footer">
                  <button className="btn btn-secondary btn-sm" onClick={() => setModal(p)}>Editar</button>
                  <button className="btn btn-danger btn-sm" onClick={() => setConfirmEliminar(p)}>Eliminar</button>
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
                    <th>Empresa</th>
                    <th>Especie</th>
                    <th>Estado</th>
                    <th>Responsable</th>
                    <th>Fecha inicio</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {proyectos.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.nombre}</strong>{p.descripcion && <div className="td-muted" style={{fontSize:'.78rem',marginTop:'.2rem'}}>{p.descripcion.slice(0,60)}{p.descripcion.length>60?'…':''}</div>}</td>
                      <td className="td-muted">{p.empresa_nombre || '—'}</td>
                      <td className="td-muted">{p.especie || '—'}</td>
                      <td><span className={badgeClass(p.estado)}>{p.estado}</span></td>
                      <td className="td-muted">{p.responsable}</td>
                      <td className="td-muted">{formatFecha(p.fecha_inicio)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '.5rem' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setModal(p)}>Editar</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setConfirmEliminar(p)}>Eliminar</button>
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
        <ProyectoModal
          proyecto={modal === 'nuevo' ? null : modal}
          onGuardar={guardarProyecto}
          onCerrar={() => setModal(null)}
        />
      )}

      {confirmEliminar && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Eliminar proyecto</h3>
              <button className="modal-close" onClick={() => setConfirmEliminar(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--gris-600)', fontSize: '.9rem' }}>
              ¿Estás seguro de que quieres eliminar <strong>{confirmEliminar.nombre}</strong>?
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
