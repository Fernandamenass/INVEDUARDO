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
          <h1>Invitación a la Graduación</h1>
          <div className="decorative-line"></div>
        </div>
        
        <div className="invitation-body">
          <p className="greeting">Estimado/a</p>
          <h2 className="guest-name">{guest.name}</h2>
          
          <p className="invitation-text">
            Nos complace invitarte a celebrar la graduación de Eduardo.
          </p>
          
          <div className="companion-info">
            <p>
              Puedes traer hasta <strong>{guest.companion_limit}</strong> acompañante{guest.companion_limit !== 1 ? 's' : ''}.
            </p>
          </div>
          
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
