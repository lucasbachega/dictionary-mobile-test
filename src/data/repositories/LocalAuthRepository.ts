import { AppError } from '@/core/errors/AppError';
import type { User } from '@/domain/entities/User';
import type { AuthRepository, Credentials } from '@/domain/repositories/AuthRepository';
import { hasErrors, normalizeEmail, validateCredentials } from '@/domain/validation';

import type { SqlDatabase } from '../database/SqlDatabase';
import type { PasswordHasher } from '../security/PasswordHasher';
import type { SessionStorage } from '../session/SessionStorage';
import type { Clock } from './CachedDictionaryRepository';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  salt: string;
}

/** Diferencial 4 (modo local): usuários e senhas (hash PBKDF2) no SQLite do aparelho. */
export class LocalAuthRepository implements AuthRepository {
  constructor(
    private readonly db: SqlDatabase,
    private readonly hasher: PasswordHasher,
    private readonly session: SessionStorage,
    private readonly generateId: () => string,
    private readonly now: Clock = Date.now,
  ) {}

  async getCurrentUser(): Promise<User | null> {
    const userId = await this.session.getUserId();
    if (!userId) return null;

    const row = await this.db.getFirstAsync<UserRow>('SELECT id, email FROM users WHERE id = ?', [
      userId,
    ]);
    if (!row) {
      await this.session.clear();
      return null;
    }
    return { id: row.id, email: row.email };
  }

  async signUp({ email, password }: Credentials): Promise<User> {
    this.assertValid(email, password);
    const normalized = normalizeEmail(email);

    const existing = await this.findByEmail(normalized);
    if (existing) throw new AppError('EMAIL_IN_USE');

    const salt = this.hasher.generateSalt();
    const passwordHash = await this.hasher.hash(password, salt);
    const user: User = { id: this.generateId(), email: normalized };

    await this.db.runAsync(
      'INSERT INTO users (id, email, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)',
      [user.id, user.email, passwordHash, salt, this.now()],
    );
    await this.session.setUserId(user.id);
    return user;
  }

  async signIn({ email, password }: Credentials): Promise<User> {
    const row = await this.findByEmail(normalizeEmail(email));
    // Mesma mensagem para e-mail inexistente e senha errada: não revela quais e-mails existem.
    if (!row) throw new AppError('INVALID_CREDENTIALS');

    const valid = await this.hasher.verify(password, row.salt, row.password_hash);
    if (!valid) throw new AppError('INVALID_CREDENTIALS');

    await this.session.setUserId(row.id);
    return { id: row.id, email: row.email };
  }

  async signOut(): Promise<void> {
    await this.session.clear();
  }

  private findByEmail(email: string) {
    return this.db.getFirstAsync<UserRow>(
      'SELECT id, email, password_hash, salt FROM users WHERE email = ?',
      [email],
    );
  }

  private assertValid(email: string, password: string) {
    const errors = validateCredentials(email, password);
    if (hasErrors(errors)) {
      throw new AppError('VALIDATION', errors.email ?? errors.password);
    }
  }
}
