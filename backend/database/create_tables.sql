-- Script para crear la base de datos CitasMedicas
-- Ejecutar este script como administrador en SQL Server

USE master;
GO

-- Crear la base de datos si no existe
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'CitasMedicas')
BEGIN
    CREATE DATABASE CitasMedicas
    COLLATE SQL_Latin1_General_CP1_CI_AS;
END
GO

USE CitasMedicas;
GO

-- Tabla de Roles
CREATE TABLE Roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(50) NOT NULL UNIQUE,
    descripcion NVARCHAR(255),
    permisos NVARCHAR(MAX), -- JSON con permisos específicos
    activo BIT DEFAULT 1,
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    fecha_actualizacion DATETIME2 DEFAULT GETDATE()
);

-- Tabla de Usuarios
CREATE TABLE Usuarios (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    apellido NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    telefono NVARCHAR(20),
    password_hash NVARCHAR(255) NOT NULL,
    rol_id INT NOT NULL,
    activo BIT DEFAULT 1,
    ultimo_login DATETIME2,
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    fecha_actualizacion DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (rol_id) REFERENCES Roles(id)
);

-- Tabla de Especialidades
CREATE TABLE Especialidades (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL UNIQUE,
    descripcion NVARCHAR(500),
    duracion_cita_minutos INT DEFAULT 30,
    horario_por_defecto NVARCHAR(MAX), -- JSON con horarios por defecto
    requiere_moderador BIT DEFAULT 0, -- Si requiere que el moderador cree las citas
    activo BIT DEFAULT 1,
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    fecha_actualizacion DATETIME2 DEFAULT GETDATE()
);

-- Tabla de Doctores (extends Usuarios)
CREATE TABLE Doctores (
    id INT IDENTITY(1,1) PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    especialidad_id INT NOT NULL,
    numero_licencia NVARCHAR(50) UNIQUE,
    biografia NVARCHAR(1000),
    foto_url NVARCHAR(500),
    activo BIT DEFAULT 1,
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    fecha_actualizacion DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id),
    FOREIGN KEY (especialidad_id) REFERENCES Especialidades(id)
);

-- Tabla de Horarios de Doctores
CREATE TABLE Horarios_Doctores (
    id INT IDENTITY(1,1) PRIMARY KEY,
    doctor_id INT NOT NULL,
    dia_semana INT NOT NULL, -- 0=Domingo, 1=Lunes, ..., 6=Sábado
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    es_horario_defecto BIT DEFAULT 0, -- Si es del horario por defecto de la especialidad
    activo BIT DEFAULT 1,
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    fecha_actualizacion DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (doctor_id) REFERENCES Doctores(id),
    UNIQUE(doctor_id, dia_semana, hora_inicio, hora_fin)
);

-- Tabla de Pacientes
CREATE TABLE Pacientes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    apellido NVARCHAR(100) NOT NULL,
    email NVARCHAR(255),
    telefono NVARCHAR(20) NOT NULL,
    fecha_nacimiento DATE,
    direccion NVARCHAR(500),
    documento_identidad NVARCHAR(50),
    tipo_documento NVARCHAR(20) DEFAULT 'DNI',
    activo BIT DEFAULT 1,
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    fecha_actualizacion DATETIME2 DEFAULT GETDATE()
);

-- Tabla de Estados de Citas
CREATE TABLE Estados_Citas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(50) NOT NULL UNIQUE,
    descripcion NVARCHAR(255),
    color NVARCHAR(7) DEFAULT '#007bff', -- Color hex para UI
    activo BIT DEFAULT 1
);

-- Tabla de Citas
CREATE TABLE Citas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    paciente_id INT NOT NULL,
    doctor_id INT NOT NULL,
    especialidad_id INT NOT NULL,
    fecha_hora DATETIME2 NOT NULL,
    duracion_minutos INT DEFAULT 30,
    estado_id INT NOT NULL,
    motivo_consulta NVARCHAR(500),
    observaciones NVARCHAR(1000),
    precio DECIMAL(10,2),
    creado_por_usuario_id INT NOT NULL, -- Quién creó la cita
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    fecha_actualizacion DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (paciente_id) REFERENCES Pacientes(id),
    FOREIGN KEY (doctor_id) REFERENCES Doctores(id),
    FOREIGN KEY (especialidad_id) REFERENCES Especialidades(id),
    FOREIGN KEY (estado_id) REFERENCES Estados_Citas(id),
    FOREIGN KEY (creado_por_usuario_id) REFERENCES Usuarios(id)
);

-- Tabla de Historial de Cambios en Citas
CREATE TABLE Historial_Citas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    cita_id INT NOT NULL,
    usuario_id INT NOT NULL,
    accion NVARCHAR(50) NOT NULL, -- 'CREADA', 'MODIFICADA', 'CANCELADA', etc.
    fecha_anterior DATETIME2,
    fecha_nueva DATETIME2,
    estado_anterior_id INT,
    estado_nuevo_id INT,
    observaciones NVARCHAR(500),
    fecha_cambio DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (cita_id) REFERENCES Citas(id),
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id),
    FOREIGN KEY (estado_anterior_id) REFERENCES Estados_Citas(id),
    FOREIGN KEY (estado_nuevo_id) REFERENCES Estados_Citas(id)
);

-- Tabla de Configuraciones del Sistema
CREATE TABLE Configuraciones (
    id INT IDENTITY(1,1) PRIMARY KEY,
    clave NVARCHAR(100) NOT NULL UNIQUE,
    valor NVARCHAR(MAX) NOT NULL,
    descripcion NVARCHAR(500),
    tipo_dato NVARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
    fecha_actualizacion DATETIME2 DEFAULT GETDATE()
);

-- Índices para optimizar consultas
CREATE INDEX IX_Usuarios_Email ON Usuarios(email);
CREATE INDEX IX_Usuarios_Rol ON Usuarios(rol_id);
CREATE INDEX IX_Doctores_Especialidad ON Doctores(especialidad_id);
CREATE INDEX IX_Citas_Fecha ON Citas(fecha_hora);
CREATE INDEX IX_Citas_Doctor ON Citas(doctor_id);
CREATE INDEX IX_Citas_Paciente ON Citas(paciente_id);
CREATE INDEX IX_Citas_Estado ON Citas(estado_id);
CREATE INDEX IX_Horarios_Doctor ON Horarios_Doctores(doctor_id);
CREATE INDEX IX_Historial_Cita ON Historial_Citas(cita_id);

PRINT '✅ Tablas creadas exitosamente';
