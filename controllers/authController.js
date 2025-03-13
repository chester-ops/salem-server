const { promisify } = require("util");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Email = require("../utils/email");

// Sign token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};

// Get token
const getToken = (req) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  )
    token = req.headers.authorization.split(" ")[1];
  if (!token && req.cookies.jwt && req.cookies.jwt !== "no-value")
    token = req.cookies.jwt;
  return token;
};

// Send token
const sendToken = (statusCode, res, id, data = undefined) => {
  // Create token
  const token = signToken(id);
  // Cookie options
  const cookieOptions = {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === "production",
  };
  // Add cookie to response
  res.cookie("jwt", token, cookieOptions);
  // Response
  const response = {
    status: "success",
    token,
  };
  // Add data to response if it exists
  if (data) response.data = data;
  // Send response
  res.status(statusCode).json(response);
};

// Signup
exports.signup = catchAsync(async (req, res, next) => {
  // Get fields
  const { password, passwordConfirm, name, email } = req.body;
  // Create user
  const newUser = await User.create({
    role: "customer",
    password,
    passwordConfirm,
    name,
    email,
  });
  // Create data object
  const data = { ...newUser._doc };
  // Remove password and active field
  delete data.password;
  delete data.active;
  // Send response
  sendToken(201, res, newUser._id, data);
});

// Login
exports.login = catchAsync(async (req, res, next) => {
  // Get fields
  const { email, password } = req.body;
  // Check if email and password are empty
  if (!email || !password)
    return next(new AppError("Please provide email and password", 400));
  // Fetch user
  const user = await User.findOne({ email }).select("+password");
  // Verify user
  if (!user || !(await user.verifyPassword(password, user.password)))
    return next(new AppError("Incorrect email or password", 400));
  // Send response
  sendToken(200, res, user._id);
});

// Logout
exports.logout = (req, res, next) => {
  // Overwrite cookie
  res.cookie("jwt", "no-value", {
    maxAge: 10000,
    httpOnly: true,
  });
  // Send response
  res.status(200).json({
    status: "success",
  });
};

// Protect route
exports.protect = catchAsync(async (req, res, next) => {
  // Get token
  const token = getToken(req);
  // Check if token exists
  if (!token) return next(new AppError("Please log in.", 401));
  // Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // Fetch user
  const user = await User.findById(decoded.id);
  // Check if user exists
  if (!user) return next(new AppError("User does not exist", 401));
  // Check if password was changed recently
  if (user.changedPasswordAfter(decoded.iat))
    return next(
      new AppError("Password was changed recently. Please log in again", 401)
    );
  // Grant access to route
  req.user = user;
  next();
});

// Authorize action
exports.authorize =
  (...roles) =>
  (req, res, next) => {
    // Check if user is authorized
    if (!roles.includes(req.user.role))
      return next(
        new AppError("You are not authorized to perform this action", 401)
      );
    next();
  };

// Check if user is logged in
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  // Get token
  const token = getToken(req);
  if (!token) return next();
  // Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // Check if user exists
  const user = await User.findById(decoded.id);
  if (!user) return next();
  // Check if password was changed
  if (user.changedPasswordAfter(decoded.iat)) return next();
  // Set user
  req.user = user;
  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Fetch user
  const user = await User.findOne({ email: req.body.email });
  // Check if user exists
  if (!user) return next(new AppError("Email does not exist", 404));
  // Generate token
  const token = user.createResetPasswordToken();
  // Update user
  await user.save({ validateBeforeSave: false });
  // Construct url
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${token}`;
  // Send email
  try {
    await new Email(user, resetURL).sendPasswordReset();
    // Send response
    res.status(200).json({
      status: "success",
      message: "Please check your email",
    });
  } catch (err) {
    // Update fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // Save user
    await user.save({ validateBeforeSave: false });
    // Return error
    return next(new AppError(err.message, 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get hashed token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  // Fetch user using token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // Set new password if token hasnt expired
  if (!user) return next(new AppError("Token is invalid", 400));
  // Update user
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // Send token
  sendToken(200, res, user._id);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Fetch user
  const user = await User.findById(req.user._id).select("+password");
  // Check fields
  if (!req.body.passwordCurrent || !req.body.password)
    return next(new AppError("Please provide old and new password", 400));
  // Check if old password is correct
  if (!(await user.verifyPassword(req.body.passwordCurrent, user.password)))
    return next(new AppError("Current password is wrong", 400));
  // Update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // Send token
  sendToken(200, res, user._id);
});
