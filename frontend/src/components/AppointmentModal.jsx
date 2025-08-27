import React, { useState, useEffect, useRef } from 'react';

const AppointmentModal = ({ isOpen, onClose, selectedDate }) => {
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    dni: '',
    fechaNacimiento: '',
    telefono: '',
    especialidad: 'general'
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        nombres: '',
        apellidos: '',
        dni: '',
        fechaNacimiento: '',
        telefono: '',
        especialidad: 'general'
      });
      setErrors({});
    }
  }, [isOpen]);

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
    
    // Validaciones en tiempo real
    let processedValue = value;
    
    if (name === 'dni') {
      // Solo números para DNI
      processedValue = value.replace(/[^0-9]/g, '').slice(0, 8);
    } else if (name === 'telefono') {
      // Solo números para teléfono
      processedValue = value.replace(/[^0-9]/g, '').slice(0, 9);
    } else if (name === 'nombres' || name === 'apellidos') {
      // Solo letras y espacios para nombres
      processedValue = value.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ\s]/g, '');
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Limpiar error del campo específico
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombres.trim()) {
      newErrors.nombres = 'Los nombres son requeridos';
    } else if (formData.nombres.trim().length < 2) {
      newErrors.nombres = 'Los nombres deben tener al menos 2 caracteres';
    }

    if (!formData.apellidos.trim()) {
      newErrors.apellidos = 'Los apellidos son requeridos';
    } else if (formData.apellidos.trim().length < 2) {
      newErrors.apellidos = 'Los apellidos deben tener al menos 2 caracteres';
    }

    if (!formData.dni) {
      newErrors.dni = 'El DNI es requerido';
    } else if (formData.dni.length !== 8) {
      newErrors.dni = 'El DNI debe tener 8 dígitos';
    }

    if (!formData.fechaNacimiento) {
      newErrors.fechaNacimiento = 'La fecha de nacimiento es requerida';
    } else {
      const birthDate = new Date(formData.fechaNacimiento);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 0 || age > 120) {
        newErrors.fechaNacimiento = 'Fecha de nacimiento inválida';
      }
    }

    if (!formData.telefono) {
      newErrors.telefono = 'El número de contacto es requerido';
    } else if (formData.telefono.length !== 9) {
      newErrors.telefono = 'El teléfono debe tener 9 dígitos';
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
      // Simular envío de datos
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simular éxito
      console.log('Cita agendada:', {
        ...formData,
        fecha: selectedDate.toISOString(),
        fechaFormateada: selectedDate.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      });

      // Mostrar mensaje de éxito (aquí podrías usar un toast)
      alert(`¡Cita agendada exitosamente!\n\nPaciente: ${formData.nombres} ${formData.apellidos}\nFecha: ${selectedDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}\nEspecialidad: ${getEspecialidadLabel(formData.especialidad)}`);
      
      onClose();
    } catch (error) {
      setErrors({
        general: 'Error al agendar la cita. Por favor, intenta nuevamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getEspecialidadLabel = (value) => {
    const especialidades = {
      'general': 'Consulta General',
      'pediatria': 'Pediatría',
      'dermatologia': 'Dermatología',
      'endocrinologia': 'Endocrinología',
      'cardiologia': 'Cardiología'
    };
    return especialidades[value] || value;
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
            📅 Agendar Cita Médica
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
                placeholder="Ej: Juan Carlos"
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
                placeholder="Ej: Pérez García"
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
                DNI del Paciente o Apoderado *
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
                maxLength="9"
                aria-describedby={errors.telefono ? 'telefono-error' : undefined}
                aria-invalid={!!errors.telefono}
              />
              {errors.telefono && (
                <div id="telefono-error" className="error-message" role="alert">
                  {errors.telefono}
                </div>
              )}
            </div>

            {/* Especialidad */}
            <div className="form-group">
              <label htmlFor="especialidad" className="form-label">
                Especialidad
              </label>
              <select
                id="especialidad"
                name="especialidad"
                value={formData.especialidad}
                onChange={handleInputChange}
                disabled={isLoading}
                className="input"
              >
                <option value="general">🩺 Consulta General</option>
                <option value="pediatria">👶 Pediatría</option>
                <option value="dermatologia">🧴 Dermatología</option>
                <option value="endocrinologia">💉 Endocrinología</option>
                <option value="cardiologia">❤️ Cardiología</option>
              </select>
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
                {isLoading ? 'Agendando...' : 'Agendar Cita'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;
