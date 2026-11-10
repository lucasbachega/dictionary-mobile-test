import type { UserWordEntry } from '../entities/Word';

/** Favoritos e histórico, sempre associados ao ID do usuário autenticado. */
export interface UserWordsRepository {
  listFavorites(userId: string): Promise<UserWordEntry[]>;
  isFavorite(userId: string, word: string): Promise<boolean>;
  addFavorite(userId: string, word: string): Promise<void>;
  removeFavorite(userId: string, word: string): Promise<void>;

  listHistory(userId: string): Promise<UserWordEntry[]>;
  addToHistory(userId: string, word: string): Promise<void>;
  clearHistory(userId: string): Promise<void>;
}
