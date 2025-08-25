import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService.js';

/**
 * Contexto de autenticación para el sistema de citas médicas
 * Maneja estado global de usuario, token y permisos
 */

const AuthContext = createContext(null);

/**
 * Estados posibles de autenticación
 */
export const AuthStates = {
  CHECKING: 'checking',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  ERROR: 'error'
};

/**
 * Proveedor del contexto de autenticación
 */
export const AuthProvider = ({ children }) => {
  const [state, setState] = useState(AuthStates.CHECKING);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Inicializar estado de autenticación al cargar la app
   */
  useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * Configurar renovación automática de token
   */
  useEffect(() => {
    if (state === AuthStates.AUTHENTICATED) {
      authService.setupTokenRenewal();
    }
  }, [state]);

  /**
   * Inicializar autenticación desde localStorage
   */
  const initializeAuth = async () => {
    try {
      const storedToken = authService.getToken();
      const storedUser = authService.getCurrentUser();

      if (!storedToken || !storedUser) {
        setState(AuthStates.UNAUTHENTICATED);
        return;
      }

      // Verificar que el token sea válido
      const isValid = await authService.validateAuth();
      
      if (isValid) {
        setToken(storedToken);
        setUser(storedUser);
        setState(AuthStates.AUTHENTICATED);
      } else {
        // Token inválido, limpiar datos
        authService.logout();
        setState(AuthStates.UNAUTHENTICATED);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setError('Error al verificar autenticación');
      setState(AuthStates.ERROR);
    }
  };

  /**
   * Iniciar sesión
   */
  const login = async (credentials) => {
    try {
      setError(null);
      setState(AuthStates.CHECKING);

      const response = await authService.login(credentials);
      
      setToken(response.token);
      setUser(response.user);
      setState(AuthStates.AUTHENTICATED);

      return response;
    } catch (error) {
      setError(error.message || 'Error al iniciar sesión');
      setState(AuthStates.UNAUTHENTICATED);
      throw error;
    }
  };

  /**
   * Cerrar sesión
   */
  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
    setError(null);
    setState(AuthStates.UNAUTHENTICATED);
  };

  /**
   * Registrar nuevo usuario
   */
  const register = async (userData) => {
    try {
      setError(null);
      setState(AuthStates.CHECKING);

      const response = await authService.register(userData);
      
      setToken(response.token);
      setUser(response.user);
      setState(AuthStates.AUTHENTICATED);

      return response;
    } catch (error) {
      setError(error.message || 'Error al registrarse');
      setState(AuthStates.UNAUTHENTICATED);
      throw error;
    }
  };

  /**
   * Actualizar perfil del usuario
   */
  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      setUser(response.user);
      return response;
    } catch (error) {
      setError(error.message || 'Error al actualizar perfil');
      throw error;
    }
  };

  /**
   * Cambiar contraseña
   */
  const changePassword = async (passwordData) => {
    try {
      const response = await authService.changePassword(passwordData);
      return response;
    } catch (error) {
      setError(error.message || 'Error al cambiar contraseña');
      throw error;
    }
  };

  /**
   * Refrescar datos del usuario
   */
  const refreshUser = async () => {
    try {
      const response = await authService.getProfile();
      setUser(response.user);
      return response;
    } catch (error) {
      console.error('Error refreshing user:', error);
      // Si falla la actualización, mantener datos actuales
      throw error;
    }
  };

  /**
   * Verificar si el usuario tiene un rol específico
   */
  const hasRole = (roles) => {
    if (!user) return false;
    
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    
    return user.role === roles;
  };

  /**
   * Verificar permisos específicos
   */
  const can = (permission) => {
    if (!user) return false;

    // Definir permisos por rol
    const permissions = {
      admin: ['*'], // Admin puede todo
      operador: [
        'view_appointments',
        'create_appointments',
        'edit_appointments',
        'cancel_appointments',
        'view_requests',
        'assign_requests',
        'view_doctors',
        'view_specialties',
        'view_schedules',
        'create_schedules',
        'edit_schedules'
      ],
      doctor: [
        'view_my_appointments',
        'complete_appointments',
        'view_my_profile',
        'edit_my_profile',
        'view_my_schedules',
        'create_my_schedules',
        'edit_my_schedules'
      ],
      paciente: [
        'view_my_appointments',
        'create_appointments',
        'cancel_my_appointments',
        'view_specialties',
        'view_doctors',
        'create_requests'
      ]
    };

    const userPermissions = permissions[user.role] || [];
    
    // Admin tiene todos los permisos
    if (userPermissions.includes('*')) return true;
    
    return userPermissions.includes(permission);
  };

  /**
   * Verificar si está autenticado
   */
  const isAuthenticated = state === AuthStates.AUTHENTICATED;

  /**
   * Verificar si está cargando
   */
  const isLoading = state === AuthStates.CHECKING;

  /**
   * Helpers para roles específicos
   */
  const isAdmin = () => hasRole('admin');
  const isOperador = () => hasRole(['admin', 'operador']);
  const isDoctor = () => hasRole('doctor');
  const isPaciente = () => hasRole('paciente');

  /**
   * Limpiar error
   */
  const clearError = () => setError(null);

  // Valor del contexto
  const contextValue = {
    // Estado
    state,
    user,
    token,
    error,
    isAuthenticated,
    isLoading,

    // Acciones
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    refreshUser,
    clearError,

    // Permisos
    hasRole,
    can,
    isAdmin,
    isOperador,
    isDoctor,
    isPaciente
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para usar el contexto de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
};

/**
 * HOC para proteger rutas que requieren autenticación
 */
export const withAuth = (Component, allowedRoles = null) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, hasRole, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
          <div className="loading"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // Redirigir al login
      window.location.href = '/dashboard/login';
      return null;
    }

    if (allowedRoles && !hasRole(allowedRoles)) {
      return (
        <div className="container mt-4">
          <div className="alert alert-danger">
            <h4>Acceso Denegado</h4>
            <p>No tienes permisos para acceder a esta página.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

/**
 * Componente para proteger rutas
 */
export const ProtectedRoute = ({ children, allowedRoles = null, fallback = null }) => {
  const { isAuthenticated, hasRole, isLoading } = useAuth();

  if (isLoading) {
    return fallback || (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="loading"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = '/dashboard/login';
    return null;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return fallback || (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h4>Acceso Denegado</h4>
          <p>No tienes permisos para acceder a esta página.</p>
        </div>
      </div>
    );
  }

  return children;
};

export default AuthContext;
