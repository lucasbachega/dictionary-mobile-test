import { helloEntries } from '../../../test/fixtures';
import { mapEntriesToWordDetails } from '../mappers/dictionaryMapper';

describe('mapEntriesToWordDetails', () => {
  const details = mapEntriesToWordDetails('hello', helloEntries);

  it('usa a fonética principal da API', () => {
    expect(details.word).toBe('hello');
    expect(details.phonetic).toBe('həˈləʊ');
  });

  it('prefere o áudio americano e corrige URLs sem protocolo', () => {
    expect(details.audioUrl).toBe('https://api.dictionaryapi.dev/media/pronunciations/en/hello-us.mp3');
    expect(details.phonetics[0].audioUrl).toMatch(/^https:\/\/ssl\.gstatic\.com/);
  });

  it('descarta fonéticas vazias', () => {
    expect(details.phonetics).toHaveLength(2);
  });

  it('junta os significados de todas as entradas e ignora definições vazias', () => {
    expect(details.meanings.map((m) => m.partOfSpeech)).toEqual(['exclamation', 'verb']);
    expect(details.meanings[0].definitions[0].example).toBe('hello there, Katie!');
  });

  it('remove URLs de origem duplicadas', () => {
    expect(details.sourceUrls).toEqual(['https://en.wiktionary.org/wiki/hello']);
  });

  it('usa a fonética de `phonetics` quando `phonetic` não vem', () => {
    const result = mapEntriesToWordDetails('test', [
      { word: 'test', phonetics: [{ text: '/tɛst/' }], meanings: [] },
    ]);
    expect(result.phonetic).toBe('/tɛst/');
    expect(result.audioUrl).toBeUndefined();
  });
});
