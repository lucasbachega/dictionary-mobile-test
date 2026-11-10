import { renderHook, waitFor } from '@testing-library/react-native';

import { TOKENS } from '@/core/di/tokens';
import { SqliteUserWordsRepository } from '@/data/repositories/SqliteUserWordsRepository';

import { SqlJsDatabase } from '../../../test/SqlJsDatabase';
import { createTestContainer, wrapperFor } from '../../../test/TestProviders';
import { useWordNavigation } from '../hooks/useWordNavigation';

describe('useWordNavigation', () => {
  it('navega pelo histórico usando o snapshot tirado ao abrir a tela', async () => {
    const db = await SqlJsDatabase.create();
    let now = 0;
    const userWords = new SqliteUserWordsRepository(db, () => ++now);
    for (const w of ['one', 'two', 'three']) await userWords.addToHistory('u1', w);
    // Histórico: three, two, one

    const container = createTestContainer({
      [TOKENS.UserWordsRepository]: userWords,
      [TOKENS.WordListRepository]: { getNeighbor: jest.fn() },
    });
    const { result, rerender } = await renderHook(
      ({ word }: { word: string }) => useWordNavigation('history', 'u1', word),
      { wrapper: wrapperFor(container), initialProps: { word: 'two' } },
    );

    await waitFor(() => expect(result.current).toMatchObject({ previous: 'three', next: 'one' }));

    // Abrir "two" o move para o topo do histórico; a navegação não pode mudar por isso.
    await userWords.addToHistory('u1', 'two');
    await rerender({ word: 'one' });
    await waitFor(() => expect(result.current).toMatchObject({ previous: 'two', next: null }));
  });

  it('na lista geral usa os vizinhos em ordem alfabética', async () => {
    const getNeighbor = jest.fn(async (_w: string, dir: string) => (dir === 'next' ? 'help' : 'hell'));
    const container = createTestContainer({
      [TOKENS.WordListRepository]: { getNeighbor },
      [TOKENS.UserWordsRepository]: {},
    });
    const { result } = await renderHook(() => useWordNavigation('all', 'u1', 'hello'), {
      wrapper: wrapperFor(container),
    });

    await waitFor(() => expect(result.current).toMatchObject({ previous: 'hell', next: 'help', ready: true }));
  });
});
