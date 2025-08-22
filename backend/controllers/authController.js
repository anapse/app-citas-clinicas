const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const SecurityService = require('../services/securityService');

class AuthController {

    async register(req, res, next) {
        try {
            const { full_name, email, phone, dni, password, role } = req.body;

            // Validar email único
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({
                    error: 'El email ya está registrado',
                    code: 'EMAIL_EXISTS'
                });
            }

            // Validar DNI único si se proporciona
            if (dni) {
                const existingDni = await User.findByDni(dni);
                if (existingDni) {
                    return res.status(409).json({
                        error: 'El DNI ya está registrado',
                        code: 'DNI_EXISTS'
                    });
                }
            }

            // Validar contraseña
            const passwordValidation = SecurityService.validatePassword(password);
            if (!passwordValidation.isValid) {
                return res.status(400).json({
                    error: 'Contraseña no válida',
                    code: 'INVALID_PASSWORD',
                    details: passwordValidation.errors
                });
            }

            // Determinar rol
            let targetRole = 'paciente'; // Por defecto

            // Solo admin puede crear otros roles
            if (role && role !== 'paciente') {
                if (!req.user || req.user.role !== 'admin') {
                    return res.status(403).json({
                        error: 'Solo los administradores pueden crear usuarios con rol específico',
                        code: 'INSUFFICIENT_PERMISSIONS'
                    });
                }
                targetRole = role;
            }

            // Obtener ID del rol
            const roleData = await Role.findByName(targetRole);
            if (!roleData) {
                return res.status(400).json({
                    error: 'Rol no válido',
                    code: 'INVALID_ROLE'
                });
            }

            // Hash de la contraseña
            const saltRounds = 12;
            const password_hash = await bcrypt.hash(password, saltRounds);

            // Crear usuario
            const userData = {
                full_name: SecurityService.sanitizeText(full_name),
                email: email.toLowerCase().trim(),
                phone: phone ? SecurityService.sanitizeText(phone) : null,
                dni: dni ? SecurityService.sanitizeText(dni) : null,
                password_hash,
                role_id: roleData.id
            };

            const newUser = await User.createUser(userData);

            // Generar token
            const token = jwt.sign(
                {
                    userId: newUser.id,
                    email: newUser.email,
                    role: targetRole
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                message: 'Usuario registrado exitosamente',
                token,
                user: {
                    id: newUser.id,
                    full_name: newUser.full_name,
                    email: newUser.email,
                    phone: newUser.phone,
                    dni: newUser.dni,
                    role: targetRole
                }
            });

        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            // Buscar usuario
            const user = await User.findByEmail(email.toLowerCase().trim());
            if (!user) {
                return res.status(401).json({
                    error: 'Credenciales inválidas',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            // Verificar contraseña
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({
                    error: 'Credenciales inválidas',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            // Generar token
            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    role: user.role_name
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Inicio de sesión exitoso',
                token,
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    dni: user.dni,
                    role: user.role_name
                }
            });

        } catch (error) {
            next(error);
        }
    }

    async me(req, res, next) {
        try {
            const user = await User.findWithRole(req.user.id);

            if (!user) {
                return res.status(404).json({
                    error: 'Usuario no encontrado',
                    code: 'USER_NOT_FOUND'
                });
            }

            res.json({
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    dni: user.dni,
                    role: user.role_name,
                    created_at: user.created_at
                }
            });

        } catch (error) {
            next(error);
        }
    }

    async updateProfile(req, res, next) {
        try {
            const { full_name, phone } = req.body;
            const userId = req.user.id;

            const updates = {};
            if (full_name) updates.full_name = SecurityService.sanitizeText(full_name);
            if (phone) updates.phone = SecurityService.sanitizeText(phone);

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({
                    error: 'No hay datos para actualizar',
                    code: 'NO_UPDATE_DATA'
                });
            }

            const rowsAffected = await User.update(userId, updates);

            if (rowsAffected === 0) {
                return res.status(404).json({
                    error: 'Usuario no encontrado',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Obtener usuario actualizado
            const updatedUser = await User.findWithRole(userId);

            res.json({
                message: 'Perfil actualizado exitosamente',
                user: {
                    id: updatedUser.id,
                    full_name: updatedUser.full_name,
                    email: updatedUser.email,
                    phone: updatedUser.phone,
                    dni: updatedUser.dni,
                    role: updatedUser.role_name
                }
            });

        } catch (error) {
            next(error);
        }
    }

    async changePassword(req, res, next) {
        try {
            const { current_password, new_password } = req.body;
            const userId = req.user.id;

            // Obtener usuario actual
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    error: 'Usuario no encontrado',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Verificar contraseña actual
            const isValidPassword = await bcrypt.compare(current_password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({
                    error: 'Contraseña actual incorrecta',
                    code: 'INVALID_PASSWORD'
                });
            }

            // Validar nueva contraseña
            const passwordValidation = SecurityService.validatePassword(new_password);
            if (!passwordValidation.isValid) {
                return res.status(400).json({
                    error: 'Nueva contraseña no válida',
                    code: 'INVALID_NEW_PASSWORD',
                    details: passwordValidation.errors
                });
            }

            // Hash de la nueva contraseña
            const saltRounds = 12;
            const password_hash = await bcrypt.hash(new_password, saltRounds);

            // Actualizar contraseña
            await User.update(userId, { password_hash });

            res.json({
                message: 'Contraseña actualizada exitosamente'
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
