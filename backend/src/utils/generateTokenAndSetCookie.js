const jwt = require("jsonwebtoken");

const generateTokenAndSetCookie = async (res, userId, role) => {
  const token = jwt.sign({ userId, role }, process.env.JWT_SECRET_KEY, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",   // 💥 FIXED: Allows cookies on localhost
    secure: false,     // 💥 FIXED: HTTPS not required on localhost
  });

  return token;
};

module.exports = { generateTokenAndSetCookie };
