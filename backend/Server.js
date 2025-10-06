const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/fitness-tracker";

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected - Namma Dhaan" ))
.catch(err => {
  console.error(" MongoDB connection error:", err);
  console.log(" Make sure MongoDB is running or use MongoDB Atlas");
  console.log(" You can also set MONGO_URI in your .env file");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
