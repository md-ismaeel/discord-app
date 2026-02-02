// src/middleware/errorHandler.js
import { ApiResponse } from "../utils/response.js";
import { ERROR_MESSAGES } from "../constants/errorMessages.js";

export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return ApiResponse.badRequest(res, ERROR_MESSAGES.VALIDATION_ERROR, errors);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return ApiResponse.conflict(res, `${field} already exists`);
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    return ApiResponse.badRequest(res, "Invalid ID format");
  }

  // Custom API errors
  if (err.statusCode) {
    return ApiResponse.error(res, err.message, err.statusCode, err.errors);
  }

  // Default server error
  return ApiResponse.error(
    res,
    ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    500
  );
};