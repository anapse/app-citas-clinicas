-- Script para insertar datos iniciales según especificaciones del jefe
USE CitasMedicas;
GO

-- Insertar roles del sistema
INSERT INTO Roles (nombre, descripcion, permisos) VALUES
('Administrador', 'Acceso completo - puede hacer todo: eliminar, editar, crear', '{"all": true}'),
('Moderador', 'Secretaria/Operador - gestiona citas para especialidades restringidas, puede agregar/quitar horarios', '{"citas": ["create", "read", "update", "delete"], "horarios": ["create", "read", "update", "delete"], "doctores": ["read"], "pacientes": ["create", "read", "update"], "especialidades_restringidas": true}'),
('Doctor', 'Solo puede editar sus propias citas, crear/editar/borrar sus citas y horarios', '{"citas": ["create", "read", "update", "delete"], "horarios": ["create", "read", "update", "delete"], "pacientes": ["read"], "solo_propias": true}'),
('Paciente', 'Público - puede crear máximo 1 cita por día, puede eliminar sus citas', '{"citas": ["create", "read", "delete"], "pacientes": ["read", "update"], "max_citas_dia": 1, "publico": true}');

-- Estados de citas del workflow
INSERT INTO Estados_Citas (nombre, descripcion, color) VALUES
('Programada', 'Cita programada por paciente', '#007bff'),
('Confirmada', 'Cita confirmada por operador/doctor', '#28a745'),
('En Proceso', 'Paciente siendo atendido', '#ffc107'),
('Completada', 'Cita finalizada exitosamente', '#28a745'),
('Cancelada', 'Cita cancelada', '#dc3545'),
('No Asistió', 'Paciente no se presentó', '#6c757d'),
('Solicitud Pendiente', 'Solicitud esperando coordinación', '#17a2b8');

-- Especialidades según especificaciones del jefe
INSERT INTO Especialidades (nombre, descripcion, duracion_cita_minutos, modalidad_reserva, requiere_moderador, horario_por_defecto, activo, puede_paciente_reservar) VALUES

-- 1. ENDOCRINOLOGÍA PEDIÁTRICA (SLOT - Paciente puede reservar)
('Endocrinología Pediátrica', 
 'Endocrinología pediátrica - Miércoles 5:00 PM a 6:00 PM (llegar 10 minutos antes de la cita agendada)', 
 20, 'SLOT', 0, 
 '{"dias": [3], "horarios": [{"inicio": "17:00", "fin": "18:00"}]}', 
 1, 1),

-- 2. PEDIATRÍA (WALKIN - Sin reservas, solo orden de llegada)
('Pediatría', 
 'Pediatría es la única especialidad que la atención es por orden de llegada, no se saca cita previa. Horario de clínica: Lunes a sábado 8:00am-1:00pm y 3:00pm-7:00pm, Domingo 9:00am-1:00pm', 
 0, 'WALKIN', 0, 
 '{"lun_sab": {"manana": "08:00-13:00", "tarde": "15:00-19:00"}, "domingo": {"manana": "09:00-13:00"}}', 
 1, 0),

-- 3. DERMATOLOGÍA (SLOT - Paciente puede reservar)
('Dermatología', 
 'Dermatología - Jueves 3:00 PM (llegar 10 minutos antes de la cita agendada)', 
 20, 'SLOT', 0, 
 '{"dias": [4], "horarios": [{"inicio": "15:00", "fin": "16:00"}]}', 
 1, 1),

-- 4. NEUMOLOGÍA E INMUNOLOGÍA PEDIÁTRICA (REQUEST - Solo moderador)
('Neumología e Inmunología Pediátrica', 
 'Médicos de Lima - Fechas específicas 1 vez o 2 veces al mes. Cuando confirmen fecha se activa reserva. Solo operador coordina.', 
 30, 'REQUEST', 1, 
 '{}', 
 1, 0),

-- 5. OTRAS ESPECIALIDADES QUE REQUIEREN COORDINACIÓN (REQUEST)
('Cardiología', 
 'Requiere coordinación previa - Solo enviar datos para contacto posterior', 
 30, 'REQUEST', 1, 
 '{}', 
 1, 0),

('Neurología', 
 'Requiere coordinación previa - Solo enviar datos para contacto posterior', 
 45, 'REQUEST', 1, 
 '{}', 
 1, 0),

('Oftalmología', 
 'Requiere coordinación previa - Solo enviar datos para contacto posterior', 
 30, 'REQUEST', 1, 
 '{}', 
 1, 0),

('Psicología', 
 'Requiere coordinación previa - Solo enviar datos para contacto posterior', 
 60, 'REQUEST', 1, 
 '{}', 
 1, 0);

-- Insertar usuario administrador inicial
INSERT INTO Usuarios (nombre, apellido, email, telefono, password_hash, rol_id) VALUES
('Admin', 'Sistema', 'admin@clinica.com', '1234567890', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1); -- password: password

-- Insertar moderador/operador (secretaria)
INSERT INTO Usuarios (nombre, apellido, email, telefono, password_hash, rol_id) VALUES
('Ana', 'Operadora', 'operador@clinica.com', '1234567895', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2); -- password: password

-- Insertar doctores según especialidades del jefe
INSERT INTO Usuarios (nombre, apellido, email, telefono, password_hash, rol_id) VALUES
('Dr. Luis', 'Endocrinólogo Pediátrico', 'dr.endocrino@clinica.com', '987654321', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3), -- password: password
('Dr. Pediatra', 'General', 'dr.pediatra@clinica.com', '987654322', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3), -- password: password
('Dra. Carmen', 'Dermatóloga', 'dra.dermatologa@clinica.com', '987654323', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3), -- password: password
('Dr. Alberto', 'Neumólogo Inmunólogo', 'dr.neumologo@clinica.com', '987654324', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3); -- password: password

-- Insertar doctores (relacionar usuarios con especialidades)
INSERT INTO Doctores (usuario_id, especialidad_id, numero_licencia, biografia) VALUES
(3, 1, 'LIC001', 'Especialista en Endocrinología Pediátrica - Miércoles 5:00-6:00 PM'),
(4, 2, 'LIC002', 'Pediatra General - Atención por orden de llegada'),
(5, 3, 'LIC003', 'Dermatóloga - Jueves 3:00 PM'),
(6, 4, 'LIC004', 'Neumólogo e Inmunólogo Pediátrico - Médico de Lima');

-- Insertar horarios por defecto según especificaciones del jefe
-- Dr. Luis - Endocrinología Pediátrica (Miércoles 5:00-6:00 PM)
INSERT INTO Horarios_Doctores (doctor_id, especialidad_id, dia_semana, hora_inicio, hora_fin, es_horario_defecto) VALUES
(1, 1, 3, '17:00', '18:00', 1); -- Miércoles 5:00-6:00 PM

-- Dr. Pediatra - Pediatría (Horario de clínica completo)
INSERT INTO Horarios_Doctores (doctor_id, especialidad_id, dia_semana, hora_inicio, hora_fin, es_horario_defecto) VALUES
(2, 2, 1, '08:00', '13:00', 1), (2, 2, 1, '15:00', '19:00', 1), -- Lunes
(2, 2, 2, '08:00', '13:00', 1), (2, 2, 2, '15:00', '19:00', 1), -- Martes
(2, 2, 3, '08:00', '13:00', 1), (2, 2, 3, '15:00', '19:00', 1), -- Miércoles
(2, 2, 4, '08:00', '13:00', 1), (2, 2, 4, '15:00', '19:00', 1), -- Jueves
(2, 2, 5, '08:00', '13:00', 1), (2, 2, 5, '15:00', '19:00', 1), -- Viernes
(2, 2, 6, '08:00', '13:00', 1), (2, 2, 6, '15:00', '19:00', 1), -- Sábado
(2, 2, 7, '09:00', '13:00', 1); -- Domingo

-- Dra. Carmen - Dermatología (Jueves 3:00-4:00 PM)
INSERT INTO Horarios_Doctores (doctor_id, especialidad_id, dia_semana, hora_inicio, hora_fin, es_horario_defecto) VALUES
(3, 3, 4, '15:00', '16:00', 1); -- Jueves 3:00-4:00 PM

-- Dr. Alberto - Neumología (Sin horarios fijos - fechas específicas)
-- Se agregarán horarios ONE_OFF cuando confirmen fechas desde Lima

-- Insertar algunos pacientes de ejemplo con datos según formato del jefe
INSERT INTO Pacientes (nombre, apellido, email, telefono, fecha_nacimiento, documento_identidad) VALUES
('Ana María', 'Pérez González', 'anamaria.perez@email.com', '987654321', '2015-05-15', '12345678'),
('Carlos Eduardo', 'López Martínez', 'carlos.lopez@email.com', '987654322', '2018-08-22', '87654321'),
('Sofía Isabel', 'Ramírez Torres', 'sofia.ramirez@email.com', '987654323', '2020-12-10', '11223344'),
('Miguel Angel', 'García Vargas', 'miguel.garcia@email.com', '987654324', '2012-03-08', '44332211');

-- Insertar configuraciones del sistema según especificaciones
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

PRINT '✅ Datos iniciales insertados exitosamente según especificaciones del jefe';
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
