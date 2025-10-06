const mongoose = require('mongoose');

const workoutScheduleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String }, // "09:00", "14:30", etc.
  duration: { type: Number, default: 30 }, // in minutes
  exercises: [{
    name: { type: String, required: true },
    sets: { type: Number, default: 3 },
    reps: { type: Number, default: 10 },
    restTime: { type: Number, default: 60 }, // in seconds
    notes: { type: String }
  }],
  status: { 
    type: String, 
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'skipped'], 
    default: 'scheduled' 
  },
  completedAt: { type: Date },
  notes: { type: String },
  reminderSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
workoutScheduleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('WorkoutSchedule', workoutScheduleSchema);
