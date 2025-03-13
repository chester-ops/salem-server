const express = require("express");
const filter = require("../utils/filter");
const authController = require("../controllers/authController");
const productController = require("../controllers/productController");
const reviewRouter = require("../routes/reviewRoutes");

const allowedFields = [
  "title",
  "price",
  "discount",
  "published",
  "featured",
  "description",
  "image",
];

const router = express.Router();

router.use("/:id/reviews", reviewRouter);

router.get(
  "/featured",
  productController.setFeatured,
  authController.isLoggedIn,
  productController.findAllProducts
);

router
  .route("/")
  .get(authController.isLoggedIn, productController.findAllProducts)
  .post(
    authController.protect,
    authController.authorize("admin"),
    productController.uploadImage,
    filter(...allowedFields),
    productController.setFilename,
    productController.createProduct
  );

router
  .route("/:id")
  .get(authController.isLoggedIn, productController.findProduct)
  .patch(
    authController.protect,
    authController.authorize("admin"),
    productController.uploadImage,
    filter(...allowedFields),
    productController.updateFilename,
    productController.updateProduct
  )
  .delete(
    authController.protect,
    authController.authorize("admin"),
    productController.deleteProduct
  );

module.exports = router;
