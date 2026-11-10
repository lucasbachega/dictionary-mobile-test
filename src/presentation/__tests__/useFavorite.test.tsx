import { act, renderHook, waitFor } from '@testing-library/react-native';

import { TOKENS } from '@/core/di/tokens';
import { AppError } from '@/core/errors/AppError';

import { createTestContainer, wrapperFor } from '../../../test/TestProviders';
import { useFavorite } from '../hooks/useFavorite';

function fakeRepo(overrides: Record<string, jest.Mock> = {}) {
  return {
    isFavorite: jest.fn().mockResolvedValue(false),
    addFavorite: jest.fn().mockResolvedValue(undefined),
    removeFavorite: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('useFavorite', () => {
  it('favorita e desfavorita a palavra', async () => {
    const repo = fakeRepo();
    const container = createTestContainer({ [TOKENS.UserWordsRepository]: repo });
    const { result } = await renderHook(() => useFavorite('u1', 'hello'), {
      wrapper: wrapperFor(container),
    });

    await act(async () => {
      await result.current.toggle();
    });
    expect(result.current.isFavorite).toBe(true);
    expect(repo.addFavorite).toHaveBeenCalledWith('u1', 'hello');

    await act(async () => {
      await result.current.toggle();
    });
    expect(result.current.isFavorite).toBe(false);
    expect(repo.removeFavorite).toHaveBeenCalledWith('u1', 'hello');
  });

  it('desfaz a mudança otimista se salvar falhar', async () => {
    const repo = fakeRepo({ addFavorite: jest.fn().mockRejectedValue(new AppError('NETWORK')) });
    const onError = jest.fn();
    const container = createTestContainer({ [TOKENS.UserWordsRepository]: repo });
    const { result } = await renderHook(() => useFavorite('u1', 'hello', onError), {
      wrapper: wrapperFor(container),
    });
    await waitFor(() => expect(repo.isFavorite).toHaveBeenCalled());

    await act(async () => {
      await result.current.toggle();
    });

    expect(result.current.isFavorite).toBe(false);
    expect(onError).toHaveBeenCalledWith(expect.stringContaining('conexão'));
  });
});
