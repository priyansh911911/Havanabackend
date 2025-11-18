const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const WebSocket = require("ws");
require("dotenv").config();

const categoryRoutes = require("./src/routes/category.js");
const purchaseOrderRoutes = require("./src/routes/purchaseOrderRoutes.js");
const searchRoutes = require("./src/routes/searchRoutes");
const checkoutRoutes = require("./src/routes/checkoutRoutes.js");
const restaurantReservationRoutes = require("./src/routes/restaurantReservationRoutes");
const banquetMenuRoutes = require("./src/routes/banquetMenuRoutes.js");
const banquetBookingRoutes = require("./src/routes/banquetBookingRoutes.js");
const banquetCategoryRoutes = require("./src/routes/banquetCategoryRoutes.js");
const { restrictPantryAccess } = require("./src/middleware/authMiddleware.js");

const path = require("path");
// Initialize express app
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://ashokacrm.vercel.app",
        "https://zomato-frontend-mocha.vercel.app",
        "https://ashoka-api.shineinfosolutions.in",
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket']
});

// Make io available globally
app.set("io", io);

// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://ashoka-api.shineinfosolutions.in",
  "https://ashoka-backend.vercel.app",
  "https://ashokacrm.vercel.app",
  "https://ashoka-api.shineinfosolutions.in",
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    optionsSuccessStatus: 204,
  })
);
app.use(express.json({ limit: "50mb" }));

// Serve uploaded files for fallback method
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Apply pantry access restriction globally
app.use("/api", restrictPantryAccess);

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
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/restaurant-reservations", restaurantReservationRoutes);
app.use("/api/banquet-menus", banquetMenuRoutes);
app.use("/api/banquet-bookings", banquetBookingRoutes);
app.use("/api/banquet-categories", banquetCategoryRoutes);

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

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`🔗 Client connected: ${socket.id}`);
  
  // Join rooms
  socket.on("join-waiter-dashboard", () => {
    socket.join("waiters");
    console.log(`👨‍🍳 Socket ${socket.id} joined waiters room`);
  });
  
  socket.on("join-pantry-updates", () => {
    socket.join("pantry-updates");
    console.log(`🥫 Socket ${socket.id} joined pantry-updates room`);
  });
  
  socket.on("join-kitchen-updates", () => {
    socket.join("kitchen-updates");
    console.log(`🍳 Socket ${socket.id} joined kitchen-updates room`);
  });
  
  // Test message handler
  socket.on("test-message", (data) => {
    console.log(`📨 Test message received from ${socket.id}:`, data);
    socket.emit("test-response", { message: "Hello from server!", timestamp: new Date() });
  });
 
  socket.on("disconnect", (reason) => {
    console.log(`❌ Client disconnected: ${socket.id}, reason: ${reason}`);
  });
});

// Banquet updates via Socket.io
io.on('banquet-update', (data) => {
  io.emit('banquet-notification', data);
});

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}else{
    const PORT = 3000;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Export for serverless
module.exports = app;
