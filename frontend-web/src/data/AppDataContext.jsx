import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { vehiculosApi, vendedoresApi, categoriasApi } from '../services/api.js'

const AppDataContext = createContext(null)

const emptyList = { items: [], metadata: null, page: 1, limit: 10, loading: true, error: null }

export function AppDataProvider({ children }) {
  const [vehiculosState, setVehiculosState] = useState(emptyList)
  const [vendedoresState, setVendedoresState] = useState(emptyList)
  const [categoriasState, setCategoriasState] = useState(emptyList)

  // El historial de "últimas verificaciones" no existe en el contrato de
  // endpoints (los GET /validar solo hacen la consulta puntual, no la
  // registran). Por eso vive solo en memoria del cliente, no viene del backend.
  const [historialVehiculos, setHistorialVehiculos] = useState([])
  const [historialVendedores, setHistorialVendedores] = useState([])

  // ---------- Fetchers paginados ----------
  const fetchVehiculos = useCallback(async (page = 1, limit = 10) => {
    setVehiculosState((s) => ({ ...s, loading: true, error: null }))
    try {
      const { metadata, data } = await vehiculosApi.listar({ page, limit })
      setVehiculosState({ items: data, metadata, page, limit, loading: false, error: null })
    } catch (err) {
      setVehiculosState((s) => ({ ...s, loading: false, error: err }))
    }
  }, [])

  const fetchVendedores = useCallback(async (page = 1, limit = 10) => {
    setVendedoresState((s) => ({ ...s, loading: true, error: null }))
    try {
      const { metadata, data } = await vendedoresApi.listar({ page, limit })
      setVendedoresState({ items: data, metadata, page, limit, loading: false, error: null })
    } catch (err) {
      setVendedoresState((s) => ({ ...s, loading: false, error: err }))
    }
  }, [])

  const fetchCategorias = useCallback(async (page = 1, limit = 10) => {
    setCategoriasState((s) => ({ ...s, loading: true, error: null }))
    try {
      const { metadata, data } = await categoriasApi.listar({ page, limit })
      setCategoriasState({ items: data, metadata, page, limit, loading: false, error: null })
    } catch (err) {
      setCategoriasState((s) => ({ ...s, loading: false, error: err }))
    }
  }, [])

  useEffect(() => {
    fetchVehiculos(1)
    fetchVendedores(1)
    fetchCategorias(1)
  }, [fetchVehiculos, fetchVendedores, fetchCategorias])

  // ---------- Vehículos ----------
  const addVehiculo = useCallback(
    async (data) => {
      const nuevo = await vehiculosApi.crear(data)
      await fetchVehiculos(vehiculosState.page, vehiculosState.limit)
      return nuevo
    },
    [fetchVehiculos, vehiculosState.page, vehiculosState.limit]
  )

  const updateVehiculo = useCallback(
    async (id, data) => {
      const actualizado = await vehiculosApi.actualizar(id, data)
      await fetchVehiculos(vehiculosState.page, vehiculosState.limit)
      return actualizado
    },
    [fetchVehiculos, vehiculosState.page, vehiculosState.limit]
  )

  // No existe PATCH de estado: hay que reenviar el objeto completo por PUT
  // con estadoActivo invertido (por eso recibe el vehículo completo, no solo el id).
  const toggleVehiculoEstado = useCallback(
    async (vehiculo) => {
      const nuevoEstado = vehiculo.estadoActivo === 'VIGENTE' ? 'REVOCADA' : 'VIGENTE'
      const actualizado = await vehiculosApi.actualizar(vehiculo.idVehiculo, {
        placa: vehiculo.placa,
        modelo: vehiculo.modelo,
        color: vehiculo.color,
        idHabitante: vehiculo.idHabitante,
        fechaEmision: vehiculo.fechaEmision,
        fechaExpiracion: vehiculo.fechaExpiracion,
        estadoActivo: nuevoEstado
      })
      await fetchVehiculos(vehiculosState.page, vehiculosState.limit)
      return actualizado
    },
    [fetchVehiculos, vehiculosState.page, vehiculosState.limit]
  )

  const obtenerVehiculo = useCallback((id) => vehiculosApi.obtener(id), [])

  const validarVehiculo = useCallback(async (tipoBusqueda, valor) => {
    const found = await vehiculosApi.validar(tipoBusqueda, valor)
    setHistorialVehiculos((prev) =>
      [
        {
          placa: found ? found.placa : valor,
          detalle: found ? `${found.modelo} · ${found.color}` : 'No encontrado',
          resultado: found && found.estadoActivo === 'VIGENTE' ? 'valido' : 'invalido',
          hace: 'hace unos segundos'
        },
        ...prev
      ].slice(0, 6)
    )
    return found
  }, [])

  // ---------- Vendedores ----------
  const addVendedor = useCallback(
    async (data) => {
      const nuevo = await vendedoresApi.crear(data)
      await Promise.all([
        fetchVendedores(vendedoresState.page, vendedoresState.limit),
        fetchCategorias(categoriasState.page, categoriasState.limit) // totalVendedores cambia
      ])
      return nuevo
    },
    [fetchVendedores, fetchCategorias, vendedoresState.page, vendedoresState.limit, categoriasState.page, categoriasState.limit]
  )

  const updateVendedor = useCallback(
    async (id, data) => {
      const actualizado = await vendedoresApi.actualizar(id, data)
      await Promise.all([
        fetchVendedores(vendedoresState.page, vendedoresState.limit),
        fetchCategorias(categoriasState.page, categoriasState.limit)
      ])
      return actualizado
    },
    [fetchVendedores, fetchCategorias, vendedoresState.page, vendedoresState.limit, categoriasState.page, categoriasState.limit]
  )

  // La lista de /vendedores no trae todos los campos editables (falta foto,
  // fechaEmision, idHabitante, categoriasIds) así que para editar/revocar hay
  // que pedir el detalle completo primero.
  const obtenerVendedor = useCallback((id) => vendedoresApi.obtener(id), [])

  // Tampoco existe un endpoint dedicado a "revocar": es un PUT completo con
  // estadoActivo cambiado. Por eso recibe el vendedor COMPLETO (el resultado
  // de obtenerVendedor), no solo el id.
  const revocarVendedor = useCallback(
    async (vendedorCompleto) => {
      const actualizado = await vendedoresApi.actualizar(vendedorCompleto.idVendedor, {
        cedula: vendedorCompleto.cedula,
        nombre: vendedorCompleto.nombre,
        foto: vendedorCompleto.foto,
        nResolucion: vendedorCompleto.nResolucion,
        fechaEmision: vendedorCompleto.fechaEmision,
        fechaExpiracion: vendedorCompleto.fechaExpiracion,
        estadoActivo: 'REVOCADA',
        idHabitante: vendedorCompleto.idHabitante,
        categoriasIds: (vendedorCompleto.categorias || []).map((c) => c.idCategoria)
      })
      await fetchVendedores(vendedoresState.page, vendedoresState.limit)
      return actualizado
    },
    [fetchVendedores, vendedoresState.page, vendedoresState.limit]
  )

  const validarVendedor = useCallback(async (tipoBusqueda, valor) => {
    const found = await vendedoresApi.validar(tipoBusqueda, valor)
    setHistorialVendedores((prev) =>
      [
        {
          nombre: found ? found.nombre : valor,
          detalle: found ? (found.categorias || []).map((c) => c.nombre).join(', ') : 'No encontrado',
          resultado: found && found.estadoActivo === 'VIGENTE' ? 'vigente' : 'expirado',
          hace: 'hace unos segundos'
        },
        ...prev
      ].slice(0, 6)
    )
    return found
  }, [])

  // ---------- Categorías ----------
  const addCategoria = useCallback(
    async (data) => {
      const nueva = await categoriasApi.crear(data)
      await fetchCategorias(categoriasState.page, categoriasState.limit)
      return nueva
    },
    [fetchCategorias, categoriasState.page, categoriasState.limit]
  )

  const updateCategoria = useCallback(
    async (id, data) => {
      const actualizada = await categoriasApi.actualizar(id, data)
      await fetchCategorias(categoriasState.page, categoriasState.limit)
      return actualizada
    },
    [fetchCategorias, categoriasState.page, categoriasState.limit]
  )

  // No hay DELETE /categorias/{id}: es un PUT que la desactiva (soft-delete).
  const desactivarCategoria = useCallback(
    async (categoria) => {
      await categoriasApi.desactivar(categoria.idCategoria, categoria)
      await fetchCategorias(categoriasState.page, categoriasState.limit)
    },
    [fetchCategorias, categoriasState.page, categoriasState.limit]
  )

  const value = {
    // Vehículos
    vehiculos: vehiculosState.items,
    vehiculosMeta: vehiculosState.metadata,
    vehiculosPage: vehiculosState.page,
    vehiculosLoading: vehiculosState.loading,
    vehiculosError: vehiculosState.error,
    fetchVehiculos,
    addVehiculo,
    updateVehiculo,
    toggleVehiculoEstado,
    obtenerVehiculo,
    validarVehiculo,
    historialVehiculos,

    // Vendedores
    vendedores: vendedoresState.items,
    vendedoresMeta: vendedoresState.metadata,
    vendedoresPage: vendedoresState.page,
    vendedoresLoading: vendedoresState.loading,
    vendedoresError: vendedoresState.error,
    fetchVendedores,
    addVendedor,
    updateVendedor,
    obtenerVendedor,
    revocarVendedor,
    validarVendedor,
    historialVendedores,

    // Categorías
    categorias: categoriasState.items,
    categoriasMeta: categoriasState.metadata,
    categoriasPage: categoriasState.page,
    categoriasLoading: categoriasState.loading,
    categoriasError: categoriasState.error,
    fetchCategorias,
    addCategoria,
    updateCategoria,
    desactivarCategoria
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData debe usarse dentro de <AppDataProvider>')
  return ctx
}
