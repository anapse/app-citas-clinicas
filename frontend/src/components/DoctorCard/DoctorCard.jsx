import React from 'react';
import { Link } from 'react-router-dom';
import './DoctorCard.css';

/**
 * Componente para mostrar información de un doctor
 * @param {Object} doctor - Datos del doctor
 * @param {boolean} showSpecialties - Mostrar especialidades
 * @param {boolean} showActions - Mostrar botones de acción
 */
const DoctorCard = ({ 
  doctor, 
  showSpecialties = false, 
  showActions = true,
  compact = false 
}) => {
  if (!doctor) return null;

  const renderPhoto = () => {
    if (doctor.photo_url) {
      return (
        <img 
          src={doctor.photo_url} 
          alt={`Dr. ${doctor.nombres} ${doctor.apellidos}`}
          className="doctor-photo"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }
    
    if (doctor.photo_svg) {
      return (
        <div 
          className="doctor-photo-svg"
          dangerouslySetInnerHTML={{ __html: doctor.photo_svg }}
        />
      );
    }
    
    // Placeholder con iniciales
    const initials = `${doctor.nombres?.charAt(0) || ''}${doctor.apellidos?.charAt(0) || ''}`;
    return (
      <div className="doctor-photo-placeholder">
        {initials}
      </div>
    );
  };

  const fullName = `Dr. ${doctor.nombres} ${doctor.apellidos}`;

  return (
    <div className={`doctor-card ${compact ? 'doctor-card-compact' : ''}`}>
      <div className="doctor-header">
        <div className="doctor-photo-container">
          {renderPhoto()}
          <div className="doctor-photo-fallback" style={{ display: 'none' }}>
            {`${doctor.nombres?.charAt(0) || ''}${doctor.apellidos?.charAt(0) || ''}`}
          </div>
        </div>
        
        <div className="doctor-info">
          <h3 className="doctor-name">{fullName}</h3>
          
          {doctor.especialidad_principal && (
            <p className="doctor-specialty-main">
              {doctor.especialidad_principal}
            </p>
          )}
          
          {showSpecialties && doctor.especialidades && doctor.especialidades.length > 0 && (
            <div className="doctor-specialties">
              {doctor.especialidades.slice(0, 2).map((specialty, index) => (
                <span key={index} className="specialty-tag">
                  {specialty.nombre}
                </span>
              ))}
              {doctor.especialidades.length > 2 && (
                <span className="specialty-tag-more">
                  +{doctor.especialidades.length - 2} más
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {!compact && doctor.bio && (
        <div className="doctor-bio">
          <p>{doctor.bio}</p>
        </div>
      )}

      {!compact && doctor.experiencia_anos && (
        <div className="doctor-experience">
          <span className="experience-badge">
            {doctor.experiencia_anos} años de experiencia
          </span>
        </div>
      )}

      {/* Próximos horarios para especialidades SLOT */}
      {!compact && doctor.proximos_horarios && doctor.proximos_horarios.length > 0 && (
        <div className="doctor-schedule">
          <h4>Próximos horarios disponibles:</h4>
          <div className="schedule-list">
            {doctor.proximos_horarios.slice(0, 3).map((horario, index) => (
              <div key={index} className="schedule-item">
                <span className="schedule-date">
                  {new Date(horario.fecha).toLocaleDateString('es-PE', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                  })}
                </span>
                <span className="schedule-time">
                  {horario.hora_inicio} - {horario.hora_fin}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showActions && (
        <div className="doctor-actions">
          <Link 
            to={`/doctor/${doctor.id}`}
            className="btn btn-outline btn-sm"
          >
            Ver Perfil
          </Link>
          
          {doctor.acepta_citas && (
            <Link 
              to={`/agenda?doctorId=${doctor.id}`}
              className="btn btn-primary btn-sm"
            >
              Reservar Cita
            </Link>
          )}
        </div>
      )}

      {/* Estado del doctor */}
      <div className="doctor-status">
        {doctor.activo ? (
          <span className="status-badge status-active">Disponible</span>
        ) : (
          <span className="status-badge status-inactive">No disponible</span>
        )}
      </div>
    </div>
  );
};

export default DoctorCard;
