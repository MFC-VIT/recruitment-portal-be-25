const express = require("express");
const {
  getSubmission,
  saveSubmission,
} = require("../controllers/submissionController");
const { rateLimiter_10min_100req } = require("../middleware/ratelimiter");
const { validateDomainAccess } = require("../middleware/validateDomain");

const router = express.Router();

const DOMAIN = ":domain(tech|design|management)";
const checkDomain = (req, res, next) =>
  validateDomainAccess(req.params.domain)(req, res, next);

// Same URLs as before (/upload/tech/:id etc.), now backed by one submissions collection.
router.get(`/${DOMAIN}/:id`, rateLimiter_10min_100req, checkDomain, getSubmission);
router.patch(`/${DOMAIN}/:id`, rateLimiter_10min_100req, checkDomain, saveSubmission);
router.post(`/${DOMAIN}/:id`, rateLimiter_10min_100req, checkDomain, saveSubmission);

module.exports = router;
