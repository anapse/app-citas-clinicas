import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import '../styles/components.css'; // Asegúrate de crear este archivo para los estilos

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleCloseModal = () => {
    setShowLoginModal(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Brand / Logo */}
          <a href="/" className="navbar-brand">
            🏥 Citas Clínicas
          </a>

          {/* Navigation Actions */}
          <div className="navbar-actions">
            {isAuthenticated ? (
              <>
                {/* Administrador logueado */}
                <span className="text-sm text-secondary">
                  Admin: {user?.name || user?.username}
                </span>
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
                {/* Botón de acceso administrativo */}
                <span className="text-sm text-tertiary">
                  ¿Eres administrador?
                </span>
                <button
                  onClick={handleLoginClick}
                  className="btn btn-primary btn-sm"
                  aria-label="Acceso administrativo"
                >
                  Admin
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Modal de Login */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default Navbar;
