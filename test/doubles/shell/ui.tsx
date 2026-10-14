import type { LucideIcon } from 'lucide-react';
import { cloneElement, type ButtonHTMLAttributes, type ReactElement, type ReactNode } from 'react';

// Doubles of the container's design system (shell/ui): the same markup that matters to the tests
// (headings, text), none of its styles. The real components are tested in market-agri-front.

export function PageHeader({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
  return (
    <div>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

export function EmptyState(props: {
  icon: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div>
      <h2>{props.title}</h2>
      {props.description && <p>{props.description}</p>}
      {props.action}
    </div>
  );
}

// Field, Button and Alert keep what the tests read: label tied to the control, the error and
// aria-invalid next to it, the disabled state while sending, and the alert role.
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: ReactNode;
  required?: boolean;
  children: ReactElement<{ id?: string }>;
}) {
  const id = `field-${label}`;
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? `${id}-error` : undefined,
      } as Record<string, unknown>)}
      {error && <p id={`${id}-error`}>{error}</p>}
    </div>
  );
}

export function Button({
  loading,
  disabled,
  block: _block,
  variant: _variant,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  block?: boolean;
  variant?: string;
}) {
  return <button {...rest} disabled={disabled || loading} aria-busy={loading || undefined} />;
}

export function Alert({ children }: { variant?: string; children: ReactNode }) {
  return <div role="alert">{children}</div>;
}
