import type { UserWordEntry } from '@/domain/entities/Word';
import type { UserWordsRepository } from '@/domain/repositories/UserWordsRepository';
import { normalizeWord } from '@/domain/validation';

import type { SqlDatabase } from '../database/SqlDatabase';
import type { Clock } from './CachedDictionaryRepository';

export class SqliteUserWordsRepository implements UserWordsRepository {
  constructor(
    private readonly db: SqlDatabase,
    private readonly now: Clock = Date.now,
  ) {}

  listFavorites(userId: string): Promise<UserWordEntry[]> {
    return this.db.getAllAsync<UserWordEntry>(
      'SELECT word, created_at AS date FROM favorites WHERE user_id = ? ORDER BY created_at DESC, word',
      [userId],
    );
  }

  async isFavorite(userId: string, word: string): Promise<boolean> {
    const row = await this.db.getFirstAsync<{ found: number }>(
      'SELECT 1 AS found FROM favorites WHERE user_id = ? AND word = ?',
      [userId, normalizeWord(word)],
    );
    return !!row;
  }

  async addFavorite(userId: string, word: string): Promise<void> {
    await this.db.runAsync(
      'INSERT OR IGNORE INTO favorites (user_id, word, created_at) VALUES (?, ?, ?)',
      [userId, normalizeWord(word), this.now()],
    );
  }

  async removeFavorite(userId: string, word: string): Promise<void> {
    await this.db.runAsync('DELETE FROM favorites WHERE user_id = ? AND word = ?', [
      userId,
      normalizeWord(word),
    ]);
  }

  listHistory(userId: string): Promise<UserWordEntry[]> {
    return this.db.getAllAsync<UserWordEntry>(
      'SELECT word, viewed_at AS date FROM history WHERE user_id = ? ORDER BY viewed_at DESC, word',
      [userId],
    );
  }

  async addToHistory(userId: string, word: string): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO history (user_id, word, viewed_at) VALUES (?, ?, ?)
       ON CONFLICT(user_id, word) DO UPDATE SET viewed_at = excluded.viewed_at`,
      [userId, normalizeWord(word), this.now()],
    );
  }

  async clearHistory(userId: string): Promise<void> {
    await this.db.runAsync('DELETE FROM history WHERE user_id = ?', [userId]);
  }
}
