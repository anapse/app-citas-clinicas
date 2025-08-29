import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { authService } from './services/authService';

// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Componentes existentes (sistema público)
import { AuthProvider } from './context/AuthContext';
import { ModalProvider, useModal } from './context/ModalContext';
import Navbar from './components/Navbar';
import CalendarMonth from './components/CalendarMonth';
import DayScheduleGrid from './components/DayScheduleGrid';
import AppointmentModal from './components/AppointmentModal';
import './styles/globals.css';
import './styles/components.css';

// Crear cliente de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Componente para rutas protegidas del dashboard
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Componente principal público del sistema de citas
const PublicCalendarApp = ({ user, onLogin }) => {
  const { 
    showSchedule, 
    selectedDate, 
    showAppointmentModal, 
    selectedHour,
    closeScheduleModal,
    closeAppointmentModal,
    openAppointmentModal 
  } = useModal();

  return (
    <div>
      {/* Navbar normal */}
      <Navbar user={user} onLogin={onLogin} showLoginInNavbar={true} />
      
      {/* Calendario */}
      <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <CalendarMonth />
        </div>

        {/* Información de especialidades */}
        <div style={{ 
          display: 'grid', 
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
        }}>
          <div className="specialty-card">
            <div className="specialty-header">
              <span className="specialty-icon">📅</span>
              <h3 className="specialty-title">Endocrinología Pediátrica</h3>
            </div>
            <div className="specialty-info">
              <p><strong>Miércoles 5:00 PM a 6:00 PM</strong></p>
              <p className="specialty-note">⏰ Llegar 10 minutos antes</p>
            </div>
            <div className="specialty-action available">
              ✅ Puedes reservar tu cita en línea
            </div>
          </div>
          
          <div className="specialty-card">
            <div className="specialty-header">
              <span className="specialty-icon">🧒</span>
              <h3 className="specialty-title">Pediatría</h3>
            </div>
            <div className="specialty-info">
              <p><strong>Lun-Sáb:</strong> 8:00am-1:00pm y 3:00pm-7:00pm</p>
              <p><strong>Domingo:</strong> 9:00am-1:00pm</p>
            </div>
            <div className="specialty-action walkin">
              ⚠️ Atención por orden de llegada
            </div>
          </div>

          <div className="specialty-card">
            <div className="specialty-header">
              <span className="specialty-icon">🧴</span>
              <h3 className="specialty-title">Dermatología</h3>
            </div>
            <div className="specialty-info">
              <p><strong>Jueves 3:00 PM</strong></p>
              <p className="specialty-note">⏰ Llegar 10 minutos antes</p>
            </div>
            <div className="specialty-action available">
              ✅ Puedes reservar tu cita en línea
            </div>
          </div>

          <div className="specialty-card">
            <div className="specialty-header">
              <span className="specialty-icon">🫁</span>
              <h3 className="specialty-title">Neumología e Inmunología</h3>
            </div>
            <div className="specialty-info">
              <p>Médicos de Lima - Fechas específicas</p>
              <p>1-2 veces al mes</p>
            </div>
            <div className="specialty-action contact">
              📞 Envía tus datos y nos contactaremos
            </div>
          </div>

          <div className="specialty-card">
            <div className="specialty-header">
              <span className="specialty-icon">🏥</span>
              <h3 className="specialty-title">Otras Especialidades</h3>
            </div>
            <div className="specialty-info">
              <p>Cardiología, Neurología, Oftalmología</p>
              <p>Psicología</p>
            </div>
            <div className="specialty-action contact">
              📞 Envía tus datos y nos contactaremos
            </div>
          </div>
        </div>
      </div>

      {/* Footer normal */}
      <footer style={{ 
        background: 'var(--surface)', 
        borderTop: '1px solid var(--border)', 
        padding: '1rem 0', 
        textAlign: 'center', 
        marginTop: '2rem' 
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '2rem', 
            flexWrap: 'wrap' 
          }}>
            <span className="text-sm text-secondary">
              🔸 <strong>Lunes a sábado:</strong> 8:00am a 1:00pm y de 3:00pm a 7:00pm
            </span>
            <span className="text-sm text-secondary">
              🔸 <strong>Domingo:</strong> 9:00am a 1:00pm
            </span>
          </div>
          <p className="text-xs text-secondary" style={{ marginTop: '0.5rem' }}>
            © 2025 Sistema de Citas Clínicas. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      {/* Modales para reservar citas */}
      <DayScheduleGrid
        isOpen={showSchedule}
        selectedDate={selectedDate}
        onClose={closeScheduleModal}
        onPick={({ hour }) => {
          openAppointmentModal(hour);
        }}
      />

      <AppointmentModal
        isOpen={showAppointmentModal}
        onClose={closeAppointmentModal}
        selectedDate={selectedDate}
        selectedHour={selectedHour}
        isPublic={true}
      />
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (authService.isAuthenticated()) {
        const userData = authService.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      authService.logout();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            {/* Login solo para acceder al dashboard */}
            <Route 
              path="/login" 
              element={
                user ? 
                <Navigate to="/dashboard" /> : 
                <Login onLogin={handleLogin} />
              } 
            />
            
            {/* Dashboard protegido para admin/moderador/doctor */}
            <Route 
              path="/dashboard/*" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Sistema público por defecto */}
            <Route 
              path="/" 
              element={
                <AuthProvider>
                  <ModalProvider>
                    <PublicCalendarApp user={user} onLogin={handleLogin} />
                  </ModalProvider>
                </AuthProvider>
              } 
            />
            
            {/* Todas las rutas no encontradas van al sistema público */}
            <Route 
              path="*" 
              element={<Navigate to="/" />} 
            />
          </Routes>
          
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: 'toast',
              style: {
                background: 'var(--surface-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow-lg)',
              },
              success: {
                duration: 3000,
                style: {
                  background: 'var(--success)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                },
              },
              error: {
                style: {
                  background: 'var(--error)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
