/**
 * @fileoverview Pantalla de selección de rol.
 * No requiere credenciales; el usuario ingresa directamente como Validador.
 * El rol se persiste en AsyncStorage vía useAuth.
 * @module pantallas/RoleSelection
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../gatillos/useAuth';
import { COLORS } from '../utilidades/config';

/**
 * Pantalla inicial para seleccionar el rol de acceso.
 * @param {Object} props
 * @param {Object} props.navigation - Objeto de navegación de React Navigation.
 * @returns {JSX.Element}
 */
export default function RoleSelection({ navigation }) {
  const { loading, setAuth, userRole } = useAuth();

  /**
   * Efecto de redirección: si ya existe un rol almacenado,
   * navega automáticamente al área principal.
   */
  useEffect(() => {
    if (userRole && !loading) {
      navigation.navigate('AppStack');
    }
  }, [userRole, loading, navigation]);

  /**
   * Guarda el rol de validador y navega a la aplicación.
   * @async
   */
  const handleSetRole = async () => {
    const result = await setAuth('validador');
    if (result.success) {
      navigation.navigate('AppStack');
    }
  };

  /** Estado de carga mientras se lee AsyncStorage. */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Ionicons name="people-circle" size={80} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>GESTOR COMUNIDAD</Text>
        <Text style={styles.subtitle}>Acceso exclusivo para validadores</Text>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.roleButton, { borderColor: COLORS.primary }]}
            onPress={handleSetRole}
            activeOpacity={0.8}
          >
            <Ionicons name="qr-code" size={28} color={COLORS.primary} style={styles.roleIcon} />
            <View style={styles.roleTextContainer}>
              <Text style={styles.roleButtonTitle}>Entrar como Validador</Text>
              <Text style={styles.roleButtonSubtitle}>Validar vehículos y vendedores</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>GESTOR COMUNIDAD v1.0.0</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    gap: 24,
  },
  logoContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 2,
    gap: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
    textAlign: 'center',
    lineHeight: 48,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  roleButtonSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: 32,
  },
  versionText: {
    fontSize: 11,
    color: COLORS.gray,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.gray,
  },
});