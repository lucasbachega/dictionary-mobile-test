export interface Definition {
  definition: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
}

export interface Meaning {
  partOfSpeech: string;
  definitions: Definition[];
  synonyms: string[];
  antonyms: string[];
}

export interface Phonetic {
  text?: string;
  audioUrl?: string;
}

/** Palavra já normalizada a partir de uma ou mais entradas da Free Dictionary API. */
export interface WordDetails {
  word: string;
  /** Fonética principal exibida no card. */
  phonetic?: string;
  /** Primeiro áudio de pronúncia disponível. */
  audioUrl?: string;
  phonetics: Phonetic[];
  meanings: Meaning[];
  sourceUrls: string[];
}

export type WordLookupResult =
  | { status: 'found'; word: string; details: WordDetails; fromCache: boolean }
  | { status: 'not_found'; word: string; fromCache: boolean };

/** De qual lista o usuário abriu a palavra (define o Voltar/Próximo). */
export type WordListSource = 'all' | 'history' | 'favorites';

export interface UserWordEntry {
  word: string;
  /** Epoch ms: data em que foi favoritada / visualizada por último. */
  date: number;
}
