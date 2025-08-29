# Backend Sistema de Citas Médicas

Este es el backend del sistema de citas médicas construido con Node.js, Express y SQL Server.

## Características

- **Autenticación JWT** con roles (Administrador, Moderador, Doctor)
- **Base de datos SQL Server** con esquema completo
- **API REST** para gestión completa del sistema
- **Dashboard** con estadísticas en tiempo real
- **Gestión de horarios** por defecto y personalizados
- **Sistema de permisos** granular por rol
- **Auditoría** de cambios en citas

## Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**
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

3. **Inicializar la base de datos:**
```bash
node init-db.js
```

4. **Iniciar el servidor:**
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## Estructura del Proyecto

```
backend/
├── config/
│   └── database.js          # Configuración de SQL Server
├── database/
│   ├── create_tables.sql    # Script de creación de tablas
│   └── insert_initial_data.sql # Datos iniciales
├── middleware/
│   ├── auth.js             # Middleware de autenticación
│   └── authorize.js        # Middleware de autorización
├── routes/
│   ├── auth.js             # Rutas de autenticación
│   ├── citas.js            # Rutas de citas
│   ├── doctores.js         # Rutas de doctores
│   ├── especialidades.js   # Rutas de especialidades
│   ├── horarios.js         # Rutas de horarios
│   └── dashboard.js        # Rutas del dashboard
├── init-db.js              # Script de inicialización
├── server.js               # Servidor principal
└── package.json
```

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil del usuario
- `PUT /api/auth/change-password` - Cambiar contraseña
- `GET /api/auth/verify` - Verificar token

### Citas
- `GET /api/citas` - Obtener citas (con filtros)
- `GET /api/citas/:id` - Obtener cita por ID
- `POST /api/citas` - Crear nueva cita
- `PUT /api/citas/:id` - Actualizar cita
- `DELETE /api/citas/:id` - Cancelar cita

### Doctores
- `GET /api/doctores` - Obtener doctores
- `GET /api/doctores/:id` - Obtener doctor por ID
- `GET /api/doctores/:id/horarios` - Obtener horarios del doctor
- `GET /api/doctores/:id/citas` - Obtener citas del doctor
- `PUT /api/doctores/:id` - Actualizar doctor
- `POST /api/doctores` - Crear nuevo doctor (Admin)

### Horarios
- `GET /api/horarios/doctor/:doctorId` - Obtener horarios de doctor
- `POST /api/horarios/doctor/:doctorId` - Crear horario
- `PUT /api/horarios/:id` - Actualizar horario
- `DELETE /api/horarios/:id` - Eliminar horario
- `POST /api/horarios/doctor/:doctorId/generar-defaults` - Generar horarios por defecto

### Especialidades
- `GET /api/especialidades` - Obtener especialidades
- `GET /api/especialidades/:id` - Obtener especialidad por ID
- `GET /api/especialidades/:id/doctores` - Obtener doctores de especialidad
- `POST /api/especialidades` - Crear especialidad (Admin)
- `PUT /api/especialidades/:id` - Actualizar especialidad (Admin)
- `DELETE /api/especialidades/:id` - Eliminar especialidad (Admin)

### Dashboard
- `GET /api/dashboard/stats` - Estadísticas generales
- `GET /api/dashboard/doctor/:doctorId/stats` - Estadísticas del doctor
- `GET /api/dashboard/citas-recientes` - Citas recientes
- `GET /api/dashboard/alertas` - Alertas del sistema

## Roles y Permisos

### Administrador
- Acceso completo al sistema
- Gestión de usuarios, doctores, especialidades
- Acceso a todas las estadísticas

### Moderador
- Gestión de citas y horarios
- Creación de citas para especialidades que lo requieran
- Acceso a estadísticas generales

### Doctor
- Gestión de sus propias citas y horarios
- Acceso a sus estadísticas personales
- Visualización de información de pacientes

## Base de Datos

El sistema utiliza SQL Server con las siguientes tablas principales:

- **Usuarios**: Información de usuarios del sistema
- **Roles**: Definición de roles y permisos
- **Doctores**: Información específica de doctores
- **Especialidades**: Especialidades médicas
- **Pacientes**: Información de pacientes
- **Citas**: Citas médicas
- **Horarios_Doctores**: Horarios de trabajo de doctores
- **Estados_Citas**: Estados posibles de las citas
- **Historial_Citas**: Auditoría de cambios en citas

## Credenciales por Defecto

Después de ejecutar `node init-db.js`:

- **Admin**: admin@clinica.com / password
- **Moderador**: moderador@clinica.com / password
- **Doctores**: 
  - dr.cairo@clinica.com / password
  - dra.perez@clinica.com / password
  - dr.ruiz@clinica.com / password

## Desarrollo

Para desarrollo local:

1. Asegúrate de tener SQL Server ejecutándose
2. Configura las variables de entorno
3. Ejecuta `npm run dev` para modo desarrollo con nodemon

## Seguridad

- Autenticación JWT
- Bcrypt para hash de contraseñas
- Rate limiting
- Helmet para headers de seguridad
- Validación de entrada con express-validator
- Permisos granulares por rol
