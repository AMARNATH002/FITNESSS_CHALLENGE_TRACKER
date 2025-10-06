const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema({
  // Optional reference back to catalog for richer UI
  catalogId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutCatalog' },
  exercise: { type: String, required: true },
  sets: { type: Number, required: true },
  reps: { type: Number, required: true },
  imageUrl: { type: String },
  completed: { type: Boolean, default: false },
  date: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // Admin/User account role
  accountRole: { type: String, enum: ['User', 'Admin'], default: 'User' },
  // Fitness level for programs
  fitnessLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Master'], default: 'Beginner' },
  workouts: [workoutSchema],
  // Enhanced workout goals and progress tracking
  goals: {
    dailyWorkouts: { type: Number, default: 1 },
    weeklyWorkouts: { type: Number, default: 5 },
    monthlyWorkouts: { type: Number, default: 20 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    totalWorkouts: { type: Number, default: 0 },
    totalCaloriesBurned: { type: Number, default: 0 },
    achievements: [{ 
      name: String, 
      description: String, 
      unlockedAt: { type: Date, default: Date.now },
      icon: String
    }],
    weeklyProgress: [{
      week: String, // "2024-W01"
      workoutsCompleted: { type: Number, default: 0 },
      caloriesBurned: { type: Number, default: 0 },
      streakDays: { type: Number, default: 0 }
    }],
    monthlyProgress: [{
      month: String, // "2024-01"
      workoutsCompleted: { type: Number, default: 0 },
      caloriesBurned: { type: Number, default: 0 },
      averageStreak: { type: Number, default: 0 }
    }]
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
