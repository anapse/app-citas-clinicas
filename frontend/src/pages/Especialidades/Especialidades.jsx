import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Especialidades.css';

const Especialidades = () => {
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEspecialidades = async () => {
      try {
        const response = await axios.get('/api/specialties');
        setEspecialidades(response.data);
      } catch (err) {
        console.error('Error al cargar especialidades:', err);
        setError('Error al cargar las especialidades');
      } finally {
        setLoading(false);
      }
    };

    fetchEspecialidades();
  }, []);

  const getEspecialidadIcon = (nombre) => {
    const iconMap = {
      'Pediatría': '👶',
      'Endocrinología': '🩺',
      'Dermatología': '🧴',
      'Neumología': '🫁',
      'Inmunología': '🛡️',
      'Cardiología': '❤️',
      'Neurología': '🧠',
      'Oncología': '🎗️',
      'Ginecología': '👩‍⚕️',
      'Urología': '🩻'
    };
    return iconMap[nombre] || '🏥';
  };

  const getAppointmentTypeLabel = (type) => {
    const typeMap = {
      'WALKIN': 'Por orden de llegada',
      'SLOT': 'Por cita programada',
      'ONE_OFF': 'Fechas específicas'
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <div className="especialidades-loading">
        <div className="loading-spinner"></div>
        <p>Cargando especialidades...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="especialidades-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Intentar nuevamente
        </button>
      </div>
    );
  }

  return (
    <div className="especialidades-page">
      <div className="especialidades-header">
        <h1>Especialidades Médicas</h1>
        <p>Conoce nuestras especialidades y sus modalidades de atención</p>
      </div>

      <div className="especialidades-grid">
        {especialidades.map((especialidad) => (
          <div key={especialidad.id} className="especialidad-card">
            <div className="especialidad-icon">
              {getEspecialidadIcon(especialidad.nombre)}
            </div>
            
            <div className="especialidad-content">
              <h3>{especialidad.nombre}</h3>
              <p className="especialidad-descripcion">
                {especialidad.descripcion || 'Especialidad médica de alta calidad con profesionales especializados.'}
              </p>
              
              <div className="especialidad-info">
                <div className="info-item">
                  <span className="info-label">Modalidad:</span>
                  <span className="info-value">
                    {getAppointmentTypeLabel(especialidad.appointmentType)}
                  </span>
                </div>
                
                {especialidad.appointmentType === 'SLOT' && (
                  <>
                    <div className="info-item">
                      <span className="info-label">Duración:</span>
                      <span className="info-value">{especialidad.slotDurationMins} minutos</span>
                    </div>
                    
                    {especialidad.weeklySlot && (
                      <div className="info-item">
                        <span className="info-label">Horario:</span>
                        <span className="info-value">
                          {especialidad.weeklySlot.dayOfWeek === 3 ? 'Miércoles' : 
                           especialidad.weeklySlot.dayOfWeek === 4 ? 'Jueves' : 
                           `Día ${especialidad.weeklySlot.dayOfWeek}`} - 
                          {especialidad.weeklySlot.startTime} a {especialidad.weeklySlot.endTime}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="especialidad-actions">
                <Link 
                  to={`/doctores?especialidad=${especialidad.id}`}
                  className="btn btn-primary"
                >
                  Ver Doctores
                </Link>
                <Link 
                  to={`/solicitud-cita?especialidad=${especialidad.id}`}
                  className="btn btn-secondary"
                >
                  Solicitar Cita
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {especialidades.length === 0 && (
        <div className="no-especialidades">
          <h3>No hay especialidades disponibles</h3>
          <p>Por favor, contacte al administrador para más información.</p>
        </div>
      )}
    </div>
  );
};

export default Especialidades;
