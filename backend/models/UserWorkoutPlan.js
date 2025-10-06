const mongoose = require('mongoose');

const userWorkoutPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutPlan', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  currentDay: { type: Number, default: 1 },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'paused', 'cancelled'], 
    default: 'active' 
  },
  progress: {
    completedDays: { type: Number, default: 0 },
    totalDays: { type: Number, required: true },
    completionPercentage: { type: Number, default: 0 }
  },
  notes: { type: String },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Calculate completion percentage before saving
userWorkoutPlanSchema.pre('save', function(next) {
  if (this.progress.totalDays > 0) {
    this.progress.completionPercentage = Math.round((this.progress.completedDays / this.progress.totalDays) * 100);
  }
  next();
});

module.exports = mongoose.model('UserWorkoutPlan', userWorkoutPlanSchema);
