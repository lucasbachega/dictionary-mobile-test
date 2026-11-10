import type { User } from '../entities/User';

export interface Credentials {
  email: string;
  password: string;
}

export interface AuthRepository {
  getCurrentUser(): Promise<User | null>;
  signIn(credentials: Credentials): Promise<User>;
  signUp(credentials: Credentials): Promise<User>;
  signOut(): Promise<void>;
}
