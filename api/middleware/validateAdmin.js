const jwt = require("jsonwebtoken");
const UserModel = require("../models/userModel");

// Admin rights are read from the database, not the token: a token's `admin`
// claim is only as fresh as the moment it was signed, and older tokens were
// signed without an expiry.
const validateAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "User is not authorized or token missing" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECERT);
    const user = await UserModel.findById(decoded.id).select("admin");

    if (!user || user.admin !== true) {
      return res.status(403).json({ message: "User not admin" });
    }

    req.userId = String(user._id);
    next();
  } catch (error) {
    return res.status(401).json({ message: "User is not authorized" });
  }
};

module.exports = validateAdmin;
