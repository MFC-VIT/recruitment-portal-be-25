const mongoose = require("mongoose");

// On Vercel every cold instance runs this module. Without awaiting the
// connection, early requests sat in mongoose's 10s buffer and failed with
// "buffering timed out". Callers now wait for the one shared connect attempt.
let connecting = null;

const connectDb = () => {
  const { readyState } = mongoose.connection;
  if (readyState === 1) return Promise.resolve();
  if (readyState === 2 && connecting) return connecting;

  connecting = mongoose
    .connect(process.env.CONNECT_STRING, {
      // Small pool: many instances run at once and the Atlas tier caps total connections.
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    })
    .then((connect) => {
      console.log("Database connected: ", connect.connection.host, connect.connection.name);
    })
    .catch((err) => {
      connecting = null;
      throw err;
    });
  return connecting;
};

module.exports = connectDb;
