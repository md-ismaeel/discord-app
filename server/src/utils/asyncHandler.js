// src/utils/asyncHandler.js

// export const asyncHandler = (fn) => {
//   return (req, res, next) => {
//     Promise.resolve(fn(req, res, next)).catch(next);
//   };
// };

/**
 * Wraps async route handlers to catch errors and pass them to Express error middleware
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn) => {
  // Validate that fn is actually a function
  if (typeof fn !== 'function') {
    throw new TypeError('asyncHandler requires a function');
  }

  return (req, res, next) => {
    // Ensure fn returns a promise and catch any errors
    Promise.resolve(fn(req, res, next))
      .catch((error) => {
        // Pass error to Express error handling middleware
        next(error);
      });
  };
};