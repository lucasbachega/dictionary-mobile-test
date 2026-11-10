import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { TOKENS } from '@/core/di/tokens';
import { WordCacheDataSource } from '@/data/datasources/WordCacheDataSource';
import type { DictionaryApiDataSource } from '@/data/datasources/DictionaryApiDataSource';
import { CachedDictionaryRepository } from '@/data/repositories/CachedDictionaryRepository';
import { SqliteUserWordsRepository } from '@/data/repositories/SqliteUserWordsRepository';
import { SqliteWordListRepository } from '@/data/repositories/SqliteWordListRepository';
import type { WordsRemoteDataSource } from '@/data/datasources/WordsRemoteDataSource';

import { helloEntries } from '../../../test/fixtures';
import { SqlJsDatabase } from '../../../test/SqlJsDatabase';
import { createTestContainer, TestProviders } from '../../../test/TestProviders';
import { WordDetailScreen } from '../screens/WordDetailScreen';

const mockParams = { word: 'hello', source: 'all' };
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  router: { back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
}));
jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({ play: jest.fn(), pause: jest.fn(), seekTo: jest.fn() }),
  useAudioPlayerStatus: () => ({ playing: false, currentTime: 0, duration: 0, isLoaded: true }),
}));
jest.mock('../providers/AuthProvider', () => ({
  useCurrentUser: () => ({ id: 'u1', email: 'lucas@email.com' }),
}));

async function setup() {
  const db = await SqlJsDatabase.create();
  const words = new SqliteWordListRepository(db, {
    fetchRawDictionary: async () => JSON.stringify({ hell: 1, hello: 1, help: 1 }),
  } as unknown as WordsRemoteDataSource);
  await words.seed();

  const fetchEntries = jest.fn(async (word: string) =>
    word === 'hello' ? { status: 'found' as const, entries: helloEntries } : { status: 'not_found' as const },
  );
  const dictionary = new CachedDictionaryRepository(
    { fetchEntries } as unknown as DictionaryApiDataSource,
    new WordCacheDataSource(db),
    { cacheTtlFoundMs: 1e9, cacheTtlNotFoundMs: 1e9 },
  );
  const userWords = new SqliteUserWordsRepository(db);

  const container = createTestContainer({
    [TOKENS.WordListRepository]: words,
    [TOKENS.DictionaryRepository]: dictionary,
    [TOKENS.UserWordsRepository]: userWords,
  });

  await render(
    <TestProviders container={container}>
      <WordDetailScreen />
    </TestProviders>,
  );
  return { userWords, fetchEntries, user: userEvent.setup() };
}

describe('WordDetailScreen', () => {
  it('mostra palavra, fonética e significados, e registra no histórico', async () => {
    const { userWords } = await setup();

    expect(await screen.findByText('həˈləʊ')).toBeOnTheScreen();
    expect(screen.getByTestId('word-title')).toHaveTextContent('hello');
    expect(screen.getByText(/used as a greeting/)).toBeOnTheScreen();

    await waitFor(async () =>
      expect((await userWords.listHistory('u1')).map((e) => e.word)).toEqual(['hello']),
    );
  });

  it('salva e remove dos favoritos', async () => {
    const { userWords, user } = await setup();
    await screen.findByText('həˈləʊ');

    await user.press(screen.getByTestId('favorite-toggle'));
    await waitFor(async () => expect(await userWords.isFavorite('u1', 'hello')).toBe(true));
    expect(screen.getByLabelText('Remover dos favoritos')).toBeOnTheScreen();

    await user.press(screen.getByTestId('favorite-toggle'));
    await waitFor(async () => expect(await userWords.isFavorite('u1', 'hello')).toBe(false));
  });

  it('navega com Próximo e trata palavras sem definição', async () => {
    const { user } = await setup();
    await screen.findByText('həˈləʊ');

    await waitFor(() => expect(screen.getByTestId('next')).toBeEnabled());
    await user.press(screen.getByTestId('next'));

    await waitFor(() => expect(screen.getByTestId('word-title')).toHaveTextContent('help'));
    expect(await screen.findByTestId('not-found')).toBeOnTheScreen();
    await waitFor(() => expect(screen.getByTestId('next')).toBeDisabled());
  });
});
