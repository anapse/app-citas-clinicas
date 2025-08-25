import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import './Doctor.css';

const Doctor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [doctor, setDoctor] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        setLoading(true);
        const [doctorRes, availabilityRes] = await Promise.all([
          axios.get(`/api/doctors/${id}`),
          axios.get(`/api/availability/doctor/${id}`)
        ]);
        
        setDoctor(doctorRes.data);
        setAvailability(availabilityRes.data);
      } catch (err) {
        console.error('Error al cargar datos del doctor:', err);
        if (err.response?.status === 404) {
          setError('Doctor no encontrado');
        } else {
          setError('Error al cargar la información del doctor');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDoctorData();
    }
  }, [id]);

  const handleSolicitarCita = () => {
    navigate(`/solicitud-cita?doctor=${id}`);
  };

  const handleVerAgenda = () => {
    navigate(`/agenda?doctor=${id}`);
  };

  const formatPhotoUrl = (photoUrl) => {
    if (!photoUrl) return null;
    if (photoUrl.startsWith('http')) return photoUrl;
    return `${import.meta.env.VITE_API_URL}${photoUrl}`;
  };

  const renderDoctorPhoto = () => {
    const photoUrl = formatPhotoUrl(doctor?.photoUrl);
    
    if (photoUrl) {
      return (
        <img 
          src={photoUrl} 
          alt={`Dr. ${doctor.firstName} ${doctor.lastName}`}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextElementSibling.style.display = 'flex';
          }}
        />
      );
    }
    
    return (
      <div className="doctor-photo-placeholder">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="doctor-loading">
        <div className="loading-spinner"></div>
        <p>Cargando información del doctor...</p>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="doctor-error">
        <h2>Error</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button onClick={() => navigate('/doctores')} className="btn btn-primary">
            Ver todos los doctores
          </button>
          <button onClick={() => window.location.reload()} className="btn btn-secondary">
            Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-page">
      <div className="doctor-header">
        <button 
          className="back-button"
          onClick={() => navigate('/doctores')}
        >
          ← Volver a doctores
        </button>
      </div>

      <div className="doctor-profile">
        <div className="doctor-photo-section">
          {renderDoctorPhoto()}
        </div>

        <div className="doctor-info">
          <h1>Dr. {doctor.firstName} {doctor.lastName}</h1>
          
          <div className="doctor-specialties">
            {doctor.specialties?.map(specialty => (
              <span key={specialty.id} className="specialty-badge">
                {specialty.nombre}
              </span>
            ))}
          </div>

          {doctor.bio && (
            <div className="doctor-bio">
              <h3>Acerca del doctor</h3>
              <p>{doctor.bio}</p>
            </div>
          )}

          <div className="doctor-contact">
            <h3>Información de contacto</h3>
            <div className="contact-info">
              {doctor.phone && (
                <div className="contact-item">
                  <span className="contact-label">Teléfono:</span>
                  <span className="contact-value">{doctor.phone}</span>
                </div>
              )}
              {doctor.email && (
                <div className="contact-item">
                  <span className="contact-label">Email:</span>
                  <span className="contact-value">{doctor.email}</span>
                </div>
              )}
            </div>
          </div>

          <div className="doctor-actions">
            <button 
              className="btn btn-primary"
              onClick={handleSolicitarCita}
            >
              Solicitar Cita
            </button>
            
            {user && ['admin', 'operador'].includes(user.rol) && (
              <button 
                className="btn btn-secondary"
                onClick={handleVerAgenda}
              >
                Ver Agenda
              </button>
            )}
          </div>
        </div>
      </div>

      {availability.length > 0 && (
        <div className="doctor-availability">
          <h2>Disponibilidad</h2>
          <div className="availability-grid">
            {availability.map((slot, index) => (
              <div key={index} className="availability-slot">
                <div className="slot-day">
                  {slot.dayOfWeek === 1 ? 'Lunes' :
                   slot.dayOfWeek === 2 ? 'Martes' :
                   slot.dayOfWeek === 3 ? 'Miércoles' :
                   slot.dayOfWeek === 4 ? 'Jueves' :
                   slot.dayOfWeek === 5 ? 'Viernes' :
                   slot.dayOfWeek === 6 ? 'Sábado' :
                   'Domingo'}
                </div>
                <div className="slot-time">
                  {slot.startTime} - {slot.endTime}
                </div>
                {slot.specialty && (
                  <div className="slot-specialty">
                    {slot.specialty.nombre}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Doctor;
