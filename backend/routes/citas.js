const express = require('express');
const { body, validationResult } = require('express-validator');
const { getPool, sql } = require('../config/database');
const auth = require('../middleware/auth');
const { authorize, isModerator, ownDoctorData } = require('../middleware/authorize');

const router = express.Router();

// Obtener todas las citas (con filtros)
router.get('/', [auth, authorize('citas', 'read')], async (req, res) => {
    try {
        const {
            fecha_desde,
            fecha_hasta,
            doctor_id,
            paciente_id,
            estado_id,
            especialidad_id,
            page = 1,
            limit = 10
        } = req.query;

        const pool = getPool();
        let whereConditions = ['1=1'];
        const request = pool.request();

        // Filtros
        if (fecha_desde) {
            whereConditions.push('c.fecha_hora >= @fechaDesde');
            request.input('fechaDesde', sql.DateTime2, new Date(fecha_desde));
        }

        if (fecha_hasta) {
            whereConditions.push('c.fecha_hora <= @fechaHasta');
            request.input('fechaHasta', sql.DateTime2, new Date(fecha_hasta));
        }

        if (doctor_id) {
            whereConditions.push('c.doctor_id = @doctorId');
            request.input('doctorId', sql.Int, doctor_id);
        }

        if (paciente_id) {
            whereConditions.push('c.paciente_id = @pacienteId');
            request.input('pacienteId', sql.Int, paciente_id);
        }

        if (estado_id) {
            whereConditions.push('c.estado_id = @estadoId');
            request.input('estadoId', sql.Int, estado_id);
        }

        if (especialidad_id) {
            whereConditions.push('c.especialidad_id = @especialidadId');
            request.input('especialidadId', sql.Int, especialidad_id);
        }

        // Si es doctor, solo ver sus propias citas
        if (req.user.rol === 'Doctor') {
            whereConditions.push('c.doctor_id = @userDoctorId');
            request.input('userDoctorId', sql.Int, req.user.doctor_id);
        }

        const offset = (page - 1) * limit;
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, parseInt(limit));

        const query = `
      SELECT c.id, c.fecha_hora, c.duracion_minutos, c.motivo_consulta, c.observaciones, c.precio,
             p.nombre as paciente_nombre, p.apellido as paciente_apellido, p.telefono as paciente_telefono,
             p.email as paciente_email,
             u.nombre as doctor_nombre, u.apellido as doctor_apellido,
             e.nombre as especialidad_nombre,
             est.nombre as estado_nombre, est.color as estado_color,
             c.fecha_creacion
      FROM Citas c
      INNER JOIN Pacientes p ON c.paciente_id = p.id
      INNER JOIN Doctores d ON c.doctor_id = d.id
      INNER JOIN Usuarios u ON d.usuario_id = u.id
      INNER JOIN Especialidades e ON c.especialidad_id = e.id
      INNER JOIN Estados_Citas est ON c.estado_id = est.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY c.fecha_hora DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

        const result = await request.query(query);

        // Contar total para paginación
        const countQuery = `
      SELECT COUNT(*) as total
      FROM Citas c
      WHERE ${whereConditions.join(' AND ')}
    `;

        const countResult = await pool.request().query(countQuery.replace(/@\w+/g, ''));
        const total = countResult.recordset[0].total;

        res.json({
            citas: result.recordset,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error obteniendo citas:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Obtener cita por ID
router.get('/:id', [auth, authorize('citas', 'read')], async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        const request = pool.request().input('citaId', sql.Int, id);

        // Si es doctor, verificar que sea su cita
        let doctorCondition = '';
        if (req.user.rol === 'Doctor') {
            doctorCondition = 'AND c.doctor_id = @userDoctorId';
            request.input('userDoctorId', sql.Int, req.user.doctor_id);
        }

        const result = await request.query(`
      SELECT c.*, 
             p.nombre as paciente_nombre, p.apellido as paciente_apellido, 
             p.telefono as paciente_telefono, p.email as paciente_email,
             p.fecha_nacimiento, p.documento_identidad,
             u.nombre as doctor_nombre, u.apellido as doctor_apellido,
             e.nombre as especialidad_nombre,
             est.nombre as estado_nombre, est.color as estado_color
      FROM Citas c
      INNER JOIN Pacientes p ON c.paciente_id = p.id
      INNER JOIN Doctores d ON c.doctor_id = d.id
      INNER JOIN Usuarios u ON d.usuario_id = u.id
      INNER JOIN Especialidades e ON c.especialidad_id = e.id
      INNER JOIN Estados_Citas est ON c.estado_id = est.id
      WHERE c.id = @citaId ${doctorCondition}
    `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Cita no encontrada' });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error obteniendo cita:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Crear nueva cita
router.post('/', [
    auth,
    authorize('citas', 'create'),
    body('paciente_id').isInt(),
    body('doctor_id').isInt(),
    body('especialidad_id').isInt(),
    body('fecha_hora').isISO8601(),
    body('motivo_consulta').optional().isLength({ max: 500 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            paciente_id,
            doctor_id,
            especialidad_id,
            fecha_hora,
            duracion_minutos,
            motivo_consulta,
            observaciones,
            precio
        } = req.body;

        const pool = getPool();

        // Verificar disponibilidad del doctor
        const fechaCita = new Date(fecha_hora);
        const diaSemana = fechaCita.getDay();
        const hora = fechaCita.toTimeString().substring(0, 5);

        const disponibilidadResult = await pool.request()
            .input('doctorId', sql.Int, doctor_id)
            .input('diaSemana', sql.Int, diaSemana)
            .input('hora', sql.Time, hora)
            .query(`
        SELECT COUNT(*) as count
        FROM Horarios_Doctores
        WHERE doctor_id = @doctorId AND dia_semana = @diaSemana 
        AND @hora >= hora_inicio AND @hora < hora_fin AND activo = 1
      `);

        if (disponibilidadResult.recordset[0].count === 0) {
            return res.status(400).json({
                message: 'El doctor no está disponible en ese horario'
            });
        }

        // Verificar que no haya otra cita en el mismo horario
        const conflictoResult = await pool.request()
            .input('doctorId', sql.Int, doctor_id)
            .input('fechaHora', sql.DateTime2, fechaCita)
            .query(`
        SELECT COUNT(*) as count
        FROM Citas
        WHERE doctor_id = @doctorId 
        AND ABS(DATEDIFF(minute, fecha_hora, @fechaHora)) < 30
        AND estado_id NOT IN (SELECT id FROM Estados_Citas WHERE nombre IN ('Cancelada', 'No Asistió'))
      `);

        if (conflictoResult.recordset[0].count > 0) {
            return res.status(400).json({
                message: 'Ya existe una cita programada en ese horario'
            });
        }

        // Obtener estado inicial (Programada)
        const estadoResult = await pool.request()
            .query("SELECT id FROM Estados_Citas WHERE nombre = 'Programada'");

        const estadoId = estadoResult.recordset[0].id;

        // Crear la cita
        const result = await pool.request()
            .input('pacienteId', sql.Int, paciente_id)
            .input('doctorId', sql.Int, doctor_id)
            .input('especialidadId', sql.Int, especialidad_id)
            .input('fechaHora', sql.DateTime2, fechaCita)
            .input('duracionMinutos', sql.Int, duracion_minutos || 30)
            .input('estadoId', sql.Int, estadoId)
            .input('motivoConsulta', sql.NVarChar, motivo_consulta || '')
            .input('observaciones', sql.NVarChar, observaciones || '')
            .input('precio', sql.Decimal(10, 2), precio || null)
            .input('creadoPorUsuarioId', sql.Int, req.user.id)
            .query(`
        INSERT INTO Citas (
          paciente_id, doctor_id, especialidad_id, fecha_hora, 
          duracion_minutos, estado_id, motivo_consulta, observaciones, 
          precio, creado_por_usuario_id
        )
        OUTPUT INSERTED.id
        VALUES (
          @pacienteId, @doctorId, @especialidadId, @fechaHora,
          @duracionMinutos, @estadoId, @motivoConsulta, @observaciones,
          @precio, @creadoPorUsuarioId
        )
      `);

        const citaId = result.recordset[0].id;

        // Registrar en historial
        await pool.request()
            .input('citaId', sql.Int, citaId)
            .input('usuarioId', sql.Int, req.user.id)
            .input('accion', sql.NVarChar, 'CREADA')
            .input('estadoNuevoId', sql.Int, estadoId)
            .query(`
        INSERT INTO Historial_Citas (
          cita_id, usuario_id, accion, estado_nuevo_id
        )
        VALUES (@citaId, @usuarioId, @accion, @estadoNuevoId)
      `);

        res.status(201).json({
            message: 'Cita creada exitosamente',
            citaId
        });
    } catch (error) {
        console.error('Error creando cita:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Actualizar cita
router.put('/:id', [
    auth,
    authorize('citas', 'update'),
    body('estado_id').optional().isInt(),
    body('fecha_hora').optional().isISO8601(),
    body('observaciones').optional().isLength({ max: 1000 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { estado_id, fecha_hora, observaciones } = req.body;

        const pool = getPool();

        // Obtener cita actual
        const citaActual = await pool.request()
            .input('citaId', sql.Int, id)
            .query('SELECT * FROM Citas WHERE id = @citaId');

        if (citaActual.recordset.length === 0) {
            return res.status(404).json({ message: 'Cita no encontrada' });
        }

        const cita = citaActual.recordset[0];

        // Si es doctor, verificar que sea su cita
        if (req.user.rol === 'Doctor' && cita.doctor_id !== req.user.doctor_id) {
            return res.status(403).json({ message: 'No puede modificar citas de otros doctores' });
        }

        // Actualizar cita
        const request = pool.request().input('citaId', sql.Int, id);
        const updates = ['fecha_actualizacion = GETDATE()'];

        if (estado_id) {
            updates.push('estado_id = @estadoId');
            request.input('estadoId', sql.Int, estado_id);
        }

        if (fecha_hora) {
            updates.push('fecha_hora = @fechaHora');
            request.input('fechaHora', sql.DateTime2, new Date(fecha_hora));
        }

        if (observaciones !== undefined) {
            updates.push('observaciones = @observaciones');
            request.input('observaciones', sql.NVarChar, observaciones);
        }

        await request.query(`
      UPDATE Citas 
      SET ${updates.join(', ')}
      WHERE id = @citaId
    `);

        // Registrar en historial
        let accion = 'MODIFICADA';
        if (estado_id) {
            const estadoResult = await pool.request()
                .input('estadoId', sql.Int, estado_id)
                .query('SELECT nombre FROM Estados_Citas WHERE id = @estadoId');

            if (estadoResult.recordset[0]?.nombre === 'Cancelada') {
                accion = 'CANCELADA';
            }
        }

        await pool.request()
            .input('citaId', sql.Int, id)
            .input('usuarioId', sql.Int, req.user.id)
            .input('accion', sql.NVarChar, accion)
            .input('fechaAnterior', sql.DateTime2, cita.fecha_hora)
            .input('fechaNueva', sql.DateTime2, fecha_hora ? new Date(fecha_hora) : cita.fecha_hora)
            .input('estadoAnteriorId', sql.Int, cita.estado_id)
            .input('estadoNuevoId', sql.Int, estado_id || cita.estado_id)
            .query(`
        INSERT INTO Historial_Citas (
          cita_id, usuario_id, accion, fecha_anterior, fecha_nueva,
          estado_anterior_id, estado_nuevo_id
        )
        VALUES (
          @citaId, @usuarioId, @accion, @fechaAnterior, @fechaNueva,
          @estadoAnteriorId, @estadoNuevoId
        )
      `);

        res.json({ message: 'Cita actualizada exitosamente' });
    } catch (error) {
        console.error('Error actualizando cita:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Eliminar cita
router.delete('/:id', [auth, authorize('citas', 'delete')], async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        // Verificar que la cita existe
        const citaResult = await pool.request()
            .input('citaId', sql.Int, id)
            .query('SELECT * FROM Citas WHERE id = @citaId');

        if (citaResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Cita no encontrada' });
        }

        // Eliminar (soft delete - cambiar a estado cancelado)
        const estadoResult = await pool.request()
            .query("SELECT id FROM Estados_Citas WHERE nombre = 'Cancelada'");

        await pool.request()
            .input('citaId', sql.Int, id)
            .input('estadoId', sql.Int, estadoResult.recordset[0].id)
            .query(`
        UPDATE Citas 
        SET estado_id = @estadoId, fecha_actualizacion = GETDATE()
        WHERE id = @citaId
      `);

        // Registrar en historial
        await pool.request()
            .input('citaId', sql.Int, id)
            .input('usuarioId', sql.Int, req.user.id)
            .input('accion', sql.NVarChar, 'CANCELADA')
            .query(`
        INSERT INTO Historial_Citas (cita_id, usuario_id, accion)
        VALUES (@citaId, @usuarioId, @accion)
      `);

        res.json({ message: 'Cita cancelada exitosamente' });
    } catch (error) {
        console.error('Error eliminando cita:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

module.exports = router;
