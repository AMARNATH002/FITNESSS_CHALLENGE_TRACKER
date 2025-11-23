import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import WorkoutVideoModal from './WorkoutVideoModal';

// Reliable workout images from Pexels (working URLs)
const workoutImages = {
  // Beginner workouts
  pushups: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  squats: "https://images.pexels.com/photos/1552249/pexels-photo-1552249.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  plank: "https://images.pexels.com/photos/1552252/pexels-photo-1552252.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",

  // Intermediate workouts
  advanced_pushups: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  burpees: "https://images.pexels.com/photos/1552251/pexels-photo-1552251.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  plank_hold: "https://images.pexels.com/photos/1552252/pexels-photo-1552252.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",

  // Master workouts
  pullups: "https://images.pexels.com/photos/1552250/pexels-photo-1552250.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  jumping_lunges: "https://images.pexels.com/photos/1552249/pexels-photo-1552249.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  advanced_burpees: "https://images.pexels.com/photos/1552251/pexels-photo-1552251.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",

  // Additional workouts
  bicycle_crunch: "https://images.pexels.com/photos/1552253/pexels-photo-1552253.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  leg_curl: "https://images.pexels.com/photos/1552254/pexels-photo-1552254.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  jumping_jack: "https://images.pexels.com/photos/1552255/pexels-photo-1552255.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  bicep_curl: "https://images.pexels.com/photos/1552256/pexels-photo-1552256.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  lunge: "https://images.pexels.com/photos/1552249/pexels-photo-1552249.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  
  // Pull-up variations
  "pull-up": "https://images.pexels.com/photos/1552250/pexels-photo-1552250.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "pull up": "https://images.pexels.com/photos/1552250/pexels-photo-1552250.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
};

// Explicit image map for catalog/user workout names → ensures correct images
const explicitImageMap = {
  push_up: workoutImages.pushups,
  pushups: workoutImages.pushups,
  pull_up: workoutImages.pullups,
  pullups: workoutImages.pullups,
  squat: workoutImages.squats,
  squats: workoutImages.squats,
  plank: workoutImages.plank,
  burpee: workoutImages.burpees,
  burpees: workoutImages.burpees,
  lunge: workoutImages.lunge,
  lunges: workoutImages.lunge,
  jumping_jack: workoutImages.jumping_jack,
  bicycle_crunch: workoutImages.bicycle_crunch,
  bicep_curl: workoutImages.bicep_curl,
  leg_curl: workoutImages.leg_curl,
  advanced_pushups: workoutImages.advanced_pushups,
  plank_hold: workoutImages.plank_hold,
  jumping_lunges: workoutImages.jumping_lunges,
  advanced_burpees: workoutImages.advanced_burpees,
  'pull-up': workoutImages.pullups,
  'pull up': workoutImages.pullups,
};

// Normalize an exercise name to our mapping keys
const normalizeExerciseKey = (name = "") =>
  name.toString().trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

// Resolve best image for an exercise name; prefer explicit map
const getImageForExercise = (name) => {
  const key = normalizeExerciseKey(name);
  if (explicitImageMap[key]) return explicitImageMap[key];
  if (workoutImages[key]) return workoutImages[key];

  // Heuristic fallbacks with better matching
  if (key.includes("push")) return workoutImages.pushups;
  if (key.includes("squat")) return workoutImages.squats;
  if (key.includes("plank")) return workoutImages.plank;
  if (key.includes("burpee")) return workoutImages.burpees;
  if (key.includes("pull")) return workoutImages.pullups;
  if (key.includes("lunge")) return workoutImages.lunge;
  if (key.includes("curl")) return workoutImages.bicep_curl;
  if (key.includes("bicycle")) return workoutImages.bicycle_crunch;
  if (key.includes("jack")) return workoutImages.jumping_jack;
  if (key.includes("leg")) return workoutImages.leg_curl;
  
  // Additional fallbacks for common variations
  if (name.toLowerCase().includes("pull-up") || name.toLowerCase().includes("pull up")) {
    return workoutImages.pullups;
  }
  
  return workoutImages.pushups;
};

const toTitle = (s = '') => s
  .toString()
  .replace(/[-_]+/g, ' ')
  .toLowerCase()
  .replace(/\b\w/g, (c) => c.toUpperCase());

// Map any stored fitness level/role text to one of our supported challenge keys
const normalizeRole = (value = '') => {
  const text = value.toString().trim().toLowerCase();
  if (!text) return 'Beginner';
  if (text.includes('master') || text.includes('advanced')) return 'Master';
  if (text.includes('inter')) return 'Intermediate';
  if (text.includes('begin')) return 'Beginner';
  return 'Beginner';
};

function Challenges() {
  const location = useLocation();
  const navigate = useNavigate();
  const [completedWorkouts, setCompletedWorkouts] = useState([]);
  const [assignedWorkouts, setAssignedWorkouts] = useState([]);
  const [user, setUser] = useState(null);
  const [buttonStates, setButtonStates] = useState({});
  const [dailyCompletions, setDailyCompletions] = useState({});
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedWorkoutName, setSelectedWorkoutName] = useState('');
  const derivedRoleFromNav = location.state?.role;

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);

        // ✅ Load user's completed workouts from backend
        loadUserCompleted(parsed._id);
      } catch (_) {}
    }
  }, []);

  const loadUserCompleted = async (userId) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(
        `/api/users/${userId}/workouts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const workouts = response.data || [];
      setAssignedWorkouts(workouts);
      
      // Count daily completions for each exercise
      const today = new Date().toDateString();
      const dailyCounts = {};
      
      workouts.filter((w) => w.completed).forEach(workout => {
        const workoutDate = new Date(workout.date).toDateString();
        if (workoutDate === today) {
          dailyCounts[workout.exercise] = (dailyCounts[workout.exercise] || 0) + 1;
        }
      });
      
      setDailyCompletions(dailyCounts);
      
      // store exercises that are completed
      const completedExercises = workouts.filter((w) => w.completed).map((w) => w.exercise);
      setCompletedWorkouts(completedExercises);
    } catch (error) {
      console.error("Error loading completed workouts:", error);
    }
  };

  const role = normalizeRole(derivedRoleFromNav || user?.fitnessLevel || user?.role || "Beginner");

  const challenges = {
    Beginner: [
      { name: "Day 1-10: Push-ups", sets: 3, reps: 10, img: workoutImages.pushups, exercise: "pushups", dayRange: "1-10" },
      { name: "Day 11-20: Squats", sets: 3, reps: 15, img: workoutImages.squats, exercise: "squats", dayRange: "11-20" },
      { name: "Day 21-30: Plank", sets: 3, reps: 30, img: workoutImages.plank, exercise: "plank", dayRange: "21-30" }
    ],
    Intermediate: [
      { name: "Day 1-15: Advanced Push-ups", sets: 4, reps: 15, img: workoutImages.advanced_pushups, exercise: "advanced_pushups", dayRange: "1-15" },
      { name: "Day 16-30: Burpees", sets: 3, reps: 12, img: workoutImages.burpees, exercise: "burpees", dayRange: "16-30" },
      { name: "Day 31-45: Plank Hold", sets: 4, reps: 45, img: workoutImages.plank_hold, exercise: "plank_hold", dayRange: "31-45" }
    ],
    Master: [
      { name: "Day 1-20: Pull-ups", sets: 4, reps: 8, img: workoutImages.pullups, exercise: "pullups", dayRange: "1-20" },
      { name: "Day 21-40: Jumping Lunges", sets: 4, reps: 12, img: workoutImages.jumping_lunges, exercise: "jumping_lunges", dayRange: "21-40" },
      { name: "Day 41-60: Advanced Burpees", sets: 5, reps: 15, img: workoutImages.advanced_burpees, exercise: "advanced_burpees", dayRange: "41-60" }
    ]
  };

  const handleComplete = async (exercise, sets, reps) => {
    if (!user) {
      alert("Please login first!");
      navigate("/login");
      return;
    }

    // Check if already completed today
    if (dailyCompletions[exercise] >= 1) {
      alert("You've already completed this workout today! Come back tomorrow! 💪");
      return;
    }

    try {
      // Set button to "Completed!" state immediately
      setButtonStates(prev => ({ ...prev, [exercise]: 'completed' }));
      
      // Show alert message
      alert(`Great job! You completed today's ${exercise}! 💪`);
      
      // Save workout to database
      const token = sessionStorage.getItem('token');
      await axios.post(
        `/api/users/${user._id}/workouts`,
        {
          exercise,
          sets,
          reps,
          completed: true,
          date: new Date(),
          caloriesPerSet: Math.floor(Math.random() * 20) + 10 // Random calories for demo
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update streak after workout completion
      await axios.post(
        `/api/users/${user._id}/update-streak`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update daily completions
      setDailyCompletions(prev => ({
        ...prev,
        [exercise]: (prev[exercise] || 0) + 1
      }));

      // Immediately update the local state
      setCompletedWorkouts(prev => {
        if (!prev.includes(exercise)) {
          return [...prev, exercise];
        }
        return prev;
      });
      
      // After 3 seconds, reset button to normal state
      setTimeout(() => {
        setButtonStates(prev => ({ ...prev, [exercise]: 'normal' }));
      }, 3000);
      
      // Refresh the completed workouts list from server
      setTimeout(() => {
        loadUserCompleted(user._id);
      }, 100);
    } catch (error) {
      console.error(error);
      alert("Error recording workout. Try again!");
      // Reset button state on error
      setButtonStates(prev => ({ ...prev, [exercise]: 'normal' }));
    }
  };

  const isCompleted = (exercise) => completedWorkouts.includes(exercise);

  const openWorkoutVideo = (workoutName) => {
    setSelectedWorkoutName(workoutName);
    setVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    setVideoModalOpen(false);
    setSelectedWorkoutName('');
  };

  const isUnlocked = (exercise, index) => {
    // First workout is always unlocked
    if (index === 0) return true;
    
    // Check if previous workout phase is completed (15 days for first, 15 for second, etc.)
    const previousExercise = challenges[role][index - 1].exercise;
    const requiredDays = getRequiredDaysForPhase(role, index - 1);
    const completedDays = dailyCompletions[previousExercise] || 0;
    
    return completedDays >= requiredDays;
  };

  const getRequiredDaysForPhase = (level, phaseIndex) => {
    const phaseDays = {
      Beginner: [10, 10, 10],
      Intermediate: [15, 15, 15], 
      Master: [20, 20, 20]
    };
    return phaseDays[level]?.[phaseIndex] || 15;
  };

  const getTotalDaysByLevel = (level) => {
    switch (level) {
      case "Beginner": return 30;
      case "Intermediate": return 45;
      case "Master": return 60;
      default: return 30;
    }
  };

  return (
    <div className="challenges-container">
      <div className="challenges-header">
        <h2>🏋️‍♂️ {role} Challenge - {getTotalDaysByLevel(role)} Days</h2>
        <p>Complete your daily challenges and track your progress!</p>
      </div>

      {/* Assigned Workouts from Admin */}
      {assignedWorkouts.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '12px 0' }}>Your Assigned Workouts from COACH😎</h3>
          <div className="challenge-grid">
            {assignedWorkouts.map((w, idx) => {
              const completed = !!w.completed;
              const image = getImageForExercise(w.exercise || w.name);
              const sets = w.sets || 3;
              const reps = w.reps || 10;
              const exerciseKey = `${w.exercise || w.name}`;
              const disabledToday = (dailyCompletions[exerciseKey] || 0) >= 1;
              return (
                <div key={`${w.catalogId || w._id || idx}`} className={`challenge-card ${completed ? 'completed' : ''}`}>
                  <div className="challenge-image">
                    <img src={image} alt={w.exercise} loading="lazy" />
                    {completed && <div className="completed-badge">Completed</div>}
                  </div>
                  <div className="challenge-content">
                    <h3>{toTitle(w.exercise || w.name)}</h3>
                    <p className="challenge-sets">{sets} × {reps}</p>
                    <div className="workout-actions">
                      <button
                        className={`complete-btn ${completed ? 'completed' : ''}`}
                        onClick={() => !disabledToday && handleComplete(exerciseKey, sets, reps)}
                        disabled={completed || disabledToday}
                      >
                        {completed ? 'Completed' : disabledToday ? 'Completed Today!' : 'Mark as Complete'}
                      </button>
                      <button
                        className="video-btn"
                        onClick={() => openWorkoutVideo(w.exercise || w.name)}
                        title="Watch workout explanation"
                      >
                        🎥 How to do
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="challenge-grid">
        {challenges[role].map((challenge, index) => {
          const unlocked = isUnlocked(challenge.exercise, index);
          const completed = isCompleted(challenge.exercise);
          
          return (
            <div key={index} className={`challenge-card ${completed ? "completed" : ""} ${!unlocked ? "locked" : ""}`}>
              <div className="challenge-image">
                <img src={challenge.img} alt={challenge.name} loading="lazy" />
                {completed && <div className="completed-badge">Completed</div>}
                {!unlocked && <div className="locked-badge">🔒 Locked</div>}
              </div>

              <div className="challenge-content">
                <h3>{challenge.name}</h3>
                <p className="challenge-day-range">Days {challenge.dayRange}</p>
                <p className="challenge-sets">{challenge.sets} × {challenge.reps}</p>

                <div className="workout-actions">
                  <button
                    className={`complete-btn ${
                      buttonStates[challenge.exercise] === 'completed' ? "completed" : 
                      !unlocked ? "locked" : ""
                    }`}
                    onClick={() => unlocked && handleComplete(challenge.exercise, challenge.sets, challenge.reps)}
                    disabled={!unlocked || dailyCompletions[challenge.exercise] >= 1}
                  >
                    {!unlocked ? "Complete Previous First" : 
                     dailyCompletions[challenge.exercise] >= 1 ? "Completed Today!" :
                     buttonStates[challenge.exercise] === 'completed' ? "Completed!" : 
                     "Mark as Complete"}
                  </button>
                  <button
                    className="video-btn"
                    onClick={() => openWorkoutVideo(challenge.exercise)}
                    title="Watch workout explanation"
                  >
                    🎥 How to do
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="progress-section">
        <h3>Today's Progress</h3>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(Object.keys(dailyCompletions).length / challenges[role].length) * 100}%` }}
          ></div>
        </div>
        <p>{Object.keys(dailyCompletions).length} of {challenges[role].length} exercises completed today</p>
        <p style={{ fontSize: '0.9rem', color: '#ccc', marginTop: '5px' }}>
          Each completion = 1 day progress in your calendar
        </p>
        {Object.keys(dailyCompletions).length > 0 && (
          <p style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '5px' }}>
            Daily completions: {Object.entries(dailyCompletions).map(([exercise, count]) => 
              `${exercise}: ${count}`
            ).join(', ')}
          </p>
        )}
      </div>

      <WorkoutVideoModal 
        isOpen={videoModalOpen}
        onClose={closeVideoModal}
        workoutName={selectedWorkoutName}
      />
    </div>
  );
}

export default Challenges;
