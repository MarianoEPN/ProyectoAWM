import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { vehiculosApi, vendedoresApi, categoriasApi, historialApi } from '../services/api.js'

const AppDataContext = createContext(null)

export function AppDataProvider({ children }) {
  const [vehiculos, setVehiculos] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [categorias, setCategorias] = useState([])
  const [historialVehiculos, setHistorialVehiculos] = useState([])
  const [historialVendedores, setHistorialVendedores] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Carga inicial: pide todo al backend en paralelo.
  useEffect(() => {
    let cancelado = false

    async function cargarTodo() {
      setLoading(true)
      setError(null)
      try {
        const [v, vend, cat] = await Promise.all([
          vehiculosApi.listar(),
          vendedoresApi.listar(),
          categoriasApi.listar()
        ])
        if (cancelado) return
        setVehiculos(v)
        setVendedores(vend)
        setCategorias(cat)
      } catch (err) {
        if (!cancelado) setError(err)
        console.error('Error cargando datos iniciales:', err)
      } finally {
        if (!cancelado) setLoading(false)
      }

      // El historial es opcional: si tu backend aún no lo implementa,
      // simplemente se queda vacío en vez de romper la carga principal.
      try {
        const [hv, hvd] = await Promise.all([historialApi.vehiculos(), historialApi.vendedores()])
        if (!cancelado) {
          setHistorialVehiculos(hv)
          setHistorialVendedores(hvd)
        }
      } catch (err) {
        console.warn('Historial de verificaciones no disponible todavía:', err.message)
      }
    }

    cargarTodo()
    return () => {
      cancelado = true
    }
  }, [])

  // ---------- Vehículos ----------
  const addVehiculo = useCallback(async (data) => {
    const nuevo = await vehiculosApi.crear(data)
    setVehiculos((prev) => [nuevo, ...prev])
    return nuevo
  }, [])

  const updateVehiculo = useCallback(async (id, data) => {
    const actualizado = await vehiculosApi.actualizar(id, data)
    setVehiculos((prev) => prev.map((v) => (v.id === id ? actualizado : v)))
    return actualizado
  }, [])

  const toggleVehiculoEstado = useCallback(async (id) => {
    const actualizado = await vehiculosApi.cambiarEstado(id)
    setVehiculos((prev) => prev.map((v) => (v.id === id ? actualizado : v)))
    return actualizado
  }, [])

  const buscarVehiculoPorPlaca = useCallback(async (placa) => {
    const found = await vehiculosApi.buscarPorPlaca(placa)
    setHistorialVehiculos((prev) =>
      [
        {
          placa: (placa || '').toUpperCase(),
          detalle: found ? `${found.modelo} · ${found.colorNombre}` : 'No encontrado',
          resultado: found && found.estado === 'activo' && found.qr === 'activo' ? 'valido' : 'invalido',
          hace: 'hace unos segundos'
        },
        ...prev
      ].slice(0, 6)
    )
    return found
  }, [])

  // ---------- Vendedores ----------
  const addVendedor = useCallback(async (data) => {
    const nuevo = await vendedoresApi.crear(data)
    setVendedores((prev) => [nuevo, ...prev])
    return nuevo
  }, [])

  const updateVendedor = useCallback(async (id, data) => {
    const actualizado = await vendedoresApi.actualizar(id, data)
    setVendedores((prev) => prev.map((v) => (v.id === id ? actualizado : v)))
    return actualizado
  }, [])

  const revocarVendedor = useCallback(async (id) => {
    const actualizado = await vendedoresApi.revocar(id)
    setVendedores((prev) => prev.map((v) => (v.id === id ? actualizado : v)))
    return actualizado
  }, [])

  const buscarVendedor = useCallback(async (query) => {
    const found = await vendedoresApi.buscar(query)
    setHistorialVendedores((prev) =>
      [
        {
          nombre: found ? found.nombre : 'No encontrado',
          detalle: found ? found.categoria : `Búsqueda: ${query}`,
          resultado: found && found.estado === 'vigente' ? 'vigente' : 'expirado',
          hace: 'hace unos segundos'
        },
        ...prev
      ].slice(0, 6)
    )
    return found
  }, [])

  // ---------- Categorías ----------
  const addCategoria = useCallback(async (data) => {
    const nueva = await categoriasApi.crear(data)
    setCategorias((prev) => [...prev, nueva])
    return nueva
  }, [])

  const updateCategoria = useCallback(async (id, data) => {
    const actualizada = await categoriasApi.actualizar(id, data)
    setCategorias((prev) => prev.map((c) => (c.id === id ? actualizada : c)))
    return actualizada
  }, [])

  const deleteCategoria = useCallback(async (id) => {
    await categoriasApi.eliminar(id)
    setCategorias((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const vendedoresPorCategoria = useMemo(() => {
    const map = {}
    for (const v of vendedores) {
      map[v.categoria] = (map[v.categoria] || 0) + 1
    }
    return map
  }, [vendedores])

  const value = {
    loading,
    error,

    vehiculos,
    addVehiculo,
    updateVehiculo,
    toggleVehiculoEstado,
    buscarVehiculoPorPlaca,
    historialVehiculos,

    vendedores,
    addVendedor,
    updateVendedor,
    revocarVendedor,
    buscarVendedor,
    historialVendedores,

    categorias,
    addCategoria,
    updateCategoria,
    deleteCategoria,
    vendedoresPorCategoria
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData debe usarse dentro de <AppDataProvider>')
  return ctx
}
