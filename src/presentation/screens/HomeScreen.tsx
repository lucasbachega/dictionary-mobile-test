import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Appbar, Button, Dialog, Menu, Portal, Searchbar, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { WordListSource } from '@/domain/entities/Word';

import { ListTabs, type HomeTab } from '../components/ListTabs';
import { CenteredLoader, EmptyState, ErrorState } from '../components/StateViews';
import { WordGrid } from '../components/WordGrid';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useInfiniteWords } from '../hooks/useInfiniteWords';
import { useUserWordList, type UserListKind } from '../hooks/useUserWordList';
import { useAuth, useCurrentUser } from '../providers/AuthProvider';
import { spacing } from '../theme/theme';

type OpenWord = (word: string, source: WordListSource) => void;

export function HomeScreen() {
  const theme = useTheme();
  const user = useCurrentUser();
  const { signOut } = useAuth();
  const [tab, setTab] = useState<HomeTab>('words');
  const [menuVisible, setMenuVisible] = useState(false);

  const openWord = useCallback<OpenWord>((word, source) => {
    router.push({ pathname: '/word/[word]', params: { word, source } });
  }, []);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header mode="small" statusBarHeight={0} style={{ backgroundColor: theme.colors.background }}>
        <Appbar.Content title="Dictionary" titleStyle={styles.appTitle} />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon="account-circle-outline"
              onPress={() => setMenuVisible(true)}
              accessibilityLabel="Conta"
              testID="account-menu"
            />
          }
        >
          <Menu.Item leadingIcon="email-outline" title={user.email} disabled />
          <Menu.Item
            leadingIcon="logout"
            title="Sair"
            onPress={() => {
              setMenuVisible(false);
              signOut();
            }}
            testID="sign-out"
          />
        </Menu>
      </Appbar.Header>

      <View style={styles.tabs}>
        <ListTabs value={tab} onChange={setTab} />
      </View>

      {/* A lista principal fica montada para preservar a posição da rolagem ao trocar de aba. */}
      <View style={[styles.flex, tab !== 'words' && styles.hidden]}>
        <WordsPanel onOpenWord={openWord} />
      </View>
      {tab === 'history' ? <UserWordsPanel kind="history" userId={user.id} onOpenWord={openWord} /> : null}
      {tab === 'favorites' ? (
        <UserWordsPanel kind="favorites" userId={user.id} onOpenWord={openWord} />
      ) : null}
    </SafeAreaView>
  );
}

function WordsPanel({ onOpenWord }: { onOpenWord: OpenWord }) {
  const [query, setQuery] = useState('');
  const prefix = useDebouncedValue(query.trim(), 250);
  const { words, status, error, hasMore, loadMore, refresh } = useInfiniteWords(prefix);

  const content = (() => {
    if (status === 'loading') return <CenteredLoader />;
    if (status === 'error' && words.length === 0)
      return <ErrorState message={error ?? ''} onRetry={refresh} />;
    return (
      <WordGrid
        testID="word-grid"
        words={words}
        onPressWord={(word) => onOpenWord(word, 'all')}
        onEndReached={hasMore ? loadMore : undefined}
        loadingMore={status === 'loadingMore'}
        ListEmptyComponent={
          <EmptyState
            icon="text-search"
            title="Nenhuma palavra encontrada"
            message={`Não há palavras começando com “${prefix}”.`}
          />
        }
        ListFooterExtra={
          status === 'error' ? (
            <Button onPress={loadMore} style={styles.retryMore}>
              Erro ao carregar. Tentar novamente
            </Button>
          ) : null
        }
      />
    );
  })();

  return (
    <View style={styles.panel}>
      <SectionTitle title="Word list" />
      <Searchbar
        placeholder="Buscar palavra"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.search}
        inputStyle={styles.searchInput}
        testID="search"
      />
      {content}
    </View>
  );
}

const LIST_COPY: Record<UserListKind, { title: string; emptyIcon: string; emptyTitle: string; emptyMessage: string }> = {
  history: {
    title: 'History',
    emptyIcon: 'history',
    emptyTitle: 'Nenhuma palavra vista ainda',
    emptyMessage: 'As palavras que você abrir aparecem aqui, da mais recente para a mais antiga.',
  },
  favorites: {
    title: 'Favorites',
    emptyIcon: 'heart-outline',
    emptyTitle: 'Sem favoritos por enquanto',
    emptyMessage: 'Toque no coração ao ver uma palavra para salvá-la aqui.',
  },
};

function UserWordsPanel({
  kind,
  userId,
  onOpenWord,
}: {
  kind: UserListKind;
  userId: string;
  onOpenWord: OpenWord;
}) {
  const { entries, status, error, refresh, clearHistory } = useUserWordList(kind, userId);
  const [confirmClear, setConfirmClear] = useState(false);
  const copy = LIST_COPY[kind];

  // Recarrega ao voltar da tela de detalhe (novas visualizações / favoritos).
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const words = entries.map((e) => e.word);

  return (
    <View style={styles.panel}>
      <SectionTitle
        title={copy.title}
        count={status === 'idle' ? entries.length : undefined}
        action={
          kind === 'history' && entries.length > 0 ? (
            <Button compact icon="delete-outline" onPress={() => setConfirmClear(true)}>
              Limpar
            </Button>
          ) : null
        }
      />
      {status === 'loading' ? (
        <CenteredLoader />
      ) : status === 'error' && entries.length === 0 ? (
        <ErrorState message={error ?? ''} onRetry={refresh} />
      ) : (
        <WordGrid
          testID={`${kind}-grid`}
          words={words}
          onPressWord={(word) => onOpenWord(word, kind)}
          ListEmptyComponent={
            <EmptyState icon={copy.emptyIcon} title={copy.emptyTitle} message={copy.emptyMessage} />
          }
        />
      )}

      <Portal>
        <Dialog visible={confirmClear} onDismiss={() => setConfirmClear(false)}>
          <Dialog.Title>Limpar histórico?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">Todas as palavras visualizadas serão removidas da lista.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmClear(false)}>Cancelar</Button>
            <Button
              onPress={() => {
                setConfirmClear(false);
                clearHistory().catch(() => undefined);
              }}
            >
              Limpar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

function SectionTitle({ title, count, action }: { title: string; count?: number; action?: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.sectionTitle}>
      <Text variant="titleLarge" style={styles.sectionText}>
        {title}
        {count !== undefined ? (
          <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {`  ${count}`}
          </Text>
        ) : null}
      </Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hidden: { display: 'none' },
  appTitle: { fontWeight: '700' },
  tabs: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  panel: { flex: 1, paddingHorizontal: spacing.md },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    marginBottom: spacing.xs,
  },
  sectionText: { fontWeight: '600' },
  search: { marginBottom: spacing.sm, height: 48 },
  searchInput: { minHeight: 0 },
  retryMore: { marginVertical: spacing.md },
});
