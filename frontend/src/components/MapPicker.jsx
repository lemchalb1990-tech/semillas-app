import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons in Vite/Webpack builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER = [-33.45, -70.65]; // Santiago, Chile
const DEFAULT_ZOOM   = 6;

function ClickHandler({ onSelect }) {
  useMapEvents({ click: e => onSelect(e.latlng) });
  return null;
}

function FlyTo({ pos }) {
  const map = useMap();
  useEffect(() => { if (pos) map.flyTo(pos, 14); }, [pos]);
  return null;
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'es' } }
    );
    const data = await res.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export default function MapPicker({ onAceptar, onCancelar, valorInicial }) {
  const [marker, setMarker]       = useState(null);
  const [direccion, setDireccion] = useState('');
  const [cargando, setCargando]   = useState(false);
  const [buscando, setBuscando]   = useState(false);
  const [flyPos, setFlyPos]       = useState(null);

  async function handleSelect(latlng) {
    setMarker(latlng);
    setCargando(true);
    const dir = await reverseGeocode(latlng.lat, latlng.lng);
    setDireccion(dir);
    setCargando(false);
  }

  async function usarMiUbicacion() {
    if (!navigator.geolocation) return alert('Tu navegador no soporta geolocalización');
    setBuscando(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMarker(latlng);
        setFlyPos([latlng.lat, latlng.lng]);
        const dir = await reverseGeocode(latlng.lat, latlng.lng);
        setDireccion(dir);
        setBuscando(false);
      },
      () => { alert('No se pudo obtener la ubicación'); setBuscando(false); }
    );
  }

  function aceptar() {
    if (!marker) return;
    onAceptar(direccion || `${marker.lat.toFixed(5)}, ${marker.lng.toFixed(5)}`);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 680, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--gris-100)' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>📍 Seleccionar ubicación</h3>
          <button onClick={onCancelar} style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: 'var(--gris-400)' }}>✕</button>
        </div>

        {/* Instrucción */}
        <div style={{ padding: '.6rem 1.25rem', background: 'var(--gris-50, #f9fafb)', borderBottom: '1px solid var(--gris-100)', fontSize: '.83rem', color: 'var(--gris-500)' }}>
          Haz clic en el mapa para marcar la ubicación o usa el botón de tu ubicación actual.
        </div>

        {/* Mapa */}
        <div style={{ height: 360 }}>
          <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickHandler onSelect={handleSelect} />
            {flyPos && <FlyTo pos={flyPos} />}
            {marker && <Marker position={[marker.lat, marker.lng]} />}
          </MapContainer>
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--gris-100)' }}>
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={usarMiUbicacion}
              disabled={buscando}
              style={{ whiteSpace: 'nowrap' }}
            >
              {buscando ? 'Obteniendo...' : '📌 Mi ubicación'}
            </button>

            <div style={{ flex: 1, minWidth: 160 }}>
              {cargando ? (
                <span style={{ fontSize: '.85rem', color: 'var(--gris-400)' }}>Obteniendo dirección...</span>
              ) : marker ? (
                <span style={{ fontSize: '.85rem', color: 'var(--gris-600)' }}>📍 {direccion}</span>
              ) : (
                <span style={{ fontSize: '.85rem', color: 'var(--gris-400)' }}>Sin ubicación seleccionada</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onCancelar}>Cancelar</button>
              <button type="button" className="btn btn-primary" onClick={aceptar} disabled={!marker || cargando}>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
