import type { AppConfig } from '@/core/config/env';
import { AppError } from '@/core/errors/AppError';
import { fetchWithTimeout, type FetchFn } from '@/core/http/fetchWithTimeout';

/** Formato bruto retornado por GET /api/v2/entries/en/<word> (Free Dictionary API). */
export interface ApiPhonetic {
  text?: string;
  audio?: string;
  sourceUrl?: string;
}

export interface ApiDefinition {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

export interface ApiMeaning {
  partOfSpeech: string;
  definitions: ApiDefinition[];
  synonyms?: string[];
  antonyms?: string[];
}

export interface ApiEntry {
  word: string;
  phonetic?: string;
  phonetics?: ApiPhonetic[];
  meanings?: ApiMeaning[];
  sourceUrls?: string[];
}

export type ApiLookupResponse =
  | { status: 'found'; entries: ApiEntry[] }
  | { status: 'not_found' };

export class DictionaryApiDataSource {
  constructor(
    private readonly config: AppConfig,
    private readonly fetchFn: FetchFn = fetch,
  ) {}

  async fetchEntries(word: string): Promise<ApiLookupResponse> {
    const url = `${this.config.dictionaryApiBaseUrl}/${encodeURIComponent(word)}`;
    const response = await fetchWithTimeout(url, {
      timeoutMs: this.config.requestTimeoutMs,
      fetchFn: this.fetchFn,
      headers: { Accept: 'application/json' },
    });

    // A API responde 404 com { title: "No Definitions Found" } quando não conhece a palavra.
    if (response.status === 404) return { status: 'not_found' };
    if (!response.ok) {
      throw new AppError('NETWORK', `O dicionário respondeu com erro (HTTP ${response.status}).`);
    }

    const body: unknown = await response.json();
    if (!Array.isArray(body) || body.length === 0) return { status: 'not_found' };
    return { status: 'found', entries: body as ApiEntry[] };
  }
}
