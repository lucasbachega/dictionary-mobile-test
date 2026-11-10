/** Tokens de injeção usados pelo container (tsyringe). */
export const TOKENS = {
  Config: 'Config',
  Database: 'Database',
  Fetch: 'Fetch',
  Clock: 'Clock',
  WordsRemoteDataSource: 'WordsRemoteDataSource',
  DictionaryApiDataSource: 'DictionaryApiDataSource',
  WordCacheDataSource: 'WordCacheDataSource',
  WordListRepository: 'WordListRepository',
  DictionaryRepository: 'DictionaryRepository',
  UserWordsRepository: 'UserWordsRepository',
  AuthRepository: 'AuthRepository',
  SessionStorage: 'SessionStorage',
  PasswordHasher: 'PasswordHasher',
  SupabaseClient: 'SupabaseClient',
} as const;

export type Token = (typeof TOKENS)[keyof typeof TOKENS];
