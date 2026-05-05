export const errorHandler = (err, req, res, next) => {
    console.error(`[Error Log]: ${err.stack}`);
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal server error",
        stack: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
};
 