import { AppError } from '@/core/errors/AppError';

import { helloEntries } from '../../../test/fixtures';
import { SqlJsDatabase } from '../../../test/SqlJsDatabase';
import type { DictionaryApiDataSource } from '../datasources/DictionaryApiDataSource';
import { WordCacheDataSource } from '../datasources/WordCacheDataSource';
import { CachedDictionaryRepository } from '../repositories/CachedDictionaryRepository';

const DAY = 24 * 60 * 60 * 1000;
const ttl = { cacheTtlFoundMs: 7 * DAY, cacheTtlNotFoundMs: DAY };

function setup() {
  let now = 1_000_000;
  const fetchEntries = jest.fn<ReturnType<DictionaryApiDataSource['fetchEntries']>, [string]>();
  const api = { fetchEntries } as unknown as DictionaryApiDataSource;
  return {
    fetchEntries,
    advance: (ms: number) => (now += ms),
    build: async (db?: SqlJsDatabase) => {
      const database = db ?? (await SqlJsDatabase.create());
      const cache = new WordCacheDataSource(database);
      return {
        db: database,
        cache,
        repo: new CachedDictionaryRepository(api, cache, ttl, () => now),
      };
    },
  };
}

describe('CachedDictionaryRepository (Obrigatório 2 — cache)', () => {
  it('busca na API na primeira vez e responde do cache na segunda', async () => {
    const { fetchEntries, build } = setup();
    fetchEntries.mockResolvedValue({ status: 'found', entries: helloEntries });
    const { repo } = await build();

    const first = await repo.lookup('hello');
    const second = await repo.lookup('  HELLO ');

    expect(first).toMatchObject({ status: 'found', fromCache: false });
    expect(second).toMatchObject({ status: 'found', fromCache: true });
    expect(fetchEntries).toHaveBeenCalledTimes(1);
  });

  it('persiste o cache no SQLite: uma nova instância (app reiniciado) não chama a API', async () => {
    const { fetchEntries, build } = setup();
    fetchEntries.mockResolvedValue({ status: 'found', entries: helloEntries });
    const { repo, db } = await build();
    await repo.lookup('hello');

    const { repo: afterRestart } = await build(db);
    const result = await afterRestart.lookup('hello');

    expect(result).toMatchObject({ status: 'found', fromCache: true });
    if (result.status === 'found') expect(result.details.phonetic).toBe('həˈləʊ');
    expect(fetchEntries).toHaveBeenCalledTimes(1);
  });

  it('também guarda em cache palavras sem definição (404)', async () => {
    const { fetchEntries, build } = setup();
    fetchEntries.mockResolvedValue({ status: 'not_found' });
    const { repo } = await build();

    await repo.lookup('aalii');
    const again = await repo.lookup('aalii');

    expect(again).toEqual({ status: 'not_found', word: 'aalii', fromCache: true });
    expect(fetchEntries).toHaveBeenCalledTimes(1);
  });

  it('deduplica requisições simultâneas para a mesma palavra', async () => {
    const { fetchEntries, build } = setup();
    let resolve!: (v: Awaited<ReturnType<DictionaryApiDataSource['fetchEntries']>>) => void;
    fetchEntries.mockReturnValue(new Promise((r) => (resolve = r)));
    const { repo } = await build();

    const a = repo.lookup('hello');
    const b = repo.lookup('hello');
    await new Promise((r) => setTimeout(r, 0));
    resolve({ status: 'found', entries: helloEntries });

    await expect(Promise.all([a, b])).resolves.toHaveLength(2);
    expect(fetchEntries).toHaveBeenCalledTimes(1);
  });

  it('revalida após o TTL expirar', async () => {
    const { fetchEntries, build, advance } = setup();
    fetchEntries.mockResolvedValue({ status: 'not_found' });
    const { repo } = await build();

    await repo.lookup('word');
    advance(DAY + 1);
    await repo.lookup('word');

    expect(fetchEntries).toHaveBeenCalledTimes(2);
  });

  it('sem internet, devolve o cache expirado em vez de erro', async () => {
    const { fetchEntries, build, advance } = setup();
    fetchEntries.mockResolvedValueOnce({ status: 'found', entries: helloEntries });
    const { repo } = await build();
    await repo.lookup('hello');

    advance(8 * DAY);
    fetchEntries.mockRejectedValueOnce(new AppError('NETWORK'));

    await expect(repo.lookup('hello')).resolves.toMatchObject({ status: 'found', fromCache: true });
  });

  it('propaga o erro de rede quando não há nada em cache', async () => {
    const { fetchEntries, build } = setup();
    fetchEntries.mockRejectedValue(new AppError('TIMEOUT'));
    const { repo } = await build();

    await expect(repo.lookup('hello')).rejects.toMatchObject({ code: 'TIMEOUT' });
  });

  it('forceRefresh ignora o cache', async () => {
    const { fetchEntries, build } = setup();
    fetchEntries.mockResolvedValue({ status: 'found', entries: helloEntries });
    const { repo } = await build();

    await repo.lookup('hello');
    const refreshed = await repo.lookup('hello', { forceRefresh: true });

    expect(refreshed).toMatchObject({ fromCache: false });
    expect(fetchEntries).toHaveBeenCalledTimes(2);
  });
});
