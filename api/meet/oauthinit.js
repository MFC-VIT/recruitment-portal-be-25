const { google } = require("googleapis");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/userModel");

// Browser redirect flow, so the admin's access token comes in as ?token=.
// It is exchanged for a short-lived signed `state` that the callback checks,
// which ties the Google account being connected to a real admin.
const oauthInit = async (req, res) => {
  try {
    const decoded = jwt.verify(
      String(req.query.token || ""),
      process.env.ACCESS_TOKEN_SECERT,
    );
    const admin = await UserModel.findById(decoded.id).select("admin");
    if (!admin || admin.admin !== true) {
      return res.status(403).send("Only admins can connect Google Calendar.");
    }

    const state = jwt.sign(
      { id: String(admin._id), purpose: "google-oauth" },
      process.env.ACCESS_TOKEN_SECERT,
      { expiresIn: "10m" },
    );

    const oauth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    const url = oauth.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      state,
      scope: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
      ],
    });

    res.redirect(url);
  } catch (err) {
    return res.status(401).send("Log in as an admin and retry with ?token=<access token>.");
  }
};
module.exports = { oauthInit };
