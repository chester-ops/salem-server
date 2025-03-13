const mongoose = require("mongoose");
const { save } = require("../utils/image");
const { addSlug, filterDocs, deleteRelated } = require("../utils/helpers");

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
      default: "default-post.jpeg",
    },
    slug: String,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexing fields
postSchema.index({ author: 1, createdAt: -1 });

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
  this.populate({
    path: "author",
    select: "name email -_id",
  });
  next();
});

// Add slug
postSchema.pre("save", addSlug);

// Retrieve published posts
postSchema.pre(["find", "findOne"], filterDocs);

// Delete image and comments
postSchema.post("findOneAndDelete", deleteRelated("Comment", "image"));

// Save image
postSchema.post(["findOneAndUpdate", "save"], async function () {
  const file = this.options?.file || this.file;
  if (!file) return;
  await save(file, { width: 440, height: 260 }, 100, "posts");
});

// Post model
const Post = mongoose.model("Post", postSchema);

module.exports = Post;
