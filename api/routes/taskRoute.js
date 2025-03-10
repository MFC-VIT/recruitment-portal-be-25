const express = require("express");
const {
  uploadFileTech,
  uploadFile,
  downloadFileTech,
  uploadDesignTech,
  uploadTaskManagment,
  uploadTaskTech,
  uploadFileDesign,
  downloadFileDesign,
} = require("../controllers/taskController");
const { fileCountLimit, fileSizeLimit } = require("../middleware/validateFile");
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
  uploadTaskManagment
);
router.post(
  "/tech/:id",
  rateLimiter_10min_100req,
  validateTech,
  uploadTaskTech
);
router.post(
  "/design/:id",
  rateLimiter_10min_100req,
  validateDesign,
  uploadDesignTech
);

module.exports = router;
