const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const Response = require("./api/utils/responseModel");
const authRoute = require("./api/routes/authRoute");
const userRoute = require("./api/routes/userRoute");
const taskRoute = require("./api/routes/taskRoute");
const adminRoute = require("./api/routes/adminRoute");
const statusRoute = require("./api/routes/statusRoute");
const meetRoute = require("./api/routes/meetRoute");
const questionRoute = require("./api/routes/questionRoute");
const pushRoute = require("./api/routes/pushRoute");
const githubRoute = require("./api/routes/githubRoute");
const connectDb = require("./api/db/dbConnection");

connectDb();

const app = express();
const port = process.env.PORT || 5000;

// Azure App Service sits behind a proxy; without this every request shares one IP.
app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));
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
app.use("/api/meet", meetRoute);
app.use("/questions", questionRoute);
app.use("/push", pushRoute);
app.use("/github", githubRoute);
// In-process reminder sweep every 5 minutes; /api/meet/reminders/run covers
// the case where the instance is asleep.
if (process.env.DISABLE_REMINDERS !== "true") {
  const { sendDueReminders } = require("./api/meet/reminders");
  const { sendInterviewMail } = require("./api/meet/schedule");
  const { notifyUser } = require("./api/utils/push");
  setInterval(() => {
    sendDueReminders({ sendMail: sendInterviewMail, notify: notifyUser }).catch((err) =>
      console.error("Reminder sweep failed:", err.message)
    );
  }, 5 * 60 * 1000).unref();
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
