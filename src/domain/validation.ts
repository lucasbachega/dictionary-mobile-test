const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MIN_PASSWORD_LENGTH = 6;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

export interface CredentialErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function validateCredentials(
  email: string,
  password: string,
  confirmPassword?: string,
): CredentialErrors {
  const errors: CredentialErrors = {};
  if (!email.trim()) errors.email = 'Informe seu e-mail.';
  else if (!EMAIL_REGEX.test(normalizeEmail(email))) errors.email = 'E-mail inválido.';

  if (!password) errors.password = 'Informe sua senha.';
  else if (password.length < MIN_PASSWORD_LENGTH)
    errors.password = `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;

  if (confirmPassword !== undefined && confirmPassword !== password)
    errors.confirmPassword = 'As senhas não conferem.';

  return errors;
}

export function hasErrors(errors: object): boolean {
  return Object.values(errors).some(Boolean);
}
