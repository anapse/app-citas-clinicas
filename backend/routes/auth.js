const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getPool, sql } = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        const pool = getPool();
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query(`
        SELECT u.id, u.nombre, u.apellido, u.email, u.password_hash, u.activo,
               r.nombre as rol, r.permisos,
               d.id as doctor_id, d.especialidad_id
        FROM Usuarios u
        INNER JOIN Roles r ON u.rol_id = r.id
        LEFT JOIN Doctores d ON u.id = d.usuario_id
        WHERE u.email = @email
      `);

        if (result.recordset.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const usuario = result.recordset[0];

        if (!usuario.activo) {
            return res.status(401).json({ message: 'Usuario inactivo' });
        }

        const isValidPassword = await bcrypt.compare(password, usuario.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Actualizar último login
        await pool.request()
            .input('usuarioId', sql.Int, usuario.id)
            .query('UPDATE Usuarios SET ultimo_login = GETDATE() WHERE id = @usuarioId');

        // Generar JWT
        const token = jwt.sign(
            {
                id: usuario.id,
                email: usuario.email,
                rol: usuario.rol
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // Parsear permisos
        let permisos = {};
        try {
            permisos = JSON.parse(usuario.permisos);
        } catch (error) {
            permisos = {};
        }

        res.json({
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                rol: usuario.rol,
                permisos,
                doctor_id: usuario.doctor_id,
                especialidad_id: usuario.especialidad_id
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Obtener perfil del usuario autenticado
router.get('/profile', auth, async (req, res) => {
    try {
        const usuario = req.user;

        res.json({
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            rol: usuario.rol,
            permisos: usuario.permisos,
            doctor_id: usuario.doctor_id,
            especialidad_id: usuario.especialidad_id
        });
    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Cambiar contraseña
router.put('/change-password', [
    auth,
    body('currentPassword').isLength({ min: 6 }),
    body('newPassword').isLength({ min: 6 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        const pool = getPool();

        // Verificar contraseña actual
        const userResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT password_hash FROM Usuarios WHERE id = @userId');

        const isValidPassword = await bcrypt.compare(currentPassword, userResult.recordset[0].password_hash);

        if (!isValidPassword) {
            return res.status(400).json({ message: 'Contraseña actual incorrecta' });
        }

        // Hashear nueva contraseña
        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Actualizar contraseña
        await pool.request()
            .input('userId', sql.Int, userId)
            .input('newPasswordHash', sql.NVarChar, newPasswordHash)
            .query(`
        UPDATE Usuarios 
        SET password_hash = @newPasswordHash, fecha_actualizacion = GETDATE()
        WHERE id = @userId
      `);

        res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Verificar token
router.get('/verify', auth, (req, res) => {
    res.json({ valid: true, user: req.user });
});

module.exports = router;
