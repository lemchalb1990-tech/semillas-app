import { useSync } from '../context/SyncContext';

export default function SyncBanner() {
  const { online, syncing, pending, lastSync, sync } = useSync();

  if (syncing) {
    return (
      <div style={styles.banner('#d97706', '#fffbeb')}>
        <span>⏳ Sincronizando cambios pendientes...</span>
      </div>
    );
  }

  if (!online) {
    return (
      <div style={styles.banner('#b91c1c', '#fef2f2')}>
        <span>📵 Sin conexión{pending > 0 ? ` · ${pending} cambio${pending > 1 ? 's' : ''} pendiente${pending > 1 ? 's' : ''}` : ''}</span>
      </div>
    );
  }

  if (pending > 0) {
    return (
      <div style={styles.banner('#d97706', '#fffbeb')}>
        <span>⚠ {pending} cambio{pending > 1 ? 's' : ''} sin sincronizar</span>
        <button onClick={sync} style={styles.btn('#d97706')}>Sincronizar ahora</button>
      </div>
    );
  }

  return null;
}

const styles = {
  banner: (color, bg) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    padding: '8px 1rem',
    background: bg,
    color: color,
    fontSize: '.83rem',
    fontWeight: 500,
    borderBottom: `1px solid ${color}33`,
  }),
  btn: (color) => ({
    padding: '3px 10px',
    border: `1px solid ${color}`,
    borderRadius: 5,
    background: 'transparent',
    color,
    cursor: 'pointer',
    fontSize: '.8rem',
    fontWeight: 600,
  }),
};
