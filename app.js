const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require('http');
const dotenv = require("dotenv");
const socketIO = require('socket.io');
const fs = require('fs');
const path = require('path');

// Import your routes and handlers
const authRoutes = require("./routes/authRoutes");
const socketHandler = require('./socketHandler');
const connectDB = require('./config/db');
const reportRoutes = require('./routes/reportRoute');

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

 
// This cron job will run every hour to check for VIP plan expirations
require('./controllers/vipCron');


// Initialize socket handling
socketHandler(io);

// Base API route
app.get("/", (req, res) => {
  console.log("API is running... Welcome to Bubbly!(call problem fix ) ");
  res.send("API is running... Welcome to Bubbly!");
});

// Auth routes
app.use("/api/auth", authRoutes);
app.use('/api/report', reportRoutes);




// API to serve video_content.json
app.get('/api/videos/content', (req, res) => {
  const jsonPath = path.join(__dirname, 'video', 'video_content.json');
  fs.readFile(jsonPath, 'utf8', (err, jsonData) => {
    if (err) {
      return res.status(500).json({ error: 'File read error' });
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(jsonData);
  });
});

// Uncomment if you want to list all videos from the directory
// app.get("/api/videos", (req, res) => {
//   const videoDir = "/var/www/bubbly/video";
//   fs.readdir(videoDir, (err, files) => {
//     if (err) {
//       return res.status(500).json({ error: "Unable to read video directory" });
//     }
//     const videoFiles = files.filter(file => file.endsWith('.mp4'));
//     const videoUrls = videoFiles.map(file => ({
//       name: file,
//       url: `https://bubbly.bigdaddy365.in/video/${file}`
//     }));
//     res.json(videoUrls);
//   });
// });

const PORT = process.env.PORT || 5500;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
