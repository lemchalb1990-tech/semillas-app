import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Registro() {
  const { registro } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  function onChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  async function onSubmit(e) {
    e.preventDefault();
    if (form.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    setError('');
    setCargando(true);
    try {
      await registro(form.nombre, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse');
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
          <p>Crea tu cuenta y comienza a gestionar tus proyectos agrícolas</p>
          <div className="auth-left-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">✅</div>
              <span>Registro gratuito</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">🔒</div>
              <span>Acceso seguro con JWT</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">🌿</div>
              <span>Gestión por especie y ubicación</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-title">
            <h2>Crear cuenta</h2>
            <p>Completa el formulario para registrarte</p>
          </div>

          {error && <div className="alert alert-error">⚠ {error}</div>}

          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label>Nombre completo</label>
              <input name="nombre" value={form.nombre} onChange={onChange} placeholder="Tu nombre completo" required />
            </div>
            <div className="form-group">
              <label>Correo electrónico</label>
              <input type="email" name="email" value={form.email} onChange={onChange} placeholder="correo@ejemplo.com" required />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input type="password" name="password" value={form.password} onChange={onChange} placeholder="Mínimo 8 caracteres" required />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={cargando}>
              {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="auth-footer">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
