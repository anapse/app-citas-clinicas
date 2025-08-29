const express = require('express');
const { body, validationResult } = require('express-validator');
const { getPool, sql } = require('../config/database');
const auth = require('../middleware/auth');
const { authorize, isAdmin, ownDoctorData } = require('../middleware/authorize');

const router = express.Router();

// Obtener todos los doctores
router.get('/', auth, async (req, res) => {
    try {
        const { especialidad_id, activo = 1 } = req.query;

        const pool = getPool();
        const request = pool.request();

        let whereConditions = ['d.activo = @activo'];
        request.input('activo', sql.Bit, activo === '1');

        if (especialidad_id) {
            whereConditions.push('d.especialidad_id = @especialidadId');
            request.input('especialidadId', sql.Int, especialidad_id);
        }

        const result = await request.query(`
      SELECT d.id, d.numero_licencia, d.biografia, d.foto_url,
             u.nombre, u.apellido, u.email, u.telefono,
             e.nombre as especialidad_nombre, e.id as especialidad_id,
             d.fecha_creacion
      FROM Doctores d
      INNER JOIN Usuarios u ON d.usuario_id = u.id
      INNER JOIN Especialidades e ON d.especialidad_id = e.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY u.nombre, u.apellido
    `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error obteniendo doctores:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Obtener doctor por ID
router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        const result = await pool.request()
            .input('doctorId', sql.Int, id)
            .query(`
        SELECT d.*, u.nombre, u.apellido, u.email, u.telefono,
               e.nombre as especialidad_nombre
        FROM Doctores d
        INNER JOIN Usuarios u ON d.usuario_id = u.id
        INNER JOIN Especialidades e ON d.especialidad_id = e.id
        WHERE d.id = @doctorId
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Doctor no encontrado' });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error obteniendo doctor:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Obtener horarios de un doctor
router.get('/:id/horarios', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        const result = await pool.request()
            .input('doctorId', sql.Int, id)
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
        console.error('Error obteniendo horarios del doctor:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Obtener citas de un doctor
router.get('/:id/citas', [auth, ownDoctorData], async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha_desde, fecha_hasta, estado_id } = req.query;

        const pool = getPool();
        const request = pool.request().input('doctorId', sql.Int, id);

        let whereConditions = ['c.doctor_id = @doctorId'];

        if (fecha_desde) {
            whereConditions.push('c.fecha_hora >= @fechaDesde');
            request.input('fechaDesde', sql.DateTime2, new Date(fecha_desde));
        }

        if (fecha_hasta) {
            whereConditions.push('c.fecha_hora <= @fechaHasta');
            request.input('fechaHasta', sql.DateTime2, new Date(fecha_hasta));
        }

        if (estado_id) {
            whereConditions.push('c.estado_id = @estadoId');
            request.input('estadoId', sql.Int, estado_id);
        }

        const result = await request.query(`
      SELECT c.id, c.fecha_hora, c.duracion_minutos, c.motivo_consulta,
             p.nombre as paciente_nombre, p.apellido as paciente_apellido,
             p.telefono as paciente_telefono,
             est.nombre as estado_nombre, est.color as estado_color
      FROM Citas c
      INNER JOIN Pacientes p ON c.paciente_id = p.id
      INNER JOIN Estados_Citas est ON c.estado_id = est.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY c.fecha_hora
    `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error obteniendo citas del doctor:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Actualizar información del doctor
router.put('/:id', [
    auth,
    body('biografia').optional().isLength({ max: 1000 }),
    body('foto_url').optional().isURL()
], async (req, res) => {
    try {
        // Verificar permisos: Admin o el propio doctor
        const { id } = req.params;

        if (req.user.rol !== 'Administrador' && req.user.doctor_id !== parseInt(id)) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { biografia, foto_url } = req.body;
        const pool = getPool();

        const updates = ['fecha_actualizacion = GETDATE()'];
        const request = pool.request().input('doctorId', sql.Int, id);

        if (biografia !== undefined) {
            updates.push('biografia = @biografia');
            request.input('biografia', sql.NVarChar, biografia);
        }

        if (foto_url !== undefined) {
            updates.push('foto_url = @fotoUrl');
            request.input('fotoUrl', sql.NVarChar, foto_url);
        }

        await request.query(`
      UPDATE Doctores 
      SET ${updates.join(', ')}
      WHERE id = @doctorId
    `);

        res.json({ message: 'Doctor actualizado exitosamente' });
    } catch (error) {
        console.error('Error actualizando doctor:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Crear nuevo doctor (solo admin)
router.post('/', [
    auth,
    isAdmin,
    body('nombre').notEmpty().isLength({ max: 100 }),
    body('apellido').notEmpty().isLength({ max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('telefono').optional().isLength({ max: 20 }),
    body('especialidad_id').isInt(),
    body('numero_licencia').notEmpty().isLength({ max: 50 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            nombre,
            apellido,
            email,
            telefono,
            especialidad_id,
            numero_licencia,
            biografia,
            password = 'password123' // Password temporal
        } = req.body;

        const pool = getPool();
        const transaction = pool.transaction();

        try {
            await transaction.begin();

            // Crear usuario
            const bcrypt = require('bcryptjs');
            const passwordHash = await bcrypt.hash(password, 10);

            // Obtener ID del rol Doctor
            const rolResult = await transaction.request()
                .query("SELECT id FROM Roles WHERE nombre = 'Doctor'");

            const rolId = rolResult.recordset[0].id;

            const usuarioResult = await transaction.request()
                .input('nombre', sql.NVarChar, nombre)
                .input('apellido', sql.NVarChar, apellido)
                .input('email', sql.NVarChar, email)
                .input('telefono', sql.NVarChar, telefono)
                .input('passwordHash', sql.NVarChar, passwordHash)
                .input('rolId', sql.Int, rolId)
                .query(`
          INSERT INTO Usuarios (nombre, apellido, email, telefono, password_hash, rol_id)
          OUTPUT INSERTED.id
          VALUES (@nombre, @apellido, @email, @telefono, @passwordHash, @rolId)
        `);

            const usuarioId = usuarioResult.recordset[0].id;

            // Crear doctor
            const doctorResult = await transaction.request()
                .input('usuarioId', sql.Int, usuarioId)
                .input('especialidadId', sql.Int, especialidad_id)
                .input('numeroLicencia', sql.NVarChar, numero_licencia)
                .input('biografia', sql.NVarChar, biografia || '')
                .query(`
          INSERT INTO Doctores (usuario_id, especialidad_id, numero_licencia, biografia)
          OUTPUT INSERTED.id
          VALUES (@usuarioId, @especialidadId, @numeroLicencia, @biografia)
        `);

            const doctorId = doctorResult.recordset[0].id;

            await transaction.commit();

            res.status(201).json({
                message: 'Doctor creado exitosamente',
                doctorId,
                usuarioId,
                passwordTemporal: password
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error creando doctor:', error);
        if (error.number === 2627) { // Unique constraint violation
            res.status(400).json({ message: 'Email o número de licencia ya existe' });
        } else {
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
});

module.exports = router;
