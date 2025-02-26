const mongoose = require("mongoose");
const sharp = require("sharp");
const Comment = require("../models/commentModel");
const path = require("path");
const fs = require("fs").promises;

// Resize and save image
const saveImage = async (file) => {
  await sharp(file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/posts/${file.filename}`);
};

// Post schema
const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Post must have a title"],
      unique: true,
      set: (value) => {
        const newValue = value
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        return newValue;
      },
    },
    content: {
      type: String,
      required: [true, "Post must have content"],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    published: {
      type: Boolean,
      default: false,
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Post must belong to an author"],
    },
    image: {
      type: String,
      default: "default-post.jpg",
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Slug
postSchema.virtual("slug").get(function () {
  return this.title.toLowerCase().replace(" ", "-");
});

// Comments
postSchema.virtual("comments", {
  ref: "Comment",
  foreignField: "post",
  localField: "_id",
});

// Populate comments
postSchema.pre("findOne", function (next) {
  this.populate({ path: "comments", select: "text author -post" });
  next();
});

// Populate author
postSchema.pre(/^find/, function (next) {
  if (!this.options.user || this.options.user.role !== "admin") {
    this.find({ published: { $ne: false } });
  }
  this.populate({
    path: "author",
    select: "name email -_id",
  });
  next();
});

// Save image on update
postSchema.pre("findOneAndUpdate", async function (next) {
  if (this.options && this.options.file) await saveImage(this.options.file);
  next();
});

// Save image on create
postSchema.pre("save", async function (next) {
  if (this.file) await saveImage(this.file);
  this.file = undefined;
  next();
});

// Delete image and comments
postSchema.pre("findOneAndDelete", async function (next) {
  const post = await Post.findById(this.getQuery()._id);
  if (!post) return next();
  // Delete comments
  await Comment.deleteMany({ post: post._id });
  // Delete image
  await fs
    .unlink(path.join(__dirname, `../public/posts/${post.image}`))
    .catch(() => {
      return;
    });
  next();
});

// Post model
const Post = mongoose.model("Post", postSchema);

module.exports = Post;
