const factory = require("../utils/handlerFactory");
const Post = require("../models/postModel");
const { upload } = require("../utils/image");
const { setFilename, updateFilename } = require("../utils/helpers");

exports.uploadImage = upload.single("image");

exports.setFilename = setFilename("image", "title");

exports.updateFilename = updateFilename(Post, "image", {
  name: "title",
  slug: "slug",
});

exports.setUser = (req, res, next) => {
  req.body.author = req.user._id.toString();
  next();
};

exports.createPost = factory.createOne(Post);

exports.deletePost = factory.deleteOne(Post);

exports.findPost = factory.findOne(Post);

exports.updatePost = factory.updateOne(Post);

exports.findAllPosts = factory.findAll(Post);
