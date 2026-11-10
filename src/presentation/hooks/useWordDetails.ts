import { useCallback, useEffect, useState } from 'react';

import { TOKENS } from '@/core/di/tokens';
import { getErrorMessage } from '@/core/errors/AppError';
import type { WordDetails } from '@/domain/entities/Word';
import type { DictionaryRepository } from '@/domain/repositories/DictionaryRepository';

import { useDependency } from '../providers/DependenciesProvider';

export type WordDetailsState =
  | { status: 'loading' }
  | { status: 'found'; details: WordDetails; fromCache: boolean }
  | { status: 'not_found' }
  | { status: 'error'; error: string };

interface LoadedResult {
  word: string;
  attempt: number;
  state: WordDetailsState;
}

const LOADING: WordDetailsState = { status: 'loading' };

/**
 * Busca os dados da palavra (cache → API).
 * O resultado guarda a palavra/tentativa a que pertence: se o usuário trocar de
 * palavra rapidamente (Próximo/Voltar), respostas antigas são ignoradas e a tela
 * mostra "carregando" até chegar a resposta certa.
 */
export function useWordDetails(word: string) {
  const repository = useDependency<DictionaryRepository>(TOKENS.DictionaryRepository);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<LoadedResult | null>(null);

  useEffect(() => {
    let active = true;
    const settle = (state: WordDetailsState) => {
      if (active) setResult({ word, attempt, state });
    };

    repository
      .lookup(word, { forceRefresh: attempt > 0 })
      .then((r) =>
        settle(
          r.status === 'found'
            ? { status: 'found', details: r.details, fromCache: r.fromCache }
            : { status: 'not_found' },
        ),
      )
      .catch((error) => settle({ status: 'error', error: getErrorMessage(error) }));

    return () => {
      active = false;
    };
  }, [repository, word, attempt]);

  const state =
    result && result.word === word && result.attempt === attempt ? result.state : LOADING;
  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  return { state, retry };
}
