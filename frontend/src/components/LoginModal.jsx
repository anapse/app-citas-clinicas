import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginModal = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    usuario: '',
    clave: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

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

    // Focus en el primer input cuando se abre el modal
    setTimeout(() => {
      if (firstInputRef.current) {
        firstInputRef.current.focus();
      }
    }, 100);

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo específico cuando el usuario escribe
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.usuario.trim()) {
      newErrors.usuario = 'El usuario es requerido';
    } else if (formData.usuario.trim().length < 3) {
      newErrors.usuario = 'El usuario debe tener al menos 3 caracteres';
    }

    if (!formData.clave) {
      newErrors.clave = 'La contraseña es requerida';
    } else if (formData.clave.length < 6) {
      newErrors.clave = 'La contraseña debe tener al menos 6 caracteres';
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
    setErrors({});

    try {
      await login(formData);
      // Si llegamos aquí, el login fue exitoso
      onClose();
      // Reset form
      setFormData({ usuario: '', clave: '' });
    } catch (error) {
      setErrors({
        general: error.message || 'Error al iniciar sesión'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-backdrop"
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef} 
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">
            Acceso Administrativo
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="modal-close"
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--border-light)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
            <p className="text-sm text-secondary">
              🔒 Solo para administradores del sistema
            </p>
          </div>
          
          <form onSubmit={handleSubmit} noValidate>
            {/* Error general */}
            {errors.general && (
              <div className="error-message mb-3" role="alert">
                {errors.general}
              </div>
            )}

            {/* Campo Usuario */}
            <div className="form-group">
              <label htmlFor="usuario" className="form-label">
                Usuario Administrativo
              </label>
              <input
                ref={firstInputRef}
                type="text"
                id="usuario"
                name="usuario"
                value={formData.usuario}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`input ${errors.usuario ? 'input-error' : ''}`}
                placeholder="admin"
                autoComplete="username"
                aria-describedby={errors.usuario ? 'usuario-error' : undefined}
                aria-invalid={!!errors.usuario}
              />
              {errors.usuario && (
                <div id="usuario-error" className="error-message" role="alert">
                  {errors.usuario}
                </div>
              )}
            </div>

            {/* Campo Contraseña */}
            <div className="form-group">
              <label htmlFor="clave" className="form-label">
                Contraseña Administrativa
              </label>
              <input
                type="password"
                id="clave"
                name="clave"
                value={formData.clave}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`input ${errors.clave ? 'input-error' : ''}`}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-describedby={errors.clave ? 'clave-error' : undefined}
                aria-invalid={!!errors.clave}
              />
              {errors.clave && (
                <div id="clave-error" className="error-message" role="alert">
                  {errors.clave}
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="form-actions">
              <button
                type="button"
                onClick={handleClose}
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
                {isLoading ? 'Verificando...' : 'Acceder como Admin'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
