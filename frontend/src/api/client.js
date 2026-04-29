import axios from 'axios';
import { cacheSet, cacheGet, queueAdd, cacheUpdateOptimistic, buildOfflineResponse } from '../db/syncEngine';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Agrega el token JWT a cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Respuesta exitosa: cachea GETs automáticamente
api.interceptors.response.use(
  async (res) => {
    if (res.config.method === 'get') {
      await cacheSet(res.config.url, res.data);
    }
    return res;
  },
  async (err) => {
    // Error 401 → forzar logout
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
      return Promise.reject(err);
    }

    // Error de red (offline) → manejar localmente
    const isNetworkError = !err.response;
    if (!isNetworkError) return Promise.reject(err);

    const { method, url } = err.config;
    const payload = err.config.data ? JSON.parse(err.config.data) : {};

    if (method === 'get') {
      const cached = await cacheGet(url);
      if (cached) return { data: cached, _fromCache: true };
      // Sin caché disponible — rechazar con mensaje claro
      return Promise.reject(Object.assign(err, { _offlineNoCache: true }));
    }

    // Mutación offline: encolar y responder con dato local
    const tempId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    await queueAdd(method.toUpperCase(), url, payload);
    await cacheUpdateOptimistic(url, method.toUpperCase(), payload, tempId);
    const fakeData = buildOfflineResponse(url, method.toUpperCase(), payload, tempId);
    return { data: fakeData, _offline: true };
  }
);

export default api;
