export const validateSchema = (schema) => async (req, res, next) => {
    try {
        req.body = await schema.parseAsync(req.body);
        next();
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Errores de validación en los datos enviados.",
            errors: error.errors.map(err => ({
                campo: err.path.join('.'),
                mensaje: err.message
            }))
        });
    }
};