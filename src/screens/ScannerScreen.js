import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Vibration, Alert, TextInput, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { loadContainers, findByPrecinto, findByContenedor } from '../utils/storage';
import { COLORS } from '../utils/theme';

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);
  const cameraRef = useRef(null);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    Vibration.vibrate(100);

    const containers = await loadContainers();
    let idx = findByPrecinto(containers, data);

    // Also try as contenedor number
    if (idx === -1) {
      idx = findByContenedor(containers, data);
    }

    if (idx !== -1) {
      navigation.navigate('Detail', {
        item: containers[idx],
        globalIndex: idx,
        fromScan: true,
      });
    } else {
      Alert.alert(
        '⚠️ No encontrado',
        `El código "${data}" no coincide con ningún precinto ni contenedor registrado.`,
        [
          { text: 'Escanear de nuevo', onPress: () => setScanned(false) },
          { text: 'Ingresar manualmente', onPress: () => { setScanned(false); setShowManual(true); } },
        ]
      );
    }
  };

  const handleManualSearch = async () => {
    if (!manualCode.trim()) return;
    const containers = await loadContainers();
    let idx = findByPrecinto(containers, manualCode.trim());
    if (idx === -1) idx = findByContenedor(containers, manualCode.trim());

    if (idx !== -1) {
      setShowManual(false);
      setManualCode('');
      navigation.navigate('Detail', {
        item: containers[idx],
        globalIndex: idx,
        fromScan: true,
      });
    } else {
      Alert.alert('No encontrado', `No se encontró ningún registro con el código "${manualCode}".`);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={60} color={COLORS.primary} />
        <Text style={styles.permText}>Se necesita acceso a la cámara</Text>
        <Text style={styles.permSub}>Para escanear códigos de barras de precintos</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Conceder Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: [
            'code128', 'code39', 'code93', 'ean13', 'ean8',
            'upc_a', 'upc_e', 'itf14', 'codabar', 'qr',
          ],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Escanear Precinto</Text>
          <TouchableOpacity style={styles.topBtn} onPress={() => setTorch(!torch)}>
            <Ionicons name={torch ? 'flash' : 'flash-outline'} size={24} color={torch ? '#ffd600' : '#fff'} />
          </TouchableOpacity>
        </View>

        {/* Scanner frame */}
        <View style={styles.frameArea}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.frameHint}>
            {scanned ? '✓ Código detectado...' : 'Apuntá al código de barras del precinto'}
          </Text>
        </View>

        {/* Bottom actions */}
        <View style={styles.bottomArea}>
          {scanned ? (
            <TouchableOpacity
              style={styles.scanAgainBtn}
              onPress={() => setScanned(false)}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.scanAgainText}>Escanear de nuevo</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.manualBtn}
              onPress={() => setShowManual(true)}
            >
              <Ionicons name="keypad-outline" size={20} color="#fff" />
              <Text style={styles.manualText}>Ingresar código manualmente</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Manual input modal */}
      <Modal visible={showManual} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBg}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ingresar código</Text>
              <TouchableOpacity onPress={() => setShowManual(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Ingresá el número de precinto o de contenedor
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: 3321786"
              placeholderTextColor={COLORS.textMuted}
              value={manualCode}
              onChangeText={setManualCode}
              keyboardType="default"
              autoFocus
              returnKeyType="search"
              onSubmitEditing={handleManualSearch}
            />
            <TouchableOpacity style={styles.modalBtn} onPress={handleManualSearch}>
              <Ionicons name="search" size={20} color="#fff" />
              <Text style={styles.modalBtnText}>Buscar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const CORNER_SIZE = 24;
const FRAME_SIZE = 260;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  permText: { fontSize: 20, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  permSub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
  permBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 12,
    borderRadius: 24, marginTop: 8,
  },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  topBtn: { padding: 8 },
  topTitle: { fontSize: 17, fontWeight: '600', color: '#fff' },
  frameArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE * 0.45,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#fff',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 },
  frameHint: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  bottomArea: {
    paddingBottom: 50,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingTop: 20,
  },
  scanAgainBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 12,
    borderRadius: 24,
  },
  scanAgainText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  manualBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 24, paddingVertical: 11, borderRadius: 24,
  },
  manualText: { color: 'rgba(255,255,255,0.9)', fontSize: 15 },
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, gap: 12,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalSub: { fontSize: 14, color: COLORS.textMuted },
  modalInput: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    paddingHorizontal: 14, height: 48, fontSize: 18, color: COLORS.text,
    fontWeight: '600',
  },
  modalBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, marginTop: 4,
  },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
