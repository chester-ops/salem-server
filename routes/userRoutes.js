const express = require("express");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const filter = require("../utils/filter");

const allowedFields = ["name", "photo", "email"];

const router = express.Router();

router.post("/login", authController.login);

router.post("/signup", authController.signup);

router.get("/logout", authController.logout);

router.post("/forgotPassword", authController.forgotPassword);

router.patch("/resetPassword/:token", authController.resetPassword);

router.use(authController.protect);

router.patch("/updatePassword", authController.updatePassword);

router.get("/getProfile", userController.setUser, userController.findUser);

router.delete("/deleteProfile", userController.deleteProfile);

router.patch(
  "/updateProfile",
  userController.uploadPhoto,
  filter(...allowedFields),
  userController.setUser,
  userController.updateFilename,
  userController.updateUser
);

router.use(authController.authorize("admin"));

router.get("/", userController.findAllUsers);

router
  .route("/:id")
  .get(userController.findUser)
  .patch(
    userController.uploadPhoto,
    filter("role", "active", ...allowedFields),
    userController.updateFilename,
    userController.updateUser
  )
  .delete(userController.deleteUser);

module.exports = router;
