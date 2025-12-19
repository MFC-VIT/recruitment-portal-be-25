const express = require("express");
const {
  saveTaskDesign,
  saveTaskManagement,
  saveTaskTech,
} = require("../controllers/taskController");
const { rateLimiter_10min_100req } = require("../middleware/ratelimiter");
const {
  validateTech,
  validateManagement,
  validateDesign,
} = require("../middleware/validateDomain");
const app = express();

app.use(express.json());

const router = express.Router();

router.post(
  "/management/:id",
  rateLimiter_10min_100req,
  validateManagement,
  saveTaskManagement
);

router.patch(
  "/management/:id",
  rateLimiter_10min_100req,
  validateManagement,
  saveTaskManagement
);

router.post(
  "/tech/:id",
  rateLimiter_10min_100req,
  validateTech,
  saveTaskTech
);

router.patch(
  "/tech/:id",
  rateLimiter_10min_100req,
  validateTech,
  saveTaskTech
);

router.post(
  "/design/:id",
  rateLimiter_10min_100req,
  validateDesign,
  saveTaskDesign
);

router.patch(
  "/design/:id",
  rateLimiter_10min_100req,
  validateDesign,
  saveTaskDesign
);

module.exports = router;

