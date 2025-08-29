const express = require('express');
const { getPool, sql } = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Dashboard principal - Estadísticas generales
router.get('/stats', auth, async (req, res) => {
    try {
        const pool = getPool();
        const hoy = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

        // Estadísticas básicas
        const statsResult = await pool.request()
            .input('hoy', sql.Date, hoy)
            .input('inicioMes', sql.Date, inicioMes)
            .input('finMes', sql.Date, finMes)
            .query(`
        SELECT 
          -- Citas de hoy
          (SELECT COUNT(*) FROM Citas WHERE CAST(fecha_hora AS DATE) = @hoy) as citas_hoy,
          
          -- Citas del mes
          (SELECT COUNT(*) FROM Citas WHERE CAST(fecha_hora AS DATE) BETWEEN @inicioMes AND @finMes) as citas_mes,
          
          -- Total doctores activos
          (SELECT COUNT(*) FROM Doctores WHERE activo = 1) as total_doctores,
          
          -- Total especialidades activas
          (SELECT COUNT(*) FROM Especialidades WHERE activo = 1) as total_especialidades,
          
          -- Total pacientes
          (SELECT COUNT(*) FROM Pacientes WHERE activo = 1) as total_pacientes,
          
          -- Citas pendientes (programadas y confirmadas)
          (SELECT COUNT(*) FROM Citas c 
           INNER JOIN Estados_Citas e ON c.estado_id = e.id 
           WHERE e.nombre IN ('Programada', 'Confirmada') AND c.fecha_hora > GETDATE()) as citas_pendientes
      `);

        // Citas por estado (del mes actual)
        const citasPorEstadoResult = await pool.request()
            .input('inicioMes', sql.Date, inicioMes)
            .input('finMes', sql.Date, finMes)
            .query(`
        SELECT e.nombre as estado, e.color, COUNT(c.id) as cantidad
        FROM Estados_Citas e
        LEFT JOIN Citas c ON e.id = c.estado_id 
          AND CAST(c.fecha_hora AS DATE) BETWEEN @inicioMes AND @finMes
        GROUP BY e.id, e.nombre, e.color
        ORDER BY cantidad DESC
      `);

        // Citas por especialidad (del mes actual)
        const citasPorEspecialidadResult = await pool.request()
            .input('inicioMes', sql.Date, inicioMes)
            .input('finMes', sql.Date, finMes)
            .query(`
        SELECT e.nombre as especialidad, COUNT(c.id) as cantidad
        FROM Especialidades e
        LEFT JOIN Citas c ON e.id = c.especialidad_id 
          AND CAST(c.fecha_hora AS DATE) BETWEEN @inicioMes AND @finMes
        WHERE e.activo = 1
        GROUP BY e.id, e.nombre
        ORDER BY cantidad DESC
      `);

        // Doctores más ocupados (del mes actual)
        const doctoresMasOcupadosResult = await pool.request()
            .input('inicioMes', sql.Date, inicioMes)
            .input('finMes', sql.Date, finMes)
            .query(`
        SELECT TOP 5 
          u.nombre + ' ' + u.apellido as doctor_nombre,
          esp.nombre as especialidad,
          COUNT(c.id) as total_citas
        FROM Doctores d
        INNER JOIN Usuarios u ON d.usuario_id = u.id
        INNER JOIN Especialidades esp ON d.especialidad_id = esp.id
        LEFT JOIN Citas c ON d.id = c.doctor_id 
          AND CAST(c.fecha_hora AS DATE) BETWEEN @inicioMes AND @finMes
        WHERE d.activo = 1
        GROUP BY d.id, u.nombre, u.apellido, esp.nombre
        ORDER BY total_citas DESC
      `);

        // Ingresos del mes (si hay precios configurados)
        const ingresosResult = await pool.request()
            .input('inicioMes', sql.Date, inicioMes)
            .input('finMes', sql.Date, finMes)
            .query(`
        SELECT 
          ISNULL(SUM(precio), 0) as ingresos_mes,
          COUNT(CASE WHEN precio > 0 THEN 1 END) as citas_con_precio
        FROM Citas c
        INNER JOIN Estados_Citas e ON c.estado_id = e.id
        WHERE CAST(c.fecha_hora AS DATE) BETWEEN @inicioMes AND @finMes
        AND e.nombre = 'Completada'
      `);

        res.json({
            estadisticas_generales: statsResult.recordset[0],
            citas_por_estado: citasPorEstadoResult.recordset,
            citas_por_especialidad: citasPorEspecialidadResult.recordset,
            doctores_mas_ocupados: doctoresMasOcupadosResult.recordset,
            ingresos: ingresosResult.recordset[0],
            periodo: {
                inicio_mes: inicioMes.toISOString().split('T')[0],
                fin_mes: finMes.toISOString().split('T')[0]
            }
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas del dashboard:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Dashboard para doctores - Sus propias estadísticas
router.get('/doctor/:doctorId/stats', auth, async (req, res) => {
    try {
        const { doctorId } = req.params;

        // Verificar permisos: Admin o el propio doctor
        if (req.user.rol !== 'Administrador' && req.user.doctor_id !== parseInt(doctorId)) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        const pool = getPool();
        const hoy = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        const inicioDia = new Date(hoy);
        inicioDia.setHours(0, 0, 0, 0);
        const finDia = new Date(hoy);
        finDia.setHours(23, 59, 59, 999);

        // Estadísticas del doctor
        const statsResult = await pool.request()
            .input('doctorId', sql.Int, doctorId)
            .input('inicioDia', sql.DateTime2, inicioDia)
            .input('finDia', sql.DateTime2, finDia)
            .input('inicioMes', sql.Date, inicioMes)
            .input('finMes', sql.Date, finMes)
            .query(`
        SELECT 
          -- Citas de hoy
          (SELECT COUNT(*) FROM Citas 
           WHERE doctor_id = @doctorId 
           AND fecha_hora BETWEEN @inicioDia AND @finDia) as citas_hoy,
          
          -- Citas del mes
          (SELECT COUNT(*) FROM Citas 
           WHERE doctor_id = @doctorId 
           AND CAST(fecha_hora AS DATE) BETWEEN @inicioMes AND @finMes) as citas_mes,
          
          -- Próxima cita
          (SELECT TOP 1 fecha_hora FROM Citas 
           WHERE doctor_id = @doctorId 
           AND fecha_hora > GETDATE()
           AND estado_id IN (SELECT id FROM Estados_Citas WHERE nombre IN ('Programada', 'Confirmada'))
           ORDER BY fecha_hora ASC) as proxima_cita,
          
          -- Citas pendientes
          (SELECT COUNT(*) FROM Citas c 
           INNER JOIN Estados_Citas e ON c.estado_id = e.id 
           WHERE c.doctor_id = @doctorId 
           AND e.nombre IN ('Programada', 'Confirmada') 
           AND c.fecha_hora > GETDATE()) as citas_pendientes
      `);

        // Citas del doctor por estado (del mes)
        const citasPorEstadoResult = await pool.request()
            .input('doctorId', sql.Int, doctorId)
            .input('inicioMes', sql.Date, inicioMes)
            .input('finMes', sql.Date, finMes)
            .query(`
        SELECT e.nombre as estado, e.color, COUNT(c.id) as cantidad
        FROM Estados_Citas e
        LEFT JOIN Citas c ON e.id = c.estado_id 
          AND c.doctor_id = @doctorId
          AND CAST(c.fecha_hora AS DATE) BETWEEN @inicioMes AND @finMes
        GROUP BY e.id, e.nombre, e.color
        ORDER BY cantidad DESC
      `);

        // Citas de hoy del doctor
        const citasHoyResult = await pool.request()
            .input('doctorId', sql.Int, doctorId)
            .input('inicioDia', sql.DateTime2, inicioDia)
            .input('finDia', sql.DateTime2, finDia)
            .query(`
        SELECT c.id, c.fecha_hora, c.duracion_minutos, c.motivo_consulta,
               p.nombre as paciente_nombre, p.apellido as paciente_apellido,
               p.telefono as paciente_telefono,
               e.nombre as estado_nombre, e.color as estado_color
        FROM Citas c
        INNER JOIN Pacientes p ON c.paciente_id = p.id
        INNER JOIN Estados_Citas e ON c.estado_id = e.id
        WHERE c.doctor_id = @doctorId 
        AND c.fecha_hora BETWEEN @inicioDia AND @finDia
        ORDER BY c.fecha_hora
      `);

        // Horarios del doctor
        const horariosResult = await pool.request()
            .input('doctorId', sql.Int, doctorId)
            .query(`
        SELECT hd.dia_semana, hd.hora_inicio, hd.hora_fin, hd.es_horario_defecto,
               CASE hd.dia_semana 
                 WHEN 0 THEN 'Domingo'
                 WHEN 1 THEN 'Lunes'
                 WHEN 2 THEN 'Martes'
                 WHEN 3 THEN 'Miércoles'
                 WHEN 4 THEN 'Jueves'
                 WHEN 5 THEN 'Viernes'
                 WHEN 6 THEN 'Sábado'
               END as dia_nombre
        FROM Horarios_Doctores hd
        WHERE hd.doctor_id = @doctorId AND hd.activo = 1
        ORDER BY hd.dia_semana, hd.hora_inicio
      `);

        res.json({
            estadisticas: statsResult.recordset[0],
            citas_por_estado: citasPorEstadoResult.recordset,
            citas_hoy: citasHoyResult.recordset,
            horarios: horariosResult.recordset,
            periodo: {
                inicio_mes: inicioMes.toISOString().split('T')[0],
                fin_mes: finMes.toISOString().split('T')[0],
                hoy: hoy.toISOString().split('T')[0]
            }
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas del doctor:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Obtener citas recientes/próximas
router.get('/citas-recientes', auth, async (req, res) => {
    try {
        const { limite = 10 } = req.query;
        const pool = getPool();

        let whereCondition = '';
        const request = pool.request().input('limite', sql.Int, parseInt(limite));

        // Si es doctor, filtrar por sus citas
        if (req.user.rol === 'Doctor') {
            whereCondition = 'WHERE c.doctor_id = @doctorId';
            request.input('doctorId', sql.Int, req.user.doctor_id);
        }

        const result = await request.query(`
      SELECT TOP (@limite)
        c.id, c.fecha_hora, c.motivo_consulta,
        p.nombre as paciente_nombre, p.apellido as paciente_apellido,
        u.nombre as doctor_nombre, u.apellido as doctor_apellido,
        esp.nombre as especialidad_nombre,
        e.nombre as estado_nombre, e.color as estado_color
      FROM Citas c
      INNER JOIN Pacientes p ON c.paciente_id = p.id
      INNER JOIN Doctores d ON c.doctor_id = d.id
      INNER JOIN Usuarios u ON d.usuario_id = u.id
      INNER JOIN Especialidades esp ON c.especialidad_id = esp.id
      INNER JOIN Estados_Citas e ON c.estado_id = e.id
      ${whereCondition}
      ORDER BY c.fecha_hora DESC
    `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error obteniendo citas recientes:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Obtener alertas/notificaciones
router.get('/alertas', auth, async (req, res) => {
    try {
        const pool = getPool();
        const alertas = [];

        // Citas sin confirmar (próximas 24 horas)
        const mañana = new Date();
        mañana.setDate(mañana.getDate() + 1);

        const citasSinConfirmarResult = await pool.request()
            .input('mañana', sql.DateTime2, mañana)
            .query(`
        SELECT COUNT(*) as cantidad
        FROM Citas c
        INNER JOIN Estados_Citas e ON c.estado_id = e.id
        WHERE e.nombre = 'Programada'
        AND c.fecha_hora BETWEEN GETDATE() AND @mañana
      `);

        if (citasSinConfirmarResult.recordset[0].cantidad > 0) {
            alertas.push({
                tipo: 'warning',
                titulo: 'Citas sin confirmar',
                mensaje: `${citasSinConfirmarResult.recordset[0].cantidad} citas en las próximas 24 horas sin confirmar`,
                cantidad: citasSinConfirmarResult.recordset[0].cantidad
            });
        }

        // Doctores sin horarios configurados
        const doctoresSinHorariosResult = await pool.request()
            .query(`
        SELECT COUNT(*) as cantidad
        FROM Doctores d
        LEFT JOIN Horarios_Doctores h ON d.id = h.doctor_id AND h.activo = 1
        WHERE d.activo = 1 AND h.id IS NULL
      `);

        if (doctoresSinHorariosResult.recordset[0].cantidad > 0) {
            alertas.push({
                tipo: 'info',
                titulo: 'Doctores sin horarios',
                mensaje: `${doctoresSinHorariosResult.recordset[0].cantidad} doctores sin horarios configurados`,
                cantidad: doctoresSinHorariosResult.recordset[0].cantidad
            });
        }

        // Especialidades que requieren moderador sin citas programadas
        const especialidadesMoleradorResult = await pool.request()
            .query(`
        SELECT e.nombre, COUNT(c.id) as citas_pendientes
        FROM Especialidades e
        LEFT JOIN Citas c ON e.id = c.especialidad_id 
          AND c.fecha_hora > GETDATE()
          AND c.estado_id IN (SELECT id FROM Estados_Citas WHERE nombre IN ('Programada', 'Confirmada'))
        WHERE e.requiere_moderador = 1 AND e.activo = 1
        GROUP BY e.id, e.nombre
        HAVING COUNT(c.id) = 0
      `);

        especialidadesMoleradorResult.recordset.forEach(esp => {
            alertas.push({
                tipo: 'info',
                titulo: 'Especialidad sin citas',
                mensaje: `La especialidad "${esp.nombre}" requiere moderador y no tiene citas programadas`,
                especialidad: esp.nombre
            });
        });

        res.json(alertas);
    } catch (error) {
        console.error('Error obteniendo alertas:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

module.exports = router;
