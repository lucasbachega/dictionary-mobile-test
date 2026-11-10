import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { TOKENS } from '@/core/di/tokens';
import type { WordsRemoteDataSource } from '@/data/datasources/WordsRemoteDataSource';
import { SqliteUserWordsRepository } from '@/data/repositories/SqliteUserWordsRepository';
import { SqliteWordListRepository } from '@/data/repositories/SqliteWordListRepository';

import { SqlJsDatabase } from '../../../test/SqlJsDatabase';
import { createTestContainer, TestProviders } from '../../../test/TestProviders';
import { HomeScreen } from '../screens/HomeScreen';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  useFocusEffect: (effect: () => void) => require('react').useEffect(effect, [effect]),
}));
jest.mock('../providers/AuthProvider', () => ({
  useCurrentUser: () => ({ id: 'u1', email: 'lucas@email.com' }),
  useAuth: () => ({ signOut: jest.fn() }),
}));

const WORDS = ['hello', 'today', 'great', 'peace', 'chair', 'diary', 'value'];

async function setup() {
  const db = await SqlJsDatabase.create();
  const words = new SqliteWordListRepository(db, {
    fetchRawDictionary: async () => JSON.stringify(Object.fromEntries(WORDS.map((w) => [w, 1]))),
  } as unknown as WordsRemoteDataSource);
  await words.seed();
  const userWords = new SqliteUserWordsRepository(db);
  await userWords.addFavorite('u1', 'peace');

  await render(
    <TestProviders
      container={createTestContainer({
        [TOKENS.WordListRepository]: words,
        [TOKENS.UserWordsRepository]: userWords,
      })}
    >
      <HomeScreen />
    </TestProviders>,
  );
  return { user: userEvent.setup() };
}

describe('HomeScreen (wireframe da listagem)', () => {
  beforeEach(() => mockPush.mockClear());

  it('lista as palavras e abre o detalhe ao tocar', async () => {
    const { user } = await setup();

    expect(await screen.findByText('chair')).toBeOnTheScreen();
    await user.press(screen.getByTestId('word-hello'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/word/[word]',
      params: { word: 'hello', source: 'all' },
    });
  });

  it('alterna para Favorites e History', async () => {
    const { user } = await setup();
    await screen.findByText('chair');

    await user.press(screen.getByTestId('tab-favorites'));
    await waitFor(() => expect(screen.getByTestId('favorites-grid')).toBeOnTheScreen());
    expect(screen.getByTestId('word-peace')).toBeOnTheScreen();

    await user.press(screen.getByTestId('tab-history'));
    expect(await screen.findByText('Nenhuma palavra vista ainda')).toBeOnTheScreen();
  });
});
