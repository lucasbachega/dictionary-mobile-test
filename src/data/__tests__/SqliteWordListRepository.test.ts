import { SqlJsDatabase } from '../../../test/SqlJsDatabase';
import type { WordsRemoteDataSource } from '../datasources/WordsRemoteDataSource';
import { SqliteWordListRepository } from '../repositories/SqliteWordListRepository';

const RAW = JSON.stringify(
  Object.fromEntries(
    ['a', 'aa', 'aah', 'aardvark', 'abacus', 'b', 'ba', 'baby', 'hello', 'help', 'helpful', 'zoo'].map(
      (w) => [w, 1],
    ),
  ),
);

async function setup(raw = RAW) {
  const db = await SqlJsDatabase.create();
  const fetchRawDictionary = jest.fn().mockResolvedValue(raw);
  const remote = { fetchRawDictionary } as unknown as WordsRemoteDataSource;
  const repo = new SqliteWordListRepository(db, remote);
  return { db, repo, fetchRawDictionary };
}

describe('SqliteWordListRepository', () => {
  it('importa o words_dictionary.json para o SQLite uma única vez', async () => {
    const { repo, fetchRawDictionary } = await setup();
    const stages: string[] = [];

    expect(await repo.isSeeded()).toBe(false);
    expect(await repo.seed((s) => stages.push(s))).toBe(12);
    expect(await repo.isSeeded()).toBe(true);
    expect(stages).toEqual(['downloading', 'saving', 'done']);

    await repo.seed();
    expect(fetchRawDictionary).toHaveBeenCalledTimes(1);
  });

  it('pagina por cursor sem repetir nem pular palavras (rolagem infinita)', async () => {
    const { repo } = await setup();
    await repo.seed();

    const seen: string[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      const page = await repo.getPage({ cursor, limit: 5 });
      seen.push(...page.words);
      cursor = page.nextCursor;
      pages++;
    } while (cursor);

    expect(pages).toBe(3);
    expect(seen).toHaveLength(12);
    expect(new Set(seen).size).toBe(12);
    expect(seen).toEqual([...seen].sort());
  });

  it('filtra por prefixo (busca), ignorando maiúsculas', async () => {
    const { repo } = await setup();
    await repo.seed();

    const page = await repo.getPage({ limit: 10, prefix: ' HEL' });
    expect(page.words).toEqual(['hello', 'help', 'helpful']);
    expect(page.nextCursor).toBeNull();
  });

  it('encontra a palavra anterior e a próxima (Voltar/Próximo)', async () => {
    const { repo } = await setup();
    await repo.seed();

    expect(await repo.getNeighbor('hello', 'next')).toBe('help');
    expect(await repo.getNeighbor('hello', 'previous')).toBe('baby');
    expect(await repo.getNeighbor('a', 'previous')).toBeNull();
    expect(await repo.getNeighbor('zoo', 'next')).toBeNull();
  });

  it('rejeita um arquivo inválido sem marcar a importação como concluída', async () => {
    const { repo } = await setup('<html>not json</html>');
    await expect(repo.seed()).rejects.toThrow('formato inválido');
    expect(await repo.isSeeded()).toBe(false);
  });
});
