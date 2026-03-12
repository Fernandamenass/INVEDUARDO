import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getGuestByUniqueId, updateGuestConfirmation, addCompanions } from '../services/supabaseClient';
import './InvitationPage.css';

function InvitationPage() {
  const { uniqueId } = useParams();
  const [guest, setGuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companions, setCompanions] = useState(['']);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    loadGuestData();
  }, [uniqueId]);

  async function loadGuestData() {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await getGuestByUniqueId(uniqueId);
      
      if (fetchError) {
        setError('Error al cargar la invitación. Por favor, verifica tu enlace.');
        return;
      }
      
      if (!data) {
        setError('Invitación no encontrada. Por favor, verifica tu enlace.');
        return;
      }
      
      setGuest(data);
    } catch (err) {
      setError('Error al cargar la invitación. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  function handleCompanionChange(index, value) {
    const newCompanions = [...companions];
    newCompanions[index] = value;
    setCompanions(newCompanions);
    setValidationError('');
  }

  function addCompanionField() {
    if (companions.length >= guest.companion_limit) {
      setValidationError(`No puedes agregar más de ${guest.companion_limit} acompañante${guest.companion_limit !== 1 ? 's' : ''}.`);
      return;
    }
    setCompanions([...companions, '']);
  }

  function removeCompanionField(index) {
    const newCompanions = companions.filter((_, i) => i !== index);
    setCompanions(newCompanions.length > 0 ? newCompanions : ['']);
    setValidationError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Filter out empty companion names
    const filledCompanions = companions.filter(name => name.trim() !== '');
    
    // Validate companion limit
    if (filledCompanions.length > guest.companion_limit) {
      setValidationError(`No puedes registrar más de ${guest.companion_limit} acompañante${guest.companion_limit !== 1 ? 's' : ''}.`);
      return;
    }
    
    try {
      setSubmitting(true);
      setValidationError('');
      
      // Update guest confirmation status
      const { error: updateError } = await updateGuestConfirmation(guest.id, true);
      if (updateError) throw updateError;
      
      // Add companions if any
      if (filledCompanions.length > 0) {
        const { error: companionsError } = await addCompanions(guest.id, filledCompanions);
        if (companionsError) throw companionsError;
      }
      
      setSuccess(true);
    } catch (err) {
      setValidationError('Error al guardar la confirmación. Por favor, intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="invitation-page">
        <div className="invitation-card">
          <p>Cargando invitación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invitation-page">
        <div className="invitation-card error-card">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="invitation-page">
        <div className="invitation-card success-card">
          <h2>¡Confirmación Exitosa!</h2>
          <p>Gracias por confirmar tu asistencia, {guest.name}.</p>
          <p>¡Te esperamos en la graduación!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="invitation-page">
      <div className="invitation-card">
        <div className="invitation-header">
          <h1>Invitación a mi Graduación</h1>
          <div className="decorative-line"></div>
        </div>
        
        <div className="invitation-body">
          <h2 className="guest-name">{guest.name}</h2>
          
          <p className="invitation-text">
            Nos complace invitarte a celebrar mi graduación.
          </p>
          
          <div className="event-details">
            <div className="detail-item">
              <span className="detail-icon">📅</span>
              <div className="detail-content">
                <strong>Fecha</strong>
                <p>26 de Junio, 2026</p>
              </div>
            </div>
            
            <div className="detail-item">
              <span className="detail-icon">🕒</span>
              <div className="detail-content">
                <strong>Hora</strong>
                <p>3:30 PM - 8:30 PM</p>
              </div>
            </div>
            
            <div className="detail-item">
              <span className="detail-icon">📍</span>
              <div className="detail-content">
                <strong>Lugar</strong>
                <p>Annea Eventos</p>
              </div>
            </div>
          </div>

          <div className="map-section">
            <h3>Ubicación</h3>
            <div className="map-container">
              <iframe
                src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=Annea+Eventos&zoom=15"
                width="100%"
                height="300"
                style={{ border: 0, borderRadius: '8px' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación del evento"
              ></iframe>
            </div>
            <a 
              href="https://www.google.com/maps/search/?api=1&query=Annea+Eventos"
              target="_blank"
              rel="noopener noreferrer"
              className="directions-link"
            >
              Ver en Google Maps →
            </a>
          </div>
          
          {guest.companion_limit > 0 && (
            <div className="companion-info">
              <p>
                Puedes traer hasta <strong>{guest.companion_limit}</strong> acompañante{guest.companion_limit !== 1 ? 's' : ''}.
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="confirmation-form">
            <h3>Confirmar Asistencia</h3>
            
            {guest.companion_limit > 0 && (
              <div className="companions-section">
                <label>Nombres de Acompañantes:</label>
                {companions.map((companion, index) => (
                  <div key={index} className="companion-input-group">
                    <input
                      type="text"
                      value={companion}
                      onChange={(e) => handleCompanionChange(index, e.target.value)}
                      placeholder={`Acompañante ${index + 1}`}
                      className="companion-input"
                    />
                    {companions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCompanionField(index)}
                        className="remove-btn"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                
                {companions.length < guest.companion_limit && (
                  <button
                    type="button"
                    onClick={addCompanionField}
                    className="add-companion-btn"
                  >
                    + Agregar Acompañante
                  </button>
                )}
              </div>
            )}
            
            {validationError && (
              <div className="error-message">
                {validationError}
              </div>
            )}
            
            <button
              type="submit"
              disabled={submitting}
              className="submit-btn"
            >
              {submitting ? 'Enviando...' : 'Confirmar Asistencia'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default InvitationPage;
