// src/middleware/validate.middleware.js
export const validate = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            // Check if it's a Zod error
            if (error.errors && Array.isArray(error.errors)) {
                const errors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                
                return res.status(400).json({ 
                    success: false,
                    error: "Validation failed", 
                    details: errors 
                });
            }
            
            // If not a Zod error, return generic error
            return res.status(400).json({
                success: false,
                error: error.message || "Validation failed"
            });
        }
    };
};