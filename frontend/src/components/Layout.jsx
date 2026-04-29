import { useState } from 'react';
import Sidebar from './Sidebar';
import SyncBanner from './SyncBanner';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <header className="topbar">
          <span className="topbar-brand">🌱 Semillas App</span>
          <button className="hamburger" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
            <span /><span /><span />
          </button>
        </header>

        <SyncBanner />

        {children}
      </div>
    </div>
  );
}
