import type { SupabaseClient } from '@supabase/supabase-js';

import { AppError } from '@/core/errors/AppError';
import type { UserWordEntry } from '@/domain/entities/Word';
import type { UserWordsRepository } from '@/domain/repositories/UserWordsRepository';
import { normalizeWord } from '@/domain/validation';

/**
 * Favoritos e histórico nas tabelas `favorites` e `history` do Supabase
 * (schema e políticas RLS em `supabase/schema.sql`).
 */
export class SupabaseUserWordsRepository implements UserWordsRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listFavorites(userId: string): Promise<UserWordEntry[]> {
    const { data, error } = await this.client
      .from('favorites')
      .select('word, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw toAppError(error);
    return (data ?? []).map((row) => ({ word: row.word, date: Date.parse(row.created_at) }));
  }

  async isFavorite(userId: string, word: string): Promise<boolean> {
    const { count, error } = await this.client
      .from('favorites')
      .select('word', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('word', normalizeWord(word));
    if (error) throw toAppError(error);
    return (count ?? 0) > 0;
  }

  async addFavorite(userId: string, word: string): Promise<void> {
    const { error } = await this.client
      .from('favorites')
      .upsert({ user_id: userId, word: normalizeWord(word) }, { onConflict: 'user_id,word' });
    if (error) throw toAppError(error);
  }

  async removeFavorite(userId: string, word: string): Promise<void> {
    const { error } = await this.client
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('word', normalizeWord(word));
    if (error) throw toAppError(error);
  }

  async listHistory(userId: string): Promise<UserWordEntry[]> {
    const { data, error } = await this.client
      .from('history')
      .select('word, viewed_at')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false });
    if (error) throw toAppError(error);
    return (data ?? []).map((row) => ({ word: row.word, date: Date.parse(row.viewed_at) }));
  }

  async addToHistory(userId: string, word: string): Promise<void> {
    const { error } = await this.client.from('history').upsert(
      { user_id: userId, word: normalizeWord(word), viewed_at: new Date().toISOString() },
      { onConflict: 'user_id,word' },
    );
    if (error) throw toAppError(error);
  }

  async clearHistory(userId: string): Promise<void> {
    const { error } = await this.client.from('history').delete().eq('user_id', userId);
    if (error) throw toAppError(error);
  }
}

function toAppError(error: { message: string }): AppError {
  return new AppError('NETWORK', 'Não foi possível sincronizar com o servidor.', error);
}
