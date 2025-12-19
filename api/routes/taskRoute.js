const express = require("express");
const {
  saveTaskDesign,
  saveTaskManagement,
  saveTaskTech,
  getTaskDesign,
  getTaskManagement,
  getTaskTech,
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

router.get(
  "/management/:id",
  rateLimiter_10min_100req,
  validateManagement,
  getTaskManagement
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

router.get(
  "/tech/:id",
  rateLimiter_10min_100req,
  validateTech,
  getTaskTech
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

router.get(
  "/design/:id",
  rateLimiter_10min_100req,
  validateDesign,
  getTaskDesign
);

router.patch(
  "/design/:id",
  rateLimiter_10min_100req,
  validateDesign,
  saveTaskDesign
);

module.exports = router;

