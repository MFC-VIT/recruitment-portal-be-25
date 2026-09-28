const jwt = require("jsonwebtoken");

const validateToken = async (req, res, next) => {
  let token;
  let authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res
      .status(401)
      .json({ message: "User is not authorized or token missing" });
  }

  token = authHeader.split(" ")[1];
  try {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECERT, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "User is not authorized" });
      }
      if (!decoded || !decoded.id) {
        return res.status(401).json({ message: "Invalid token payload" });
      }
      const userId = decoded.id;
      if (req.params.id !== userId) {
        return res
          .status(403)
          .json({ message: "Unauthorized access to user data" });
      }
      req.userId = userId;
      next();
    });
  } catch (error) {
    return res.status(401).json({ message: "User is not authorized" });
  }
};

module.exports = validateToken;
