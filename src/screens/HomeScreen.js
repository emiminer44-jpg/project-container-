import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, StyleSheet,
  TouchableOpacity, StatusBar, ActivityIndicator,
  RefreshControl, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';

import ContainerCard from '../components/ContainerCard';
import AuthModal from '../components/AuthModal';
import { loadContainers, saveContainers } from '../utils/storage';
import { COLORS, ESTADOS } from '../utils/theme';

export default function HomeScreen({ navigation, route }) {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('TODOS');
  const [authVisible, setAuthVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'import' | 'export'

  const fetchData = async () => {
    const containers = await loadContainers();
    setData(containers);
    applyFilters(containers, search, activeFilter);
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  // Handle filter from Stats screen
  useEffect(() => {
    if (route.params?.filterEstado) {
      setActiveFilter(route.params.filterEstado);
    }
  }, [route.params?.filterEstado]);

  const applyFilters = (source, searchText, estadoFilter) => {
    let result = source;
    if (estadoFilter !== 'TODOS') {
      result = result.filter((c) => c.estado === estadoFilter);
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter(
        (c) =>
          (c.contenedor && c.contenedor.toLowerCase().includes(q)) ||
          (c.precinto && c.precinto.toLowerCase().includes(q)) ||
          (c.producto && c.producto.toLowerCase().includes(q)) ||
          (c.ubicacion && c.ubicacion.toLowerCase().includes(q)) ||
          (c.areas && c.areas.toLowerCase().includes(q))
      );
    }
    // Sort: ABIERTO first, then by cantidad ascending (show those with less quantity first)
    result = [...result].sort((a, b) => {
      const aAbierto = a.estado === 'ABIERTO' ? 0 : 1;
      const bAbierto = b.estado === 'ABIERTO' ? 0 : 1;
      if (aAbierto !== bAbierto) return aAbierto - bAbierto;
      const aCant = parseFloat(a.cantidad) || Infinity;
      const bCant = parseFloat(b.cantidad) || Infinity;
      return aCant - bCant;
    });
    setFiltered(result);
  };

  useEffect(() => {
    applyFilters(data, search, activeFilter);
  }, [search, activeFilter, data]);

  const countByEstado = (estado) =>
    estado === 'TODOS' ? data.length : data.filter((c) => c.estado === estado).length;

  // ── Auth gate ──────────────────────────────────────────────────────────────
  const requestAction = (action) => {
    setPendingAction(action);
    setAuthVisible(true);
  };

  const handleAuthSuccess = () => {
    setAuthVisible(false);
    if (pendingAction === 'import') doImport();
    else if (pendingAction === 'export') doExport();
    setPendingAction(null);
  };

  // ── Import XLSX ────────────────────────────────────────────────────────────
  const doImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
               'application/vnd.ms-excel', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const workbook = XLSX.read(base64, { type: 'base64' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (!rows.length) {
        Alert.alert('Archivo vacío', 'El archivo no contiene datos.');
        return;
      }

      // Normalize keys to lowercase spanish field names
      const normalized = rows.map((row) => {
        const r = {};
        Object.keys(row).forEach((k) => {
          const kl = k.toLowerCase().trim();
          r[kl] = row[k];
        });
        return {
          contenedor: String(r['contenedor'] || r['n° contenedor'] || r['numero contenedor'] || '').trim(),
          estado:     String(r['estado'] || '').trim().toUpperCase(),
          precinto:   String(r['precinto'] || r['n° precinto'] || '').trim(),
          ubicacion:  String(r['ubicacion'] || r['ubicación'] || '').trim(),
          producto:   String(r['producto'] || '').trim(),
          inspeccion: String(r['inspeccion'] || r['inspección'] || '').trim(),
          areas:      String(r['areas'] || r['área'] || r['area'] || '').trim(),
          cantidad:   String(r['cantidad'] || '').trim(),
        };
      });

      Alert.alert(
        'Confirmar importación',
        `Se cargarán ${normalized.length} contenedores. ¿Reemplazar datos actuales?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Importar',
            style: 'destructive',
            onPress: async () => {
              await saveContainers(normalized);
              await fetchData();
              Alert.alert('✅ Importado', `${normalized.length} contenedores cargados correctamente.`);
            },
          },
        ]
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo leer el archivo. Asegurate de seleccionar un archivo .xlsx válido.');
    }
  };

  // ── Export XLSX ────────────────────────────────────────────────────────────
  const doExport = async () => {
    try {
      const exportData = data.map((c) => ({
        'N° Contenedor': c.contenedor || '',
        'Estado':        c.estado || '',
        'N° Precinto':   c.precinto || '',
        'Ubicación':     c.ubicacion || '',
        'Producto':      c.producto || '',
        'Inspección':    c.inspeccion || '',
        'Área':          c.areas || '',
        'Cantidad':      c.cantidad || '',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);

      // ── Column widths ──────────────────────────────────────────────────
      ws['!cols'] = [
        { wch: 20 }, // N° Contenedor
        { wch: 14 }, // Estado
        { wch: 18 }, // N° Precinto
        { wch: 16 }, // Ubicación
        { wch: 24 }, // Producto
        { wch: 16 }, // Inspección
        { wch: 14 }, // Área
        { wch: 12 }, // Cantidad
      ];

      // ── Header style ───────────────────────────────────────────────────
      const headerStyle = {
        font:      { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
        fill:      { fgColor: { rgb: '1A237E' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top:    { style: 'thin', color: { rgb: 'FFFFFF' } },
          bottom: { style: 'thin', color: { rgb: 'FFFFFF' } },
          left:   { style: 'thin', color: { rgb: 'FFFFFF' } },
          right:  { style: 'thin', color: { rgb: 'FFFFFF' } },
        },
      };

      // ── Estado color map ───────────────────────────────────────────────
      const estadoFill = {
        'LLENO':     'E8F5E9', // green light
        'VACÍO':     'F5F5F5', // grey
        'ABIERTO':   'FFF8E1', // amber light
        'RIOESTIBA': 'E1F5FE', // blue light
      };
      const estadoFont = {
        'LLENO':     '2E7D32',
        'VACÍO':     '757575',
        'ABIERTO':   'F57F17',
        'RIOESTIBA': '0277BD',
      };

      const headers = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const range = XLSX.utils.decode_range(ws['!ref']);

      // Apply header styles (row 0)
      headers.forEach((col) => {
        const cellRef = `${col}1`;
        if (ws[cellRef]) {
          ws[cellRef].s = headerStyle;
        }
      });

      // Apply row styles based on Estado (column B = index 1)
      for (let R = 1; R <= range.e.r; R++) {
        const estadoCell = ws[`B${R + 1}`];
        const estadoVal  = estadoCell ? String(estadoCell.v).trim().toUpperCase() : '';
        const fillColor  = estadoFill[estadoVal] || 'FFFFFF';
        const fontColor  = estadoFont[estadoVal]  || '1A1A2E';

        // Cantidad warning: if ABIERTO and cantidad is low highlight red
        const cantCell = ws[`H${R + 1}`];
        const cantVal  = cantCell ? parseFloat(cantCell.v) : NaN;
        const isLow    = estadoVal === 'ABIERTO' && !isNaN(cantVal) && cantVal < 10;

        headers.forEach((col, ci) => {
          const cellRef = `${col}${R + 1}`;
          if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
          ws[cellRef].s = {
            font:      { color: { rgb: isLow && col === 'H' ? 'C62828' : fontColor }, sz: 11 },
            fill:      { fgColor: { rgb: isLow ? 'FFEBEE' : fillColor } },
            alignment: { vertical: 'center', wrapText: false },
            border: {
              top:    { style: 'thin', color: { rgb: 'E0E0E0' } },
              bottom: { style: 'thin', color: { rgb: 'E0E0E0' } },
              left:   { style: 'thin', color: { rgb: 'E0E0E0' } },
              right:  { style: 'thin', color: { rgb: 'E0E0E0' } },
            },
          };
        });
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Contenedores');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64', cellStyles: true });

      const date  = new Date();
      const stamp = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
      const fname = `Contenedores_${stamp}.xlsx`;
      const path  = FileSystem.documentDirectory + fname;

      await FileSystem.writeAsStringAsync(path, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Exportar contenedores',
          UTI: 'com.microsoft.excel.xlsx',
        });
      } else {
        Alert.alert('✅ Archivo guardado', `Guardado en: ${path}`);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo exportar el archivo.');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando contenedores...</Text>
      </View>
    );
  }

  // Count ABIERTO with low quantity
  const lowQtyAbiertos = data.filter(
    (c) => c.estado === 'ABIERTO' && parseFloat(c.cantidad) < 10 && c.cantidad !== ''
  ).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../../assets/logoREI1.png')} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.headerSub}>{data.length} registros totales</Text>
        </View>
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => navigation.navigate('Scanner')}
        >
          <Ionicons name="barcode-outline" size={22} color="#fff" />
          <Text style={styles.scanBtnText}>Escanear</Text>
        </TouchableOpacity>
      </View>

      {/* Import / Export buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#1565C0' }]} onPress={() => requestAction('import')}>
          <Ionicons name="cloud-upload-outline" size={17} color="#fff" />
          <Text style={styles.actionBtnText}>Actualizar XLSX</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2E7D32' }]} onPress={() => requestAction('export')}>
          <Ionicons name="download-outline" size={17} color="#fff" />
          <Text style={styles.actionBtnText}>Exportar XLSX</Text>
        </TouchableOpacity>
      </View>

      {/* Low quantity alert banner */}
      {lowQtyAbiertos > 0 && (
        <View style={styles.alertBanner}>
          <Ionicons name="warning-outline" size={16} color="#F57F17" />
          <Text style={styles.alertText}>
            {lowQtyAbiertos} contenedor{lowQtyAbiertos > 1 ? 'es' : ''} abierto{lowQtyAbiertos > 1 ? 's' : ''} con poca cantidad — usar primero
          </Text>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por contenedor, precinto, producto..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        {['TODOS', ...ESTADOS].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f === 'TODOS' ? 'Todos' : f}
              <Text style={styles.filterCount}> {countByEstado(f)}</Text>
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {(search || activeFilter !== 'TODOS') && (
        <Text style={styles.resultsCount}>
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </Text>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => (
          <ContainerCard
            item={item}
            index={index}
            onPress={() =>
              navigation.navigate('Detail', {
                item,
                globalIndex: data.indexOf(item),
              })
            }
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(); }}
            colors={[COLORS.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>No se encontraron contenedores</Text>
          </View>
        }
      />

      {/* Auth Modal */}
      <AuthModal
        visible={authVisible}
        onClose={() => { setAuthVisible(false); setPendingAction(null); }}
        onSuccess={handleAuthSuccess}
        title={pendingAction === 'import' ? 'Actualizar datos' : 'Exportar datos'}
        description={
          pendingAction === 'import'
            ? 'Ingresá tus credenciales para cargar un nuevo archivo XLSX.'
            : 'Ingresá tus credenciales para exportar los datos actuales.'
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading:   { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: COLORS.primary, fontSize: 16 },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerLeft: { flex: 1 },
  headerLogo: { width: 180, height: 44 },
  headerSub:  { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  scanBtn: {
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 22,
    gap: 6,
    elevation: 5,
  },
  scanBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: '#f5f7fa',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE082',
  },
  alertText: { fontSize: 13, color: '#E65100', fontWeight: '500', flex: 1 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  searchIcon:  { marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: COLORS.text },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 6,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText:       { fontSize: 12, color: COLORS.text, fontWeight: '500' },
  filterTextActive: { color: '#fff', fontWeight: '700' },
  filterCount:      { fontSize: 11, opacity: 0.7 },
  resultsCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  listContent: { paddingTop: 4, paddingBottom: 30 },
  empty:       { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText:   { color: COLORS.textMuted, fontSize: 16 },
});
