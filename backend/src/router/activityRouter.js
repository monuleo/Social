const express = require("express");
const activityRouter = express.Router();

const userMiddleware = require("../middleware/userMiddleware");
const { getAllActivities } = require("../controller/activityController");

// Get all activities for the activity wall
activityRouter.get("/getAll", userMiddleware, getAllActivities);

module.exports = activityRouter;

