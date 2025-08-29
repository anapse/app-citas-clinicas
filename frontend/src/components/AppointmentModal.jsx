import React, { useState, useEffect, useRef } from 'react';
import { citasService } from '../services/citasService';
import { especialidadesService } from '../services/especialidadesService';
import toast from 'react-hot-toast';

const AppointmentModal = ({ isOpen, onClose, selectedDate, selectedHour, isPublic = false }) => {
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    dni: '',
    fechaNacimiento: '',
    telefono: '',
    especialidad_id: '',
    motivo: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [especialidades, setEspecialidades] = useState([]);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState(null);
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  // Cargar especialidades al abrir modal
  useEffect(() => {
    if (isOpen) {
      loadEspecialidades();
      resetForm();
    }
  }, [isOpen]);

  const loadEspecialidades = async () => {
    try {
      const data = await especialidadesService.getAll();
      setEspecialidades(data);
    } catch (error) {
      console.error('Error cargando especialidades:', error);
      toast.error('Error cargando especialidades');
    }
  };

  const resetForm = () => {
    setFormData({
      nombres: '',
      apellidos: '',
      dni: '',
      fechaNacimiento: '',
      telefono: '',
      especialidad_id: '',
      motivo: ''
    });
    setErrors({});
    setEspecialidadSeleccionada(null);
  };

  // Focus trap y manejo del ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    // Focus en el primer input
    setTimeout(() => {
      if (firstInputRef.current) {
        firstInputRef.current.focus();
      }
    }, 100);

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    
    if (name === 'dni') {
      processedValue = value.replace(/[^0-9]/g, '').slice(0, 8);
    } else if (name === 'telefono') {
      processedValue = value.replace(/[^0-9+\-\s]/g, '').slice(0, 15);
    } else if (name === 'nombres' || name === 'apellidos') {
      processedValue = value.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ\s]/g, '');
    } else if (name === 'especialidad_id') {
      const especialidad = especialidades.find(e => e.especialidad_id === parseInt(value));
      setEspecialidadSeleccionada(especialidad);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validaciones según los datos requeridos por el jefe
    if (!formData.nombres.trim()) {
      newErrors.nombres = 'Nombres del Paciente son requeridos';
    } else if (formData.nombres.trim().length < 2) {
      newErrors.nombres = 'Los nombres deben tener al menos 2 caracteres';
    }

    if (!formData.apellidos.trim()) {
      newErrors.apellidos = 'Apellidos del Paciente son requeridos';
    } else if (formData.apellidos.trim().length < 2) {
      newErrors.apellidos = 'Los apellidos deben tener al menos 2 caracteres';
    }

    if (!formData.dni) {
      newErrors.dni = 'Número de DNI del Paciente o Apoderado es requerido';
    } else if (formData.dni.length !== 8) {
      newErrors.dni = 'El DNI debe tener 8 dígitos';
    }

    if (!formData.fechaNacimiento) {
      newErrors.fechaNacimiento = 'Fecha de Nacimiento del Paciente es requerida';
    } else {
      const birthDate = new Date(formData.fechaNacimiento);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 0 || age > 120) {
        newErrors.fechaNacimiento = 'Fecha de nacimiento inválida';
      }
    }

    if (!formData.telefono) {
      newErrors.telefono = 'Número de Contacto es requerido';
    } else if (formData.telefono.length < 9) {
      newErrors.telefono = 'El número de contacto debe tener al menos 9 dígitos';
    }

    if (!formData.especialidad_id) {
      newErrors.especialidad_id = 'Selecciona una especialidad';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const citaData = {
        paciente: {
          nombre: formData.nombres,
          apellido: formData.apellidos,
          dni: formData.dni,
          fecha_nacimiento: formData.fechaNacimiento,
          telefono: formData.telefono
        },
        especialidad_id: parseInt(formData.especialidad_id),
        fecha: selectedDate?.toISOString().split('T')[0],
        hora: selectedHour,
        motivo_consulta: formData.motivo || `Cita para ${especialidadSeleccionada?.nombre}`,
        modalidad: especialidadSeleccionada?.modalidad_reserva || 'SLOT'
      };

      // Determinar el tipo de cita según la especialidad
      if (especialidadSeleccionada?.modalidad_reserva === 'WALKIN') {
        // Pediatría - solo mostrar información
        toast.success(
          `ℹ️ PEDIATRÍA: Esta especialidad atiende por orden de llegada.\n\n` +
          `🔸 Lunes a sábado: 8:00am-1:00pm y 3:00pm-7:00pm\n` +
          `🔸 Domingo: 9:00am-1:00pm\n\n` +
          `No necesitas cita previa, solo acércate en horario de atención.`,
          { duration: 8000 }
        );
        onClose();
        return;
      } else if (especialidadSeleccionada?.modalidad_reserva === 'REQUEST') {
        // Especialidades que requieren coordinación
        await citasService.createSolicitud(citaData);
        toast.success(
          `📝 Solicitud enviada exitosamente!\n\n` +
          `Paciente: ${formData.nombres} ${formData.apellidos}\n` +
          `Especialidad: ${especialidadSeleccionada.nombre}\n\n` +
          `Nos contactaremos contigo para confirmar la fecha de tu cita.`,
          { duration: 6000 }
        );
      } else {
        // SLOT - especialidades con horarios específicos
        await citasService.create(citaData);
        toast.success(
          `✅ ¡Cita agendada exitosamente!\n\n` +
          `Paciente: ${formData.nombres} ${formData.apellidos}\n` +
          `Especialidad: ${especialidadSeleccionada.nombre}\n` +
          `Fecha: ${selectedDate?.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n` +
          `⏰ Recuerda llegar 10 minutos antes de tu cita.`,
          { duration: 6000 }
        );
      }
      
      onClose();
    } catch (error) {
      console.error('Error creando cita:', error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Error al procesar tu solicitud. Por favor, intenta nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div 
        ref={modalRef} 
        className="modal appointment-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            🏥 {isPublic ? 'Reservar Cita Médica' : 'Nueva Cita'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="modal-close"
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <form onSubmit={handleSubmit} noValidate>
            {/* Error general */}
            {errors.general && (
              <div className="error-message mb-3" role="alert">
                {errors.general}
              </div>
            )}

            {/* Especialidad */}
            <div className="form-group">
              <label htmlFor="especialidad_id" className="form-label">
                Especialidad *
              </label>
              <select
                id="especialidad_id"
                name="especialidad_id"
                value={formData.especialidad_id}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`input ${errors.especialidad_id ? 'input-error' : ''}`}
                aria-describedby={errors.especialidad_id ? 'especialidad-error' : undefined}
                aria-invalid={!!errors.especialidad_id}
              >
                <option value="">Selecciona una especialidad</option>
                {especialidades.map(esp => (
                  <option key={esp.especialidad_id} value={esp.especialidad_id}>
                    {esp.nombre}
                    {esp.modalidad_reserva === 'WALKIN' && ' (Por orden de llegada)'}
                    {esp.modalidad_reserva === 'REQUEST' && ' (Requiere coordinación)'}
                  </option>
                ))}
              </select>
              {errors.especialidad_id && (
                <div id="especialidad-error" className="error-message" role="alert">
                  {errors.especialidad_id}
                </div>
              )}
              {especialidadSeleccionada && (
                <div style={{ 
                  marginTop: '0.5rem', 
                  padding: '0.75rem', 
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  color: '#059669'
                }}>
                  ℹ️ {especialidadSeleccionada.descripcion}
                </div>
              )}
            </div>

            {/* Nombres */}
            <div className="form-group">
              <label htmlFor="nombres" className="form-label">
                Nombres del Paciente *
              </label>
              <input
                ref={firstInputRef}
                type="text"
                id="nombres"
                name="nombres"
                value={formData.nombres}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`input ${errors.nombres ? 'input-error' : ''}`}
                placeholder="Ej: Ana María"
                maxLength="50"
                aria-describedby={errors.nombres ? 'nombres-error' : undefined}
                aria-invalid={!!errors.nombres}
              />
              {errors.nombres && (
                <div id="nombres-error" className="error-message" role="alert">
                  {errors.nombres}
                </div>
              )}
            </div>

            {/* Apellidos */}
            <div className="form-group">
              <label htmlFor="apellidos" className="form-label">
                Apellidos del Paciente *
              </label>
              <input
                type="text"
                id="apellidos"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`input ${errors.apellidos ? 'input-error' : ''}`}
                placeholder="Ej: Pérez González"
                maxLength="50"
                aria-describedby={errors.apellidos ? 'apellidos-error' : undefined}
                aria-invalid={!!errors.apellidos}
              />
              {errors.apellidos && (
                <div id="apellidos-error" className="error-message" role="alert">
                  {errors.apellidos}
                </div>
              )}
            </div>

            {/* DNI */}
            <div className="form-group">
              <label htmlFor="dni" className="form-label">
                Número de DNI del Paciente o Apoderado *
              </label>
              <input
                type="text"
                id="dni"
                name="dni"
                value={formData.dni}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`input ${errors.dni ? 'input-error' : ''}`}
                placeholder="12345678"
                maxLength="8"
                aria-describedby={errors.dni ? 'dni-error' : undefined}
                aria-invalid={!!errors.dni}
              />
              {errors.dni && (
                <div id="dni-error" className="error-message" role="alert">
                  {errors.dni}
                </div>
              )}
            </div>

            {/* Fecha de Nacimiento */}
            <div className="form-group">
              <label htmlFor="fechaNacimiento" className="form-label">
                Fecha de Nacimiento del Paciente *
              </label>
              <input
                type="date"
                id="fechaNacimiento"
                name="fechaNacimiento"
                value={formData.fechaNacimiento}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`input ${errors.fechaNacimiento ? 'input-error' : ''}`}
                max={new Date().toISOString().split('T')[0]}
                aria-describedby={errors.fechaNacimiento ? 'fechaNacimiento-error' : undefined}
                aria-invalid={!!errors.fechaNacimiento}
              />
              {errors.fechaNacimiento && (
                <div id="fechaNacimiento-error" className="error-message" role="alert">
                  {errors.fechaNacimiento}
                </div>
              )}
            </div>

            {/* Teléfono */}
            <div className="form-group">
              <label htmlFor="telefono" className="form-label">
                Número de Contacto *
              </label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`input ${errors.telefono ? 'input-error' : ''}`}
                placeholder="987654321"
                maxLength="15"
                aria-describedby={errors.telefono ? 'telefono-error' : undefined}
                aria-invalid={!!errors.telefono}
              />
              {errors.telefono && (
                <div id="telefono-error" className="error-message" role="alert">
                  {errors.telefono}
                </div>
              )}
            </div>

            {/* Motivo (opcional) */}
            <div className="form-group">
              <label htmlFor="motivo" className="form-label">
                Motivo de consulta (opcional)
              </label>
              <textarea
                id="motivo"
                name="motivo"
                value={formData.motivo}
                onChange={handleInputChange}
                disabled={isLoading}
                className="input"
                placeholder="Describe brevemente el motivo de tu consulta..."
                rows="3"
                maxLength="200"
              />
            </div>

            {/* Acciones */}
            <div className="form-actions">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
              >
                {isLoading ? 'Procesando...' : 
                 especialidadSeleccionada?.modalidad_reserva === 'REQUEST' ? 'Enviar Solicitud' :
                 especialidadSeleccionada?.modalidad_reserva === 'WALKIN' ? 'Ver Información' :
                 'Agendar Cita'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;
