/**
 * @fileoverview Punto de entrada de la aplicación.
 * Configura navegación por tabs y stack, autenticación por rol y proveedores de datos.
 * @module App
 */

import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './gatillos/useAuth';
import { AppDataProvider } from './gatillos/useAppData';
import { COLORS } from './utilidades/config';

// Pantallas de validación (solo validador)
import ValidarVehiculo from './pantallas/ValidarVehiculo';
import ValidarVendedor from './pantallas/ValidarVendedor';

// Pantalla de selección de rol (sin login real)
import RoleSelection from './pantallas/RoleSelection';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Configuración de tabs disponibles en la aplicación.
 * @type {Object.<string, {component: React.ComponentType, icon: string, label: string}>}
 */
const tabsConfig = {
  ValidarVehiculo: { component: ValidarVehiculo, icon: 'qr-code', label: 'Validar Auto' },
  ValidarVendedor: { component: ValidarVendedor, icon: 'id-card', label: 'Validar Vend.' },
};

/**
 * Navegador de tabs principal.
 * Solo muestra las pestañas de validador.
 * @returns {JSX.Element}
 */
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = focused ? tabsConfig[route.name].icon : `${tabsConfig[route.name].icon}-outline`;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
        },
        headerShown: false,
      })}
    >
      {Object.keys(tabsConfig).map((tabName) => (
        <Tab.Screen
          key={tabName}
          name={tabName}
          component={tabsConfig[tabName].component}
          options={{ title: tabsConfig[tabName].label }}
        />
      ))}
    </Tab.Navigator>
  );
}

/**
 * Stack interno que contiene las tabs.
 * @returns {JSX.Element}
 */
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
    </Stack.Navigator>
  );
}

/**
 * Navegador raíz.
 * Muestra RoleSelection si no hay rol, o el stack principal si ya existe.
 * @returns {JSX.Element}
 */
function RootNavigator() {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!userRole ? (
        <Stack.Screen name="RoleSelection" component={RoleSelection} />
      ) : (
        <Stack.Screen name="AppStack" component={AppStack} />
      )}
    </Stack.Navigator>
  );
}

/**
 * Componente raíz de la aplicación.
 * Provee contexto de autenticación, datos y navegación.
 * @returns {JSX.Element}
 */
export default function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AppDataProvider>
    </AuthProvider>
  );
}