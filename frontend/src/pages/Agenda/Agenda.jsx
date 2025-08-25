import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import './Agenda.css';

const Agenda = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDoctor, setSelectedDoctor] = useState(searchParams.get('doctor') || '');
  const [doctores, setDoctores] = useState([]);

  useEffect(() => {
    const fetchDoctores = async () => {
      try {
        const response = await axios.get('/api/doctors');
        setDoctores(response.data);
      } catch (err) {
        console.error('Error al cargar doctores:', err);
      }
    };

    if (user && ['admin', 'operador'].includes(user.rol)) {
      fetchDoctores();
    }
  }, [user]);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, selectedDoctor]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = { date: selectedDate };
      
      if (selectedDoctor) {
        params.doctorId = selectedDoctor;
      } else if (user?.rol === 'doctor') {
        params.doctorId = user.id;
      }

      const response = await axios.get('/api/appointments', { params });
      setAppointments(response.data);
    } catch (err) {
      console.error('Error al cargar citas:', err);
      setError('Error al cargar las citas');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'PENDING': 'Pendiente',
      'CONFIRMED': 'Confirmada',
      'CANCELLED': 'Cancelada',
      'COMPLETED': 'Completada'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    const classMap = {
      'PENDING': 'status-pending',
      'CONFIRMED': 'status-confirmed',
      'CANCELLED': 'status-cancelled',
      'COMPLETED': 'status-completed'
    };
    return classMap[status] || '';
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await axios.patch(`/api/appointments/${appointmentId}`, { status: newStatus });
      fetchAppointments();
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      alert('Error al actualizar el estado de la cita');
    }
  };

  if (loading) {
    return (
      <div className="agenda-loading">
        <div className="loading-spinner"></div>
        <p>Cargando agenda...</p>
      </div>
    );
  }

  return (
    <div className="agenda-page">
      <div className="agenda-header">
        <h1>Agenda de Citas</h1>
        <p>Gestiona las citas médicas del día</p>
      </div>

      <div className="agenda-filters">
        <div className="filter-group">
          <label htmlFor="fecha">Fecha:</label>
          <input
            type="date"
            id="fecha"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {user && ['admin', 'operador'].includes(user.rol) && (
          <div className="filter-group">
            <label htmlFor="doctor">Doctor:</label>
            <select
              id="doctor"
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
            >
              <option value="">Todos los doctores</option>
              {doctores.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.firstName} {doctor.lastName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="agenda-content">
        {appointments.length === 0 ? (
          <div className="no-appointments">
            <h3>No hay citas programadas</h3>
            <p>No se encontraron citas para la fecha seleccionada.</p>
          </div>
        ) : (
          <div className="appointments-list">
            {appointments.map(appointment => (
              <div key={appointment.id} className="appointment-card">
                <div className="appointment-time">
                  <span className="time">{appointment.hora}</span>
                  <span className="date">{appointment.fecha}</span>
                </div>

                <div className="appointment-info">
                  <h4>
                    {appointment.patient?.firstName} {appointment.patient?.lastName}
                  </h4>
                  <p className="doctor-name">
                    Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                  </p>
                  <p className="specialty">
                    {appointment.specialty?.nombre}
                  </p>
                  <p className="motivo">{appointment.motivo}</p>
                  {appointment.notas && (
                    <p className="notas">
                      <strong>Notas:</strong> {appointment.notas}
                    </p>
                  )}
                </div>

                <div className="appointment-status">
                  <span className={`status-badge ${getStatusClass(appointment.status)}`}>
                    {getStatusLabel(appointment.status)}
                  </span>
                  
                  {user && ['admin', 'operador', 'doctor'].includes(user.rol) && (
                    <div className="status-actions">
                      {appointment.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(appointment.id, 'CONFIRMED')}
                            className="btn btn-success"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => handleStatusChange(appointment.id, 'CANCELLED')}
                            className="btn btn-danger"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                      {appointment.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleStatusChange(appointment.id, 'COMPLETED')}
                          className="btn btn-primary"
                        >
                          Completar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Agenda;
