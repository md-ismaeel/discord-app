import { sendError, sendBadRequest, sendConflict } from "../utils/response.js";
import { ERROR_MESSAGES } from "../constants/errorMessages.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

export const errorHandler = (err, req, res, next) => {
    console.error("Error:", err);

    // Mongoose validation error
    if (err.name === "ValidationError") {
        const errors = Object.values(err.errors).map((e) => e.message);
        return sendBadRequest(res, ERROR_MESSAGES.VALIDATION_ERROR, errors);
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return sendConflict(res, `${field} already exists`);
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === "CastError") {
        return sendBadRequest(res, "Invalid ID format");
    }

    // Custom API errors
    if (err.statusCode) {
        return sendError(res, err.message, err.statusCode, err.errors);
    }

    // Default server error
    return sendError(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
};