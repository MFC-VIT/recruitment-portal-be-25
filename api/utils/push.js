const webpush = require("web-push");
const PushSubscription = require("../models/pushSubscriptionModel");

// Generate once with `npx web-push generate-vapid-keys` and set the same pair on
// both backends. Without them push is simply disabled.
const enabled = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
if (enabled) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || `mailto:${process.env.MFC_EMAIL || "mfc@example.com"}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Sends {title, body, url} to every browser the user subscribed from and
// prunes endpoints the push service says are gone.
const notifyUser = async (userId, payload) => {
  if (!enabled) return 0;
  const subs = await PushSubscription.find({ user_id: userId }).lean();
  let delivered = 0;
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify(payload),
          { TTL: 24 * 3600 }
        );
        delivered++;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id });
        } else {
          console.warn("push failed:", err.statusCode || err.message);
        }
      }
    })
  );
  return delivered;
};

module.exports = { notifyUser, pushEnabled: enabled };
