export const COLORS = {
  primary: '#1a237e',
  primaryLight: '#3949ab',
  primaryDark: '#0d1757',
  accent: '#ff6f00',
  accentLight: '#ffa040',
  background: '#f0f2f5',
  surface: '#ffffff',
  text: '#1a1a2e',
  textLight: '#5c6bc0',
  textMuted: '#9e9e9e',
  success: '#2e7d32',
  successLight: '#e8f5e9',
  warning: '#f57f17',
  warningLight: '#fff8e1',
  error: '#c62828',
  errorLight: '#ffebee',
  info: '#0277bd',
  infoLight: '#e1f5fe',
  border: '#e0e0e0',
  shadow: 'rgba(26, 35, 126, 0.12)',
};

export const ESTADO_CONFIG = {
  'LLENO': { color: COLORS.success, bg: COLORS.successLight, icon: 'checkmark-circle' },
  'VACÍO': { color: COLORS.textMuted, bg: '#f5f5f5', icon: 'radio-button-off' },
  'ABIERTO': { color: COLORS.warning, bg: COLORS.warningLight, icon: 'lock-open' },
  'RIOESTIBA': { color: COLORS.info, bg: COLORS.infoLight, icon: 'boat' },
};

export const ESTADOS = ['LLENO', 'VACÍO', 'ABIERTO', 'RIOESTIBA'];
