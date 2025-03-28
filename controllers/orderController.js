const catchAsync = require("../utils/catchAsync");
const crypto = require("crypto");

exports.checkout = catchAsync(async (req, res, next) => {
  // Send request
  const data = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: req.user.email,
      amount: req.body.amount,
      callback_url: "https://www.google.com",
      metadata: {
        email: req.user.email,
        phone: req.body.phone,
        cart: req.body.cart,
      },
    }),
  });
  // Get data
  const response = await data.json();
  // Send response
  res.status(response.status ? 200 : 500).json({
    data: response,
  });
});

exports.verifyPayment = (req, res, next) => {
  // Verify payment signature
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET)
    .update(req.rawBody)
    .digest("hex");
  if (hash === req.headers["x-paystack-signature"]) {
    const event = req.body;
    if (event.event === "charge.success") {
      // Create order
      console.log(event.data);
    }
  }
  next();
};
