const { google } = require("googleapis");
const User = require("../models/userModel");

const oauthCallback = async (req, res) => {
  try {
    const oauth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { code } = req.query;

    // --- Get tokens ---
    const { tokens } = await oauth.getToken(code);

    console.log("GOOGLE TOKENS RECEIVED:", tokens);

    if (!tokens.refresh_token) {
      return res.send(
        "Google did NOT send a refresh token. Try removing the app permission from Google Account."
      );
    }

    // --- Get admin user ---
    const adminUser = await User.findOne({ admin: true });

    if (!adminUser) {
      return res.status(400).send("No admin user found.");
    }

    // --- Save refresh token ---
    adminUser.googleRefreshToken = tokens.refresh_token;
    await adminUser.save();

    console.log("ADMIN UPDATED: ", adminUser);

    res.send("Google Calendar connected successfully. You can close this tab.");
  } catch (err) {
    console.error("OAuth Callback Error:", err);
    res.status(500).send("OAuth Error");
  }
};

module.exports = { oauthCallback };
