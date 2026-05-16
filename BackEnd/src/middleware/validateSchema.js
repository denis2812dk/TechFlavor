export const validateSchema = (schema) => async (req, res, next) => {
    try {
        req.body = await schema.parseAsync(req.body);
        next();
    } catch (error) {
        const issues = error.issues || error.errors || [];

        return res.status(400).json({
            success: false,
            message: "Errores de validacion en los datos enviados.",
            errors: issues.map((err) => ({
                campo: err.path?.join(".") || "body",
                mensaje: err.message,
            })),
        });
    }
};
