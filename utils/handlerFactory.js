const ApiFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// Get id
const getId = (req) => {
  const params = Object.entries(req.params);
  const id = params[params.length - 1][1];
  return id;
};

// Delete document
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // Find and delete document
    const doc = await Model.findByIdAndDelete(getId(req));
    // Return error if document doesnt exist
    if (!doc)
      return next(new AppError(`No document found with that name.`, 404));
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
    // Find document
    const doc = await Model.findById(getId(req), null, { user: req.user });
    // Return error if document doesnt exist or user isnt permitted
    if (!doc) return next(new AppError(`No document found with that ID`, 404));
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
    // Fetch document
    const doc = await Model.findByIdAndUpdate(getId(req), req.body, {
      file: req.file,
      new: true,
      runValidators: true,
    });
    // Check if document exists
    if (!doc) return next(new AppError("No document found with that ID", 404));
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
    // Get filter
    let filter = {};
    if (req.filter) filter = { ...req.filter };
    // Construct query
    const features = new ApiFeatures(
      Model.find(filter, null, { params: req.params }),
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
