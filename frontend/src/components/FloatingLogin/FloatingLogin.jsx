import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './FloatingLogin.css';

const FloatingLogin = () => {
  const { user, login, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);

    try {
      await login(loginData.email, loginData.password);
      setIsOpen(false);
      setLoginData({ email: '', password: '' });
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const canAccessDashboard = user && ['admin', 'operador', 'doctor'].includes(user.rol);

  if (user) {
    return (
      <div className={`floating-login ${isOpen ? 'open' : ''}`}>
        <button 
          className="floating-login-btn logged-in"
          onClick={() => setIsOpen(!isOpen)}
          title={`${user.firstName} ${user.lastName}`}
        >
          <span className="user-initial">{user.firstName?.[0]?.toUpperCase()}</span>
        </button>
        
        {isOpen && (
          <div className="floating-login-menu">
            <div className="user-info">
              <span className="user-name">{user.firstName} {user.lastName}</span>
              <span className="user-role">{user.rol}</span>
            </div>
            
            <div className="menu-actions">
              {canAccessDashboard && (
                <button 
                  className="menu-btn dashboard-btn"
                  onClick={() => {
                    window.location.href = '/app-citas-clinicas/dashboard';
                    setIsOpen(false);
                  }}
                >
                  📊 Dashboard
                </button>
              )}
              
              <button 
                className="menu-btn profile-btn"
                onClick={() => {
                  window.location.href = '/app-citas-clinicas/profile';
                  setIsOpen(false);
                }}
              >
                👤 Perfil
              </button>
              
              <button 
                className="menu-btn logout-btn"
                onClick={handleLogout}
              >
                🚪 Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`floating-login ${isOpen ? 'open' : ''}`}>
      <button 
        className="floating-login-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Iniciar sesión"
      >
        🔐
      </button>
      
      {isOpen && (
        <div className="floating-login-form">
          <div className="form-header">
            <h3>Iniciar Sesión</h3>
            <p>Solo para personal autorizado</p>
          </div>
          
          <form onSubmit={handleLogin}>
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={loginData.email}
                onChange={handleInputChange}
                placeholder="correo@clinica.com"
                required
                disabled={isLoggingIn}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                value={loginData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                required
                disabled={isLoggingIn}
              />
            </div>
            
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsOpen(false)}
                disabled={isLoggingIn}
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Iniciando...' : 'Entrar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FloatingLogin;
