import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ModalProvider, useModal } from './context/ModalContext';
import Navbar from './components/Navbar';
import CalendarMonth from './components/CalendarMonth';
import DayScheduleGrid from './components/DayScheduleGrid';
import AppointmentModal from './components/AppointmentModal';
import './styles/globals.css';
import './styles/components.css';

// Componente principal de la aplicación
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', }}>
      {/* Navbar siempre visible */}
      <Navbar />
      
      {/* Contenido principal */}
      <main className="container">
        {/* Vista principal - Siempre visible para todos los usuarios */}
        {/* Calendario principal - Visible para todos */}
        <CalendarMonth />
        
        {/* Información para pacientes */}
        <div style={{ 
          marginTop: '2rem', 
          display: 'grid', 
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          maxWidth: '900px',
          margin: '2rem auto 0'
        }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 className="font-semibold mb-2">📅 Especialidades Disponibles</h3>
            <p className="text-secondary text-sm">
              Consulta General, Pediatría, Dermatología, Endocrinología
            </p>
          </div>
          
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 className="font-semibold mb-2">👨‍⚕️ Doctores Especialistas</h3>
            <p className="text-secondary text-sm">
              Profesionales altamente calificados a tu disposición
            </p>
          </div>
          
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 className="font-semibold mb-2">⏰ Horarios de Atención</h3>
            <p className="text-secondary text-sm">
              Lunes a Viernes: 8:00 AM - 6:00 PM
            </p>
          </div>
        </div>

        {/* Panel de administración - Solo visible para admins */}
        {isAuthenticated && (
          <div style={{ 
            marginTop: '3rem', 
            padding: '2rem', 
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
            borderRadius: 'var(--radius-xl)',
            color: 'white',
            boxShadow: 'var(--shadow-xl)',
            maxWidth: '900px',
            margin: '3rem auto 0'
          }}>
            <h2 className="text-lg font-bold mb-4">
              🔧 Panel de Administración
            </h2>
            <div style={{ 
              display: 'grid', 
              gap: '1rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
            }}>
              <div className="card" style={{ 
                padding: '1rem', 
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)'
              }}>
                <h4 className="font-semibold mb-2">📋 Gestionar Citas</h4>
                <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Crear, editar y eliminar citas médicas
                </p>
              </div>
              
              <div className="card" style={{ 
                padding: '1rem', 
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)'
              }}>
                <h4 className="font-semibold mb-2">👨‍⚕️ Gestionar Doctores</h4>
                <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Agregar y administrar médicos especialistas
                </p>
              </div>
              
              <div className="card" style={{ 
                padding: '1rem', 
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)'
              }}>
                <h4 className="font-semibold mb-2">⏰ Configurar Horarios</h4>
                <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Gestionar disponibilidad y horarios
                </p>
              </div>
              
              <div className="card" style={{ 
                padding: '1rem', 
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)'
              }}>
                <h4 className="font-semibold mb-2">📊 Ver Reportes</h4>
                <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Estadísticas y reportes del sistema
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer style={{ 
        backgroundColor: 'var(--surface)', 
        borderTop: '1px solid var(--border)', 
        padding: '1rem 0',
        textAlign: 'center',
        height: '4rem'
      }}>
        <div className="container">
          <p className="text-sm text-secondary">
            © 2025 Sistema de Citas Clínicas. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

// Componente que maneja los modales globales
const GlobalModals = () => {
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
    <>
      {/* Modal de horarios */}
      <DayScheduleGrid
        isOpen={showSchedule}
        selectedDate={selectedDate}
        onClose={closeScheduleModal}
        onPick={({ hour }) => {
          openAppointmentModal(hour);
        }}
      />

      {/* Modal de cita */}
      <AppointmentModal
        isOpen={showAppointmentModal}
        onClose={closeAppointmentModal}
        selectedDate={selectedDate}
        selectedHour={selectedHour}
      />
    </>
  );
};

// Componente App que envuelve todo con los proveedores
function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <AppContent />
        <GlobalModals />
      </ModalProvider>
    </AuthProvider>
  );
}

export default App;
