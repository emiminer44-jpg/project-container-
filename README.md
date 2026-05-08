# 📦 Contenedores 2026 — App Móvil

App para gestión de contenedores: escaneo de precintos, visualización y edición de parámetros.

---

## 🚀 Cómo usar la app

### Opción 1 — Probar AHORA en tu celular (sin instalar nada)
1. Instalá **Expo Go** en tu iPhone o Android
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
2. En tu computadora, abrí una terminal y ejecutá:
   ```bash
   npm install
   npx expo start
   ```
3. Escaneá el QR con la app Expo Go

---

## 📱 Generar ejecutable (.apk para Android / .ipa para iOS)

### Requisitos
- Node.js 18+
- Cuenta gratuita en https://expo.dev (para EAS Build)

### Instalar herramientas
```bash
npm install -g eas-cli
eas login
```

### Instalar dependencias
```bash
npm install
```

### ▶ Android APK (gratis, sin Apple Developer Account)
```bash
eas build --platform android --profile preview
```
→ Te genera un **archivo .APK** para instalar en cualquier Android.

### ▶ Android Play Store (.aab)
```bash
eas build --platform android --profile production
```

### ▶ iOS (.ipa) — Requiere cuenta Apple Developer ($99/año)
```bash
eas build --platform ios --profile preview
```

---

## 📲 Funciones de la app

| Función | Descripción |
|---------|-------------|
| 📋 Lista completa | Ver todos los 284 contenedores |
| 🔍 Búsqueda | Por contenedor, precinto, producto, ubicación |
| 🔖 Filtros | Por estado: LLENO / VACÍO / ABIERTO / RIOESTIBA |
| 📷 Escáner | Escanear código de barras del precinto → ver contenedor |
| ✏️ Editar | Modificar: estado, precinto, ubicación, producto, inspección, área |
| 💾 Guardar | Los cambios se guardan localmente en el dispositivo |
| 📊 Estadísticas | Dashboard con totales por estado, ubicación y producto |

---

## 🗂 Datos incluidos

- **284 contenedores** del archivo `CONTENEDORES_2026.xlsm`
- Columnas: N° Contenedor, Estado, N° Precinto, Ubicación, Producto, Inspección, Áreas
- Los datos se almacenan localmente en el dispositivo (AsyncStorage)

---

## 📁 Estructura del proyecto

```
ContainerApp/
├── App.js                    # Navegación principal
├── app.json                  # Configuración Expo
├── eas.json                  # Configuración de builds
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js     # Lista + búsqueda
│   │   ├── ScannerScreen.js  # Escáner de código de barras
│   │   ├── DetailScreen.js   # Detalle + edición
│   │   └── StatsScreen.js    # Estadísticas
│   ├── components/
│   │   └── ContainerCard.js  # Tarjeta de contenedor
│   ├── utils/
│   │   ├── storage.js        # Persistencia AsyncStorage
│   │   └── theme.js          # Colores y constantes
│   └── data/
│       └── containers.json   # Datos de los contenedores
```
