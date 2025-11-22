const express = require("express");
const postRouter = express.Router();

const userMiddleware = require("../middleware/userMiddleware");
const { isAdminOrOwner } = require("../middleware/roleMiddleware");
const { upload } = require("../middleware/multer");
const {
  uploadPost,
  likePost,
  getAllPosts,
  deletePost,
  deleteLike,
  getUserPosts,
} = require("../controller/postController");

// Get all posts (excluding blocked users)
postRouter.get("/getAll", userMiddleware, getAllPosts);

// Create a new post (with optional image upload)
postRouter.post(
  "/upload",
  userMiddleware,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "File upload error",
        });
      }
      next();
    });
  },
  uploadPost
);

// Like/Unlike a post
postRouter.get("/like/:postId", userMiddleware, likePost);

// Delete a post (Author can delete own, Admin/Owner can delete any)
postRouter.delete("/:postId", userMiddleware, deletePost);

// Delete a like from a post (Admin/Owner only)
postRouter.delete("/:postId/like/:userId", userMiddleware, isAdminOrOwner, deleteLike);

module.exports = postRouter;
