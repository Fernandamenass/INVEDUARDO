import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import InvitationPage from './pages/InvitationPage';
import LoginPage from './pages/LoginPage';
import AdminPanel from './pages/AdminPanel';
import ErrorPage from './pages/ErrorPage';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
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
          <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0a1628 0%, #1e3a8a 50%, #0f172a 100%)',
            color: '#d4af37',
            textAlign: 'center',
            padding: '40px',
            fontFamily: '"Playfair Display", serif'
          }}>
            <div style={{
              maxWidth: '600px',
              padding: '60px 40px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '2px solid #d4af37',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(212, 175, 55, 0.2)'
            }}>
              <h1 style={{ 
                fontSize: '2.5rem', 
                marginBottom: '30px',
                fontWeight: '700',
                letterSpacing: '2px'
              }}>
                Invitación a mi Graduación
              </h1>
              <div style={{
                width: '80px',
                height: '2px',
                background: '#d4af37',
                margin: '0 auto 30px'
              }}></div>
              <p style={{ 
                fontSize: '1.2rem',
                lineHeight: '1.8',
                color: '#e5e7eb',
                fontFamily: '"Georgia", serif'
              }}>
                Por favor, acceda mediante el enlace único que recibió en su invitación personal.
              </p>
            </div>
          </div>
        } />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
