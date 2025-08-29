# Sistema de Citas Médicas 🏥

Sistema completo de gestión de citas médicas con dashboard, backend API REST y frontend React, desarrollado con Node.js, Express, SQL Server y React.

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-blue.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18%2B-61dafb.svg)](https://reactjs.org/)
[![SQL Server](https://img.shields.io/badge/SQL%20Server-2017%2B-red.svg)](https://www.microsoft.com/sql-server)

## 🏗️ Arquitectura del Sistema

- **Frontend**: React + Vite + Tailwind CSS + React Router + React Query
- **Backend**: Node.js + Express + SQL Server
- **Base de datos**: SQL Server con esquema completo
- **Autenticación**: JWT con roles (Administrador, Moderador, Doctor)

## 📋 Características

### 🔐 Sistema de Roles

- **Administrador**: Acceso completo al sistema
  - Gestión completa de usuarios, doctores, especialidades
  - Reportes y estadísticas del sistema
  - Configuración del sistema

- **Moderador**: Gestión de citas y horarios
  - Crear y gestionar citas
  - Gestión de horarios de doctores
  - Gestión de especialidades que requieren moderación

- **Doctor**: Gestión de sus propias citas y horarios
  - Ver sus citas programadas
  - Gestionar horarios personalizados
  - Actualizar estados de citas

### 📊 Dashboard Inteligente

- **Estadísticas en tiempo real**:
  - Total de citas del día/semana/mes
  - Citas por especialidad
  - Doctores más ocupados
  - Tendencias de citas

- **Alertas del sistema**:
  - Citas próximas
  - Conflictos de horarios
  - Doctores sin horarios configurados

- **Gráficos y visualizaciones**:
  - Distribución de citas por especialidad
  - Ocupación por doctor
  - Tendencias temporales

### 📅 Gestión de Citas

- **Creación y edición**:
  - Validación automática de disponibilidad
  - Prevención de citas duplicadas por paciente
  - Asignación inteligente de horarios

- **Estados de citas**:
  - Programada
  - Confirmada
  - En proceso
  - Completada
  - Cancelada
  - No asistió

- **Historial y auditoría**:
  - Registro completo de cambios
  - Seguimiento de modificaciones
  - Responsable de cada cambio

### 👨‍⚕️ Gestión de Doctores

- **Perfiles completos**:
  - Información personal y profesional
  - Especialidades asignadas
  - Foto de perfil
  - Datos de contacto

- **Horarios flexibles**:
  - Horarios por defecto por especialidad
  - Horarios personalizados por doctor
  - Disponibilidad especial (fechas ONE_OFF)
  - Gestión de ausencias

### 🏥 Especialidades Médicas

- **Configuración flexible**:
  - Horarios por defecto configurables
  - Duración personalizada de citas
  - Control de moderación por especialidad

- **Especialidades incluidas**:
  - Odontología General
  - Endodoncia
  - Ortodoncia
  - Cardiología
  - Neurología
  - Pediatría

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js (v16 o superior)
- SQL Server (cualquier edición)
- Git

### 1. Configurar el Backend

```bash
cd backend
npm install
```

**Configurar variables de entorno:**

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales de SQL Server:

```env
NODE_ENV=development
PORT=3001

# Base de datos SQL Server
DB_SERVER=localhost
DB_DATABASE=CitasMedicas
DB_USER=sa
DB_PASSWORD=tu_password_aqui
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true

# JWT Secret
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
JWT_EXPIRES_IN=24h

# CORS
FRONTEND_URL=http://localhost:5173
```

**Inicializar la base de datos:**

```bash
node init-db.js
```

### 2. Configurar el Frontend

```bash
cd ../frontend
npm install
```

**Configurar variables de entorno:**

```bash
# Crear archivo .env
echo "VITE_API_URL=http://localhost:3001/api" > .env
```

### 3. Ejecutar el Sistema

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

El sistema estará disponible en:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 🔑 Credenciales por Defecto

Después de ejecutar `node init-db.js`:

- **Admin**: admin@clinica.com / password
- **Moderador**: moderador@clinica.com / password
- **Doctores**:
  - dr.cairo@clinica.com / password
  - dra.perez@clinica.com / password
  - dr.ruiz@clinica.com / password

## 📁 Estructura del Proyecto

```
app-citas-medicas/
├── backend/
│   ├── config/
│   │   └── database.js           # Configuración SQL Server
│   ├── database/
│   │   ├── create_tables.sql     # Script creación de tablas
│   │   └── insert_initial_data.sql # Datos iniciales
│   ├── middleware/
│   │   ├── auth.js               # Autenticación JWT
│   │   └── authorize.js          # Autorización por roles
│   ├── routes/
│   │   ├── auth.js               # Rutas autenticación
│   │   ├── citas.js              # Rutas de citas
│   │   ├── doctores.js           # Rutas de doctores
│   │   ├── especialidades.js     # Rutas especialidades
│   │   ├── horarios.js           # Rutas horarios
│   │   └── dashboard.js          # Rutas dashboard
│   ├── init-db.js                # Script inicialización
│   ├── server.js                 # Servidor principal
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DashboardLayout.jsx # Layout principal
│   │   │   └── ... (componentes existentes)
│   │   ├── pages/
│   │   │   ├── Login.jsx          # Página de login
│   │   │   └── Dashboard.jsx      # Dashboard principal
│   │   ├── services/
│   │   │   ├── api.js             # Cliente API
│   │   │   ├── authService.js     # Servicio autenticación
│   │   │   ├── citasService.js    # Servicio citas
│   │   │   ├── doctoresService.js # Servicio doctores
│   │   │   └── ... (otros servicios)
│   │   ├── context/               # Contextos React
│   │   └── App.jsx                # Componente principal
│   └── package.json
│
└── README.md
```

## 🎯 Funcionalidades Implementadas

### ✅ Dashboard

- **Vista Administrador/Moderador**:
  - Estadísticas generales del sistema
  - Citas por especialidad
  - Doctores más ocupados
  - Alertas del sistema

- **Vista Doctor**:
  - Citas del día
  - Estadísticas personales
  - Próximas citas
  - Horarios configurados

### ✅ Gestión de Citas

- Crear citas con validación de disponibilidad
- Actualizar estado de citas
- Historial completo de cambios
- Filtros avanzados de búsqueda
- Paginación de resultados

### ✅ Gestión de Horarios

- Horarios por defecto por especialidad
- Horarios personalizados por doctor
- Validación de solapamientos
- Generación automática de horarios

### ✅ Sistema de Permisos

- Autenticación JWT
- Roles granulares
- Middleware de autorización
- Rutas protegidas

## 🔧 API Endpoints

### Autenticación
```
POST   /api/auth/login              # Iniciar sesión
GET    /api/auth/profile            # Obtener perfil
PUT    /api/auth/change-password    # Cambiar contraseña
GET    /api/auth/verify             # Verificar token
```

### Citas
```
GET    /api/citas                   # Obtener citas (con filtros)
GET    /api/citas/:id               # Obtener cita por ID
POST   /api/citas                   # Crear nueva cita
PUT    /api/citas/:id               # Actualizar cita
DELETE /api/citas/:id               # Cancelar cita
```

### Doctores
```
GET    /api/doctores                # Obtener doctores
GET    /api/doctores/:id            # Obtener doctor por ID
GET    /api/doctores/:id/horarios   # Obtener horarios del doctor
GET    /api/doctores/:id/citas      # Obtener citas del doctor
PUT    /api/doctores/:id            # Actualizar doctor
POST   /api/doctores                # Crear nuevo doctor (Admin)
```

### Especialidades
```
GET    /api/especialidades          # Obtener especialidades
POST   /api/especialidades          # Crear especialidad (Admin)
PUT    /api/especialidades/:id      # Actualizar especialidad
DELETE /api/especialidades/:id      # Eliminar especialidad
```

### Horarios
```
GET    /api/horarios/doctor/:id     # Obtener horarios de un doctor
POST   /api/horarios                # Crear nuevo horario
PUT    /api/horarios/:id            # Actualizar horario
DELETE /api/horarios/:id            # Eliminar horario
```

### Dashboard
```
GET    /api/dashboard/stats                    # Estadísticas generales
GET    /api/dashboard/doctor/:id/stats         # Estadísticas del doctor
GET    /api/dashboard/citas-recientes          # Citas recientes
GET    /api/dashboard/alertas                  # Alertas del sistema
```

## 🗄️ Base de Datos

### Tablas Principales

- **Usuarios**: Información de usuarios del sistema
- **Roles**: Definición de roles y permisos
- **Doctores**: Información específica de doctores
- **Especialidades**: Especialidades médicas
- **Pacientes**: Información de pacientes
- **Citas**: Citas médicas programadas
- **Horarios_Doctores**: Horarios de trabajo
- **Estados_Citas**: Estados posibles de las citas
- **Historial_Citas**: Auditoría de cambios

### Esquema de Base de Datos

```sql
-- Roles del sistema
CREATE TABLE Roles (
    rol_id INT PRIMARY KEY IDENTITY(1,1),
    nombre NVARCHAR(50) NOT NULL UNIQUE,
    descripcion NVARCHAR(255),
    fecha_creacion DATETIME2 DEFAULT GETDATE()
);

-- Usuarios del sistema
CREATE TABLE Usuarios (
    usuario_id INT PRIMARY KEY IDENTITY(1,1),
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    nombre NVARCHAR(100) NOT NULL,
    apellido NVARCHAR(100) NOT NULL,
    telefono NVARCHAR(20),
    rol_id INT,
    activo BIT DEFAULT 1,
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    ultimo_acceso DATETIME2,
    FOREIGN KEY (rol_id) REFERENCES Roles(rol_id)
);

-- Especialidades médicas
CREATE TABLE Especialidades (
    especialidad_id INT PRIMARY KEY IDENTITY(1,1),
    nombre NVARCHAR(100) NOT NULL UNIQUE,
    descripcion NVARCHAR(255),
    duracion_cita_minutos INT DEFAULT 30,
    requiere_moderacion BIT DEFAULT 0,
    activo BIT DEFAULT 1,
    fecha_creacion DATETIME2 DEFAULT GETDATE()
);

-- Doctores
CREATE TABLE Doctores (
    doctor_id INT PRIMARY KEY IDENTITY(1,1),
    usuario_id INT NOT NULL,
    numero_licencia NVARCHAR(50) UNIQUE,
    especialidad_principal_id INT,
    biografia TEXT,
    fecha_ingreso DATE,
    activo BIT DEFAULT 1,
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(usuario_id),
    FOREIGN KEY (especialidad_principal_id) REFERENCES Especialidades(especialidad_id)
);

-- Estados de citas
CREATE TABLE Estados_Citas (
    estado_id INT PRIMARY KEY IDENTITY(1,1),
    nombre NVARCHAR(50) NOT NULL UNIQUE,
    descripcion NVARCHAR(255),
    color NVARCHAR(7), -- Código hex para colores
    activo BIT DEFAULT 1
);

-- Pacientes
CREATE TABLE Pacientes (
    paciente_id INT PRIMARY KEY IDENTITY(1,1),
    nombre NVARCHAR(100) NOT NULL,
    apellido NVARCHAR(100) NOT NULL,
    dni NVARCHAR(20) UNIQUE,
    fecha_nacimiento DATE,
    telefono NVARCHAR(20),
    email NVARCHAR(255),
    direccion NVARCHAR(255),
    contacto_emergencia NVARCHAR(255),
    activo BIT DEFAULT 1,
    fecha_creacion DATETIME2 DEFAULT GETDATE()
);

-- Citas médicas
CREATE TABLE Citas (
    cita_id INT PRIMARY KEY IDENTITY(1,1),
    doctor_id INT NOT NULL,
    paciente_id INT NOT NULL,
    especialidad_id INT NOT NULL,
    fecha_hora_inicio DATETIME2 NOT NULL,
    fecha_hora_fin DATETIME2 NOT NULL,
    estado_id INT NOT NULL,
    motivo_consulta TEXT,
    observaciones TEXT,
    precio DECIMAL(10,2),
    created_by INT,
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    fecha_actualizacion DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (doctor_id) REFERENCES Doctores(doctor_id),
    FOREIGN KEY (paciente_id) REFERENCES Pacientes(paciente_id),
    FOREIGN KEY (especialidad_id) REFERENCES Especialidades(especialidad_id),
    FOREIGN KEY (estado_id) REFERENCES Estados_Citas(estado_id),
    FOREIGN KEY (created_by) REFERENCES Usuarios(usuario_id)
);

-- Horarios de doctores
CREATE TABLE Horarios_Doctores (
    horario_id INT PRIMARY KEY IDENTITY(1,1),
    doctor_id INT NOT NULL,
    especialidad_id INT NOT NULL,
    dia_semana INT NOT NULL, -- 1=Lunes, 7=Domingo
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    es_horario_default BIT DEFAULT 0,
    fecha_especifica DATE, -- Para horarios ONE_OFF
    activo BIT DEFAULT 1,
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (doctor_id) REFERENCES Doctores(doctor_id),
    FOREIGN KEY (especialidad_id) REFERENCES Especialidades(especialidad_id)
);
```

## 🛠️ Desarrollo

### Comandos Útiles

**Backend:**
```bash
npm run dev          # Modo desarrollo con nodemon
npm start           # Modo producción
node init-db.js     # Reinicializar base de datos
```

**Frontend:**
```bash
npm run dev         # Servidor de desarrollo
npm run build       # Build para producción
npm run preview     # Preview del build
```

### Testing

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 🔮 Próximas Funcionalidades

- [ ] **Gestión completa de pacientes**
  - Historial médico
  - Documentos adjuntos
  - Alergias y medicamentos

- [ ] **Sistema de notificaciones**
  - Email automático
  - SMS recordatorios
  - Notificaciones push

- [ ] **Reportes avanzados**
  - Reportes de productividad
  - Análisis de tendencias
  - Exportación a PDF/Excel

- [ ] **Integración con calendario externo**
  - Google Calendar
  - Outlook
  - Sincronización bidireccional

- [ ] **API para aplicación móvil**
  - Endpoints móvil-específicos
  - Push notifications
  - Modo offline

- [ ] **Sistema de pagos**
  - Integración con pasarelas
  - Facturación automática
  - Control de pagos

- [ ] **Recordatorios automáticos**
  - WhatsApp Business API
  - Email templates
  - Configuración personalizable

## 📞 Soporte y Documentación

### Enlaces Útiles

- **API Documentation**: http://localhost:3001/api/docs (cuando el servidor esté ejecutándose)
- **Postman Collection**: `/docs/postman_collection.json`
- **Database Schema**: `/backend/database/create_tables.sql`
- **Sample Data**: `/backend/database/insert_initial_data.sql`

### Comandos de Diagnóstico

```bash
# Verificar conexión a la base de datos
node -e "require('./backend/config/database.js').testConnection()"

# Verificar APIs
curl http://localhost:3001/api/health

# Ver logs del servidor
tail -f backend/logs/app.log
```

## 🏥 ¡Sistema Listo para Usar!

El sistema ya incluye:

- ✅ **Backend completo** con API REST
- ✅ **Frontend React** con dashboard interactivo
- ✅ **Base de datos** SQL Server con esquema completo
- ✅ **Autenticación y autorización** por roles
- ✅ **Dashboard funcional** con estadísticas en tiempo real
- ✅ **Sistema de gestión** de doctores, citas y horarios
- ✅ **Interfaz de usuario** moderna y responsiva
- ✅ **Validaciones de negocio** implementadas
- ✅ **Historial y auditoría** completa

### Funcionalidades Destacadas

1. **Validación inteligente**: El sistema previene automáticamente conflictos de horarios y citas duplicadas
2. **Roles granulares**: Cada tipo de usuario tiene acceso solo a las funciones que necesita
3. **Dashboard adaptativo**: La interfaz cambia según el rol del usuario logueado
4. **Horarios flexibles**: Soporte para horarios por defecto y personalizados por doctor
5. **Auditoría completa**: Seguimiento de todos los cambios con responsable y timestamp

### Para comenzar a usar el sistema:

1. Sigue las instrucciones de instalación y configuración
2. Ejecuta el script de inicialización de la base de datos
3. Inicia el backend y frontend
4. Accede con las credenciales por defecto
5. ¡El sistema estará completamente funcional con datos de prueba!

---

**Desarrollado con ❤️ para optimizar la gestión de citas médicas** 🚀

**¡El sistema de citas médicas está completamente funcional y listo para producción!**
