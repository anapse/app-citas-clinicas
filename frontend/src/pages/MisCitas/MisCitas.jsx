import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import './MisCitas.css';

const MisCitas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchMisCitas();
  }, []);

  const fetchMisCitas = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/appointments/my-appointments');
      setCitas(response.data);
    } catch (err) {
      console.error('Error al cargar mis citas:', err);
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

  const handleCancelCita = async (citaId) => {
    if (!window.confirm('¿Está seguro de que desea cancelar esta cita?')) {
      return;
    }

    try {
      await axios.patch(`/api/appointments/${citaId}`, { status: 'CANCELLED' });
      fetchMisCitas();
    } catch (err) {
      console.error('Error al cancelar cita:', err);
      alert('Error al cancelar la cita');
    }
  };

  const filteredCitas = citas.filter(cita => {
    if (filter === 'all') return true;
    return cita.status === filter;
  });

  const canCancelCita = (cita) => {
    return cita.status === 'PENDING' || cita.status === 'CONFIRMED';
  };

  if (loading) {
    return (
      <div className="mis-citas-loading">
        <div className="loading-spinner"></div>
        <p>Cargando tus citas...</p>
      </div>
    );
  }

  return (
    <div className="mis-citas-page">
      <div className="mis-citas-header">
        <h1>Mis Citas</h1>
        <p>Gestiona y revisa tus citas médicas</p>
        
        <button 
          onClick={() => navigate('/solicitud-cita')}
          className="btn btn-primary"
        >
          Solicitar Nueva Cita
        </button>
      </div>

      <div className="mis-citas-filters">
        <div className="filter-tabs">
          <button 
            className={filter === 'all' ? 'tab active' : 'tab'}
            onClick={() => setFilter('all')}
          >
            Todas ({citas.length})
          </button>
          <button 
            className={filter === 'PENDING' ? 'tab active' : 'tab'}
            onClick={() => setFilter('PENDING')}
          >
            Pendientes ({citas.filter(c => c.status === 'PENDING').length})
          </button>
          <button 
            className={filter === 'CONFIRMED' ? 'tab active' : 'tab'}
            onClick={() => setFilter('CONFIRMED')}
          >
            Confirmadas ({citas.filter(c => c.status === 'CONFIRMED').length})
          </button>
          <button 
            className={filter === 'COMPLETED' ? 'tab active' : 'tab'}
            onClick={() => setFilter('COMPLETED')}
          >
            Completadas ({citas.filter(c => c.status === 'COMPLETED').length})
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="mis-citas-content">
        {filteredCitas.length === 0 ? (
          <div className="no-citas">
            <h3>No tienes citas</h3>
            <p>
              {filter === 'all' 
                ? 'No has solicitado ninguna cita médica aún.'
                : `No tienes citas con estado "${getStatusLabel(filter)}".`
              }
            </p>
            <button 
              onClick={() => navigate('/solicitud-cita')}
              className="btn btn-primary"
            >
              Solicitar tu primera cita
            </button>
          </div>
        ) : (
          <div className="citas-list">
            {filteredCitas.map(cita => (
              <div key={cita.id} className="cita-card">
                <div className="cita-date">
                  <span className="fecha">{cita.fecha}</span>
                  <span className="hora">{cita.hora}</span>
                </div>

                <div className="cita-info">
                  <h4>
                    Dr. {cita.doctor?.firstName} {cita.doctor?.lastName}
                  </h4>
                  <p className="especialidad">{cita.specialty?.nombre}</p>
                  <p className="motivo">
                    <strong>Motivo:</strong> {cita.motivo}
                  </p>
                  {cita.notas && (
                    <p className="notas">
                      <strong>Notas:</strong> {cita.notas}
                    </p>
                  )}
                </div>

                <div className="cita-status">
                  <span className={`status-badge ${getStatusClass(cita.status)}`}>
                    {getStatusLabel(cita.status)}
                  </span>
                  
                  <div className="cita-actions">
                    {canCancelCita(cita) && (
                      <button
                        onClick={() => handleCancelCita(cita.id)}
                        className="btn btn-danger btn-small"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MisCitas;
