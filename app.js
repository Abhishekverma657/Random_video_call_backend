const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require('http');
const authRoutes = require("./routes/authRoutes");
 
const socketIO = require('socket.io');
const socketHandler = require('./socketHandler');
const dotenv = require("dotenv");

const connectDB = require('./config/db');
dotenv.config();

const app = express();
const server = http.createServer(app);

const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  }
});

// Middlewares
app.use(cors());
app.use(express.json());
connectDB();

socketHandler(io);

// Routes
app.get("/", (req, res) => {
  res.send("API is running...");
});
 
app.use("/api/auth", authRoutes);
const PORT = process.env.PORT || 5500;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


 