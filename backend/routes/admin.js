const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const WorkoutCatalog = require('../models/WorkoutCatalog');
const DietPlan = require('../models/DietPlan');
const WorkoutPlan = require('../models/WorkoutPlan');
const UserWorkoutPlan = require('../models/UserWorkoutPlan');
const User = require('../models/User');
const axios = require('axios');

// All routes here are admin-protected
router.use(verifyToken, requireAdmin);

// Pexels API endpoint for workout videos
router.get('/pexels-videos/:workoutName', async (req, res) => {
  try {
    const { workoutName } = req.params;
    const perPage = req.query.per_page || 10;
    const page = req.query.page || 1;
    
    // Use environment variable for API key, fallback to demo key
    const apiKey = process.env.PEXELS_API_KEY || '563492ad6f91700001000001a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
    
    const searchQuery = `${workoutName} workout exercise fitness`;
    
    const response = await axios.get(`https://api.pexels.com/videos/search`, {
      params: {
        query: searchQuery,
        per_page: perPage,
        page: page
      },
      headers: {
        'Authorization': apiKey
      }
    });
    
    // Process the videos to include only necessary data
    const videos = response.data.videos.map(video => ({
      id: video.id,
      url: video.url,
      image: video.image,
      duration: video.duration,
      user: video.user,
      video_files: video.video_files.map(file => ({
        id: file.id,
        quality: file.quality,
        file_type: file.file_type,
        width: file.width,
        height: file.height,
        link: file.link
      }))
    }));
    
    res.json({
      videos: videos,
      total_results: response.data.total_results,
      page: response.data.page,
      per_page: response.data.per_page
    });
    
  } catch (error) {
    console.error('Pexels API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch workout videos',
      details: error.response?.data?.error || error.message
    });
  }
});

// Users overview (non-admin accounts by default)
router.get('/users', async (req, res) => {
  try {
    const includeAdmins = req.query.includeAdmins === 'true';
    const query = includeAdmins ? {} : { accountRole: 'User' };
    const users = await User.find(query)
      .select('name email fitnessLevel workouts createdAt accountRole');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Workout Catalog CRUD
router.get('/workouts', async (req, res) => {
  try {
    const items = await WorkoutCatalog.find();
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/workouts', async (req, res) => {
  try {
    const created = await WorkoutCatalog.create(req.body);
    res.status(201).json(created);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/workouts/:id', async (req, res) => {
  try {
    const updated = await WorkoutCatalog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/workouts/:id', async (req, res) => {
  try {
    const deleted = await WorkoutCatalog.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Diet Plans CRUD
router.get('/diet-plans', async (req, res) => {
  try {
    const items = await DietPlan.find();
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/diet-plans', async (req, res) => {
  try {
    const created = await DietPlan.create(req.body);
    res.status(201).json(created);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/diet-plans/:id', async (req, res) => {
  try {
    const updated = await DietPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/diet-plans/:id', async (req, res) => {
  try {
    const deleted = await DietPlan.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Assign selected catalog workouts to a user
router.post('/users/:userId/assign-workouts', async (req, res) => {
  try {
    const { workoutIds, sets = 3, reps = 10 } = req.body;
    if (!Array.isArray(workoutIds) || workoutIds.length === 0) {
      return res.status(400).json({ error: 'workoutIds array is required' });
    }
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const items = await WorkoutCatalog.find({ _id: { $in: workoutIds } });
    if (items.length === 0) return res.status(400).json({ error: 'No workouts found for given ids' });

    items.forEach(item => {
      user.workouts.push({
        catalogId: item._id,
        exercise: item.name,
        sets,
        reps,
        imageUrl: item.imageUrl,
        completed: false,
        date: new Date()
      });
    });

    await user.save();
    res.json({ success: true, count: items.length, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Seed 50+ workouts quickly
router.post('/seed/workouts', async (req, res) => {
  try {
    const base = [
      'Push-up','Pull-up','Squat','Lunge','Burpee','Plank','Mountain Climber','Jumping Jack','Bench Press','Deadlift',
      'Overhead Press','Bent-over Row','Bicep Curl','Tricep Dip','Shoulder Fly','Leg Press','Leg Curl','Calf Raise','Russian Twist','Bicycle Crunch',
      'Sit-up','Hollow Hold','Hip Thrust','Glute Bridge','Kettlebell Swing','Farmer Carry','Wall Sit','Box Jump','Rowing','Sprint',
      'Stair Climb','Elliptical','Jump Rope','High Knees','Butt Kicks','Side Plank','Bird Dog','Superman','Good Morning','Face Pull',
      'Lat Pulldown','Chest Fly','Incline Press','Front Squat','Romanian Deadlift','Sumo Deadlift','Hamstring Curl','Pec Deck','Cable Row','Leg Extension',
      'Side Lunge','Curtsy Lunge','Bulgarian Split Squat','Reverse Lunge','Arnold Press','Hammer Curl'
    ];
    const getImageForName = (name) => {
      const n = (name || '').toLowerCase();
      // Explicit mappings for common exercises
      const explicit = {
        'push-up': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1200&auto=format&fit=crop',
        'pushup': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1200&auto=format&fit=crop',
        'pull-up': 'https://images.unsplash.com/photo-1517963879433-6ad2b056d0f1?q=80&w=1200&auto=format&fit=crop',
        'pullup': 'https://images.unsplash.com/photo-1517963879433-6ad2b056d0f1?q=80&w=1200&auto=format&fit=crop',
        'squat': 'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=80&w=1200&auto=format&fit=crop',
        'lunge': 'https://images.unsplash.com/photo-1584467735871-b0d2b1b3da3b?q=80&w=1200&auto=format&fit=crop',
        'burpee': 'https://images.unsplash.com/photo-1597074866923-3cfbfe35277a?q=80&w=1200&auto=format&fit=crop',
        'plank': 'https://images.unsplash.com/photo-1596357395104-5b6b5b0fb30a?q=80&w=1200&auto=format&fit=crop',
        'jumping jack': 'https://images.pexels.com/photos/1552255/pexels-photo-1552255.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop',
        'bicycle crunch': 'https://images.pexels.com/photos/4498292/pexels-photo-4498292.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop',
        'bicep curl': 'https://images.unsplash.com/photo-1534367610401-9f1e1c21a1b6?q=80&w=1200&auto=format&fit=crop',
        'leg curl': 'https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop',
        'bench press': 'https://images.unsplash.com/photo-1517833969405-d4a24c1fdbed?q=80&w=1200&auto=format&fit=crop',
        'deadlift': 'https://images.unsplash.com/photo-1571907480495-3f30e6f2baff?q=80&w=1200&auto=format&fit=crop',
        'row': 'https://images.unsplash.com/photo-1598970434795-0c54fe7c0642?q=80&w=1200&auto=format&fit=crop',
        'kettlebell swing': 'https://images.unsplash.com/photo-1583454110551-21f2a3dfcc5a?q=80&w=1200&auto=format&fit=crop'
      };
      for (const key of Object.keys(explicit)) {
        if (n.includes(key)) return explicit[key];
      }
      if (n.includes('push')) return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1200&auto=format&fit=crop';
      if (n.includes('pull')) return 'https://images.unsplash.com/photo-1517963879433-6ad2b056d0f1?q=80&w=1200&auto=format&fit=crop';
      if (n.includes('squat')) return 'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=80&w=1200&auto=format&fit=crop';
      if (n.includes('lunge')) return 'https://images.unsplash.com/photo-1584467735871-b0d2b1b3da3b?q=80&w=1200&auto=format&fit=crop';
      if (n.includes('burpee')) return 'https://images.unsplash.com/photo-1597074866923-3cfbfe35277a?q=80&w=1200&auto=format&fit=crop';
      if (n.includes('plank')) return 'https://images.unsplash.com/photo-1596357395104-5b6b5b0fb30a?q=80&w=1200&auto=format&fit=crop';
      if (n.includes('bicycle') || n.includes('crunch')) return 'https://images.pexels.com/photos/4498292/pexels-photo-4498292.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop';
      if (n.includes('jack')) return 'https://images.pexels.com/photos/1552255/pexels-photo-1552255.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop';
      if (n.includes('bench')) return 'https://images.unsplash.com/photo-1517833969405-d4a24c1fdbed?q=80&w=1200&auto=format&fit=crop';
      if (n.includes('deadlift')) return 'https://images.unsplash.com/photo-1571907480495-3f30e6f2baff?q=80&w=1200&auto=format&fit=crop';
      if (n.includes('curl')) return 'https://images.unsplash.com/photo-1534367610401-9f1e1c21a1b6?q=80&w=1200&auto=format&fit=crop';
      if (n.includes('row')) return 'https://images.unsplash.com/photo-1598970434795-0c54fe7c0642?q=80&w=1200&auto=format&fit=crop';
      if (n.includes('press')) return 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=1200&auto=format&fit=crop';
      if (n.includes('jump')) return 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=1200&auto=format&fit=crop';
      if (n.includes('rope')) return 'https://images.unsplash.com/photo-1599058945522-28d0b9230e1a?q=80&w=1200&auto=format&fit=crop';
      if (n.includes('kettlebell')) return 'https://images.unsplash.com/photo-1583454110551-21f2a3dfcc5a?q=80&w=1200&auto=format&fit=crop';
      return 'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=80&w=1200&auto=format&fit=crop';
    };

    const docs = base.map((n, i) => ({
      name: n,
      category: ['Strength','Cardio','Core','HIIT','Mobility','Other'][i % 6],
      difficulty: ['Beginner','Intermediate','Master'][i % 3],
      equipment: [],
      description: `${n} exercise`,
      caloriesPerSet: 10 + (i % 15),
      imageUrl: getImageForName(n)
    }));

    await WorkoutCatalog.deleteMany({});
    const created = await WorkoutCatalog.insertMany(docs);
    res.json({ count: created.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Seed diet plans with three major categories
router.post('/seed/diet-plans', async (req, res) => {
  try {
    const dietPlans = [
      // Beginner Diet Plans
      {
        name: "Simple Balanced Diet",
        goal: "Maintenance",
        difficulty: "Beginner",
        description: "A basic balanced diet perfect for beginners starting their fitness journey",
        meals: [
          { title: "Breakfast", items: ["Oatmeal with banana", "Greek yogurt", "Green tea"], calories: 350 },
          { title: "Lunch", items: ["Grilled chicken salad", "Mixed vegetables", "Brown rice"], calories: 450 },
          { title: "Dinner", items: ["Baked salmon", "Sweet potato", "Steamed broccoli"], calories: 500 },
          { title: "Snacks", items: ["Apple", "Almonds (10 pieces)", "Water"], calories: 200 }
        ]
      },
      {
        name: "Beginner Weight Loss",
        goal: "Weight Loss",
        difficulty: "Beginner",
        description: "Easy-to-follow weight loss plan for beginners",
        meals: [
          { title: "Breakfast", items: ["Scrambled eggs (2)", "Whole grain toast", "Avocado"], calories: 300 },
          { title: "Lunch", items: ["Turkey wrap", "Mixed greens", "Cucumber"], calories: 400 },
          { title: "Dinner", items: ["Grilled fish", "Quinoa", "Asparagus"], calories: 450 },
          { title: "Snacks", items: ["Berries", "Green tea"], calories: 100 }
        ]
      },
      {
        name: "Beginner Muscle Building",
        goal: "Muscle Gain",
        difficulty: "Beginner",
        description: "Simple muscle building diet for beginners",
        meals: [
          { title: "Breakfast", items: ["Protein smoothie", "Banana", "Peanut butter"], calories: 500 },
          { title: "Lunch", items: ["Chicken breast", "Brown rice", "Black beans"], calories: 600 },
          { title: "Dinner", items: ["Lean beef", "Sweet potato", "Spinach"], calories: 550 },
          { title: "Snacks", items: ["Protein bar", "Milk"], calories: 250 }
        ]
      },
      // Intermediate Diet Plans
      {
        name: "Intermediate Performance Diet",
        goal: "Performance",
        difficulty: "Intermediate",
        description: "Advanced nutrition plan for intermediate fitness enthusiasts",
        meals: [
          { title: "Breakfast", items: ["Protein pancakes", "Berries", "Greek yogurt", "Honey"], calories: 450 },
          { title: "Pre-Workout", items: ["Banana", "Almond butter", "Coffee"], calories: 200 },
          { title: "Post-Workout", items: ["Protein shake", "Oatmeal", "Blueberries"], calories: 400 },
          { title: "Lunch", items: ["Quinoa bowl", "Grilled chicken", "Mixed vegetables", "Tahini"], calories: 550 },
          { title: "Dinner", items: ["Salmon", "Wild rice", "Roasted vegetables"], calories: 500 },
          { title: "Snacks", items: ["Nuts", "Dark chocolate", "Green tea"], calories: 200 }
        ]
      },
      {
        name: "Intermediate Weight Loss",
        goal: "Weight Loss",
        difficulty: "Intermediate",
        description: "Structured weight loss plan with macro tracking",
        meals: [
          { title: "Breakfast", items: ["Egg white omelet", "Spinach", "Tomato", "Whole grain toast"], calories: 300 },
          { title: "Lunch", items: ["Grilled chicken", "Quinoa", "Mixed vegetables", "Olive oil"], calories: 450 },
          { title: "Dinner", items: ["Baked cod", "Cauliflower rice", "Asparagus"], calories: 400 },
          { title: "Snacks", items: ["Greek yogurt", "Berries", "Green tea"], calories: 150 }
        ]
      },
      {
        name: "Intermediate Muscle Gain",
        goal: "Muscle Gain",
        difficulty: "Intermediate",
        description: "Advanced muscle building with precise nutrition timing",
        meals: [
          { title: "Breakfast", items: ["Protein smoothie", "Oats", "Banana", "Peanut butter"], calories: 600 },
          { title: "Pre-Workout", items: ["Rice cakes", "Honey", "BCAA"], calories: 200 },
          { title: "Post-Workout", items: ["Whey protein", "Sweet potato", "Banana"], calories: 500 },
          { title: "Lunch", items: ["Chicken breast", "Brown rice", "Black beans", "Avocado"], calories: 650 },
          { title: "Dinner", items: ["Lean beef", "Sweet potato", "Broccoli"], calories: 600 },
          { title: "Snacks", items: ["Cottage cheese", "Almonds", "Protein bar"], calories: 300 }
        ]
      },
      // Master Diet Plans
      {
        name: "Master Performance Diet",
        goal: "Performance",
        difficulty: "Master",
        description: "Elite-level nutrition plan for advanced athletes",
        meals: [
          { title: "Breakfast", items: ["Protein pancakes", "Berries", "Greek yogurt", "Chia seeds", "Honey"], calories: 500 },
          { title: "Pre-Workout", items: ["Banana", "Almond butter", "BCAA", "Coffee"], calories: 250 },
          { title: "Post-Workout", items: ["Whey protein", "Oatmeal", "Blueberries", "Creatine"], calories: 450 },
          { title: "Lunch", items: ["Quinoa bowl", "Grilled chicken", "Mixed vegetables", "Tahini", "Hemp seeds"], calories: 600 },
          { title: "Dinner", items: ["Wild salmon", "Wild rice", "Roasted vegetables", "Olive oil"], calories: 550 },
          { title: "Snacks", items: ["Mixed nuts", "Dark chocolate", "Green tea", "Probiotics"], calories: 250 }
        ]
      },
      {
        name: "Master Weight Loss",
        goal: "Weight Loss",
        difficulty: "Master",
        description: "Precision weight loss plan with advanced techniques",
        meals: [
          { title: "Breakfast", items: ["Egg white omelet", "Spinach", "Tomato", "Whole grain toast", "Avocado"], calories: 350 },
          { title: "Lunch", items: ["Grilled chicken", "Quinoa", "Mixed vegetables", "Olive oil", "Lemon"], calories: 500 },
          { title: "Dinner", items: ["Baked cod", "Cauliflower rice", "Asparagus", "Herbs"], calories: 450 },
          { title: "Snacks", items: ["Greek yogurt", "Berries", "Green tea", "Cinnamon"], calories: 200 }
        ]
      },
      {
        name: "Master Muscle Gain",
        goal: "Muscle Gain",
        difficulty: "Master",
        description: "Elite muscle building with advanced nutrition science",
        meals: [
          { title: "Breakfast", items: ["Protein smoothie", "Oats", "Banana", "Peanut butter", "Chia seeds"], calories: 650 },
          { title: "Pre-Workout", items: ["Rice cakes", "Honey", "BCAA", "Beta-alanine"], calories: 250 },
          { title: "Post-Workout", items: ["Whey protein", "Sweet potato", "Banana", "Creatine"], calories: 550 },
          { title: "Lunch", items: ["Chicken breast", "Brown rice", "Black beans", "Avocado", "Hemp seeds"], calories: 700 },
          { title: "Dinner", items: ["Lean beef", "Sweet potato", "Broccoli", "Olive oil"], calories: 650 },
          { title: "Snacks", items: ["Cottage cheese", "Almonds", "Protein bar", "Casein"], calories: 350 }
        ]
      }
    ];

    await DietPlan.deleteMany({});
    const created = await DietPlan.insertMany(dietPlans);
    res.json({ count: created.length });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// Workout Plans CRUD
router.get('/workout-plans', async (req, res) => {
  try {
    const plans = await WorkoutPlan.find().populate('createdBy', 'name');
    res.json(plans);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

router.post('/workout-plans', async (req, res) => {
  try {
    const plan = await WorkoutPlan.create(req.body);
    res.status(201).json(plan);
  } catch (err) { 
    res.status(400).json({ error: err.message }); 
  }
});

router.put('/workout-plans/:id', async (req, res) => {
  try {
    const plan = await WorkoutPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    res.json(plan);
  } catch (err) { 
    res.status(400).json({ error: err.message }); 
  }
});

router.delete('/workout-plans/:id', async (req, res) => {
  try {
    const plan = await WorkoutPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    res.json({ success: true });
  } catch (err) { 
    res.status(400).json({ error: err.message }); 
  }
});

// Assign workout plan to user
router.post('/users/:userId/assign-plan', async (req, res) => {
  try {
    const { planId, startDate } = req.body;
    const user = await User.findById(req.params.userId);
    const plan = await WorkoutPlan.findById(planId);
    
    if (!user || !plan) {
      return res.status(404).json({ error: 'User or plan not found' });
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
    res.json(savedUserPlan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Seed workout plans
router.post('/seed/workout-plans', async (req, res) => {
  try {
    const workoutPlans = [
      {
        name: "30-Day Beginner Strength",
        description: "Perfect for beginners starting their fitness journey",
        category: "Strength",
        difficulty: "Beginner",
        duration: 30,
        tags: ["beginner", "strength", "30-day"],
        days: [
          {
            dayNumber: 1,
            dayName: "Day 1",
            title: "Upper Body Foundation",
            description: "Basic upper body exercises to build strength",
            exercises: [
              { name: "Push-ups", sets: 3, reps: 10, restTime: 60 },
              { name: "Plank", sets: 3, reps: 30, restTime: 60 },
              { name: "Arm Circles", sets: 2, reps: 20, restTime: 30 }
            ],
            duration: 25,
            difficulty: "Easy"
          },
          {
            dayNumber: 2,
            dayName: "Day 2", 
            title: "Lower Body Foundation",
            description: "Basic lower body exercises",
            exercises: [
              { name: "Squats", sets: 3, reps: 15, restTime: 60 },
              { name: "Lunges", sets: 3, reps: 10, restTime: 60 },
              { name: "Calf Raises", sets: 3, reps: 20, restTime: 30 }
            ],
            duration: 25,
            difficulty: "Easy"
          }
        ]
      },
      {
        name: "21-Day HIIT Challenge",
        description: "High-intensity interval training for fat burning",
        category: "HIIT",
        difficulty: "Intermediate",
        duration: 21,
        tags: ["hiit", "fat-burn", "21-day"],
        days: [
          {
            dayNumber: 1,
            dayName: "Day 1",
            title: "HIIT Cardio Blast",
            description: "High-intensity cardio workout",
            exercises: [
              { name: "Burpees", sets: 4, reps: 10, restTime: 30 },
              { name: "Mountain Climbers", sets: 4, reps: 20, restTime: 30 },
              { name: "Jumping Jacks", sets: 4, reps: 30, restTime: 30 }
            ],
            duration: 20,
            difficulty: "Hard"
          }
        ]
      }
    ];

    await WorkoutPlan.deleteMany({});
    const created = await WorkoutPlan.insertMany(workoutPlans);
    res.json({ count: created.length });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

module.exports = router;


