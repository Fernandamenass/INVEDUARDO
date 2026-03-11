import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import InvitationPage from './pages/InvitationPage';
import LoginPage from './pages/LoginPage';
import AdminPanel from './pages/AdminPanel';
import ErrorPage from './pages/ErrorPage';
import ProtectedRoute from './components/ProtectedRoute';

// Mock Supabase client
vi.mock('./services/supabaseClient', () => ({
  default: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
    }))
  }
}));

describe('App Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (initialRoute) => {
    window.history.pushState({}, 'Test page', initialRoute);
    
    return render(
      <BrowserRouter>
        <Routes>
          <Route path="/invitation/:uniqueId" element={<InvitationPage />} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          } />
          <Route path="/404" element={<ErrorPage />} />
          <Route path="/" element={
            <div>
              <h1>Sistema de Invitaciones de Graduación</h1>
              <p>Por favor, utiliza el enlace único que recibiste en tu invitación.</p>
            </div>
          } />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </BrowserRouter>
    );
  };

  it('renders home page at root path', () => {
    renderWithRouter('/');
    expect(screen.getByText('Sistema de Invitaciones de Graduación')).toBeInTheDocument();
  });

  it('renders login page at /admin/login', () => {
    renderWithRouter('/admin/login');
    expect(screen.getByText(/Iniciar Sesión/i)).toBeInTheDocument();
  });

  it('redirects to 404 page for invalid routes', async () => {
    renderWithRouter('/invalid-route');
    
    await waitFor(() => {
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Página no encontrada')).toBeInTheDocument();
    });
  });

  it('renders 404 page at /404 path', () => {
    renderWithRouter('/404');
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument();
  });

  it('renders invitation page at /invitation/:uniqueId', async () => {
    renderWithRouter('/invitation/test-123');
    
    // Wait for the component to attempt loading
    await waitFor(() => {
      // The page should render even if data loading fails
      expect(screen.queryByText('Sistema de Invitaciones de Graduación')).not.toBeInTheDocument();
    });
  });
});
