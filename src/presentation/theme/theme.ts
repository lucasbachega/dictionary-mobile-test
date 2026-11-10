import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

/**
 * Tema Material 3 (React Native Paper). O rosa do `primaryContainer`
 * reproduz o card da palavra do wireframe.
 */
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#7B2D5E',
    onPrimary: '#FFFFFF',
    primaryContainer: '#F4DCE8',
    onPrimaryContainer: '#3A0A27',
    secondary: '#6D5763',
    secondaryContainer: '#F6E4EC',
    onSecondaryContainer: '#27151F',
    background: '#FCF8FA',
    surface: '#FFFFFF',
    surfaceVariant: '#F1E6EB',
    onSurfaceVariant: '#5A4651',
    outline: '#C9B7C0',
    outlineVariant: '#E5D8DE',
    error: '#B3261E',
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  roundness: 3,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#F2B3D4',
    onPrimary: '#4A1238',
    primaryContainer: '#5E2148',
    onPrimaryContainer: '#FFD8EA',
    secondary: '#DABDCB',
    secondaryContainer: '#4A3842',
    onSecondaryContainer: '#F6E4EC',
    background: '#151113',
    surface: '#1D181B',
    surfaceVariant: '#3B3036',
    onSurfaceVariant: '#D6C1CB',
    outline: '#8D7983',
    outlineVariant: '#3B3036',
  },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
