const Activity = require("../models/Activity");
const User = require("../models/User.model");
const Post = require("../models/Post");

// Get all activities for the activity wall
const getAllActivities = async (req, res) => {
  try {
    // Get all activities, sorted by newest first
    const activities = await Activity.find({})
      .populate("actor", "username profilePicture")
      .sort({ createdAt: -1 });

    // Separate activities by targetModel for efficient population
    const userTargetIds = [];
    const postTargetIds = [];
    const userActivities = [];
    const postActivities = [];

    activities.forEach((activity) => {
      if (activity.target) {
        if (activity.targetModel === "User") {
          userTargetIds.push(activity.target);
          userActivities.push(activity);
        } else if (activity.targetModel === "Post") {
          postTargetIds.push(activity.target);
          postActivities.push(activity);
        }
      }
    });

    // Populate User targets
    if (userTargetIds.length > 0) {
      const users = await User.find({ _id: { $in: userTargetIds } }).select("username profilePicture");
      const userMap = {};
      users.forEach((user) => {
        userMap[user._id.toString()] = user;
      });
      userActivities.forEach((activity) => {
        activity.target = userMap[activity.target.toString()] || activity.target;
      });
    }

    // Populate Post targets with authors
    if (postTargetIds.length > 0) {
      const posts = await Post.find({ _id: { $in: postTargetIds } })
        .populate("author", "username profilePicture")
        .select("content image author");
      const postMap = {};
      posts.forEach((post) => {
        postMap[post._id.toString()] = post;
      });
      postActivities.forEach((activity) => {
        activity.target = postMap[activity.target.toString()] || activity.target;
      });
    }

    // Format activities for display
    const formattedActivities = activities.map((activity) => {
      const actorName = activity.actorUsername || activity.actor?.username || "Unknown";
      let message = "";

      // Format message based on action type
      switch (activity.actionType) {
        case "POST_CREATED":
          message = `${actorName} made a post`;
          break;

        case "POST_LIKED":
          if (activity.target && activity.targetModel === "Post") {
            // If target is populated as Post, get author username
            if (activity.target.author && activity.target.author.username) {
              const postAuthorName = activity.target.author.username;
              message = `${actorName} liked ${postAuthorName}'s post`;
            } else {
              message = `${actorName} liked a post`;
            }
          } else {
            message = `${actorName} liked a post`;
          }
          break;

        case "POST_UNLIKED":
          message = `${actorName} unliked a post`;
          break;

        case "USER_FOLLOWED":
          if (activity.target && activity.targetModel === "User") {
            const targetName = activity.target.username || activity.metadata?.targetUsername || "a user";
            message = `${actorName} followed ${targetName}`;
          } else {
            message = `${actorName} followed a user`;
          }
          break;

        case "USER_UNFOLLOWED":
          if (activity.target && activity.targetModel === "User") {
            const targetName = activity.target.username || activity.metadata?.targetUsername || "a user";
            message = `${actorName} unfollowed ${targetName}`;
          } else {
            message = `${actorName} unfollowed a user`;
          }
          break;

        case "POST_DELETED":
          const deletedByRole = activity.metadata?.deletedByRole || "Admin";
          message = `Post deleted by ${deletedByRole}`;
          break;

        case "USER_DELETED":
          message = `User deleted by Owner`;
          break;

        case "ADMIN_CREATED":
          if (activity.target && activity.targetModel === "User") {
            const targetName = activity.target.username || activity.metadata?.targetUsername || "a user";
            message = `${targetName} was created as Admin by ${actorName}`;
          } else {
            message = `Admin created by ${actorName}`;
          }
          break;

        case "ADMIN_DELETED":
          if (activity.target && activity.targetModel === "User") {
            const targetName = activity.target.username || activity.metadata?.targetUsername || "a user";
            message = `${targetName} was removed as Admin by ${actorName}`;
          } else {
            message = `Admin deleted by ${actorName}`;
          }
          break;

        default:
          message = `${actorName} performed an action`;
      }

      return {
        _id: activity._id,
        actor: activity.actor,
        actorUsername: activity.actorUsername,
        actionType: activity.actionType,
        message: message,
        target: activity.target,
        targetModel: activity.targetModel,
        metadata: activity.metadata,
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      message: "Activities fetched successfully",
      activities: formattedActivities,
      count: formattedActivities.length,
    });
  } catch (error) {
    console.log("Error in getAllActivities:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activities",
      error: error.message,
    });
  }
};

module.exports = {
  getAllActivities,
};

