
//  api error for handling errors
export const createApiError = (statusCode, message, errors = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (errors) error.errors = errors;
  error.success = false;
  return error;
};