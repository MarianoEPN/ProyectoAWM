const PALETTE = [
  { bg: '#fef3c7', color: '#92400e' },
  { bg: '#d1fae5', color: '#065f46' },
  { bg: '#ede9fe', color: '#5b21b6' },
  { bg: '#e0f2fe', color: '#0369a1' },
  { bg: '#fee2e2', color: '#991b1b' }
]

export function getInitials(nombre = '') {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '??'
}

// Mismo nombre -> siempre el mismo color (hash simple, determinístico).
export function getAvatarColors(seed = '') {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return PALETTE[hash % PALETTE.length]
}
