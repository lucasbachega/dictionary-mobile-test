import type { AuthError, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';

import { AppError } from '@/core/errors/AppError';
import type { User } from '@/domain/entities/User';
import type { AuthRepository, Credentials } from '@/domain/repositories/AuthRepository';
import { normalizeEmail } from '@/domain/validation';

/** Diferencial 4 (modo remoto): autenticação por e-mail/senha no Supabase Auth. */
export class SupabaseAuthRepository implements AuthRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getCurrentUser(): Promise<User | null> {
    const { data } = await this.client.auth.getSession();
    return data.session ? toUser(data.session.user) : null;
  }

  async signIn({ email, password }: Credentials): Promise<User> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });
    if (error) throw mapAuthError(error);
    return toUser(data.user);
  }

  async signUp({ email, password }: Credentials): Promise<User> {
    const { data, error } = await this.client.auth.signUp({
      email: normalizeEmail(email),
      password,
    });
    if (error) throw mapAuthError(error);
    // Projeto com "Confirm email" ativo: usuário criado, mas sem sessão ainda.
    if (!data.session || !data.user) throw new AppError('EMAIL_CONFIRMATION_REQUIRED');
    return toUser(data.user);
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throw mapAuthError(error);
  }
}

function toUser(user: SupabaseUser): User {
  return { id: user.id, email: user.email ?? '' };
}

function mapAuthError(error: AuthError): AppError {
  const code = error.code ?? '';
  if (code === 'invalid_credentials') return new AppError('INVALID_CREDENTIALS', undefined, error);
  if (code === 'user_already_exists' || code === 'email_exists')
    return new AppError('EMAIL_IN_USE', undefined, error);
  if (code === 'email_not_confirmed')
    return new AppError('EMAIL_CONFIRMATION_REQUIRED', 'Confirme seu e-mail antes de entrar.', error);
  if (error.status === 0 || /network|fetch/i.test(error.message))
    return new AppError('NETWORK', undefined, error);
  return new AppError('UNKNOWN', error.message, error);
}
