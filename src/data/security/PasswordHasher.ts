import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

export interface PasswordHasher {
  generateSalt(): string;
  hash(password: string, salt: string): Promise<string>;
  verify(password: string, salt: string, expectedHash: string): Promise<boolean>;
}

export type RandomBytes = (size: number) => Uint8Array;

/**
 * PBKDF2-SHA256 (implementação JS pura do @noble/hashes, auditada).
 * A versão assíncrona cede o event loop entre iterações, então o hash não trava a UI.
 * Senhas nunca são guardadas em texto puro.
 */
export class Pbkdf2PasswordHasher implements PasswordHasher {
  constructor(
    private readonly randomBytes: RandomBytes,
    private readonly iterations = 20_000,
  ) {}

  generateSalt(): string {
    return bytesToHex(this.randomBytes(16));
  }

  async hash(password: string, salt: string): Promise<string> {
    const derived = await pbkdf2Async(sha256, password, salt, { c: this.iterations, dkLen: 32 });
    return bytesToHex(derived);
  }

  async verify(password: string, salt: string, expectedHash: string): Promise<boolean> {
    const actual = await this.hash(password, salt);
    return constantTimeEqual(actual, expectedHash);
  }
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
