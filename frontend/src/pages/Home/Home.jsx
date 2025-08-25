import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSpecialties } from '../../services/specialtiesService.js';
import { getPublicDoctors } from '../../services/doctorsService.js';
import DoctorCard from '../../components/DoctorCard/DoctorCard.jsx';
import './Home.css';

/**
 * Página principal - Home
 * Selector rápido de especialidades y cards de doctores visibles
 */
const Home = () => {
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar especialidades y doctores en paralelo
      const [specialtiesData, doctorsData] = await Promise.all([
        getSpecialties(),
        getPublicDoctors()
      ]);

      setSpecialties(specialtiesData);
      setDoctors(doctorsData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('No se pudo cargar la información. Por favor, intenta más tarde.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando información...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={loadData} className="btn btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Bienvenido a ClinicApp</h1>
            <p className="hero-subtitle">
              Sistema integral de gestión de citas médicas. 
              Agenda tu consulta de forma rápida y sencilla.
            </p>
            <div className="hero-actions">
              <Link to="/especialidades" className="btn btn-primary btn-lg">
                Ver Especialidades
              </Link>
              <Link to="/agenda" className="btn btn-outline btn-lg">
                Agendar Cita
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Especialidades Rápidas */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Especialidades Médicas</h2>
          <p className="section-subtitle">
            Selecciona la especialidad que necesitas
          </p>
          
          {specialties.length > 0 ? (
            <div className="specialties-grid">
              {specialties.map((specialty) => (
                <Link 
                  key={specialty.id}
                  to={`/especialidades/${specialty.id}`}
                  className="specialty-card"
                >
                  <div className="specialty-icon">
                    {specialty.icon ? (
                      <div dangerouslySetInnerHTML={{ __html: specialty.icon }} />
                    ) : (
                      <div className="specialty-placeholder">
                        {specialty.nombre.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3>{specialty.nombre}</h3>
                  <p>{specialty.descripcion}</p>
                  <div className="specialty-mode">
                    {specialty.booking_mode === 'WALKIN' && (
                      <span className="mode-badge mode-walkin">
                        Por orden de llegada
                      </span>
                    )}
                    {specialty.booking_mode === 'SLOT' && (
                      <span className="mode-badge mode-slot">
                        Con cita previa
                      </span>
                    )}
                    {specialty.booking_mode === 'REQUEST' && (
                      <span className="mode-badge mode-request">
                        Solicitar cita
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No hay especialidades disponibles en este momento.</p>
            </div>
          )}
        </div>
      </section>

      {/* Doctores Destacados */}
      <section className="section bg-light">
        <div className="container">
          <h2 className="section-title">Nuestros Doctores</h2>
          <p className="section-subtitle">
            Conoce a nuestro equipo médico profesional
          </p>
          
          {doctors.length > 0 ? (
            <div className="doctors-grid">
              {doctors.slice(0, 6).map((doctor) => (
                <DoctorCard 
                  key={doctor.id}
                  doctor={doctor}
                  showSpecialties={true}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No hay doctores disponibles en este momento.</p>
            </div>
          )}
          
          {doctors.length > 6 && (
            <div className="section-footer">
              <Link to="/doctores" className="btn btn-outline">
                Ver todos los doctores
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Información Adicional */}
      <section className="section">
        <div className="container">
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L13.09 8.26L20.18 7.74L18.12 13.74L23.64 16.74L16.26 19.36L15.64 23.64L12 18L8.36 23.64L7.74 19.36L0.36 16.74L5.88 13.74L3.82 7.74L10.91 8.26L12 2Z" fill="currentColor"/>
                </svg>
              </div>
              <h3>Atención de Calidad</h3>
              <p>
                Médicos especializados y equipos de última tecnología 
                para brindarte la mejor atención médica.
              </p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H12V15H7V10Z" fill="currentColor"/>
                </svg>
              </div>
              <h3>Citas Flexibles</h3>
              <p>
                Sistema de citas adaptado a cada especialidad: 
                por orden de llegada, con reserva o por solicitud.
              </p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22S22 17.52 22 12S17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
                </svg>
              </div>
              <h3>Soporte 24/7</h3>
              <p>
                Estamos disponibles para ayudarte con tus consultas 
                y gestión de citas en cualquier momento.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
