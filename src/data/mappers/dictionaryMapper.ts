import type { Meaning, Phonetic, WordDetails } from '@/domain/entities/Word';

import type { ApiEntry } from '../datasources/DictionaryApiDataSource';

const unique = <T,>(items: T[]) => Array.from(new Set(items));
const nonEmpty = (value?: string | null): value is string => !!value && value.trim().length > 0;

/**
 * A API pode retornar várias entradas para a mesma palavra (ex.: "lead" verbo/substantivo).
 * Consolidamos tudo em um único `WordDetails` para a tela.
 */
export function mapEntriesToWordDetails(word: string, entries: ApiEntry[]): WordDetails {
  const phonetics: Phonetic[] = entries
    .flatMap((entry) => entry.phonetics ?? [])
    .map((p) => ({
      text: nonEmpty(p.text) ? p.text.trim() : undefined,
      audioUrl: nonEmpty(p.audio) ? normalizeAudioUrl(p.audio.trim()) : undefined,
    }))
    .filter((p) => p.text || p.audioUrl);

  const phonetic =
    entries.map((e) => e.phonetic).find(nonEmpty)?.trim() ?? phonetics.find((p) => p.text)?.text;

  // Prioriza áudio com sotaque americano (-us.mp3) quando houver.
  const audioUrls = phonetics.map((p) => p.audioUrl).filter(nonEmpty);
  const audioUrl = audioUrls.find((url) => /-us\.mp3$/i.test(url)) ?? audioUrls[0];

  const meanings: Meaning[] = entries.flatMap((entry) =>
    (entry.meanings ?? []).map((m) => ({
      partOfSpeech: m.partOfSpeech,
      synonyms: unique(m.synonyms ?? []),
      antonyms: unique(m.antonyms ?? []),
      definitions: (m.definitions ?? [])
        .filter((d) => nonEmpty(d.definition))
        .map((d) => ({
          definition: d.definition.trim(),
          example: nonEmpty(d.example) ? d.example.trim() : undefined,
          synonyms: unique(d.synonyms ?? []),
          antonyms: unique(d.antonyms ?? []),
        })),
    })),
  );

  return {
    word: entries[0]?.word ?? word,
    phonetic,
    audioUrl,
    phonetics,
    meanings: meanings.filter((m) => m.definitions.length > 0),
    sourceUrls: unique(entries.flatMap((e) => e.sourceUrls ?? [])),
  };
}

/** Alguns áudios antigos vêm como "//ssl.gstatic.com/..." (sem protocolo). */
function normalizeAudioUrl(url: string): string {
  return url.startsWith('//') ? `https:${url}` : url;
}
