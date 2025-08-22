# Sistema de Control de Citas Médicas - Backend

API REST completa para la gestión de citas médicas en clínica, construida con Node.js, Express y SQL Server.

## 🚀 Características Principales

- **Autenticación JWT** con roles jerárquicos (admin, operador, doctor, paciente)
- **Gestión de Especialidades** con 3 modos de reserva:
  - **SLOT**: Reserva por horarios específicos (ej: Endocrinología)
  - **REQUEST**: Solicitud previa, operador asigna (ej: Cardiología)
  - **WALKIN**: Atención por orden de llegada (ej: Pediatría)
- **Sistema de Disponibilidad** inteligente con validación de conflictos
- **Perfiles de Doctores** con especialidades y fotos
- **Control de Citas** con validaciones de negocio
- **Seguridad** con CORS, rate limiting y sanitización
- **Documentación OpenAPI** completa

## 📋 Requisitos Previos

- **Node.js** 16.0 o superior
- **SQL Server** 2017 o superior
- **npm** o **yarn**

## 🛠️ Instalación y Configuración

### 1. Preparar Base de Datos

```sql
-- Conectar a SQL Server y crear la base de datos
CREATE DATABASE clinica_db;
```

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus configuraciones
```

**Configuraciones requeridas en `.env`:**

```env
PORT=3001
SQL_SERVER=localhost
SQL_DB=clinica_db
SQL_USER=sa
SQL_PASSWORD=tu_password_sql_server
SQL_ENCRYPT=false
JWT_SECRET=tu_clave_secreta_super_segura
CORS_ORIGINS=https://tu-usuario.github.io,http://localhost:5173
NODE_ENV=production
```

### 3. Instalar Dependencias

```bash
cd backend
npm install
```

### 4. Inicializar Base de Datos

```bash
# Ejecutar script de inicialización
# Opción 1: Desde SQL Server Management Studio
# Abrir y ejecutar: db/init.sql

# Opción 2: Desde línea de comandos
sqlcmd -S localhost -U sa -P tu_password -i db/init.sql
```

### 5. Actualizar Contraseñas de Usuarios Demo

El script crea usuarios de ejemplo con contraseñas placeholder. **Debes actualizarlas:**

```sql
USE clinica_db;

-- Actualizar contraseñas (estos son hashes de bcrypt para "password123")
UPDATE users SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewOhvOlNsE9c5Wgy' WHERE email = 'admin@clinica.com';
UPDATE users SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewOhvOlNsE9c5Wgy' WHERE email = 'operador@clinica.com';
UPDATE users SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewOhvOlNsE9c5Wgy' WHERE email = 'maria.gonzalez@clinica.com';
UPDATE users SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewOhvOlNsE9c5Wgy' WHERE email = 'carlos.ruiz@clinica.com';
```

### 6. Iniciar Servidor

```bash
# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start
```

## 🌐 Endpoints Principales

### Autenticación
```http
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/me
```

### Especialidades
```http
GET  /api/specialties
POST /api/specialties
GET  /api/specialties/:id
```

### Disponibilidad
```http
GET  /api/availability?specialtyId=2&date=2025-08-25
GET  /api/availability/weekly?specialtyId=2
```

### Citas
```http
GET  /api/appointments
POST /api/appointments
DELETE /api/appointments/:id
```

### Doctores
```http
GET  /api/doctors
GET  /api/doctors/:id
POST /api/doctors/:id/profile
```

## 📖 Documentación API

- **Health Check**: `http://localhost:3001/health`
- **Info API**: `http://localhost:3001/api`
- **Documentación OpenAPI**: `http://localhost:3001/api/docs`

## 🧪 Ejemplos de Uso

### 1. Login de Administrador
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clinica.com",
    "password": "password123"
  }'
```

### 2. Consultar Disponibilidad
```bash
curl "http://localhost:3001/api/availability?specialtyId=2&date=2025-08-25"
```

### 3. Crear Cita
```bash
curl -X POST http://localhost:3001/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "specialty_id": 2,
    "doctor_id": 1,
    "patient": {
      "name": "Ana María Rodríguez",
      "dni": "87654321",
      "birthdate": "2010-05-15",
      "phone": "+1-555-987-6543"
    },
    "start": "2025-08-25T17:00:00Z",
    "end": "2025-08-25T17:20:00Z"
  }'
```

### 4. Conflicto de Cita (Paciente ya tiene cita ese día)
```bash
# Respuesta esperada: 409
{
  "error": "Ya tienes una cita ese día.",
  "code": "APPOINTMENT_CONFLICT"
}
```

### 5. Horario No Disponible
```bash
# Respuesta esperada: 409
{
  "error": "Ese horario ya fue tomado.",
  "code": "APPOINTMENT_CONFLICT"
}
```

## 🏗️ Estructura del Proyecto

```
backend/
├── controllers/         # Lógica de controladores
├── routes/             # Definición de rutas
├── models/             # Modelos de datos
├── middleware/         # Middleware personalizado
├── services/           # Servicios de negocio
├── db/                 # Configuración y scripts de BD
├── utils/              # Utilidades
├── app.js              # Configuración de Express
├── server.js           # Punto de entrada
├── openapi.yaml        # Documentación API
└── README.md           # Este archivo
```

## 🔐 Seguridad

- **JWT** con expiración de 24 horas
- **Bcrypt** para hash de contraseñas (salt rounds: 12)
- **Rate Limiting**: 30 req/5min en rutas públicas
- **CORS** configurado para dominios específicos
- **Helmet** para headers de seguridad
- **Sanitización** de inputs y SVG
- **Validación** exhaustiva con express-validator

## 🎯 Reglas de Negocio Implementadas

1. **Pediatría**: Atención por orden de llegada (WALKIN)
2. **Endocrinología**: Miércoles 17:00-18:00, slots de 20 min
3. **Dermatología**: Jueves 15:00-16:00, slots de 20 min
4. **Neumología/Inmunología**: Fechas puntuales activadas por operador
5. **Un paciente máximo por día** (validado en BD)
6. **Sin solapamiento de doctores** (validado en BD)
7. **Cancelación** hasta 2 horas antes (pacientes)

## 🚦 Códigos de Estado y Errores

| Código | Descripción | Ejemplo |
|--------|-------------|---------|
| 200 | Éxito | Datos obtenidos |
| 201 | Creado | Cita/Usuario creado |
| 400 | Bad Request | Datos inválidos |
| 401 | No autorizado | Token inválido |
| 403 | Prohibido | Sin permisos |
| 404 | No encontrado | Recurso inexistente |
| 409 | Conflicto | Cita duplicada |
| 429 | Rate limit | Demasiadas requests |
| 500 | Error servidor | Error interno |

## 🔧 Configuración para Producción

### Variables de Entorno
```env
NODE_ENV=production
PORT=3001
SQL_ENCRYPT=true
JWT_SECRET=clave_super_segura_de_256_bits
CORS_ORIGINS=https://tu-dominio.github.io
```

### PM2 (Recomendado)
```bash
# Instalar PM2
npm install -g pm2

# Iniciar con PM2
pm2 start server.js --name "clinica-api"

# Ver logs
pm2 logs clinica-api

# Reiniciar
pm2 restart clinica-api
```

### Nginx (Reverse Proxy)
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🐛 Troubleshooting

### Error de Conexión a SQL Server
```bash
# Verificar que SQL Server esté corriendo
sqlcmd -S localhost -U sa -P tu_password

# Verificar puertos abiertos
netstat -an | findstr 1433
```

### Error de CORS
```javascript
// Agregar tu dominio a CORS_ORIGINS en .env
CORS_ORIGINS=https://tu-dominio.github.io,http://localhost:5173
```

### Error de Token JWT
```bash
# Verificar que JWT_SECRET esté configurado
echo $JWT_SECRET

# Generar nuevo secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📝 Logs y Monitoreo

Los logs incluyen:
- **Requests HTTP** (morgan)
- **Errores de BD** con detalles
- **Intentos de autenticación**
- **Rate limiting** activado
- **CORS** rechazados

```bash
# Ver logs en tiempo real
tail -f logs/access.log
```

## 🤝 Contribuir

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

## 📞 Soporte

- **Email**: soporte@clinica.com
- **Documentación**: http://localhost:3001/api/docs
- **Issues**: GitHub Issues

---

**¡Sistema listo para producción! 🎉**

El backend está completamente funcional con todas las características solicitadas, incluyendo validaciones de negocio, seguridad, documentación y ejemplos de uso.
