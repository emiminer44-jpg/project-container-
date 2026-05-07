import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, StatusBar, Modal, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loadContainers, updateContainer } from '../utils/storage';
import { COLORS, ESTADO_CONFIG, ESTADOS } from '../utils/theme';

const FIELD_CONFIG = [
  { key: 'contenedor', label: 'N° Contenedor', icon: 'cube-outline', editable: false },
  { key: 'estado', label: 'Estado', icon: 'flag-outline', editable: true, type: 'select' },
  { key: 'precinto', label: 'N° Precinto', icon: 'barcode-outline', editable: true },
  { key: 'ubicacion', label: 'Ubicación', icon: 'location-outline', editable: true },
  { key: 'producto', label: 'Producto', icon: 'cube', editable: true },
  { key: 'inspeccion', label: 'Inspección', icon: 'calendar-outline', editable: true },
  { key: 'areas', label: 'Área', icon: 'map-outline', editable: true },
  { key: 'cantidad', label: 'Cantidad', icon: 'layers-outline', editable: true },
];

export default function DetailScreen({ route, navigation }) {
  const { item: initialItem, globalIndex, fromScan } = route.params;
  const [item, setItem] = useState(initialItem);
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [showEstadoPicker, setShowEstadoPicker] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const estadoConf = ESTADO_CONFIG[item.estado] || { color: COLORS.textMuted, bg: '#f5f5f5', icon: 'help-circle' };

  const startEdit = (fieldKey, currentValue) => {
    if (FIELD_CONFIG.find(f => f.key === fieldKey)?.type === 'select') {
      setShowEstadoPicker(true);
      return;
    }
    setEditingKey(fieldKey);
    setEditValue(currentValue || '');
  };

  const confirmEdit = async () => {
    if (editingKey === null) return;
    const newItem = { ...item, [editingKey]: editValue };
    setItem(newItem);
    setEditingKey(null);
    setHasChanges(true);
  };

  const selectEstado = (estado) => {
    const newItem = { ...item, estado };
    setItem(newItem);
    setShowEstadoPicker(false);
    setHasChanges(true);
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const allData = await loadContainers();
      await updateContainer(allData, globalIndex, item);
      setSaving(false);
      setHasChanges(false);
      Alert.alert('✅ Guardado', 'Los cambios fueron guardados correctamente.', [
        { text: 'OK', onPress: () => { if (fromScan) navigation.goBack(); } },
      ]);
    } catch (e) {
      setSaving(false);
      Alert.alert('Error', 'No se pudieron guardar los cambios.');
    }
  };

  const discardChanges = () => {
    Alert.alert('Descartar cambios', '¿Estás seguro que querés descartar los cambios?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => {
        setItem(initialItem);
        setHasChanges(false);
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>CONTENEDOR</Text>
          <Text style={styles.headerNumber}>{item.contenedor}</Text>
        </View>
        <View style={[styles.estadoBadge, { backgroundColor: estadoConf.bg }]}>
          <Ionicons name={estadoConf.icon} size={14} color={estadoConf.color} />
          <Text style={[styles.estadoText, { color: estadoConf.color }]}>{item.estado || '—'}</Text>
        </View>
      </View>

      {fromScan && (
        <View style={styles.scanBanner}>
          <Ionicons name="barcode" size={16} color={COLORS.primary} />
          <Text style={styles.scanBannerText}>Encontrado por código escaneado</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* All fields */}
          {FIELD_CONFIG.map((field) => {
            const value = item[field.key];
            const isEditing = editingKey === field.key;

            return (
              <View key={field.key} style={styles.fieldCard}>
                <View style={styles.fieldHeader}>
                  <View style={styles.fieldLabelWrap}>
                    <View style={styles.fieldIconWrap}>
                      <Ionicons name={field.icon} size={16} color={COLORS.primaryLight} />
                    </View>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                  </View>
                  {field.editable && !isEditing && (
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => startEdit(field.key, value)}
                    >
                      <Ionicons name="pencil" size={15} color={COLORS.primary} />
                      <Text style={styles.editBtnText}>Editar</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {isEditing ? (
                  <View style={styles.editRow}>
                    <TextInput
                      style={styles.editInput}
                      value={editValue}
                      onChangeText={setEditValue}
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={confirmEdit}
                      placeholder={`Ingresá ${field.label.toLowerCase()}`}
                    />
                    <TouchableOpacity style={styles.confirmBtn} onPress={confirmEdit}>
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelEditBtn}
                      onPress={() => setEditingKey(null)}
                    >
                      <Ionicons name="close" size={20} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={[styles.fieldValue, !value && styles.fieldEmpty]}>
                    {value || 'Sin datos'}
                  </Text>
                )}
              </View>
            );
          })}

          {/* Save / Discard */}
          {hasChanges && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.discardBtn} onPress={discardChanges}>
                <Ionicons name="refresh" size={18} color={COLORS.error} />
                <Text style={styles.discardText}>Descartar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={saveChanges}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={18} color="#fff" />
                    <Text style={styles.saveText}>Guardar cambios</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Estado picker modal */}
      <Modal visible={showEstadoPicker} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Estado</Text>
              <TouchableOpacity onPress={() => setShowEstadoPicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            {ESTADOS.map((e) => {
              const conf = ESTADO_CONFIG[e] || {};
              return (
                <TouchableOpacity
                  key={e}
                  style={[styles.estadoOption, item.estado === e && styles.estadoOptionActive]}
                  onPress={() => selectEstado(e)}
                >
                  <View style={[styles.estadoIcon, { backgroundColor: conf.bg }]}>
                    <Ionicons name={conf.icon} size={20} color={conf.color} />
                  </View>
                  <Text style={[styles.estadoOptionText, item.estado === e && { color: COLORS.primary, fontWeight: '700' }]}>
                    {e}
                  </Text>
                  {item.estado === e && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} style={{ marginLeft: 'auto' }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  backBtn: { padding: 4, marginBottom: 2 },
  headerCenter: { flex: 1 },
  headerLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5, fontWeight: '600' },
  headerNumber: { fontSize: 24, fontWeight: '700', color: '#fff' },
  estadoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  estadoText: { fontSize: 12, fontWeight: '700' },
  scanBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#e8eaf6', paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#c5cae9',
  },
  scanBannerText: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },
  content: { padding: 16, gap: 10 },
  fieldCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  fieldHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fieldIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#e8eaf6', alignItems: 'center', justifyContent: 'center',
  },
  fieldLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', letterSpacing: 0.5 },
  fieldValue: { fontSize: 18, fontWeight: '600', color: COLORS.text, paddingLeft: 36 },
  fieldEmpty: { color: COLORS.textMuted, fontStyle: 'italic', fontWeight: '400', fontSize: 15 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#e8eaf6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  editBtnText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  editInput: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 10,
    paddingHorizontal: 12, height: 42, fontSize: 16, color: COLORS.text,
  },
  confirmBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center',
  },
  cancelEditBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.errorLight, alignItems: 'center', justifyContent: 'center',
  },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  discardBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: COLORS.error, paddingVertical: 14, borderRadius: 12,
  },
  discardText: { color: COLORS.error, fontWeight: '700', fontSize: 15 },
  saveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12,
  },
  saveBtnDisabled: { backgroundColor: COLORS.textMuted },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 44, gap: 8,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  estadoOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 8,
    borderRadius: 12, borderWidth: 1.5, borderColor: 'transparent',
  },
  estadoOptionActive: { borderColor: COLORS.primary, backgroundColor: '#e8eaf6' },
  estadoIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  estadoOptionText: { fontSize: 16, fontWeight: '500', color: COLORS.text },
});
