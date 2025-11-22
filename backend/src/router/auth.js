const express = require("express");

const authRouter = express.Router();
const { loginLimiter } = require("../middleware/loginLimiter");
const verifyToken = require("../middleware/verifyToken");
const userMiddleware = require("../middleware/userMiddleware");
const { getProfile, updateProfile } = require("../controller/usersController");
const { upload } = require("../middleware/multer");

const {
  signup,
  login,
  checkAuth,
  logout,
} = require("../controller/authController");

authRouter.post("/signup", signup);
authRouter.post("/login", loginLimiter, login);
authRouter.post("/logout", verifyToken, logout);
authRouter.get("/check-auth", verifyToken, checkAuth);

authRouter.get("/profile", userMiddleware, getProfile);
authRouter.put(
  "/profile",
  userMiddleware,
  (req, res, next) => {
    upload.single("profilePicture")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "File upload error",
        });
      }
      next();
    });
  },
  updateProfile
);

module.exports = authRouter;
