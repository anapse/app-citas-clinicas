import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import {
  Home,
  Calendar,
  Users,
  UserCheck,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  Clock
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    toast.success('Sesión cerrada exitosamente');
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, current: location.pathname === '/dashboard' },
    { name: 'Calendario', href: '/calendar', icon: Calendar, current: location.pathname === '/calendar' },
    ...(user?.rol !== 'Doctor' ? [
      { name: 'Citas', href: '/citas', icon: BarChart3, current: location.pathname === '/citas' },
      { name: 'Doctores', href: '/doctores', icon: UserCheck, current: location.pathname === '/doctores' },
      { name: 'Pacientes', href: '/pacientes', icon: Users, current: location.pathname === '/pacientes' },
    ] : []),
    ...(user?.rol === 'Doctor' ? [
      { name: 'Mis Citas', href: '/mis-citas', icon: BarChart3, current: location.pathname === '/mis-citas' },
      { name: 'Mis Horarios', href: '/mis-horarios', icon: Clock, current: location.pathname === '/mis-horarios' },
    ] : []),
    ...(user?.rol === 'Administrador' ? [
      { name: 'Especialidades', href: '/especialidades', icon: Settings, current: location.pathname === '/especialidades' },
      { name: 'Configuración', href: '/configuracion', icon: Settings, current: location.pathname === '/configuracion' },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar para móvil */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Sistema Citas</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col overflow-y-auto px-6 py-4">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 ${
                      item.current
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-6 w-6 shrink-0" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="border-t border-gray-200 p-6">
            <div className="flex items-center gap-x-4">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
                </span>
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user?.nombre} {user?.apellido}</p>
                <p className="text-gray-500">{user?.rol}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 flex w-full items-center gap-x-3 rounded-md p-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <LogOut className="h-6 w-6" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar para desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold text-gray-900">Sistema de Citas</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 ${
                          item.current
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto border-t border-gray-200 pt-4">
                <div className="flex items-center gap-x-4 mb-4">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{user?.nombre} {user?.apellido}</p>
                    <p className="text-gray-500">{user?.rol}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-x-3 rounded-md p-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <LogOut className="h-6 w-6" />
                  Cerrar Sesión
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="lg:pl-72">
        {/* Header móvil */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-700"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="h-6 w-px bg-gray-200"></div>
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">
              {navigation.find(item => item.current)?.name || 'Dashboard'}
            </h1>
            <div className="flex items-center gap-x-4">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido de la página */}
        <main>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
