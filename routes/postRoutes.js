const express = require("express");
const postController = require("../controllers/postController");
const authController = require("../controllers/authController");
const commentRouter = require("../routes/commentRoutes");

const router = express.Router();

router.use("/:id/comments", commentRouter);

router
  .route("/")
  .get(postController.findAllPosts)
  .post(
    authController.protect,
    authController.authorize("admin"),
    postController.uploadImage,
    postController.setFilename,
    postController.createPost
  );

router
  .route("/:id")
  .patch(
    authController.protect,
    authController.authorize("admin"),
    postController.uploadImage,
    postController.setFilename,
    postController.updatePost
  )
  .delete(
    authController.protect,
    authController.authorize("admin"),
    postController.deletePost
  )
  .get(authController.isLoggedIn, postController.findPost);

module.exports = router;
