const fs = require("fs").promises;
const path = require("path");
const mongoose = require("mongoose");
const catchAsync = require("./catchAsync");
const AppError = require("./appError");

// Get id
exports.getId = (req) => {
  const params = Object.entries(req.params);
  const id = params[params.length - 1][1];
  return id;
};

// Fetch only published documents
exports.filterDocs = function (next) {
  if (!this.options.user || this.options.user.role !== "admin")
    this.find({ published: { $ne: false } }).select("-published");
  next();
};

// Add slug to document
exports.addSlug = function (next) {
  this.slug = this.title.toLowerCase().replace(" ", "-");
  next();
};

// Delete related documents
exports.deleteRelated = (model, field) =>
  async function (doc) {
    let Model;
    if (model) Model = mongoose.model(model);
    if (!doc) return;
    const modelName = doc.constructor.modelName.toLowerCase();
    const options = {};
    options[modelName] = doc._id;
    // Delete documents
    if (Model) await Model.deleteMany(options);
    // Delete image
    if (doc[field] !== `default-${modelName}.jpeg`)
      await fs
        .unlink(path.join(__dirname, `../public/${modelName}s/${doc[field]}`))
        .catch(() => {
          return;
        });
  };

// Update filename
exports.updateFilename = (model, image, fields) =>
  catchAsync(async (req, res, next) => {
    // Get model name
    const modelName = model.modelName.toLowerCase();
    // Fetch document
    const doc = await model.findById(req.params.id, null, { user: req.user });
    // Check if document exists
    if (!doc)
      return next(new AppError(`No ${modelName} found with that ID`, 404));
    // Get old image path
    const oldImagePath = path.join(
      __dirname,
      `../public/${modelName}s/${doc[image]}`
    );
    if (req.file) {
      // Delete previous image
      if (doc[image] !== `default-${modelName}.jpeg`)
        await fs.unlink(oldImagePath).catch(() => {
          return;
        });
      // Set filename
      req.file.filename = (
        req.body[fields.name] ? req.body[fields.name] : doc[fields.slug]
      )
        .toLowerCase()
        .replace(" ", "-");
      req.file.filename += `${modelName === "user" ? `-${doc._id}` : ""}.jpeg`;
      // Update slug
      if (req.body[fields.name] && modelName !== "user")
        req.body[fields.slug] = req.body[fields.name]
          .toLowerCase()
          .replace(" ", "-");
      // Set image field
      req.body[image] = req.file.filename;
      return next();
    }
    if (!req.file && req.body[fields.name]) {
      // Set filename
      const filename =
        req.body[fields.name].toLowerCase().replace(" ", "-") +
        `${modelName === "user" ? `-${doc._id}` : ""}`;
      // Update slug
      if (modelName !== "user") req.body[fields.slug] = filename;
      // Rename image
      if (doc[image] !== `default-${modelName}.jpeg`) {
        await fs
          .rename(
            path.join(oldImagePath),
            path.join(__dirname, `../public/${modelName}s/${filename}.jpeg`)
          )
          .catch(() => {
            return;
          });
        // Update image field
        req.body[image] = `${filename}.jpeg`;
      }
      return next();
    }
    next();
  });

// Set filename
exports.setFilename = (image, name) =>
  catchAsync(async (req, res, next) => {
    // Check for file
    if (req.file && req.body[name]) {
      // Set filename
      req.file.filename =
        req.body[name].toLowerCase().replace(" ", "-") + ".jpeg";
      // Set image field
      req.body[image] = req.file.filename;
      return next();
    }
    next();
  });

// Check if document belongs to user
exports.checkUser = (model, field) =>
  catchAsync(async (req, res, next) => {
    // Get model name
    const modelName = model.modelName;
    // Get id
    const id = this.getId(req);
    // Get document
    const doc = await model.findById(id);
    // Check if document exists
    if (!doc) return next(new AppError(`${modelName} does not exist`, 404));
    // Check if document belongs to current user
    if (req.user.email !== doc[field].email)
      return next(
        new AppError("You are not allowed to perform this action", 401)
      );
    next();
  });
