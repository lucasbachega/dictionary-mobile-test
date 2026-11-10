import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, IconButton, ProgressBar, Text, useTheme } from 'react-native-paper';

import { useWordAudio } from '../hooks/useWordAudio';
import { spacing } from '../theme/theme';

/** Play + barra de progresso do wireframe. */
export function AudioPlayerBar({ audioUrl, text }: { audioUrl?: string; text: string }) {
  const theme = useTheme();
  const { mode, isPlaying, isLoading, progress, toggle } = useWordAudio(audioUrl, text);

  return (
    <View style={styles.row}>
      <View style={styles.button}>
        <IconButton
          icon={isPlaying ? 'pause' : 'play'}
          mode="contained-tonal"
          size={28}
          onPress={toggle}
          accessibilityLabel={isPlaying ? 'Pausar pronúncia' : 'Ouvir pronúncia'}
          testID="audio-toggle"
        />
        {isLoading ? <ActivityIndicator size={14} style={styles.loading} /> : null}
      </View>
      <View style={styles.track}>
        <ProgressBar
          progress={progress}
          indeterminate={mode === 'speech' && isPlaying}
          style={styles.progress}
          color={theme.colors.primary}
        />
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {mode === 'recording' ? 'Pronúncia gravada' : 'Voz sintetizada (sem gravação disponível)'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  button: { justifyContent: 'center' },
  loading: { position: 'absolute', right: 2, top: 2 },
  track: { flex: 1, gap: spacing.xs },
  progress: { height: 8, borderRadius: 4 },
});
