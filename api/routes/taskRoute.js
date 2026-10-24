const express = require("express");
const {
  getSubmission,
  saveSubmission,
} = require("../controllers/submissionController");
const { rateLimiter_10min_100req } = require("../middleware/ratelimiter");
const { validateDomainAccess } = require("../middleware/validateDomain");

const router = express.Router();

// Submissions closed after the recruitment deadline. Set SUBMISSIONS_OPEN=true
// to reopen without a code change.
const closeSubmissions = (req, res, next) =>
  process.env.SUBMISSIONS_OPEN === "true"
    ? next()
    : res.status(403).json({
        statusCode: 403,
        data: null,
        message: "Task submissions are closed.",
        success: false,
      });

const DOMAIN = ":domain(tech|design|management)";
const checkDomain = (req, res, next) =>
  validateDomainAccess(req.params.domain)(req, res, next);

// Same URLs as before (/upload/tech/:id etc.), now backed by one submissions collection.
router.get(`/${DOMAIN}/:id`, rateLimiter_10min_100req, checkDomain, getSubmission);
router.patch(`/${DOMAIN}/:id`, closeSubmissions, rateLimiter_10min_100req, checkDomain, saveSubmission);
router.post(`/${DOMAIN}/:id`, closeSubmissions, rateLimiter_10min_100req, checkDomain, saveSubmission);

module.exports = router;
