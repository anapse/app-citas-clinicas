import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, appointmentsRes] = await Promise.all([
        axios.get('/api/dashboard/stats'),
        axios.get('/api/dashboard/recent-appointments')
      ]);
      
      setStats(statsRes.data);
      setRecentAppointments(appointmentsRes.data);
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
      setError('Error al cargar la información del dashboard');
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

  const getRoleBasedWelcome = () => {
    const welcomeMap = {
      'admin': 'Panel de Administración',
      'operador': 'Panel de Operador',
      'doctor': 'Panel del Doctor'
    };
    return welcomeMap[user?.rol] || 'Panel de Control';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Cargando panel de control...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Intentar nuevamente
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>{getRoleBasedWelcome()}</h1>
        <p>Bienvenido, {user?.firstName} {user?.lastName}</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Citas Hoy</h3>
            <span className="stat-number">{stats.citasHoy || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Pendientes</h3>
            <span className="stat-number">{stats.citasPendientes || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Completadas</h3>
            <span className="stat-number">{stats.citasCompletadas || 0}</span>
          </div>
        </div>

        {user?.rol === 'admin' && (
          <>
            <div className="stat-card">
              <div className="stat-icon">👨‍⚕️</div>
              <div className="stat-content">
                <h3>Doctores</h3>
                <span className="stat-number">{stats.totalDoctores || 0}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h3>Pacientes</h3>
                <span className="stat-number">{stats.totalPacientes || 0}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🏥</div>
              <div className="stat-content">
                <h3>Especialidades</h3>
                <span className="stat-number">{stats.totalEspecialidades || 0}</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="dashboard-content">
        <div className="recent-appointments">
          <h2>Citas Recientes</h2>
          
          {recentAppointments.length === 0 ? (
            <div className="no-appointments">
              <p>No hay citas recientes para mostrar.</p>
            </div>
          ) : (
            <div className="appointments-list">
              {recentAppointments.map(appointment => (
                <div key={appointment.id} className="appointment-item">
                  <div className="appointment-date">
                    <span className="date">{appointment.fecha}</span>
                    <span className="time">{appointment.hora}</span>
                  </div>
                  
                  <div className="appointment-details">
                    <h4>
                      {user?.rol === 'doctor' ? 
                        `${appointment.patient?.firstName} ${appointment.patient?.lastName}` :
                        `Dr. ${appointment.doctor?.firstName} ${appointment.doctor?.lastName}`
                      }
                    </h4>
                    {user?.rol !== 'doctor' && (
                      <p className="patient-name">
                        Paciente: {appointment.patient?.firstName} {appointment.patient?.lastName}
                      </p>
                    )}
                    <p className="specialty">{appointment.specialty?.nombre}</p>
                    <p className="motivo">{appointment.motivo}</p>
                  </div>
                  
                  <div className="appointment-status">
                    <span className={`status-badge ${getStatusClass(appointment.status)}`}>
                      {getStatusLabel(appointment.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="quick-actions">
          <h2>Acciones Rápidas</h2>
          
          <div className="actions-grid">
            {user?.rol === 'admin' && (
              <>
                <button className="action-btn">
                  <span className="action-icon">👨‍⚕️</span>
                  <span>Gestionar Doctores</span>
                </button>
                
                <button className="action-btn">
                  <span className="action-icon">🏥</span>
                  <span>Gestionar Especialidades</span>
                </button>
                
                <button className="action-btn">
                  <span className="action-icon">📊</span>
                  <span>Ver Reportes</span>
                </button>
              </>
            )}
            
            {['admin', 'operador'].includes(user?.rol) && (
              <button 
                className="action-btn"
                onClick={() => window.location.href = '/agenda'}
              >
                <span className="action-icon">📅</span>
                <span>Ver Agenda</span>
              </button>
            )}
            
            {user?.rol === 'doctor' && (
              <>
                <button 
                  className="action-btn"
                  onClick={() => window.location.href = '/agenda'}
                >
                  <span className="action-icon">📅</span>
                  <span>Mi Agenda</span>
                </button>
                
                <button className="action-btn">
                  <span className="action-icon">👥</span>
                  <span>Mis Pacientes</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
