export const requireTenantRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.restaurant?.tenantRole) {
            return res.status(403).json({
                success: false,
                message: "No se pudo validar tu rol dentro del restaurante.",
            });
        }

        if (!allowedRoles.includes(req.restaurant.tenantRole)) {
            return res.status(403).json({
                success: false,
                message: "No tienes permiso para realizar esta accion.",
            });
        }

        next();
    };
};
