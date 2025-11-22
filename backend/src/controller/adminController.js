const User = require("../models/User.model");
const Activity = require("../models/Activity");
const bcrypt = require("bcrypt");
const validate = require("../utils/validator");

// Create a new admin (Owner only)
const createAdmin = async (req, res) => {
  try {
    const loggedInUser = req.result; // From userMiddleware (should be Owner)
    const { emailId, username, password, bio } = req.body;

    // Validate input
    validate(req.body);

    if (!emailId || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Email, username, and password are required",
      });
    }

    // Check if user already exists
    const userAlreadyExists = await User.findOne({
      $or: [{ emailId }, { username }],
    });

    if (userAlreadyExists) {
      return res.status(400).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    // Hash password
    const hashPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const adminUser = new User({
      emailId,
      username,
      password: hashPassword,
      role: "admin",
      bio: bio || "",
    });

    await adminUser.save();

    // Create activity entry
    await Activity.create({
      actor: loggedInUser._id,
      actorUsername: loggedInUser.username,
      actionType: "ADMIN_CREATED",
      target: adminUser._id,
      targetModel: "User",
      metadata: {
        targetUsername: adminUser.username,
      },
    });

    res.status(201).json({
      success: true,
      message: `Admin ${adminUser.username} created successfully`,
      admin: {
        _id: adminUser._id,
        emailId: adminUser.emailId,
        username: adminUser.username,
        role: adminUser.role,
        bio: adminUser.bio,
        profilePicture: adminUser.profilePicture,
      },
    });
  } catch (error) {
    console.log("Error in createAdmin:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create admin",
      error: error.message,
    });
  }
};

// Delete an admin (Owner only)
const deleteAdmin = async (req, res) => {
  try {
    const loggedInUser = req.result; // From userMiddleware (should be Owner)
    const adminId = req.params.adminId;

    // Validate adminId
    if (!require("mongoose").Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Admin ID",
      });
    }

    // Check if trying to delete self
    if (loggedInUser._id.toString() === adminId) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete yourself",
      });
    }

    // Find admin to delete
    const adminToDelete = await User.findById(adminId);
    if (!adminToDelete) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Check if user is actually an admin
    if (adminToDelete.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "User is not an admin",
      });
    }

    // Check if admin is already deleted
    if (adminToDelete.deletedAt) {
      return res.status(400).json({
        success: false,
        message: "Admin is already deleted",
      });
    }

    // Soft delete the admin (change role to user and mark as deleted)
    // Or we can just soft delete like regular users
    adminToDelete.deletedAt = new Date();
    adminToDelete.deletedBy = loggedInUser._id;
    // Optionally, we can change role back to user
    // adminToDelete.role = "user";
    await adminToDelete.save();

    // Create activity entry
    await Activity.create({
      actor: loggedInUser._id,
      actorUsername: loggedInUser.username,
      actionType: "ADMIN_DELETED",
      target: adminToDelete._id,
      targetModel: "User",
      metadata: {
        targetUsername: adminToDelete.username,
      },
    });

    res.status(200).json({
      success: true,
      message: `Admin ${adminToDelete.username} deleted successfully`,
    });
  } catch (error) {
    console.log("Error in deleteAdmin:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete admin",
      error: error.message,
    });
  }
};

// Get all admins (Owner only) - Optional helper endpoint
const getAllAdmins = async (req, res) => {
  try {
    const loggedInUser = req.result; // From userMiddleware (should be Owner)

    // Get all admins (not deleted)
    const admins = await User.find({
      role: "admin",
      deletedAt: null,
    }).select("-password");

    res.status(200).json({
      success: true,
      message: "Admins fetched successfully",
      admins: admins,
      count: admins.length,
    });
  } catch (error) {
    console.log("Error in getAllAdmins:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admins",
      error: error.message,
    });
  }
};

module.exports = {
  createAdmin,
  deleteAdmin,
  getAllAdmins,
};
