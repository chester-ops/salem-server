const mongoose = require("mongoose");
const { addSlug, filterDocs, deleteRelated } = require("../utils/helpers");
const { save } = require("../utils/image");

// Product schema
const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Product must have a title"],
      unique: true,
      set: (value) => {
        const newValue = value
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        return newValue;
      },
    },
    price: {
      type: Number,
      required: [true, "Product must have a price"],
    },
    avgRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    discount: {
      type: Number,
      validate: {
        validator: function (value) {
          return value < this.price;
        },
        message: "Discount price ({VALUE}) is invalid",
      },
    },
    published: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },
    image: {
      type: String,
      default: "default-product.jpeg",
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    slug: String,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexing fields
productSchema.index({ price: 1, avgRating: -1, discount: -1, createdAt: -1 });

// Reviews
productSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "product",
  localField: "_id",
});

// Populate reviews
productSchema.pre("findOne", function (next) {
  this.populate({ path: "reviews", select: "content rating user -product" });
  next();
});

// Retrieve published products
productSchema.pre(["find", "findOne"], filterDocs);

// Add slug
productSchema.pre("save", addSlug);

// Delete image and reviews
productSchema.post("findOneAndDelete", deleteRelated("Review", "image"));

// Save image
productSchema.post(["findOneAndUpdate", "save"], async function () {
  const file = this.options?.file || this.file;
  if (!file) return;
  await save(file, { width: 250, height: 300 }, 100, "products");
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
