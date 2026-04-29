import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SyncProvider } from './context/SyncContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Empresas from './pages/Empresas';
import Especies from './pages/Especies';
import Proveedores from './pages/Proveedores';
import Agricultores from './pages/Agricultores';
import './styles/global.css';

function RutaAdmin({ children }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (!['superadmin', 'admin'].includes(usuario.rol)) return <Navigate to="/" replace />;
  return children;
}

function RutaSuperadmin({ children }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.rol !== 'superadmin') return <Navigate to="/" replace />;
  return children;
}


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <SyncProvider>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/usuarios" element={
            <RutaAdmin><Usuarios /></RutaAdmin>
          } />
          <Route path="/empresas" element={
            <RutaSuperadmin><Empresas /></RutaSuperadmin>
          } />
          <Route path="/especies" element={
            <ProtectedRoute><Especies /></ProtectedRoute>
          } />
          <Route path="/proveedores" element={
            <ProtectedRoute><Proveedores /></ProtectedRoute>
          } />
          <Route path="/agricultores" element={
            <ProtectedRoute><Agricultores /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SyncProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
