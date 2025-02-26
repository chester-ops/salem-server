// Development error
const devError = (err, res, req) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Production error
const prodError = (err, res, req) => {
  // Operational error
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Programming or unknown error
  console.error("Error", err);
  // Send message
  return res.status(500).json({
    status: "error",
    message: "Something went wrong",
  });
};

// Global error middleware
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    devError(err, res, req);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    error.message = err.message;
    prodError(error, res, req);
  }
};
