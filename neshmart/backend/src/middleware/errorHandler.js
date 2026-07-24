// Centralized error handler - keep last in the middleware chain
function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.originalUrl} ->`, err.message);

  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'Something went wrong. Please try again.'
    : err.message;

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
