// Official Toria brand colors and modern design system
export const Colors = {
  // Primary Toria brand colors - matching logo
  primary: '#27B3B0', // Eastern Blue (official Toria primary)
  primaryLight: '#43E6F7', // Light Blue (official Toria secondary)
  primaryDark: '#1A8B89',
  
  // Secondary colors - complementary to Toria brand
  secondary: '#FF6B35', // Vibrant orange for accent
  secondaryLight: '#FF8A5C',
  secondaryDark: '#E55A2B',
  
  // Accent colors
  accent: '#FFC107', // Warm amber for highlights
  accentLight: '#FFD54F',
  accentDark: '#FFA000',
  
  // Success and actions
  success: '#4CAF50',
  successLight: '#81C784',
  warning: '#FF9800',
  error: '#F44336',
  
  // Background colors - modern clean approach
  backgroundPrimary: '#FFFFFF', // Clean white background
  backgroundSecondary: '#F8FFFE', // Very light cyan tint
  backgroundTertiary: '#F0F9F8', // Subtle cyan background
  backgroundAccent: '#E8F7F6', // Light cyan for cards
  
  // Text colors - high contrast for accessibility
  textPrimary: '#1A1A1A', // Near black
  textSecondary: '#4A4A4A', // Dark grey
  textMuted: '#8A8A8A', // Medium grey
  textDisabled: '#CACACA', // Light grey
  
  // Interactive states
  interactive: '#27B3B0',
  interactivePressed: '#1A8B89',
  interactiveDisabled: '#27B3B080',
  
  // Food and place specific
  food: '#FF6B35', // Vibrant orange for food
  place: '#27B3B0', // Toria primary for places
  both: '#8A4FFF', // Purple for combined experiences
  
  // Going with theme colors - distinct and branded
  partner: '#E91E63', // Romantic magenta
  family: '#FF9800', // Warm orange
  friends: '#27B3B0', // Toria primary
  business: '#795548', // Professional brown
  solo: '#9C27B0', // Independent purple
  
  // Status colors
  current: '#4CAF50',
  upcoming: '#FF9800',
  past: '#9E9E9E',
  
  // Transparent overlays
  overlay: 'rgba(26, 26, 26, 0.7)',
  overlayLight: 'rgba(26, 26, 26, 0.5)',
  modalBackdrop: 'rgba(26, 26, 26, 0.6)',
  
  // Border and divider colors
  border: '#E0F2F1',
  borderLight: '#F0F9F8',
  divider: '#D0E8E7',
  
  // Input and form colors
  inputBackground: '#FFFFFF',
  inputBorder: '#D0E8E7',
  inputBorderFocused: '#27B3B0',
  inputText: '#1A1A1A',
  inputPlaceholder: '#8A8A8A',
};

// Gradient combinations for modern look
export const Gradients = {
  primary: ['#27B3B0', '#43E6F7'],
  secondary: ['#FF6B35', '#FF8A5C'],
  accent: ['#FFC107', '#FFD54F'],
  background: ['#FFFFFF', '#F8FFFE'],
  sunset: ['#FF6B35', '#FFC107'],
  ocean: ['#27B3B0', '#43E6F7'],
  success: ['#4CAF50', '#81C784'],
};

// Typography scale
export const Typography = {
  // Headers
  h1: { fontSize: 32, fontWeight: '800' as const, lineHeight: 40, color: Colors.textPrimary },
  h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32, color: Colors.textPrimary },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28, color: Colors.textPrimary },
  h4: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24, color: Colors.textPrimary },
  
  // Body text
  body1: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24, color: Colors.textSecondary },
  body2: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20, color: Colors.textSecondary },
  
  // UI elements
  button: { fontSize: 16, fontWeight: '600' as const, color: Colors.textPrimary },
  buttonSecondary: { fontSize: 16, fontWeight: '600' as const, color: Colors.primary },
  caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16, color: Colors.textMuted },
  overline: { fontSize: 10, fontWeight: '600' as const, lineHeight: 14, letterSpacing: 1, color: Colors.textMuted },
  
  // Tab and navigation
  tabActive: { fontSize: 12, fontWeight: '700' as const, color: Colors.primary },
  tabInactive: { fontSize: 12, fontWeight: '500' as const, color: Colors.textMuted },
  
  // Input labels
  inputLabel: { fontSize: 14, fontWeight: '600' as const, color: Colors.textPrimary },
  inputText: { fontSize: 16, fontWeight: '400' as const, color: Colors.inputText },
  inputPlaceholder: { fontSize: 16, fontWeight: '400' as const, color: Colors.inputPlaceholder },
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
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export default Colors;