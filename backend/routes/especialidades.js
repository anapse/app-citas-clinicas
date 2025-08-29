const express = require('express');
const { body, validationResult } = require('express-validator');
const { getPool, sql } = require('../config/database');
const auth = require('../middleware/auth');
const { authorize, isAdmin } = require('../middleware/authorize');

const router = express.Router();

// Obtener todas las especialidades
router.get('/', auth, async (req, res) => {
    try {
        const { activo = 1 } = req.query;

        const pool = getPool();
        const result = await pool.request()
            .input('activo', sql.Bit, activo === '1')
            .query(`
        SELECT e.*, 
               COUNT(d.id) as total_doctores
        FROM Especialidades e
        LEFT JOIN Doctores d ON e.id = d.especialidad_id AND d.activo = 1
        WHERE e.activo = @activo
        GROUP BY e.id, e.nombre, e.descripcion, e.duracion_cita_minutos, 
                 e.horario_por_defecto, e.requiere_moderador, e.activo,
                 e.fecha_creacion, e.fecha_actualizacion
        ORDER BY e.nombre
      `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error obteniendo especialidades:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Obtener especialidad por ID
router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        const result = await pool.request()
            .input('especialidadId', sql.Int, id)
            .query(`
        SELECT e.*,
               COUNT(d.id) as total_doctores
        FROM Especialidades e
        LEFT JOIN Doctores d ON e.id = d.especialidad_id AND d.activo = 1
        WHERE e.id = @especialidadId
        GROUP BY e.id, e.nombre, e.descripcion, e.duracion_cita_minutos, 
                 e.horario_por_defecto, e.requiere_moderador, e.activo,
                 e.fecha_creacion, e.fecha_actualizacion
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Especialidad no encontrada' });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error obteniendo especialidad:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Obtener doctores de una especialidad
router.get('/:id/doctores', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        const result = await pool.request()
            .input('especialidadId', sql.Int, id)
            .query(`
        SELECT d.id, d.numero_licencia, d.biografia, d.foto_url,
               u.nombre, u.apellido, u.email, u.telefono,
               d.fecha_creacion
        FROM Doctores d
        INNER JOIN Usuarios u ON d.usuario_id = u.id
        WHERE d.especialidad_id = @especialidadId AND d.activo = 1
        ORDER BY u.nombre, u.apellido
      `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error obteniendo doctores de la especialidad:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Crear nueva especialidad (solo admin)
router.post('/', [
    auth,
    isAdmin,
    body('nombre').notEmpty().isLength({ max: 100 }),
    body('descripcion').optional().isLength({ max: 500 }),
    body('duracion_cita_minutos').optional().isInt({ min: 15, max: 180 }),
    body('requiere_moderador').optional().isBoolean()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            nombre,
            descripcion,
            duracion_cita_minutos = 30,
            horario_por_defecto,
            requiere_moderador = false
        } = req.body;

        const pool = getPool();

        // Validar horario_por_defecto si se proporciona
        if (horario_por_defecto) {
            try {
                const horario = JSON.parse(horario_por_defecto);
                if (!horario.dias || !horario.turnos || !Array.isArray(horario.dias) || !Array.isArray(horario.turnos)) {
                    return res.status(400).json({
                        message: 'Formato de horario por defecto inválido'
                    });
                }
            } catch (error) {
                return res.status(400).json({
                    message: 'Formato JSON inválido para horario por defecto'
                });
            }
        }

        const result = await pool.request()
            .input('nombre', sql.NVarChar, nombre)
            .input('descripcion', sql.NVarChar, descripcion || '')
            .input('duracionCitaMinutos', sql.Int, duracion_cita_minutos)
            .input('horarioPorDefecto', sql.NVarChar, horario_por_defecto || null)
            .input('requiereModerador', sql.Bit, requiere_moderador)
            .query(`
        INSERT INTO Especialidades (
          nombre, descripcion, duracion_cita_minutos, 
          horario_por_defecto, requiere_moderador
        )
        OUTPUT INSERTED.id
        VALUES (
          @nombre, @descripcion, @duracionCitaMinutos,
          @horarioPorDefecto, @requiereModerador
        )
      `);

        res.status(201).json({
            message: 'Especialidad creada exitosamente',
            especialidadId: result.recordset[0].id
        });
    } catch (error) {
        console.error('Error creando especialidad:', error);
        if (error.number === 2627) { // Unique constraint violation
            res.status(400).json({ message: 'Ya existe una especialidad con ese nombre' });
        } else {
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
});

// Actualizar especialidad (solo admin)
router.put('/:id', [
    auth,
    isAdmin,
    body('nombre').optional().isLength({ max: 100 }),
    body('descripcion').optional().isLength({ max: 500 }),
    body('duracion_cita_minutos').optional().isInt({ min: 15, max: 180 }),
    body('requiere_moderador').optional().isBoolean(),
    body('activo').optional().isBoolean()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const {
            nombre,
            descripcion,
            duracion_cita_minutos,
            horario_por_defecto,
            requiere_moderador,
            activo
        } = req.body;

        const pool = getPool();

        // Verificar que la especialidad existe
        const especialidadResult = await pool.request()
            .input('especialidadId', sql.Int, id)
            .query('SELECT * FROM Especialidades WHERE id = @especialidadId');

        if (especialidadResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Especialidad no encontrada' });
        }

        // Validar horario_por_defecto si se proporciona
        if (horario_por_defecto) {
            try {
                const horario = JSON.parse(horario_por_defecto);
                if (!horario.dias || !horario.turnos) {
                    return res.status(400).json({
                        message: 'Formato de horario por defecto inválido'
                    });
                }
            } catch (error) {
                return res.status(400).json({
                    message: 'Formato JSON inválido para horario por defecto'
                });
            }
        }

        // Actualizar especialidad
        const updates = ['fecha_actualizacion = GETDATE()'];
        const request = pool.request().input('especialidadId', sql.Int, id);

        if (nombre) {
            updates.push('nombre = @nombre');
            request.input('nombre', sql.NVarChar, nombre);
        }

        if (descripcion !== undefined) {
            updates.push('descripcion = @descripcion');
            request.input('descripcion', sql.NVarChar, descripcion);
        }

        if (duracion_cita_minutos) {
            updates.push('duracion_cita_minutos = @duracionCitaMinutos');
            request.input('duracionCitaMinutos', sql.Int, duracion_cita_minutos);
        }

        if (horario_por_defecto !== undefined) {
            updates.push('horario_por_defecto = @horarioPorDefecto');
            request.input('horarioPorDefecto', sql.NVarChar, horario_por_defecto);
        }

        if (requiere_moderador !== undefined) {
            updates.push('requiere_moderador = @requiereModerador');
            request.input('requiereModerador', sql.Bit, requiere_moderador);
        }

        if (activo !== undefined) {
            updates.push('activo = @activo');
            request.input('activo', sql.Bit, activo);
        }

        await request.query(`
      UPDATE Especialidades 
      SET ${updates.join(', ')}
      WHERE id = @especialidadId
    `);

        res.json({ message: 'Especialidad actualizada exitosamente' });
    } catch (error) {
        console.error('Error actualizando especialidad:', error);
        if (error.number === 2627) { // Unique constraint violation
            res.status(400).json({ message: 'Ya existe una especialidad con ese nombre' });
        } else {
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
});

// Eliminar especialidad (solo admin)
router.delete('/:id', [auth, isAdmin], async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        // Verificar si hay doctores asociados
        const doctoresResult = await pool.request()
            .input('especialidadId', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM Doctores WHERE especialidad_id = @especialidadId AND activo = 1');

        if (doctoresResult.recordset[0].count > 0) {
            return res.status(400).json({
                message: 'No se puede eliminar la especialidad porque tiene doctores asociados'
            });
        }

        // Verificar si hay citas asociadas
        const citasResult = await pool.request()
            .input('especialidadId', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM Citas WHERE especialidad_id = @especialidadId');

        if (citasResult.recordset[0].count > 0) {
            return res.status(400).json({
                message: 'No se puede eliminar la especialidad porque tiene citas asociadas'
            });
        }

        // Eliminar (soft delete)
        await pool.request()
            .input('especialidadId', sql.Int, id)
            .query(`
        UPDATE Especialidades 
        SET activo = 0, fecha_actualizacion = GETDATE()
        WHERE id = @especialidadId
      `);

        res.json({ message: 'Especialidad eliminada exitosamente' });
    } catch (error) {
        console.error('Error eliminando especialidad:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

module.exports = router;
