import React, { createContext, useContext, useState } from 'react';

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal debe ser usado dentro de ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  // Estados para modal de horarios
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Estados para modal de cita
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedHour, setSelectedHour] = useState(null);

  // Funciones para modal de horarios
  const openScheduleModal = (date) => {
    setSelectedDate(date);
    setSelectedHour(null);
    setShowSchedule(true);
    setShowAppointmentModal(false);
  };

  const closeScheduleModal = () => {
    setShowSchedule(false);
    setSelectedDate(null);
  };

  // Funciones para modal de cita
  const openAppointmentModal = (hour) => {
    setSelectedHour(hour);
    setShowSchedule(false);
    setShowAppointmentModal(true);
  };

  const closeAppointmentModal = () => {
    setShowAppointmentModal(false);
    setSelectedHour(null);
  };

  const value = {
    // Estados
    showSchedule,
    selectedDate,
    showAppointmentModal,
    selectedHour,
    
    // Funciones
    openScheduleModal,
    closeScheduleModal,
    openAppointmentModal,
    closeAppointmentModal,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};
