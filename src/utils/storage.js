import AsyncStorage from '@react-native-async-storage/async-storage';
import initialData from '../data/containers.json';

const STORAGE_KEY = 'contenedores_data_v1';

export const loadContainers = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // First time: load from bundled JSON and persist
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  } catch (e) {
    console.error('Error loading containers:', e);
    return initialData;
  }
};

export const saveContainers = async (data) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Error saving containers:', e);
    return false;
  }
};

export const updateContainer = async (allData, index, updatedItem) => {
  const newData = [...allData];
  newData[index] = updatedItem;
  await saveContainers(newData);
  return newData;
};

export const resetToOriginal = async () => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  return initialData;
};

export const findByPrecinto = (data, precinto) => {
  const search = precinto.toString().trim();
  return data.findIndex(
    (c) => c.precinto && c.precinto.toString().trim() === search
  );
};

export const findByContenedor = (data, contenedor) => {
  const search = contenedor.toString().trim();
  return data.findIndex(
    (c) => c.contenedor && c.contenedor.toString().trim() === search
  );
};
