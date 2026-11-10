import { hasErrors, validateCredentials } from '../validation';

describe('validateCredentials', () => {
  it('aceita dados válidos', () => {
    expect(hasErrors(validateCredentials('lucas@email.com', 'secret1', 'secret1'))).toBe(false);
  });

  it('aponta e-mail, senha curta e confirmação divergente', () => {
    expect(validateCredentials('', '')).toEqual({
      email: 'Informe seu e-mail.',
      password: 'Informe sua senha.',
    });
    expect(validateCredentials('foo@bar', '123', '1234')).toEqual({
      email: 'E-mail inválido.',
      password: 'A senha deve ter pelo menos 6 caracteres.',
      confirmPassword: 'As senhas não conferem.',
    });
  });
});
