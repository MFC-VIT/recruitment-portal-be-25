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
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
