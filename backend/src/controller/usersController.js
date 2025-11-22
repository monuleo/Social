const User = require("../models/User.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const Post = require("../models/Post");
const Activity = require("../models/Activity");
const mongoose = require("mongoose");

const getProfile = async (req, res) => {
  try {
    const result = req.result;

    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      user: {
        ...result._doc,
        password: undefined,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
    console.log("Error Occures while fetching profile : ", err.message);
  }
};

const getById = async (req, res) => {
  try {
    const loggedInUser = req.result;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if logged in user blocked this user or vice versa
    // Admins and Owners can bypass blocking restrictions for moderation purposes
    const isAdminOrOwner = loggedInUser.role === "admin" || loggedInUser.role === "owner";
    
    if (!isAdminOrOwner) {
      if (loggedInUser.blockedUsers.includes(userId)) {
        return res
          .status(403)
          .json({ success: false, message: "User not found" });
      }

      if (user.blockedUsers.includes(loggedInUser._id.toString())) {
        return res
          .status(403)
          .json({ success: false, message: "User not found" });
      }
    }

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
    console.log("Error Occures while fetching user by ID : ", err.message);
  }
};

const followUser = async (req, res) => {
  try {
    const loggedInUser = req.result;
    const userIdToFollow = req.params.id;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userIdToFollow)) {
      return res.status(400).json({ error: "Invalid User Id" });
    }

    // Check if user exists
    const userToFollow = await User.findById(userIdToFollow);
    if (!userToFollow) {
      return res.status(400).json({ error: "Invalid User Id" });
    }

    // Check if trying to follow self
    if (loggedInUser._id.toString() === userIdToFollow) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    // Check if you blocked them or they blocked you
    if (loggedInUser.blockedUsers.includes(userIdToFollow)) {
      return res.status(400).json({ error: "Cannot follow blocked user" });
    }

    if (userToFollow.blockedUsers.includes(loggedInUser._id.toString())) {
      return res.status(400).json({ error: "Cannot follow this user" });
    }

    // Check if already following
    if (loggedInUser.following.includes(userIdToFollow)) {
      return res.status(400).json({ error: "Already following this user" });
    }

    // Add to following and followers
    loggedInUser.following.push(userIdToFollow);
    userToFollow.followers.push(loggedInUser._id);

    await loggedInUser.save();
    await userToFollow.save();

    // Create activity
    await Activity.create({
      actor: loggedInUser._id,
      actorUsername: loggedInUser.username,
      actionType: "USER_FOLLOWED",
      target: userIdToFollow,
      targetModel: "User",
      metadata: {
        targetUsername: userToFollow.username,
      },
    });

    res.status(200).json({ message: "Successfully followed user" });
  } catch (err) {
    res.status(400).send("ERROR FOUND : " + err.message);
  }
};

const unfollowUser = async (req, res) => {
  try {
    const loggedInUser = req.result;
    const userIdToUnfollow = req.params.id;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userIdToUnfollow)) {
      return res.status(400).json({ error: "Invalid User Id" });
    }

    // Check if user exists
    const userToUnfollow = await User.findById(userIdToUnfollow);
    if (!userToUnfollow) {
      return res.status(400).json({ error: "Invalid User Id" });
    }

    // Remove from loggedInUser's following (if exists)
    loggedInUser.following = loggedInUser.following.filter(
      (id) => id.toString() !== userIdToUnfollow
    );

    // Remove from other user's followers (if exists)
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== loggedInUser._id.toString()
    );

    await loggedInUser.save();
    await userToUnfollow.save();

    // Create activity
    await Activity.create({
      actor: loggedInUser._id,
      actorUsername: loggedInUser.username,
      actionType: "USER_UNFOLLOWED",
      target: userIdToUnfollow,
      targetModel: "User",
      metadata: {
        targetUsername: userToUnfollow.username,
      },
    });

    res.status(200).json({ message: "Successfully unfollowed user" });
  } catch (err) {
    res.status(400).send("ERROR FOUND : " + err.message);
  }
};

const blockUser = async (req, res) => {
  try {
    const loggedInUser = req.result;
    const userIdToBlock = req.params.id;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userIdToBlock)) {
      return res.status(400).json({ error: "Invalid User Id" });
    }

    // Check if user exists
    const userToBlock = await User.findById(userIdToBlock);
    if (!userToBlock) {
      return res.status(400).json({ error: "Invalid User Id" });
    }

    // Check if trying to block self
    if (loggedInUser._id.toString() === userIdToBlock) {
      return res.status(400).json({ error: "Cannot block yourself" });
    }

    // Check if already blocked
    if (loggedInUser.blockedUsers.includes(userIdToBlock)) {
      return res.status(400).json({ error: "User already blocked" });
    }

    // Add to blockedUsers
    loggedInUser.blockedUsers.push(userIdToBlock);

    // Remove from following/followers if exists
    loggedInUser.following = loggedInUser.following.filter(
      (id) => id.toString() !== userIdToBlock
    );
    loggedInUser.followers = loggedInUser.followers.filter(
      (id) => id.toString() !== userIdToBlock
    );

    userToBlock.following = userToBlock.following.filter(
      (id) => id.toString() !== loggedInUser._id.toString()
    );
    userToBlock.followers = userToBlock.followers.filter(
      (id) => id.toString() !== loggedInUser._id.toString()
    );

    await loggedInUser.save();
    await userToBlock.save();

    res.status(200).json({ message: "User blocked successfully" });
  } catch (err) {
    res.status(400).send("ERROR FOUND : " + err.message);
  }
};

const unblockUser = async (req, res) => {
  try {
    const loggedInUser = req.result;
    const userIdToUnblock = req.params.id;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userIdToUnblock)) {
      return res.status(400).json({ error: "Invalid User Id" });
    }

    // Check if user exists
    const userToUnblock = await User.findById(userIdToUnblock);
    if (!userToUnblock) {
      return res.status(400).json({ error: "Invalid User Id" });
    }

    // Check if actually blocked
    if (!loggedInUser.blockedUsers.includes(userIdToUnblock)) {
      return res.status(400).json({ error: "User is not blocked" });
    }

    // Remove from blockedUsers
    loggedInUser.blockedUsers = loggedInUser.blockedUsers.filter(
      (id) => id.toString() !== userIdToUnblock
    );

    await loggedInUser.save();

    res.status(200).json({ message: "User unblocked successfully" });
  } catch (err) {
    res.status(400).send("ERROR FOUND : " + err.message);
  }
};

const getBlockedUsers = async (req, res) => {
  try {
    const loggedInUser = req.result;

    if (!loggedInUser.blockedUsers || loggedInUser.blockedUsers.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No blocked users",
        blockedUsers: [],
      });
    }

    // Fetch blocked users' basic info (bypassing blocking restrictions)
    const blockedUsers = await User.find({
      _id: { $in: loggedInUser.blockedUsers },
      deletedAt: null, // Only get non-deleted users
    })
      .select("username emailId profilePicture bio _id")
      .lean();

    res.status(200).json({
      success: true,
      message: "Blocked users fetched successfully",
      blockedUsers: blockedUsers,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
    console.log("Error Occures while fetching blocked users : ", err.message);
  }
};

const deleteUser = async (req, res) => {
  try {
    const loggedInUser = req.result; // From userMiddleware (should be Admin or Owner)
    const userIdToDelete = req.params.id;

    // Validate userId
    if (!require("mongoose").Types.ObjectId.isValid(userIdToDelete)) {
      return res.status(400).json({
        success: false,
        message: "Invalid User ID",
      });
    }

    // Check if trying to delete self
    if (loggedInUser._id.toString() === userIdToDelete) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete yourself",
      });
    }

    // Find user to delete
    const userToDelete = await User.findById(userIdToDelete);
    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Role-based deletion restrictions:
    // - Admins can only delete regular users (not owners or other admins)
    // - Owners can delete anyone (users, admins, but not themselves - already checked above)
    if (loggedInUser.role === "admin") {
      if (userToDelete.role === "owner") {
        return res.status(403).json({
          success: false,
          message: "Admins cannot delete owners",
        });
      }
      if (userToDelete.role === "admin") {
        return res.status(403).json({
          success: false,
          message: "Admins cannot delete other admins. Only owners can delete admins.",
        });
      }
    }

    // Store username for activity log before deletion
    const deletedUsername = userToDelete.username;

    // Create activity entry BEFORE deletion (so we have audit trail)
    await Activity.create({
      actor: loggedInUser._id,
      actorUsername: loggedInUser.username,
      actionType: "USER_DELETED",
      target: userToDelete._id,
      targetModel: "User",
      metadata: {
        targetUsername: deletedUsername,
      },
    });

    // Clean up: Remove user from other users' followers arrays
    await User.updateMany(
      { followers: userIdToDelete },
      { $pull: { followers: userIdToDelete } }
    );

    // Clean up: Remove user from other users' following arrays
    await User.updateMany(
      { following: userIdToDelete },
      { $pull: { following: userIdToDelete } }
    );

    // Clean up: Remove user from other users' blockedUsers arrays
    await User.updateMany(
      { blockedUsers: userIdToDelete },
      { $pull: { blockedUsers: userIdToDelete } }
    );

    // Hard delete all posts by this user
    await Post.deleteMany({ author: userIdToDelete });

    // Hard delete the user from database (frees up username and email)
    await User.findByIdAndDelete(userIdToDelete);

    res.status(200).json({
      success: true,
      message: `User ${deletedUsername} deleted successfully`,
    });
  } catch (error) {
    console.log("Error in deleteUser:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const loggedInUser = req.result; // From userMiddleware
    const { bio, profilePicture } = req.body;
    let imageUrl = null;

    // Upload new profile picture to Cloudinary if provided
    if (req.file) {
      const uploadOnCloudinary = require("../config/cloudinary");
      try {
        imageUrl = await uploadOnCloudinary(req.file.path);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Failed to upload profile picture",
          error: error.message,
        });
      }
    }

    // Update user profile
    const updateData = {};
    
    if (bio !== undefined) {
      // Validate bio length
      if (bio.length > 200) {
        return res.status(400).json({
          success: false,
          message: "Bio cannot exceed 200 characters",
        });
      }
      updateData.bio = bio;
    }

    if (imageUrl) {
      updateData.profilePicture = imageUrl;
    } else if (profilePicture !== undefined) {
      // Allow direct URL update if no file upload
      updateData.profilePicture = profilePicture;
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      loggedInUser._id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.log("Error in updateProfile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

module.exports = {
  getProfile,
  getById,
  followUser,
  unfollowUser,
  blockUser,
  unblockUser,
  getBlockedUsers,
  deleteUser,
  updateProfile,
};
