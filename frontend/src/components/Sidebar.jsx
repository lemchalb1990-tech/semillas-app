import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROL_LABEL = { superadmin: 'Superadministrador', admin: 'Administrador', gestor: 'Gestor' };
const ROL_COLOR = {
  superadmin: { bg: '#7c3aed', text: '#fff' },
  admin:      { bg: '#1d4ed8', text: '#fff' },
  gestor:     { bg: '#15803d', text: '#fff' },
};

export default function Sidebar({ open, onClose }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const esAdmin = ['superadmin', 'admin'].includes(usuario?.rol);
  const esSuperadmin = usuario?.rol === 'superadmin';
  const iniciales = usuario?.nombre?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const colores = ROL_COLOR[usuario?.rol] || { bg: '#374151', text: '#fff' };

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={onClose} />

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">🌱</span>
          <div className="sidebar-brand-text">
            <strong>Semillas App</strong>
            <span>Gestión de desarrollos agrícola</span>
          </div>
        </div>

        <span className="sidebar-section-label">Menú principal</span>

        <nav className="sidebar-nav">
          <NavLink to="/" end onClick={onClose}>
            <span className="sidebar-nav-icon">📋</span>
            Proyectos
          </NavLink>
          {esAdmin && (
            <NavLink to="/usuarios" onClick={onClose}>
              <span className="sidebar-nav-icon">👥</span>
              Usuarios
            </NavLink>
          )}
          {esSuperadmin && (
            <NavLink to="/empresas" onClick={onClose}>
              <span className="sidebar-nav-icon">🏢</span>
              Empresas
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div
              className="sidebar-avatar"
              style={{ background: colores.bg, color: colores.text }}
            >
              {iniciales}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{usuario?.nombre}</div>
              <span
                className="sidebar-rol-badge"
                style={{ background: colores.bg, color: '#ffffff', border: 'none' }}
              >
                {ROL_LABEL[usuario?.rol]}
              </span>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            ↩ Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
