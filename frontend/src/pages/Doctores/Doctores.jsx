import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DoctorCard from '../../components/DoctorCard/DoctorCard';
import './Doctores.css';

const Doctores = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [doctores, setDoctores] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    especialidad: searchParams.get('especialidad') || '',
    busqueda: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [doctoresRes, especialidadesRes] = await Promise.all([
          axios.get('/api/doctors'),
          axios.get('/api/specialties')
        ]);
        
        setDoctores(doctoresRes.data);
        setEspecialidades(especialidadesRes.data);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar la información');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredDoctores = doctores.filter(doctor => {
    const matchEspecialidad = !filters.especialidad || 
      doctor.specialties?.some(spec => spec.id.toString() === filters.especialidad);
    
    const matchBusqueda = !filters.busqueda ||
      doctor.firstName.toLowerCase().includes(filters.busqueda.toLowerCase()) ||
      doctor.lastName.toLowerCase().includes(filters.busqueda.toLowerCase()) ||
      doctor.specialties?.some(spec => 
        spec.nombre.toLowerCase().includes(filters.busqueda.toLowerCase())
      );

    return matchEspecialidad && matchBusqueda;
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    
    // Actualizar URL si se cambia la especialidad
    if (key === 'especialidad') {
      const newSearchParams = new URLSearchParams(searchParams);
      if (value) {
        newSearchParams.set('especialidad', value);
      } else {
        newSearchParams.delete('especialidad');
      }
      navigate(`?${newSearchParams.toString()}`, { replace: true });
    }
  };

  const clearFilters = () => {
    setFilters({ especialidad: '', busqueda: '' });
    navigate('/doctores', { replace: true });
  };

  const handleDoctorClick = (doctorId) => {
    navigate(`/doctor/${doctorId}`);
  };

  const handleSolicitarCita = (doctorId) => {
    navigate(`/solicitud-cita?doctor=${doctorId}`);
  };

  if (loading) {
    return (
      <div className="doctores-loading">
        <div className="loading-spinner"></div>
        <p>Cargando doctores...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="doctores-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Intentar nuevamente
        </button>
      </div>
    );
  }

  return (
    <div className="doctores-page">
      <div className="doctores-header">
        <h1>Nuestros Doctores</h1>
        <p>Encuentra al especialista que necesitas</p>
      </div>

      <div className="doctores-filters">
        <div className="filter-group">
          <label htmlFor="especialidad-filter">Especialidad:</label>
          <select
            id="especialidad-filter"
            value={filters.especialidad}
            onChange={(e) => handleFilterChange('especialidad', e.target.value)}
          >
            <option value="">Todas las especialidades</option>
            {especialidades.map(esp => (
              <option key={esp.id} value={esp.id}>
                {esp.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="busqueda-filter">Buscar doctor:</label>
          <input
            id="busqueda-filter"
            type="text"
            placeholder="Nombre del doctor o especialidad..."
            value={filters.busqueda}
            onChange={(e) => handleFilterChange('busqueda', e.target.value)}
          />
        </div>

        {(filters.especialidad || filters.busqueda) && (
          <button className="clear-filters-btn" onClick={clearFilters}>
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="doctores-results">
        <div className="results-count">
          {filteredDoctores.length === 1 ? 
            '1 doctor encontrado' : 
            `${filteredDoctores.length} doctores encontrados`
          }
        </div>

        <div className="doctores-grid">
          {filteredDoctores.map(doctor => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onClick={() => handleDoctorClick(doctor.id)}
              onSolicitarCita={() => handleSolicitarCita(doctor.id)}
              showActions={true}
            />
          ))}
        </div>

        {filteredDoctores.length === 0 && (
          <div className="no-doctores">
            <h3>No se encontraron doctores</h3>
            <p>
              {filters.especialidad || filters.busqueda ? 
                'Intenta ajustar los filtros de búsqueda.' :
                'No hay doctores registrados en el sistema.'
              }
            </p>
            {(filters.especialidad || filters.busqueda) && (
              <button onClick={clearFilters} className="btn btn-primary">
                Ver todos los doctores
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Doctores;
