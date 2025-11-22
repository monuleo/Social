const express = require("express");
const adminRouter = express.Router();

const userMiddleware = require("../middleware/userMiddleware");
const { isOwner, isAdminOrOwner } = require("../middleware/roleMiddleware");
const {
  createAdmin,
  deleteAdmin,
  getAllAdmins,
  getAllUsers,
} = require("../controller/adminController");

// Create a new admin (Owner only)
adminRouter.post("/create", userMiddleware, isOwner, createAdmin);

// Delete an admin (Owner only)
adminRouter.delete("/:adminId", userMiddleware, isOwner, deleteAdmin);

// Get all admins (Owner only) - Optional helper endpoint
adminRouter.get("/getAll", userMiddleware, isOwner, getAllAdmins);

// Get all users (Admin/Owner only)
adminRouter.get("/users", userMiddleware, isAdminOrOwner, getAllUsers);

module.exports = adminRouter;

