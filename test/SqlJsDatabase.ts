import initSqlJs, { type Database } from 'sql.js';

import { migrate } from '@/data/database/migrations';
import type { SqlDatabase, SqlValue } from '@/data/database/SqlDatabase';

/**
 * Implementação de `SqlDatabase` com SQLite real compilado para WebAssembly (sql.js).
 * Permite testar as queries e migrações dos repositórios em Node, sem emulador.
 */
export class SqlJsDatabase implements SqlDatabase {
  private constructor(readonly raw: Database) {}

  static async create({ migrated = true } = {}): Promise<SqlJsDatabase> {
    const SQL = await initSqlJs();
    const db = new SqlJsDatabase(new SQL.Database());
    if (migrated) await migrate(db);
    return db;
  }

  async execAsync(source: string) {
    this.raw.exec(source);
  }

  async runAsync(source: string, params: SqlValue[] = []) {
    this.raw.run(source, params);
    return { changes: this.raw.getRowsModified(), lastInsertRowId: 0 };
  }

  async getAllAsync<T>(source: string, params: SqlValue[] = []): Promise<T[]> {
    const stmt = this.raw.prepare(source);
    try {
      stmt.bind(params);
      const rows: T[] = [];
      while (stmt.step()) rows.push(stmt.getAsObject() as T);
      return rows;
    } finally {
      stmt.free();
    }
  }

  async getFirstAsync<T>(source: string, params: SqlValue[] = []): Promise<T | null> {
    const rows = await this.getAllAsync<T>(source, params);
    return rows[0] ?? null;
  }

  async withTransactionAsync(task: () => Promise<void>) {
    this.raw.exec('BEGIN');
    try {
      await task();
      this.raw.exec('COMMIT');
    } catch (error) {
      this.raw.exec('ROLLBACK');
      throw error;
    }
  }

  close() {
    this.raw.close();
  }
}
