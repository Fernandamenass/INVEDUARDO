import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import AdminPanel from './AdminPanel';
import * as supabaseClient from '../services/supabaseClient';
import * as XLSX from 'xlsx';

// Mock subscription object
const mockSubscription = {
  unsubscribe: vi.fn(),
};

// Mock the supabaseClient module
vi.mock('../services/supabaseClient', () => ({
  getAllGuestsWithCompanions: vi.fn(),
  subscribeToGuestsChanges: vi.fn(),
  subscribeToCompanionsChanges: vi.fn(),
}));

// Mock the xlsx library
vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(),
    book_new: vi.fn(),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

describe('AdminPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations for subscriptions
    supabaseClient.subscribeToGuestsChanges.mockReturnValue(mockSubscription);
    supabaseClient.subscribeToCompanionsChanges.mockReturnValue(mockSubscription);
  });

  it('should display loading state initially', () => {
    // Mock pending promise
    supabaseClient.getAllGuestsWithCompanions.mockReturnValue(
      new Promise(() => {}) // Never resolves
    );

    render(<AdminPanel />);
    
    expect(screen.getByText('Cargando datos...')).toBeInTheDocument();
  });

  it('should display error message when data fetch fails', async () => {
    supabaseClient.getAllGuestsWithCompanions.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText('Error al cargar los datos. Por favor, intenta nuevamente.')).toBeInTheDocument();
    });
  });

  it('should display no data message when there are no guests', async () => {
    supabaseClient.getAllGuestsWithCompanions.mockResolvedValue({
      data: [],
      error: null,
    });

    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText('No hay invitados registrados.')).toBeInTheDocument();
    });
  });

  it('should calculate and display totals correctly', async () => {
    const mockGuests = [
      {
        id: '1',
        name: 'Juan Pérez',
        confirmed: true,
        companion_limit: 2,
        companions: [
          { id: 'c1', name: 'María García' },
          { id: 'c2', name: 'Pedro López' },
        ],
      },
      {
        id: '2',
        name: 'Ana Martínez',
        confirmed: true,
        companion_limit: 1,
        companions: [
          { id: 'c3', name: 'Luis Rodríguez' },
        ],
      },
      {
        id: '3',
        name: 'Carlos Sánchez',
        confirmed: false,
        companion_limit: 3,
        companions: [],
      },
    ];

    supabaseClient.getAllGuestsWithCompanions.mockResolvedValue({
      data: mockGuests,
      error: null,
    });

    render(<AdminPanel />);

    await waitFor(() => {
      // Check that the totals section is rendered
      expect(screen.getByText('Invitados Confirmados')).toBeInTheDocument();
      expect(screen.getByText('Acompañantes')).toBeInTheDocument();
      expect(screen.getByText('Total Asistentes')).toBeInTheDocument();

      // Get all total-value elements and verify their content
      const totalValues = document.querySelectorAll('.total-value');
      expect(totalValues).toHaveLength(3);
      
      // Total confirmed guests: 2 (Juan and Ana)
      expect(totalValues[0].textContent).toBe('2');
      
      // Total companions: 3 (María, Pedro, Luis)
      expect(totalValues[1].textContent).toBe('3');
      
      // Total attendees: 5 (2 guests + 3 companions)
      expect(totalValues[2].textContent).toBe('5');
    });
  });

  it('should display guest list with confirmation status', async () => {
    const mockGuests = [
      {
        id: '1',
        name: 'Juan Pérez',
        confirmed: true,
        companion_limit: 2,
        companions: [
          { id: 'c1', name: 'María García' },
        ],
      },
      {
        id: '2',
        name: 'Ana Martínez',
        confirmed: false,
        companion_limit: 1,
        companions: [],
      },
    ];

    supabaseClient.getAllGuestsWithCompanions.mockResolvedValue({
      data: mockGuests,
      error: null,
    });

    render(<AdminPanel />);

    await waitFor(() => {
      // Check guest names are displayed
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('Ana Martínez')).toBeInTheDocument();

      // Check confirmation status badges
      expect(screen.getByText('Confirmado')).toBeInTheDocument();
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });
  });

  it('should display companion names for confirmed guests', async () => {
    const mockGuests = [
      {
        id: '1',
        name: 'Juan Pérez',
        confirmed: true,
        companion_limit: 2,
        companions: [
          { id: 'c1', name: 'María García' },
          { id: 'c2', name: 'Pedro López' },
        ],
      },
    ];

    supabaseClient.getAllGuestsWithCompanions.mockResolvedValue({
      data: mockGuests,
      error: null,
    });

    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText('María García')).toBeInTheDocument();
      expect(screen.getByText('Pedro López')).toBeInTheDocument();
      expect(screen.getByText('Acompañantes:')).toBeInTheDocument();
    });
  });

  it('should display "Sin acompañantes" for confirmed guests without companions', async () => {
    const mockGuests = [
      {
        id: '1',
        name: 'Juan Pérez',
        confirmed: true,
        companion_limit: 2,
        companions: [],
      },
    ];

    supabaseClient.getAllGuestsWithCompanions.mockResolvedValue({
      data: mockGuests,
      error: null,
    });

    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText('Sin acompañantes')).toBeInTheDocument();
    });
  });

  it('should display companion limit for each guest', async () => {
    const mockGuests = [
      {
        id: '1',
        name: 'Juan Pérez',
        confirmed: true,
        companion_limit: 3,
        companions: [],
      },
    ];

    supabaseClient.getAllGuestsWithCompanions.mockResolvedValue({
      data: mockGuests,
      error: null,
    });

    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Límite de acompañantes:/)).toBeInTheDocument();
      expect(screen.getByText(/3/)).toBeInTheDocument();
    });
  });

  it('should calculate totals correctly when no guests are confirmed', async () => {
    const mockGuests = [
      {
        id: '1',
        name: 'Juan Pérez',
        confirmed: false,
        companion_limit: 2,
        companions: [],
      },
      {
        id: '2',
        name: 'Ana Martínez',
        confirmed: false,
        companion_limit: 1,
        companions: [],
      },
    ];

    supabaseClient.getAllGuestsWithCompanions.mockResolvedValue({
      data: mockGuests,
      error: null,
    });

    render(<AdminPanel />);

    await waitFor(() => {
      // All totals should be 0
      const zeroValues = screen.getAllByText('0');
      expect(zeroValues.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('should subscribe to real-time changes on mount', async () => {
    supabaseClient.getAllGuestsWithCompanions.mockResolvedValue({
      data: [],
      error: null,
    });

    render(<AdminPanel />);

    await waitFor(() => {
      // Verify subscriptions were set up
      expect(supabaseClient.subscribeToGuestsChanges).toHaveBeenCalledTimes(1);
      expect(supabaseClient.subscribeToCompanionsChanges).toHaveBeenCalledTimes(1);
      
      // Verify callbacks were provided
      expect(supabaseClient.subscribeToGuestsChanges).toHaveBeenCalledWith(expect.any(Function));
      expect(supabaseClient.subscribeToCompanionsChanges).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  it('should unsubscribe from real-time changes on unmount', async () => {
    supabaseClient.getAllGuestsWithCompanions.mockResolvedValue({
      data: [],
      error: null,
    });

    const { unmount } = render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText('No hay invitados registrados.')).toBeInTheDocument();
    });

    // Unmount the component
    unmount();

    // Verify unsubscribe was called for both subscriptions
    expect(mockSubscription.unsubscribe).toHaveBeenCalledTimes(2);
  });

  it('should reload data when guests table changes', async () => {
    const initialGuests = [
      {
        id: '1',
        name: 'Juan Pérez',
        confirmed: false,
        companion_limit: 2,
        companions: [],
      },
    ];

    const updatedGuests = [
      {
        id: '1',
        name: 'Juan Pérez',
        confirmed: true,
        companion_limit: 2,
        companions: [
          { id: 'c1', name: 'María García' },
        ],
      },
    ];

    // First call returns initial data
    supabaseClient.getAllGuestsWithCompanions.mockResolvedValueOnce({
      data: initialGuests,
      error: null,
    });

    // Capture the callback function
    let guestsChangeCallback;
    supabaseClient.subscribeToGuestsChanges.mockImplementation((callback) => {
      guestsChangeCallback = callback;
      return mockSubscription;
    });

    render(<AdminPanel />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });

    // Mock the second call with updated data
    supabaseClient.getAllGuestsWithCompanions.mockResolvedValueOnce({
      data: updatedGuests,
      error: null,
    });

    // Trigger the real-time update
    guestsChangeCallback();

    // Wait for the update to be reflected
    await waitFor(() => {
      expect(screen.getByText('Confirmado')).toBeInTheDocument();
      expect(screen.getByText('María García')).toBeInTheDocument();
    });
  });

  it('should reload data when companions table changes', async () => {
    const initialGuests = [
      {
        id: '1',
        name: 'Juan Pérez',
        confirmed: true,
        companion_limit: 2,
        companions: [],
      },
    ];

    const updatedGuests = [
      {
        id: '1',
        name: 'Juan Pérez',
        confirmed: true,
        companion_limit: 2,
        companions: [
          { id: 'c1', name: 'Pedro López' },
        ],
      },
    ];

    // First call returns initial data
    supabaseClient.getAllGuestsWithCompanions.mockResolvedValueOnce({
      data: initialGuests,
      error: null,
    });

    // Capture the callback function
    let companionsChangeCallback;
    supabaseClient.subscribeToCompanionsChanges.mockImplementation((callback) => {
      companionsChangeCallback = callback;
      return mockSubscription;
    });

    render(<AdminPanel />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('Sin acompañantes')).toBeInTheDocument();
    });

    // Mock the second call with updated data
    supabaseClient.getAllGuestsWithCompanions.mockResolvedValueOnce({
      data: updatedGuests,
      error: null,
    });

    // Trigger the real-time update
    companionsChangeCallback();

    // Wait for the update to be reflected
    await waitFor(() => {
      expect(screen.getByText('Pedro López')).toBeInTheDocument();
    });
  });

  // **Validates: Requirements 6.3, 6.4, 6.5**
  it('should not count unconfirmed guests in totals even if they have companions', async () => {
    const mockGuests = [
      {
        id: '1',
        name: 'Juan Pérez',
        confirmed: true,
        companion_limit: 2,
        companions: [
          { id: 'c1', name: 'María García' },
        ],
      },
      {
        id: '2',
        name: 'Ana Martínez',
        confirmed: false,
        companion_limit: 3,
        companions: [
          { id: 'c2', name: 'Pedro López' },
          { id: 'c3', name: 'Luis Rodríguez' },
        ],
      },
    ];

    supabaseClient.getAllGuestsWithCompanions.mockResolvedValue({
      data: mockGuests,
      error: null,
    });

    render(<AdminPanel />);

    await waitFor(() => {
      const totalValues = document.querySelectorAll('.total-value');
      
      // Only Juan (confirmed) should be counted
      expect(totalValues[0].textContent).toBe('1');
      
      // Only María (companion of confirmed guest) should be counted
      expect(totalValues[1].textContent).toBe('1');
      
      // Total: 1 guest + 1 companion = 2
      expect(totalValues[2].textContent).toBe('2');
    });
  });

  // **Validates: Requirements 6.3, 6.4, 6.5**
  it('should calculate totals correctly with mixed confirmed guests with and without companions', async () => {
    const mockGuests = [
      {
        id: '1',
        name: 'Juan Pérez',
        confirmed: true,
        companion_limit: 2,
        companions: [
          { id: 'c1', name: 'María García' },
          { id: 'c2', name: 'Pedro López' },
        ],
      },
      {
        id: '2',
        name: 'Ana Martínez',
        confirmed: true,
        companion_limit: 1,
        companions: [],
      },
      {
        id: '3',
        name: 'Carlos Sánchez',
        confirmed: true,
        companion_limit: 3,
        companions: [
          { id: 'c3', name: 'Luis Rodríguez' },
        ],
      },
    ];

    supabaseClient.getAllGuestsWithCompanions.mockResolvedValue({
      data: mockGuests,
      error: null,
    });

    render(<AdminPanel />);

    await waitFor(() => {
      const totalValues = document.querySelectorAll('.total-value');
      
      // 3 confirmed guests
      expect(totalValues[0].textContent).toBe('3');
      
      // 3 companions total (2 from Juan, 0 from Ana, 1 from Carlos)
      expect(totalValues[1].textContent).toBe('3');
      
      // Total: 3 guests + 3 companions = 6
      expect(totalValues[2].textContent).toBe('6');
    });
  });

  // **Validates: Requirements 6.3, 6.4, 6.5**
  it('should update totals when data changes from unconfirmed to confirmed', async () => {
    const initialGuests = [
      {
        id: '1',
        name: 'Juan Pérez',
        confirmed: false,
        companion_limit: 2,
        companions: [],
      },
    ];

    const updatedGuests = [
      {
        id: '1',
        name: 'Juan Pérez',
        confirmed: true,
        companion_limit: 2,
        companions: [
          { id: 'c1', name: 'María García' },
        ],
      },
    ];

    // First call returns initial data
    supabaseClient.getAllGuestsWithCompanions.mockResolvedValueOnce({
      data: initialGuests,
      error: null,
    });

    // Capture the callback function
    let guestsChangeCallback;
    supabaseClient.subscribeToGuestsChanges.mockImplementation((callback) => {
      guestsChangeCallback = callback;
      return mockSubscription;
    });

    render(<AdminPanel />);

    // Wait for initial render with zero totals
    await waitFor(() => {
      const totalValues = document.querySelectorAll('.total-value');
      expect(totalValues[0].textContent).toBe('0');
      expect(totalValues[1].textContent).toBe('0');
      expect(totalValues[2].textContent).toBe('0');
    });

    // Mock the second call with updated data
    supabaseClient.getAllGuestsWithCompanions.mockResolvedValueOnce({
      data: updatedGuests,
      error: null,
    });

    // Trigger the real-time update
    guestsChangeCallback();

    // Wait for the totals to update
    await waitFor(() => {
      const totalValues = document.querySelectorAll('.total-value');
      expect(totalValues[0].textContent).toBe('1');
      expect(totalValues[1].textContent).toBe('1');
      expect(totalValues[2].textContent).toBe('2');
    });
  });

  // **Validates: Requirements 6.3, 6.4, 6.5**
  it('should handle guests with null or undefined companions array', async () => {
    const mockGuests = [
      {
        id: '1',
        name: 'Juan Pérez',
        confirmed: true,
        companion_limit: 2,
        companions: null,
      },
      {
        id: '2',
        name: 'Ana Martínez',
        confirmed: true,
        companion_limit: 1,
        companions: undefined,
      },
    ];

    supabaseClient.getAllGuestsWithCompanions.mockResolvedValue({
      data: mockGuests,
      error: null,
    });

    render(<AdminPanel />);

    await waitFor(() => {
      const totalValues = document.querySelectorAll('.total-value');
      
      // 2 confirmed guests
      expect(totalValues[0].textContent).toBe('2');
      
      // 0 companions (null/undefined should be handled gracefully)
      expect(totalValues[1].textContent).toBe('0');
      
      // Total: 2 guests + 0 companions = 2
      expect(totalValues[2].textContent).toBe('2');
    });
  });

  // **Validates: Requirements 7.1**
  it('should display export button', async () => {
    supabaseClient.getAllGuestsWithCompanions.mockResolvedValue({
      data: [],
      error: null,
    });

    render(<AdminPanel />);

    await waitFor(() => {
      const exportButton = screen.getByText('Exportar a Excel');
      expect(exportButton).toBeInTheDocument();
    });
  });

  // **Validates: Requirements 7.1**
  it('should disable export button when there are no guests', async () => {
    supabaseClient.getAllGuestsWithCompanions.mockResolvedValue({
      data: [],
      error: null,
    });

    render(<AdminPanel />);

    await waitFor(() => {
      const exportButton = screen.getByText('Exportar a Excel');
      expect(exportButton).toBeDisabled();
    });
  });

  // **Validates: Requirements 7.1**
  it('should enable export button when there are guests', async () => {
    const mockGuests = [
      {
        id: '1',
        name: 'Juan Pérez',
        confirmed: true,
        companion_limit: 2,
        companions: [],
      },
    ];

    supabaseClient.getAllGuestsWithCompanions.mockResolvedValue({
      data: mockGuests,
      error: null,
    });

    render(<AdminPanel />);

    await waitFor(() => {
      const exportButton = screen.getByText('Exportar a Excel');
      expect(exportButton).not.toBeDisabled();
    });
  });

  // **Validates: Requirements 7.2, 7.3**
  it('should generate Excel file when export button is clicked', async () => {
    const mockGuests = [
      {
        id: '1',
        name: 'Juan Pérez',
        confirmed: true,
        companion_limit: 2,
        companions: [
          { id: 'c1', name: 'María García' },
        ],
      },
      {
        id: '2',
        name: 'Ana Martínez',
        confirmed: false,
        companion_limit: 1,
        companions: [],
      },
    ];

    supabaseClient.getAllGuestsWithCompanions.mockResolvedValue({
      data: mockGuests,
      error: null,
    });

    const mockWorksheet = {};
    const mockWorkbook = {};

    XLSX.utils.json_to_sheet.mockReturnValue(mockWorksheet);
    XLSX.utils.book_new.mockReturnValue(mockWorkbook);

    const user = userEvent.setup();
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText('Exportar a Excel')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Exportar a Excel');
    await user.click(exportButton);

    // Verify xlsx functions were called
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(1);
    expect(XLSX.utils.book_new).toHaveBeenCalledTimes(1);
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
      mockWorkbook,
      mockWorksheet,
      'Confirmaciones'
    );
    expect(XLSX.writeFile).toHaveBeenCalledTimes(1);
    expect(XLSX.writeFile).toHaveBeenCalledWith(
      mockWorkbook,
      expect.stringMatching(/^confirmaciones_graduacion_\d{4}-\d{2}-\d{2}\.xlsx$/)
    );
  });

  // **Validates: Requirements 7.3, 7.4, 7.5**
  it('should export data with correct format including guest name, confirmation status, and companions', async () => {
    const mockGuests = [
      {
        id: '1',
        name: 'Juan Pérez',
        confirmed: true,
        companion_limit: 2,
        companions: [
          { id: 'c1', name: 'María García' },
          { id: 'c2', name: 'Pedro López' },
        ],
      },
      {
        id: '2',
        name: 'Ana Martínez',
        confirmed: false,
        companion_limit: 1,
        companions: [],
      },
      {
        id: '3',
        name: 'Carlos Sánchez',
        confirmed: true,
        companion_limit: 3,
        companions: [],
      },
    ];

    supabaseClient.getAllGuestsWithCompanions.mockResolvedValue({
      data: mockGuests,
      error: null,
    });

    const user = userEvent.setup();
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText('Exportar a Excel')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Exportar a Excel');
    await user.click(exportButton);

    // Verify the data format passed to json_to_sheet
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([
      {
        'Nombre Invitado': 'Juan Pérez',
        'Confirmado': 'Sí',
        'Acompañantes': 'María García, Pedro López',
      },
      {
        'Nombre Invitado': 'Ana Martínez',
        'Confirmado': 'No',
        'Acompañantes': 'Sin acompañantes',
      },
      {
        'Nombre Invitado': 'Carlos Sánchez',
        'Confirmado': 'Sí',
        'Acompañantes': 'Sin acompañantes',
      },
    ]);
  });

  // **Validates: Requirements 7.5**
  it('should handle guests with null or undefined companions in export', async () => {
    const mockGuests = [
      {
        id: '1',
        name: 'Juan Pérez',
        confirmed: true,
        companion_limit: 2,
        companions: null,
      },
      {
        id: '2',
        name: 'Ana Martínez',
        confirmed: true,
        companion_limit: 1,
        companions: undefined,
      },
    ];

    supabaseClient.getAllGuestsWithCompanions.mockResolvedValue({
      data: mockGuests,
      error: null,
    });

    const user = userEvent.setup();
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText('Exportar a Excel')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Exportar a Excel');
    await user.click(exportButton);

    // Verify null/undefined companions are handled gracefully
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([
      {
        'Nombre Invitado': 'Juan Pérez',
        'Confirmado': 'Sí',
        'Acompañantes': 'Sin acompañantes',
      },
      {
        'Nombre Invitado': 'Ana Martínez',
        'Confirmado': 'Sí',
        'Acompañantes': 'Sin acompañantes',
      },
    ]);
  });

  // **Validates: Requirements 7.5**
  it('should include all companion names separated by commas in export', async () => {
    const mockGuests = [
      {
        id: '1',
        name: 'Juan Pérez',
        confirmed: true,
        companion_limit: 3,
        companions: [
          { id: 'c1', name: 'María García' },
          { id: 'c2', name: 'Pedro López' },
          { id: 'c3', name: 'Luis Rodríguez' },
        ],
      },
    ];

    supabaseClient.getAllGuestsWithCompanions.mockResolvedValue({
      data: mockGuests,
      error: null,
    });

    const user = userEvent.setup();
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText('Exportar a Excel')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Exportar a Excel');
    await user.click(exportButton);

    // Verify all companion names are included and comma-separated
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([
      {
        'Nombre Invitado': 'Juan Pérez',
        'Confirmado': 'Sí',
        'Acompañantes': 'María García, Pedro López, Luis Rodríguez',
      },
    ]);
  });
});
