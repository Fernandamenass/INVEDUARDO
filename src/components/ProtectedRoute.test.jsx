import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Routes, Route, MemoryRouter } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Create mock functions
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockUnsubscribe = vi.fn();

// Mock the supabase client module
vi.mock('../services/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: () => mockOnAuthStateChange(),
    },
  },
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUnsubscribe.mockClear();
    // Default mock for onAuthStateChange
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
  });

  const renderProtectedRoute = (children = <div>Protected Content</div>) => {
    return render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<ProtectedRoute>{children}</ProtectedRoute>} />
          <Route path="/admin/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Test de protección de rutas', () => {
    it('should redirect to login page when no session exists', async () => {
      // Mock getSession to return no session
      mockGetSession.mockResolvedValue({ 
        data: { session: null },
        error: null
      });

      renderProtectedRoute();

      // Should eventually redirect to login
      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
      
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should render protected content when valid session exists', async () => {
      const mockSession = {
        access_token: 'mock-token',
        user: { id: 'user-123', email: 'admin@example.com' },
      };

      // Mock getSession to return a valid session
      mockGetSession.mockResolvedValue({ 
        data: { session: mockSession },
        error: null
      });

      renderProtectedRoute();

      // Should show loading state first
      expect(screen.getByText('Verificando sesión...')).toBeInTheDocument();

      // Then check that protected content is shown
      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
      
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });

    it('should show loading state while checking session', () => {
      // Mock getSession to return a pending promise
      mockGetSession.mockReturnValue(new Promise(() => {}));

      renderProtectedRoute();

      // Should show loading state
      expect(screen.getByText('Verificando sesión...')).toBeInTheDocument();
    });
  });

  describe('Test de mantenimiento de sesión', () => {
    it('should unsubscribe from auth state changes on unmount', async () => {
      const mockSession = {
        access_token: 'mock-token',
        user: { id: 'user-123', email: 'admin@example.com' },
      };

      // Mock getSession to return a valid session
      mockGetSession.mockResolvedValue({ 
        data: { session: mockSession },
        error: null
      });

      const { unmount } = renderProtectedRoute();

      // Wait for protected content to render
      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });

      // Unmount and verify cleanup
      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should listen for auth state changes', async () => {
      const mockSession = {
        access_token: 'mock-token',
        user: { id: 'user-123', email: 'admin@example.com' },
      };

      // Mock getSession to return a valid session
      mockGetSession.mockResolvedValue({ 
        data: { session: mockSession },
        error: null
      });

      renderProtectedRoute();

      // Wait for component to mount and set up listener
      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });

      // Verify that onAuthStateChange was called to set up the listener
      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });
  });
});
