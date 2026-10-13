import { apiClient, type ApiError } from 'shell/apiClient';
import type { Session } from 'shell/session';
import type { Credentials, CredentialErrors } from '../model/credentials';

/** `AuthResponse` of E-02; the container keeps it without the refreshToken (shell/session). */
export type AuthResponse = Session & { refreshToken: string };

const LOGIN_PATH = '/api/v1/auth/login';

export function login({ email, password }: Credentials): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>(LOGIN_PATH, { email: email.trim(), password });
}

function isApiError(error: unknown): error is ApiError {
  return (
    error instanceof Error &&
    typeof (error as Partial<ApiError>).status === 'number' &&
    Array.isArray((error as Partial<ApiError>).details)
  );
}

/** What the form shows for a failed login: the contract's message and each field's detail. */
export function loginFailure(error: unknown): { message: string; fields: CredentialErrors } {
  if (!isApiError(error)) return { message: 'Ocurrió un error inesperado.', fields: {} };
  const fields: CredentialErrors = {};
  for (const { field, message } of error.details) {
    if (field === 'email' || field === 'password') fields[field] = message;
  }
  return { message: error.message, fields };
}
