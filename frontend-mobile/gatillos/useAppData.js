/**
 * @fileoverview Contexto global de datos de la aplicación.
 * Gestiona listas paginadas de vehículos, vendedores y categorías,
 * además de operaciones CRUD y validaciones.
 * @module hooks/useAppData
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { vehiculosApi, vendedoresApi, categoriasApi, getErrorMessage } from '../servicios/api';

/**
 * Contexto de datos de la aplicación.
 * @type {React.Context<AppDataContextValue|null>}
 */
const AppDataContext = createContext(null);

/** Estado inicial vacío para listas paginadas. */
const emptyList = { items: [], metadata: null, page: 1, limit: 10, loading: true, error: null };

/**
 * Provider que centraliza el estado y las operaciones de datos.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes hijos.
 * @returns {JSX.Element}
 */
export function AppDataProvider({ children }) {
  // ─── Estados de listas ─────────────────────────────────────────────────────

  const [vehiculosState, setVehiculosState] = useState(emptyList);
  const [vendedoresState, setVendedoresState] = useState(emptyList);
  const [categoriasState, setCategoriasState] = useState(emptyList);

  // ─── Historiales de validación ─────────────────────────────────────────────

  const [historialVehiculos, setHistorialVehiculos] = useState([]);
  const [historialVendedores, setHistorialVendedores] = useState([]);

  // ─── Fetchers ──────────────────────────────────────────────────────────────

  /**
   * Obtiene la lista paginada de vehículos.
   * @async
   * @param {number} [page=1] - Página solicitada.
   * @param {number} [limit=10] - Tamaño de página.
   */
  const fetchVehiculos = useCallback(async (page = 1, limit = 10) => {
    setVehiculosState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { metadata, data } = await vehiculosApi.listar({ page, limit });
      setVehiculosState({ items: data, metadata, page, limit, loading: false, error: null });
    } catch (err) {
      setVehiculosState((s) => ({ ...s, loading: false, error: err }));
    }
  }, []);

  /**
   * Obtiene la lista paginada de vendedores.
   * @async
   * @param {number} [page=1] - Página solicitada.
   * @param {number} [limit=10] - Tamaño de página.
   */
  const fetchVendedores = useCallback(async (page = 1, limit = 10) => {
    setVendedoresState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { metadata, data } = await vendedoresApi.listar({ page, limit });
      setVendedoresState({ items: data, metadata, page, limit, loading: false, error: null });
    } catch (err) {
      setVendedoresState((s) => ({ ...s, loading: false, error: err }));
    }
  }, []);

  /**
   * Obtiene la lista paginada de categorías.
   * @async
   * @param {number} [page=1] - Página solicitada.
   * @param {number} [limit=10] - Tamaño de página.
   */
  const fetchCategorias = useCallback(async (page = 1, limit = 10) => {
    setCategoriasState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { metadata, data } = await categoriasApi.listar({ page, limit });
      setCategoriasState({ items: data, metadata, page, limit, loading: false, error: null });
    } catch (err) {
      setCategoriasState((s) => ({ ...s, loading: false, error: err }));
    }
  }, []);

  /** Carga inicial de datos al montar el provider. */
  useEffect(() => {
    fetchVehiculos(1);
    fetchVendedores(1);
    fetchCategorias(1);
  }, [fetchVehiculos, fetchVendedores, fetchCategorias]);

  // ─── Operaciones: Vehículos ────────────────────────────────────────────────

  /**
   * Crea un vehículo y refresca la lista.
   * @async
   * @param {Object} data - Datos del vehículo.
   * @returns {Promise<Object>} Vehículo creado.
   */
  const addVehiculo = useCallback(
    async (data) => {
      const nuevo = await vehiculosApi.crear(data);
      await fetchVehiculos(vehiculosState.page, vehiculosState.limit);
      return nuevo;
    },
    [fetchVehiculos, vehiculosState.page, vehiculosState.limit]
  );

  /**
   * Actualiza un vehículo y refresca la lista.
   * @async
   * @param {number|string} id - ID del vehículo.
   * @param {Object} data - Campos a actualizar.
   * @returns {Promise<Object>} Vehículo actualizado.
   */
  const updateVehiculo = useCallback(
    async (id, data) => {
      const actualizado = await vehiculosApi.actualizar(id, data);
      await fetchVehiculos(vehiculosState.page, vehiculosState.limit);
      return actualizado;
    },
    [fetchVehiculos, vehiculosState.page, vehiculosState.limit]
  );

  /**
   * Alterna el estado de un vehículo entre VIGENTE y REVOCADA.
   * @async
   * @param {Object} vehiculo - Vehículo completo.
   * @returns {Promise<Object>} Vehículo actualizado.
   */
  const toggleVehiculoEstado = useCallback(
    async (vehiculo) => {
      const nuevoEstado = vehiculo.estadoActivo === 'VIGENTE' ? 'REVOCADA' : 'VIGENTE';
      const actualizado = await vehiculosApi.actualizar(vehiculo.idVehiculo, {
        placa: vehiculo.placa,
        modelo: vehiculo.modelo,
        color: vehiculo.color,
        idHabitante: vehiculo.idHabitante,
        fechaEmision: vehiculo.fechaEmision,
        fechaExpiracion: vehiculo.fechaExpiracion,
        estadoActivo: nuevoEstado,
      });
      await fetchVehiculos(vehiculosState.page, vehiculosState.limit);
      return actualizado;
    },
    [fetchVehiculos, vehiculosState.page, vehiculosState.limit]
  );

  /**
   * Obtiene el detalle de un vehículo por ID.
   * @param {number|string} id - ID del vehículo.
   * @returns {Promise<Object>} Datos del vehículo.
   */
  const obtenerVehiculo = useCallback((id) => vehiculosApi.obtener(id), []);

  /**
   * Valida un vehículo y registra el resultado en historial.
   * @async
   * @param {string} tipoBusqueda - 'placa' | 'qr'.
   * @param {string} valor - Valor a validar.
   * @returns {Promise<Object|null>} Vehículo encontrado o null.
   */
  const validarVehiculo = useCallback(async (tipoBusqueda, valor) => {
    const found = await vehiculosApi.validar(tipoBusqueda, valor);
    setHistorialVehiculos((prev) => [
      {
        placa: found ? found.placa : valor,
        detalle: found ? `${found.modelo} · ${found.color}` : 'No encontrado',
        resultado: found && found.estadoActivo === 'VIGENTE' ? 'valido' : 'invalido',
        hace: 'hace unos segundos',
      },
      ...prev,
    ].slice(0, 6));
    return found;
  }, []);

  // ─── Operaciones: Vendedores ───────────────────────────────────────────────

  /**
   * Crea un vendedor y refresca listas de vendedores y categorías.
   * @async
   * @param {Object} data - Datos del vendedor.
   * @returns {Promise<Object>} Vendedor creado.
   */
  const addVendedor = useCallback(
    async (data) => {
      const nuevo = await vendedoresApi.crear(data);
      await Promise.all([
        fetchVendedores(vendedoresState.page, vendedoresState.limit),
        fetchCategorias(categoriasState.page, categoriasState.limit),
      ]);
      return nuevo;
    },
    [fetchVendedores, fetchCategorias, vendedoresState.page, vendedoresState.limit, categoriasState.page, categoriasState.limit]
  );

  /**
   * Actualiza un vendedor y refresca listas dependientes.
   * @async
   * @param {number|string} id - ID del vendedor.
   * @param {Object} data - Campos a actualizar.
   * @returns {Promise<Object>} Vendedor actualizado.
   */
  const updateVendedor = useCallback(
    async (id, data) => {
      const actualizado = await vendedoresApi.actualizar(id, data);
      await Promise.all([
        fetchVendedores(vendedoresState.page, vendedoresState.limit),
        fetchCategorias(categoriasState.page, categoriasState.limit),
      ]);
      return actualizado;
    },
    [fetchVendedores, fetchCategorias, vendedoresState.page, vendedoresState.limit, categoriasState.page, categoriasState.limit]
  );

  /**
   * Obtiene el detalle de un vendedor por ID.
   * @param {number|string} id - ID del vendedor.
   * @returns {Promise<Object>} Datos del vendedor.
   */
  const obtenerVendedor = useCallback((id) => vendedoresApi.obtener(id), []);

  /**
   * Revoca la autorización de un vendedor cambiando su estado a REVOCADA.
   * @async
   * @param {Object} vendedorCompleto - Objeto completo del vendedor.
   * @returns {Promise<Object>} Vendedor actualizado.
   */
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
        categoriasIds: (vendedorCompleto.categorias || []).map((c) => c.idCategoria),
      });
      await fetchVendedores(vendedoresState.page, vendedoresState.limit);
      return actualizado;
    },
    [fetchVendedores, vendedoresState.page, vendedoresState.limit]
  );

  /**
   * Valida un vendedor y registra el resultado en historial.
   * @async
   * @param {string} tipoBusqueda - Tipo de búsqueda.
   * @param {string} valor - Valor a validar.
   * @returns {Promise<Object|null>} Vendedor encontrado o null.
   */
  const validarVendedor = useCallback(async (tipoBusqueda, valor) => {
    const found = await vendedoresApi.validar(tipoBusqueda, valor);
    setHistorialVendedores((prev) => [
      {
        nombre: found ? found.nombre : valor,
        detalle: found ? (found.categorias || []).map((c) => c.nombre).join(', ') : 'No encontrado',
        resultado: found && found.estadoActivo === 'VIGENTE' ? 'vigente' : 'expirado',
        hace: 'hace unos segundos',
      },
      ...prev,
    ].slice(0, 6));
    return found;
  }, []);

  // ─── Operaciones: Categorías ───────────────────────────────────────────────

  /**
   * Crea una categoría y refresca la lista.
   * @async
   * @param {Object} data - Datos de la categoría.
   * @returns {Promise<Object>} Categoría creada.
   */
  const addCategoria = useCallback(
    async (data) => {
      const nueva = await categoriasApi.crear(data);
      await fetchCategorias(categoriasState.page, categoriasState.limit);
      return nueva;
    },
    [fetchCategorias, categoriasState.page, categoriasState.limit]
  );

  /**
   * Actualiza una categoría y refresca la lista.
   * @async
   * @param {number|string} id - ID de la categoría.
   * @param {Object} data - Campos a actualizar.
   * @returns {Promise<Object>} Categoría actualizada.
   */
  const updateCategoria = useCallback(
    async (id, data) => {
      const actualizada = await categoriasApi.actualizar(id, data);
      await fetchCategorias(categoriasState.page, categoriasState.limit);
      return actualizada;
    },
    [fetchCategorias, categoriasState.page, categoriasState.limit]
  );

  /**
   * Desactiva una categoría.
   * @async
   * @param {Object} categoria - Categoría completa a desactivar.
   */
  const desactivarCategoria = useCallback(
    async (categoria) => {
      await categoriasApi.desactivar(categoria.idCategoria, categoria);
      await fetchCategorias(categoriasState.page, categoriasState.limit);
    },
    [fetchCategorias, categoriasState.page, categoriasState.limit]
  );

  // ─── Value del contexto ────────────────────────────────────────────────────

  /** @type {AppDataContextValue} */
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
    desactivarCategoria,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

/**
 * Hook para consumir el contexto global de datos.
 * @returns {AppDataContextValue} Estado y acciones de datos.
 * @throws {Error} Si se usa fuera de AppDataProvider.
 */
export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData debe usarse dentro de AppDataProvider');
  return ctx;
}