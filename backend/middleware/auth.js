const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/database');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Token de acceso requerido' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const pool = getPool();
        const result = await pool.request()
            .input('usuarioId', sql.Int, decoded.id)
            .query(`
        SELECT u.id, u.nombre, u.apellido, u.email, u.activo,
               r.nombre as rol, r.permisos,
               d.id as doctor_id, d.especialidad_id
        FROM Usuarios u
        INNER JOIN Roles r ON u.rol_id = r.id
        LEFT JOIN Doctores d ON u.id = d.usuario_id
        WHERE u.id = @usuarioId AND u.activo = 1
      `);

        if (result.recordset.length === 0) {
            return res.status(401).json({ message: 'Usuario no encontrado o inactivo' });
        }

        const usuario = result.recordset[0];

        // Parsear permisos JSON
        try {
            usuario.permisos = JSON.parse(usuario.permisos);
        } catch (error) {
            usuario.permisos = {};
        }

        req.user = usuario;
        next();
    } catch (error) {
        console.error('Error en autenticación:', error);
        res.status(401).json({ message: 'Token inválido' });
    }
};

module.exports = auth;
