const AppError = require("./appError");

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
  console.log("Error:", err);
  // Send response
  res.status(500).json({
    status: "error",
    message: "Something went wrong",
  });
};

// Global error middleware
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    // Send dev response
    devError(err, res, req);
  } else if (process.env.NODE_ENV === "production") {
    let error;
    // Custom errors
    switch (err.name) {
      case "CastError":
        error = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
        break;
      case "ValidationError":
        error = new AppError(
          `Invalid input data: ${Object.values(err.errors)
            .map((error) => error.message)
            .join(", ")}.`,
          400
        );
        break;
      case "JsonWebTokenError":
        error = new AppError(`Invalid token`, 401);
        break;
      case "TokenExpiredError":
        error = new AppError("Token has expired", 401);
        break;
      default:
        switch (err.code) {
          case 11000:
            error = new AppError(
              `Duplicate field value: ${
                err.errmsg.match(/(["'])(\\?.)*?\1/)[0]
              }`,
              400
            );
            break;
          default:
        }
    }
    const mainError = error ? error : err;
    // Send prod response
    prodError(mainError, res, req);
  }
};
