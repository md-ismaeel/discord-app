// export class ApiResponse {
//     static success(res, data, message = "Success", statusCode = 200) {
//         return res.status(statusCode).json({
//             success: true,
//             message,
//             data,
//         });
//     }

//     static error(res, message = "Error", statusCode = 500, errors = null) {
//         return res.status(statusCode).json({
//             success: false,
//             message,
//             ...(errors && { errors }),
//         });
//     }

//     static created(res, data, message = "Created successfully") {
//         return res.status(201).json({
//             success: true,
//             message,
//             data,
//         });
//     }

//     static notFound(res, message = "Resource not found") {
//         return res.status(404).json({
//             success: false,
//             message,
//         });
//     }

//     static unauthorized(res, message = "Unauthorized access") {
//         return res.status(401).json({
//             success: false,
//             message,
//         });
//     }

//     static forbidden(res, message = "Access forbidden") {
//         return res.status(403).json({
//             success: false,
//             message,
//         });
//     }

//     static badRequest(res, message = "Bad request", errors = null) {
//         return res.status(400).json({
//             success: false,
//             message,
//             ...(errors && { errors }),
//         });
//     }

//     static conflict(res, message = "Resource already exists") {
//         return res.status(409).json({
//             success: false,
//             message,
//         });
//     }
// }



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
    return res.status(201).json({
        success: true,
        message,
        data,
    });
};

export const sendNotFound = (res, message = "Resource not found") => {
    return res.status(404).json({
        success: false,
        message,
    });
};

export const sendUnauthorized = (res, message = "Unauthorized access") => {
    return res.status(401).json({
        success: false,
        message,
    });
};

export const sendForbidden = (res, message = "Access forbidden") => {
    return res.status(403).json({
        success: false,
        message,
    });
};

export const sendBadRequest = (res, message = "Bad request", errors = null) => {
    return res.status(400).json({
        success: false,
        message,
        ...(errors && { errors }),
    });
};

export const sendConflict = (res, message = "Resource already exists") => {
    return res.status(409).json({
        success: false,
        message,
    });
};