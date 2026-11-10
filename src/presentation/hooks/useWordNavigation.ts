import { useEffect, useState } from 'react';

import { TOKENS } from '@/core/di/tokens';
import type { WordListSource } from '@/domain/entities/Word';
import type { UserWordsRepository } from '@/domain/repositories/UserWordsRepository';
import type { WordListRepository } from '@/domain/repositories/WordListRepository';

import { useDependency } from '../providers/DependenciesProvider';

interface Neighbors {
  previous: string | null;
  next: string | null;
}

const NONE: Neighbors = { previous: null, next: null };

/**
 * Calcula a palavra anterior/próxima conforme a lista de onde a palavra foi aberta.
 *
 * Para Histórico/Favoritos tiramos um "snapshot" da lista ao abrir a tela: como
 * visualizar uma palavra a move para o topo do histórico, navegar sobre a lista
 * viva faria o Próximo pular itens. `ready` indica que o snapshot já foi tirado.
 */
export function useWordNavigation(source: WordListSource, userId: string, word: string) {
  const words = useDependency<WordListRepository>(TOKENS.WordListRepository);
  const userWords = useDependency<UserWordsRepository>(TOKENS.UserWordsRepository);

  const [snapshot, setSnapshot] = useState<string[] | null>(null);
  const [computed, setComputed] = useState<{ word: string; neighbors: Neighbors } | null>(null);
  const ready = source === 'all' || snapshot !== null;

  useEffect(() => {
    if (source === 'all') return;
    let active = true;
    const load =
      source === 'history' ? userWords.listHistory(userId) : userWords.listFavorites(userId);
    load
      .then((entries) => entries.map((e) => e.word))
      .catch(() => [] as string[])
      .then((list) => {
        if (active) setSnapshot((current) => current ?? list); // tira o snapshot uma única vez
      });
    return () => {
      active = false;
    };
  }, [source, userId, userWords]);

  useEffect(() => {
    if (!ready) return;
    let active = true;

    const compute = async (): Promise<Neighbors> => {
      if (source === 'all') {
        const [previous, next] = await Promise.all([
          words.getNeighbor(word, 'previous'),
          words.getNeighbor(word, 'next'),
        ]);
        return { previous, next };
      }
      const list = snapshot ?? [];
      const index = list.indexOf(word);
      if (index < 0) return NONE;
      return { previous: list[index - 1] ?? null, next: list[index + 1] ?? null };
    };

    compute()
      .catch(() => NONE)
      .then((neighbors) => {
        if (active) setComputed({ word, neighbors });
      });
    return () => {
      active = false;
    };
  }, [ready, snapshot, source, word, words]);

  const neighbors = computed?.word === word ? computed.neighbors : NONE;
  return { ...neighbors, ready };
}
