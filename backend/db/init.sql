-- =============================================
-- Script de Inicialización - Sistema de Citas Médicas
-- Base de datos: SQL Server
-- =============================================

USE master;
GO

-- Crear base de datos si no existe
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'clinica_db')
BEGIN
    CREATE DATABASE clinica_db;
    PRINT '✅ Base de datos clinica_db creada exitosamente';
END
ELSE
BEGIN
    PRINT '⚠️ Base de datos clinica_db ya existe';
END
GO

USE clinica_db;
GO

-- =============================================
-- TABLAS PRINCIPALES
-- =============================================

-- Tabla: roles
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'roles')
BEGIN
    CREATE TABLE roles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(50) NOT NULL UNIQUE
    );
    PRINT '✅ Tabla roles creada';
END

-- Tabla: users
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'users')
BEGIN
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        full_name NVARCHAR(150) NOT NULL,
        email NVARCHAR(100) NOT NULL UNIQUE,
        phone NVARCHAR(20),
        dni NVARCHAR(20),
        password_hash NVARCHAR(255) NOT NULL,
        role_id INT NOT NULL,
        created_at DATETIME2 DEFAULT SYSDATETIME(),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
    );
    
    CREATE INDEX IX_users_email ON users(email);
    CREATE INDEX IX_users_dni ON users(dni);
    PRINT '✅ Tabla users creada';
END

-- Tabla: specialties
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'specialties')
BEGIN
    CREATE TABLE specialties (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL UNIQUE,
        booking_mode NVARCHAR(20) NOT NULL CHECK (booking_mode IN ('SLOT', 'REQUEST', 'WALKIN')),
        created_at DATETIME2 DEFAULT SYSDATETIME()
    );
    PRINT '✅ Tabla specialties creada';
END

-- Tabla: doctors
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'doctors')
BEGIN
    CREATE TABLE doctors (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        display_name NVARCHAR(150) NOT NULL,
        created_at DATETIME2 DEFAULT SYSDATETIME(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    PRINT '✅ Tabla doctors creada';
END

-- Tabla: doctor_specialty (relación muchos a muchos)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'doctor_specialty')
BEGIN
    CREATE TABLE doctor_specialty (
        id INT IDENTITY(1,1) PRIMARY KEY,
        doctor_id INT NOT NULL,
        specialty_id INT NOT NULL,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
        FOREIGN KEY (specialty_id) REFERENCES specialties(id) ON DELETE CASCADE,
        UNIQUE(doctor_id, specialty_id)
    );
    PRINT '✅ Tabla doctor_specialty creada';
END

-- Tabla: clinic_hours
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'clinic_hours')
BEGIN
    CREATE TABLE clinic_hours (
        id INT IDENTITY(1,1) PRIMARY KEY,
        day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Lunes, 7=Domingo
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT SYSDATETIME()
    );
    PRINT '✅ Tabla clinic_hours creada';
END

-- Tabla: schedules
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'schedules')
BEGIN
    CREATE TABLE schedules (
        id INT IDENTITY(1,1) PRIMARY KEY,
        doctor_id INT NULL, -- NULL para horarios generales de especialidad
        specialty_id INT NOT NULL,
        type NVARCHAR(20) NOT NULL CHECK (type IN ('WEEKLY', 'ONE_OFF')),
        date_start DATE NOT NULL,
        date_end DATE NULL, -- NULL para ONE_OFF
        days_mask INT NULL, -- Para WEEKLY: bitmask días (1=Lun, 2=Mar, 4=Mié, etc.)
        time_start TIME NOT NULL,
        time_end TIME NOT NULL,
        slot_minutes INT NOT NULL DEFAULT 30,
        capacity INT NOT NULL DEFAULT 1,
        active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT SYSDATETIME(),
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
        FOREIGN KEY (specialty_id) REFERENCES specialties(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IX_schedules_doctor_specialty ON schedules(doctor_id, specialty_id);
    CREATE INDEX IX_schedules_dates ON schedules(date_start, date_end);
    PRINT '✅ Tabla schedules creada';
END

-- Tabla: schedule_exceptions
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'schedule_exceptions')
BEGIN
    CREATE TABLE schedule_exceptions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        schedule_id INT NOT NULL,
        the_date DATE NOT NULL,
        is_closed BIT NOT NULL DEFAULT 1, -- 1=cerrado, 0=modificación de horario
        ex_time_start TIME NULL, -- Nuevo horario de inicio (si is_closed=0)
        ex_time_end TIME NULL, -- Nuevo horario de fin (si is_closed=0)
        created_at DATETIME2 DEFAULT SYSDATETIME(),
        FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
        UNIQUE(schedule_id, the_date)
    );
    PRINT '✅ Tabla schedule_exceptions creada';
END

-- Tabla: appointments
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'appointments')
BEGIN
    CREATE TABLE appointments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        specialty_id INT NOT NULL,
        doctor_id INT NULL, -- NULL para especialidades sin doctor específico
        patient_name NVARCHAR(150) NOT NULL,
        dni NVARCHAR(20) NOT NULL,
        birthdate DATE NOT NULL,
        phone NVARCHAR(20),
        start_dt DATETIME2 NOT NULL,
        end_dt DATETIME2 NOT NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'confirmed', 'checked_in', 'cancelled')),
        created_by INT NULL, -- Usuario que creó la cita
        created_at DATETIME2 DEFAULT SYSDATETIME(),
        cancelled_at DATETIME2 NULL,
        appointment_date AS CAST(start_dt AS DATE) PERSISTED, -- Columna calculada
        FOREIGN KEY (specialty_id) REFERENCES specialties(id) ON DELETE RESTRICT,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );
    
    -- Índice único: un paciente no puede tener más de una cita activa por día
    CREATE UNIQUE INDEX UQ_Patient_Per_Day ON appointments(dni, appointment_date) 
    WHERE status IN ('booked', 'confirmed', 'checked_in');
    
    -- Índice único: un doctor no puede tener dos citas en el mismo slot
    CREATE UNIQUE INDEX UQ_Doctor_Slot ON appointments(doctor_id, start_dt) 
    WHERE status IN ('booked', 'confirmed', 'checked_in') AND doctor_id IS NOT NULL;
    
    CREATE INDEX IX_appointments_dates ON appointments(start_dt, end_dt);
    CREATE INDEX IX_appointments_patient ON appointments(dni);
    CREATE INDEX IX_appointments_status ON appointments(status);
    
    PRINT '✅ Tabla appointments creada';
END

-- Tabla: appointment_requests
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'appointment_requests')
BEGIN
    CREATE TABLE appointment_requests (
        id INT IDENTITY(1,1) PRIMARY KEY,
        specialty_id INT NOT NULL,
        patient_name NVARCHAR(150) NOT NULL,
        dni NVARCHAR(20) NOT NULL,
        birthdate DATE NOT NULL,
        phone NVARCHAR(20),
        note NVARCHAR(500) NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'cancelled')),
        created_at DATETIME2 DEFAULT SYSDATETIME(),
        FOREIGN KEY (specialty_id) REFERENCES specialties(id) ON DELETE RESTRICT
    );
    
    CREATE INDEX IX_requests_status ON appointment_requests(status);
    CREATE INDEX IX_requests_specialty ON appointment_requests(specialty_id);
    PRINT '✅ Tabla appointment_requests creada';
END

-- Tabla: doctor_profiles
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'doctor_profiles')
BEGIN
    CREATE TABLE doctor_profiles (
        doctor_id INT PRIMARY KEY,
        primary_specialty_id INT NULL,
        title_prefix NVARCHAR(30) NULL, -- Dr., Dra., etc.
        description_short NVARCHAR(200) NULL,
        description_long NVARCHAR(MAX) NULL,
        photo_url NVARCHAR(300) NULL,
        photo_svg NVARCHAR(MAX) NULL,
        is_visible BIT DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at DATETIME2 DEFAULT SYSDATETIME(),
        updated_at DATETIME2 DEFAULT SYSDATETIME(),
        has_image AS CASE WHEN photo_url IS NOT NULL OR photo_svg IS NOT NULL THEN 1 ELSE 0 END PERSISTED,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
        FOREIGN KEY (primary_specialty_id) REFERENCES specialties(id) ON DELETE SET NULL,
        CONSTRAINT CK_DoctorProfile_OneImage CHECK (NOT (photo_url IS NOT NULL AND photo_svg IS NOT NULL))
    );
    PRINT '✅ Tabla doctor_profiles creada';
END

-- Trigger para actualizar updated_at en doctor_profiles
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'tr_doctor_profiles_updated_at')
BEGIN
    EXEC('
    CREATE TRIGGER tr_doctor_profiles_updated_at
    ON doctor_profiles
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE doctor_profiles 
        SET updated_at = SYSDATETIME()
        FROM doctor_profiles dp
        INNER JOIN inserted i ON dp.doctor_id = i.doctor_id;
    END
    ');
    PRINT '✅ Trigger tr_doctor_profiles_updated_at creado';
END

-- =============================================
-- DATOS SEMILLA (SEED DATA)
-- =============================================

-- Insertar roles
IF NOT EXISTS (SELECT * FROM roles WHERE name = 'admin')
BEGIN
    INSERT INTO roles (name) VALUES 
    ('admin'),
    ('operador'),
    ('doctor'),
    ('paciente');
    PRINT '✅ Roles insertados';
END

-- Insertar especialidades
IF NOT EXISTS (SELECT * FROM specialties WHERE name = 'Pediatría')
BEGIN
    INSERT INTO specialties (name, booking_mode) VALUES
    ('Pediatría', 'WALKIN'),
    ('Endocrinología Pediátrica', 'SLOT'),
    ('Dermatología', 'SLOT'),
    ('Neumología Pediátrica', 'SLOT'),
    ('Inmunología Pediátrica', 'SLOT'),
    ('Cardiología Pediátrica', 'REQUEST'),
    ('Neurología Pediátrica', 'REQUEST');
    PRINT '✅ Especialidades insertadas';
END

-- Insertar horarios de clínica
IF NOT EXISTS (SELECT * FROM clinic_hours WHERE day_of_week = 1)
BEGIN
    INSERT INTO clinic_hours (day_of_week, start_time, end_time, active) VALUES
    -- Lunes a Sábado: mañana y tarde
    (1, '08:00', '13:00', 1), (1, '15:00', '19:00', 1), -- Lunes
    (2, '08:00', '13:00', 1), (2, '15:00', '19:00', 1), -- Martes
    (3, '08:00', '13:00', 1), (3, '15:00', '19:00', 1), -- Miércoles
    (4, '08:00', '13:00', 1), (4, '15:00', '19:00', 1), -- Jueves
    (5, '08:00', '13:00', 1), (5, '15:00', '19:00', 1), -- Viernes
    (6, '08:00', '13:00', 1), (6, '15:00', '19:00', 1), -- Sábado
    -- Domingo: solo mañana
    (7, '09:00', '13:00', 1);
    PRINT '✅ Horarios de clínica insertados';
END

-- Insertar usuarios de ejemplo (passwords serán hasheadas por la aplicación)
-- Nota: Las contraseñas deben ser hasheadas con bcrypt antes de insertar
DECLARE @admin_role_id INT = (SELECT id FROM roles WHERE name = 'admin');
DECLARE @operador_role_id INT = (SELECT id FROM roles WHERE name = 'operador');
DECLARE @doctor_role_id INT = (SELECT id FROM roles WHERE name = 'doctor');
DECLARE @paciente_role_id INT = (SELECT id FROM roles WHERE name = 'paciente');

IF NOT EXISTS (SELECT * FROM users WHERE email = 'admin@clinica.com')
BEGIN
    INSERT INTO users (full_name, email, phone, dni, password_hash, role_id) VALUES
    ('Administrador Sistema', 'admin@clinica.com', '555-0001', '00000001', '$2b$10$placeholder_hash_admin', @admin_role_id),
    ('Operador Clínica', 'operador@clinica.com', '555-0002', '00000002', '$2b$10$placeholder_hash_operador', @operador_role_id),
    ('Dr. María González', 'maria.gonzalez@clinica.com', '555-0003', '12345678', '$2b$10$placeholder_hash_doctor1', @doctor_role_id),
    ('Dr. Carlos Ruiz', 'carlos.ruiz@clinica.com', '555-0004', '87654321', '$2b$10$placeholder_hash_doctor2', @doctor_role_id),
    ('Ana Pérez', 'ana.perez@email.com', '555-0005', '11111111', '$2b$10$placeholder_hash_paciente', @paciente_role_id);
    PRINT '✅ Usuarios de ejemplo insertados';
END

-- Insertar doctores
DECLARE @maria_user_id INT = (SELECT id FROM users WHERE email = 'maria.gonzalez@clinica.com');
DECLARE @carlos_user_id INT = (SELECT id FROM users WHERE email = 'carlos.ruiz@clinica.com');

IF NOT EXISTS (SELECT * FROM doctors WHERE user_id = @maria_user_id)
BEGIN
    INSERT INTO doctors (user_id, display_name) VALUES
    (@maria_user_id, 'Dra. María González'),
    (@carlos_user_id, 'Dr. Carlos Ruiz');
    PRINT '✅ Doctores insertados';
END

-- Relacionar doctores con especialidades
DECLARE @maria_doctor_id INT = (SELECT id FROM doctors WHERE user_id = @maria_user_id);
DECLARE @carlos_doctor_id INT = (SELECT id FROM doctors WHERE user_id = @carlos_user_id);
DECLARE @endocrino_id INT = (SELECT id FROM specialties WHERE name = 'Endocrinología Pediátrica');
DECLARE @dermato_id INT = (SELECT id FROM specialties WHERE name = 'Dermatología');

IF NOT EXISTS (SELECT * FROM doctor_specialty WHERE doctor_id = @maria_doctor_id)
BEGIN
    INSERT INTO doctor_specialty (doctor_id, specialty_id) VALUES
    (@maria_doctor_id, @endocrino_id),
    (@carlos_doctor_id, @dermato_id);
    PRINT '✅ Relaciones doctor-especialidad insertadas';
END

-- Insertar perfiles de doctores
IF NOT EXISTS (SELECT * FROM doctor_profiles WHERE doctor_id = @maria_doctor_id)
BEGIN
    INSERT INTO doctor_profiles (doctor_id, primary_specialty_id, title_prefix, description_short, photo_url, photo_svg) VALUES
    (@maria_doctor_id, @endocrino_id, 'Dra.', 'Especialista en Endocrinología Pediátrica con 15 años de experiencia', NULL, NULL),
    (@carlos_doctor_id, @dermato_id, 'Dr.', 'Dermatólogo pediátrico especializado en problemas de piel en niños', NULL, NULL);
    PRINT '✅ Perfiles de doctores insertados';
END

-- Insertar horarios semanales
IF NOT EXISTS (SELECT * FROM schedules WHERE doctor_id = @maria_doctor_id)
BEGIN
    INSERT INTO schedules (doctor_id, specialty_id, type, date_start, date_end, days_mask, time_start, time_end, slot_minutes, capacity, active) VALUES
    -- Endocrinología: miércoles 17:00-18:00 (days_mask = 4 para miércoles)
    (@maria_doctor_id, @endocrino_id, 'WEEKLY', '2025-01-01', NULL, 4, '17:00', '18:00', 20, 1, 1),
    -- Dermatología: jueves 15:00-16:00 (days_mask = 8 para jueves)
    (@carlos_doctor_id, @dermato_id, 'WEEKLY', '2025-01-01', NULL, 8, '15:00', '16:00', 20, 1, 1);
    PRINT '✅ Horarios semanales insertados';
END

PRINT '🎉 Inicialización completada exitosamente';
PRINT '📝 Recuerda actualizar las contraseñas hasheadas en la tabla users';
PRINT '🔧 Configura el archivo .env con los datos de conexión correctos';

GO
