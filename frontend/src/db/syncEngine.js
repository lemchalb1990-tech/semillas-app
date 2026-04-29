import axios from 'axios';
import db from './localDB';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Mapeo URL → clave de lista y clave de item individual
const ENTITY_MAP = {
  '/agricultores': { list: 'agricultores', item: 'agricultor' },
  '/proveedores':  { list: 'proveedores',  item: 'proveedor'  },
  '/especies':     { list: 'especies',     item: 'especie'    },
  '/proyectos':    { list: 'proyectos',    item: 'proyecto'   },
  '/usuarios':     { list: 'usuarios',     item: 'usuario'    },
  '/empresas':     { list: 'empresas',     item: 'empresa'    },
};

// Extrae la base de una URL (ej: '/agricultores/5' → '/agricultores')
function baseUrl(url) {
  const parts = url.split('/').filter(Boolean);
  return '/' + parts[0];
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

export async function cacheSet(url, data) {
  await db.cache.put({ url, data, updatedAt: Date.now() });
}

export async function cacheGet(url) {
  const entry = await db.cache.get(url);
  return entry ? entry.data : null;
}

// Actualiza optimistamente la caché local cuando hay una mutación offline
export async function cacheUpdateOptimistic(url, metodo, payload, tempId) {
  const base = baseUrl(url);
  const entity = ENTITY_MAP[base];
  if (!entity) return;

  const cached = await cacheGet(base);
  if (!cached) return;

  const list = cached[entity.list] || [];
  let updated;

  if (metodo === 'POST') {
    const newItem = {
      ...payload,
      id: tempId,
      _offline: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      campos: payload.campos || [],
      especies: [],
    };
    updated = [newItem, ...list];
  } else if (metodo === 'PUT') {
    const id = url.split('/').pop();
    updated = list.map(item => String(item.id) === String(id) ? { ...item, ...payload, updated_at: new Date().toISOString() } : item);
  } else if (metodo === 'DELETE') {
    const id = url.split('/').pop();
    updated = list.filter(item => String(item.id) !== String(id));
  }

  if (updated !== undefined) {
    await cacheSet(base, { ...cached, [entity.list]: updated });
  }
}

// Respuesta fake para mutaciones offline (para que la UI no muestre error)
export function buildOfflineResponse(url, metodo, payload, tempId) {
  const base = baseUrl(url);
  const entity = ENTITY_MAP[base];
  if (!entity) return { ok: true };
  if (metodo === 'DELETE') return { mensaje: 'Eliminado (pendiente sincronización)' };
  const item = { ...payload, id: tempId, _offline: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  return { [entity.item]: item };
}

// ─── Cola de sincronización ───────────────────────────────────────────────────

export async function queueAdd(metodo, url, payload) {
  await db.syncQueue.add({ metodo, url, payload, createdAt: Date.now() });
  dispatchQueueChange();
}

export async function queueCount() {
  return db.syncQueue.count();
}

// ─── Sincronización con el servidor ──────────────────────────────────────────

let _isSyncing = false;

export async function syncAll() {
  if (_isSyncing) return;
  _isSyncing = true;
  dispatchSyncStart();

  const token = localStorage.getItem('token');
  if (!token) { _isSyncing = false; dispatchSyncEnd(0); return; }
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const queue = await db.syncQueue.orderBy('createdAt').toArray();
    let errores = 0;

    for (const item of queue) {
      // Saltar operaciones sobre IDs temporales de PUTs/DELETEs
      const idPart = item.url.split('/').pop();
      if ((item.metodo === 'PUT' || item.metodo === 'DELETE') && String(idPart).startsWith('local_')) {
        await db.syncQueue.delete(item.id);
        continue;
      }

      try {
        if (item.metodo === 'POST') {
          await axios.post(`${BASE}${item.url}`, item.payload, { headers });
        } else if (item.metodo === 'PUT') {
          await axios.put(`${BASE}${item.url}`, item.payload, { headers });
        } else if (item.metodo === 'DELETE') {
          await axios.delete(`${BASE}${item.url}`, { headers });
        }
        await db.syncQueue.delete(item.id);
      } catch (err) {
        console.warn('Error sincronizando item:', item, err.message);
        errores++;
      }
    }

    // Refrescar caché con datos actualizados del servidor
    await refreshCache(headers);
  } catch (err) {
    console.error('Error en syncAll:', err);
  } finally {
    _isSyncing = false;
    dispatchSyncEnd(await queueCount());
  }
}

async function refreshCache(headers) {
  const urls = Object.keys(ENTITY_MAP);
  for (const url of urls) {
    try {
      const res = await axios.get(`${BASE}${url}`, { headers });
      await cacheSet(url, res.data);
    } catch {
      // Algunos endpoints pueden dar 403 para este usuario — ignorar
    }
  }
}

// ─── Eventos globales para que los componentes reaccionen ─────────────────────

function dispatchQueueChange() {
  window.dispatchEvent(new CustomEvent('semillas:queue-change'));
}
function dispatchSyncStart() {
  window.dispatchEvent(new CustomEvent('semillas:sync-start'));
}
function dispatchSyncEnd(pending) {
  window.dispatchEvent(new CustomEvent('semillas:sync-end', { detail: { pending } }));
}
