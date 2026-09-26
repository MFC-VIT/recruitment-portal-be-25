const { google } = require("googleapis");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const oauthCallback = async (req, res) => {
  try {
    const oauth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { code, state } = req.query;

    let adminId;
    try {
      const decoded = jwt.verify(
        String(state || ""),
        `${process.env.ACCESS_TOKEN_SECERT}:google-oauth`,
      );
      if (decoded.purpose !== "google-oauth") throw new Error("bad state");
      adminId = decoded.id;
    } catch (e) {
      return res.status(403).send("Invalid or expired OAuth state. Start again from /api/meet/auth.");
    }

    // --- Get tokens ---
    const { tokens } = await oauth.getToken(code);

    if (!tokens.refresh_token) {
      return res.send(
        "Google did NOT send a refresh token. Try removing the app permission from Google Account."
      );
    }

    // --- Get admin user ---
    const adminUser = await User.findOne({ _id: adminId, admin: true });

    if (!adminUser) {
      return res.status(400).send("No admin user found.");
    }

    // --- Save refresh token ---
    adminUser.googleRefreshToken = tokens.refresh_token;
    await adminUser.save();

    res.send("Google Calendar connected successfully. You can close this tab.");
  } catch (err) {
    console.error("OAuth Callback Error:", err);
    res.status(500).send("OAuth Error");
  }
};

module.exports = { oauthCallback };
