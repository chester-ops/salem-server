const factory = require("../utils/handlerFactory");
const Post = require("../models/postModel");
const multer = require("multer");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const fs = require("fs").promises;
const path = require("path");

// Memory storage
const storage = multer.memoryStorage();

// Filter files that are not images
const fileFilter = (req, file, cb) => {
  // Success
  if (file.mimetype.startsWith("image")) return cb(null, true);
  // Return error
  cb(new AppError("Please upload an image.", 400), false);
};

// Set storage and filter
const upload = multer({
  storage,
  fileFilter,
});

// Upload post image
exports.uploadImage = upload.single("image");

exports.setFilename = catchAsync(async (req, res, next) => {
  let post;
  let oldImagePath;
  // Check for update
  if (req.params.id) {
    // Fetch post
    post = await Post.findById(req.params.id);
    // Check if post exists
    if (!post) return next(new AppError("No post found with that ID", 404));
    // Set old image path
    oldImagePath = path.join(__dirname, `../public/posts/${post.image}`);
  } else {
    // Set author of post to logged in user for new post
    req.body.author = req.user._id;
  }
  // Check if file exists
  if (req.file) {
    // Check for update
    if (req.params.id) {
      // Delete previous image
      await fs.unlink(oldImagePath).catch(() => {
        return;
      });
    }
    // Set filename
    req.file.filename = req.body.title
      ? req.body.title.toLowerCase().replace(" ", "-")
      : post.slug;
    req.file.filename += ".jpeg";
    // Set image field
    req.body.image = req.file.filename;
    return next();
  }
  // Rename old image if title exists
  if (req.params.id && req.body.title) {
    const filename = req.body.title.toLowerCase().replace(" ", "-") + ".jpeg";
    // Rename image
    await fs
      .rename(
        path.join(oldImagePath),
        path.join(__dirname, `../public/posts/${filename}`)
      )
      .catch(() => {
        return;
      });
    // Set image field
    req.body.image = filename;
    return next();
  }
  next();
});

exports.createPost = factory.createOne(Post);

exports.deletePost = factory.deleteOne(Post);

exports.findPost = factory.findOne(Post);

exports.updatePost = factory.updateOne(Post);

exports.findAllPosts = factory.findAll(Post);
