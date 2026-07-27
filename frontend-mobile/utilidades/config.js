/**
 * @fileoverview Configuración centralizada de la aplicación.
 * Lee variables de entorno (EXPO_PUBLIC_*) y provee valores por defecto.
 * @module utilidades/config
 */

// ─── API ───────────────────────────────────────────────────────────────────────

/** URL base del backend. Fallback a IP local de desarrollo. */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.2:3000/';

/** Tiempo máximo de espera para peticiones HTTP (ms). */
export const API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '15000', 10);

// ─── App ───────────────────────────────────────────────────────────────────────

/** Nombre visible de la aplicación. */
export const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME || 'GESTOR COMUNIDAD';

/** Versión actual de la aplicación. */
export const APP_VERSION = process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0';

// ─── Paleta de colores unificada ─────────────────────────────────────────────

/**
 * Paleta de colores principal.
 * Toda la aplicación debe consumir estos valores para evitar hardcodeo.
 * @type {Object.<string, string>}
 */
export const COLORS = {
  primary: '#C8871A',
  background: '#f5f0e8',
  text: '#1a1a2e',
  gray: '#888',
  success: '#065f46',
  danger: '#991b1b',
  warning: '#d97706',
  white: '#ffffff',
  border: '#e0d8c8',
};

// ─── Claves de almacenamiento local ──────────────────────────────────────────

/**
 * Claves utilizadas en AsyncStorage.
 * @type {Object.<string, string>}
 */
export const STORAGE_KEYS = {
  authToken: 'auth_token',
  refreshToken: 'refresh_token',
  userData: 'user_data',
  userRole: 'userRole',
};

// ─── Paginación ──────────────────────────────────────────────────────────────

/** Tamaño de página por defecto. */
export const DEFAULT_PAGE_SIZE = 10;

/** Tamaño máximo permitido de página. */
export const MAX_PAGE_SIZE = 50;

// ─── Reglas de validación ────────────────────────────────────────────────────

/**
 * Reglas de validación de formularios.
 * @type {Object.<string, (number|RegExp)>}
 */
export const VALIDATION = {
  minPasswordLength: 6,
  cedulaLength: 10,
  placaPattern: /^[A-Z]{3}-\d{4}$/i,
};

/** Objeto de configuración por defecto. */
export default {
  API_BASE_URL,
  API_TIMEOUT,
  APP_NAME,
  APP_VERSION,
  COLORS,
  STORAGE_KEYS,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  VALIDATION,
};