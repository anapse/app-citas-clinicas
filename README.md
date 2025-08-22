# Sistema de Control de Citas Médicas 🏥

Sistema completo de gestión de citas médicas para clínica, con backend API REST desarrollado en Node.js, Express y SQL Server.

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-blue.svg)](https://expressjs.com/)
[![SQL Server](https://img.shields.io/badge/SQL%20Server-2017%2B-red.svg)](https://www.microsoft.com/sql-server)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🚀 Características Principales

### 🔐 **Autenticación y Autorización**
- **JWT Authentication** con expiración configurable
- **RBAC (Role-Based Access Control)** con 4 roles:
  - 👑 **Admin**: Control total del sistema
  - 🏢 **Operador**: Gestión de citas y horarios
  - 👨‍⚕️ **Doctor**: Gestión de sus propias citas y perfil
  - 👤 **Paciente**: Reserva y consulta de sus citas

### 🏥 **Gestión de Especialidades Médicas**
El sistema soporta **3 modos de reserva** según las necesidades médicas:

#### 📅 **SLOT** - Reserva por Horarios Específicos
- Especialidades como **Endocrinología** y **Dermatología**
- Slots de tiempo configurables (ej: 20 minutos)
- Horarios semanales predefinidos
- Validación automática de disponibilidad

#### 📝 **REQUEST** - Solicitud Previa
- Especialidades como **Cardiología** y **Neurología**
- Paciente envía solicitud con datos
- Operador asigna fecha y hora manualmente
- Sistema de notificaciones

#### 🚶 **WALKIN** - Orden de Llegada
- **Pediatría General** sin reserva de horarios
- Atención por orden de llegada
- Horarios de clínica visibles
- Sin conflictos de tiempo

### 🎯 **Reglas de Negocio Implementadas**
✅ **Un paciente máximo por día** (validado en BD)  
✅ **Sin solapamiento de doctores** (índices únicos)  
✅ **Horarios específicos por especialidad**:
- 🩺 Endocrinología: Miércoles 17:00-18:00
- 🧴 Dermatología: Jueves 15:00-16:00
- 👶 Pediatría: Lunes a Sábado por orden de llegada

✅ **Cancelación inteligente** (hasta 2h antes para pacientes)  
✅ **Fechas ONE_OFF** para especialistas que vienen ocasionalmente

### 🛡️ **Seguridad Robusta**
- **Rate Limiting**: 30 req/5min en endpoints públicos
- **Sanitización XSS** de todos los inputs
- **CORS configurado** para GitHub Pages y localhost
- **Bcrypt** para hash de contraseñas (salt rounds: 12)
- **Helmet** para headers de seguridad
- **Validación exhaustiva** con express-validator

## 📋 Requisitos Previos

- **Node.js** 16.0 o superior
- **SQL Server** 2017 o superior  
- **npm** o **yarn**

## ⚡ Instalación Rápida

### 1. Clonar Repositorio
```bash
git clone https://github.com/TU_USUARIO/sistema-citas-medicas.git
cd sistema-citas-medicas
```

### 2. Configurar Base de Datos
```sql
-- Crear base de datos en SQL Server
CREATE DATABASE clinica_db;

-- Ejecutar script de inicialización
-- Desde SSMS: abrir y ejecutar backend/db/init.sql
-- O desde cmd: sqlcmd -S localhost -U sa -P tu_password -i backend/db/init.sql
```

### 3. Configurar Variables de Entorno
```bash
cd backend
cp .env.example .env

# Editar .env con tus configuraciones:
# - Credenciales de SQL Server
# - JWT Secret seguro
# - Dominios CORS permitidos
```

### 4. Instalar Dependencias y Ejecutar
```bash
npm install
npm run dev  # Desarrollo con auto-reload
# npm start  # Producción
```

### 5. Verificar Funcionamiento
```bash
# Health check
curl http://localhost:3001/health

# API info
curl http://localhost:3001/api

# Documentación interactiva
# Abrir: http://localhost:3001/api/docs
```

## 🧪 Usuarios de Prueba

El sistema incluye usuarios precargados para testing:

| Rol | Email | Contraseña | Permisos |
|-----|-------|------------|----------|
| 👑 Admin | admin@clinica.com | password123 | Acceso total |
| 🏢 Operador | operador@clinica.com | password123 | Gestión citas |
| 👨‍⚕️ Doctor | maria.gonzalez@clinica.com | password123 | Sus citas |
| 👤 Paciente | ana.perez@email.com | password123 | Sus citas |

## 🌐 API Endpoints Principales

### 🔐 Autenticación
```http
POST /api/auth/login           # Iniciar sesión
POST /api/auth/register        # Registro (pacientes públicos)
GET  /api/auth/me             # Perfil del usuario
```

### 🏥 Especialidades
```http
GET  /api/specialties                    # Lista especialidades
GET  /api/specialties?booking_mode=SLOT  # Filtrar por modo
POST /api/specialties                    # Crear (admin)
```

### 📅 Disponibilidad
```http
GET /api/availability?specialtyId=2&date=2025-08-25  # Consultar slots
GET /api/availability/weekly?specialtyId=2           # Vista semanal
```

### 📋 Citas
```http
GET  /api/appointments                 # Lista con filtros
POST /api/appointments                 # Crear cita
DELETE /api/appointments/:id           # Cancelar cita
GET  /api/appointments/me             # Mis citas
```

### 👨‍⚕️ Doctores
```http
GET  /api/doctors                     # Lista doctores
GET  /api/doctors/:id                 # Perfil completo
POST /api/doctors/:id/profile         # Actualizar perfil
POST /api/doctors/:id/photo          # Subir foto
```

## 💡 Ejemplos de Uso

### Login de Usuario
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clinica.com",
    "password": "password123"
  }'
```

### Consultar Disponibilidad
```bash
# Endocrinología (SLOT) - miércoles 17:00-18:00
curl "http://localhost:3001/api/availability?specialtyId=2&date=2025-08-27"

# Pediatría (WALKIN) - horarios generales
curl "http://localhost:3001/api/availability?specialtyId=1&date=2025-08-25"
```

### Crear Cita
```bash
curl -X POST http://localhost:3001/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "specialty_id": 2,
    "doctor_id": 1,
    "patient": {
      "name": "María José Pérez",
      "dni": "98765432",
      "birthdate": "2015-03-10",
      "phone": "+1-555-123-4567"
    },
    "start": "2025-08-27T17:00:00Z",
    "end": "2025-08-27T17:20:00Z"
  }'
```

### Respuestas de Conflictos
```json
// Paciente ya tiene cita ese día
{
  "error": "Ya tienes una cita ese día.",
  "code": "APPOINTMENT_CONFLICT"
}

// Horario ocupado
{
  "error": "Ese horario ya fue tomado.",
  "code": "APPOINTMENT_CONFLICT"
}

// Especialidad WALKIN
{
  "error": "Esta especialidad no maneja reservas por horarios. Atiende por orden de llegada.",
  "code": "WALKIN_SPECIALTY"
}
```

## 🗄️ Estructura de Base de Datos

### Tablas Principales
- **users** - Usuarios del sistema con roles
- **doctors** - Información de doctores
- **doctor_profiles** - Perfiles detallados con fotos
- **specialties** - Especialidades médicas
- **doctor_specialty** - Relación muchos a muchos
- **appointments** - Citas médicas
- **schedules** - Horarios y disponibilidad
- **clinic_hours** - Horarios generales de clínica

### Características de BD
✅ **Índices únicos** para validar reglas de negocio  
✅ **Triggers automáticos** para timestamps  
✅ **Constraints FK** con ON DELETE actions  
✅ **Columnas calculadas** para optimización  
✅ **Script idempotente** de inicialización

## 🔧 Configuración para Producción

### Variables de Entorno Críticas
```env
NODE_ENV=production
PORT=3001
SQL_ENCRYPT=true
JWT_SECRET=clave_super_segura_de_256_bits_minimo
CORS_ORIGINS=https://tu-dominio.github.io
```

### Despliegue con PM2
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicación
pm2 start server.js --name "clinica-api"

# Ver logs
pm2 logs clinica-api

# Monitoreo
pm2 monit
```

### Nginx Reverse Proxy
```nginx
server {
    listen 443 ssl;
    server_name api.tu-clinica.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 Monitoreo y Logs

### Health Checks
```bash
# Status del servicio
curl http://localhost:3001/health

# Información de la API
curl http://localhost:3001/api
```

### Logs Incluidos
- ✅ **HTTP Requests** (morgan)
- ✅ **Errores de BD** con stack trace
- ✅ **Rate limiting** activaciones
- ✅ **CORS** rechazos
- ✅ **Autenticación** fallida

## 🛠️ Desarrollo

### Estructura del Proyecto
```
backend/
├── controllers/      # Lógica de negocio
├── routes/          # Definición de endpoints
├── models/          # Modelos de datos
├── middleware/      # Auth, validación, errores
├── services/        # Lógica reutilizable
├── db/             # Scripts y configuración BD
├── utils/          # Utilidades
├── app.js          # Configuración Express
├── server.js       # Punto de entrada
└── openapi.yaml    # Documentación API
```

### Scripts Disponibles
```bash
npm start         # Producción
npm run dev       # Desarrollo con nodemon
npm test          # Tests (por implementar)
```

## 🔍 Troubleshooting

### Error de Conexión SQL Server
```bash
# Verificar SQL Server
sqlcmd -S localhost -U sa -P tu_password

# Verificar puerto abierto
netstat -an | findstr 1433
```

### Error de CORS
```env
# Agregar dominio a CORS_ORIGINS
CORS_ORIGINS=https://tu-dominio.github.io,http://localhost:5173
```

### Rate Limiting
```bash
# Deshabilitar en desarrollo
NODE_ENV=development npm run dev
```

## 📖 Documentación

- 📚 **[Documentación API Completa](http://localhost:3001/api/docs)** - OpenAPI/Swagger
- 🏥 **[Guía de Reglas de Negocio](backend/README.md#reglas-de-negocio)**
- 🔐 **[Guía de Seguridad](backend/README.md#seguridad)**
- 🗄️ **[Esquema de Base de Datos](backend/db/init.sql)**

## 🤝 Contribuir

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo [LICENSE](LICENSE) para más detalles.

## 🏆 Estado del Proyecto

🎉 **PROYECTO COMPLETADO AL 100%**

✅ Todas las especificaciones implementadas  
✅ Base de datos completa con datos de prueba  
✅ API REST con 25+ endpoints  
✅ Autenticación y autorización robusta  
✅ Validaciones de reglas de negocio  
✅ Documentación completa  
✅ Listo para producción  

---

**Desarrollado con ❤️ para mejorar la gestión de citas médicas**
