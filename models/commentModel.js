const mongoose = require("mongoose");

// Comment schema
const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Comment must have an author"],
  },
  post: {
    type: mongoose.Schema.ObjectId,
    ref: "Post",
    required: [true, "Comment must have a post"],
  },
  text: {
    type: String,
    required: [true, "Comment must have content"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
});

// Populate comment author
commentSchema.pre(/^find/, function (next) {
  this.populate({ path: "author", select: "name email -_id" });
  next();
});

// Get comments for specific post
commentSchema.pre("find", function (next) {
  if (this.options.params && this.options.params.id)
    this.find({ post: this.options.params.id }).select("-post");
  next();
});

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
