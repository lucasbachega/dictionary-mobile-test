import { AppError } from '@/core/errors/AppError';
import { normalizeWord } from '@/domain/validation';
import type {
  SeedStage,
  WordListRepository,
  WordPage,
} from '@/domain/repositories/WordListRepository';

import type { SqlDatabase } from '../database/SqlDatabase';
import type { WordsRemoteDataSource } from '../datasources/WordsRemoteDataSource';

const SEEDED_KEY = 'words_seeded';
const INSERT_CHUNK_SIZE = 500;
/** Maior caractere BMP: usado como limite superior em buscas por prefixo. */
const PREFIX_UPPER_BOUND = '￿';

export class SqliteWordListRepository implements WordListRepository {
  constructor(
    private readonly db: SqlDatabase,
    private readonly remote: WordsRemoteDataSource,
  ) {}

  async isSeeded(): Promise<boolean> {
    const row = await this.db.getFirstAsync<{ value: string }>(
      'SELECT value FROM meta WHERE key = ?',
      [SEEDED_KEY],
    );
    return row?.value === '1';
  }

  async count(): Promise<number> {
    const row = await this.db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM words');
    return row?.total ?? 0;
  }

  async seed(onStage?: (stage: SeedStage) => void, signal?: AbortSignal): Promise<number> {
    if (await this.isSeeded()) {
      onStage?.('done');
      return this.count();
    }

    onStage?.('downloading');
    const raw = await this.remote.fetchRawDictionary(signal);

    onStage?.('saving');
    await this.saveWords(raw);
    await this.db.runAsync(
      'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [SEEDED_KEY, '1'],
    );

    onStage?.('done');
    return this.count();
  }

  /**
   * Caminho rápido: o próprio SQLite percorre o JSON (`json_each`) — uma única chamada
   * nativa para ~370 mil palavras. Se a build do SQLite não tiver JSON1, cai no
   * fallback com inserts em lote dentro de uma transação.
   */
  private async saveWords(raw: string): Promise<void> {
    try {
      await this.db.withTransactionAsync(async () => {
        await this.db.runAsync('DELETE FROM words');
        await this.db.runAsync(
          `INSERT OR IGNORE INTO words (word)
           SELECT lower(trim(key)) FROM json_each(?) WHERE length(trim(key)) > 0`,
          [raw],
        );
      });
      if ((await this.count()) > 0) return;
    } catch {
      // segue para o fallback
    }

    let words: string[];
    try {
      words = Object.keys(JSON.parse(raw) as Record<string, unknown>)
        .map(normalizeWord)
        .filter(Boolean);
    } catch (error) {
      throw new AppError('UNKNOWN', 'O arquivo de palavras está em um formato inválido.', error);
    }

    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync('DELETE FROM words');
      for (let i = 0; i < words.length; i += INSERT_CHUNK_SIZE) {
        const chunk = words.slice(i, i + INSERT_CHUNK_SIZE);
        const placeholders = chunk.map(() => '(?)').join(',');
        await this.db.runAsync(`INSERT OR IGNORE INTO words (word) VALUES ${placeholders}`, chunk);
      }
    });
  }

  async getPage({
    cursor,
    limit,
    prefix,
  }: {
    cursor?: string | null;
    limit: number;
    prefix?: string;
  }): Promise<WordPage> {
    const start = normalizeWord(prefix ?? '');
    const upper = start ? start + PREFIX_UPPER_BOUND : PREFIX_UPPER_BOUND;

    // Keyset pagination: estável e O(log n) por página, ao contrário de OFFSET.
    const rows = await this.db.getAllAsync<{ word: string }>(
      `SELECT word FROM words
       WHERE word > ? AND word >= ? AND word < ?
       ORDER BY word
       LIMIT ?`,
      [cursor ?? '', start, upper, limit + 1],
    );

    const hasMore = rows.length > limit;
    const words = rows.slice(0, limit).map((r) => r.word);
    return { words, nextCursor: hasMore ? words[words.length - 1] : null };
  }

  async getNeighbor(word: string, direction: 'previous' | 'next'): Promise<string | null> {
    const sql =
      direction === 'next'
        ? 'SELECT word FROM words WHERE word > ? ORDER BY word ASC LIMIT 1'
        : 'SELECT word FROM words WHERE word < ? ORDER BY word DESC LIMIT 1';
    const row = await this.db.getFirstAsync<{ word: string }>(sql, [normalizeWord(word)]);
    return row?.word ?? null;
  }
}
