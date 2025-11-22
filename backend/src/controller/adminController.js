const User = require("../models/User.model");
const Activity = require("../models/Activity");
const Post = require("../models/Post");
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

    // Store username for activity log before deletion
    const deletedAdminUsername = adminToDelete.username;

    // Create activity entry BEFORE deletion (so we have audit trail)
    await Activity.create({
      actor: loggedInUser._id,
      actorUsername: loggedInUser.username,
      actionType: "ADMIN_DELETED",
      target: adminToDelete._id,
      targetModel: "User",
      metadata: {
        targetUsername: deletedAdminUsername,
      },
    });

    // Clean up: Remove admin from other users' followers arrays
    await User.updateMany(
      { followers: adminId },
      { $pull: { followers: adminId } }
    );

    // Clean up: Remove admin from other users' following arrays
    await User.updateMany(
      { following: adminId },
      { $pull: { following: adminId } }
    );

    // Clean up: Remove admin from other users' blockedUsers arrays
    await User.updateMany(
      { blockedUsers: adminId },
      { $pull: { blockedUsers: adminId } }
    );

    // Hard delete all posts by this admin
    await Post.deleteMany({ author: adminId });

    // Hard delete the admin from database (frees up username and email)
    await User.findByIdAndDelete(adminId);

    res.status(200).json({
      success: true,
      message: `Admin ${deletedAdminUsername} deleted successfully`,
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

// Get all users (Admin/Owner only)
const getAllUsers = async (req, res) => {
  try {
    const loggedInUser = req.result; // From userMiddleware (should be Admin or Owner)

    // Get all users (not deleted) with post count
    const users = await User.find({
      deletedAt: null,
    })
      .select("-password")
      .lean();

    // Get post counts for each user
    const userIds = users.map((user) => user._id);
    const postCounts = await Post.aggregate([
      {
        $match: {
          author: { $in: userIds },
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: "$author",
          count: { $sum: 1 },
        },
      },
    ]);

    // Create a map of user ID to post count
    const postCountMap = {};
    postCounts.forEach((item) => {
      postCountMap[item._id.toString()] = item.count;
    });

    // Add post count to each user
    const usersWithPostCount = users.map((user) => ({
      ...user,
      postCount: postCountMap[user._id.toString()] || 0,
    }));

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      users: usersWithPostCount,
      count: usersWithPostCount.length,
    });
  } catch (error) {
    console.log("Error in getAllUsers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

module.exports = {
  createAdmin,
  deleteAdmin,
  getAllAdmins,
  getAllUsers,
};
