import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { spacing } from '../theme/theme';

/** Card rosa do wireframe: palavra + fonética. */
export function WordCard({ word, phonetic }: { word: string; phonetic?: string }) {
  const theme = useTheme();
  return (
    <View
      style={[styles.card, { backgroundColor: theme.colors.primaryContainer }]}
      accessibilityLabel={phonetic ? `${word}, pronúncia ${phonetic}` : word}
    >
      <Text
        variant="displaySmall"
        numberOfLines={2}
        adjustsFontSizeToFit
        style={[styles.word, { color: theme.colors.onPrimaryContainer }]}
        testID="word-title"
      >
        {word}
      </Text>
      {phonetic ? (
        <Text
          variant="headlineSmall"
          style={[styles.phonetic, { color: theme.colors.onPrimaryContainer }]}
          testID="word-phonetic"
        >
          {phonetic}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 180,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  word: { fontWeight: '600', textAlign: 'center' },
  phonetic: { opacity: 0.8, textAlign: 'center' },
});
