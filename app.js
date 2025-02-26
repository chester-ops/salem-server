const express = require("express");
const morgan = require("morgan");
const AppError = require("./utils/appError");
const ErrorHandler = require("./utils/errorHandler");
const dotenv = require("dotenv");

// Routers
const postRouter = require("./routes/postRoutes");
const userRouter = require("./routes/userRoutes");
const commentRouter = require("./routes/commentRoutes");
const cookieParser = require("cookie-parser");

// Set config file
dotenv.config({
  path: `${__dirname}/config.env`,
});

// Start express app
const app = express();

// Logging
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// Body parser
app.use(express.json({ limit: "10kb" }));

// Cookie parser
app.use(cookieParser());

// Routes
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/comments", commentRouter);

// Not found route
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`));
});

// Global error handler
app.use(ErrorHandler);

module.exports = app;
