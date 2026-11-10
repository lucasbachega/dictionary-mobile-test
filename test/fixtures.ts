import type { ApiEntry } from '@/data/datasources/DictionaryApiDataSource';

/** Recorte real do retorno de GET /api/v2/entries/en/hello. */
export const helloEntries: ApiEntry[] = [
  {
    word: 'hello',
    phonetic: 'həˈləʊ',
    phonetics: [
      { text: 'həˈləʊ', audio: '//ssl.gstatic.com/dictionary/static/sounds/20200429/hello--_gb_1.mp3' },
      { text: 'hɛˈləʊ', audio: 'https://api.dictionaryapi.dev/media/pronunciations/en/hello-us.mp3' },
      { text: '', audio: '' },
    ],
    meanings: [
      {
        partOfSpeech: 'exclamation',
        definitions: [
          {
            definition: 'used as a greeting or to begin a phone conversation.',
            example: 'hello there, Katie!',
            synonyms: [],
            antonyms: [],
          },
        ],
        synonyms: ['hi', 'hey'],
        antonyms: [],
      },
    ],
    sourceUrls: ['https://en.wiktionary.org/wiki/hello'],
  },
  {
    word: 'hello',
    phonetics: [],
    meanings: [
      {
        partOfSpeech: 'verb',
        definitions: [{ definition: 'To greet with "hello".', synonyms: [], antonyms: [] }],
        synonyms: ['hi', 'greet'],
        antonyms: [],
      },
      { partOfSpeech: 'noun', definitions: [{ definition: '   ' }] },
    ],
    sourceUrls: ['https://en.wiktionary.org/wiki/hello'],
  },
];

export function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}
