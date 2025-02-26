const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// User schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
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
    default: "default-user.jpg",
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  passwordChangedAt: Date,
});

// Encrypt password on save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // Hash password
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  // Updating password changed time
  if (!this.isNew) {
    this.passwordChangedAt = Date.now();
  }
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

const User = mongoose.model("User", userSchema);

module.exports = User;
