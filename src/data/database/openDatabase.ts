import * as SQLite from 'expo-sqlite';

import type { SqlDatabase, SqlValue } from './SqlDatabase';
import { migrate } from './migrations';

const DATABASE_NAME = 'dictionary.db';

/** Adapta o `SQLiteDatabase` do expo-sqlite para a interface `SqlDatabase`. */
class ExpoSqlDatabase implements SqlDatabase {
  constructor(private readonly db: SQLite.SQLiteDatabase) {}

  execAsync(source: string) {
    return this.db.execAsync(source);
  }

  runAsync(source: string, params: SqlValue[] = []) {
    return this.db.runAsync(source, params);
  }

  getAllAsync<T>(source: string, params: SqlValue[] = []) {
    return this.db.getAllAsync<T>(source, params);
  }

  getFirstAsync<T>(source: string, params: SqlValue[] = []) {
    return this.db.getFirstAsync<T>(source, params);
  }

  withTransactionAsync(task: () => Promise<void>) {
    return this.db.withTransactionAsync(task);
  }
}

export async function openDatabase(): Promise<SqlDatabase> {
  const native = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await native.execAsync('PRAGMA journal_mode = WAL;');
  const db = new ExpoSqlDatabase(native);
  await migrate(db);
  return db;
}
