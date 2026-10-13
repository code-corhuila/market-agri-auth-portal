/** Request of E-02 (api-contract §4): both fields required and non-empty. */
export interface Credentials {
  email: string;
  password: string;
}

export type CredentialErrors = Partial<Record<keyof Credentials, string>>;

export const REQUIRED = 'Es obligatorio.';

/** The client checks only what the contract requires; the server decides the rest. */
export function validateCredentials({ email, password }: Credentials): CredentialErrors {
  const errors: CredentialErrors = {};
  if (!email.trim()) errors.email = REQUIRED;
  if (!password) errors.password = REQUIRED;
  return errors;
}
