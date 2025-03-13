const express = require("express");
const postController = require("../controllers/postController");
const authController = require("../controllers/authController");
const commentRouter = require("../routes/commentRoutes");
const filter = require("../utils/filter");

const allowedFields = ["title", "content", "published", "image"];

const router = express.Router();

router.use("/:id/comments", commentRouter);

router
  .route("/")
  .get(authController.isLoggedIn, postController.findAllPosts)
  .post(
    authController.protect,
    authController.authorize("admin"),
    postController.uploadImage,
    filter(...allowedFields),
    postController.setUser,
    postController.setFilename,
    postController.createPost
  );

router
  .route("/:id")
  .patch(
    authController.protect,
    authController.authorize("admin"),
    postController.uploadImage,
    filter(...allowedFields),
    postController.updateFilename,
    postController.updatePost
  )
  .delete(
    authController.protect,
    authController.authorize("admin"),
    postController.deletePost
  )
  .get(authController.isLoggedIn, postController.findPost);

module.exports = router;
