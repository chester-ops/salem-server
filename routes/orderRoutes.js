const express = require("express");
const authController = require("../controllers/authController");
const orderController = require("../controllers/orderController");

const router = express.Router();

router.post(
  "/checkout",
  authController.protect,
  authController.authorize("customer"),
  orderController.checkout
);

router.post("/verifyPayment", orderController.verifyPayment);

module.exports = router;
