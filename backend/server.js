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
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/traffic", trafficRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// MongoDB Connection
mongoose
  .connect("mongodb+srv://singhdvya06:tE2og1ypM1kn7giN@cluster0.bttxkji.mongodb.net/myDatabase?retryWrites=true&w=majority")
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