const Post = require("../models/Post");
const Activity = require("../models/Activity");
const User = require("../models/User.model");
const uploadOnCloudinary = require("../config/cloudinary");

// Create a new post
const uploadPost = async (req, res) => {
  try {
    const loggedInUser = req.result; // From userMiddleware
    const { content } = req.body;
    console.log("Request body content:", content);

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Post content is required",
      });
    }

    if (content.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Post content cannot exceed 5000 characters",
      });
    }

    let imageUrl = null;

    // Upload image to Cloudinary if provided
    if (req.file) {
      try {
        imageUrl = await uploadOnCloudinary(req.file.path);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Failed to upload image",
          error: error.message,
        });
      }
    }

    // Create post
    const post = await Post.create({
      author: loggedInUser._id,
      content: content.trim(),
      image: imageUrl,
      likes: [],
      likesCount: 0,
    });

    // Populate author details
    await post.populate("author", "username profilePicture");

    // Create activity entry
    await Activity.create({
      actor: loggedInUser._id,
      actorUsername: loggedInUser.username,
      actionType: "POST_CREATED",
      target: post._id,
      targetModel: "Post",
      metadata: {
        postContent: content.substring(0, 100), // Store first 100 chars
      },
    });

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: post,
    });
  } catch (error) {
    console.log("Error in uploadPost:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create post",
      error: error.message,
    });
  }
};

// Like/Unlike a post
const likePost = async (req, res) => {
  try {
    const loggedInUser = req.result; // From userMiddleware
    const postId = req.params.postId;

    // Validate postId
    if (!require("mongoose").Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }

    // Find post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if post author has blocked the current user
    const postAuthor = await User.findById(post.author);
    if (
      postAuthor &&
      postAuthor.blockedUsers.includes(loggedInUser._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if current user has blocked the post author
    if (loggedInUser.blockedUsers.includes(post.author.toString())) {
      return res.status(403).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if already liked
    const alreadyLiked = post.likes.some(
      (id) => id.toString() === loggedInUser._id.toString()
    );

    let actionType;

    if (alreadyLiked) {
      // Unlike: Remove from likes array
      post.likes = post.likes.filter(
        (id) => id.toString() !== loggedInUser._id.toString()
      );
      actionType = "POST_UNLIKED";
    } else {
      // Like: Add to likes array
      post.likes.push(loggedInUser._id);
      actionType = "POST_LIKED";
    }

    // Update likesCount manually
    post.likesCount = post.likes.length;

    // Save post
    await post.save();

    // Populate author details
    await post.populate("author", "username profilePicture");

    // Create activity entry
    await Activity.create({
      actor: loggedInUser._id,
      actorUsername: loggedInUser.username,
      actionType: actionType,
      target: post._id,
      targetModel: "Post",
      metadata: {
        postContent: post.content.substring(0, 100),
      },
    });

    res.status(200).json({
      success: true,
      message: alreadyLiked
        ? "Post unliked successfully"
        : "Post liked successfully",
      post: post,
    });
  } catch (error) {
    console.log("Error in likePost:", error);
    res.status(500).json({
      success: false,
      message: "Failed to like/unlike post",
      error: error.message,
    });
  }
};

// Get all posts (excluding blocked users)
const getAllPosts = async (req, res) => {
  try {
    const loggedInUser = req.result; // From userMiddleware

    // Get all posts (exclude deleted posts)
    // Populate author with blockedUsers to check if author blocked current user
    let posts = await Post.find({ deletedAt: null })
      .populate("author", "username profilePicture blockedUsers")
      .sort({ createdAt: -1 }); // Newest first

    // Filter out posts from blocked users
    // If user A blocks user B, B should not see A's posts
    // If user A blocks user B, A should not see B's posts
    // Exception: Admins and Owners can see all posts for moderation purposes
    const isAdminOrOwner = loggedInUser.role === "admin" || loggedInUser.role === "owner";
    
    const filteredPosts = posts.filter((post) => {
      // Skip posts with deleted/null authors
      if (!post.author || !post.author._id) {
        return false;
      }

      const authorId = post.author._id.toString();

      // Check if current user has blocked the post author
      if (loggedInUser.blockedUsers && loggedInUser.blockedUsers.includes(authorId)) {
        return false;
      }

      // Check if post author has blocked the current user
      // Admins and Owners can bypass this check to see all posts for moderation
      if (
        !isAdminOrOwner &&
        post.author.blockedUsers &&
        Array.isArray(post.author.blockedUsers) &&
        post.author.blockedUsers.includes(loggedInUser._id.toString())
      ) {
        return false;
      }

      return true;
    });

    // Remove blockedUsers from response for security
    const sanitizedPosts = filteredPosts.map((post) => {
      const postObj = post.toObject();
      if (postObj.author && postObj.author.blockedUsers) {
        delete postObj.author.blockedUsers;
      }
      return postObj;
    });

    res.status(200).json({
      success: true,
      message: "Posts fetched successfully",
      posts: sanitizedPosts,
      count: sanitizedPosts.length,
    });
  } catch (error) {
    console.log("Error in getAllPosts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch posts",
      error: error.message,
    });
  }
};

// Delete a post (Admin/Owner can delete any, Author can delete own)
const deletePost = async (req, res) => {
  try {
    const loggedInUser = req.result; // From userMiddleware
    const postId = req.params.postId;

    // Validate postId
    if (!require("mongoose").Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }

    // Find post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if post is already deleted
    if (post.deletedAt) {
      return res.status(400).json({
        success: false,
        message: "Post is already deleted",
      });
    }

    // Check permissions:
    // 1. Author can delete own post
    // 2. Admin/Owner can delete any post
    const isAuthor = post.author.toString() === loggedInUser._id.toString();
    const isAdminOrOwner = loggedInUser.role === "admin" || loggedInUser.role === "owner";

    if (!isAuthor && !isAdminOrOwner) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - You don't have permission to delete this post",
      });
    }

    // Determine deletedByRole
    let deletedByRole;
    if (isAuthor) {
      deletedByRole = "author";
    } else if (loggedInUser.role === "owner") {
      deletedByRole = "owner";
    } else {
      deletedByRole = "admin";
    }

    // Soft delete the post
    post.deletedAt = new Date();
    post.deletedBy = loggedInUser._id;
    post.deletedByRole = deletedByRole;
    await post.save();

    // Create activity entry
    await Activity.create({
      actor: loggedInUser._id,
      actorUsername: loggedInUser.username,
      actionType: "POST_DELETED",
      target: post._id,
      targetModel: "Post",
      metadata: {
        postContent: post.content.substring(0, 100),
        deletedByRole: deletedByRole,
      },
    });

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.log("Error in deletePost:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete post",
      error: error.message,
    });
  }
};

// Delete a like from a post (Admin/Owner only)
const deleteLike = async (req, res) => {
  try {
    const loggedInUser = req.result; // From userMiddleware
    const postId = req.params.postId;
    const userIdToRemove = req.params.userId;

    // Validate postId
    if (!require("mongoose").Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }

    // Validate userId
    if (!require("mongoose").Types.ObjectId.isValid(userIdToRemove)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Check if user is Admin or Owner
    const isAdminOrOwner = loggedInUser.role === "admin" || loggedInUser.role === "owner";
    if (!isAdminOrOwner) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - Admin or Owner access required",
      });
    }

    // Find post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if post is deleted
    if (post.deletedAt) {
      return res.status(400).json({
        success: false,
        message: "Cannot modify deleted post",
      });
    }

    // Check if user has liked the post
    const hasLiked = post.likes.some((id) => id.toString() === userIdToRemove);
    if (!hasLiked) {
      return res.status(400).json({
        success: false,
        message: "User has not liked this post",
      });
    }

    // Remove like
    post.likes = post.likes.filter((id) => id.toString() !== userIdToRemove);
    post.likesCount = post.likes.length;
    await post.save();

    // Get the user whose like was removed
    const userWhoseLikeRemoved = await User.findById(userIdToRemove);

    res.status(200).json({
      success: true,
      message: `Like removed successfully from ${userWhoseLikeRemoved?.username || "user"}'s like`,
      post: post,
    });
  } catch (error) {
    console.log("Error in deleteLike:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove like",
      error: error.message,
    });
  }
};

// Get all posts by a specific user
const getUserPosts = async (req, res) => {
  try {
    const loggedInUser = req.result; // From userMiddleware
    const userId = req.params.id;

    // Validate userId
    if (!require("mongoose").Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid User ID",
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if logged in user blocked this user or vice versa
    // Admins and Owners can see all posts for moderation
    const isAdminOrOwner = loggedInUser.role === "admin" || loggedInUser.role === "owner";
    
    if (!isAdminOrOwner) {
      if (loggedInUser.blockedUsers.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.blockedUsers.includes(loggedInUser._id.toString())) {
        return res.status(403).json({
          success: false,
          message: "User not found",
        });
      }
    }

    // Get all posts by this user (exclude deleted posts)
    const posts = await Post.find({ 
      author: userId,
      deletedAt: null 
    })
      .populate("author", "username profilePicture")
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({
      success: true,
      message: "User posts fetched successfully",
      posts: posts,
      count: posts.length,
    });
  } catch (error) {
    console.log("Error in getUserPosts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user posts",
      error: error.message,
    });
  }
};

module.exports = {
  uploadPost,
  likePost,
  getAllPosts,
  deletePost,
  deleteLike,
  getUserPosts,
};
