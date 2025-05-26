const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require('http');
const dotenv = require("dotenv");
const socketIO = require('socket.io');

// Import your routes and handlers
const authRoutes = require("./routes/authRoutes");
const socketHandler = require('./socketHandler');
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

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Initialize socket handling
socketHandler(io);

// Base API route
app.get("/", (req, res) => {
  console.log("API is running...");
  res.send("API is running...");
});

// Auth routes
app.use("/api/auth", authRoutes);

// Serve a video playback page
app.get("/video", (req, res) => {
  const videoUrl = "https://bubbly.bigdaddy365.in/video/VID-20250515-WA0002.mp4";
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Video Player</title>
    </head>
    <body style="margin:0; padding:0; background:#000; display:flex; align-items:center; justify-content:center; height:100vh;">
      <video width="720" height="480" controls autoplay>
        <source src="${videoUrl}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    </body>
    </html>
  `);
});

// Start the server
const PORT = process.env.PORT || 5500;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
