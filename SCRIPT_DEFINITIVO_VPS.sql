-- Script DEFINITIVO para actualizar datos según especificaciones del jefe
-- Ejecutar en SSMS del VPS - VERSIÓN SIN ERRORES
USE CitasMedicas;
GO

PRINT '🔄 Iniciando actualización de datos según especificaciones del jefe...';

-- PASO 1: LIMPIAR DATOS EXISTENTES DE FORMA SEGURA
PRINT '🔄 Limpiando datos existentes de forma segura...';

-- Deshabilitar todas las foreign key constraints temporalmente
EXEC sp_MSforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT all";

-- Limpiar datos en orden correcto (sin TRUNCATE para evitar problemas con FK)
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Historial_Citas')
    DELETE FROM Historial_Citas;
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Citas')
    DELETE FROM Citas;
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Horarios_Doctores')
    DELETE FROM Horarios_Doctores;
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Doctor_Especialidades')
    DELETE FROM Doctor_Especialidades;
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Doctores')
    DELETE FROM Doctores;
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Pacientes')
    DELETE FROM Pacientes;
DELETE FROM Usuarios WHERE id > 0;
DELETE FROM Especialidades WHERE id > 0;
DELETE FROM Estados_Citas WHERE id > 0;
DELETE FROM Roles WHERE id > 0;
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Configuraciones')
    DELETE FROM Configuraciones;

-- Resetear contadores de identidad
DBCC CHECKIDENT ('Usuarios', RESEED, 0);
DBCC CHECKIDENT ('Roles', RESEED, 0);
DBCC CHECKIDENT ('Especialidades', RESEED, 0);
DBCC CHECKIDENT ('Estados_Citas', RESEED, 0);
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Doctores')
    DBCC CHECKIDENT ('Doctores', RESEED, 0);
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Pacientes')
    DBCC CHECKIDENT ('Pacientes', RESEED, 0);
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Horarios_Doctores')
    DBCC CHECKIDENT ('Horarios_Doctores', RESEED, 0);
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Citas')
    DBCC CHECKIDENT ('Citas', RESEED, 0);
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Doctor_Especialidades')
    DBCC CHECKIDENT ('Doctor_Especialidades', RESEED, 0);

PRINT '✅ Datos limpiados exitosamente';

-- PASO 2: ACTUALIZAR ESTRUCTURA DE BASE DE DATOS
PRINT '🔄 Actualizando estructura de tablas...';

-- Crear tabla Doctor_Especialidades si no existe
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Doctor_Especialidades')
BEGIN
    CREATE TABLE Doctor_Especialidades (
        id INT IDENTITY(1,1) PRIMARY KEY,
        doctor_id INT NOT NULL,
        especialidad_id INT NOT NULL,
        activo BIT DEFAULT 1,
        fecha_creacion DATETIME2 DEFAULT GETDATE(),
        UNIQUE(doctor_id, especialidad_id)
    );
    PRINT '✅ Tabla Doctor_Especialidades creada';
END

-- Agregar columnas nuevas a Especialidades si no existen
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Especialidades' AND COLUMN_NAME = 'modalidad_reserva')
BEGIN
    ALTER TABLE Especialidades ADD modalidad_reserva NVARCHAR(20) DEFAULT 'SLOT';
    PRINT '✅ Columna modalidad_reserva agregada';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Especialidades' AND COLUMN_NAME = 'puede_paciente_reservar')
BEGIN
    ALTER TABLE Especialidades ADD puede_paciente_reservar BIT DEFAULT 1;
    PRINT '✅ Columna puede_paciente_reservar agregada';
END

-- Agregar especialidad_id a Horarios_Doctores si no existe
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Horarios_Doctores' AND COLUMN_NAME = 'especialidad_id')
BEGIN
    ALTER TABLE Horarios_Doctores ADD especialidad_id INT NULL;
    PRINT '✅ Columna especialidad_id agregada a Horarios_Doctores';
END

PRINT '✅ Estructura de tablas actualizada';

-- PASO 3: INSERTAR DATOS SEGÚN ESPECIFICACIONES DEL JEFE
PRINT '🔄 Insertando datos según especificaciones del jefe...';

-- 1. ROLES DEL SISTEMA
INSERT INTO Roles (nombre, descripcion, permisos) VALUES
('Administrador', 'Acceso completo - puede hacer todo: eliminar, editar, crear', '{"all": true}'),
('Moderador', 'Secretaria/Operador - gestiona citas para especialidades restringidas, puede agregar/quitar horarios', '{"citas": ["create", "read", "update", "delete"], "horarios": ["create", "read", "update", "delete"], "doctores": ["read"], "pacientes": ["create", "read", "update"], "especialidades_restringidas": true}'),
('Doctor', 'Solo puede editar sus propias citas, crear/editar/borrar sus citas y horarios', '{"citas": ["create", "read", "update", "delete"], "horarios": ["create", "read", "update", "delete"], "pacientes": ["read"], "solo_propias": true}'),
('Paciente', 'Público - puede crear máximo 1 cita por día, puede eliminar sus citas', '{"citas": ["create", "read", "delete"], "pacientes": ["read", "update"], "max_citas_dia": 1, "publico": true}');

PRINT '✅ Roles insertados';

-- 2. ESTADOS DE CITAS
INSERT INTO Estados_Citas (nombre, descripcion, color) VALUES
('Programada', 'Cita programada por paciente', '#007bff'),
('Confirmada', 'Cita confirmada por operador/doctor', '#28a745'),
('En Proceso', 'Paciente siendo atendido', '#ffc107'),
('Completada', 'Cita finalizada exitosamente', '#28a745'),
('Cancelada', 'Cita cancelada', '#dc3545'),
('No Asistió', 'Paciente no se presentó', '#6c757d'),
('Solicitud Pendiente', 'Solicitud esperando coordinación', '#17a2b8');

PRINT '✅ Estados de citas insertados';

-- 3. ESPECIALIDADES SEGÚN EL JEFE (PRIMERO SIN LAS COLUMNAS NUEVAS)
INSERT INTO Especialidades (nombre, descripcion, duracion_cita_minutos, requiere_moderador, horario_por_defecto, activo) VALUES
('Endocrinología Pediátrica', 
 'Endocrinología pediátrica - Miércoles 5:00 PM a 6:00 PM (llegar 10 minutos antes de la cita agendada)', 
 20, 0, 
 '{"dias": [3], "horarios": [{"inicio": "17:00", "fin": "18:00"}]}', 
 1),
('Pediatría', 
 'Pediatría es la única especialidad que la atención es por orden de llegada, no se saca cita previa. Horario de clínica: Lunes a sábado 8:00am-1:00pm y 3:00pm-7:00pm, Domingo 9:00am-1:00pm', 
 0, 0, 
 '{"lun_sab": {"manana": "08:00-13:00", "tarde": "15:00-19:00"}, "domingo": {"manana": "09:00-13:00"}}', 
 1),
('Dermatología', 
 'Dermatología - Jueves 3:00 PM (llegar 10 minutos antes de la cita agendada)', 
 20, 0, 
 '{"dias": [4], "horarios": [{"inicio": "15:00", "fin": "16:00"}]}', 
 1),
('Neumología e Inmunología Pediátrica', 
 'Médicos de Lima - Fechas específicas 1 vez o 2 veces al mes. Cuando confirmen fecha se activa reserva. Solo operador coordina.', 
 30, 1, 
 '{}', 
 1),
('Cardiología', 
 'Requiere coordinación previa - Solo enviar datos para contacto posterior', 
 30, 1, 
 '{}', 
 1),
('Neurología', 
 'Requiere coordinación previa - Solo enviar datos para contacto posterior', 
 45, 1, 
 '{}', 
 1),
('Oftalmología', 
 'Requiere coordinación previa - Solo enviar datos para contacto posterior', 
 30, 1, 
 '{}', 
 1),
('Psicología', 
 'Requiere coordinación previa - Solo enviar datos para contacto posterior', 
 60, 1, 
 '{}', 
 1);

-- ACTUALIZAR LAS COLUMNAS NUEVAS DESPUÉS DE INSERTAR
UPDATE Especialidades SET modalidad_reserva = 'SLOT', puede_paciente_reservar = 1 WHERE nombre = 'Endocrinología Pediátrica';
UPDATE Especialidades SET modalidad_reserva = 'WALKIN', puede_paciente_reservar = 0 WHERE nombre = 'Pediatría';
UPDATE Especialidades SET modalidad_reserva = 'SLOT', puede_paciente_reservar = 1 WHERE nombre = 'Dermatología';
UPDATE Especialidades SET modalidad_reserva = 'REQUEST', puede_paciente_reservar = 0 WHERE nombre IN ('Neumología e Inmunología Pediátrica', 'Cardiología', 'Neurología', 'Oftalmología', 'Psicología');

PRINT '✅ Especialidades insertadas y configuradas según especificaciones del jefe';

-- 4. USUARIOS DEL SISTEMA
INSERT INTO Usuarios (nombre, apellido, email, telefono, password_hash, rol_id) VALUES
('Admin', 'Sistema', 'admin@clinica.com', '1234567890', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
('Ana', 'Operadora', 'operador@clinica.com', '1234567895', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2),
('Dr. Luis', 'Endocrinólogo Pediátrico', 'dr.endocrino@clinica.com', '987654321', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3),
('Dr. Pediatra', 'General', 'dr.pediatra@clinica.com', '987654322', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3),
('Dra. Carmen', 'Dermatóloga', 'dra.dermatologa@clinica.com', '987654323', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3),
('Dr. Alberto', 'Neumólogo Inmunólogo', 'dr.neumologo@clinica.com', '987654324', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3);

PRINT '✅ Usuarios insertados';

-- 5. DOCTORES (Relacionar usuarios con especialidades)
INSERT INTO Doctores (usuario_id, especialidad_id, numero_licencia, biografia) VALUES
(3, 1, 'LIC001', 'Especialista en Endocrinología Pediátrica - Miércoles 5:00-6:00 PM'),
(4, 2, 'LIC002', 'Pediatra General - Atención por orden de llegada'),
(5, 3, 'LIC003', 'Dermatóloga - Jueves 3:00 PM'),
(6, 4, 'LIC004', 'Neumólogo e Inmunólogo Pediátrico - Médico de Lima');

PRINT '✅ Doctores insertados';

-- 6. HORARIOS POR DEFECTO SEGÚN ESPECIFICACIONES DEL JEFE
INSERT INTO Horarios_Doctores (doctor_id, especialidad_id, dia_semana, hora_inicio, hora_fin, es_horario_defecto) VALUES
-- Dr. Luis - Endocrinología Pediátrica (Miércoles 5:00-6:00 PM)
(1, 1, 3, '17:00', '18:00', 1),
-- Dr. Pediatra - Pediatría (Horario de clínica completo)
(2, 2, 1, '08:00', '13:00', 1), (2, 2, 1, '15:00', '19:00', 1), -- Lunes
(2, 2, 2, '08:00', '13:00', 1), (2, 2, 2, '15:00', '19:00', 1), -- Martes
(2, 2, 3, '08:00', '13:00', 1), (2, 2, 3, '15:00', '19:00', 1), -- Miércoles
(2, 2, 4, '08:00', '13:00', 1), (2, 2, 4, '15:00', '19:00', 1), -- Jueves
(2, 2, 5, '08:00', '13:00', 1), (2, 2, 5, '15:00', '19:00', 1), -- Viernes
(2, 2, 6, '08:00', '13:00', 1), (2, 2, 6, '15:00', '19:00', 1), -- Sábado
(2, 2, 7, '09:00', '13:00', 1), -- Domingo
-- Dra. Carmen - Dermatología (Jueves 3:00-4:00 PM)
(3, 3, 4, '15:00', '16:00', 1);

PRINT '✅ Horarios por defecto insertados';

-- 7. PACIENTES DE EJEMPLO
INSERT INTO Pacientes (nombre, apellido, email, telefono, fecha_nacimiento, documento_identidad) VALUES
('Ana María', 'Pérez González', 'anamaria.perez@email.com', '987654321', '2015-05-15', '12345678'),
('Carlos Eduardo', 'López Martínez', 'carlos.lopez@email.com', '987654322', '2018-08-22', '87654321'),
('Sofía Isabel', 'Ramírez Torres', 'sofia.ramirez@email.com', '987654323', '2020-12-10', '11223344'),
('Miguel Angel', 'García Vargas', 'miguel.garcia@email.com', '987654324', '2012-03-08', '44332211');

PRINT '✅ Pacientes de ejemplo insertados';

-- 8. CONFIGURACIONES DEL SISTEMA
INSERT INTO Configuraciones (clave, valor, descripcion, tipo_dato) VALUES
('horario_clinica_lun_sab_manana_inicio', '08:00', 'Lunes a sábado - Hora inicio mañana', 'string'),
('horario_clinica_lun_sab_manana_fin', '13:00', 'Lunes a sábado - Hora fin mañana', 'string'),
('horario_clinica_lun_sab_tarde_inicio', '15:00', 'Lunes a sábado - Hora inicio tarde', 'string'),
('horario_clinica_lun_sab_tarde_fin', '19:00', 'Lunes a sábado - Hora fin tarde', 'string'),
('horario_clinica_domingo_inicio', '09:00', 'Domingo - Hora inicio', 'string'),
('horario_clinica_domingo_fin', '13:00', 'Domingo - Hora fin', 'string'),
('endocrinologia_dia', '3', 'Endocrinología - Día de atención (3=Miércoles)', 'number'),
('endocrinologia_hora_inicio', '17:00', 'Endocrinología - Hora inicio', 'string'),
('endocrinologia_hora_fin', '18:00', 'Endocrinología - Hora fin', 'string'),
('dermatologia_dia', '4', 'Dermatología - Día de atención (4=Jueves)', 'number'),
('dermatologia_hora_inicio', '15:00', 'Dermatología - Hora inicio', 'string'),
('dermatologia_hora_fin', '16:00', 'Dermatología - Hora fin', 'string'),
('max_citas_paciente_dia', '1', 'Máximo citas por paciente por día', 'number'),
('tiempo_llegada_anticipada', '10', 'Minutos de llegada anticipada recomendada', 'number'),
('notificaciones_email', 'true', 'Enviar notificaciones por email', 'boolean'),
('sistema_publico', 'true', 'Sistema abierto al público para crear citas', 'boolean');

PRINT '✅ Configuraciones insertadas';

-- PASO 4: REHABILITAR FOREIGN KEY CONSTRAINTS Y AGREGAR LAS QUE FALTAN
PRINT '🔄 Configurando foreign key constraints...';

-- Rehabilitar todas las foreign key constraints
EXEC sp_MSforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all";

-- Agregar foreign key constraints faltantes si no existen
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS 
    WHERE CONSTRAINT_NAME = 'FK_Doctor_Especialidades_Doctores'
)
BEGIN
    ALTER TABLE Doctor_Especialidades 
    ADD CONSTRAINT FK_Doctor_Especialidades_Doctores 
    FOREIGN KEY (doctor_id) REFERENCES Doctores(id);
    PRINT '✅ FK Doctor_Especialidades -> Doctores agregada';
END

IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS 
    WHERE CONSTRAINT_NAME = 'FK_Doctor_Especialidades_Especialidades'
)
BEGIN
    ALTER TABLE Doctor_Especialidades 
    ADD CONSTRAINT FK_Doctor_Especialidades_Especialidades 
    FOREIGN KEY (especialidad_id) REFERENCES Especialidades(id);
    PRINT '✅ FK Doctor_Especialidades -> Especialidades agregada';
END

IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS 
    WHERE CONSTRAINT_NAME = 'FK_Horarios_Doctores_Especialidades'
)
BEGIN
    ALTER TABLE Horarios_Doctores 
    ADD CONSTRAINT FK_Horarios_Doctores_Especialidades 
    FOREIGN KEY (especialidad_id) REFERENCES Especialidades(id);
    PRINT '✅ FK Horarios_Doctores -> Especialidades agregada';
END

PRINT '✅ Foreign key constraints configuradas';

-- PASO 5: VERIFICACIÓN FINAL
PRINT '🔄 Verificando inserción de datos...';

DECLARE @RolesCount INT, @EstadosCount INT, @EspecialidadesCount INT, @UsuariosCount INT;
DECLARE @DoctoresCount INT, @HorariosCount INT, @PacientesCount INT, @ConfiguracionesCount INT;

SELECT @RolesCount = COUNT(*) FROM Roles;
SELECT @EstadosCount = COUNT(*) FROM Estados_Citas;
SELECT @EspecialidadesCount = COUNT(*) FROM Especialidades;
SELECT @UsuariosCount = COUNT(*) FROM Usuarios;
SELECT @DoctoresCount = COUNT(*) FROM Doctores;
SELECT @HorariosCount = COUNT(*) FROM Horarios_Doctores;
SELECT @PacientesCount = COUNT(*) FROM Pacientes;
SELECT @ConfiguracionesCount = COUNT(*) FROM Configuraciones;

PRINT '';
PRINT '📊 RESUMEN DE DATOS INSERTADOS:';
PRINT 'Roles: ' + CAST(@RolesCount AS VARCHAR(10));
PRINT 'Estados de citas: ' + CAST(@EstadosCount AS VARCHAR(10));
PRINT 'Especialidades: ' + CAST(@EspecialidadesCount AS VARCHAR(10));
PRINT 'Usuarios: ' + CAST(@UsuariosCount AS VARCHAR(10));
PRINT 'Doctores: ' + CAST(@DoctoresCount AS VARCHAR(10));
PRINT 'Horarios: ' + CAST(@HorariosCount AS VARCHAR(10));
PRINT 'Pacientes: ' + CAST(@PacientesCount AS VARCHAR(10));
PRINT 'Configuraciones: ' + CAST(@ConfiguracionesCount AS VARCHAR(10));

PRINT '';
PRINT '✅ DATOS ACTUALIZADOS EXITOSAMENTE SEGÚN ESPECIFICACIONES DEL JEFE';
PRINT '';
PRINT '🔐 CREDENCIALES DE ACCESO:';
PRINT 'Admin: admin@clinica.com / password';
PRINT 'Operador: operador@clinica.com / password';
PRINT 'Dr. Endocrino: dr.endocrino@clinica.com / password';
PRINT 'Dr. Pediatra: dr.pediatra@clinica.com / password';
PRINT 'Dra. Dermatóloga: dra.dermatologa@clinica.com / password';
PRINT 'Dr. Neumólogo: dr.neumologo@clinica.com / password';
PRINT '';
PRINT '🏥 ESPECIALIDADES CONFIGURADAS:';
PRINT '• Endocrinología Pediátrica: Miércoles 5:00-6:00 PM (SLOT - Paciente puede reservar)';
PRINT '• Pediatría: Orden de llegada (WALKIN - Sin reservas)';
PRINT '• Dermatología: Jueves 3:00 PM (SLOT - Paciente puede reservar)';
PRINT '• Neumología e Inmunología: Fechas específicas (REQUEST - Solo operador)';
PRINT '• Otras especialidades: Coordinación previa (REQUEST - Solo operador)';
PRINT '';
PRINT '📋 DATOS PACIENTE REQUERIDOS:';
PRINT '1️⃣ Nombres y Apellidos del Paciente';
PRINT '2️⃣ Número de DNI del Paciente o Apoderado';
PRINT '3️⃣ Fecha de Nacimiento del Paciente';  
PRINT '4️⃣ Número de Contacto';
PRINT '';
PRINT '⚠️  RECORDATORIO: Llegar 10 minutos antes de la cita agendada';
PRINT '';
PRINT '🎉 SISTEMA LISTO PARA USAR EN PRODUCCIÓN';
GO
