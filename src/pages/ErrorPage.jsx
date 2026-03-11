import { useNavigate } from 'react-router-dom';
import './ErrorPage.css';

function ErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="error-page">
      <div className="error-content">
        <h1 className="error-code">404</h1>
        <h2 className="error-title">Página no encontrada</h2>
        <p className="error-message">
          Lo sentimos, la página que buscas no existe o la URL es inválida.
        </p>
        <p className="error-hint">
          Si recibiste una invitación, por favor verifica que hayas copiado correctamente el enlace completo.
        </p>
        <button 
          className="error-button"
          onClick={() => navigate('/')}
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

export default ErrorPage;
