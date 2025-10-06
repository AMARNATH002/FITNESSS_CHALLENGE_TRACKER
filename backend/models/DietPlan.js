const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  title: { type: String, required: true },
  items: { type: [String], default: [] },
  calories: { type: Number, default: 0 }
});

const dietPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  goal: { type: String, enum: ['Weight Loss', 'Muscle Gain', 'Maintenance', 'Performance'], default: 'Maintenance' },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Master'], default: 'Beginner' },
  meals: { type: [mealSchema], default: [] },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DietPlan', dietPlanSchema);


