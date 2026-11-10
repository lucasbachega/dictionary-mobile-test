import * as SecureStore from 'expo-secure-store';

/** Guarda o ID do usuário logado (modo local). */
export interface SessionStorage {
  getUserId(): Promise<string | null>;
  setUserId(userId: string): Promise<void>;
  clear(): Promise<void>;
}

const SESSION_KEY = 'dictionary.session.userId';

/** Keychain (iOS) / Keystore (Android): armazenamento criptografado do sistema. */
export class SecureStoreSessionStorage implements SessionStorage {
  getUserId() {
    return SecureStore.getItemAsync(SESSION_KEY);
  }

  setUserId(userId: string) {
    return SecureStore.setItemAsync(SESSION_KEY, userId);
  }

  clear() {
    return SecureStore.deleteItemAsync(SESSION_KEY);
  }
}

export class InMemorySessionStorage implements SessionStorage {
  private userId: string | null = null;

  async getUserId() {
    return this.userId;
  }

  async setUserId(userId: string) {
    this.userId = userId;
  }

  async clear() {
    this.userId = null;
  }
}
