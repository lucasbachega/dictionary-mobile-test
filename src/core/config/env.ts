/**
 * Configuração centralizada. Variáveis `EXPO_PUBLIC_*` são embutidas no bundle pelo Expo.
 */
export type BackendMode = 'local' | 'supabase';

export interface AppConfig {
  backend: BackendMode;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  dictionaryApiBaseUrl: string;
  wordsSourceUrl: string;
  requestTimeoutMs: number;
  wordsDownloadTimeoutMs: number;
  /** Tempo de vida do cache de palavras encontradas (ms). */
  cacheTtlFoundMs: number;
  /** Tempo de vida do cache de palavras sem definição (404) (ms). */
  cacheTtlNotFoundMs: number;
  pageSize: number;
}

const DAY = 24 * 60 * 60 * 1000;

export function buildConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL?.trim() || undefined;
  const supabaseAnonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || undefined;

  return {
    backend: supabaseUrl && supabaseAnonKey ? 'supabase' : 'local',
    supabaseUrl,
    supabaseAnonKey,
    dictionaryApiBaseUrl: 'https://api.dictionaryapi.dev/api/v2/entries/en',
    wordsSourceUrl:
      'https://raw.githubusercontent.com/dwyl/english-words/master/words_dictionary.json',
    requestTimeoutMs: 10_000,
    wordsDownloadTimeoutMs: 60_000,
    cacheTtlFoundMs: 30 * DAY,
    cacheTtlNotFoundMs: 1 * DAY,
    pageSize: 60,
  };
}

// Acesso explícito (não dinâmico) para que o Expo consiga inlinar as variáveis no bundle.
export const appConfig = buildConfig({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});
