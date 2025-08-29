const express = require('express');
const { body, validationResult } = require('express-validator');
const { getPool, sql } = require('../config/database');
const auth = require('../middleware/auth');
const { authorize, ownDoctorData } = require('../middleware/authorize');

const router = express.Router();

// Obtener horarios de un doctor
router.get('/doctor/:doctorId', [auth, ownDoctorData], async (req, res) => {
    try {
        const { doctorId } = req.params;
        const pool = getPool();

        const result = await pool.request()
            .input('doctorId', sql.Int, doctorId)
            .query(`
        SELECT hd.*, 
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

        res.json(result.recordset);
    } catch (error) {
        console.error('Error obteniendo horarios:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Crear nuevo horario para doctor
router.post('/doctor/:doctorId', [
    auth,
    ownDoctorData,
    body('dia_semana').isInt({ min: 0, max: 6 }),
    body('hora_inicio').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('hora_fin').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { doctorId } = req.params;
        const { dia_semana, hora_inicio, hora_fin } = req.body;

        // Validar que hora_inicio < hora_fin
        if (hora_inicio >= hora_fin) {
            return res.status(400).json({
                message: 'La hora de inicio debe ser menor que la hora de fin'
            });
        }

        const pool = getPool();

        // Verificar solapamiento con horarios existentes
        const conflictoResult = await pool.request()
            .input('doctorId', sql.Int, doctorId)
            .input('diaSemana', sql.Int, dia_semana)
            .input('horaInicio', sql.Time, hora_inicio)
            .input('horaFin', sql.Time, hora_fin)
            .query(`
        SELECT COUNT(*) as count
        FROM Horarios_Doctores
        WHERE doctor_id = @doctorId AND dia_semana = @diaSemana AND activo = 1
        AND (
          (@horaInicio >= hora_inicio AND @horaInicio < hora_fin) OR
          (@horaFin > hora_inicio AND @horaFin <= hora_fin) OR
          (@horaInicio <= hora_inicio AND @horaFin >= hora_fin)
        )
      `);

        if (conflictoResult.recordset[0].count > 0) {
            return res.status(400).json({
                message: 'El horario se solapa con un horario existente'
            });
        }

        // Crear horario
        const result = await pool.request()
            .input('doctorId', sql.Int, doctorId)
            .input('diaSemana', sql.Int, dia_semana)
            .input('horaInicio', sql.Time, hora_inicio)
            .input('horaFin', sql.Time, hora_fin)
            .query(`
        INSERT INTO Horarios_Doctores (doctor_id, dia_semana, hora_inicio, hora_fin, es_horario_defecto)
        OUTPUT INSERTED.id
        VALUES (@doctorId, @diaSemana, @horaInicio, @horaFin, 0)
      `);

        res.status(201).json({
            message: 'Horario creado exitosamente',
            horarioId: result.recordset[0].id
        });
    } catch (error) {
        console.error('Error creando horario:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Actualizar horario
router.put('/:id', [
    auth,
    body('hora_inicio').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('hora_fin').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('activo').optional().isBoolean()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { hora_inicio, hora_fin, activo } = req.body;

        const pool = getPool();

        // Obtener horario actual y verificar permisos
        const horarioActual = await pool.request()
            .input('horarioId', sql.Int, id)
            .query(`
        SELECT hd.*, d.usuario_id
        FROM Horarios_Doctores hd
        INNER JOIN Doctores d ON hd.doctor_id = d.id
        WHERE hd.id = @horarioId
      `);

        if (horarioActual.recordset.length === 0) {
            return res.status(404).json({ message: 'Horario no encontrado' });
        }

        const horario = horarioActual.recordset[0];

        // Verificar permisos: Admin o el propio doctor
        if (req.user.rol !== 'Administrador' && req.user.id !== horario.usuario_id) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        // Validar horas si se proporcionan ambas
        if (hora_inicio && hora_fin && hora_inicio >= hora_fin) {
            return res.status(400).json({
                message: 'La hora de inicio debe ser menor que la hora de fin'
            });
        }

        // Actualizar horario
        const updates = ['fecha_actualizacion = GETDATE()'];
        const request = pool.request().input('horarioId', sql.Int, id);

        if (hora_inicio) {
            updates.push('hora_inicio = @horaInicio');
            request.input('horaInicio', sql.Time, hora_inicio);
        }

        if (hora_fin) {
            updates.push('hora_fin = @horaFin');
            request.input('horaFin', sql.Time, hora_fin);
        }

        if (activo !== undefined) {
            updates.push('activo = @activo');
            request.input('activo', sql.Bit, activo);
        }

        await request.query(`
      UPDATE Horarios_Doctores 
      SET ${updates.join(', ')}
      WHERE id = @horarioId
    `);

        res.json({ message: 'Horario actualizado exitosamente' });
    } catch (error) {
        console.error('Error actualizando horario:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Eliminar horario
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        // Obtener horario y verificar permisos
        const horarioResult = await pool.request()
            .input('horarioId', sql.Int, id)
            .query(`
        SELECT hd.*, d.usuario_id
        FROM Horarios_Doctores hd
        INNER JOIN Doctores d ON hd.doctor_id = d.id
        WHERE hd.id = @horarioId
      `);

        if (horarioResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Horario no encontrado' });
        }

        const horario = horarioResult.recordset[0];

        // Verificar permisos: Admin o el propio doctor
        if (req.user.rol !== 'Administrador' && req.user.id !== horario.usuario_id) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        // No permitir eliminar horarios por defecto de la especialidad
        if (horario.es_horario_defecto) {
            return res.status(400).json({
                message: 'No se pueden eliminar horarios por defecto de la especialidad'
            });
        }

        // Verificar si hay citas futuras en este horario
        const citasFuturas = await pool.request()
            .input('doctorId', sql.Int, horario.doctor_id)
            .input('diaSemana', sql.Int, horario.dia_semana)
            .query(`
        SELECT COUNT(*) as count
        FROM Citas c
        WHERE c.doctor_id = @doctorId 
        AND DATEPART(weekday, c.fecha_hora) - 1 = @diaSemana
        AND c.fecha_hora > GETDATE()
        AND CAST(c.fecha_hora AS TIME) >= '${horario.hora_inicio}'
        AND CAST(c.fecha_hora AS TIME) < '${horario.hora_fin}'
        AND c.estado_id NOT IN (SELECT id FROM Estados_Citas WHERE nombre IN ('Cancelada', 'No Asistió'))
      `);

        if (citasFuturas.recordset[0].count > 0) {
            return res.status(400).json({
                message: 'No se puede eliminar el horario porque tiene citas programadas'
            });
        }

        // Eliminar (soft delete)
        await pool.request()
            .input('horarioId', sql.Int, id)
            .query(`
        UPDATE Horarios_Doctores 
        SET activo = 0, fecha_actualizacion = GETDATE()
        WHERE id = @horarioId
      `);

        res.json({ message: 'Horario eliminado exitosamente' });
    } catch (error) {
        console.error('Error eliminando horario:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Generar horarios por defecto para un doctor basado en su especialidad
router.post('/doctor/:doctorId/generar-defaults', [auth, ownDoctorData], async (req, res) => {
    try {
        const { doctorId } = req.params;
        const pool = getPool();

        // Obtener especialidad del doctor
        const doctorResult = await pool.request()
            .input('doctorId', sql.Int, doctorId)
            .query(`
        SELECT d.especialidad_id, e.horario_por_defecto
        FROM Doctores d
        INNER JOIN Especialidades e ON d.especialidad_id = e.id
        WHERE d.id = @doctorId
      `);

        if (doctorResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Doctor no encontrado' });
        }

        const doctor = doctorResult.recordset[0];

        if (!doctor.horario_por_defecto) {
            return res.status(400).json({
                message: 'La especialidad no tiene horarios por defecto configurados'
            });
        }

        let horariosDefault;
        try {
            horariosDefault = JSON.parse(doctor.horario_por_defecto);
        } catch (error) {
            return res.status(400).json({
                message: 'Error en formato de horarios por defecto'
            });
        }

        // Eliminar horarios por defecto existentes
        await pool.request()
            .input('doctorId', sql.Int, doctorId)
            .query(`
        DELETE FROM Horarios_Doctores 
        WHERE doctor_id = @doctorId AND es_horario_defecto = 1
      `);

        // Crear nuevos horarios por defecto
        const { dias, turnos } = horariosDefault;

        for (const dia of dias) {
            for (const turno of turnos) {
                await pool.request()
                    .input('doctorId', sql.Int, doctorId)
                    .input('diaSemana', sql.Int, dia)
                    .input('horaInicio', sql.Time, turno.start)
                    .input('horaFin', sql.Time, turno.end)
                    .query(`
            INSERT INTO Horarios_Doctores (
              doctor_id, dia_semana, hora_inicio, hora_fin, es_horario_defecto
            )
            VALUES (@doctorId, @diaSemana, @horaInicio, @horaFin, 1)
          `);
            }
        }

        res.json({ message: 'Horarios por defecto generados exitosamente' });
    } catch (error) {
        console.error('Error generando horarios por defecto:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

module.exports = router;
