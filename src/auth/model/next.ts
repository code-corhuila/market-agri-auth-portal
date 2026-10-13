const HOME = '/';
const LOGIN = '/login';

/**
 * Where to go after the login: the `?next=` that RequireAuth adds (Annex H), only when it is a
 * route of this application. Anything else (`//host`, `/\host`, a scheme, a relative path) or the
 * login itself goes home, so the page is never an open redirect.
 */
export function safeNext(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return HOME;
  }
  if (next === LOGIN || next.startsWith(`${LOGIN}/`) || next.startsWith(`${LOGIN}?`)) return HOME;
  return next;
}
