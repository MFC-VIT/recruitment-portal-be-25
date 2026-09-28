const express = require("express");
const router = express.Router();
const { scheduleMeeting, cancelMeeting } = require("../meet/schedule");
const { oauthInit } = require("../meet/oauthinit");
const { oauthCallback } = require("../meet/oauthcallback");
const validateUser = require("../middleware/validateUser");
const validateVerify = require("../middleware/validateVerify");

router.post("/schedule", validateUser, validateVerify, scheduleMeeting);
router.post("/cancel", validateUser, validateVerify, cancelMeeting);
router.get("/auth", oauthInit);
router.get("/oauth/callback", oauthCallback);
module.exports = router;
