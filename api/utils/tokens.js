const jwt = require("jsonwebtoken");

const ACCESS_TTL = "1d";
const REFRESH_TTL = "15d";

// Refresh tokens get their own key so one can never be replayed as an access token.
const refreshSecret = () =>
  process.env.REFRESH_TOKEN_SECRET || `${process.env.ACCESS_TOKEN_SECERT}:refresh`;

const buildTokenClaims = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  regno: user.regno,
  verified: user.verified,
  tech: user.tech,
  design: user.design,
  management: user.management,
  admin: user.admin,
  isProfileDone: user.isProfileDone,
  isTechDone: user.isTechDone,
  isManagementDone: user.isManagementDone,
  isDesignDone: user.isDesignDone,
  domain: user.domain,
  isJC: user.isJC,
  isSC: user.isSC,
});

const signAccessToken = (user) =>
  jwt.sign(buildTokenClaims(user), process.env.ACCESS_TOKEN_SECERT, {
    expiresIn: ACCESS_TTL,
  });

// Keeps the same claims as the access token because the frontend decodes the
// refresh cookie for isTechDone etc.
const signRefreshToken = (user) =>
  jwt.sign(buildTokenClaims(user), refreshSecret(), { expiresIn: REFRESH_TTL });

const verifyRefreshToken = (token) => jwt.verify(token, refreshSecret());

module.exports = {
  buildTokenClaims,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
};
