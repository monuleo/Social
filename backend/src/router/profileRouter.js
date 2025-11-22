const express = require("express");

const profileRouter = express.Router();

const userMiddleware = require("../middleware/userMiddleware");
const { isOwner, isAdminOrOwner } = require("../middleware/roleMiddleware");
const {
  getById,
  followUser,
  unfollowUser,
  blockUser,
  unblockUser,
  deleteUser,
} = require("../controller/usersController");

profileRouter.get("/:id", userMiddleware, getById);
profileRouter.post("/:id/follow", userMiddleware, followUser);
profileRouter.delete("/:id/unfollow", userMiddleware, unfollowUser);
profileRouter.post("/:id/block", userMiddleware, blockUser);
profileRouter.delete("/:id/unblock", userMiddleware, unblockUser);

// Delete user (Admin/Owner can delete users)
profileRouter.delete("/:id", userMiddleware, isAdminOrOwner, deleteUser);

module.exports = profileRouter;
