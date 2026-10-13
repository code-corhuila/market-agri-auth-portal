import { useState, type FormEvent } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { setSession } from 'shell/session';
import { Alert, Button, Field, PageHeader } from 'shell/ui';
import { useSession } from 'shell/useSession';
import { login, loginFailure } from '../api/login';
import { validateCredentials, type CredentialErrors } from '../model/credentials';
import { safeNext } from '../model/next';
import styles from './LoginPage.module.css';

/**
 * E-02 with the container's client and session (Annex H): the portal never stores a token. On
 * success the session changes and the page goes back to `?next=`; the real sign-in screen that
 * replaces the development one (Annex H, rule 5).
 */
export function LoginPage() {
  const session = useSession();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<CredentialErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (session) return <Navigate to={safeNext(params.get('next'))} replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const credentials = { email, password };
    const errors = validateCredentials(credentials);
    setFieldErrors(errors);
    setFailure(null);
    if (Object.keys(errors).length > 0) return;

    setPending(true);
    try {
      setSession(await login(credentials));
    } catch (error) {
      const { message, fields } = loginFailure(error);
      setFieldErrors(fields);
      setFailure(message);
      setPending(false);
    }
  }

  return (
    <section className="stack">
      <PageHeader title="Iniciar sesión" subtitle="Ingrese con su correo y su contraseña." />
      <form className={`stack ${styles.form}`} onSubmit={handleSubmit} noValidate>
        {failure && <Alert variant="error">{failure}</Alert>}
        <Field label="Correo electrónico" error={fieldErrors.email} required>
          <input
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Contraseña" error={fieldErrors.password} required>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Button type="submit" block loading={pending}>
          Ingresar
        </Button>
      </form>
    </section>
  );
}
