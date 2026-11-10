import * as Crypto from 'expo-crypto';
import { container as rootContainer, instanceCachingFactory, type DependencyContainer } from 'tsyringe';

import type { SqlDatabase } from '@/data/database/SqlDatabase';
import { DictionaryApiDataSource } from '@/data/datasources/DictionaryApiDataSource';
import { WordCacheDataSource } from '@/data/datasources/WordCacheDataSource';
import { WordsRemoteDataSource } from '@/data/datasources/WordsRemoteDataSource';
import { CachedDictionaryRepository } from '@/data/repositories/CachedDictionaryRepository';
import { LocalAuthRepository } from '@/data/repositories/LocalAuthRepository';
import { SqliteUserWordsRepository } from '@/data/repositories/SqliteUserWordsRepository';
import { SqliteWordListRepository } from '@/data/repositories/SqliteWordListRepository';
import { SupabaseAuthRepository } from '@/data/repositories/SupabaseAuthRepository';
import { SupabaseUserWordsRepository } from '@/data/repositories/SupabaseUserWordsRepository';
import { Pbkdf2PasswordHasher, type PasswordHasher } from '@/data/security/PasswordHasher';
import { SecureStoreSessionStorage, type SessionStorage } from '@/data/session/SessionStorage';
import { createSupabaseClient } from '@/data/supabase/createSupabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { AppConfig } from '../config/env';
import { TOKENS } from './tokens';

/**
 * Diferencial 2 — Injeção de Dependência com tsyringe.
 * As telas/hooks dependem apenas das interfaces do domínio; aqui decidimos
 * qual implementação usar (SQLite local ou Supabase) a partir da configuração.
 * Nos testes, um container filho substitui qualquer peça por um fake.
 */
export function registerDependencies(
  config: AppConfig,
  db: SqlDatabase,
  target: DependencyContainer = rootContainer,
): DependencyContainer {
  const singleton = <T,>(factory: (c: DependencyContainer) => T) => ({
    useFactory: instanceCachingFactory<T>(factory),
  });

  target.register(TOKENS.Config, { useValue: config });
  target.register(TOKENS.Database, { useValue: db });
  target.register(TOKENS.Fetch, { useValue: (...args: Parameters<typeof fetch>) => fetch(...args) });

  // Fontes de dados
  target.register(TOKENS.WordsRemoteDataSource, singleton((c) =>
    new WordsRemoteDataSource(c.resolve(TOKENS.Config), c.resolve(TOKENS.Fetch))));
  target.register(TOKENS.DictionaryApiDataSource, singleton((c) =>
    new DictionaryApiDataSource(c.resolve(TOKENS.Config), c.resolve(TOKENS.Fetch))));
  target.register(TOKENS.WordCacheDataSource, singleton((c) =>
    new WordCacheDataSource(c.resolve(TOKENS.Database))));

  // Repositórios que são sempre locais (dados do aparelho)
  target.register(TOKENS.WordListRepository, singleton((c) =>
    new SqliteWordListRepository(c.resolve(TOKENS.Database), c.resolve(TOKENS.WordsRemoteDataSource))));
  target.register(TOKENS.DictionaryRepository, singleton((c) =>
    new CachedDictionaryRepository(
      c.resolve(TOKENS.DictionaryApiDataSource),
      c.resolve(TOKENS.WordCacheDataSource),
      c.resolve<AppConfig>(TOKENS.Config),
    )));

  // Repositórios do usuário: Supabase (remoto) ou SQLite (local)
  if (config.backend === 'supabase' && config.supabaseUrl && config.supabaseAnonKey) {
    const { supabaseUrl, supabaseAnonKey } = config;
    target.register(TOKENS.SupabaseClient, singleton(() =>
      createSupabaseClient(supabaseUrl, supabaseAnonKey)));
    target.register(TOKENS.AuthRepository, singleton((c) =>
      new SupabaseAuthRepository(c.resolve<SupabaseClient>(TOKENS.SupabaseClient))));
    target.register(TOKENS.UserWordsRepository, singleton((c) =>
      new SupabaseUserWordsRepository(c.resolve<SupabaseClient>(TOKENS.SupabaseClient))));
  } else {
    target.register(TOKENS.SessionStorage, singleton(() => new SecureStoreSessionStorage()));
    target.register(TOKENS.PasswordHasher, singleton(() =>
      new Pbkdf2PasswordHasher((size) => Crypto.getRandomBytes(size))));
    target.register(TOKENS.AuthRepository, singleton((c) =>
      new LocalAuthRepository(
        c.resolve(TOKENS.Database),
        c.resolve<PasswordHasher>(TOKENS.PasswordHasher),
        c.resolve<SessionStorage>(TOKENS.SessionStorage),
        () => Crypto.randomUUID(),
      )));
    target.register(TOKENS.UserWordsRepository, singleton((c) =>
      new SqliteUserWordsRepository(c.resolve(TOKENS.Database))));
  }

  return target;
}

export { rootContainer as container };
