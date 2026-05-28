import rateLimit, { ipKeyGenerator } from "express-rate-limit"; 

const saasKeyGenerator = (req, res) => {
    if (req.user?.id && req.restaurant?.restaurantId) {
        return `${req.restaurant.restaurantId}-${req.user.id}`;
    }
    if (req.user?.id) {
        return req.user.id;
    }
    return ipKeyGenerator(req, res); 
};

const limitReachedHandler = (req, res, next, options) => {
    res.status(options.statusCode).json({
        success: false,
        message: options.message
    });
};


export const readLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: saasKeyGenerator,
    handler: limitReachedHandler,
    message: "Has superado el límite de consultas permitidas. Por favor, espera un minuto."
});

export const writeLimiter = rateLimit({
    windowMs: 60 * 1000, 
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: saasKeyGenerator,
    handler: limitReachedHandler,
    message: "Demasiadas operaciones registradas en poco tiempo. Por seguridad, espera un minuto."
});

export const criticalLimiter = rateLimit({
    windowMs: 60 * 1000, 
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: saasKeyGenerator,
    handler: limitReachedHandler,
    message: "Operación crítica bloqueada temporalmente por múltiples intentos rápidos. Por favor, espera un minuto."
});