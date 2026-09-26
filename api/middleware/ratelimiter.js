const rateLimit = require("express-rate-limit");

// Per-IP limits stay generous on purpose: most applicants sit behind the same
// campus NAT, so a strict per-IP cap would lock out the whole hostel at once.
const RateLimiter = rateLimit({
  windowMs: 3 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
});
const rateLimiter_10min_10req = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 1000,
  message: "Too many requests from this IP, please try again later.",
});

const rateLimiter_10min_100req = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10000,
  message: "Too many requests from this IP, please try again later.",
});

// Brute-force protection is keyed on the account being targeted instead.
const accountLimiter = (max, keyOf) =>
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `${req.path}:${keyOf(req) || req.ip}`,
    message: { error: "Too many attempts for this account, try again in 10 minutes." },
  });

const byEmail = (req) => String(req.body?.email || "").trim().toLowerCase();
const byUserId = (req) => String(req.params?.id || "");

const loginLimiter = accountLimiter(10, byEmail);
const signupLimiter = accountLimiter(5, byEmail);
const passwordResetLimiter = accountLimiter(5, byEmail);
const otpLimiter = accountLimiter(10, byUserId);

module.exports = {
  RateLimiter,
  rateLimiter_10min_10req,
  rateLimiter_10min_100req,
  loginLimiter,
  signupLimiter,
  passwordResetLimiter,
  otpLimiter,
};
