import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { TOKENS } from '@/core/di/tokens';
import type { User } from '@/domain/entities/User';
import type { AuthRepository, Credentials } from '@/domain/repositories/AuthRepository';

import { useDependency } from './DependenciesProvider';

type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  signIn(credentials: Credentials): Promise<void>;
  signUp(credentials: Credentials): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Estado global de autenticação (Context API). */
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useDependency<AuthRepository>(TOKENS.AuthRepository);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let active = true;
    auth
      .getCurrentUser()
      .catch(() => null)
      .then((current) => {
        if (!active) return;
        setUser(current);
        setStatus(current ? 'signedIn' : 'signedOut');
      });
    return () => {
      active = false;
    };
  }, [auth]);

  const signIn = useCallback(
    async (credentials: Credentials) => {
      const signed = await auth.signIn(credentials);
      setUser(signed);
      setStatus('signedIn');
    },
    [auth],
  );

  const signUp = useCallback(
    async (credentials: Credentials) => {
      const created = await auth.signUp(credentials);
      setUser(created);
      setStatus('signedIn');
    },
    [auth],
  );

  const signOut = useCallback(async () => {
    await auth.signOut().catch(() => undefined);
    setUser(null);
    setStatus('signedOut');
  }, [auth]);

  const value = useMemo(
    () => ({ status, user, signIn, signUp, signOut }),
    [status, user, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  return ctx;
}

/**
 * Atalho para telas protegidas. Mantém o último usuário conhecido para que a tela
 * não quebre no instante entre o logout e a navegação para o login.
 */
export function useCurrentUser(): User {
  const { user } = useAuth();
  const [lastUser, setLastUser] = useState<User | null>(user);
  // "Ajuste de estado durante o render" (padrão recomendado pelo React).
  if (user && user !== lastUser) setLastUser(user);
  const current = user ?? lastUser;
  if (!current) throw new Error('Nenhum usuário autenticado.');
  return current;
}
