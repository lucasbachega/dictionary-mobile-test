import { render, screen, userEvent } from '@testing-library/react-native';

import { createTestContainer, TestProviders } from '../../../test/TestProviders';
import { WordGrid } from '../components/WordGrid';

describe('WordGrid', () => {
  it('renderiza as palavras e abre a palavra tocada', async () => {
    const onPressWord = jest.fn();
    await render(
      <TestProviders container={createTestContainer()}>
        <WordGrid words={['hello', 'today', 'great']} onPressWord={onPressWord} />
      </TestProviders>,
    );

    expect(screen.getByText('today')).toBeOnTheScreen();
    await userEvent.setup().press(screen.getByTestId('word-great'));
    expect(onPressWord).toHaveBeenCalledWith('great', 2);
  });
});
