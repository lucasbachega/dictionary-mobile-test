import { buildConfig } from '../config/env';

describe('buildConfig', () => {
  it('usa o back-end local quando o Supabase não está configurado', () => {
    expect(buildConfig({}).backend).toBe('local');
    expect(buildConfig({ EXPO_PUBLIC_SUPABASE_URL: 'https://x.supabase.co' }).backend).toBe('local');
  });

  it('usa o Supabase quando URL e chave estão presentes', () => {
    const config = buildConfig({
      EXPO_PUBLIC_SUPABASE_URL: 'https://x.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'key',
    });
    expect(config.backend).toBe('supabase');
  });
});
