const Review = require("../models/reviewModel");
const factory = require("../utils/handlerFactory");
const { checkUser } = require("../utils/helpers");

exports.setFields = (req, res, next) => {
  // Set user and product
  req.body.user = req.user._id.toString();
  if (!req.body.product) req.body.product = req.params.id;
  next();
};

exports.checkUser = checkUser(Review, "user");

exports.createReview = factory.createOne(Review);

exports.findAllReviews = factory.findAll(Review);

exports.findReview = factory.findOne(Review);

exports.deleteReview = factory.deleteOne(Review);

exports.updateReview = factory.updateOne(Review);
