import { randomBytes, randomUUID } from 'crypto';

import { SqlJsDatabase } from '../../../test/SqlJsDatabase';
import { LocalAuthRepository } from '../repositories/LocalAuthRepository';
import { Pbkdf2PasswordHasher } from '../security/PasswordHasher';
import { InMemorySessionStorage } from '../session/SessionStorage';

async function setup() {
  const db = await SqlJsDatabase.create();
  const session = new InMemorySessionStorage();
  const hasher = new Pbkdf2PasswordHasher((n) => new Uint8Array(randomBytes(n)), 1_000);
  const repo = new LocalAuthRepository(db, hasher, session, randomUUID);
  return { db, repo, session };
}

describe('LocalAuthRepository (Diferencial 4)', () => {
  it('cria a conta, inicia a sessão e não guarda a senha em texto puro', async () => {
    const { db, repo, session } = await setup();

    const user = await repo.signUp({ email: ' Lucas@Example.com ', password: 'secret123' });

    expect(user.email).toBe('lucas@example.com');
    expect(await session.getUserId()).toBe(user.id);
    expect(await repo.getCurrentUser()).toEqual(user);

    const row = await db.getFirstAsync<{ password_hash: string }>('SELECT password_hash FROM users');
    expect(row?.password_hash).not.toContain('secret123');
    expect(row?.password_hash).toHaveLength(64);
  });

  it('não permite dois cadastros com o mesmo e-mail', async () => {
    const { repo } = await setup();
    await repo.signUp({ email: 'a@b.com', password: 'secret123' });
    await expect(repo.signUp({ email: 'A@B.com', password: 'other123' })).rejects.toMatchObject({
      code: 'EMAIL_IN_USE',
    });
  });

  it('entra com a senha certa e recusa a errada', async () => {
    const { repo } = await setup();
    const created = await repo.signUp({ email: 'a@b.com', password: 'secret123' });
    await repo.signOut();
    expect(await repo.getCurrentUser()).toBeNull();

    await expect(repo.signIn({ email: 'a@b.com', password: 'wrong-pass' })).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
    await expect(repo.signIn({ email: 'nobody@b.com', password: 'secret123' })).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });

    const signed = await repo.signIn({ email: 'A@b.com', password: 'secret123' });
    expect(signed.id).toBe(created.id);
  });

  it('valida os dados do cadastro', async () => {
    const { repo } = await setup();
    await expect(repo.signUp({ email: 'invalid', password: 'secret123' })).rejects.toMatchObject({
      code: 'VALIDATION',
    });
    await expect(repo.signUp({ email: 'a@b.com', password: '123' })).rejects.toMatchObject({
      code: 'VALIDATION',
    });
  });
});
