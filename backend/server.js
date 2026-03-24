console.log("THIS SERVER FILE IS RUNNING");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();   // load env only once

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const vehicleRoutes = require("./routes/vehicleRoutes.js");
const trafficRoutes = require("./routes/trafficRoutes");
app.use("/api", vehicleRoutes);
app.use("/api", trafficRoutes);

app.use("/api/vehicles", vehicleRoutes);
app.use("/api/traffic", trafficRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log("Mongo Error:", err));

// Start Server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});