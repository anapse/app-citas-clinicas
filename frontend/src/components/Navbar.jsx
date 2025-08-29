import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import LoginModal from './LoginModal';
import '../styles/components.css';

const Navbar = ({ user, onLogin, showLoginInNavbar = false }) => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLoginClick = () => {
    if (showLoginInNavbar) {
      setShowLoginModal(true);
    } else {
      navigate('/login');
    }
  };

  const handleCloseModal = () => {
    setShowLoginModal(false);
  };

  const handleLoginSuccess = (userData) => {
    setShowLoginModal(false);
    if (onLogin) {
      onLogin(userData);
    }
    // Redirigir al dashboard
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      authService.logout();
      if (onLogin) {
        onLogin(null);
      }
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Brand / Logo con título completo */}
          <button 
            onClick={handleHomeClick}
            className="navbar-brand"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            🏥 Sistema de Citas Médicas
          </button>

          {/* Navigation Actions */}
          <div className="navbar-actions">
            {user ? (
              <>
                {/* Usuario logueado - mostrar rol y opciones */}
                <span className="text-sm text-secondary">
                  {user.rol_nombre}: {user.nombre} {user.apellido}
                </span>
                
                {/* Botón para ir al dashboard */}
                <button
                  onClick={handleDashboardClick}
                  className="btn btn-primary btn-sm"
                  aria-label="Ir al Dashboard"
                >
                  Dashboard
                </button>

                {/* Botón de logout */}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="btn btn-secondary btn-sm"
                  aria-label="Cerrar sesión"
                >
                  {isLoggingOut ? 'Saliendo...' : 'Salir'}
                </button>
              </>
            ) : (
              <>
                {/* Sistema público - botón de acceso administrativo */}
                <span className="text-sm text-tertiary">
                  ¿Eres staff médico?
                </span>
                <button
                  onClick={handleLoginClick}
                  className="btn btn-primary btn-sm"
                  aria-label="Acceso staff médico"
                >
                  Acceso Staff
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Modal de Login para navbar */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={handleCloseModal}
          onLogin={handleLoginSuccess}
        />
      )}
    </>
  );
};

export default Navbar;
