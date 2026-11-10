import { render, screen, userEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AppError } from '@/core/errors/AppError';

import { createTestContainer, TestProviders } from '../../../test/TestProviders';
import { AuthForm } from '../components/AuthForm';

async function renderForm(mode: 'signIn' | 'signUp', onSubmit = jest.fn().mockResolvedValue(undefined)) {
  await render(
    <TestProviders container={createTestContainer()}>
      <AuthForm mode={mode} onSubmit={onSubmit} footer={<Text>footer</Text>} />
    </TestProviders>,
  );
  return { onSubmit, user: userEvent.setup() };
}

describe('AuthForm', () => {
  it('valida os campos antes de enviar', async () => {
    const { onSubmit, user } = await renderForm('signUp');

    await user.type(screen.getByTestId('input-email'), 'invalido');
    await user.type(screen.getByTestId('input-password'), '123');
    await user.type(screen.getByTestId('input-confirm-password'), '321');
    await user.press(screen.getByTestId('submit'));

    expect(screen.getByText('E-mail inválido.')).toBeOnTheScreen();
    expect(screen.getByText('A senha deve ter pelo menos 6 caracteres.')).toBeOnTheScreen();
    expect(screen.getByText('As senhas não conferem.')).toBeOnTheScreen();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envia as credenciais válidas', async () => {
    const { onSubmit, user } = await renderForm('signIn');

    await user.type(screen.getByTestId('input-email'), 'lucas@email.com');
    await user.type(screen.getByTestId('input-password'), 'secret123');
    await user.press(screen.getByTestId('submit'));

    expect(onSubmit).toHaveBeenCalledWith({ email: 'lucas@email.com', password: 'secret123' });
  });

  it('mostra o erro retornado pela autenticação', async () => {
    const { user } = await renderForm('signIn', jest.fn().mockRejectedValue(new AppError('INVALID_CREDENTIALS')));

    await user.type(screen.getByTestId('input-email'), 'lucas@email.com');
    await user.type(screen.getByTestId('input-password'), 'wrong-pass');
    await user.press(screen.getByTestId('submit'));

    expect(await screen.findByText('E-mail ou senha inválidos.')).toBeOnTheScreen();
  });
});
