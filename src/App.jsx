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
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
            color: 'white',
            textAlign: 'center',
            padding: '20px'
          }}>
            <div>
              <h1>Sistema de Invitaciones de Graduación</h1>
              <p>Por favor, utiliza el enlace único que recibiste en tu invitación.</p>
            </div>
          </div>
        } />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
