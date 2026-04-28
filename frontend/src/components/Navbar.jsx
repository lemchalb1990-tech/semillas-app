import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const ROL_LABEL = { superadmin: 'Superadministrador', admin: 'Administrador', gestor: 'Gestor' };
const ROL_COLOR = { superadmin: '#7c3aed', admin: '#1d4ed8', gestor: '#065f46' };

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const esAdmin = ['superadmin', 'admin'].includes(usuario?.rol);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <span className="navbar-brand">🌱 Semillas App</span>
        <Link to="/" style={{ color: 'rgba(255,255,255,.85)', fontSize: '.9rem' }}>Proyectos</Link>
        {esAdmin && (
          <Link to="/usuarios" style={{ color: 'rgba(255,255,255,.85)', fontSize: '.9rem' }}>Usuarios</Link>
        )}
      </div>
      <div className="navbar-user">
        <span
          style={{
            background: ROL_COLOR[usuario?.rol] || '#374151',
            color: '#fff',
            padding: '.2rem .65rem',
            borderRadius: '999px',
            fontSize: '.75rem',
            fontWeight: 600,
          }}
        >
          {ROL_LABEL[usuario?.rol] || usuario?.rol}
        </span>
        <span>{usuario?.nombre}</span>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>
    </nav>
  );
}
