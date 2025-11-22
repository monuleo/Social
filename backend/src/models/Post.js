const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Post must have an author"],
    },

    content: {
      type: String,
      required: [true, "Post content is required"],
      trim: true,
      minlength: [1, "Post content cannot be empty"],
      maxlength: [5000, "Post content cannot exceed 5000 characters"],
    },

    image: {
      type: String,
      default: null,
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    likesCount: {
      type: Number,
      default: 0,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    deletedByRole: {
      type: String,
      enum: ["admin", "owner", "author"],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ==================== INDEXES ====================
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ deletedAt: 1 });
postSchema.index({ likes: 1 });

// ==================== MIDDLEWARE ====================
// Filter out deleted posts by default (unless explicitly querying for deleted posts)
postSchema.pre(/^find/, function () {
  // Only filter if deletedAt is not explicitly in the query
  if (this.getQuery().deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
});

// Note: likesCount is updated manually in controllers when likes array changes
// This avoids issues with pre-save hooks during Post.create()

const Post = mongoose.model("Post", postSchema);
module.exports = Post;
