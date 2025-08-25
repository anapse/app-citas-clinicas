import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import './Navbar.css';

/**
 * Navbar principal con navegación responsiva
 */
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // Enlaces de navegación principales
  const mainNavLinks = [
    { to: '/', label: 'Inicio', public: true },
    { to: '/especialidades', label: 'Especialidades', public: true },
    { to: '/doctores', label: 'Doctores', public: true },
    { to: '/citas', label: 'Mis Citas', requireAuth: true },
    { to: '/admin', label: 'Admin', requireRole: ['admin', 'operador'] }
  ];

  // Filtrar enlaces basado en autenticación y rol
  const visibleLinks = mainNavLinks.filter(link => {
    if (link.public) return true;
    if (link.requireAuth && !isAuthenticated) return false;
    if (link.requireRole && (!user || !link.requireRole.includes(user.role))) return false;
    return isAuthenticated;
  });

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-brand">
          <div className="brand-logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L13.09 8.26L20.18 7.74L18.12 13.74L23.64 16.74L16.26 19.36L15.64 23.64L12 18L8.36 23.64L7.74 19.36L0.36 16.74L5.88 13.74L3.82 7.74L10.91 8.26L12 2Z" fill="currentColor"/>
            </svg>
            <span className="brand-text">ClinicApp</span>
          </div>
        </Link>

        {/* Botón de menú móvil */}
        <button 
          className={`navbar-toggle ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Navegación principal */}
        <div className={`navbar-nav ${isMenuOpen ? 'active' : ''}`}>
          <ul className="nav-links">
            {visibleLinks.map((link) => (
              <li key={link.to} className="nav-item">
                <Link 
                  to={link.to} 
                  className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Área de usuario */}
          <div className="navbar-actions">
            {isAuthenticated ? (
              <div className="user-menu" ref={userMenuRef}>
                <button 
                  className="user-trigger"
                  onClick={toggleUserMenu}
                  aria-expanded={isUserMenuOpen}
                >
                  <div className="user-avatar">
                    {user.nombres?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                  <span className="user-name">
                    {user.nombres || user.email}
                  </span>
                  <svg 
                    className={`user-arrow ${isUserMenuOpen ? 'open' : ''}`}
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none"
                  >
                    <path d="M7 10L12 15L17 10H7Z" fill="currentColor"/>
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div className="user-dropdown">
                    <div className="user-info">
                      <div className="user-name">{user.nombres || user.email}</div>
                      <div className="user-role">{user.role}</div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <Link to="/perfil" className="dropdown-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7V9C15 10.5 14.2 11.8 13 12.5V16H14C14.6 16 15 16.4 15 17V18H9V17C9 16.4 9.4 16 10 16H11V12.5C9.8 11.8 9 10.5 9 9V7L3 7V9C3 10.7 4.3 12 6 12H7V13C7 13.6 7.4 14 8 14H9V22H15V14H16C16.6 14 17 13.6 17 13V12H18C19.7 12 21 10.7 21 9Z" fill="currentColor"/>
                      </svg>
                      Mi Perfil
                    </Link>
                    <Link to="/citas" className="dropdown-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H12V15H7V10Z" fill="currentColor"/>
                      </svg>
                      Mis Citas
                    </Link>
                    {(user.role === 'admin' || user.role === 'operador') && (
                      <Link to="/admin" className="dropdown-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" fill="currentColor"/>
                        </svg>
                        Administración
                      </Link>
                    )}
                    <div className="dropdown-divider"></div>
                    <button onClick={handleLogout} className="dropdown-item logout">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.59L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" fill="currentColor"/>
                      </svg>
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
