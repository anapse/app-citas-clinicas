import React, { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import CalendarMonth from './components/CalendarMonth';
import AppointmentModal from './components/AppointmentModal';
import LoginModal from './components/LoginModal';
import DayScheduleGrid from './components/DayScheduleGrid';
import { ModalProvider } from './context/ModalContext';

function App() {
  // Estado global de modales
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDayScheduleModalOpen, setIsDayScheduleModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  return (
    <ModalProvider>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <CalendarMonth />
        </main>

        {/* Modales globales */}
        {isAppointmentModalOpen && (
          <AppointmentModal
            isOpen={isAppointmentModalOpen}
            onClose={() => {
              setIsAppointmentModalOpen(false);
              setSelectedAppointment(null);
            }}
            appointment={selectedAppointment}
            date={selectedDate}
          />
        )}

        {isLoginModalOpen && (
          <LoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
          />
        )}

        {isDayScheduleModalOpen && (
          <DayScheduleGrid
            isOpen={isDayScheduleModalOpen}
            onClose={() => {
              setIsDayScheduleModalOpen(false);
              setSelectedDate(null);
            }}
            date={selectedDate}
          />
        )}
      </div>
    </ModalProvider>
  );
}

export default App;
