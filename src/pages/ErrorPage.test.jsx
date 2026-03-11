import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import ErrorPage from './ErrorPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ErrorPage', () => {
  it('renders 404 error message', () => {
    render(
      <BrowserRouter>
        <ErrorPage />
      </BrowserRouter>
    );

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument();
    expect(screen.getByText(/la página que buscas no existe/i)).toBeInTheDocument();
  });

  it('displays helpful hint about invitation links', () => {
    render(
      <BrowserRouter>
        <ErrorPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/verifica que hayas copiado correctamente el enlace/i)).toBeInTheDocument();
  });

  it('navigates to home when button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <ErrorPage />
      </BrowserRouter>
    );

    const button = screen.getByRole('button', { name: /volver al inicio/i });
    await user.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
