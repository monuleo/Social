const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const { connectDB } = require("./config/db");
require("dotenv").config();

const authRouter = require("./router/auth");
const profileRouter = require("./router/profileRouter");
const postRouter = require("./router/postRouter");
const activityRouter = require("./router/activityRouter");
const adminRouter = require("./router/adminRouter");

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(
  cors({
    origin: "http://localhost:5173", // Frontend URL
    credentials: true, // Allow cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/users", profileRouter);
app.use("/api/posts", postRouter);
app.use("/api/activities", activityRouter);
app.use("/api/admin", adminRouter);

// Error handler for multer and other errors (must be after routes)
app.use((error, req, res, next) => {
  if (error instanceof require("multer").MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 5MB",
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  next();
});

connectDB()
  .then(() => {
    console.log("Database is connected");
    app.listen(PORT, () => {
      console.log(`server is listening on port ${PORT}...`);
    });
  })
  .catch((err) => console.log(err));
