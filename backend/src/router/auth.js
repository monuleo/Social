const express = require("express");

const authRouter = express.Router();
const { loginLimiter } = require("../middleware/loginLimiter");
const verifyToken = require("../middleware/verifyToken");
const userMiddleware = require("../middleware/userMiddleware");
const getProfile = require("../controller/usersController").getProfile;

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

module.exports = authRouter;
