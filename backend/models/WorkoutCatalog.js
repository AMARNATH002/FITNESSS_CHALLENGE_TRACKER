const mongoose = require('mongoose');

const workoutCatalogSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['Strength', 'Cardio', 'Flexibility', 'Mobility', 'Core', 'HIIT', 'Other'], default: 'Other' },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Master'], default: 'Beginner' },
  equipment: { type: [String], default: [] },
  description: { type: String },
  caloriesPerSet: { type: Number, default: 0 },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WorkoutCatalog', workoutCatalogSchema);


