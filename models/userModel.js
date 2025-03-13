const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { save } = require("../utils/image");
const { deleteRelated } = require("../utils/helpers");

// User schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    set: (value) => {
      const newValue = value
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      return newValue;
    },
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    validate: {
      validator: function (value) {
        return /\S+@\S+\.\S+/.test(value);
      },
      message: "Email is invalid",
    },
  },
  role: {
    type: String,
    enum: ["customer", "admin"],
    default: "customer",
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    select: false,
    minLength: [8, "Password should be at least 8 characters"],
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (value) {
        return value === this.password;
      },
      message: "Passwords do not match",
    },
  },
  photo: {
    type: String,
    default: "default-user.jpeg",
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  passwordChangedAt: {
    type: Date,
    select: false,
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },
});

// Encrypt password on save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // Hash password
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  // Updating password changed time
  if (!this.isNew) this.passwordChangedAt = Date.now();
  next();
});

// Save photo
userSchema.pre("findOneAndUpdate", async function (next) {
  const file = this.options?.file;
  if (file) await save(file, { width: 450, height: 450 }, 100, "users");
  next();
});

// Delete user photo
userSchema.post("findOneAndDelete", deleteRelated(undefined, "photo"));

// Fetch active users
userSchema.pre(["find", "findOne"], function (next) {
  if (!this.options.user || this.options.user.role !== "admin")
    this.find({ active: { $ne: false } }).select("-active");
  next();
});

// Verify password
userSchema.methods.verifyPassword = async function (password, dbPassword) {
  return await bcrypt.compare(password, dbPassword);
};

// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function (time) {
  // Check if field exists
  if (this.passwordChangedAt) {
    // Convert date
    const changedTime = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    // Compare values
    return time < changedTime;
  }
  // Default return
  return false;
};

// Generate reset password token
userSchema.methods.createResetPasswordToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return token;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
