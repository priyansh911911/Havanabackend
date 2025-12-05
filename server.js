const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require("./src/routes/authRoutes.js");
const userRoutes = require("./src/routes/userRoutes.js");
const categoryRoutes = require("./src/routes/category.js");
const roomRoutes = require("./src/routes/roomRoutes.js");
const bookingRoutes = require("./src/routes/booking.js");
const searchRoutes = require("./src/routes/searchRoutes");
const checkoutRoutes = require("./src/routes/checkoutRoutes.js");
const banquetMenuRoutes = require("./src/routes/banquetMenuRoutes.js");
const banquetBookingRoutes = require("./src/routes/banquetBookingRoutes.js");
const banquetCategoryRoutes = require("./src/routes/banquetCategoryRoutes.js");
const restaurantCategoryRoutes = require("./src/routes/restaurantCategoryRoutes.js");
const restaurantOrderRoutes = require("./src/routes/restaurantOrderRoutes.js");
const kotRoutes = require("./src/routes/kotRoutes.js");

const planLimitRoutes = require("./src/routes/planLimitRoutes.js");
const roomInventoryChecklistRoutes = require("./src/routes/roomInventoryChecklistRoutes.js");
const menuItemRoutes = require("./src/routes/menuItemRoutes.js");
const inventoryRoutes = require("./src/routes/inventoryRoutes.js");
const inventoryCategoryRoutes = require("./src/routes/inventoryCategoryRoutes.js");
const roomServiceRoutes = require("./src/routes/roomServiceRoutes.js");
const invoiceRoutes = require("./src/routes/invoiceRoutes.js");
const auditRoutes = require("./src/routes/auditRoutes.js");
const dashboardRoutes = require("./src/routes/dashboardRoutes.js");
const cashTransactionRoutes = require("./src/routes/CashTransactionRoutes.js");
const nightAuditRoutes = require("./src/routes/nightAuditRoutes.js");
const subReportsRoutes = require("./src/routes/subReportsRoutes.js");
const { connectAuditDB } = require("./src/config/auditDatabase.js");
const path = require("path");
// Initialize express app
const app = express();
const server = createServer(app);
// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4000",
  "https://havana-f-git-main-anshusharma42019s-projects.vercel.app",
  "https://havanabackend.vercel.app",
  "https://havana-f.vercel.app",
  "https://havana-f1.vercel.app",
  "https://havanabackend-gray.vercel.app",
  "https://havana-f-chi.vercel.app"
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

// Add JWT_SECRET to your .env file

// Database connection
let isConnected = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

// Initialize MongoDB connection
const connectToMongoDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI not found in environment variables");
    }

    console.log("Attempting to connect to MongoDB...");
    console.log("MongoDB URI:", process.env.MONGO_URI ? "URI found" : "URI missing");
    
    const connectionOptions = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 5000,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      w: 'majority'
    };
    
    // Try primary connection
    try {
      await mongoose.connect(process.env.MONGO_URI, connectionOptions);
    } catch (srvError) {
      console.log("SRV connection failed, trying with different DNS settings...");
      
      // If SRV fails, try with family: 4 to force IPv4
      connectionOptions.family = 4;
      await mongoose.connect(process.env.MONGO_URI, connectionOptions);
    }
    
    isConnected = true;
    connectionAttempts = 0;
    console.log("MongoDB connected successfully to:", mongoose.connection.name);
    
  } catch (error) {
    console.error("Database connection failed:", error.message);
    console.error("Error code:", error.code);
    isConnected = false;
    connectionAttempts++;
    
    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      console.log(`Retrying connection in 5 seconds... (Attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})`);
      setTimeout(connectToMongoDB, 5000);
    } else {
      console.error("Max connection attempts reached. Server will continue without database.");
    }
  }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  isConnected = false;
  if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
    connectToMongoDB();
  }
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  isConnected = false;
});

// Initial connection attempt
connectToMongoDB();

// Initialize audit database connection (optional)
connectAuditDB().catch(error => {
  console.error('❌ Audit database connection failed:', error.message);
  console.log('⚠️ Server will continue without audit logging');
});

// Middleware to add DB connection status to request object
app.use((req, res, next) => {
  req.dbConnected = isConnected;
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/banquet-menus", banquetMenuRoutes);
app.use("/api/banquet-bookings", banquetBookingRoutes);
app.use("/api/banquet-categories", banquetCategoryRoutes);
app.use("/api/restaurant-categories", restaurantCategoryRoutes);
app.use("/api/restaurant-orders", restaurantOrderRoutes);
app.use("/api/kot", kotRoutes);
app.use("/api/plan-limits", planLimitRoutes);
app.use("/api/room-inventory-checklists", roomInventoryChecklistRoutes);
app.use("/api/menu-items", menuItemRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/inventory-categories", inventoryCategoryRoutes);
app.use("/api/room-service", roomServiceRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/cash-transactions", cashTransactionRoutes);
app.use("/api/night-audit", nightAuditRoutes);
app.use("/api/sub-reports", subReportsRoutes);


// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    dbConnected: isConnected,
    mongoUri: process.env.MONGO_URI ? "Present" : "Missing",
    connectionState: mongoose.connection.readyState,
    connectionAttempts: connectionAttempts
  });
});

// Database test endpoint
app.get("/test-db", async (req, res) => {
  try {
    if (!process.env.MONGO_URI) {
      return res.status(500).json({ error: "MONGO_URI not found in environment" });
    }
    
    if (!isConnected) {
      return res.status(503).json({
        error: "Database not connected",
        message: "MongoDB connection is not available",
        readyState: mongoose.connection.readyState,
        connectionAttempts: connectionAttempts
      });
    }
    
    const testConnection = await mongoose.connection.db.admin().ping();
    res.json({
      success: true,
      message: "Database connection successful",
      dbName: mongoose.connection.name,
      readyState: mongoose.connection.readyState,
      ping: testConnection
    });
  } catch (error) {
    res.status(500).json({
      error: "Database test failed",
      message: error.message,
      readyState: mongoose.connection.readyState
    });
  }
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

// Only start server in development
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Export for serverless
module.exports = app;
