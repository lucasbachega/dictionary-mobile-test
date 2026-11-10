import { SqlJsDatabase } from '../../../test/SqlJsDatabase';
import { SqliteUserWordsRepository } from '../repositories/SqliteUserWordsRepository';

async function setup() {
  let now = 0;
  const db = await SqlJsDatabase.create();
  const repo = new SqliteUserWordsRepository(db, () => ++now);
  return { repo };
}

describe('SqliteUserWordsRepository', () => {
  it('salva e remove favoritos por usuário', async () => {
    const { repo } = await setup();

    await repo.addFavorite('user-1', 'Hello');
    await repo.addFavorite('user-1', 'world');
    await repo.addFavorite('user-1', 'hello'); // duplicado é ignorado
    await repo.addFavorite('user-2', 'other');

    expect((await repo.listFavorites('user-1')).map((e) => e.word)).toEqual(['world', 'hello']);
    expect(await repo.isFavorite('user-1', 'HELLO')).toBe(true);
    expect(await repo.isFavorite('user-2', 'hello')).toBe(false);

    await repo.removeFavorite('user-1', 'hello');
    expect((await repo.listFavorites('user-1')).map((e) => e.word)).toEqual(['world']);
  });

  it('mantém o histórico sem duplicatas, da visualização mais recente para a mais antiga', async () => {
    const { repo } = await setup();

    await repo.addToHistory('user-1', 'a');
    await repo.addToHistory('user-1', 'b');
    await repo.addToHistory('user-1', 'a');
    await repo.addToHistory('user-2', 'c');

    expect((await repo.listHistory('user-1')).map((e) => e.word)).toEqual(['a', 'b']);
    expect((await repo.listHistory('user-2')).map((e) => e.word)).toEqual(['c']);

    await repo.clearHistory('user-1');
    expect(await repo.listHistory('user-1')).toEqual([]);
    expect(await repo.listHistory('user-2')).toHaveLength(1);
  });
});
