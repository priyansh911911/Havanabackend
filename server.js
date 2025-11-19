const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const categoryRoutes = require("./src/routes/category.js");
const roomRoutes = require("./src/routes/roomRoutes.js");
const bookingRoutes = require("./src/routes/booking.js");
const searchRoutes = require("./src/routes/searchRoutes");
const checkoutRoutes = require("./src/routes/checkoutRoutes.js");
const banquetMenuRoutes = require("./src/routes/banquetMenuRoutes.js");
const banquetBookingRoutes = require("./src/routes/banquetBookingRoutes.js");
const banquetCategoryRoutes = require("./src/routes/banquetCategoryRoutes.js");

const planLimitRoutes = require("./src/routes/planLimitRoutes.js");
const roomInventoryChecklistRoutes = require("./src/routes/roomInventoryChecklistRoutes.js");
const path = require("path");
// Initialize express app
const app = express();
const server = createServer(app);
// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4000",
  "https://havana-f-git-main-anshusharma42019s-projects.vercel.app",
  "https://havanabackend.vercel.app"
  
];

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket']
});

// Make io available globally
app.set("io", io);
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    optionsSuccessStatus: 204,
  })
);
app.use(express.json({ limit: "50mb" }));

// Serve uploaded files for fallback method
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Authentication disabled

// Database connection
let isConnected = false;

// Middleware to ensure DB connection before each request
app.use(async (req, res, next) => {
  try {
    if (!isConnected) {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
      });
      isConnected = true;
      console.log("MongoDB connected successfully");
    }
    next();
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Routes
app.use("/api/categories", categoryRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/banquet-menus", banquetMenuRoutes);
app.use("/api/banquet-bookings", banquetBookingRoutes);
app.use("/api/banquet-categories", banquetCategoryRoutes);
app.use("/api/plan-limits", planLimitRoutes);
app.use("/api/room-inventory-checklists", roomInventoryChecklistRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    dbConnected: isConnected,
  });
});

app.get("/", (req, res) => {
  res.send("API is running");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Server error", message: err.message });
});

// Banquet updates via Socket.io
io.on('banquet-update', (data) => {
  io.emit('banquet-notification', data);
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "production") {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Export for serverless
module.exports = app;
