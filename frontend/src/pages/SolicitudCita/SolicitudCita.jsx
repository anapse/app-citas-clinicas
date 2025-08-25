import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { dayjs } from '../../services/config';
import { getPublicDoctors } from '../../services/doctorsService';
import { getSpecialties } from '../../services/specialtiesService';
import { createPublicAppointment, getAvailableSlots } from '../../services/appointmentsService';
import './SolicitudCita.css';

const SolicitudCita = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    // Datos del paciente
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    identificacion: '',
    // Datos de la cita
    doctorId: searchParams.get('doctor') || '',
    especialidadId: searchParams.get('especialidad') || '',
    fecha: '',
    hora: '',
    motivo: '',
    notas: ''
  });
  
  const [doctores, setDoctores] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [doctoresData, especialidadesData] = await Promise.all([
          getPublicDoctors(),
          getSpecialties()
        ]);
        
        setDoctores(doctoresData);
        setEspecialidades(especialidadesData);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar la información necesaria');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (formData.doctorId && formData.fecha) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [formData.doctorId, formData.fecha]);

  const fetchAvailableSlots = async () => {
    try {
      const slots = await getAvailableSlots(formData.doctorId, formData.fecha);
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Error al cargar horarios disponibles:', err);
      setAvailableSlots([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar hora cuando cambia el doctor o fecha
    if (name === 'doctorId' || name === 'fecha') {
      setFormData(prev => ({ ...prev, hora: '' }));
    }
    
    // Auto-seleccionar especialidad si se selecciona un doctor
    if (name === 'doctorId' && value) {
      const doctor = doctores.find(d => d.id.toString() === value);
      if (doctor && doctor.specialties && doctor.specialties.length === 1) {
        setFormData(prev => ({ 
          ...prev, 
          especialidadId: doctor.specialties[0].id.toString() 
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setSubmitting(true);
    setError(null);

    try {
      const appointmentData = {
        // Datos del paciente
        patient: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          birthDate: formData.birthDate || null,
          identificacion: formData.identificacion
        },
        // Datos de la cita
        doctorId: parseInt(formData.doctorId),
        especialidadId: parseInt(formData.especialidadId),
        fecha: formData.fecha,
        hora: formData.hora,
        motivo: formData.motivo,
        notas: formData.notas || null
      };

      await createPublicAppointment(appointmentData);
      
      setSuccess(true);
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (err) {
      console.error('Error al solicitar cita:', err);
      setError(
        err.response?.data?.error || 
        'Error al solicitar la cita. Por favor, intente nuevamente.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getMinDate = () => {
    return dayjs().format('YYYY-MM-DD');
  };

  const getMaxDate = () => {
    return dayjs().add(3, 'month').format('YYYY-MM-DD');
  };

  const filteredDoctores = doctores.filter(doctor => {
    if (!formData.especialidadId) return true;
    return doctor.specialties?.some(spec => 
      spec.id.toString() === formData.especialidadId
    );
  });

  if (loading) {
    return (
      <div className="solicitud-loading">
        <div className="loading-spinner"></div>
        <p>Cargando formulario...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="solicitud-success">
        <div className="success-icon">✅</div>
        <h2>¡Cita solicitada exitosamente!</h2>
        <p>Su solicitud ha sido enviada y será procesada por nuestro equipo.</p>
        <p>Recibirá una confirmación por email cuando sea aprobada.</p>
        <p>Será redirigido al inicio en unos momentos...</p>
        <button 
          onClick={() => navigate('/')}
          className="btn btn-primary"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="solicitud-page">
      <div className="solicitud-header">
        <h1>Solicitar Cita Médica</h1>
        <p>Complete el formulario para solicitar su cita</p>
      </div>

      <form onSubmit={handleSubmit} className="solicitud-form">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-section">
          <h3>Información del paciente</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">Nombres *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Ingrese sus nombres"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Apellidos *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Ingrese sus apellidos"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="identificacion">Identificación *</label>
              <input
                type="text"
                id="identificacion"
                name="identificacion"
                value={formData.identificacion}
                onChange={handleInputChange}
                placeholder="Cédula o documento de identidad"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Teléfono *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Número de teléfono"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="birthDate">Fecha de nacimiento</label>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleInputChange}
                max={dayjs().subtract(1, 'year').format('YYYY-MM-DD')}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Información de la cita</h3>
          
          <div className="form-group">
            <label htmlFor="especialidadId">Especialidad *</label>
            <select
              id="especialidadId"
              name="especialidadId"
              value={formData.especialidadId}
              onChange={handleInputChange}
              required
            >
              <option value="">Seleccione una especialidad</option>
              {especialidades.map(esp => (
                <option key={esp.id} value={esp.id}>
                  {esp.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="doctorId">Doctor *</label>
            <select
              id="doctorId"
              name="doctorId"
              value={formData.doctorId}
              onChange={handleInputChange}
              required
            >
              <option value="">Seleccione un doctor</option>
              {filteredDoctores.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.firstName} {doctor.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="fecha">Fecha *</label>
            <input
              type="date"
              id="fecha"
              name="fecha"
              value={formData.fecha}
              onChange={handleInputChange}
              min={getMinDate()}
              max={getMaxDate()}
              required
            />
            <small>Seleccione una fecha entre hoy y los próximos 3 meses</small>
          </div>

          {availableSlots.length > 0 && (
            <div className="form-group">
              <label htmlFor="hora">Horario disponible *</label>
              <select
                id="hora"
                name="hora"
                value={formData.hora}
                onChange={handleInputChange}
                required
              >
                <option value="">Seleccione un horario</option>
                {availableSlots.map((slot, index) => (
                  <option key={index} value={slot.time}>
                    {slot.time} {slot.available ? '' : '(No disponible)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.doctorId && formData.fecha && availableSlots.length === 0 && (
            <div className="no-slots-message">
              No hay horarios disponibles para la fecha seleccionada.
              Por favor, seleccione otra fecha.
            </div>
          )}
        </div>

        <div className="form-section">
          <h3>Detalles de la consulta</h3>
          
          <div className="form-group">
            <label htmlFor="motivo">Motivo de la consulta *</label>
            <textarea
              id="motivo"
              name="motivo"
              value={formData.motivo}
              onChange={handleInputChange}
              placeholder="Describa brevemente el motivo de su consulta..."
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="notas">Notas adicionales</label>
            <textarea
              id="notas"
              name="notas"
              value={formData.notas}
              onChange={handleInputChange}
              placeholder="Información adicional que considere relevante (opcional)..."
              rows="3"
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
            disabled={submitting}
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              submitting || 
              !formData.firstName || 
              !formData.lastName || 
              !formData.email || 
              !formData.phone || 
              !formData.identificacion ||
              !formData.doctorId || 
              !formData.fecha || 
              !formData.hora ||
              !formData.motivo
            }
          >
            {submitting ? 'Solicitando...' : 'Solicitar Cita'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SolicitudCita;
