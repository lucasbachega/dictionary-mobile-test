import { useCallback, useEffect, useState } from 'react';

import { TOKENS } from '@/core/di/tokens';
import { getErrorMessage } from '@/core/errors/AppError';
import type { UserWordsRepository } from '@/domain/repositories/UserWordsRepository';

import { useDependency } from '../providers/DependenciesProvider';

interface FavoriteState {
  word: string;
  value: boolean;
}

/** Estado de favorito com atualização otimista e rollback em caso de erro. */
export function useFavorite(userId: string, word: string, onError?: (message: string) => void) {
  const repository = useDependency<UserWordsRepository>(TOKENS.UserWordsRepository);
  const [favorite, setFavorite] = useState<FavoriteState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    repository
      .isFavorite(userId, word)
      .then((value) => {
        if (active) setFavorite({ word, value });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [repository, userId, word]);

  // Só vale o estado que pertence à palavra atual.
  const isFavorite = favorite?.word === word ? favorite.value : false;

  const toggle = useCallback(async () => {
    if (busy) return;
    const next = !isFavorite;
    setFavorite({ word, value: next });
    setBusy(true);
    try {
      if (next) await repository.addFavorite(userId, word);
      else await repository.removeFavorite(userId, word);
      return next;
    } catch (error) {
      setFavorite((current) => (current?.word === word ? { word, value: !next } : current));
      onError?.(getErrorMessage(error));
      return undefined;
    } finally {
      setBusy(false);
    }
  }, [busy, isFavorite, onError, repository, userId, word]);

  return { isFavorite, toggle, busy };
}
