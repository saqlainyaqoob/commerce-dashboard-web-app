// Centralized error handler - every controller calls next(err) on failure
// and it lands here instead of each route writing its own try/catch reply.
module.exports = function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
};
