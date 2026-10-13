import { LogIn } from 'lucide-react';
import { EmptyState, PageHeader } from 'shell/ui';

/** Main page of the portal; its content arrives with the sub-tasks of the domain. */
export function LoginPage() {
  return (
    <section className="stack">
      <PageHeader title="Iniciar sesión" />
      <EmptyState
        icon={LogIn}
        title="En construcción"
        description="Pronto podrá ingresar con su correo y su contraseña."
      />
    </section>
  );
}
