import type { AppConfig } from '@/core/config/env';
import { AppError } from '@/core/errors/AppError';
import { fetchWithTimeout, type FetchFn } from '@/core/http/fetchWithTimeout';

/** Baixa o arquivo `words_dictionary.json` do repositório dwyl/english-words. */
export class WordsRemoteDataSource {
  constructor(
    private readonly config: AppConfig,
    private readonly fetchFn: FetchFn = fetch,
  ) {}

  async fetchRawDictionary(signal?: AbortSignal): Promise<string> {
    const response = await fetchWithTimeout(this.config.wordsSourceUrl, {
      timeoutMs: this.config.wordsDownloadTimeoutMs,
      fetchFn: this.fetchFn,
      signal,
    });
    if (!response.ok) {
      throw new AppError('NETWORK', `Falha ao baixar a lista de palavras (HTTP ${response.status}).`);
    }
    return response.text();
  }
}
