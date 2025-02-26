const factory = require("../utils/handlerFactory");
const Comment = require("../models/commentModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.setFields = (req, res, next) => {
  // Set author and post
  req.body.author = req.user._id;
  if (!req.body.post) req.body.post = req.params.id;
  next();
};

exports.filterFields = catchAsync(async (req, res, next) => {
  // Get comment
  const comment = await Comment.findById(req.params.commentId);
  // Check if comment exists
  if (!comment) return next(new AppError("Comment does not exist", 404));
  // Check if comment belongs to current user
  if (req.user.email !== comment.author.email)
    return next(
      new AppError("You are not allowed to perform this action", 401)
    );
  // Filter fields
  const fields = {};
  if (req.body.text) fields.text = req.body.text;
  req.body = fields;
  next();
});

exports.deleteComment = factory.deleteOne(Comment);

exports.updateComment = factory.updateOne(Comment);

exports.findComment = factory.findOne(Comment);

exports.createComment = factory.createOne(Comment);

exports.findAllComments = factory.findAll(Comment);
