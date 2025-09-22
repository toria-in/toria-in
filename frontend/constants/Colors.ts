// Modern, bright and attractive color palette for Toria
export const Colors = {
  // Primary brand colors - bright and vibrant
  primary: '#FF4081', // Bright pink/coral - energetic and travel-friendly
  primaryLight: '#FF79B0',
  primaryDark: '#F50057',
  
  // Secondary colors
  secondary: '#00BCD4', // Cyan blue - represents adventure and sky
  secondaryLight: '#4DD0E1',
  secondaryDark: '#0097A7',
  
  // Accent colors
  accent: '#FFC107', // Amber - warm and inviting like sunshine
  accentLight: '#FFD54F',
  accentDark: '#FFA000',
  
  // Success and actions
  success: '#4CAF50',
  successLight: '#81C784',
  warning: '#FF9800',
  error: '#F44336',
  
  // Background colors - modern gradient approach
  backgroundPrimary: '#0A0A0B', // Deep black with slight warmth
  backgroundSecondary: '#1A1A1B', // Slightly lighter
  backgroundTertiary: '#2D2D30', // Card background
  backgroundAccent: '#3A3A3D', // Interactive elements
  
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#E0E0E0',
  textMuted: '#A0A0A0',
  textDisabled: '#6A6A6A',
  
  // Interactive states
  interactive: '#FF4081',
  interactivePressed: '#F50057',
  interactiveDisabled: '#FF408180',
  
  // Food and place specific
  food: '#FF6D00', // Vibrant orange for food
  place: '#00E676', // Bright green for places
  both: '#E91E63', // Magenta for combined experiences
  
  // Going with theme colors - bright and distinct
  partner: '#E91E63', // Romantic magenta
  family: '#FF9800', // Warm orange
  friends: '#00BCD4', // Fun cyan
  business: '#795548', // Professional brown
  solo: '#9C27B0', // Independent purple
  
  // Status colors
  current: '#4CAF50',
  upcoming: '#FF9800',
  past: '#9E9E9E',
  
  // Transparent overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  modalBackdrop: 'rgba(0, 0, 0, 0.6)',
  
  // Border and divider colors
  border: '#3A3A3D',
  borderLight: '#4A4A4D',
  divider: '#2A2A2D',
};

// Gradient combinations for modern look
export const Gradients = {
  primary: ['#FF4081', '#F50057'],
  secondary: ['#00BCD4', '#0097A7'],
  accent: ['#FFC107', '#FFA000'],
  background: ['#0A0A0B', '#1A1A1B'],
  sunset: ['#FF6D00', '#FF4081'],
  ocean: ['#00BCD4', '#00E676'],
  night: ['#0A0A0B', '#2D2D30'],
};

// Typography scale
export const Typography = {
  // Headers
  h1: { fontSize: 32, fontWeight: '800' as const, lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  h4: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  
  // Body text
  body1: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  body2: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  
  // UI elements
  button: { fontSize: 16, fontWeight: '600' as const },
  caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  overline: { fontSize: 10, fontWeight: '600' as const, lineHeight: 14, letterSpacing: 1 },
};

// Spacing system - 8pt grid
export const Spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radius system
export const BorderRadius = {
  s: 4,
  m: 8,
  l: 12,
  xl: 16,
  xxl: 24,
  round: 100,
};

// Shadow presets for depth
export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export default Colors;