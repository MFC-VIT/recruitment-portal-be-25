const { google } = require("googleapis");
const User = require("../models/userModel");

// Google Calendar client acting as the admin who connected via /api/meet/auth.
// Returns null when nobody has connected a calendar yet.
const getCalendar = async () => {
  const adminUser = await User.findOne({
    admin: true,
    googleRefreshToken: { $ne: null },
  }).select("googleRefreshToken");
  if (!adminUser) return null;

  const oauth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
  oauth.setCredentials({ refresh_token: adminUser.googleRefreshToken });
  return google.calendar({ version: "v3", auth: oauth });
};

// Busy intervals per email for [start, end). Calendars we can't see (outside
// the org, or free/busy sharing off) are simply missing from the result.
const freeBusy = async (calendar, emails, start, end) => {
  const busy = new Map();
  if (!calendar || emails.length === 0) return busy;
  for (let i = 0; i < emails.length; i += 50) {
    const items = emails.slice(i, i + 50).map((id) => ({ id }));
    try {
      const res = await calendar.freebusy.query({
        requestBody: { timeMin: start.toISOString(), timeMax: end.toISOString(), items },
      });
      for (const [email, cal] of Object.entries(res.data.calendars || {})) {
        if (!cal.errors) busy.set(email.toLowerCase(), cal.busy || []);
      }
    } catch (err) {
      console.warn("freebusy query failed:", err.message);
    }
  }
  return busy;
};

module.exports = { getCalendar, freeBusy };
