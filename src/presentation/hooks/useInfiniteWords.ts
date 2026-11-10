import { useCallback, useEffect, useRef, useState } from 'react';

import type { AppConfig } from '@/core/config/env';
import { TOKENS } from '@/core/di/tokens';
import { getErrorMessage } from '@/core/errors/AppError';
import type { WordListRepository } from '@/domain/repositories/WordListRepository';

import { useDependency } from '../providers/DependenciesProvider';

export interface InfiniteWordsState {
  words: string[];
  status: 'loading' | 'idle' | 'loadingMore' | 'error';
  error?: string;
  hasMore: boolean;
}

/**
 * Lista com rolagem infinita (paginação por cursor no SQLite).
 * - ignora `loadMore` enquanto outra página está carregando (sem páginas duplicadas);
 * - descarta respostas antigas quando o filtro muda ("generation"), evitando race conditions;
 * - nunca atualiza estado depois de desmontado.
 */
export function useInfiniteWords(prefix: string) {
  const repository = useDependency<WordListRepository>(TOKENS.WordListRepository);
  const { pageSize } = useDependency<AppConfig>(TOKENS.Config);

  const [state, setState] = useState<InfiniteWordsState>({
    words: [],
    status: 'loading',
    hasMore: true,
  });

  const cursor = useRef<string | null>(null);
  const hasMore = useRef(true);
  const loading = useRef(false);
  const generation = useRef(0);

  const load = useCallback(
    async (reset: boolean) => {
      if (!reset && (loading.current || !hasMore.current)) return;

      const current = reset ? ++generation.current : generation.current;
      loading.current = true;
      if (reset) {
        cursor.current = null;
        hasMore.current = true;
      }
      setState((s) => ({
        words: reset ? [] : s.words,
        hasMore: true,
        status: reset ? 'loading' : 'loadingMore',
      }));

      try {
        const page = await repository.getPage({ cursor: cursor.current, limit: pageSize, prefix });
        if (current !== generation.current) return;

        cursor.current = page.nextCursor;
        hasMore.current = page.nextCursor !== null;
        setState((s) => ({
          words: reset ? page.words : [...s.words, ...page.words],
          hasMore: hasMore.current,
          status: 'idle',
        }));
      } catch (error) {
        if (current !== generation.current) return;
        setState((s) => ({ ...s, status: 'error', error: getErrorMessage(error) }));
      } finally {
        if (current === generation.current) loading.current = false;
      }
    },
    [repository, pageSize, prefix],
  );

  useEffect(() => {
    load(true);
  }, [load]);

  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );

  const loadMore = useCallback(() => load(false), [load]);
  const refresh = useCallback(() => load(true), [load]);

  return { ...state, loadMore, refresh };
}
