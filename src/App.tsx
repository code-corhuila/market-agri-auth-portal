import { Route, Routes } from 'react-router-dom';
import { NotFoundPage } from './auth/pages/NotFoundPage';
import { LoginPage } from './auth/pages/LoginPage';

/** Root of the portal, exposed as ./App: the container mounts it under /login/* (ADR-021). */
export default function App() {
  return (
    <Routes>
      <Route index element={<LoginPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
