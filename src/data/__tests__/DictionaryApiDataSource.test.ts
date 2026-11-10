import { buildConfig } from '@/core/config/env';

import { helloEntries, jsonResponse } from '../../../test/fixtures';
import { DictionaryApiDataSource } from '../datasources/DictionaryApiDataSource';

describe('DictionaryApiDataSource', () => {
  const config = buildConfig({});

  it('monta a URL do endpoint e retorna as entradas', async () => {
    const fetchFn = jest.fn().mockResolvedValue(jsonResponse(helloEntries));
    const result = await new DictionaryApiDataSource(config, fetchFn).fetchEntries('hello world');

    expect(fetchFn.mock.calls[0][0]).toBe(
      'https://api.dictionaryapi.dev/api/v2/entries/en/hello%20world',
    );
    expect(result).toEqual({ status: 'found', entries: helloEntries });
  });

  it('trata 404 como "palavra sem definição"', async () => {
    const fetchFn = jest.fn().mockResolvedValue(jsonResponse({ title: 'No Definitions Found' }, 404));
    await expect(new DictionaryApiDataSource(config, fetchFn).fetchEntries('aalii')).resolves.toEqual({
      status: 'not_found',
    });
  });

  it('lança erro em falhas do servidor (5xx)', async () => {
    const fetchFn = jest.fn().mockResolvedValue(jsonResponse({}, 503));
    await expect(new DictionaryApiDataSource(config, fetchFn).fetchEntries('x')).rejects.toMatchObject({
      code: 'NETWORK',
    });
  });
});
