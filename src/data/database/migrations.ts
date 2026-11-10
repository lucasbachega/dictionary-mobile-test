import type { SqlDatabase } from './SqlDatabase';

/**
 * Migrações versionadas via `PRAGMA user_version`.
 * Cada posição do array representa a versão `index + 1`.
 */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE IF NOT EXISTS meta (
    key   TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );

  -- Lista de palavras (words_dictionary.json). WITHOUT ROWID: a PK já é o índice ordenado.
  CREATE TABLE IF NOT EXISTS words (
    word TEXT PRIMARY KEY NOT NULL
  ) WITHOUT ROWID;

  -- Cache das respostas da Free Dictionary API (Obrigatório 2).
  CREATE TABLE IF NOT EXISTS word_cache (
    word      TEXT PRIMARY KEY NOT NULL,
    status    TEXT NOT NULL CHECK (status IN ('found', 'not_found')),
    payload   TEXT,
    cached_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY NOT NULL,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    salt          TEXT NOT NULL,
    created_at    INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS favorites (
    user_id    TEXT NOT NULL,
    word       TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, word)
  );
  CREATE INDEX IF NOT EXISTS idx_favorites_user_date ON favorites (user_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS history (
    user_id   TEXT NOT NULL,
    word      TEXT NOT NULL,
    viewed_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, word)
  );
  CREATE INDEX IF NOT EXISTS idx_history_user_date ON history (user_id, viewed_at DESC);
  `,
];

export const DATABASE_VERSION = MIGRATIONS.length;

export async function migrate(db: SqlDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current >= DATABASE_VERSION) return;

  for (let version = current + 1; version <= DATABASE_VERSION; version++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[version - 1]);
    });
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }
}
