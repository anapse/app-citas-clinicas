// Middleware para verificar permisos específicos
const authorize = (resource, action) => {
    return (req, res, next) => {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }

        // Administrador tiene acceso a todo
        if (user.permisos.all === true) {
            return next();
        }

        // Verificar permiso específico
        const resourcePermissions = user.permisos[resource];

        if (!resourcePermissions) {
            return res.status(403).json({
                message: `No tiene permisos para acceder a ${resource}`
            });
        }

        if (Array.isArray(resourcePermissions) && !resourcePermissions.includes(action)) {
            return res.status(403).json({
                message: `No tiene permisos para ${action} en ${resource}`
            });
        }

        next();
    };
};

// Middleware para verificar si es administrador
const isAdmin = (req, res, next) => {
    if (req.user?.rol !== 'Administrador') {
        return res.status(403).json({ message: 'Acceso restringido a administradores' });
    }
    next();
};

// Middleware para verificar si es moderador o superior
const isModerator = (req, res, next) => {
    const allowedRoles = ['Administrador', 'Moderador'];
    if (!allowedRoles.includes(req.user?.rol)) {
        return res.status(403).json({ message: 'Acceso restringido a moderadores o administradores' });
    }
    next();
};

// Middleware para verificar si es doctor (o puede acceder a datos de doctor)
const isDoctor = (req, res, next) => {
    if (req.user?.rol !== 'Doctor' && req.user?.rol !== 'Administrador') {
        return res.status(403).json({ message: 'Acceso restringido a doctores' });
    }
    next();
};

// Middleware para verificar si el doctor puede acceder solo a sus propios datos
const ownDoctorData = (req, res, next) => {
    const doctorId = req.params.doctorId || req.body.doctor_id;

    // Administradores pueden acceder a cualquier dato
    if (req.user?.rol === 'Administrador') {
        return next();
    }

    // Doctores solo pueden acceder a sus propios datos
    if (req.user?.rol === 'Doctor' && req.user?.doctor_id &&
        parseInt(doctorId) === parseInt(req.user.doctor_id)) {
        return next();
    }

    return res.status(403).json({
        message: 'Solo puede acceder a sus propios datos'
    });
};

module.exports = {
    authorize,
    isAdmin,
    isModerator,
    isDoctor,
    ownDoctorData
};
