const mongoose = require("mongoose");
const Product = require("./productModel");

// Review schema
const reviewSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, "Review must have content"],
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, "Review must have a rating"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  product: {
    type: mongoose.Schema.ObjectId,
    ref: "Product",
    required: [true, "Review must have a product"],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Review must have an author"],
  },
});

// Prevent duplicate reviews
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Populate user
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name photo email -_id",
  });
  next();
});

// Get reviews for specific product
reviewSchema.pre("find", function (next) {
  if (this.options.params && this.options.params.id)
    this.find({ product: this.options.params.id }).select("-product");
  next();
});

// Calculate average rating
reviewSchema.statics.calcAverageRating = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: "$product",
        avgRating: { $avg: "$rating" },
      },
    },
  ]);
  let options = {};
  if (stats.length > 0) options = { avgRating: stats[0].avgRating };
  else options = { $unset: { avgRating: "" } };
  // Update average rating
  await Product.findByIdAndUpdate(productId, options);
};

// Update product rating
reviewSchema.post(
  ["save", "findOneAndDelete", "findOneAndUpdate"],
  function (doc) {
    doc.constructor.calcAverageRating(doc.product);
  }
);

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
