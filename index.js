const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const Response = require("./api/utils/responseModel");
const authRoute = require("./api/routes/authRoute");
const userRoute = require("./api/routes/userRoute");
const taskRoute = require("./api/routes/taskRoute");
const adminRoute = require("./api/routes/adminRoute");
const statusRoute = require("./api/routes/statusRoute");
const connectDb = require("./api/db/dbConnection");

// Google OAuth handlers
const { oauthInit } = require("./api/meet/oauthInit");
const { oauthCallback } = require("./api/meet/oauthCallback");
const { scheduleMeeting } = require("./api/meet/schedule");

connectDb();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// Health Check
app.get("/ping", (req, res) => {
  const response = new Response(200, null, "pong", true);
  res.status(response.statusCode).json(response);
});

// Core Routes
app.use("/auth", authRoute);
app.use("/user", userRoute);
app.use("/upload", taskRoute);
app.use("/admin", adminRoute);
app.use("/applicatiostatus", statusRoute);

// Google Meet OAuth Routes
app.get("/api/meet/auth", oauthInit);
app.get("/api/meet/oauth/callback", oauthCallback);
app.post("/api/meet/schedule", scheduleMeeting);

// TEMP ADMIN ROUTE (correct and only one)
app.get("/temp-make-admin", async (req, res) => {
  try {
    const User = require("./api/models/userModel");

    const updated = await User.findOneAndUpdate(
      { email: "adith.manikonda2024@vitstudent.ac.in" },
      { admin: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    res.json({
      message: "Admin user updated successfully",
      user: updated,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/debug-admin", async (req, res) => {
  const User = require("./api/models/userModel");
  const admin = await User.findOne({ admin: true });
  res.json(admin);
});

app.get("/force-save-refresh-token", async (req, res) => {
  const User = require("./api/models/userModel");

  const updated = await User.findByIdAndUpdate(
    "693556536ea5209966d1507c",
    {
      googleRefreshToken:
        "1//0g8bk1SkauiIJCgYIARAAGBASNwF-L9IrOp4V-IY5ZlWiQ9d3b2zTqaBWWMeYQeCSh4BR9b8RxaUydq0JfnuUQsy64frJiwUw2O8",
    },
    { new: true }
  );

  res.json(updated);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
