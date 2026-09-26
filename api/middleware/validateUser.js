const jwt = require("jsonwebtoken");

// Verifies the access token and exposes the caller as req.userId. Use this on
// routes that act on "the logged-in user" instead of taking an id from the
// request body.
const validateUser = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "User is not authorized or token missing" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECERT);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }
    req.userId = String(decoded.id);
    next();
  } catch (error) {
    return res.status(401).json({ message: "User is not authorized" });
  }
};

module.exports = validateUser;
