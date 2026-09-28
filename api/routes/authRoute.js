const express = require("express");
const {
  login,
  signUp,
  verifyOTP,
  resendOTP,
  requestPasswordReset,
  updatePassword,
  refreshToken, 
} = require("../controllers/authController");
const {
  rateLimiter_10min_10req,
  loginLimiter,
  signupLimiter,
  passwordResetLimiter,
  otpLimiter,
} = require("../middleware/ratelimiter");

const validateToken = require("../middleware/validateTokenHandler");
const app = express();

app.use(express.json());

const router = express.Router();

router.post("/signup", rateLimiter_10min_10req, signupLimiter, signUp);
router.post("/login", rateLimiter_10min_10req, loginLimiter, login);
router.post("/refresh", rateLimiter_10min_10req, refreshToken);
router.post(
  "/verifyotp/:id",
  rateLimiter_10min_10req,
  otpLimiter,
  validateToken,
  verifyOTP
);
router.post(
  "/resendotp/:id",
  rateLimiter_10min_10req,
  otpLimiter,
  validateToken,
  resendOTP
);
router.post(
  "/requestPasswordReset",
  rateLimiter_10min_10req,
  passwordResetLimiter,
  requestPasswordReset
);
router.post("/updatepassword", rateLimiter_10min_10req, updatePassword);

module.exports = router;
