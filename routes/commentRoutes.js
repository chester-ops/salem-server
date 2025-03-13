const express = require("express");
const commentController = require("../controllers/commentController");
const authController = require("../controllers/authController");
const filter = require("../utils/filter");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(commentController.findAllComments)
  .post(
    authController.protect,
    filter("text", "post"),
    commentController.setFields,
    commentController.createComment
  );

router
  .route("/:commentId")
  .get(commentController.findComment)
  .patch(
    authController.protect,
    commentController.checkUser,
    filter("text"),
    commentController.updateComment
  )
  .delete(
    authController.protect,
    authController.authorize("admin"),
    commentController.deleteComment
  );

module.exports = router;
