import { safeNext } from '../../src/auth/model/next';

// RequireAuth sends the person to /login?next=<route asked for> (Annex H). After the login the
// portal goes back there, but only to a route of this same application: an absolute or
// protocol-relative address would make the login page an open redirect.
describe('safeNext', () => {
  it('keeps a route of the application with its query', () => {
    expect(safeNext('/transacciones?page=2')).toBe('/transacciones?page=2');
  });

  it.each([null, '', 'catalogo', '//evil.example', '/\\evil.example', 'https://evil.example'])(
    'goes to the home page for %j',
    (next) => {
      expect(safeNext(next)).toBe('/');
    },
  );

  it('never goes back to the login itself', () => {
    expect(safeNext('/login')).toBe('/');
    expect(safeNext('/login/otra')).toBe('/');
  });
});
