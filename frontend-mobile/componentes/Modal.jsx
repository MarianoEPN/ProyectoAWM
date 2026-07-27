/**
 * @fileoverview Sistema de Modal reutilizable basado en RNModal.
 * Exporta componentes atómicos: Modal, ModalContent, ModalHeader, ModalActions, ModalButton.
 * @module componentes/Modal
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Modal as RNModal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utilidades/config';

/**
 * Modal envolvente. Controla visibilidad y animación.
 * @param {Object} props
 * @param {boolean} props.visible - Controla si se muestra.
 * @param {string} [props.animationType='slide'] - Tipo de animación de RN.
 * @param {boolean} [props.transparent=true] - Fondo transparente.
 * @param {Function} [props.onRequestClose] - Callback al solicitar cierre.
 * @param {React.ReactNode} props.children - Contenido interno.
 * @param {Object} [props.style] - Estilos adicionales del wrapper.
 * @returns {JSX.Element|null}
 */
export default function Modal({
  visible,
  animationType = 'slide',
  transparent = true,
  onRequestClose,
  children,
  style,
}) {
  if (!visible) return null;

  return (
    <RNModal
      visible={visible}
      animationType={animationType}
      transparent={transparent}
      onRequestClose={onRequestClose}
    >
      <View style={[styles.modalOverlay, transparent && styles.modalOverlayTransparent]}>
        <View
          style={[styles.modalWrapper, style]}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {children}
        </View>
      </View>
    </RNModal>
  );
}

/**
 * Contenedor del contenido con KeyboardAvoidingView.
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {Object} [props.style]
 * @returns {JSX.Element}
 */
export function ModalContent({ children, style }) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.modalContent, style]}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

/**
 * Cabecera del modal con título y botón de cierre opcional.
 * @param {Object} props
 * @param {string} props.title - Título a mostrar.
 * @param {Function} [props.onClose] - Acción del botón X.
 * @param {Object} [props.style]
 * @returns {JSX.Element}
 */
export function ModalHeader({ title, onClose, style }) {
  return (
    <View style={[styles.modalHeader, style]}>
      <Text style={styles.modalHeaderTitle}>{title}</Text>
      {onClose && (
        <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
          <Ionicons name="close" size={24} color={COLORS.gray} />
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Fila de acciones del modal (botones).
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {Object} [props.style]
 * @returns {JSX.Element}
 */
export function ModalActions({ children, style }) {
  return (
    <View style={[styles.modalActions, style]}>
      {children}
    </View>
  );
}

/**
 * Botón individual para el modal.
 * @param {Object} props
 * @param {string} props.title - Texto del botón.
 * @param {Function} props.onPress - Handler de press.
 * @param {boolean} [props.disabled=false] - Si está deshabilitado.
 * @param {string} [props.variant='primary'] - 'primary' | 'danger'.
 * @param {Object} [props.style]
 * @param {Object} [props.textStyle]
 * @returns {JSX.Element}
 */
export function ModalButton({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
}) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  
  return (
    <TouchableOpacity
      style={[
        styles.modalBtn,
        isPrimary && styles.modalBtnPrimary,
        isDanger && styles.modalBtnDanger,
        disabled && styles.modalBtnDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[
        styles.modalBtnText,
        (isPrimary || isDanger) && styles.modalBtnTextWhite,
        textStyle,
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlayTransparent: {
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnPrimary: {
    backgroundColor: COLORS.primary,
  },
  modalBtnDanger: {
    backgroundColor: COLORS.danger,
  },
  modalBtnDisabled: {
    opacity: 0.6,
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  modalBtnTextWhite: {
    color: COLORS.white,
  },
});