import type { AppConfig } from '@/core/config/env';
import type { WordLookupResult } from '@/domain/entities/Word';
import type { DictionaryRepository } from '@/domain/repositories/DictionaryRepository';
import { normalizeWord } from '@/domain/validation';

import type { DictionaryApiDataSource } from '../datasources/DictionaryApiDataSource';
import type { CachedLookup, WordCacheDataSource } from '../datasources/WordCacheDataSource';
import { mapEntriesToWordDetails } from '../mappers/dictionaryMapper';

export type Clock = () => number;

/**
 * Obrigatório 2 — cache das requisições em duas camadas:
 *  1. memória (Map) para navegação instantânea durante a sessão;
 *  2. SQLite para sobreviver a reinícios do app (e funcionar offline).
 *
 * Também deduplica requisições simultâneas para a mesma palavra e, se a rede
 * falhar, devolve um resultado expirado do cache em vez de erro.
 */
export class CachedDictionaryRepository implements DictionaryRepository {
  private readonly memory = new Map<string, CachedLookup>();
  private readonly inFlight = new Map<string, Promise<CachedLookup>>();

  constructor(
    private readonly api: DictionaryApiDataSource,
    private readonly cache: WordCacheDataSource,
    private readonly config: Pick<AppConfig, 'cacheTtlFoundMs' | 'cacheTtlNotFoundMs'>,
    private readonly now: Clock = Date.now,
  ) {}

  async lookup(rawWord: string, options: { forceRefresh?: boolean } = {}): Promise<WordLookupResult> {
    const word = normalizeWord(rawWord);
    let stale: CachedLookup | null = null;

    if (!options.forceRefresh) {
      const cached = this.memory.get(word) ?? (await this.readPersisted(word));
      if (cached) {
        this.memory.set(word, cached);
        if (this.isFresh(cached)) return this.toResult(word, cached, true);
        stale = cached;
      }
    }

    try {
      const fresh = await this.fetchOnce(word);
      return this.toResult(word, fresh, false);
    } catch (error) {
      if (stale) return this.toResult(word, stale, true);
      throw error;
    }
  }

  private fetchOnce(word: string): Promise<CachedLookup> {
    const pending = this.inFlight.get(word);
    if (pending) return pending;

    const request = this.fetchAndStore(word).finally(() => this.inFlight.delete(word));
    this.inFlight.set(word, request);
    return request;
  }

  private async fetchAndStore(word: string): Promise<CachedLookup> {
    const response = await this.api.fetchEntries(word);
    const cachedAt = this.now();
    const value: CachedLookup =
      response.status === 'found'
        ? { status: 'found', details: mapEntriesToWordDetails(word, response.entries), cachedAt }
        : { status: 'not_found', cachedAt };

    this.memory.set(word, value);
    try {
      await this.cache.set(word, value);
    } catch {
      // Falha ao persistir o cache não deve impedir o usuário de ver a palavra.
    }
    return value;
  }

  private async readPersisted(word: string): Promise<CachedLookup | null> {
    try {
      return await this.cache.get(word);
    } catch {
      return null;
    }
  }

  private isFresh(entry: CachedLookup): boolean {
    const ttl =
      entry.status === 'found' ? this.config.cacheTtlFoundMs : this.config.cacheTtlNotFoundMs;
    return this.now() - entry.cachedAt < ttl;
  }

  private toResult(word: string, entry: CachedLookup, fromCache: boolean): WordLookupResult {
    return entry.status === 'found'
      ? { status: 'found', word, details: entry.details, fromCache }
      : { status: 'not_found', word, fromCache };
  }
}
