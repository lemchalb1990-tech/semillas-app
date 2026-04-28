import { useState, useEffect } from 'react';
import api from '../api/client';

const ESTADOS = ['activo', 'completado', 'pausado', 'cancelado'];

export default function ProyectoModal({ proyecto, onGuardar, onCerrar }) {
  const [empresas, setEmpresas] = useState([]);

  useEffect(() => {
    api.get('/empresas').then(({ data }) => setEmpresas(data.empresas)).catch(() => {});
  }, []);
  const editando = !!proyecto;

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    especie: '',
    estado: 'activo',
    fechaInicio: '',
    fechaFin: '',
    ubicacion: '',
    empresaId: '',
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (proyecto) {
      setForm({
        nombre:      proyecto.nombre || '',
        descripcion: proyecto.descripcion || '',
        especie:     proyecto.especie || '',
        estado:      proyecto.estado || 'activo',
        fechaInicio: proyecto.fecha_inicio ? proyecto.fecha_inicio.slice(0, 10) : '',
        fechaFin:    proyecto.fecha_fin    ? proyecto.fecha_fin.slice(0, 10)    : '',
        ubicacion:   proyecto.ubicacion || '',
        empresaId:   proyecto.empresa_id ? String(proyecto.empresa_id) : '',
      });
    }
  }, [proyecto]);

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
    setError('');
    setCargando(true);
    try {
      await onGuardar(form);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="modal">
        <h3>{editando ? 'Editar proyecto' : 'Nuevo proyecto'}</h3>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Nombre *</label>
            <input name="nombre" value={form.nombre} onChange={onChange} placeholder="Ej: Proyecto Maíz 2024" />
          </div>
          <div className="form-group">
            <label>Especie</label>
            <input name="especie" value={form.especie} onChange={onChange} placeholder="Ej: Zea mays" />
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <textarea name="descripcion" value={form.descripcion} onChange={onChange} placeholder="Descripción del proyecto..." />
          </div>
          <div className="form-group">
            <label>Ubicación</label>
            <input name="ubicacion" value={form.ubicacion} onChange={onChange} placeholder="Ej: Cundinamarca" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
            <div className="form-group">
              <label>Fecha inicio</label>
              <input type="date" name="fechaInicio" value={form.fechaInicio} onChange={onChange} />
            </div>
            <div className="form-group">
              <label>Fecha fin</label>
              <input type="date" name="fechaFin" value={form.fechaFin} onChange={onChange} />
            </div>
          </div>
          {editando && (
            <div className="form-group">
              <label>Estado</label>
              <select name="estado" value={form.estado} onChange={onChange}>
                {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          )}
          {empresas.length > 0 && (
            <div className="form-group">
              <label>Empresa</label>
              <select name="empresaId" value={form.empresaId} onChange={onChange}>
                <option value="">Sin empresa asignada</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={cargando} style={{ width: 'auto' }}>
              {cargando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
