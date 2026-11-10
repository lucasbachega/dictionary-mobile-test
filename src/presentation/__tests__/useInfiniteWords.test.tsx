import { act, renderHook, waitFor } from '@testing-library/react-native';

import { TOKENS } from '@/core/di/tokens';
import type { WordsRemoteDataSource } from '@/data/datasources/WordsRemoteDataSource';
import { SqliteWordListRepository } from '@/data/repositories/SqliteWordListRepository';

import { SqlJsDatabase } from '../../../test/SqlJsDatabase';
import { createTestContainer, wrapperFor } from '../../../test/TestProviders';
import { useInfiniteWords } from '../hooks/useInfiniteWords';

const WORDS = ['able', 'about', 'above', 'act', 'add', 'age', 'ago', 'air', 'all', 'also', 'bad', 'bag'];

async function setup() {
  const db = await SqlJsDatabase.create();
  const remote = {
    fetchRawDictionary: async () => JSON.stringify(Object.fromEntries(WORDS.map((w) => [w, 1]))),
  } as unknown as WordsRemoteDataSource;
  const repository = new SqliteWordListRepository(db, remote);
  await repository.seed();
  const container = createTestContainer({ [TOKENS.WordListRepository]: repository });
  return { wrapper: wrapperFor(container), repository };
}

describe('useInfiniteWords', () => {
  it('carrega a primeira página e as próximas ao rolar', async () => {
    const { wrapper } = await setup();
    const { result } = await renderHook(() => useInfiniteWords(''), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('idle'));
    expect(result.current.words).toEqual(['able', 'about', 'above', 'act', 'add']);

    await act(async () => {
      // Dois disparos seguidos de onEndReached não podem duplicar a página.
      result.current.loadMore();
      result.current.loadMore();
    });
    await waitFor(() => expect(result.current.words).toHaveLength(10));

    await act(async () => {
      await result.current.loadMore();
    });
    await waitFor(() => expect(result.current.hasMore).toBe(false));
    expect(result.current.words).toEqual(WORDS);
  });

  it('reinicia a lista quando o filtro muda', async () => {
    const { wrapper } = await setup();
    const { result, rerender } = await renderHook(({ prefix }: { prefix: string }) => useInfiniteWords(prefix), {
      wrapper,
      initialProps: { prefix: '' },
    });
    await waitFor(() => expect(result.current.status).toBe('idle'));

    await rerender({ prefix: 'ag' });
    await waitFor(() => expect(result.current.words).toEqual(['age', 'ago']));
    expect(result.current.hasMore).toBe(false);
  });

  it('expõe o erro sem travar a tela', async () => {
    const failing = { getPage: jest.fn().mockRejectedValue(new Error('db down')) };
    const container = createTestContainer({ [TOKENS.WordListRepository]: failing });
    const { result } = await renderHook(() => useInfiniteWords(''), { wrapper: wrapperFor(container) });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBeTruthy();
  });
});
