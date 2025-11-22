const express = require("express");
const adminRouter = express.Router();

const userMiddleware = require("../middleware/userMiddleware");
const { isOwner } = require("../middleware/roleMiddleware");
const {
  createAdmin,
  deleteAdmin,
  getAllAdmins,
} = require("../controller/adminController");

// Create a new admin (Owner only)
adminRouter.post("/create", userMiddleware, isOwner, createAdmin);

// Delete an admin (Owner only)
adminRouter.delete("/:adminId", userMiddleware, isOwner, deleteAdmin);

// Get all admins (Owner only) - Optional helper endpoint
adminRouter.get("/getAll", userMiddleware, isOwner, getAllAdmins);

module.exports = adminRouter;

