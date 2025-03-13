const factory = require("../utils/handlerFactory");
const Comment = require("../models/commentModel");
const { checkUser } = require("../utils/helpers");

exports.setFields = (req, res, next) => {
  // Set author and post
  req.body.author = req.user._id;
  if (!req.body.post) req.body.post = req.params.id;
  next();
};

exports.checkUser = checkUser(Comment, "author");

exports.deleteComment = factory.deleteOne(Comment);

exports.updateComment = factory.updateOne(Comment);

exports.findComment = factory.findOne(Comment);

exports.createComment = factory.createOne(Comment);

exports.findAllComments = factory.findAll(Comment);
