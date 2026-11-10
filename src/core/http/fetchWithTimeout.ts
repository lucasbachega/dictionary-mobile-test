import { AppError } from '../errors/AppError';

export type FetchFn = typeof fetch;

export interface FetchWithTimeoutOptions extends RequestInit {
  timeoutMs: number;
  fetchFn?: FetchFn;
}

/**
 * `fetch` com timeout via AbortController. Evita que a UI fique presa em
 * requisições penduradas e normaliza falhas de rede em `AppError`.
 * Um `signal` externo (ex.: desmontagem de tela) também cancela a requisição.
 */
export async function fetchWithTimeout(
  url: string,
  { timeoutMs, fetchFn = fetch, signal: externalSignal, ...init }: FetchWithTimeoutOptions,
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onExternalAbort);
  }

  try {
    return await fetchFn(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (timedOut) throw new AppError('TIMEOUT', undefined, error);
    if (externalSignal?.aborted) throw error; // cancelamento intencional: o chamador decide
    throw new AppError('NETWORK', undefined, error);
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
}
