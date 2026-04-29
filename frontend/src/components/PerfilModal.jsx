import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function PerfilModal({ onCerrar }) {
  const { usuario, actualizarUsuarioLocal } = useAuth();

  const [nombre, setNombre]               = useState(usuario?.nombre || '');
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva]   = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError]                 = useState('');
  const [exito, setExito]                 = useState('');
  const [guardando, setGuardando]         = useState(false);
  const [cambiarPass, setCambiarPass]     = useState(false);

  async function guardar(ev) {
    ev.preventDefault();
    setError(''); setExito('');

    if (!nombre.trim()) { setError('El nombre no puede estar vacío'); return; }

    if (cambiarPass) {
      if (!passwordActual) { setError('Ingresa tu contraseña actual'); return; }
      if (!passwordNueva)  { setError('Ingresa la nueva contraseña'); return; }
      if (passwordNueva.length < 8) { setError('La nueva contraseña debe tener al menos 8 caracteres'); return; }
      if (passwordNueva !== passwordConfirm) { setError('Las contraseñas no coinciden'); return; }
    }

    setGuardando(true);
    try {
      const payload = { nombre };
      if (cambiarPass) { payload.passwordActual = passwordActual; payload.passwordNueva = passwordNueva; }
      const { data } = await api.put('/auth/perfil', payload);
      actualizarUsuarioLocal({ nombre: data.usuario.nombre });
      setExito('Perfil actualizado correctamente');
      setPasswordActual(''); setPasswordNueva(''); setPasswordConfirm('');
      setCambiarPass(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCerrar()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h3>Mi perfil</h3>
          <button className="modal-close" onClick={onCerrar}>✕</button>
        </div>

        {error  && <div className="alert alert-error">⚠ {error}</div>}
        {exito  && <div className="alert" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 8, padding: '.75rem 1rem', marginBottom: '.75rem', fontSize: '.9rem' }}>✓ {exito}</div>}

        <form onSubmit={guardar}>
          <div className="form-group">
            <label>Nombre</label>
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Tu nombre"
              required
            />
          </div>

          <div className="form-group">
            <label>Correo electrónico</label>
            <div style={{ position: 'relative' }}>
              <input
                value={usuario?.email || ''}
                disabled
                style={{ background: 'var(--gris-50, #f9fafb)', color: 'var(--gris-400)', cursor: 'not-allowed', paddingRight: '2.5rem' }}
              />
              <span style={{ position: 'absolute', right: '.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '.85rem' }}>🔒</span>
            </div>
            <span style={{ fontSize: '.75rem', color: 'var(--gris-400)' }}>El correo no puede modificarse</span>
          </div>

          <div style={{ borderTop: '1px solid var(--gris-100)', paddingTop: '1rem', marginTop: '.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', fontSize: '.9rem', fontWeight: 500, marginBottom: '.75rem' }}>
              <input
                type="checkbox"
                checked={cambiarPass}
                onChange={e => { setCambiarPass(e.target.checked); setError(''); }}
              />
              Cambiar contraseña
            </label>

            {cambiarPass && (
              <>
                <div className="form-group">
                  <label>Contraseña actual</label>
                  <input
                    type="password"
                    value={passwordActual}
                    onChange={e => setPasswordActual(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
                <div className="form-group">
                  <label>Nueva contraseña</label>
                  <input
                    type="password"
                    value={passwordNueva}
                    onChange={e => setPasswordNueva(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                  />
                </div>
                <div className="form-group">
                  <label>Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onCerrar}>Cerrar</button>
            <button type="submit" className="btn btn-primary" disabled={guardando} style={{ minWidth: 140 }}>
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
