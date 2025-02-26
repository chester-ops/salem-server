const express = require("express");
const commentController = require("../controllers/commentController");
const authController = require("../controllers/authController");

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route("/")
  .get(commentController.findAllComments)
  .post(commentController.setFields, commentController.createComment);

router
  .route("/:commentId")
  .get(commentController.findComment)
  .patch(commentController.filterFields, commentController.updateComment)
  .delete(authController.authorize("admin"), commentController.deleteComment);

module.exports = router;
