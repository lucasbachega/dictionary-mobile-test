export type AppErrorCode =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'NOT_FOUND'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_IN_USE'
  | 'EMAIL_CONFIRMATION_REQUIRED'
  | 'VALIDATION'
  | 'DATABASE'
  | 'UNKNOWN';

const DEFAULT_MESSAGES: Record<AppErrorCode, string> = {
  NETWORK: 'Sem conexão com a internet. Verifique sua rede e tente novamente.',
  TIMEOUT: 'O servidor demorou demais para responder. Tente novamente.',
  NOT_FOUND: 'Nenhum resultado encontrado.',
  INVALID_CREDENTIALS: 'E-mail ou senha inválidos.',
  EMAIL_IN_USE: 'Já existe uma conta com este e-mail.',
  EMAIL_CONFIRMATION_REQUIRED: 'Conta criada! Confirme seu e-mail para entrar.',
  VALIDATION: 'Dados inválidos.',
  DATABASE: 'Erro ao acessar os dados locais.',
  UNKNOWN: 'Algo deu errado. Tente novamente.',
};

/** Erro de domínio com código estável e mensagem pronta para o usuário. */
export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly cause?: unknown;

  constructor(code: AppErrorCode, message?: string, cause?: unknown) {
    super(message ?? DEFAULT_MESSAGES[code]);
    this.name = 'AppError';
    this.code = code;
    this.cause = cause;
  }

  static from(error: unknown, fallback: AppErrorCode = 'UNKNOWN'): AppError {
    if (error instanceof AppError) return error;
    return new AppError(fallback, undefined, error);
  }
}

export function getErrorMessage(error: unknown): string {
  return AppError.from(error).message;
}
