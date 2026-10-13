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

/**
 * What the form shows for a failed login: the contract's message, each detail next to its field,
 * and the details of fields the form does not have after the message, so none is lost.
 * Network and timeout failures are ApiError too (status 0, message of the container's client);
 * anything else is a defect, shown with the generic message of api-contract §2.1, never its text.
 */
export function loginFailure(error: unknown): { message: string; fields: CredentialErrors } {
  if (!isApiError(error)) return { message: 'Ocurrió un error inesperado.', fields: {} };
  const fields: CredentialErrors = {};
  const others: string[] = [];
  for (const { field, message } of error.details) {
    if (field === 'email' || field === 'password') fields[field] = message;
    else others.push(message);
  }
  return { message: [error.message, ...others].join(' '), fields };
}
