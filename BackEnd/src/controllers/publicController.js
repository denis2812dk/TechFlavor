import * as saasService from "../services/saasService.js";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const registerRestaurantRequest = async (req, res, next) => {
    try {
        const { restaurantName, ownerName, email, phone, planRequested, notes } = req.body;

        if (!restaurantName || !ownerName || !email) {
            return res.status(400).json({
                success: false,
                message: "El nombre del restaurante, tu nombre y tu correo son obligatorios.",
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Por favor ingresa un correo electrónico válido.",
            });
        }
        const requestId = await saasService.registerTenantRequest({
            restaurantName,
            ownerName,
            email,
            phone,
            planRequested,
            notes
        });
        res.status(201).json({
            success: true,
            message: "¡Solicitud recibida! Nuestro equipo se pondrá en contacto contigo muy pronto para activar tu cuenta.",
            requestId
        });

    } catch (error) {
        // Manejo de errores de negocio que lanza el servicio
        if (error.message === "EMAIL_ALREADY_REGISTERED") {
            return res.status(409).json({
                success: false,
                message: "Este correo electrónico ya está registrado o tiene una solicitud en proceso.",
            });
        }
        next(error);
    }
};