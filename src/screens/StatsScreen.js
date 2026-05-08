import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { loadContainers } from '../utils/storage';
import { COLORS, ESTADO_CONFIG } from '../utils/theme';

export default function StatsScreen({ navigation }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadContainers().then((d) => { setData(d); setLoading(false); });
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const total = data.length;
  const byEstado = {};
  const byUbicacion = {};
  const byProducto = {};

  data.forEach((c) => {
    if (c.estado) byEstado[c.estado] = (byEstado[c.estado] || 0) + 1;
    if (c.ubicacion) byUbicacion[c.ubicacion] = (byUbicacion[c.ubicacion] || 0) + 1;
    if (c.producto) byProducto[c.producto] = (byProducto[c.producto] || 0) + 1;
  });

  const topProductos = Object.entries(byProducto)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const topUbicaciones = Object.entries(byUbicacion)
    .sort((a, b) => b[1] - a[1]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Estadísticas</Text>
        <Text style={styles.headerSub}>Resumen del inventario</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Total */}
        <View style={styles.totalCard}>
          <View style={styles.totalIcon}>
            <Ionicons name="cube" size={28} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.totalNumber}>{total}</Text>
            <Text style={styles.totalLabel}>Contenedores registrados</Text>
          </View>
        </View>

        {/* By Estado */}
        <Text style={styles.sectionTitle}>Por Estado</Text>
        <View style={styles.estadoGrid}>
          {Object.entries(byEstado).map(([estado, count]) => {
            const conf = ESTADO_CONFIG[estado] || { color: COLORS.textMuted, bg: '#f5f5f5', icon: 'help-circle' };
            return (
              <TouchableOpacity
                key={estado}
                style={[styles.estadoCard, { borderTopColor: conf.color }]}
                onPress={() => navigation.navigate('Home', { filterEstado: estado })}
              >
                <View style={[styles.estadoIconWrap, { backgroundColor: conf.bg }]}>
                  <Ionicons name={conf.icon} size={20} color={conf.color} />
                </View>
                <Text style={[styles.estadoCount, { color: conf.color }]}>{count}</Text>
                <Text style={styles.estadoLabel}>{estado}</Text>
                <Text style={styles.estadoPct}>{((count / total) * 100).toFixed(1)}%</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* By Ubicacion */}
        <Text style={styles.sectionTitle}>Por Ubicación</Text>
        <View style={styles.listCard}>
          {topUbicaciones.map(([ub, count], i) => (
            <View key={ub} style={[styles.listRow, i > 0 && styles.listRowBorder]}>
              <View style={styles.listLeft}>
                <Ionicons name="location" size={16} color={COLORS.primary} />
                <Text style={styles.listLabel}>{ub}</Text>
              </View>
              <View style={styles.listRight}>
                <View style={[styles.bar, { width: `${(count / total) * 100 * 0.6}%` }]} />
                <Text style={styles.listCount}>{count}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Top Productos */}
        <Text style={styles.sectionTitle}>Top Productos</Text>
        <View style={styles.listCard}>
          {topProductos.map(([prod, count], i) => (
            <View key={prod} style={[styles.listRow, i > 0 && styles.listRowBorder]}>
              <View style={[styles.listLeft, { flex: 1 }]}>
                <Text style={styles.rankNum}>{i + 1}</Text>
                <Text style={styles.listLabel} numberOfLines={1}>{prod}</Text>
              </View>
              <Text style={styles.listCount}>{count}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: COLORS.primary, paddingTop: 54, paddingBottom: 20, paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  content: { padding: 16, gap: 12 },
  totalCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 3,
  },
  totalIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#e8eaf6', alignItems: 'center', justifyContent: 'center',
  },
  totalNumber: { fontSize: 36, fontWeight: '800', color: COLORS.primary },
  totalLabel: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1, marginTop: 4 },
  estadoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  estadoCard: {
    flex: 1, minWidth: '44%', backgroundColor: COLORS.surface, borderRadius: 14,
    padding: 14, borderTopWidth: 3, alignItems: 'center', gap: 4,
    shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  estadoIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  estadoCount: { fontSize: 28, fontWeight: '800' },
  estadoLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.5 },
  estadoPct: { fontSize: 11, color: COLORS.textMuted },
  listCard: {
    backgroundColor: COLORS.surface, borderRadius: 14,
    shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1, shadowRadius: 4, elevation: 2, overflow: 'hidden',
  },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  listRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  listLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  listLabel: { fontSize: 14, color: COLORS.text, fontWeight: '500', flex: 1 },
  listRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bar: { height: 6, backgroundColor: COLORS.primaryLight, borderRadius: 3, minWidth: 4 },
  listCount: { fontSize: 16, fontWeight: '700', color: COLORS.primary, minWidth: 32, textAlign: 'right' },
  rankNum: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#e8eaf6',
    textAlign: 'center', lineHeight: 22, fontSize: 11, fontWeight: '700',
    color: COLORS.primary,
  },
});
