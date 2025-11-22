// src/models/Activity.js

const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    actorUsername: {
      type: String,
      required: true,
    },

    actionType: {
      type: String,
      required: true,
      enum: [
        "POST_CREATED",
        "POST_LIKED",
        "POST_UNLIKED",
        "USER_FOLLOWED",
        "USER_UNFOLLOWED",
        "POST_DELETED",
        "USER_DELETED",
        "ADMIN_CREATED",
        "ADMIN_DELETED",
      ],
    },

    target: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "targetModel",
    },

    targetModel: {
      type: String,
      enum: ["User", "Post"],
    },

    metadata: {
      postContent: String,
      targetUsername: String,
      deletedByRole: String,
    },
  },
  {
    timestamps: true,
  }
);

// ==================== INDEXES ====================
activitySchema.index({ actor: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });
activitySchema.index({ actionType: 1, createdAt: -1 });
activitySchema.index({ target: 1, targetModel: 1 });

const Activity = mongoose.model("Activity", activitySchema);
module.exports = Activity;
