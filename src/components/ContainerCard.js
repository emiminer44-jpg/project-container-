import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, ESTADO_CONFIG } from '../utils/theme';

export default function ContainerCard({ item, onPress, index }) {
  const estadoConf = ESTADO_CONFIG[item.estado] || {
    color: COLORS.textMuted,
    bg: '#f5f5f5',
    icon: 'help-circle',
  };

  const cantidad   = parseFloat(item.cantidad);
  const hasCant    = item.cantidad !== undefined && item.cantidad !== '';
  const isLowStock = item.estado === 'ABIERTO' && hasCant && cantidad < 10;
  const borderColor = isLowStock ? COLORS.warning : COLORS.primary;

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: borderColor }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={styles.containerIdWrap}>
          <Ionicons name="cube-outline" size={14} color={COLORS.primaryLight} />
          <Text style={styles.containerLabel}>CONTENEDOR</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {isLowStock && (
            <View style={styles.lowBadge}>
              <Ionicons name="warning-outline" size={11} color="#E65100" />
              <Text style={styles.lowText}>POCA CANT.</Text>
            </View>
          )}
          <View style={[styles.estadoBadge, { backgroundColor: estadoConf.bg }]}>
            <Ionicons name={estadoConf.icon} size={12} color={estadoConf.color} />
            <Text style={[styles.estadoText, { color: estadoConf.color }]}>
              {item.estado || '—'}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.containerId}>{item.contenedor || '—'}</Text>

      <View style={styles.row}>
        <View style={styles.field}>
          <Ionicons name="barcode-outline" size={13} color={COLORS.textMuted} />
          <Text style={styles.fieldLabel}> Precinto</Text>
          <Text style={styles.fieldValue}>{item.precinto || '—'}</Text>
        </View>
        <View style={styles.field}>
          <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
          <Text style={styles.fieldLabel}> Ubicación</Text>
          <Text style={styles.fieldValue}>{item.ubicacion || '—'}</Text>
        </View>
      </View>

      {/* Cantidad row */}
      {hasCant && (
        <View style={[styles.cantRow, isLowStock && styles.cantRowLow]}>
          <Ionicons
            name="layers-outline"
            size={14}
            color={isLowStock ? '#E65100' : COLORS.primaryLight}
          />
          <Text style={[styles.cantLabel, isLowStock && { color: '#E65100' }]}>
            Cantidad:
          </Text>
          <Text style={[styles.cantValue, isLowStock && { color: '#C62828' }]}>
            {item.cantidad}
          </Text>
          {isLowStock && (
            <Text style={styles.useFirst}> — Usar primero</Text>
          )}
        </View>
      )}

      {item.producto ? (
        <View style={styles.productoRow}>
          <Ionicons name="cube" size={13} color={COLORS.primaryLight} />
          <Text style={styles.producto} numberOfLines={1}>{item.producto}</Text>
        </View>
      ) : null}

      {item.areas ? (
        <View style={styles.areaTag}>
          <Text style={styles.areaText}>Área: {item.areas}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  containerIdWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  containerLabel: {
    fontSize: 10,
    color: COLORS.primaryLight,
    fontWeight: '600',
    letterSpacing: 1,
  },
  containerId: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  estadoText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  lowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFB300',
  },
  lowText: { fontSize: 9, fontWeight: '800', color: '#E65100', letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: 16, marginBottom: 6 },
  field: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  fieldLabel: { fontSize: 11, color: COLORS.textMuted, marginRight: 4 },
  fieldValue: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  cantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EDE7F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  cantRowLow: { backgroundColor: '#FFEBEE' },
  cantLabel: { fontSize: 12, color: COLORS.primaryLight, fontWeight: '600' },
  cantValue: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  useFirst: { fontSize: 11, color: '#C62828', fontWeight: '600' },
  productoRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  producto: {
    fontSize: 13,
    color: COLORS.primaryLight,
    fontWeight: '500',
    flex: 1,
  },
  areaTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#ede7f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 6,
  },
  areaText: { fontSize: 11, color: '#5e35b1', fontWeight: '600' },
});
