const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const Response = require("./api/utils/responseModel")
const authRoute = require("./api/routes/authRoute");
const userRoute = require("./api/routes/userRoute");
const taskRoute = require("./api/routes/taskRoute");
const adminRoute = require("./api/routes/adminRoute");
const statusRoute = require("./api/routes/statusRoute");
const connectDb = require("./api/db/dbConnection");

connectDb();

const app = express();

const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

app.get("/ping", (req,res)=> {
  const response = new Response (
    200,
    null,
    "pong",
    true
  );
  res.status(response.statusCode).json(response);
})

app.use("/auth", authRoute);
app.use("/user", userRoute);
app.use("/upload", taskRoute);
app.use("/admin", adminRoute);
app.use("/applicatiostatus", statusRoute);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
