const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// MongoDB connection - will be reused across functions
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/fitness-tracker";

  try {
    const connection = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    cachedDb = connection;
    console.log("MongoDB connected successfully");
    return cachedDb;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

// User model (simplified for serverless)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  accountRole: { type: String, default: 'User' },
  fitnessLevel: { type: String, default: 'Beginner' },
  workouts: [{
    exercise: String,
    sets: Number,
    reps: Number,
    completed: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
    caloriesPerSet: { type: Number, default: 15 }
  }],
  goals: {
    dailyWorkouts: { type: Number, default: 1 },
    weeklyWorkouts: { type: Number, default: 5 },
    monthlyWorkouts: { type: Number, default: 20 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    totalWorkouts: { type: Number, default: 0 },
    totalCaloriesBurned: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Connect to database
    await connectToDatabase();

    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Verify password
    let isValid = false;
    try {
      isValid = await bcrypt.compare(password, user.password);
    } catch (_) {
      isValid = false;
    }

    // Backward-compat: accept legacy plaintext passwords once and upgrade to hashed
    if (!isValid && user.password === password) {
      const newHash = await bcrypt.hash(password, 10);
      user.password = newHash;
      await user.save();
      isValid = true;
    }

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.accountRole },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        accountRole: user.accountRole,
        fitnessLevel: user.fitnessLevel,
        workouts: user.workouts,
        goals: user.goals
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};