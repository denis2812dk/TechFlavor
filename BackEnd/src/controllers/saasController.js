import * as saasService from "../services/saasService.js";

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