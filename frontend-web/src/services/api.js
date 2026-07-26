import axios from 'axios'

// Todas las llamadas pasan por esta instancia. Cambia VITE_API_URL en tu
// archivo .env (ver .env.example) para apuntar a tu backend real.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' }
})

// Si tu backend usa auth (JWT en localStorage, cookies, etc.), agrégalo aquí:
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token')
//   if (token) config.headers.Authorization = `Bearer ${token}`
//   return config
// })

/* ------------------------------------------------------------------ *
 * AJUSTA las rutas y el "shape" de cada payload/respuesta a lo que
 * realmente exponga tu API. Las que dejo aquí son solo el contrato que
 * asumí para que el resto del código (AppDataContext) tenga con qué
 * trabajar.
 * ------------------------------------------------------------------ */

// ---------- Vehículos ----------
export const vehiculosApi = {
  listar: () => api.get('/vehiculos').then((res) => res.data),
  crear: (data) => api.post('/vehiculos', data).then((res) => res.data),
  actualizar: (id, data) => api.put(`/vehiculos/${id}`, data).then((res) => res.data),
  cambiarEstado: (id) => api.patch(`/vehiculos/${id}/estado`).then((res) => res.data),
  buscarPorPlaca: (placa) =>
    api
      .get('/vehiculos/buscar', { params: { placa } })
      .then((res) => res.data)
      .catch((err) => {
        if (err.response?.status === 404) return null
        throw err
      })
}

// ---------- Vendedores ----------
export const vendedoresApi = {
  listar: () => api.get('/vendedores').then((res) => res.data),
  crear: (data) => api.post('/vendedores', data).then((res) => res.data),
  actualizar: (id, data) => api.put(`/vendedores/${id}`, data).then((res) => res.data),
  revocar: (id) => api.patch(`/vendedores/${id}/revocar`).then((res) => res.data),
  buscar: (query) =>
    api
      .get('/vendedores/buscar', { params: { query } })
      .then((res) => res.data)
      .catch((err) => {
        if (err.response?.status === 404) return null
        throw err
      })
}

// ---------- Categorías ----------
export const categoriasApi = {
  listar: () => api.get('/categorias').then((res) => res.data),
  crear: (data) => api.post('/categorias', data).then((res) => res.data),
  actualizar: (id, data) => api.put(`/categorias/${id}`, data).then((res) => res.data),
  eliminar: (id) => api.delete(`/categorias/${id}`).then((res) => res.data)
}

// ---------- Historial de verificaciones (opcional) ----------
// Si tu backend no guarda esto todavía, deja estas dos funciones sin usar
// y el historial simplemente vivirá en memoria (ver AppDataContext).
export const historialApi = {
  vehiculos: () => api.get('/historial/vehiculos').then((res) => res.data),
  vendedores: () => api.get('/historial/vendedores').then((res) => res.data)
}
