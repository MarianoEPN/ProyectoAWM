/**
 * @fileoverview Pantalla de validación de vehículos por QR o placa.
 * Incluye escaneo de códigos QR mediante expo-camera.
 * @module pantallas/ValidarVehiculo
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, Camera } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppData } from '../gatillos/useAppData';
import { getErrorMessage } from '../servicios/api';
import { colorHexDe } from '../utilidades/uiOptions';
import { COLORS } from '../utilidades/config';
import { useAuth } from '../gatillos/useAuth';
import Modal, { ModalContent, ModalHeader, ModalActions, ModalButton } from '../componentes/Modal';

const HISTORIAL_KEY = '@historial_vehiculos';

export default function ValidarVehiculo({ navigation }) {
  const { validarVehiculo } = useAppData();
  const { clearAuth } = useAuth();
  const insets = useSafeAreaInsets();
  const [tipoBusqueda, setTipoBusqueda] = useState('placa');
  const [valor, setValor] = useState('');
  const [resultado, setResultado] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [historial, setHistorial] = useState([]);
  const [escaneando, setEscaneando] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(HISTORIAL_KEY).then((raw) => {
      if (raw) setHistorial(JSON.parse(raw));
    });
  }, []);

  const guardarHistorial = async (nuevo) => {
    setHistorial(nuevo);
    await AsyncStorage.setItem(HISTORIAL_KEY, JSON.stringify(nuevo));
  };

  const handleAbrirCamara = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasCameraPermission(status === 'granted');
    if (status === 'granted') {
      setEscaneando(true);
    } else {
      Alert.alert('Permiso requerido', 'Debes permitir el acceso a la cámara para escanear códigos QR.');
    }
  };

  const ejecutarValidacion = async (val) => {
    if (!val.trim()) return;
    setBuscando(true);
    setErrorMsg('');
    setResultado(null);
    setShowModal(false);
    setModalError(false);
    try {
      const found = await validarVehiculo(tipoBusqueda, val.trim());
      const entry = {
        placa: found ? found.placa : val,
        detalle: found ? `${found.modelo} · ${found.color}` : 'No encontrado',
        resultado: found && found.estadoActivo === 'VIGENTE' ? 'valido' : 'invalido',
        hace: 'hace unos segundos',
      };
      guardarHistorial([entry, ...historial].slice(0, 20));
      if (found) {
        setResultado(found);
        setShowModal(true);
      } else {
        setModalError(true);
        setShowModal(true);
      }
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
      setModalError(true);
      setShowModal(true);
    } finally {
      setBuscando(false);
    }
  };

  const handleBuscar = async () => {
    await ejecutarValidacion(valor);
  };

  const handleBarCodeScanned = ({ data }) => {
    setEscaneando(false);
    setValor(data);
    setTipoBusqueda('qr');
    ejecutarValidacion(data);
  };

  const esValido = resultado && resultado.estadoActivo === 'VIGENTE';

  if (escaneando) {
    if (hasCameraPermission === null) {
      return (
        <View style={[styles.loading, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Solicitando permiso de cámara...</Text>
        </View>
      );
    }
    if (hasCameraPermission === false) {
      return (
        <View style={[styles.loading, { paddingTop: insets.top }]}>
          <Ionicons name="camera-off" size={48} color={COLORS.gray} />
          <Text style={styles.loadingText}>Se necesita permiso para usar la cámara</Text>
          <TouchableOpacity style={styles.btnBuscar} onPress={handleAbrirCamara}>
            <Text style={styles.btnBuscarTexto}>Conceder permiso</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnBuscar, { marginTop: 10, backgroundColor: COLORS.gray }]} onPress={() => setEscaneando(false)}>
            <Text style={styles.btnBuscarTexto}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={[styles.cameraContainer, { paddingTop: insets.top }]}>
        <CameraView style={styles.camera} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={handleBarCodeScanned}>
          <View style={styles.cameraOverlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.cameraHint}>Enfoca el código QR dentro del recuadro</Text>
          </View>
        </CameraView>
        <TouchableOpacity style={styles.cameraCloseBtn} onPress={() => setEscaneando(false)}>
          <Ionicons name="close-circle" size={48} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={{ width: 44 }} />
        <Text style={styles.headerTitulo}>Validar Vehículo</Text>
        <TouchableOpacity onPress={clearAuth} style={styles.backBtn}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.scanSection}>
          <Text style={styles.sectionTitle}>Escanear QR</Text>
          <Text style={styles.sectionSubtitle}>Apunta la cámara al código QR del vehículo</Text>
          <TouchableOpacity style={styles.scanArea} onPress={handleAbrirCamara} activeOpacity={0.8}>
            <View style={[styles.scanCorner, { top: 6, left: 6, borderTopWidth: 2, borderLeftWidth: 2 }]} />
            <View style={[styles.scanCorner, { top: 6, right: 6, borderTopWidth: 2, borderRightWidth: 2 }]} />
            <View style={[styles.scanCorner, { bottom: 6, left: 6, borderBottomWidth: 2, borderLeftWidth: 2 }]} />
            <View style={[styles.scanCorner, { bottom: 6, right: 6, borderBottomWidth: 2, borderRightWidth: 2 }]} />
            <Ionicons name="qr-code" size={48} color={COLORS.primary} />
            <Text style={styles.scanTapText}>Toca para abrir la cámara</Text>
          </TouchableOpacity>
          <Text style={styles.scanHint}>— o busca manualmente abajo —</Text>
        </View>

        <View style={styles.manualSection}>
          <Text style={styles.sectionTitle}>Búsqueda por placa</Text>
          <Text style={styles.sectionSubtitle}>Ingresa la placa del vehículo a continuación</Text>
          <TextInput
            style={styles.manualInput}
            placeholder='Ej. ABC-1234'
            value={valor}
            onChangeText={setValor}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={[styles.btnBuscar, buscando && styles.btnDisabled]} onPress={handleBuscar} disabled={buscando}>
            <Text style={styles.btnBuscarTexto}>{buscando ? 'Buscando…' : 'Buscar'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historialSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Historial de Verificaciones</Text>
            {historial.length > 0 && (
              <TouchableOpacity onPress={() => { setHistorial([]); AsyncStorage.removeItem(HISTORIAL_KEY); }}>
                <Text style={{ fontSize: 12, color: COLORS.danger }}>Limpiar</Text>
              </TouchableOpacity>
            )}
          </View>
          {historial.length === 0 ? (
            <Text style={styles.emptyHist}>Sin verificaciones aún.</Text>
          ) : (
            historial.map((h, i) => (
              <View key={i} style={styles.histItem}>
                <View style={styles.histRow}>
                  <Text style={[styles.histPlaca, { fontFamily: 'monospace' }]}>{h.placa}</Text>
                  {h.resultado === 'valido' ? (
                    <View style={styles.badgeOk}>
                      <Ionicons name="check" size={10} color={COLORS.success} />
                      <Text style={styles.badgeTexto}>Válido</Text>
                    </View>
                  ) : (
                    <View style={styles.badgeErr}>
                      <Ionicons name="close" size={10} color={COLORS.danger} />
                      <Text style={[styles.badgeTexto, { color: COLORS.danger }]}>Inválido</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.histDetalle}>{h.hace} · {h.detalle}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal de resultado o error */}
      <Modal visible={showModal} transparent={true} onRequestClose={() => setShowModal(false)}>
        <ModalContent>
          {modalError || !resultado ? (
            <View style={{ alignItems: 'center', gap: 16, paddingVertical: 20 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="close" size={40} color={COLORS.danger} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.danger, textAlign: 'center' }}>
                No existe el vehículo
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.gray, textAlign: 'center' }}>
                No se encontró ninguna coincidencia en la base de datos.
              </Text>
              <ModalActions>
                <ModalButton title="Cerrar" onPress={() => setShowModal(false)} />
              </ModalActions>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              <ModalHeader title="Información del Vehículo" onClose={() => setShowModal(false)} />
              <View style={{ alignItems: 'center', gap: 8, paddingVertical: 8 }}>
                <View style={[styles.vehicleIconLarge, { backgroundColor: colorHexDe(resultado.color) + '20' }]}>
                  <Ionicons name="car" size={40} color={colorHexDe(resultado.color)} />
                </View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text }}>{resultado.marca} {resultado.modelo}</Text>
                <Text style={{ fontSize: 14, color: COLORS.gray, fontFamily: 'monospace' }}>{resultado.placa}</Text>
                <View style={[styles.statusBadgeLarge, { backgroundColor: esValido ? '#d1fae5' : '#fee2e2' }]}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: esValido ? COLORS.success : COLORS.danger }}>
                    {esValido ? '✓ VIGENTE' : '✗ ' + resultado.estadoActivo}
                  </Text>
                </View>
              </View>
              <View style={{ gap: 10 }}>
                <View style={styles.infoRow}>
                  <Ionicons name="brush" size={16} color={COLORS.gray} />
                  <Text style={styles.infoLabel}>Color:</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.colorSwatchLarge, { backgroundColor: colorHexDe(resultado.color) }]} />
                    <Text style={styles.infoValue}>{resultado.color}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="person" size={16} color={COLORS.gray} />
                  <Text style={styles.infoLabel}>Propietario:</Text>
                  <Text style={styles.infoValue}>{resultado.nombrePropietario || '—'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={16} color={COLORS.gray} />
                  <Text style={styles.infoLabel}>Vence:</Text>
                  <Text style={styles.infoValue}>{resultado.fechaExpiracion}</Text>
                </View>
              </View>
              <ModalActions>
                <ModalButton title="Cerrar" onPress={() => setShowModal(false)} />
              </ModalActions>
            </View>
          )}
        </ModalContent>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { padding: 4 },
  headerTitulo: { fontSize: 18, fontWeight: '700', color: COLORS.text, flex: 1, textAlign: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: COLORS.gray, marginBottom: 12 },
  scanSection: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, borderWidth: 0.5, borderColor: COLORS.border },
  scanArea: { width: 180, height: 180, borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 12, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 14, alignSelf: 'center' },
  scanCorner: { position: 'absolute', width: 18, height: 18, borderColor: COLORS.primary },
  scanTapText: { fontSize: 11, color: COLORS.primary, marginTop: 8, fontWeight: '600' },
  scanHint: { fontSize: 11, color: COLORS.gray, textAlign: 'center', marginBottom: 12 },
  manualSection: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, borderWidth: 0.5, borderColor: COLORS.border },
  manualInput: { height: 44, borderWidth: 1, borderColor: '#d1c9b8', borderRadius: 8, paddingHorizontal: 12, fontSize: 14, backgroundColor: '#faf8f4', color: '#333', marginBottom: 12 },
  btnBuscar: { height: 44, borderRadius: 8, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  btnBuscarTexto: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  btnDisabled: { opacity: 0.6 },
  historialSection: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, borderWidth: 0.5, borderColor: COLORS.border },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  emptyHist: { padding: 16, textAlign: 'center', color: COLORS.gray, fontSize: 11 },
  histItem: { padding: 9, borderBottomWidth: 0.5, borderBottomColor: '#f0e8d8' },
  histRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  histPlaca: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  badgeOk: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, backgroundColor: '#EAF3DE' },
  badgeErr: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, backgroundColor: '#FCEBEB' },
  badgeTexto: { fontSize: 11, fontWeight: '500', color: COLORS.success },
  histDetalle: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  vehicleIconLarge: { width: 80, height: 80, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  statusBadgeLarge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#f0e8d8' },
  infoLabel: { fontSize: 13, color: COLORS.gray, width: 90 },
  infoValue: { fontSize: 14, fontWeight: '500', color: COLORS.text, flex: 1 },
  colorSwatchLarge: { width: 16, height: 16, borderRadius: 4, borderWidth: 0.5, borderColor: COLORS.border },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: COLORS.gray, textAlign: 'center', marginTop: 8 },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  scanFrame: { width: 220, height: 220, borderWidth: 2, borderColor: COLORS.primary, borderRadius: 12, backgroundColor: 'transparent' },
  cameraHint: { color: COLORS.white, fontSize: 14, marginTop: 20, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  cameraCloseBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', zIndex: 10 },
});