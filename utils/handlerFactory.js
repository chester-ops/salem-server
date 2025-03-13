const ApiFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { isValidObjectId } = require("mongoose");
const { getId } = require("../utils/helpers");

// Delete document
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // Get model name
    const modelName = Model.modelName.toLowerCase();
    // Get id
    const id = getId(req);
    // Find and delete document
    const doc = await Model.findByIdAndDelete(id);
    // Return error if document doesnt exist
    if (!doc)
      return next(new AppError(`No ${modelName} found with that name.`, 404));
    // Send response
    res.status(204).json({
      status: "success",
      data: null,
    });
  });

// Create document
exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // New document
    const newDoc = new Model(req.body);
    // Check for file
    if (req.file) newDoc.file = req.file;
    await newDoc.save();
    // Send response
    res.status(201).json({
      status: "success",
      data: {
        data: newDoc,
      },
    });
  });

// Find document
exports.findOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // Get model name
    const modelName = Model.modelName.toLowerCase();
    let doc;
    // Set options
    const options = {};
    if (req.user) options.user = req.user;
    // Get id or slug
    const id = getId(req);
    // Find document
    if (!isValidObjectId(id))
      // Using slug
      doc = await Model.findOne({ slug: id }, null, options);
    // Using id
    else doc = await Model.findById(id, null, options);
    // Return error if document doesnt exist
    if (!doc)
      return next(new AppError(`No ${modelName} found with that ID`, 404));
    // Send response
    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

// Update document
exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // Get model name
    const modelName = Model.modelName.toLowerCase();
    // Set options
    const options = {
      new: true,
      runValidators: true,
    };
    // Check for file
    if (req.file) options.file = req.file;
    // Get id
    const id = getId(req);
    // Fetch document
    const doc = await Model.findByIdAndUpdate(id, req.body, options);
    // Check if document exists
    if (!doc)
      return next(new AppError(`No ${modelName} found with that ID`, 404));
    // Send response
    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

// Find all documents
exports.findAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // Construct query
    const features = new ApiFeatures(
      Model.find({}, null, { params: req.params, user: req.user }),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // Execute query
    const docs = await features.query;
    // Send response
    res.status(200).json({
      status: "success",
      length: docs.length,
      data: {
        data: docs,
      },
    });
  });
