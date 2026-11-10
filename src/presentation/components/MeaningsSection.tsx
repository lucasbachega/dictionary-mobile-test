import { StyleSheet, View } from 'react-native';
import { Chip, Divider, Text, useTheme } from 'react-native-paper';

import type { Meaning } from '@/domain/entities/Word';

import { spacing } from '../theme/theme';

const MAX_SYNONYMS = 8;

/** Lista de significados no formato "Verb - definição", com exemplos e sinônimos. */
export function MeaningsSection({
  meanings,
  onPressWord,
}: {
  meanings: Meaning[];
  onPressWord?: (word: string) => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.container} testID="meanings">
      {meanings.map((meaning, mi) => {
        const synonyms = meaning.synonyms.slice(0, MAX_SYNONYMS);
        return (
          <View key={`${meaning.partOfSpeech}-${mi}`} style={styles.meaning}>
            {mi > 0 ? <Divider style={styles.divider} /> : null}
            {meaning.definitions.map((definition, di) => (
              <View key={di} style={styles.definition}>
                <Text variant="bodyLarge">
                  <Text style={[styles.partOfSpeech, { color: theme.colors.primary }]}>
                    {capitalize(meaning.partOfSpeech)}
                  </Text>
                  {' - '}
                  {definition.definition}
                </Text>
                {definition.example ? (
                  <Text
                    variant="bodyMedium"
                    style={[styles.example, { color: theme.colors.onSurfaceVariant }]}
                  >
                    “{definition.example}”
                  </Text>
                ) : null}
              </View>
            ))}
            {synonyms.length > 0 ? (
              <View style={styles.chips}>
                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Synonyms:
                </Text>
                {synonyms.map((synonym) => (
                  <Chip
                    key={synonym}
                    compact
                    onPress={onPressWord ? () => onPressWord(synonym) : undefined}
                  >
                    {synonym}
                  </Chip>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  meaning: { gap: spacing.sm },
  divider: { marginVertical: spacing.sm },
  definition: { gap: 2 },
  partOfSpeech: { fontWeight: '700' },
  example: { fontStyle: 'italic', marginLeft: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs },
});
