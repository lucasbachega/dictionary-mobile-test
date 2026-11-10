import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, ProgressBar, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { DependencyContainer } from 'tsyringe';

import { appConfig } from '@/core/config/env';
import { container as rootContainer, registerDependencies } from '@/core/di/container';
import { TOKENS } from '@/core/di/tokens';
import { getErrorMessage } from '@/core/errors/AppError';
import { openDatabase } from '@/data/database/openDatabase';
import type { WordListRepository } from '@/domain/repositories/WordListRepository';

import { spacing } from '../theme/theme';
import { DependenciesProvider } from './DependenciesProvider';

type Stage = 'opening' | 'downloading' | 'saving' | 'ready' | 'error';

const STAGE_LABEL: Record<Exclude<Stage, 'ready' | 'error'>, string> = {
  opening: 'Preparando o banco de dados…',
  downloading: 'Baixando a lista de palavras (≈370 mil)…',
  saving: 'Salvando as palavras no aparelho…',
};

/**
 * Inicializa a app antes de renderizar as rotas:
 *  1. abre/migra o SQLite;
 *  2. registra as dependências no container de DI;
 *  3. na primeira execução, importa o words_dictionary.json para o banco local.
 */
export function BootstrapGate({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const [stage, setStage] = useState<Stage>('opening');
  const [error, setError] = useState<string | null>(null);
  const [container, setContainer] = useState<DependencyContainer | null>(null);
  const [attempt, setAttempt] = useState(0);
  const containerRef = useRef<DependencyContainer | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!containerRef.current) {
          const db = await openDatabase();
          containerRef.current = registerDependencies(appConfig, db, rootContainer);
        }
        const ready = containerRef.current;
        if (!cancelled) setContainer(ready);

        const words = ready.resolve<WordListRepository>(TOKENS.WordListRepository);
        await words.seed((s) => {
          if (!cancelled && s !== 'done') setStage(s);
        });
        if (!cancelled) setStage('ready');
      } catch (e) {
        if (cancelled) return;
        setError(getErrorMessage(e));
        setStage('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setError(null);
    setStage('opening');
    setAttempt((a) => a + 1);
  }, []);

  if (stage === 'ready' && container) {
    return <DependenciesProvider container={container}>{children}</DependenciesProvider>;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.logo, { backgroundColor: theme.colors.primaryContainer }]}>
        <Icon source="book-open-variant" size={56} color={theme.colors.onPrimaryContainer} />
      </View>
      <Text variant="headlineMedium" style={styles.title}>
        Dictionary
      </Text>

      {stage === 'error' ? (
        <View style={styles.block}>
          <Text variant="bodyMedium" style={[styles.center, { color: theme.colors.error }]}>
            {error}
          </Text>
          <Button mode="contained" icon="refresh" onPress={retry}>
            Tentar novamente
          </Button>
        </View>
      ) : (
        <View style={styles.block}>
          <ProgressBar indeterminate style={styles.progress} />
          <Text variant="bodyMedium" style={[styles.center, { color: theme.colors.onSurfaceVariant }]}>
            {STAGE_LABEL[stage === 'ready' ? 'saving' : stage]}
          </Text>
          {stage !== 'opening' ? (
            <Text variant="bodySmall" style={[styles.center, { color: theme.colors.outline }]}>
              Isso acontece só na primeira vez.
            </Text>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  logo: { width: 104, height: 104, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: spacing.md, fontWeight: '700' },
  block: { width: '100%', maxWidth: 360, gap: spacing.md, marginTop: spacing.xl, alignItems: 'stretch' },
  progress: { borderRadius: 4, height: 6 },
  center: { textAlign: 'center' },
});
