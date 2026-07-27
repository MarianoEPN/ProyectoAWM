/**
 * @fileoverview Opciones visuales y utilidades de UI.
 * Incluye paleta de colores de vehículos, generación de avatares y mapeo de hex.
 * @module utilidades/uiOptions
 */

/**
 * Lista de colores disponibles para vehículos.
 * Cada entrada contiene el nombre legible y su representación hexadecimal.
 * @type {Array<{nombre: string, hex: string}>}
 */
export const vehiculoColores = [
  { nombre: 'Blanco', hex: '#FFFFFF' },
  { nombre: 'Negro', hex: '#000000' },
  { nombre: 'Gris', hex: '#808080' },
  { nombre: 'Plateado', hex: '#C0C0C0' },
  { nombre: 'Azul', hex: '#2563EB' },
  { nombre: 'Rojo', hex: '#DC2626' },
  { nombre: 'Verde', hex: '#16A34A' },
  { nombre: 'Amarillo', hex: '#FACC15' },
  { nombre: 'Naranja', hex: '#F97316' },
  { nombre: 'Marrón', hex: '#92400E' },
  { nombre: 'Beige', hex: '#F5F5DC' },
  { nombre: 'Dorado', hex: '#FFD700' },
  { nombre: 'Rosa', hex: '#EC4899' },
  { nombre: 'Morado', hex: '#9333EA' },
  { nombre: 'Celeste', hex: '#06B6D4' },
];

/**
 * Obtiene el código hexadecimal de un color de vehículo dado su nombre.
 * @param {string} nombre - Nombre del color (ej. 'Rojo').
 * @returns {string} Código hex del color o '#999' si no se encuentra.
 */
export function colorHexDe(nombre) {
  return vehiculoColores.find((c) => c.nombre.toLowerCase() === (nombre || '').toLowerCase())?.hex || '#999';
}

/**
 * Paleta de colores para avatares generados automáticamente.
 * @type {Array<{bg: string, color: string}>}
 */
const avatarColors = [
  { bg: '#FEF3C7', color: '#92400E' },
  { bg: '#D1FAE5', color: '#065F46' },
  { bg: '#EDE9FE', color: '#5B21B6' },
  { bg: '#E0F2FE', color: '#0369A1' },
  { bg: '#FEE2E2', color: '#991B1B' },
  { bg: '#F5F0E8', color: '#78716C' },
  { bg: '#FCE7F3', color: '#BE185D' },
  { bg: '#FAE8FF', color: '#A21CAF' },
];

/**
 * Genera las iniciales de un nombre completo.
 * @param {string} nombre - Nombre completo (ej. 'Juan Pérez').
 * @returns {string} Iniciales en mayúsculas (ej. 'JP'). Devuelve '??' si está vacío.
 */
export function getInitials(nombre) {
  if (!nombre) return '??';
  const parts = nombre.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Determina un color de avatar determinista basado en el nombre.
 * @param {string} nombre - Nombre del usuario.
 * @returns {{bg: string, color: string}} Objeto con color de fondo y de texto.
 */
export function getAvatarColors(nombre) {
  if (!nombre) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}