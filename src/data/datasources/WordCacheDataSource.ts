import type { WordDetails } from '@/domain/entities/Word';

import type { SqlDatabase } from '../database/SqlDatabase';

export type CachedLookup =
  | { status: 'found'; details: WordDetails; cachedAt: number }
  | { status: 'not_found'; cachedAt: number };

/** Cache persistente (SQLite) das respostas do dicionário. */
export class WordCacheDataSource {
  constructor(private readonly db: SqlDatabase) {}

  async get(word: string): Promise<CachedLookup | null> {
    const row = await this.db.getFirstAsync<{
      status: 'found' | 'not_found';
      payload: string | null;
      cached_at: number;
    }>('SELECT status, payload, cached_at FROM word_cache WHERE word = ?', [word]);

    if (!row) return null;
    if (row.status === 'not_found') return { status: 'not_found', cachedAt: row.cached_at };
    if (!row.payload) return null;

    try {
      return { status: 'found', details: JSON.parse(row.payload) as WordDetails, cachedAt: row.cached_at };
    } catch {
      return null; // payload corrompido: trata como cache miss
    }
  }

  async set(word: string, value: CachedLookup): Promise<void> {
    const payload = value.status === 'found' ? JSON.stringify(value.details) : null;
    await this.db.runAsync(
      `INSERT INTO word_cache (word, status, payload, cached_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(word) DO UPDATE SET status = excluded.status, payload = excluded.payload, cached_at = excluded.cached_at`,
      [word, value.status, payload, value.cachedAt],
    );
  }
}
