const mongoose = require('mongoose');
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

// WorkoutSchedule model
const workoutScheduleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String, required: true },
  duration: { type: Number, default: 30 },
  exercises: [{
    name: { type: String, required: true },
    sets: { type: Number, required: true },
    reps: { type: Number, required: true },
    restTime: { type: Number, default: 60 },
    notes: { type: String }
  }],
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const WorkoutSchedule = mongoose.models.WorkoutSchedule || mongoose.model('WorkoutSchedule', workoutScheduleSchema);

// Auth middleware
function authenticate(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
  } catch (error) {
    return null;
  }
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Connect to database
    await connectToDatabase();

    // Authenticate user
    const decoded = authenticate(req);
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query; // This will be the userId from the dynamic route

    if (req.method === 'GET') {
      // Get all schedules for the user
      const schedules = await WorkoutSchedule.find({ userId: id }).sort({ scheduledDate: 1 });
      return res.status(200).json(schedules);
    }

    if (req.method === 'POST') {
      // Create new schedule
      const { title, description, scheduledDate, scheduledTime, duration, exercises } = req.body;

      if (!title || !scheduledDate || !scheduledTime) {
        return res.status(400).json({ error: 'Title, scheduledDate, and scheduledTime are required' });
      }

      const newSchedule = new WorkoutSchedule({
        userId: id,
        title,
        description,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        duration: duration || 30,
        exercises: exercises || []
      });

      const savedSchedule = await newSchedule.save();
      return res.status(201).json(savedSchedule);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Schedules API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
