const User = require("../models/User.model");

// Middleware to check if user is Admin or Owner
// Must be used after userMiddleware (which sets req.result)
const isAdminOrOwner = async (req, res, next) => {
  try {
    // Check if userMiddleware was used (req.result should exist)
    if (!req.result) {
      // If req.result doesn't exist, try to get user from req.userId
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - Please authenticate first",
        });
      }
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }
      req.result = user;
    }

    const userRole = req.result.role;

    // Check if user is admin or owner
    if (userRole !== "admin" && userRole !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Forbidden - Admin or Owner access required",
      });
    }

    next();
  } catch (error) {
    console.log("Error in isAdminOrOwner:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Middleware to check if user is Owner only
// Must be used after userMiddleware (which sets req.result)
const isOwner = async (req, res, next) => {
  try {
    // Check if userMiddleware was used (req.result should exist)
    if (!req.result) {
      // If req.result doesn't exist, try to get user from req.userId
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - Please authenticate first",
        });
      }
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }
      req.result = user;
    }

    const userRole = req.result.role;

    // Check if user is owner
    if (userRole !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Forbidden - Owner access required",
      });
    }

    next();
  } catch (error) {
    console.log("Error in isOwner:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Middleware to check if user is Admin (not Owner, just Admin)
// Must be used after userMiddleware (which sets req.result)
const isAdmin = async (req, res, next) => {
  try {
    // Check if userMiddleware was used (req.result should exist)
    if (!req.result) {
      // If req.result doesn't exist, try to get user from req.userId
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - Please authenticate first",
        });
      }
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }
      req.result = user;
    }

    const userRole = req.result.role;

    // Check if user is admin (not owner, just admin)
    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden - Admin access required",
      });
    }

    next();
  } catch (error) {
    console.log("Error in isAdmin:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  isAdminOrOwner,
  isOwner,
  isAdmin,
};

