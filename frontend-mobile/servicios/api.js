/**
 * @fileoverview Capa de servicio HTTP.
 * Configura Axios, interceptores de request/response y exporta APIs por dominio.
 * @module servicios/api
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_TIMEOUT, STORAGE_KEYS } from '../utilidades/config';

/**
 * Instancia configurada de Axios.
 * @type {import('axios').AxiosInstance}
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Interceptor de solicitudes.
 * Inyecta el rol del usuario en el header X-User-Role para control de permisos en backend.
 */
api.interceptors.request.use(
  async (config) => {
    try {
      const userRole = await AsyncStorage.getItem(STORAGE_KEYS.userRole);
      if (userRole) {
        config.headers['X-User-Role'] = userRole;
      }
    } catch (e) {
      console.error('Error getting user role:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Interceptor de respuestas.
 * Por ahora solo propaga el error; aquí se puede agregar lógica de refresh token.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

/**
 * Extrae un mensaje legible de un error de Axios.
 * @param {import('axios').AxiosError} err - Error capturado.
 * @returns {string} Mensaje traducido al español.
 */
export function getErrorMessage(err) {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.response?.status === 401) return 'Sesión expirada o rol inválido.';
  if (err.response?.status === 403) return 'No tienes permisos para realizar esta acción.';
  return err.message || 'Error inesperado de conexión con el servidor.';
}

/**
 * Obtiene el código de estado HTTP de un error.
 * @param {import('axios').AxiosError} err - Error capturado.
 * @returns {number|undefined} Código de estado HTTP.
 */
function getStatus(err) {
  return err.response?.status;
}

// ─── API: Vendedores ─────────────────────────────────────────────────────────

/**
 * Conjunto de endpoints para gestión de vendedores.
 * @namespace vendedoresApi
 */
export const vendedoresApi = {
  /**
   * Lista paginada de vendedores.
   * @param {Object} [params] - Parámetros de paginación.
   * @param {number} [params.page=1] - Número de página.
   * @param {number} [params.limit=10] - Tamaño de página.
   * @returns {Promise<{metadata: Object, data: Array}>} Respuesta del servidor.
   */
  listar: ({ page = 1, limit = 10 } = {}) =>
    api.get('/vendedores', { params: { page, limit } }).then((res) => res.data),

  /**
   * Obtiene el detalle de un vendedor por ID.
   * @param {number|string} id - Identificador del vendedor.
   * @returns {Promise<Object>} Datos del vendedor.
   */
  obtener: (id) => api.get(`/vendedores/${id}`).then((res) => res.data),

  /**
   * Crea un nuevo vendedor.
   * @param {Object} data - Payload del vendedor.
   * @returns {Promise<Object>} Vendedor creado.
   */
  crear: (data) => api.post('/vendedores', data).then((res) => res.data),

  /**
   * Actualiza un vendedor existente.
   * @param {number|string} id - Identificador del vendedor.
   * @param {Object} data - Campos a actualizar.
   * @returns {Promise<Object>} Vendedor actualizado.
   */
  actualizar: (id, data) => api.put(`/vendedores/${id}`, data).then((res) => res.data),

  /**
   * Valida un vendedor por placa o código QR.
   * @param {string} tipoBusqueda - 'placa' | 'qr'.
   * @param {string} valor - Valor a buscar.
   * @returns {Promise<Object|null>} Datos del vendedor o null si no existe (404).
   */
  validar: (tipoBusqueda, valor) =>
    api
      .get('/vendedores/validar', { params: { tipoBusqueda, valor } })
      .then((res) => res.data)
      .catch((err) => {
        if (getStatus(err) === 404) return null;
        throw err;
      }),
};

// ─── API: Vehículos ──────────────────────────────────────────────────────────

/**
 * Conjunto de endpoints para gestión de vehículos.
 * @namespace vehiculosApi
 */
export const vehiculosApi = {
  /**
   * Lista paginada de vehículos.
   * @param {Object} [params] - Parámetros de paginación.
   * @param {number} [params.page=1] - Número de página.
   * @param {number} [params.limit=10] - Tamaño de página.
   * @returns {Promise<{metadata: Object, data: Array}>} Respuesta del servidor.
   */
  listar: ({ page = 1, limit = 10 } = {}) =>
    api.get('/vehiculos', { params: { page, limit } }).then((res) => res.data),

  /**
   * Obtiene el detalle de un vehículo por ID.
   * @param {number|string} id - Identificador del vehículo.
   * @returns {Promise<Object>} Datos del vehículo.
   */
  obtener: (id) => api.get(`/vehiculos/${id}`).then((res) => res.data),

  /**
   * Crea un nuevo vehículo.
   * @param {Object} data - Payload del vehículo.
   * @returns {Promise<Object>} Vehículo creado.
   */
  crear: (data) => api.post('/vehiculos', data).then((res) => res.data),

  /**
   * Actualiza un vehículo existente.
   * @param {number|string} id - Identificador del vehículo.
   * @param {Object} data - Campos a actualizar.
   * @returns {Promise<Object>} Vehículo actualizado.
   */
  actualizar: (id, data) => api.put(`/vehiculos/${id}`, data).then((res) => res.data),

  /**
   * Valida un vehículo por placa o código QR.
   * @param {string} tipoBusqueda - 'placa' | 'qr'.
   * @param {string} valor - Valor a buscar.
   * @returns {Promise<Object|null>} Datos del vehículo o null si no existe (404).
   */
  validar: (tipoBusqueda, valor) =>
    api
      .get('/vehiculos/validar', { params: { tipoBusqueda, valor } })
      .then((res) => res.data)
      .catch((err) => {
        if (getStatus(err) === 404) return null;
        throw err;
      }),
};

// ─── API: Categorías ─────────────────────────────────────────────────────────

/**
 * Conjunto de endpoints para gestión de categorías.
 * @namespace categoriasApi
 */
export const categoriasApi = {
  /**
   * Lista paginada de categorías.
   * @param {Object} [params] - Parámetros de paginación.
   * @param {number} [params.page=1] - Número de página.
   * @param {number} [params.limit=10] - Tamaño de página.
   * @returns {Promise<{metadata: Object, data: Array}>} Respuesta del servidor.
   */
  listar: ({ page = 1, limit = 10 } = {}) =>
    api.get('/categorias', { params: { page, limit } }).then((res) => res.data),

  /**
   * Obtiene el detalle de una categoría por ID.
   * @param {number|string} id - Identificador de la categoría.
   * @returns {Promise<Object>} Datos de la categoría.
   */
  obtener: (id) => api.get(`/categorias/${id}`).then((res) => res.data),

  /**
   * Crea una nueva categoría.
   * @param {Object} data - Payload de la categoría.
   * @returns {Promise<Object>} Categoría creada.
   */
  crear: (data) => api.post('/categorias', data).then((res) => res.data),

  /**
   * Actualiza una categoría existente.
   * @param {number|string} id - Identificador de la categoría.
   * @param {Object} data - Campos a actualizar.
   * @returns {Promise<Object>} Categoría actualizada.
   */
  actualizar: (id, data) => api.put(`/categorias/${id}`, data).then((res) => res.data),

  /**
   * Desactiva una categoría cambiando su estado a INACTIVA.
   * @param {number|string} id - Identificador de la categoría.
   * @param {Object} categoriaActual - Datos actuales para preservar nombre/descripción.
   * @returns {Promise<Object>} Categoría desactivada.
   */
  desactivar: (id, categoriaActual) =>
    api
      .put(`/categorias/${id}`, {
        nombre: categoriaActual.nombre,
        descripcion: categoriaActual.descripcion,
        estadoActivo: 'INACTIVA',
      })
      .then((res) => res.data),
};

// ─── API: Dashboard ──────────────────────────────────────────────────────────

/**
 * Conjunto de endpoints para estadísticas del dashboard.
 * @namespace dashboardApi
 */
export const dashboardApi = {
  /**
   * Obtiene estadísticas generales del sistema.
   * @returns {Promise<Object>} Estadísticas agregadas.
   */
  stats: () => api.get('/dashboard/stats').then((res) => res.data),
};

// ─── API: Reportes ───────────────────────────────────────────────────────────

/**
 * Conjunto de endpoints para reportes.
 * @namespace reportesApi
 */
export const reportesApi = {
  /**
   * Obtiene el conjunto de reportes del sistema.
   * @returns {Promise<Object>} Datos de reportes.
   */
  get: () => api.get('/reportes').then((res) => res.data),
};

export default api;