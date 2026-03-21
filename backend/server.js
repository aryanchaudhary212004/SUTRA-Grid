console.log("THIS SERVER FILE IS RUNNING");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const vehicleRoutes = require("./routes/vehicleRoutes.js");
const trafficRoutes = require("./routes/trafficRoutes");
app.use("/api", vehicleRoutes);
app.use("/api", trafficRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// MongoDB Connection
mongoose
  .connect("mongodb://127.0.0.1:27017/sutra-grid")
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.log(err);
  });

// Start Server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});