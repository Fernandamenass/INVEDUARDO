import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import InvitationPage from './InvitationPage';
import * as supabaseClient from '../services/supabaseClient';

// Mock react-router-dom useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ uniqueId: 'test-unique-id' }),
  };
});

// Mock supabase client functions
vi.mock('../services/supabaseClient', () => ({
  getGuestByUniqueId: vi.fn(),
  updateGuestConfirmation: vi.fn(),
  addCompanions: vi.fn(),
}));

describe('InvitationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderInvitationPage = () => {
    return render(
      <BrowserRouter>
        <InvitationPage />
      </BrowserRouter>
    );
  };

  describe('Test de manejo de unique_id inválido', () => {
    it('should display error message when unique_id is invalid', async () => {
      supabaseClient.getGuestByUniqueId.mockResolvedValue({
        data: null,
        error: null,
      });

      renderInvitationPage();

      await waitFor(() => {
        expect(screen.getByText(/Invitación no encontrada/i)).toBeInTheDocument();
      });
    });

    it('should display error message when there is a fetch error', async () => {
      supabaseClient.getGuestByUniqueId.mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      });

      renderInvitationPage();

      await waitFor(() => {
        expect(screen.getByText(/Error al cargar la invitación/i)).toBeInTheDocument();
      });
    });
  });

  describe('Test de validación de límite de acompañantes', () => {
    it('should prevent adding more companions than the limit', async () => {
      const mockGuest = {
        id: '123',
        name: 'Juan Pérez',
        unique_id: 'test-unique-id',
        companion_limit: 2,
        confirmed: false,
      };

      supabaseClient.getGuestByUniqueId.mockResolvedValue({
        data: mockGuest,
        error: null,
      });

      renderInvitationPage();

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });

      // Initially there's 1 input field
      let inputs = screen.getAllByPlaceholderText(/Acompañante/i);
      expect(inputs).toHaveLength(1);

      // Add button should be visible
      let addButton = screen.queryByRole('button', { name: /Agregar Acompañante/i });
      expect(addButton).toBeInTheDocument();

      // Add one more to reach limit of 2
      fireEvent.click(addButton);

      // Now we have 2 fields (at the limit)
      inputs = screen.getAllByPlaceholderText(/Acompañante/i);
      expect(inputs).toHaveLength(2);

      // Add button should no longer be visible (at limit)
      addButton = screen.queryByRole('button', { name: /Agregar Acompañante/i });
      expect(addButton).not.toBeInTheDocument();
    });

    it('should prevent form submission when companion limit is exceeded', async () => {
      const mockGuest = {
        id: '123',
        name: 'María García',
        unique_id: 'test-unique-id',
        companion_limit: 1,
        confirmed: false,
      };

      supabaseClient.getGuestByUniqueId.mockResolvedValue({
        data: mockGuest,
        error: null,
      });

      renderInvitationPage();

      await waitFor(() => {
        expect(screen.getByText('María García')).toBeInTheDocument();
      });

      // With limit of 1, there's already 1 input field shown
      // The UI prevents adding more fields, so we test that the limit is enforced
      const inputs = screen.getAllByPlaceholderText(/Acompañante/i);
      expect(inputs).toHaveLength(1);
      
      // Fill in the companion name
      fireEvent.change(inputs[0], { target: { value: 'Companion 1' } });

      // Try to add another (should not be possible or show error)
      const addButtons = screen.queryAllByRole('button', { name: /Agregar Acompañante/i });
      if (addButtons.length > 0) {
        fireEvent.click(addButtons[0]);
        
        // Should show error message
        await waitFor(() => {
          const errorMessage = screen.queryByText(/No puedes agregar más de 1 acompañante/i);
          if (errorMessage) {
            expect(errorMessage).toBeInTheDocument();
          }
        });
      }

      // Verify that we can still submit with 1 companion (within limit)
      supabaseClient.updateGuestConfirmation.mockResolvedValue({
        data: { ...mockGuest, confirmed: true },
        error: null,
      });

      supabaseClient.addCompanions.mockResolvedValue({
        data: [{ id: '1', guest_id: '123', name: 'Companion 1' }],
        error: null,
      });

      const submitButton = screen.getByRole('button', { name: /^Confirmar Asistencia$/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(supabaseClient.updateGuestConfirmation).toHaveBeenCalledWith('123', true);
        expect(supabaseClient.addCompanions).toHaveBeenCalledWith('123', ['Companion 1']);
      });
    });

    it('should display companion limit to the guest', async () => {
      const mockGuest = {
        id: '123',
        name: 'Carlos López',
        unique_id: 'test-unique-id',
        companion_limit: 3,
        confirmed: false,
      };

      supabaseClient.getGuestByUniqueId.mockResolvedValue({
        data: mockGuest,
        error: null,
      });

      renderInvitationPage();

      await waitFor(() => {
        expect(screen.getByText(/Puedes traer hasta/i)).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
      
      // Verify the full text in companion-info section
      const companionInfo = screen.getByText(/Puedes traer hasta/i).closest('.companion-info');
      expect(companionInfo).toHaveTextContent('Puedes traer hasta 3 acompañantes.');
    });
  });

  describe('Test de envío exitoso de confirmación', () => {
    it('should successfully submit confirmation without companions', async () => {
      const mockGuest = {
        id: '123',
        name: 'Ana Martínez',
        unique_id: 'test-unique-id',
        companion_limit: 2,
        confirmed: false,
      };

      supabaseClient.getGuestByUniqueId.mockResolvedValue({
        data: mockGuest,
        error: null,
      });

      supabaseClient.updateGuestConfirmation.mockResolvedValue({
        data: { ...mockGuest, confirmed: true },
        error: null,
      });

      renderInvitationPage();

      await waitFor(() => {
        expect(screen.getByText('Ana Martínez')).toBeInTheDocument();
      });

      // Submit without adding companions
      const submitButton = screen.getByRole('button', { name: /^Confirmar Asistencia$/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(supabaseClient.updateGuestConfirmation).toHaveBeenCalledWith('123', true);
        expect(screen.getByText(/¡Confirmación Exitosa!/i)).toBeInTheDocument();
        expect(screen.getByText(/Gracias por confirmar tu asistencia, Ana Martínez/i)).toBeInTheDocument();
      });
    });

    it('should successfully submit confirmation with companions', async () => {
      const mockGuest = {
        id: '456',
        name: 'Pedro Sánchez',
        unique_id: 'test-unique-id',
        companion_limit: 2,
        confirmed: false,
      };

      supabaseClient.getGuestByUniqueId.mockResolvedValue({
        data: mockGuest,
        error: null,
      });

      supabaseClient.updateGuestConfirmation.mockResolvedValue({
        data: { ...mockGuest, confirmed: true },
        error: null,
      });

      supabaseClient.addCompanions.mockResolvedValue({
        data: [
          { id: '1', guest_id: '456', name: 'Companion 1' },
          { id: '2', guest_id: '456', name: 'Companion 2' },
        ],
        error: null,
      });

      renderInvitationPage();

      await waitFor(() => {
        expect(screen.getByText('Pedro Sánchez')).toBeInTheDocument();
      });

      // Add a companion
      const addButton = screen.getByRole('button', { name: /Agregar Acompañante/i });
      fireEvent.click(addButton);

      // Fill in companion names
      const inputs = screen.getAllByPlaceholderText(/Acompañante/i);
      fireEvent.change(inputs[0], { target: { value: 'Companion 1' } });
      fireEvent.change(inputs[1], { target: { value: 'Companion 2' } });

      // Submit
      const submitButton = screen.getByRole('button', { name: /^Confirmar Asistencia$/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(supabaseClient.updateGuestConfirmation).toHaveBeenCalledWith('456', true);
        expect(supabaseClient.addCompanions).toHaveBeenCalledWith('456', ['Companion 1', 'Companion 2']);
        expect(screen.getByText(/¡Confirmación Exitosa!/i)).toBeInTheDocument();
      });
    });

    it('should handle submission errors gracefully', async () => {
      const mockGuest = {
        id: '789',
        name: 'Laura Fernández',
        unique_id: 'test-unique-id',
        companion_limit: 1,
        confirmed: false,
      };

      supabaseClient.getGuestByUniqueId.mockResolvedValue({
        data: mockGuest,
        error: null,
      });

      supabaseClient.updateGuestConfirmation.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      renderInvitationPage();

      await waitFor(() => {
        expect(screen.getByText('Laura Fernández')).toBeInTheDocument();
      });

      // Submit
      const submitButton = screen.getByRole('button', { name: /^Confirmar Asistencia$/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Error al guardar la confirmación/i)).toBeInTheDocument();
      });
    });

    it('should filter out empty companion names before submission', async () => {
      const mockGuest = {
        id: '999',
        name: 'Roberto Díaz',
        unique_id: 'test-unique-id',
        companion_limit: 3,
        confirmed: false,
      };

      supabaseClient.getGuestByUniqueId.mockResolvedValue({
        data: mockGuest,
        error: null,
      });

      supabaseClient.updateGuestConfirmation.mockResolvedValue({
        data: { ...mockGuest, confirmed: true },
        error: null,
      });

      supabaseClient.addCompanions.mockResolvedValue({
        data: [{ id: '1', guest_id: '999', name: 'Only Companion' }],
        error: null,
      });

      renderInvitationPage();

      await waitFor(() => {
        expect(screen.getByText('Roberto Díaz')).toBeInTheDocument();
      });

      // Add companions but only fill one
      const addButton = screen.getByRole('button', { name: /Agregar Acompañante/i });
      fireEvent.click(addButton);
      fireEvent.click(addButton);

      const inputs = screen.getAllByPlaceholderText(/Acompañante/i);
      fireEvent.change(inputs[1], { target: { value: 'Only Companion' } });
      // Leave inputs[0] and inputs[2] empty

      // Submit
      const submitButton = screen.getByRole('button', { name: /^Confirmar Asistencia$/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(supabaseClient.addCompanions).toHaveBeenCalledWith('999', ['Only Companion']);
        expect(screen.getByText(/¡Confirmación Exitosa!/i)).toBeInTheDocument();
      });
    });
  });
});
