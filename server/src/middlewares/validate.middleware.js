// src/middlewares/validate.middleware.js
export const validate = (schema) => {
    return (req, res, next) => {
        try {
            // Parse and validate
            schema.parse(req.body);
            next();
        } catch (error) {
            console.log("❌ Validation Error:", error);
            console.log("Error type:", typeof error);
            console.log("Error constructor:", error?.constructor?.name);
            console.log("Has errors property:", 'errors' in error);
            console.log("Errors value:", error?.errors);
            
            // Handle Zod errors safely
            if (error && error.errors && Array.isArray(error.errors)) {
                const formattedErrors = error.errors.map((err) => ({
                    field: Array.isArray(err.path) ? err.path.join('.') : 'unknown',
                    message: err.message || 'Validation error',
                }));
                
                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: formattedErrors,
                });
            }
            
            // Fallback for other errors
            return res.status(400).json({
                success: false,
                message: error?.message || "Validation failed",
            });
        }
    };
};