import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  function onChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-left-icon">🌱</div>
          <h1>Semillas App</h1>
          <p>Plataforma de gestión de desarrollos agrícola</p>
          <div className="auth-left-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">📋</div>
              <span>Gestión de desarrollos agrícola</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">👥</div>
              <span>Control de usuarios y roles</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">📍</div>
              <span>Seguimiento por ubicación</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">📊</div>
              <span>Reportes y estadísticas</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-title">
            <h2>Bienvenido</h2>
            <p>Ingresa tus credenciales para continuar</p>
          </div>

          {error && <div className="alert alert-error">⚠ {error}</div>}

          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label>Correo electrónico</label>
              <input
                type="email" name="email"
                value={form.email} onChange={onChange}
                placeholder="correo@ejemplo.com" required
              />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password" name="password"
                value={form.password} onChange={onChange}
                placeholder="••••••••" required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={cargando}>
              {cargando ? 'Ingresando...' : 'Ingresar al sistema'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
