const Doctor = require('../models/Doctor');
const User = require('../models/User');
const SecurityService = require('../services/securityService');

class DoctorController {

    async getDoctors(req, res, next) {
        try {
            const { specialtyId, visible } = req.query;

            // Convertir visible a boolean si está presente
            const visibleFilter = visible !== undefined ? visible === '1' || visible === 'true' : null;

            let doctors;

            if (specialtyId) {
                const Specialty = require('../models/Specialty');
                doctors = await Specialty.getDoctorsBySpecialty(parseInt(specialtyId));
            } else if (visibleFilter !== null) {
                doctors = visibleFilter ? await Doctor.findVisibleDoctors() : await Doctor.findAll();
            } else {
                doctors = await Doctor.findVisibleDoctors();
            }

            res.json({
                doctors: doctors.map(doctor => ({
                    id: doctor.id,
                    display_name: doctor.display_name,
                    full_name: doctor.full_name,
                    title_prefix: doctor.title_prefix,
                    description_short: doctor.description_short,
                    photo_url: doctor.photo_url,
                    photo_svg: doctor.photo_svg,
                    has_image: doctor.has_image,
                    primary_specialty_name: doctor.primary_specialty_name,
                    sort_order: doctor.sort_order || 0
                }))
            });

        } catch (error) {
            next(error);
        }
    }

    async getDoctorById(req, res, next) {
        try {
            const doctorId = parseInt(req.params.id);

            // Obtener doctor con perfil
            const doctor = await Doctor.findWithProfile(doctorId);
            if (!doctor) {
                return res.status(404).json({
                    error: 'Doctor no encontrado',
                    code: 'DOCTOR_NOT_FOUND'
                });
            }

            // Obtener especialidades del doctor
            const specialties = await Doctor.getSpecialties(doctorId);

            // Obtener próximos horarios (opcional - aquí podrías implementar lógica adicional)

            res.json({
                doctor: {
                    id: doctor.id,
                    user_id: doctor.user_id,
                    display_name: doctor.display_name,
                    full_name: doctor.full_name,
                    email: doctor.email,
                    phone: doctor.phone,
                    profile: {
                        primary_specialty_id: doctor.primary_specialty_id,
                        primary_specialty_name: doctor.primary_specialty_name,
                        title_prefix: doctor.title_prefix,
                        description_short: doctor.description_short,
                        description_long: doctor.description_long,
                        photo_url: doctor.photo_url,
                        photo_svg: doctor.photo_svg,
                        has_image: doctor.has_image,
                        is_visible: doctor.is_visible,
                        sort_order: doctor.sort_order
                    },
                    specialties
                }
            });

        } catch (error) {
            next(error);
        }
    }

    async createDoctorProfile(req, res, next) {
        try {
            const doctorId = parseInt(req.params.id);

            // Verificar que el doctor existe
            const doctor = await Doctor.findById(doctorId);
            if (!doctor) {
                return res.status(404).json({
                    error: 'Doctor no encontrado',
                    code: 'DOCTOR_NOT_FOUND'
                });
            }

            const {
                primary_specialty_id,
                title_prefix,
                description_short,
                description_long,
                is_visible,
                sort_order
            } = req.body;

            // Sanitizar datos
            const profileData = {
                primary_specialty_id: primary_specialty_id || null,
                title_prefix: title_prefix ? SecurityService.sanitizeText(title_prefix) : null,
                description_short: description_short ? SecurityService.sanitizeText(description_short) : null,
                description_long: description_long ? SecurityService.sanitizeText(description_long) : null,
                photo_url: null, // Se establecerá en endpoint separado
                photo_svg: null, // Se establecerá en endpoint separado
                is_visible: is_visible !== undefined ? Boolean(is_visible) : true,
                sort_order: sort_order || 0
            };

            const success = await Doctor.updateProfile(doctorId, profileData);

            if (!success) {
                return res.status(500).json({
                    error: 'Error al crear/actualizar el perfil',
                    code: 'PROFILE_UPDATE_FAILED'
                });
            }

            // Obtener perfil actualizado
            const updatedDoctor = await Doctor.findWithProfile(doctorId);

            res.status(201).json({
                message: 'Perfil de doctor creado/actualizado exitosamente',
                profile: {
                    primary_specialty_id: updatedDoctor.primary_specialty_id,
                    primary_specialty_name: updatedDoctor.primary_specialty_name,
                    title_prefix: updatedDoctor.title_prefix,
                    description_short: updatedDoctor.description_short,
                    description_long: updatedDoctor.description_long,
                    photo_url: updatedDoctor.photo_url,
                    photo_svg: updatedDoctor.photo_svg,
                    has_image: updatedDoctor.has_image,
                    is_visible: updatedDoctor.is_visible,
                    sort_order: updatedDoctor.sort_order
                }
            });

        } catch (error) {
            next(error);
        }
    }

    async updateDoctorProfile(req, res, next) {
        try {
            const doctorId = parseInt(req.params.id);

            // Verificar que el doctor existe
            const doctor = await Doctor.findById(doctorId);
            if (!doctor) {
                return res.status(404).json({
                    error: 'Doctor no encontrado',
                    code: 'DOCTOR_NOT_FOUND'
                });
            }

            const updates = {};
            const {
                primary_specialty_id,
                title_prefix,
                description_short,
                description_long,
                is_visible,
                sort_order
            } = req.body;

            // Solo actualizar campos proporcionados
            if (primary_specialty_id !== undefined) updates.primary_specialty_id = primary_specialty_id;
            if (title_prefix !== undefined) updates.title_prefix = SecurityService.sanitizeText(title_prefix);
            if (description_short !== undefined) updates.description_short = SecurityService.sanitizeText(description_short);
            if (description_long !== undefined) updates.description_long = SecurityService.sanitizeText(description_long);
            if (is_visible !== undefined) updates.is_visible = Boolean(is_visible);
            if (sort_order !== undefined) updates.sort_order = parseInt(sort_order);

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({
                    error: 'No hay datos para actualizar',
                    code: 'NO_UPDATE_DATA'
                });
            }

            const success = await Doctor.updateProfile(doctorId, updates);

            if (!success) {
                return res.status(500).json({
                    error: 'Error al actualizar el perfil',
                    code: 'PROFILE_UPDATE_FAILED'
                });
            }

            // Obtener perfil actualizado
            const updatedDoctor = await Doctor.findWithProfile(doctorId);

            res.json({
                message: 'Perfil actualizado exitosamente',
                profile: {
                    primary_specialty_id: updatedDoctor.primary_specialty_id,
                    primary_specialty_name: updatedDoctor.primary_specialty_name,
                    title_prefix: updatedDoctor.title_prefix,
                    description_short: updatedDoctor.description_short,
                    description_long: updatedDoctor.description_long,
                    photo_url: updatedDoctor.photo_url,
                    photo_svg: updatedDoctor.photo_svg,
                    has_image: updatedDoctor.has_image,
                    is_visible: updatedDoctor.is_visible,
                    sort_order: updatedDoctor.sort_order
                }
            });

        } catch (error) {
            next(error);
        }
    }

    async updateDoctorPhoto(req, res, next) {
        try {
            const doctorId = parseInt(req.params.id);

            if (!req.file) {
                return res.status(400).json({
                    error: 'No se proporcionó ningún archivo',
                    code: 'NO_FILE_PROVIDED'
                });
            }

            // Aquí implementarías la lógica para subir el archivo a tu servicio de almacenamiento
            // Por ahora, simularemos que se guardó exitosamente
            const photoUrl = `/uploads/doctors/${doctorId}-${Date.now()}.${req.file.originalname.split('.').pop()}`;

            const success = await Doctor.updateProfile(doctorId, {
                photo_url: photoUrl,
                photo_svg: null // Limpiar SVG si existe
            });

            if (!success) {
                return res.status(500).json({
                    error: 'Error al actualizar la foto del doctor',
                    code: 'PHOTO_UPDATE_FAILED'
                });
            }

            res.json({
                message: 'Foto actualizada exitosamente',
                photo_url: photoUrl
            });

        } catch (error) {
            next(error);
        }
    }

    async updateDoctorPhotoSvg(req, res, next) {
        try {
            const doctorId = parseInt(req.params.id);
            const { svg_content } = req.body;

            if (!svg_content) {
                return res.status(400).json({
                    error: 'Contenido SVG requerido',
                    code: 'SVG_CONTENT_REQUIRED'
                });
            }

            // Sanitizar SVG
            const sanitizedSvg = SecurityService.sanitizeSvg(svg_content);
            if (!sanitizedSvg) {
                return res.status(400).json({
                    error: 'Contenido SVG inválido o peligroso',
                    code: 'INVALID_SVG_CONTENT'
                });
            }

            const success = await Doctor.updateProfile(doctorId, {
                photo_svg: sanitizedSvg,
                photo_url: null // Limpiar URL si existe
            });

            if (!success) {
                return res.status(500).json({
                    error: 'Error al actualizar el SVG del doctor',
                    code: 'SVG_UPDATE_FAILED'
                });
            }

            res.json({
                message: 'SVG actualizado exitosamente',
                photo_svg: sanitizedSvg
            });

        } catch (error) {
            next(error);
        }
    }

    async addSpecialty(req, res, next) {
        try {
            const doctorId = parseInt(req.params.id);
            const { specialty_id } = req.body;

            const success = await Doctor.addSpecialty(doctorId, specialty_id);

            if (!success) {
                return res.status(409).json({
                    error: 'El doctor ya tiene asignada esta especialidad',
                    code: 'SPECIALTY_ALREADY_ASSIGNED'
                });
            }

            res.status(201).json({
                message: 'Especialidad asignada exitosamente'
            });

        } catch (error) {
            next(error);
        }
    }

    async removeSpecialty(req, res, next) {
        try {
            const doctorId = parseInt(req.params.id);
            const specialtyId = parseInt(req.params.specialtyId);

            const success = await Doctor.removeSpecialty(doctorId, specialtyId);

            if (!success) {
                return res.status(404).json({
                    error: 'Relación doctor-especialidad no encontrada',
                    code: 'SPECIALTY_NOT_ASSIGNED'
                });
            }

            res.json({
                message: 'Especialidad removida exitosamente'
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new DoctorController();
