const User = require("../models/userModel");
const factory = require("../utils/handlerFactory");
const catchAsync = require("../utils/catchAsync");
const { upload } = require("../utils/image");
const { updateFilename } = require("../utils/helpers");

exports.uploadPhoto = upload.single("photo");

exports.deleteProfile = catchAsync(async (req, res, next) => {
  // Update user status
  await User.findByIdAndUpdate(req.user._id, { active: false });
  // Send response
  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.setUser = (req, res, next) => {
  // Set user id
  req.params.id = req.user._id.toString();
  next();
};

exports.updateFilename = updateFilename(User, "photo", {
  name: "name",
  slug: "name",
});

exports.findAllUsers = factory.findAll(User);

exports.findUser = factory.findOne(User);

exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);
