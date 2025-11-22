const User = require("../models/User.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const {
  generateTokenAndSetCookie,
} = require("../utils/generateTokenAndSetCookie");
const validate = require("../utils/validator");

const signup = async (req, res) => {
  validate(req.body);

  const { emailId, username, password, role, bio } = req.body;
  try {
    if (!emailId || !username || !password) {
      throw new Error("All fields are required");
    }

    const userAlreadyExists = await User.findOne({ emailId });

    if (userAlreadyExists) {
      return res
        .status(400)
        .json({ success: false, message: "User already Exist" });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    // 12345 => Not readable

    const user = new User({
      emailId,
      password: hashPassword,
      username,
      role,
      bio,
    });

    await user.save();
    // await sendVerificationEmail(user.emailId, verificationToken);

    // jwt
    generateTokenAndSetCookie(res, user._id, user.role);

    res.status(201).json({
      success: true,
      message: "User created succefully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
    console.log("Error Occures while singup : ", err.message);
  }
};

const login = async (req, res) => {
  validate(req.body);
  const { emailId, password } = req.body;

  try {
    const user = await User.findOne({ emailId });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // comparing the password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    generateTokenAndSetCookie(res, user._id, user.role);
    await user.save();

    res.status(201).json({
      sucess: true,
      message: "Logged in Sucessfully",
      user: { ...user._doc, password: undefined },
    });
  } catch (error) {
    console.log("Error in login", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const logout = async (req, res) => {
  // we will add Blocked Tokens into reddis here
  // passport example for reddis
  try {
    const token = req.cookies?.token;

    const payload = jwt.decode(token);
    // console.log(payload);

    res.cookie("token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      expires: new Date(0),
    });
    res.status(200).json({ success: true, message: "Logout is successfull" });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("Error in checkAuth ", error);
    res.status(400).json({
      success: false,
      message: error.message,
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  }
};

const adminRegister = async (req, res) => {
  try {
    validate(req.body);

    const { emailId, password, firstName } = req.body;

    if (!emailId || !password || !firstName)
      throw new Error("All fields are required");

    const userAlreadyExists = await User.findOne({ emailId });
    if (userAlreadyExists) {
      return res
        .status(400)
        .json({ sucess: false, message: "User Already Exists" });
    }

    // Hashing the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const user = new User({
      emailId,
      password: hashedPassword,
      firstName,
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      role: "admin",
    });

    await user.save();

    // await sendVerificationEmail(user.emailId, verificationToken)

    // JWT Token
    generateTokenAndSetCookie(res, user._id, "admin");
    res.status(201).json({
      sucess: true,
      message: "Created Sucessfully",
      user: { ...user._doc, password: undefined },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteProfile = async (req, res) => {
  try {
    const userId = req.userId; // Get userId from middleware

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete user submissions first
    await Submission.deleteMany({ userId });

    // Delete user's social interactions (likes, favorites, comments)
    await Like.deleteMany({ user: userId });
    await Favorite.deleteMany({ user: userId });
    await Comment.deleteMany({ user: userId });

    // Finally delete the user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Google Authentication

module.exports = {
  signup,
  login,
  logout,
  checkAuth,
  adminRegister,
  deleteProfile,
};
