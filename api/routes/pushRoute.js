const express = require("express");
const PushSubscription = require("../models/pushSubscriptionModel");
const validateUser = require("../middleware/validateUser");
const { pushEnabled } = require("../utils/push");

const router = express.Router();

router.get("/key", (req, res) =>
  res.json({ enabled: pushEnabled, publicKey: process.env.VAPID_PUBLIC_KEY || null })
);

router.post("/subscribe", validateUser, async (req, res) => {
  const { endpoint, keys } = req.body || {};
  if (typeof endpoint !== "string" || !/^https:\/\//.test(endpoint) || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ message: "Invalid push subscription" });
  }
  // Re-subscribing from the same browser moves the endpoint to this user.
  await PushSubscription.updateOne(
    { endpoint },
    { $set: { user_id: req.userId, keys: { p256dh: keys.p256dh, auth: keys.auth } } },
    { upsert: true }
  );
  res.json({ success: true });
});

router.post("/unsubscribe", validateUser, async (req, res) => {
  await PushSubscription.deleteOne({ endpoint: req.body?.endpoint, user_id: req.userId });
  res.json({ success: true });
});

module.exports = router;
