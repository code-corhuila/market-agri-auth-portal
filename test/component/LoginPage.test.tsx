import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { apiClient } from 'shell/apiClient';
import { clearSession, getSession, setSession } from 'shell/session';
import App from '../../src/App';
import { apiError } from '../doubles/shell/apiClient';

// HU-AUTH-002 against E-02 (POST /api/v1/auth/login). The container mounts ./App under
// /login/*; the probe routes stand in for the pages the person goes back to.
const USER = { id: 'u-1', name: 'Ana Ruiz', email: 'productor@market-agri.test', role: 'PRODUCER' };
const AUTH_RESPONSE = {
  accessToken: 'header.claims.',
  refreshToken: 'refresh-1',
  expiresAt: '2099-01-01T00:00:00Z',
  user: USER,
};

function renderLogin(path = '/login') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login/*" element={<App />} />
        <Route path="/" element={<h1>Inicio (probe)</h1>} />
        <Route path="/transacciones" element={<h1>Transacciones (probe)</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

const email = () => screen.getByLabelText('Correo electrónico');
const password = () => screen.getByLabelText('Contraseña');
const submit = () => screen.getByRole('button', { name: 'Ingresar' });

function fill(emailValue: string, passwordValue: string) {
  fireEvent.change(email(), { target: { value: emailValue } });
  fireEvent.change(password(), { target: { value: passwordValue } });
}

beforeEach(() => clearSession());

describe('login page (HU-AUTH-002)', () => {
  it('asks for the email and the password', () => {
    renderLogin();
    expect(screen.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(email()).toHaveAttribute('type', 'email');
    expect(email()).toHaveAttribute('autocomplete', 'username');
    expect(password()).toHaveAttribute('type', 'password');
    expect(password()).toHaveAttribute('autocomplete', 'current-password');
  });

  it('shows the error next to each empty field and sends nothing', () => {
    const post = vi.spyOn(apiClient, 'post');
    renderLogin();
    fill('   ', '');
    fireEvent.click(submit());
    expect(email()).toHaveAttribute('aria-invalid', 'true');
    expect(password()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getAllByText('Es obligatorio.')).toHaveLength(2);
    expect(post).not.toHaveBeenCalled();
  });

  it('logs in through shell/apiClient, keeps the session in the container and goes home', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(AUTH_RESPONSE);
    renderLogin();
    fill(' productor@market-agri.test ', 'Productor123');
    fireEvent.click(submit());
    expect(await screen.findByRole('heading', { name: 'Inicio (probe)' })).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith('/api/v1/auth/login', {
      email: 'productor@market-agri.test',
      password: 'Productor123',
    });
    expect(getSession()).toEqual({
      accessToken: AUTH_RESPONSE.accessToken,
      expiresAt: AUTH_RESPONSE.expiresAt,
      user: USER,
    });
  });

  it('goes back to the route asked for in ?next=', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue(AUTH_RESPONSE);
    renderLogin('/login?next=%2Ftransacciones');
    fill('productor@market-agri.test', 'Productor123');
    fireEvent.click(submit());
    expect(
      await screen.findByRole('heading', { name: 'Transacciones (probe)' }),
    ).toBeInTheDocument();
  });

  it('does not follow a ?next= outside the application', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue(AUTH_RESPONSE);
    renderLogin('/login?next=%2F%2Fevil.example');
    fill('productor@market-agri.test', 'Productor123');
    fireEvent.click(submit());
    expect(await screen.findByRole('heading', { name: 'Inicio (probe)' })).toBeInTheDocument();
  });

  it('with a session already open, goes straight to ?next=', () => {
    setSession(AUTH_RESPONSE as Parameters<typeof setSession>[0]);
    renderLogin('/login?next=%2Ftransacciones');
    expect(screen.getByRole('heading', { name: 'Transacciones (probe)' })).toBeInTheDocument();
  });

  it.each([
    [401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.'],
    [
      423,
      'ACCOUNT_LOCKED',
      'La cuenta está bloqueada temporalmente por intentos fallidos. Intente de nuevo en 15 minutos.',
    ],
    [
      0,
      'NETWORK_ERROR',
      'No se pudo conectar con el servidor. Revise su conexión e intente de nuevo.',
    ],
  ])(
    'a %i %s shows the message of the contract next to the form',
    async (status, code, message) => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(apiError(status, code, message));
      renderLogin();
      fill('productor@market-agri.test', 'Incorrecta1');
      fireEvent.click(submit());
      expect(await screen.findByRole('alert')).toHaveTextContent(message);
      // The person corrects and retries: what was typed stays, the session does not start.
      expect(email()).toHaveValue('productor@market-agri.test');
      expect(getSession()).toBeNull();
      expect(submit()).toBeEnabled();
    },
  );

  it('a 400 puts each detail of the server next to its field', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(
      apiError(400, 'VALIDATION_ERROR', 'La solicitud tiene datos inválidos.', [
        { field: 'password', message: 'Es obligatorio en el servidor.' },
      ]),
    );
    renderLogin();
    fill('productor@market-agri.test', 'x');
    fireEvent.click(submit());
    expect(await screen.findByText('Es obligatorio en el servidor.')).toBeInTheDocument();
    expect(password()).toHaveAttribute('aria-invalid', 'true');
  });

  // Review of #4, point 2: a detail of a field the form does not have is not lost.
  it('a 400 detail of a field the form does not have goes to the alert', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(
      apiError(400, 'VALIDATION_ERROR', 'La solicitud tiene datos inválidos.', [
        { field: 'body', message: 'El cuerpo no es JSON.' },
      ]),
    );
    renderLogin();
    fill('productor@market-agri.test', 'x');
    fireEvent.click(submit());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La solicitud tiene datos inválidos. El cuerpo no es JSON.',
    );
  });

  // Review of #4, point 1: network and timeout arrive as ApiError (status 0) with the container's
  // message (case above); anything else is a defect, shown generically, never its technical text.
  it('a failure that is not an error of the API shows the generic message only', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(new TypeError('x.user is undefined'));
    renderLogin();
    fill('productor@market-agri.test', 'Productor123');
    fireEvent.click(submit());
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Ocurrió un error inesperado.');
    expect(alert).not.toHaveTextContent('undefined');
  });

  it('disables the button while the request is pending: one click, one request', async () => {
    let resolve: (value: unknown) => void = () => {};
    const post = vi
      .spyOn(apiClient, 'post')
      .mockImplementation(() => new Promise<unknown>((done) => (resolve = done)) as Promise<never>);
    renderLogin();
    fill('productor@market-agri.test', 'Productor123');
    fireEvent.click(submit());
    fireEvent.click(submit());
    expect(submit()).toBeDisabled();
    expect(post).toHaveBeenCalledTimes(1);
    await act(async () => resolve(AUTH_RESPONSE));
    await waitFor(() => expect(getSession()).not.toBeNull());
  });
});
