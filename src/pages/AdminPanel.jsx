import { useState, useEffect } from 'react';
import { getAllGuestsWithCompanions, subscribeToGuestsChanges, subscribeToCompanionsChanges } from '../services/supabaseClient';
import * as XLSX from 'xlsx';
import './AdminPanel.css';

function AdminPanel() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadGuestsData();

    // Subscribe to real-time changes in guests table
    const guestsSubscription = subscribeToGuestsChanges(() => {
      // Reload data when guests table changes
      loadGuestsData();
    });

    // Subscribe to real-time changes in companions table
    const companionsSubscription = subscribeToCompanionsChanges(() => {
      // Reload data when companions table changes
      loadGuestsData();
    });

    // Cleanup subscriptions on component unmount
    return () => {
      guestsSubscription.unsubscribe();
      companionsSubscription.unsubscribe();
    };
  }, []);

  const loadGuestsData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error: fetchError } = await getAllGuestsWithCompanions();
      
      if (fetchError) {
        setError('Error al cargar los datos. Por favor, intenta nuevamente.');
        console.error('Error fetching guests:', fetchError);
        setLoading(false);
        return;
      }
      
      setGuests(data || []);
      setLoading(false);
    } catch (err) {
      setError('Error al cargar los datos. Por favor, intenta nuevamente.');
      console.error('Error loading guests:', err);
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    try {
      // Prepare data for Excel export
      const exportData = guests.map(guest => {
        // Get companion names as a comma-separated string
        const companionNames = guest.companions && guest.companions.length > 0
          ? guest.companions.map(c => c.name).join(', ')
          : 'Sin acompañantes';
        
        return {
          'Nombre Invitado': guest.name,
          'Confirmado': guest.confirmed ? 'Sí' : 'No',
          'Acompañantes': companionNames
        };
      });

      // Create a new workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Confirmaciones');

      // Generate Excel file and trigger download
      const fileName = `confirmaciones_graduacion_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      setError('Error al exportar los datos. Por favor, intenta nuevamente.');
    }
  };

  // Calculate totals
  const confirmedGuests = guests.filter(guest => guest.confirmed);
  const totalConfirmedGuests = confirmedGuests.length;
  
  const totalCompanions = confirmedGuests.reduce((sum, guest) => {
    return sum + (guest.companions?.length || 0);
  }, 0);
  
  const totalAttendees = totalConfirmedGuests + totalCompanions;

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="admin-container">
          <div className="loading-message">
            <p>Cargando datos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <div className="admin-header">
          <h1>Panel Administrativo</h1>
          <div className="decorative-line"></div>
          <button 
            className="export-button" 
            onClick={exportToExcel}
            disabled={guests.length === 0}
          >
            Exportar a Excel
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Totals Summary */}
        <div className="totals-section">
          <div className="total-card">
            <div className="total-label">Invitados Confirmados</div>
            <div className="total-value">{totalConfirmedGuests}</div>
          </div>
          <div className="total-card">
            <div className="total-label">Acompañantes</div>
            <div className="total-value">{totalCompanions}</div>
          </div>
          <div className="total-card total-card-highlight">
            <div className="total-label">Total Asistentes</div>
            <div className="total-value">{totalAttendees}</div>
          </div>
        </div>

        {/* Guests List */}
        <div className="guests-section">
          <h2>Lista de Invitados</h2>
          
          {guests.length === 0 ? (
            <div className="no-data-message">
              <p>No hay invitados registrados.</p>
            </div>
          ) : (
            <div className="guests-list">
              {guests.map((guest) => (
                <div key={guest.id} className={`guest-card ${guest.confirmed ? 'confirmed' : 'pending'}`}>
                  <div className="guest-header">
                    <h3 className="guest-name">{guest.name}</h3>
                    <span className={`status-badge ${guest.confirmed ? 'status-confirmed' : 'status-pending'}`}>
                      {guest.confirmed ? 'Confirmado' : 'Pendiente'}
                    </span>
                  </div>
                  
                  <div className="guest-details">
                    <p className="guest-info">
                      <strong>Límite de acompañantes:</strong> {guest.companion_limit}
                    </p>
                    
                    <div className="invitation-link-section">
                      <p className="guest-info">
                        <strong>ID único:</strong> <code className="unique-id-code">{guest.unique_id}</code>
                      </p>
                      <p className="guest-info">
                        <strong>URL de invitación:</strong>
                      </p>
                      <div className="invitation-url-container">
                        <input 
                          type="text" 
                          readOnly 
                          value={`${window.location.origin}/invitation/${guest.unique_id}`}
                          className="invitation-url-input"
                          onClick={(e) => e.target.select()}
                        />
                        <button 
                          className="copy-url-btn"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/invitation/${guest.unique_id}`);
                            alert('URL copiada al portapapeles');
                          }}
                        >
                          Copiar
                        </button>
                      </div>
                    </div>
                    
                    {guest.confirmed && guest.companions && guest.companions.length > 0 && (
                      <div className="companions-list">
                        <strong>Acompañantes:</strong>
                        <ul>
                          {guest.companions.map((companion) => (
                            <li key={companion.id}>{companion.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {guest.confirmed && (!guest.companions || guest.companions.length === 0) && (
                      <p className="no-companions">Sin acompañantes</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
