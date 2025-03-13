const express = require("express");
const filter = require("../utils/filter");
const authController = require("../controllers/authController");
const reviewController = require("../controllers/reviewController");

const allowedFields = ["content", "rating"];

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(reviewController.findAllReviews)
  .post(
    authController.protect,
    authController.authorize("customer"),
    filter("product", ...allowedFields),
    reviewController.setFields,
    reviewController.createReview
  );

router
  .route("/:reviewId")
  .get(reviewController.findReview)
  .patch(
    authController.protect,
    reviewController.checkUser,
    filter(...allowedFields),
    reviewController.updateReview
  )
  .delete(
    authController.protect,
    authController.authorize("admin"),
    reviewController.deleteReview
  );

module.exports = router;
