const Product = require("../models/productModel");
const factory = require("../utils/handlerFactory");
const { setFilename, updateFilename } = require("../utils/helpers");
const { upload } = require("../utils/image");

exports.setFeatured = (req, res, next) => {
  // Set query
  req.query.featured = "true";
  req.query.limit = "5";
  next();
};

exports.setFilename = setFilename("image", "title");

exports.updateFilename = updateFilename(Product, "image", {
  name: "title",
  slug: "slug",
});

exports.uploadImage = upload.single("image");

exports.createProduct = factory.createOne(Product);

exports.updateProduct = factory.updateOne(Product);

exports.deleteProduct = factory.deleteOne(Product);

exports.findProduct = factory.findOne(Product);

exports.findAllProducts = factory.findAll(Product);
