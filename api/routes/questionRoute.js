const express = require("express");
const { getQuestions } = require("../controllers/questionController");
const validateUser = require("../middleware/validateUser");
const { rateLimiter_10min_100req } = require("../middleware/ratelimiter");

const router = express.Router();

router.get(
  "/:domain(tech|design|management)",
  rateLimiter_10min_100req,
  validateUser,
  getQuestions
);

module.exports = router;
