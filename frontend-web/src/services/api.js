import axios from 'axios'

// Cambia esto en tu .env (ver .env.example): VITE_API_URL=https://tu-backend/api
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://proyectoawm-backend-h6gfbtcph8bvgncu.canadacentral-01.azurewebsites.net',
  headers: { 'Content-Type': 'application/json' }
})

// Todos los endpoints acordados requieren "Authorization: Bearer <token_jwt>".
// El documento de endpoints no define un flujo de login todavía, así que por
// ahora el token se lee de localStorage. En cuanto exista el endpoint de
// autenticación, guarda el token ahí (localStorage.setItem('token', jwt))
// después del login y esto empezará a enviarse solo.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// El backend responde errores siempre con { error: true, statusCode, message }.
export function getErrorMessage(err) {
  if (err.response?.data?.message) return err.response.data.message
  if (err.response?.status === 401) return 'Sesión expirada o token inválido.'
  if (err.response?.status === 403) return 'No tienes permisos para realizar esta acción.'
  return err.message || 'Error inesperado de conexión con el servidor.'
}

function getStatus(err) {
  return err.response?.status
}

/* ============================================================
 * Vendedores
 * ========================================================== */
export const vendedoresApi = {
  // GET /vendedores?page&limit -> { metadata, data }
  listar: ({ page = 1, limit = 10 } = {}) =>
    api.get('/vendedores', { params: { page, limit } }).then((res) => res.data),

  // GET /vendedores/{id} -> detalle completo (incluye codigoQr, idHabitante, fechas)
  obtener: (id) => api.get(`/vendedores/${id}`).then((res) => res.data),

  // POST /vendedores
  // body: { cedula, nombre, foto, nResolucion, fechaEmision, fechaExpiracion, estadoActivo, idHabitante, categoriasIds: [] }
  crear: (data) => api.post('/vendedores', data).then((res) => res.data),

  // PUT /vendedores/{id} — reemplaza TODOS los campos editables (mismo body que crear)
  actualizar: (id, data) => api.put(`/vendedores/${id}`, data).then((res) => res.data),

  // GET /vendedores/validar?tipoBusqueda=cedula|resolucion|qr&valor=...
  // Responde 404 si no hay coincidencia -> lo traducimos a null.
  validar: (tipoBusqueda, valor) =>
    api
      .get('/vendedores/validar', { params: { tipoBusqueda, valor } })
      .then((res) => res.data)
      .catch((err) => {
        if (getStatus(err) === 404) return null
        throw err
      })
}

/* ============================================================
 * Vehículos
 * ========================================================== */
export const vehiculosApi = {
  // GET /vehiculos?page&limit -> { metadata, data }
  listar: ({ page = 1, limit = 10 } = {}) =>
    api.get('/vehiculos', { params: { page, limit } }).then((res) => res.data),

  // GET /vehiculos/{id} -> detalle completo (incluye codigoQr)
  obtener: (id) => api.get(`/vehiculos/${id}`).then((res) => res.data),

  // POST /vehiculos
  // body: { placa, modelo, color, idHabitante, fechaEmision, fechaExpiracion, estadoActivo }
  crear: (data) => api.post('/vehiculos', data).then((res) => res.data),

  // PUT /vehiculos/{id} — reemplaza TODOS los campos editables (mismo body que crear)
  actualizar: (id, data) => api.put(`/vehiculos/${id}`, data).then((res) => res.data),

  // GET /vehiculos/validar?tipoBusqueda=placa|qr&valor=...
  validar: (tipoBusqueda, valor) =>
    api
      .get('/vehiculos/validar', { params: { tipoBusqueda, valor } })
      .then((res) => res.data)
      .catch((err) => {
        if (getStatus(err) === 404) return null
        throw err
      })
}

/* ============================================================
 * Categorías
 * ========================================================== */
export const categoriasApi = {
  // GET /categorias?page&limit -> { metadata, data }
  listar: ({ page = 1, limit = 10 } = {}) =>
    api.get('/categorias', { params: { page, limit } }).then((res) => res.data),

  obtener: (id) => api.get(`/categorias/${id}`).then((res) => res.data),

  // POST /categorias — body: { nombre, descripcion }
  crear: (data) => api.post('/categorias', data).then((res) => res.data),

  // PUT /categorias/{id} — body: { nombre, descripcion }.
  // El documento indica que este mismo endpoint también sirve para
  // "borrado lógico" cambiando estadoActivo, aunque los ejemplos de
  // body/respuesta no incluyen ese campo explícitamente. Lo enviamos
  // igual cuando corresponda (ver desactivar más abajo) — confirmar con
  // el equipo de backend el nombre/valores exactos de ese campo.
  actualizar: (id, data) => api.put(`/categorias/${id}`, data).then((res) => res.data),

  // No existe DELETE /categorias/{id} en el contrato: "eliminar" es en
  // realidad un PUT que desactiva la categoría.
  desactivar: (id, categoriaActual) =>
    api
      .put(`/categorias/${id}`, {
        nombre: categoriaActual.nombre,
        descripcion: categoriaActual.descripcion,
        estadoActivo: 'INACTIVA'
      })
      .then((res) => res.data)
}
