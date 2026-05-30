import * as saasService from "../services/saasService.js";
import { db } from "../config/db.js";
export const approveSubscription = async (req, res, next) => {
    try {
        const { requestId } = req.params;

        const credentials = await saasService.approveTenantRequest(requestId);

        res.json({
            success: true,
            message: "Restaurante aprobado y aprovisionado correctamente.",
            data: {
                instructions: "Por favor, envía estas credenciales al cliente de forma segura.",
                credentials
            }
        });
    } catch (error) {
        if (error.message === "REQUEST_NOT_FOUND") {
            return res.status(404).json({ success: false, message: "La solicitud no existe." });
        }
        if (error.message === "REQUEST_ALREADY_PROCESSED") {
            return res.status(400).json({ success: false, message: "Esta solicitud ya fue aprobada o rechazada previamente." });
        }
        next(error);
    }
};
export const rejectSubscription = async (req, res, next) => {
    try {
        const { requestId } = req.params;
        const { reason } = req.body; 

        await saasService.rejectTenantRequest(requestId, reason);
        res.json({
            success: true,
            message: "La solicitud de suscripción ha sido rechazada y archivada."
        });
    } catch (error) {
        if (error.message === "REQUEST_NOT_FOUND") {
            return res.status(404).json({ success: false, message: "La solicitud no existe." });
        }
        if (error.message === "REQUEST_ALREADY_PROCESSED") {
            return res.status(400).json({ success: false, message: "Esta solicitud ya fue aprobada o rechazada previamente." });
        }
        next(error);
    }
};

export const listPendingRequests = async (req, res, next) => {
    try {
        const pending = await saasService.getPendingRequests();
        
        res.json({ 
            success: true, 
            requests: pending 
        });
    } catch (error) {
        next(error);
    }
};
export const listRegisteredRestaurants = async (req, res, next) => {
    try {
        const clients = await saasService.getRegisteredRestaurants();
        
        res.json({ 
            success: true, 
            restaurants: clients 
        });
    } catch (error) {
        next(error);
    }
};
export const getSaaSStatistics = async (req, res, next) => {
    try {
        const stats = await saasService.getPlatformStatistics();
        
        res.json({ 
            success: true, 
            stats 
        });
    } catch (error) {
        next(error);
    }
};

export const toggleRestaurantStatus = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        const result = await saasService.toggleRestaurantStatus(restaurantId);

        res.json({
            success: true,
            message: result.newStatus === "active" 
                ? `El restaurante "${result.name}" ha sido REACTIVADO exitosamente.`
                : `¡BOTÓN DE PÁNICO ACTIVADO! El restaurante "${result.name}" ha sido SUSPENDIDO.`,
            status: result.newStatus
        });
    } catch (error) {
        if (error.message === "RESTAURANT_NOT_FOUND") {
            return res.status(404).json({ success: false, message: "Restaurante no encontrado en el sistema central." });
        }
        next(error);
    }
};
export const listSaasPlans = async (req, res, next) => {
    try {
        const plans = await saasService.getSaasPlans();
        res.json({ 
            success: true, 
            plans 
        });
    } catch (error) {
        next(error);
    }
};

export const createNewPlan = async (req, res, next) => {
    try {
        await saasService.createSaasPlan(req.body);
        
        res.status(201).json({ 
            success: true, 
            message: "Plan de suscripción creado exitosamente." 
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: "Ya existe un plan con ese código identificador." });
        }
        next(error);
    }
};
export const listPublicSaasPlans = async (req, res, next) => {
    try {
        const activePlans = await saasService.getPublicSaasPlans();
        
        res.json({ 
            success: true, 
            plans: activePlans 
        });
    } catch (error) {
        next(error);
    }
};