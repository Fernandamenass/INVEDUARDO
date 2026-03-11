import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import * as supabaseClient from '../services/supabaseClient';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock supabase client
vi.mock('../services/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
  };

  describe('Test de login exitoso', () => {
    it('should successfully login with valid credentials and redirect to admin panel', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'admin@example.com',
      };

      supabaseClient.supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null,
      });

      renderLoginPage();

      // Fill in the form
      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/Contraseña/i);
      const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

      fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(supabaseClient.supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'admin@example.com',
          password: 'password123',
        });
        expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
      });
    });

    it('should display loading state during login', async () => {
      supabaseClient.supabase.auth.signInWithPassword.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: { user: { id: '1' } }, error: null }), 100))
      );

      renderLoginPage();

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/Contraseña/i);
      const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

      fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      // Check loading state
      expect(screen.getByText(/Iniciando sesión.../i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });
    });
  });

  describe('Test de login fallido', () => {
    it('should display error message for invalid credentials', async () => {
      supabaseClient.supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      renderLoginPage();

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/Contraseña/i);
      const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Credenciales inválidas/i)).toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    it('should display error message for network errors', async () => {
      supabaseClient.supabase.auth.signInWithPassword.mockRejectedValue(
        new Error('Network error')
      );

      renderLoginPage();

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/Contraseña/i);
      const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

      fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Error al iniciar sesión/i)).toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    it('should clear previous error when submitting again', async () => {
      // First attempt - fail
      supabaseClient.supabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      renderLoginPage();

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/Contraseña/i);
      const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Credenciales inválidas/i)).toBeInTheDocument();
      });

      // Second attempt - success
      supabaseClient.supabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { id: 'user-123' }, session: { access_token: 'token' } },
        error: null,
      });

      fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'correctpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/Credenciales inválidas/i)).not.toBeInTheDocument();
        expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
      });
    });
  });

  describe('Test de formulario', () => {
    it('should render login form with all required fields', () => {
      renderLoginPage();

      expect(screen.getByText(/Panel Administrativo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument();
    });

    it('should require email and password fields', () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/Contraseña/i);

      expect(emailInput).toBeRequired();
      expect(passwordInput).toBeRequired();
    });

    it('should have correct input types', () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/Contraseña/i);

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });
});
