export type SqlValue = string | number | null;

export interface SqlRunResult {
  changes: number;
  lastInsertRowId: number;
}

/**
 * Subconjunto da API do `expo-sqlite` usado pelos repositórios.
 * Depender desta interface (e não do módulo nativo) permite testar
 * os repositórios com SQLite real em Node (sql.js) — ver `test/SqlJsDatabase.ts`.
 */
export interface SqlDatabase {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params?: SqlValue[]): Promise<SqlRunResult>;
  getAllAsync<T>(source: string, params?: SqlValue[]): Promise<T[]>;
  getFirstAsync<T>(source: string, params?: SqlValue[]): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
