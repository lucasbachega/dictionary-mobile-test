import { setAudioModeAsync } from 'expo-audio';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider, type MD3Theme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CenteredLoader } from '@/presentation/components/StateViews';
import { AuthProvider, useAuth } from '@/presentation/providers/AuthProvider';
import { BootstrapGate } from '@/presentation/providers/BootstrapGate';
import { darkTheme, lightTheme } from '@/presentation/theme/theme';

/** Sincroniza as cores do React Navigation com o tema Material (Paper). */
function toNavigationTheme(base: Theme, paper: MD3Theme): Theme {
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: paper.colors.primary,
      background: paper.colors.background,
      card: paper.colors.surface,
      text: paper.colors.onSurface,
      border: paper.colors.outlineVariant,
      notification: paper.colors.error,
    },
  };
}

const navigationLight = toNavigationTheme(DefaultTheme, lightTheme);
const navigationDark = toNavigationTheme(DarkTheme, darkTheme);

export default function RootLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  useEffect(() => {
    // Permite ouvir a pronúncia mesmo com o iPhone no modo silencioso.
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={isDark ? darkTheme : lightTheme}>
        <ThemeProvider value={isDark ? navigationDark : navigationLight}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <BootstrapGate>
            <AuthProvider>
              <RootNavigator />
            </AuthProvider>
          </BootstrapGate>
        </ThemeProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { status } = useAuth();
  if (status === 'loading') return <CenteredLoader />;

  const signedIn = status === 'signedIn';
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="index" />
        <Stack.Screen name="word/[word]" options={{ presentation: 'modal' }} />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
      </Stack.Protected>
    </Stack>
  );
}
