import { HTTP_STATUS } from "../constants/httpStatus.js";

export const sendSuccess = (res, data, message = "Success", statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

export const sendError = (res, message = "Error", statusCode = 500, errors = null) => {
    return res.status(statusCode).json({
        success: false,
        message,
        ...(errors && { errors }),
    });
};

export const sendCreated = (res, data, message = "Created successfully") => {
    return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message,
        data,
    });
};

export const sendNotFound = (res, message = "Resource not found") => {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message,
    });
};

export const sendUnauthorized = (res, message = "Unauthorized access") => {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message,
    });
};

export const sendForbidden = (res, message = "Access forbidden") => {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message,
    });
};

export const sendBadRequest = (res, message = "Bad request", errors = null) => {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message,
        ...(errors && { errors }),
    });
};

export const sendConflict = (res, message = "Resource already exists") => {
    return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message,
    });
};

export const sendTooManyRequests = (res, message = "Too many requests") => {
    return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        success: false,
        message,
    });
};
