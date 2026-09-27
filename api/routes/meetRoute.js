const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const {
  scheduleMeeting,
  cancelMeeting,
  rescheduleMeeting,
  myMeeting,
  sendInterviewMail,
} = require("../meet/schedule");
const { sendDueReminders } = require("../meet/reminders");
const { notifyUser } = require("../utils/push");
const { oauthInit } = require("../meet/oauthinit");
const { oauthCallback } = require("../meet/oauthcallback");
const validateUser = require("../middleware/validateUser");
const validateVerify = require("../middleware/validateVerify");

router.post("/schedule", validateUser, validateVerify, scheduleMeeting);
router.post("/cancel", validateUser, validateVerify, cancelMeeting);
router.post("/reschedule", validateUser, validateVerify, rescheduleMeeting);
router.get("/mine", validateUser, myMeeting);
router.get("/auth", oauthInit);
router.get("/oauth/callback", oauthCallback);

// For an external cron (GitHub Actions schedule, cron-job.org...) in case the
// App Service instance sleeps. Needs the X-Cron-Secret header.
router.post("/reminders/run", async (req, res) => {
  const secret = process.env.CRON_SECRET || "";
  const given = String(req.headers["x-cron-secret"] || "");
  const ok =
    secret.length > 0 &&
    given.length === secret.length &&
    crypto.timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  if (!ok) return res.status(401).json({ message: "Unauthorized" });
  res.json(await sendDueReminders({ sendMail: sendInterviewMail, notify: notifyUser }));
});

module.exports = router;
