console.log("THIS SERVER FILE IS RUNNING");
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
connectDB();

// Routes
const vehicleRoutes = require("./routes/vehicleRoutes");
app.use("/api", vehicleRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Start server
app.listen(process.env.PORT || 5000, () => {
  console.log("Server running on port 5000");
});