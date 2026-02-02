//  

// export class ApiError extends Error {
//   constructor(statusCode, message, errors = null) {
//     super(message);
//     this.statusCode = statusCode;
//     this.errors = errors;
//     this.success = false;

//     Error.captureStackTrace(this, this.constructor);
//   }
// }

//  api error for handling errors
export const createApiError = (statusCode, message, errors = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.errors = errors;
  error.success = false;
  return error;
};