import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar autenticación al cargar la aplicación
  useEffect(() => {
    const checkAuth = () => {
      try {
        const savedAuth = localStorage.getItem('auth');
        const savedUser = localStorage.getItem('user');
        
        if (savedAuth === '1' && savedUser) {
          setIsAuthenticated(true);
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
        // Limpiar datos corruptos
        localStorage.removeItem('auth');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (credentials) => {
    return new Promise((resolve, reject) => {
      // Simulación de autenticación
      setTimeout(() => {
        const { usuario, clave } = credentials;
        
        // Validaciones básicas
        if (!usuario || !clave) {
          reject(new Error('Usuario y contraseña son requeridos'));
          return;
        }

        if (usuario.trim().length < 3) {
          reject(new Error('El usuario debe tener al menos 3 caracteres'));
          return;
        }

        if (clave.length < 6) {
          reject(new Error('La contraseña debe tener al menos 6 caracteres'));
          return;
        }

        // Mock de usuario autenticado
        const mockUser = {
          id: 1,
          username: usuario.trim(),
          email: `${usuario.trim()}@clinica.com`,
          role: 'admin',
          name: usuario.charAt(0).toUpperCase() + usuario.slice(1),
          lastLogin: new Date().toISOString()
        };

        // Guardar en localStorage
        try {
          localStorage.setItem('auth', '1');
          localStorage.setItem('user', JSON.stringify(mockUser));
          
          setIsAuthenticated(true);
          setUser(mockUser);
          
          resolve(mockUser);
        } catch (error) {
          reject(new Error('Error al guardar la sesión'));
        }
      }, 800);
    });
  };

  const logout = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Limpiar localStorage
        localStorage.removeItem('auth');
        localStorage.removeItem('user');
        
        // Limpiar estado
        setIsAuthenticated(false);
        setUser(null);
        
        resolve();
      }, 300);
    });
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
