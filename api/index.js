const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// MongoDB connection
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

// Workout completion tracking model
const workoutCompletionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exercise: { type: String, required: true },
  sets: { type: Number, required: true },
  reps: { type: Number, required: true },
  completed: { type: Boolean, default: true },
  date: { type: Date, required: true },
  caloriesPerSet: { type: Number, default: 15 },
  createdAt: { type: Date, default: Date.now }
});

const WorkoutSchedule = mongoose.models.WorkoutSchedule || mongoose.model('WorkoutSchedule', workoutScheduleSchema);
const WorkoutCompletion = mongoose.models.WorkoutCompletion || mongoose.model('WorkoutCompletion', workoutCompletionSchema);

// User model
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

// Main API router
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

    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname;

    console.log('API Request:', req.method, pathname);

    // Test route
    if (pathname === '/api/test') {
      return res.status(200).json({ 
        message: 'API Test OK! Backend connected successfully.',
        timestamp: new Date().toISOString()
      });
    }

    // Root API route
    if (pathname === '/api' || pathname === '/api/') {
      return res.status(200).json({ 
        message: '🚀 Fitness Challenge Tracker API is running on Vercel!',
        timestamp: new Date().toISOString()
      });
    }

    // Route to different handlers based on path
    if (pathname === '/api/users/login') {
      const loginHandler = require('./users/login.js');
      return loginHandler(req, res);
    }

    if (pathname === '/api/users/signup') {
      const signupHandler = require('./users/signup.js');
      return signupHandler(req, res);
    }

    if (pathname.startsWith('/api/users/') && pathname.includes('/schedules/')) {
      // Handle schedules routes like /api/users/[id]/schedules/today or /api/users/[id]/schedules/upcoming
      const pathParts = pathname.split('/');
      const userIndex = pathParts.indexOf('users');
      if (userIndex !== -1 && pathParts.length > userIndex + 2) {
        const userId = pathParts[userIndex + 1];
        const scheduleType = pathParts[userIndex + 3]; // 'today' or 'upcoming'

        if (scheduleType === 'today') {
          const todayHandler = require('./users/[id]/schedules/today.js');
          req.query.id = userId;
          return todayHandler(req, res);
        } else if (scheduleType === 'upcoming') {
          const upcomingHandler = require('./users/[id]/schedules/upcoming.js');
          req.query.id = userId;
          return upcomingHandler(req, res);
        }
      }
    }

    // Handle direct user schedule routes like /api/users/[id]
    if (pathname.match(/^\/api\/users\/[^\/]+$/)) {
      const pathParts = pathname.split('/');
      const userId = pathParts[pathParts.length - 1];

      // Authenticate user
      const decoded = authenticate(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (req.method === 'GET') {
        // Get all schedules for the user
        const schedules = await WorkoutSchedule.find({ userId: userId }).sort({ scheduledDate: 1 });
        return res.status(200).json(schedules);
      }

      if (req.method === 'POST') {
        // Create new schedule
        const { title, description, scheduledDate, scheduledTime, duration, exercises } = req.body;

        if (!title || !scheduledDate || !scheduledTime) {
          return res.status(400).json({ error: 'Title, scheduledDate, and scheduledTime are required' });
        }

        const newSchedule = new WorkoutSchedule({
          userId: userId,
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
    }

    // Handle workout completion routes like /api/users/[id]/workouts
    if (pathname.match(/^\/api\/users\/[^\/]+\/workouts$/)) {
      const pathParts = pathname.split('/');
      const userId = pathParts[pathParts.length - 2];

      console.log('Workout API called:', { method: req.method, userId, pathname });

      // Authenticate user
      const decoded = authenticate(req);
      if (!decoded) {
        console.log('Authentication failed for workout API');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log('User authenticated:', decoded.id);

      if (req.method === 'GET') {
        try {
          // Get all workouts for the user from User model
          console.log('Looking for user with ID:', userId);
          const user = await User.findById(userId);
          if (!user) {
            console.log('User not found:', userId);
            return res.status(404).json({ error: 'User not found' });
          }
          console.log('Found user:', user.name, 'Workouts count:', user.workouts?.length || 0);
          
          // Initialize workouts array and goals if they don't exist (for existing users)
          let needsSave = false;
          if (!user.workouts) {
            user.workouts = [];
            needsSave = true;
          }
          if (!user.goals) {
            user.goals = {
              dailyWorkouts: 1,
              weeklyWorkouts: 5,
              monthlyWorkouts: 20,
              currentStreak: 0,
              longestStreak: 0,
              totalWorkouts: 0,
              totalCaloriesBurned: 0
            };
            needsSave = true;
          }
          
          if (needsSave) {
            await user.save();
            console.log('Initialized missing fields for user:', userId);
          }
          
          return res.status(200).json(user.workouts || []);
        } catch (dbError) {
          console.error('Database error in GET workouts:', dbError);
          return res.status(500).json({ error: 'Database error', details: dbError.message });
        }
      }

      if (req.method === 'POST') {
        try {
          // Add a new workout to the user
          const { exercise, sets, reps, completed, date, caloriesPerSet } = req.body;
          console.log('Adding workout:', { exercise, sets, reps, completed, userId });

          if (!exercise || !sets || !reps) {
            return res.status(400).json({ error: 'Exercise, sets, and reps are required' });
          }

          const user = await User.findById(userId);
          if (!user) {
            console.log('User not found for POST workout:', userId);
            return res.status(404).json({ error: 'User not found' });
          }

          // Initialize workouts array if it doesn't exist
          if (!user.workouts) {
            user.workouts = [];
          }

          user.workouts.push({
            exercise,
            sets,
            reps,
            completed: completed || false,
            date: date ? new Date(date) : new Date(),
            caloriesPerSet: caloriesPerSet || 15
          });

          await user.save();
          console.log('Workout saved successfully for user:', userId);
          return res.status(201).json(user);
        } catch (dbError) {
          console.error('Database error in POST workout:', dbError);
          return res.status(500).json({ error: 'Database error', details: dbError.message });
        }
      }

      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Handle user streak updates like /api/users/[id]/update-streak
    if (pathname.match(/^\/api\/users\/[^\/]+\/update-streak$/)) {
      const pathParts = pathname.split('/');
      const userId = pathParts[pathParts.length - 2];

      // Authenticate user
      const decoded = authenticate(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (req.method === 'POST') {
        // Calculate and update user streak
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        const completedWorkouts = user.workouts.filter(w => w.completed);
        const today = new Date();
        const sortedWorkouts = completedWorkouts.sort((a, b) => new Date(b.date) - new Date(a.date));
        let currentStreak = 0;
        let checkDate = new Date(today);
        
        for (let i = 0; i < sortedWorkouts.length; i++) {
          const workoutDate = new Date(sortedWorkouts[i].date);
          const daysDiff = Math.floor((checkDate - workoutDate) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === 0 || daysDiff === 1) {
            currentStreak++;
            checkDate = new Date(workoutDate);
          } else {
            break;
          }
        }

        // Update streak
        user.goals.currentStreak = currentStreak;
        if (currentStreak > user.goals.longestStreak) {
          user.goals.longestStreak = currentStreak;
        }

        // Update total workouts and calories
        user.goals.totalWorkouts = completedWorkouts.length;
        user.goals.totalCaloriesBurned = completedWorkouts.reduce((sum, w) => sum + (w.caloriesPerSet || 0), 0);

        await user.save();
        return res.status(200).json({ 
          currentStreak: user.goals.currentStreak, 
          longestStreak: user.goals.longestStreak 
        });
      }

      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Handle user profile updates like /api/users/[id]
    if (pathname.match(/^\/api\/users\/[^\/]+$/) && !pathname.includes('/workouts') && !pathname.includes('/update-streak')) {
      const pathParts = pathname.split('/');
      const userId = pathParts[pathParts.length - 1];

      // Authenticate user
      const decoded = authenticate(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (req.method === 'PUT') {
        try {
          const { fitnessLevel, name, email } = req.body;
          console.log('Updating user profile:', userId, { fitnessLevel, name, email });

          const user = await User.findById(userId);
          if (!user) {
            return res.status(404).json({ error: 'User not found' });
          }

          // Only allow users to update their own profile or admins to update any profile
          if (decoded.id !== userId && decoded.role !== 'Admin') {
            return res.status(403).json({ error: 'Not authorized to update this user' });
          }

          // Update allowed fields
          if (fitnessLevel) user.fitnessLevel = fitnessLevel;
          if (name) user.name = name;
          if (email) user.email = email;

          await user.save();
          console.log('User profile updated successfully');
          return res.status(200).json(user);
        } catch (dbError) {
          console.error('Database error in PUT user:', dbError);
          return res.status(500).json({ error: 'Database error', details: dbError.message });
        }
      }

      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Handle community data routes like /api/community
    if (pathname.startsWith('/api/community')) {
      if (req.method === 'GET') {
        // Return community stats and leaderboard
        const totalUsers = await mongoose.models.User?.countDocuments() || 0;
        const totalWorkouts = await WorkoutCompletion.countDocuments() || 0;

        return res.status(200).json({
          totalUsers,
          totalWorkouts,
          message: 'Community data loaded successfully'
        });
      }

      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Handle admin data routes like /api/admin/users, /api/admin/workouts, etc.
    if (pathname.startsWith('/api/admin/')) {
      // Authenticate admin user
      const decoded = authenticate(req);
      if (!decoded) {
        console.log('Admin route - no authentication');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log('Admin route accessed by user:', decoded.id);

      // Check if user is admin
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      console.log('Current user role:', currentUser.accountRole);
      
      if (currentUser.accountRole !== 'Admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      if (pathname === '/api/admin/users' && req.method === 'GET') {
        console.log('Getting all users for admin');
        const users = await User.find({ accountRole: { $ne: 'Admin' } }).select('-password');
        console.log('Found users:', users.length);
        return res.status(200).json(users);
      }

      if (pathname === '/api/admin/workouts' && req.method === 'GET') {
        // Return mock workout catalog for now
        const mockWorkouts = [
          { _id: '1', name: 'Push-ups', category: 'Strength', difficulty: 'Beginner' },
          { _id: '2', name: 'Squats', category: 'Strength', difficulty: 'Beginner' },
          { _id: '3', name: 'Plank', category: 'Core', difficulty: 'Beginner' },
          { _id: '4', name: 'Burpees', category: 'Cardio', difficulty: 'Intermediate' },
          { _id: '5', name: 'Pull-ups', category: 'Strength', difficulty: 'Master' },
          { _id: '6', name: 'Mountain Climbers', category: 'Cardio', difficulty: 'Intermediate' },
          { _id: '7', name: 'Deadlifts', category: 'Strength', difficulty: 'Master' },
          { _id: '8', name: 'Jumping Jacks', category: 'Cardio', difficulty: 'Beginner' }
        ];
        return res.status(200).json(mockWorkouts);
      }

      if (pathname === '/api/admin/diet-plans' && req.method === 'GET') {
        // Return mock diet plans
        const mockDietPlans = [
          { _id: '1', name: 'Weight Loss Plan', goal: 'Weight Loss', difficulty: 'Beginner', description: 'Low calorie, high protein diet' },
          { _id: '2', name: 'Muscle Gain Plan', goal: 'Muscle Gain', difficulty: 'Intermediate', description: 'High protein, moderate carbs' },
          { _id: '3', name: 'Performance Plan', goal: 'Performance', difficulty: 'Master', description: 'Optimized for athletic performance' }
        ];
        return res.status(200).json(mockDietPlans);
      }

      // Handle workout assignment to users
      if (pathname.match(/^\/api\/admin\/users\/[^\/]+\/assign-workouts$/) && req.method === 'POST') {
        const pathParts = pathname.split('/');
        const userId = pathParts[pathParts.length - 2];
        const { workoutIds, sets, reps } = req.body;

        console.log('Assigning workouts to user:', userId, 'Workouts:', workoutIds);

        if (!workoutIds || !Array.isArray(workoutIds) || workoutIds.length === 0) {
          return res.status(400).json({ error: 'workoutIds array is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Initialize workouts array if it doesn't exist
        if (!user.workouts) {
          user.workouts = [];
        }

        // Mock workout names based on IDs
        const workoutNames = {
          '1': 'Push-ups',
          '2': 'Squats', 
          '3': 'Plank',
          '4': 'Burpees',
          '5': 'Pull-ups',
          '6': 'Mountain Climbers',
          '7': 'Deadlifts',
          '8': 'Jumping Jacks'
        };

        // Add workouts to user
        workoutIds.forEach(workoutId => {
          const workoutName = workoutNames[workoutId] || `Workout ${workoutId}`;
          user.workouts.push({
            exercise: workoutName,
            sets: sets || 3,
            reps: reps || 12,
            completed: false,
            date: new Date(),
            caloriesPerSet: 15
          });
        });

        await user.save();
        console.log('Workouts assigned successfully');
        return res.status(200).json({ message: 'Workouts assigned successfully', user });
      }

      return res.status(404).json({ error: 'Admin endpoint not found' });
    }

    // Default 404 for unmatched routes
    res.status(404).json({ error: 'NOT_FOUND', message: 'Endpoint not found', path: pathname });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
