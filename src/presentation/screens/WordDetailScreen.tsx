import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Chip, IconButton, Snackbar, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TOKENS } from '@/core/di/tokens';
import type { WordListSource } from '@/domain/entities/Word';
import type { UserWordsRepository } from '@/domain/repositories/UserWordsRepository';
import { normalizeWord } from '@/domain/validation';

import { AudioPlayerBar } from '../components/AudioPlayerBar';
import { MeaningsSection } from '../components/MeaningsSection';
import { ErrorState } from '../components/StateViews';
import { WordCard } from '../components/WordCard';
import { useFavorite } from '../hooks/useFavorite';
import { useWordDetails } from '../hooks/useWordDetails';
import { useWordNavigation } from '../hooks/useWordNavigation';
import { useCurrentUser } from '../providers/AuthProvider';
import { useDependency } from '../providers/DependenciesProvider';
import { spacing } from '../theme/theme';

const SOURCES: WordListSource[] = ['all', 'history', 'favorites'];

function parseSource(value: unknown): WordListSource {
  return SOURCES.includes(value as WordListSource) ? (value as WordListSource) : 'all';
}

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export function WordDetailScreen() {
  const params = useLocalSearchParams<{ word: string; source?: string }>();
  const source = parseSource(firstParam(params.source));
  const [word, setWord] = useState(() => normalizeWord(firstParam(params.word)));

  const theme = useTheme();
  const user = useCurrentUser();
  const userWords = useDependency<UserWordsRepository>(TOKENS.UserWordsRepository);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const { state, retry } = useWordDetails(word);
  const navigation = useWordNavigation(source, user.id, word);
  const favorite = useFavorite(user.id, word, setSnackbar);

  // Registra no histórico depois do snapshot da lista de origem (ver useWordNavigation).
  useEffect(() => {
    if (!navigation.ready) return;
    userWords.addToHistory(user.id, word).catch(() => undefined);
  }, [navigation.ready, user.id, userWords, word]);

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []);

  const toggleFavorite = async () => {
    const added = await favorite.toggle();
    if (added !== undefined) setSnackbar(added ? 'Adicionada aos favoritos' : 'Removida dos favoritos');
  };

  const details = state.status === 'found' ? state.details : undefined;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="close" onPress={close} accessibilityLabel="Fechar" testID="close" />
        <IconButton
          icon={favorite.isFavorite ? 'heart' : 'heart-outline'}
          iconColor={favorite.isFavorite ? theme.colors.primary : undefined}
          onPress={toggleFavorite}
          disabled={favorite.busy}
          accessibilityLabel={favorite.isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
          accessibilityState={{ selected: favorite.isFavorite }}
          testID="favorite-toggle"
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <WordCard word={details?.word ?? word} phonetic={details?.phonetic} />

        {/* key: recria o player ao trocar de palavra */}
        <AudioPlayerBar key={word} audioUrl={details?.audioUrl} text={word} />

        <View style={styles.meaningsHeader}>
          <Text variant="headlineSmall" style={styles.meaningsTitle}>
            Meanings
          </Text>
          {state.status === 'found' && state.fromCache ? (
            <Chip compact icon="lightning-bolt" style={styles.cacheChip} textStyle={styles.cacheText}>
              cache
            </Chip>
          ) : null}
        </View>

        {state.status === 'loading' ? <ActivityIndicator style={styles.loading} /> : null}
        {state.status === 'found' ? <MeaningsSection meanings={state.details.meanings} /> : null}
        {state.status === 'not_found' ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }} testID="not-found">
            A Free Dictionary API não tem definições para esta palavra. Você ainda pode ouvir a
            pronúncia sintetizada e salvá-la nos favoritos.
          </Text>
        ) : null}
        {state.status === 'error' ? (
          <View style={styles.error}>
            <ErrorState message={state.error} onRetry={retry} />
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.colors.outlineVariant }]}>
        <Button
          mode="outlined"
          icon="chevron-left"
          style={styles.navButton}
          disabled={!navigation.previous}
          onPress={() => navigation.previous && setWord(navigation.previous)}
          testID="previous"
        >
          Voltar
        </Button>
        <Button
          mode="outlined"
          icon="chevron-right"
          contentStyle={styles.nextContent}
          style={styles.navButton}
          disabled={!navigation.next}
          onPress={() => navigation.next && setWord(navigation.next)}
          testID="next"
        >
          Próximo
        </Button>
      </View>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={1800}>
        {snackbar}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xs },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  meaningsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  meaningsTitle: { fontWeight: '700' },
  cacheChip: { height: 28 },
  cacheText: { fontSize: 11 },
  loading: { marginVertical: spacing.lg },
  error: { minHeight: 220 },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  navButton: { flex: 1 },
  nextContent: { flexDirection: 'row-reverse' },
});
