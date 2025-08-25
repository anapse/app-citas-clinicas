import { useContext } from 'react';
import AuthContext from '../context/AuthContext.jsx';

/**
 * Hook personalizado para usar el contexto de autenticación
 * Proporciona acceso a toda la funcionalidad de autenticación
 */
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }

    return context;
};

export default useAuth;
