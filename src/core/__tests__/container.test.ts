import { container as root } from 'tsyringe';

import { buildConfig } from '../config/env';
import { registerDependencies } from '../di/container';
import { TOKENS } from '../di/tokens';
import { LocalAuthRepository } from '@/data/repositories/LocalAuthRepository';
import { SqliteUserWordsRepository } from '@/data/repositories/SqliteUserWordsRepository';
import { SupabaseAuthRepository } from '@/data/repositories/SupabaseAuthRepository';
import { SupabaseUserWordsRepository } from '@/data/repositories/SupabaseUserWordsRepository';
import { CachedDictionaryRepository } from '@/data/repositories/CachedDictionaryRepository';

import { SqlJsDatabase } from '../../../test/SqlJsDatabase';

describe('registerDependencies (Diferencial 2 — DI)', () => {
  it('registra as implementações locais por padrão, como singletons', async () => {
    const db = await SqlJsDatabase.create();
    const c = registerDependencies(buildConfig({}), db, root.createChildContainer());

    expect(c.resolve(TOKENS.AuthRepository)).toBeInstanceOf(LocalAuthRepository);
    expect(c.resolve(TOKENS.UserWordsRepository)).toBeInstanceOf(SqliteUserWordsRepository);
    expect(c.resolve(TOKENS.DictionaryRepository)).toBeInstanceOf(CachedDictionaryRepository);
    expect(c.resolve(TOKENS.DictionaryRepository)).toBe(c.resolve(TOKENS.DictionaryRepository));
  });

  it('troca para o Supabase quando configurado', async () => {
    const db = await SqlJsDatabase.create();
    const config = buildConfig({
      EXPO_PUBLIC_SUPABASE_URL: 'https://demo.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    });
    const c = registerDependencies(config, db, root.createChildContainer());

    expect(c.resolve(TOKENS.AuthRepository)).toBeInstanceOf(SupabaseAuthRepository);
    expect(c.resolve(TOKENS.UserWordsRepository)).toBeInstanceOf(SupabaseUserWordsRepository);
  });
});
