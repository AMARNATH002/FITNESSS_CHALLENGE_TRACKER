const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sets: { type: Number, required: true },
  reps: { type: Number, required: true },
  weight: { type: Number, default: 0 },
  restTime: { type: Number, default: 60 }, // in seconds
  notes: { type: String },
  completed: { type: Boolean, default: false }
});

const workoutDaySchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  dayName: { type: String, required: true }, // "Day 1", "Day 2", etc.
  title: { type: String, required: true },
  description: { type: String },
  exercises: [exerciseSchema],
  duration: { type: Number, default: 30 }, // in minutes
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date }
});

const workoutPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ['Strength', 'Cardio', 'HIIT', 'Flexibility', 'Mixed'], default: 'Mixed' },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  duration: { type: Number, required: true }, // total days
  imageUrl: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPublic: { type: Boolean, default: true },
  tags: [String],
  days: [workoutDaySchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
workoutPlanSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
