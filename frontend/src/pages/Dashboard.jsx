import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import { authService } from '../services/authService';
import DashboardLayout from '../components/DashboardLayout';
import toast from 'react-hot-toast';
import {
  Calendar,
  Users,
  UserCheck,
  Clock,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [citasRecientes, setCitasRecientes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user] = useState(authService.getCurrentUser());

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar estadísticas según el rol
      let statsData;
      if (user.rol === 'Doctor') {
        statsData = await dashboardService.getDoctorStats(user.doctor_id);
      } else {
        statsData = await dashboardService.getStats();
      }
      
      // Cargar datos adicionales
      const [alertasData, citasData] = await Promise.all([
        dashboardService.getAlertas(),
        dashboardService.getCitasRecientes(5)
      ]);

      setStats(statsData);
      setAlertas(alertasData);
      setCitasRecientes(citasData);
    } catch (error) {
      toast.error('Error cargando datos del dashboard');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAlertIcon = (tipo) => {
    switch (tipo) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard {user.rol === 'Doctor' ? `- Dr. ${user.nombre} ${user.apellido}` : ''}
          </h1>
          <p className="text-gray-600">
            Bienvenido al sistema de gestión de citas médicas
          </p>
        </div>

        {/* Estadísticas principales */}
        {user.rol === 'Doctor' ? (
          // Dashboard para Doctor
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Citas Hoy</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.estadisticas?.citas_hoy || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Citas del Mes</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.estadisticas?.citas_mes || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.estadisticas?.citas_pendientes || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Próxima Cita</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {stats?.estadisticas?.proxima_cita ? 
                      formatFecha(stats.estadisticas.proxima_cita) : 
                      'Sin citas programadas'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Dashboard para Admin/Moderador
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Citas Hoy</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.estadisticas_generales?.citas_hoy || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Citas del Mes</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.estadisticas_generales?.citas_mes || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Doctores</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.estadisticas_generales?.total_doctores || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-indigo-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Pacientes</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.estadisticas_generales?.total_pacientes || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Alertas */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Alertas del Sistema</h2>
            </div>
            <div className="p-6">
              {alertas.length > 0 ? (
                <div className="space-y-4">
                  {alertas.map((alerta, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                      {getAlertIcon(alerta.tipo)}
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {alerta.titulo}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {alerta.mensaje}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No hay alertas en este momento
                </p>
              )}
            </div>
          </div>

          {/* Citas recientes */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                {user.rol === 'Doctor' ? 'Mis Citas de Hoy' : 'Citas Recientes'}
              </h2>
            </div>
            <div className="p-6">
              {citasRecientes.length > 0 ? (
                <div className="space-y-4">
                  {citasRecientes.map((cita) => (
                    <div key={cita.id} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {cita.paciente_nombre} {cita.paciente_apellido}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatFecha(cita.fecha_hora)}
                        </p>
                        {user.rol !== 'Doctor' && (
                          <p className="text-sm text-gray-500">
                            Dr. {cita.doctor_nombre} {cita.doctor_apellido}
                          </p>
                        )}
                      </div>
                      <span 
                        className="px-2 py-1 text-xs rounded-full text-white"
                        style={{ backgroundColor: cita.estado_color }}
                      >
                        {cita.estado_nombre}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No hay citas recientes
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Gráficos adicionales para Admin/Moderador */}
        {user.rol !== 'Doctor' && stats?.citas_por_especialidad && (
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Citas por Especialidad (Este Mes)</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.citas_por_especialidad.map((esp, index) => (
                  <div key={index} className="flex items-center">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {esp.especialidad}
                        </span>
                        <span className="text-sm text-gray-600">
                          {esp.cantidad} citas
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ 
                            width: `${Math.max(5, (esp.cantidad / Math.max(...stats.citas_por_especialidad.map(e => e.cantidad))) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
