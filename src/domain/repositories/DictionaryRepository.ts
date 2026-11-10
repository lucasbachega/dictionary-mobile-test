import type { WordLookupResult } from '../entities/Word';

export interface DictionaryRepository {
  /** Busca a palavra usando cache (memória + SQLite) antes de ir à rede. */
  lookup(word: string, options?: { forceRefresh?: boolean }): Promise<WordLookupResult>;
}
