import { AppError } from '../errors/AppError';
import { fetchWithTimeout } from '../http/fetchWithTimeout';

describe('fetchWithTimeout', () => {
  afterEach(() => jest.useRealTimers());

  it('cancela a requisição e lança TIMEOUT quando o servidor não responde', async () => {
    jest.useFakeTimers();
    const hangingFetch = jest.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    ) as unknown as typeof fetch;

    const promise = fetchWithTimeout('https://x', { timeoutMs: 1000, fetchFn: hangingFetch });
    jest.advanceTimersByTime(1000);

    await expect(promise).rejects.toMatchObject({ code: 'TIMEOUT' });
  });

  it('converte falhas de rede em AppError NETWORK', async () => {
    const failingFetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    await expect(
      fetchWithTimeout('https://x', { timeoutMs: 1000, fetchFn: failingFetch }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('retorna a resposta quando tudo dá certo', async () => {
    const response = { ok: true } as Response;
    const okFetch = jest.fn().mockResolvedValue(response);
    await expect(fetchWithTimeout('https://x', { timeoutMs: 1000, fetchFn: okFetch })).resolves.toBe(
      response,
    );
  });
});
