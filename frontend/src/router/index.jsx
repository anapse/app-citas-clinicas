import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

// Layout
import Layout from '../components/Layout/Layout.jsx';

// Páginas públicas
import Home from '../pages/Home/Home.jsx';
import Especialidades from '../pages/Especialidades/Especialidades.jsx';
import Doctores from '../pages/Doctores/Doctores.jsx';
import Doctor from '../pages/Doctor/Doctor.jsx';
import Agenda from '../pages/Agenda/Agenda.jsx';
import SolicitudCita from '../pages/SolicitudCita/SolicitudCita.jsx';

// Auth
import Login from '../pages/Login/Login.jsx';
import Profile from '../pages/Profile/Profile.jsx';

// Dashboard
import Dashboard from '../pages/Dashboard/Dashboard.jsx';
import MisCitas from '../pages/MisCitas/MisCitas.jsx';

/**
 * Componente para proteger rutas que requieren autenticación
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && (!requiredRole.includes(user.rol))) {
    return <Navigate to="/" replace />;
  }

  return children;
};

/**
 * Router principal de la aplicación
 */
const AppRouter = () => {
  return (
    <Routes>
      {/* Rutas públicas con layout */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="especialidades" element={<Especialidades />} />
        <Route path="doctores" element={<Doctores />} />
        <Route path="doctor/:id" element={<Doctor />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="solicitud-cita" element={<SolicitudCita />} />
      </Route>

      {/* Auth sin layout */}
      <Route path="/login" element={<Login />} />

      {/* Rutas protegidas con layout */}
      <Route path="/" element={<Layout />}>
        <Route 
          path="profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="mis-citas" 
          element={
            <ProtectedRoute requiredRole={['paciente']}>
              <MisCitas />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="dashboard" 
          element={
            <ProtectedRoute requiredRole={['admin', 'operador', 'doctor']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Ruta por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
