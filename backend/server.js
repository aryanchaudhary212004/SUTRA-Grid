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
const simulationRoutes = require("./routes/simulationRoutes");
const violationRoutes = require("./routes/violationRoutes");
const replayRoutes = require("./routes/replayRoutes");

app.use("/api/vehicles", vehicleRoutes);
app.use("/api/traffic", trafficRoutes);
app.use("/api", simulationRoutes);
app.use("/api", violationRoutes);
app.use("/api", replayRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log("Mongo Error:", err));

// Cleanup old vehicle data every 30 seconds
setInterval(async () => {
  const cutoff = new Date(Date.now() - 2 * 60 * 1000); // last 2 minutes

  try {
    await mongoose.connection.collection("vehicles").deleteMany({
      timestamp: { $lt: cutoff }
    });
    console.log("🧹 Old vehicle data cleaned");
  } catch (err) {
    console.error("Cleanup error:", err.message);
  }
}, 30000);

// Start Server
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  }
});

// Make io accessible everywhere
app.set("io", io);

server.listen(5000, () => {
  console.log("Server running with Socket.IO on port 5000");
});