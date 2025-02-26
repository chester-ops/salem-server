const mongoose = require("mongoose");
const app = require("./app");

// Uncaught exception
process.on("uncaughtException", (err) => {
  console.log("Uncaught exception!, Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

// Connect to db
const DB = process.env.DB.replace("<PASSWORD>", process.env.DB_PASSWORD);
mongoose.connect(DB).then(() => console.log("DB connection successful."));

// Start server
const server = app.listen(process.env.PORT || 8000, () => {
  console.log(`App running on port ${process.env.PORT || 8000}...`);
});

// Unhandled rejection
process.on("unhandledRejection", (err) => {
  console.log("Unhandled rejection!, Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
