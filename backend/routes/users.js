const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const WorkoutSchedule = require("../models/WorkoutSchedule");
const WorkoutPlan = require("../models/WorkoutPlan");
const UserWorkoutPlan = require("../models/UserWorkoutPlan");
const { verifyToken, requireAdmin } = require("../middleware/auth");

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, accountRole, fitnessLevel } = req.body;

    // check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashed,
      accountRole: accountRole === 'Admin' ? 'Admin' : 'User',
      fitnessLevel: fitnessLevel || 'Beginner'
    });
    const saved = await user.save();
    const token = jwt.sign({ id: saved._id, role: saved.accountRole }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
    res.status(201).json({ user: saved, token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/new-feature', (req, res) => {
  res.send('This is a new feature!');
});
// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

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
    if (!isValid) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user._id, role: user.accountRole }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
    res.json({ message: "Login successful", user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users (Admin only)
router.get("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get users for blog/community view (Public for logged-in users)
router.get("/community", verifyToken, async (req, res) => {
  try {
    // Only return non-admin users for community view
    const users = await User.find({ accountRole: 'User' }).select('name fitnessLevel workouts createdAt');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add workout
router.post("/:userId/workouts", verifyToken, async (req, res) => {
  try {
    const { exercise, sets, reps, completed, date } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.workouts.push({ 
      exercise, 
      sets, 
      reps, 
      completed: completed || false,
      date: date ? new Date(date) : new Date()
    });
    await user.save();
    
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Complete workout
router.put("/:userId/workouts/:workoutId", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const workout = user.workouts.id(req.params.workoutId);
    if (!workout) {
      return res.status(404).json({ error: "Workout not found" });
    }

    workout.completed = true;
    await user.save();
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user workouts
router.get("/:userId/workouts", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user.workouts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove user workout
router.delete("/:userId/workouts/:workoutId", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Only allow admins to remove workouts or users to remove their own workouts
    if (req.user.role !== 'Admin' && req.user.id !== req.params.userId) {
      return res.status(403).json({ error: "Not authorized to remove this workout" });
    }

    const workout = user.workouts.id(req.params.workoutId);
    if (!workout) {
      return res.status(404).json({ error: "Workout not found" });
    }

    user.workouts.pull(req.params.workoutId);
    await user.save();
    
    res.json({ message: "Workout removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user profile (including fitnessLevel)
router.put("/:userId", verifyToken, async (req, res) => {
  try {
    const { fitnessLevel, name, email, goals } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Only allow users to update their own profile or admins to update any profile
    if (req.user.id !== req.params.userId && req.user.role !== 'Admin') {
      return res.status(403).json({ error: "Not authorized to update this user" });
    }

    // Update allowed fields
    if (fitnessLevel) user.fitnessLevel = fitnessLevel;
    if (name) user.name = name;
    if (email) user.email = email;
    if (goals) user.goals = { ...user.goals, ...goals };

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user goals
router.get("/:userId/goals", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('goals');
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user.goals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user goals
router.put("/:userId/goals", verifyToken, async (req, res) => {
  try {
    const { dailyWorkouts, weeklyWorkouts, monthlyWorkouts } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Only allow users to update their own goals
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: "Not authorized to update this user's goals" });
    }

    // Update goals
    if (dailyWorkouts !== undefined) user.goals.dailyWorkouts = dailyWorkouts;
    if (weeklyWorkouts !== undefined) user.goals.weeklyWorkouts = weeklyWorkouts;
    if (monthlyWorkouts !== undefined) user.goals.monthlyWorkouts = monthlyWorkouts;

    await user.save();
    res.json(user.goals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get detailed progress analytics
router.get("/:userId/analytics", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Only allow users to view their own analytics or admins to view any
    if (req.user.id !== req.params.userId && req.user.role !== 'Admin') {
      return res.status(403).json({ error: "Not authorized to view this user's analytics" });
    }

    const completedWorkouts = user.workouts.filter(w => w.completed);
    const totalWorkouts = completedWorkouts.length;
    const totalCalories = completedWorkouts.reduce((sum, w) => sum + (w.caloriesPerSet || 0), 0);
    
    // Calculate current streak
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

    // Calculate weekly progress for last 4 weeks
    const weeklyData = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (today.getDay() + (i * 7)));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekWorkouts = completedWorkouts.filter(w => {
        const workoutDate = new Date(w.date);
        return workoutDate >= weekStart && workoutDate <= weekEnd;
      });
      
      weeklyData.push({
        week: `Week ${4-i}`,
        workoutsCompleted: weekWorkouts.length,
        caloriesBurned: weekWorkouts.reduce((sum, w) => sum + (w.caloriesPerSet || 0), 0),
        streakDays: weekWorkouts.length
      });
    }

    // Calculate monthly progress for last 6 months
    const monthlyData = [];
    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      
      const monthWorkouts = completedWorkouts.filter(w => {
        const workoutDate = new Date(w.date);
        return workoutDate >= monthStart && workoutDate <= monthEnd;
      });
      
      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        workoutsCompleted: monthWorkouts.length,
        caloriesBurned: monthWorkouts.reduce((sum, w) => sum + (w.caloriesPerSet || 0), 0),
        averageStreak: monthWorkouts.length / 4 // Approximate weekly average
      });
    }

    // Calculate achievements
    const achievements = [];
    if (totalWorkouts >= 1) achievements.push({ name: "First Steps", description: "Completed your first workout!", icon: "🎯" });
    if (totalWorkouts >= 10) achievements.push({ name: "Getting Started", description: "Completed 10 workouts!", icon: "🔥" });
    if (totalWorkouts >= 50) achievements.push({ name: "Consistent", description: "Completed 50 workouts!", icon: "💪" });
    if (totalWorkouts >= 100) achievements.push({ name: "Dedicated", description: "Completed 100 workouts!", icon: "🏆" });
    if (currentStreak >= 7) achievements.push({ name: "Week Warrior", description: "7-day workout streak!", icon: "⚡" });
    if (currentStreak >= 30) achievements.push({ name: "Month Master", description: "30-day workout streak!", icon: "👑" });
    if (totalCalories >= 1000) achievements.push({ name: "Calorie Burner", description: "Burned 1000+ calories!", icon: "🔥" });
    if (totalCalories >= 10000) achievements.push({ name: "Calorie King", description: "Burned 10,000+ calories!", icon: "💥" });

    const analytics = {
      totalWorkouts,
      totalCaloriesBurned: totalCalories,
      currentStreak,
      longestStreak: user.goals.longestStreak,
      weeklyProgress: weeklyData,
      monthlyProgress: monthlyData,
      achievements,
      goals: user.goals,
      recentWorkouts: completedWorkouts.slice(0, 10).map(w => ({
        exercise: w.exercise,
        date: w.date,
        sets: w.sets,
        reps: w.reps,
        calories: w.caloriesPerSet || 0
      }))
    };

    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update streak when workout is completed
router.post("/:userId/update-streak", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Calculate new streak
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
    res.json({ currentStreak, longestStreak: user.goals.longestStreak });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Workout Scheduling Routes

// Create a new workout schedule
router.post("/:userId/schedules", verifyToken, async (req, res) => {
  try {
    const { title, description, scheduledDate, scheduledTime, duration, exercises } = req.body;
    
    // Only allow users to create schedules for themselves
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: "Not authorized to create schedules for this user" });
    }

    const schedule = new WorkoutSchedule({
      userId: req.params.userId,
      title,
      description,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      duration,
      exercises
    });

    const savedSchedule = await schedule.save();
    res.status(201).json(savedSchedule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get user's workout schedules
router.get("/:userId/schedules", verifyToken, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    // Only allow users to view their own schedules or admins to view any
    if (req.user.id !== req.params.userId && req.user.role !== 'Admin') {
      return res.status(403).json({ error: "Not authorized to view this user's schedules" });
    }

    let query = { userId: req.params.userId };
    
    if (startDate && endDate) {
      query.scheduledDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (status) {
      query.status = status;
    }

    const schedules = await WorkoutSchedule.find(query).sort({ scheduledDate: 1 });
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update workout schedule
router.put("/:userId/schedules/:scheduleId", verifyToken, async (req, res) => {
  try {
    const { title, description, scheduledDate, scheduledTime, duration, exercises, status, notes } = req.body;
    
    const schedule = await WorkoutSchedule.findOne({ 
      _id: req.params.scheduleId, 
      userId: req.params.userId 
    });
    
    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    // Only allow users to update their own schedules
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: "Not authorized to update this schedule" });
    }

    if (title) schedule.title = title;
    if (description) schedule.description = description;
    if (scheduledDate) schedule.scheduledDate = new Date(scheduledDate);
    if (scheduledTime) schedule.scheduledTime = scheduledTime;
    if (duration) schedule.duration = duration;
    if (exercises) schedule.exercises = exercises;
    if (status) {
      schedule.status = status;
      if (status === 'completed') {
        schedule.completedAt = new Date();
      }
    }
    if (notes) schedule.notes = notes;

    const updatedSchedule = await schedule.save();
    res.json(updatedSchedule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete workout schedule
router.delete("/:userId/schedules/:scheduleId", verifyToken, async (req, res) => {
  try {
    const schedule = await WorkoutSchedule.findOne({ 
      _id: req.params.scheduleId, 
      userId: req.params.userId 
    });
    
    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    // Only allow users to delete their own schedules
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: "Not authorized to delete this schedule" });
    }

    await WorkoutSchedule.findByIdAndDelete(req.params.scheduleId);
    res.json({ message: "Schedule deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get today's scheduled workouts
router.get("/:userId/schedules/today", verifyToken, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const schedules = await WorkoutSchedule.find({
      userId: req.params.userId,
      scheduledDate: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    }).sort({ scheduledTime: 1 });

    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get upcoming workouts (next 7 days)
router.get("/:userId/schedules/upcoming", verifyToken, async (req, res) => {
  try {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));

    const schedules = await WorkoutSchedule.find({
      userId: req.params.userId,
      scheduledDate: {
        $gte: today,
        $lte: nextWeek
      },
      status: { $in: ['scheduled', 'in_progress'] }
    }).sort({ scheduledDate: 1, scheduledTime: 1 });

    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Social Features

// Get leaderboard data
router.get("/leaderboard", verifyToken, async (req, res) => {
  try {
    const { period = 'all', limit = 50 } = req.query;
    
    let dateFilter = {};
    if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { 'workouts.date': { $gte: weekAgo } };
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { 'workouts.date': { $gte: monthAgo } };
    }

    const users = await User.aggregate([
      { $match: { accountRole: 'User', ...dateFilter } },
      {
        $project: {
          name: 1,
          fitnessLevel: 1,
          'goals.currentStreak': 1,
          'goals.longestStreak': 1,
          'goals.totalWorkouts': 1,
          'goals.totalCaloriesBurned': 1,
          completedWorkouts: {
            $filter: {
              input: '$workouts',
              cond: { $eq: ['$$this.completed', true] }
            }
          }
        }
      },
      {
        $addFields: {
          recentWorkouts: {
            $size: {
              $filter: {
                input: '$completedWorkouts',
                cond: {
                  $gte: [
                    '$$this.date',
                    new Date(Date.now() - (period === 'week' ? 7 : period === 'month' ? 30 : 365) * 24 * 60 * 60 * 1000)
                  ]
                }
              }
            }
          },
          totalCalories: {
            $sum: '$completedWorkouts.caloriesPerSet'
          }
        }
      },
      {
        $sort: period === 'week' || period === 'month' ? 
          { recentWorkouts: -1, 'goals.currentStreak': -1 } : 
          { 'goals.totalWorkouts': -1, 'goals.currentStreak': -1 }
      },
      { $limit: parseInt(limit) }
    ]);

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's ranking
router.get("/:userId/ranking", verifyToken, async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    
    let dateFilter = {};
    if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { 'workouts.date': { $gte: weekAgo } };
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { 'workouts.date': { $gte: monthAgo } };
    }

    // Get user's stats
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const completedWorkouts = user.workouts.filter(w => w.completed);
    const recentWorkouts = completedWorkouts.filter(w => {
      const workoutDate = new Date(w.date);
      const cutoffDate = new Date(Date.now() - (period === 'week' ? 7 : period === 'month' ? 30 : 365) * 24 * 60 * 60 * 1000);
      return workoutDate >= cutoffDate;
    });

    // Get total users count for ranking calculation
    const totalUsers = await User.countDocuments({ accountRole: 'User' });
    
    // Get users with better stats
    const betterUsers = await User.countDocuments({
      accountRole: 'User',
      $or: [
        { 'goals.totalWorkouts': { $gt: user.goals.totalWorkouts } },
        { 
          'goals.totalWorkouts': user.goals.totalWorkouts,
          'goals.currentStreak': { $gt: user.goals.currentStreak }
        }
      ]
    });

    const ranking = {
      currentRank: betterUsers + 1,
      totalUsers,
      percentile: Math.round(((totalUsers - betterUsers) / totalUsers) * 100),
      stats: {
        totalWorkouts: user.goals.totalWorkouts,
        currentStreak: user.goals.currentStreak,
        longestStreak: user.goals.longestStreak,
        totalCalories: user.goals.totalCaloriesBurned,
        recentWorkouts: recentWorkouts.length
      }
    };

    res.json(ranking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get community feed (recent activities)
router.get("/community/feed", verifyToken, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const activities = await User.aggregate([
      { $match: { accountRole: 'User' } },
      { $unwind: '$workouts' },
      { $match: { 'workouts.completed': true } },
      {
        $project: {
          name: 1,
          fitnessLevel: 1,
          exercise: '$workouts.exercise',
          sets: '$workouts.sets',
          reps: '$workouts.reps',
          date: '$workouts.date',
          calories: '$workouts.caloriesPerSet'
        }
      },
      { $sort: { date: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Workout Plans for Users

// Get available workout plans
router.get("/workout-plans", verifyToken, async (req, res) => {
  try {
    const { category, difficulty } = req.query;
    let query = { isPublic: true };
    
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    
    const plans = await WorkoutPlan.find(query).select('-days');
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get specific workout plan details
router.get("/workout-plans/:planId", verifyToken, async (req, res) => {
  try {
    const plan = await WorkoutPlan.findById(req.params.planId);
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start a workout plan
router.post("/:userId/start-plan", verifyToken, async (req, res) => {
  try {
    const { planId, startDate } = req.body;
    
    // Only allow users to start plans for themselves
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: "Not authorized to start plans for this user" });
    }

    const plan = await WorkoutPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // Check if user already has an active plan
    const existingPlan = await UserWorkoutPlan.findOne({
      userId: req.params.userId,
      status: 'active'
    });

    if (existingPlan) {
      return res.status(400).json({ error: "You already have an active workout plan" });
    }

    const userPlan = new UserWorkoutPlan({
      userId: req.params.userId,
      planId: planId,
      startDate: new Date(startDate),
      totalDays: plan.duration,
      progress: {
        totalDays: plan.duration
      }
    });

    const savedUserPlan = await userPlan.save();
    res.status(201).json(savedUserPlan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get user's workout plans
router.get("/:userId/workout-plans", verifyToken, async (req, res) => {
  try {
    // Only allow users to view their own plans or admins to view any
    if (req.user.id !== req.params.userId && req.user.role !== 'Admin') {
      return res.status(403).json({ error: "Not authorized to view this user's plans" });
    }

    const userPlans = await UserWorkoutPlan.find({ userId: req.params.userId })
      .populate('planId', 'name description category difficulty duration imageUrl')
      .sort({ createdAt: -1 });
    
    res.json(userPlans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current active workout plan
router.get("/:userId/current-plan", verifyToken, async (req, res) => {
  try {
    const userPlan = await UserWorkoutPlan.findOne({
      userId: req.params.userId,
      status: 'active'
    }).populate('planId');

    if (!userPlan) {
      return res.status(404).json({ error: "No active workout plan found" });
    }

    res.json(userPlan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Complete a workout day
router.post("/:userId/complete-day", verifyToken, async (req, res) => {
  try {
    const { userPlanId, dayNumber } = req.body;
    
    // Only allow users to complete their own workouts
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: "Not authorized to complete workouts for this user" });
    }

    const userPlan = await UserWorkoutPlan.findById(userPlanId);
    if (!userPlan) {
      return res.status(404).json({ error: "User plan not found" });
    }

    // Update progress
    userPlan.progress.completedDays += 1;
    userPlan.currentDay = dayNumber + 1;
    
    // Check if plan is completed
    if (userPlan.currentDay > userPlan.progress.totalDays) {
      userPlan.status = 'completed';
      userPlan.completedAt = new Date();
    }

    await userPlan.save();
    res.json(userPlan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Pause or resume workout plan
router.put("/:userId/workout-plans/:userPlanId", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Only allow users to update their own plans
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: "Not authorized to update this plan" });
    }

    const userPlan = await UserWorkoutPlan.findOne({
      _id: req.params.userPlanId,
      userId: req.params.userId
    });

    if (!userPlan) {
      return res.status(404).json({ error: "User plan not found" });
    }

    userPlan.status = status;
    await userPlan.save();
    
    res.json(userPlan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
