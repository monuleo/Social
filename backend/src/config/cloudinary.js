const { v2: cloudinary } = require("cloudinary");
const fs = require("fs");

const uploadOnCloudinary = async (file) => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const result = await cloudinary.uploader.upload(file, {
      resource_type: "auto",
    });

    // Delete local file after upload
    fs.unlinkSync(file);
    return result.secure_url;
  } catch (error) {
    // Delete local file even if upload fails
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
    console.log("Cloudinary upload error:", error);
    throw error;
  }
};

module.exports = uploadOnCloudinary;

