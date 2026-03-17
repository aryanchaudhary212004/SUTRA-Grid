const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const vehicleRoutes = require("./routes/vehicleRoutes");

const app = express();
connectDB();
app.use(cors());
app.use(express.json());
app.use("/api", vehicleRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
});

app.get("/", (req, res) => {
  res.send("SUTRA Grid API Running");
});

const PORT = 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});