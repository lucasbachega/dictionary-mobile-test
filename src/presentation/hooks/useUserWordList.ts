import { useCallback, useEffect, useRef, useState } from 'react';

import { TOKENS } from '@/core/di/tokens';
import { getErrorMessage } from '@/core/errors/AppError';
import type { UserWordEntry } from '@/domain/entities/Word';
import type { UserWordsRepository } from '@/domain/repositories/UserWordsRepository';

import { useDependency } from '../providers/DependenciesProvider';

export type UserListKind = 'history' | 'favorites';

/** Carrega o histórico ou os favoritos do usuário. */
export function useUserWordList(kind: UserListKind, userId: string) {
  const repository = useDependency<UserWordsRepository>(TOKENS.UserWordsRepository);
  const [entries, setEntries] = useState<UserWordEntry[]>([]);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [error, setError] = useState<string>();
  const requestId = useRef(0);
  const hasData = useRef(false);

  const refresh = useCallback(async () => {
    const current = ++requestId.current;
    // Mantém a lista na tela enquanto recarrega em segundo plano (sem "piscar").
    if (!hasData.current) setStatus('loading');
    try {
      const data =
        kind === 'history'
          ? await repository.listHistory(userId)
          : await repository.listFavorites(userId);
      if (current !== requestId.current) return;
      hasData.current = true;
      setEntries(data);
      setStatus('idle');
    } catch (e) {
      if (current !== requestId.current) return;
      setError(getErrorMessage(e));
      setStatus('error');
    }
  }, [kind, repository, userId]);

  useEffect(
    () => () => {
      requestId.current++;
    },
    [],
  );

  const clearHistory = useCallback(async () => {
    await repository.clearHistory(userId);
    await refresh();
  }, [refresh, repository, userId]);

  return { entries, status, error, refresh, clearHistory };
}
