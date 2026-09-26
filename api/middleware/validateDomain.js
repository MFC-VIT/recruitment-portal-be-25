const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

// Only the owner of :id may read or write their task, and only if they are
// verified and have picked this domain on their profile.
const validateDomainAccess = (domain) => async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "User is not authorized or token missing" });
  }

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECERT);
  } catch (error) {
    return res.status(401).json({ message: "User is not authorized" });
  }

  if (!decoded || !decoded.id || String(decoded.id) !== req.params.id) {
    return res
      .status(403)
      .json({ message: "Unauthorized access to user data" });
  }

  try {
    const user = await userModel.findById(decoded.id).select("domain verified");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verified === true && user.domain && user.domain.includes(domain)) {
      req.userId = String(user._id);
      return next();
    }
    return res
      .status(403)
      .json({ message: "User not verified for this route or choose domain" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const validateTech = validateDomainAccess("tech");
const validateDesign = validateDomainAccess("design");
const validateManagement = validateDomainAccess("management");

module.exports = {
  validateDomainAccess,
  validateTech,
  validateManagement,
  validateDesign,
};
