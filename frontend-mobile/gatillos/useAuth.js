/**
 * @fileoverview Hook y Provider para gestión de autenticación basada en roles.
 * Actualmente no utiliza login real; el usuario selecciona su rol (validador/administrador).
 * @module hooks/useAuth
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utilidades/config';

/**
 * Contexto de autenticación.
 * @type {React.Context<AuthContextValue|null>}
 */
const AuthContext = createContext(null);

/**
 * Provider que envuelve la aplicación y mantiene el estado de autenticación.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes hijos.
 * @returns {JSX.Element}
 */
export function AuthProvider({ children }) {
  const [userRole, setUserRole] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Carga el rol y token almacenados en AsyncStorage al iniciar la app.
   * @async
   */
  const cargarAuth = useCallback(async () => {
    try {
      const [storedRole, storedToken] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.userRole),
        AsyncStorage.getItem(STORAGE_KEYS.authToken),
      ]);
      if (storedRole) setUserRole(storedRole);
      if (storedToken) setToken(storedToken);
    } catch (error) {
      console.error('Error cargando auth:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Efecto de montura: restaura sesión previa si existe. */
  useEffect(() => {
    cargarAuth();
  }, [cargarAuth]);

  /**
   * Guarda el rol y token en almacenamiento local.
   * @async
   * @param {string} role - Rol seleccionado ('validador' | 'administrador').
   * @param {string} [authToken] - Token de autenticación opcional.
   * @returns {{success: boolean, error?: string}} Resultado de la operación.
   */
  const setAuth = async (role, authToken) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.userRole, role),
        authToken ? AsyncStorage.setItem(STORAGE_KEYS.authToken, authToken) : Promise.resolve(),
      ]);
      setUserRole(role);
      if (authToken) setToken(authToken);
      return { success: true };
    } catch (error) {
      console.error('Error guardando auth:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Elimina las credenciales almacenadas y limpia el estado.
   * @async
   */
  const clearAuth = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.userRole),
        AsyncStorage.removeItem(STORAGE_KEYS.authToken),
      ]);
      setUserRole(null);
      setToken(null);
    } catch (error) {
      console.error('Error limpiando auth:', error);
    }
  };

  /** @type {AuthContextValue} */
  const value = {
    userRole,
    token,
    loading,
    setAuth,
    clearAuth,
    isAuthenticated: !!userRole,
    cargarAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para consumir el contexto de autenticación.
 * @returns {AuthContextValue} Estado y acciones de autenticación.
 * @throws {Error} Si se usa fuera de AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}