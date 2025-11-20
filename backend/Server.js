const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
const allowedOrigins = [
  "http://localhost:3000",
  "https://fitnessschallengetracker.vercel.app",
  "https://fitness-challenge-tracker.vercel.app",
  "https://fitnesschallenge-tracker.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type, Authorization"
}));

app.use(express.json());

// Routes
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// -----------------------------
// TEST ROUTES FOR RAILWAY
// -----------------------------
app.get("/", (req, res) => {
  res.send("🚀 Fitness Challenge Tracker Backend is running on Railway!");
});

app.get("/api/test", (req, res) => {
  res.json({ message: "API Test OK! Backend connected successfully." });
});

// -----------------------------
// MONGODB CONNECTION
// -----------------------------
const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/fitness-tracker";

// Removed deprecated options (newParser, unifiedTopology)
mongoose.connect(mongoURI)
  .then(() => console.log("MongoDB connected - Namma Dhaan"))
  .catch(err => {
    console.error("MongoDB connection error:", err);
    console.log("Make sure MongoDB is running or use MongoDB Atlas");
    console.log("You can also set MONGO_URI in your Railway variables");
  });

// -----------------------------
// START SERVER
// -----------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
