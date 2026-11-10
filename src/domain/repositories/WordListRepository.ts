export type SeedStage = 'downloading' | 'saving' | 'done';

export interface WordPage {
  words: string[];
  /** Cursor para a próxima página (última palavra retornada) ou `null` se acabou. */
  nextCursor: string | null;
}

export interface WordListRepository {
  isSeeded(): Promise<boolean>;
  /** Baixa o `words_dictionary.json` e salva no banco local. Idempotente. */
  seed(onStage?: (stage: SeedStage) => void, signal?: AbortSignal): Promise<number>;
  count(): Promise<number>;
  /** Paginação por cursor (keyset), em ordem alfabética, com filtro opcional por prefixo. */
  getPage(params: { cursor?: string | null; limit: number; prefix?: string }): Promise<WordPage>;
  getNeighbor(word: string, direction: 'previous' | 'next'): Promise<string | null>;
}
