import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./Profile.css";

function Profile() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [challengeProgress, setChallengeProgress] = useState({
    currentDay: 1,
    totalDays: 30,
    completedWorkouts: 0,
    streak: 0,
  });

  const calculateCompletedDays = (completedWorkouts, role) => {
    // Simple calculation based on number of completed workouts
    return completedWorkouts.length;
  };

  const loadUserProgress = useCallback(async (userId, role) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(
        `/api/users/${userId}/workouts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const workouts = response.data || [];
      const completedWorkouts = workouts.filter((w) => w.completed === true);

      // Calculate actual days completed based on workout phases
      const totalDays = getTotalDaysByLevel(role);
      const completedDays = calculateCompletedDays(completedWorkouts, role);
      const currentDay = Math.min(completedDays + 1, totalDays);

      setChallengeProgress({
        currentDay: currentDay,
        totalDays: totalDays,
        completedWorkouts: completedWorkouts.length,
        streak: calculateStreak(workouts),
      });
    } catch (error) {
      console.error("Error loading user progress:", error);
    }
  }, []);

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      const userObj = JSON.parse(userData);
      setUser(userObj);
      if (userObj.accountRole === 'Admin') {
        window.location.href = '/admin';
        return;
      }

      setChallengeProgress((prev) => ({
        ...prev,
        totalDays: getTotalDaysByLevel(userObj.fitnessLevel || userObj.role),
      }));

      loadUserProgress(userObj._id, userObj.fitnessLevel || userObj.role);
    }
  }, [loadUserProgress]);

  const calculateStreak = (workouts) => {
    if (!workouts || workouts.length === 0) return 0;

    const completedWorkouts = workouts.filter((w) => w.completed);
    if (completedWorkouts.length === 0) return 0;

    // Sort by date (newest first)
    const sortedWorkouts = completedWorkouts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let streak = 0;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if there's a workout today or yesterday to start the streak
    const hasRecentWorkout = sortedWorkouts.some(w => {
      const workoutDate = new Date(w.date);
      return workoutDate.toDateString() === today.toDateString() || 
             workoutDate.toDateString() === yesterday.toDateString();
    });
    
    if (!hasRecentWorkout) return 0;
    
    // Count consecutive days
    let currentDate = new Date(today);
    for (let i = 0; i < sortedWorkouts.length; i++) {
      const workoutDate = new Date(sortedWorkouts[i].date);
      if (workoutDate.toDateString() === currentDate.toDateString() || 
          workoutDate.toDateString() === new Date(currentDate.getTime() - 24 * 60 * 60 * 1000).toDateString()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getTotalDaysByLevel = (level) => {
    switch (level) {
      case "Beginner": return 30;
      case "Intermediate": return 45;
      case "Master": return 60;
      default: return 30;
    }
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <h2>Please login to view your profile</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h2>👤 My Profile</h2>
          <div className="user-avatar">💪</div>
        </div>

        {/* Personal Information */}
        <div className="user-info">
          <h3>Personal Information</h3>
          <div className="info-grid">
            <div className="info-item"><label>Name:</label><span>{user.name}</span></div>
            <div className="info-item"><label>Email:</label><span>{user.email}</span></div>
            <div className="info-item"><label>Fitness Level:</label><span className="level-badge">{user.fitnessLevel || user.role || "Beginner"}</span></div>
            <div className="info-item"><label>Member Since:</label><span>{new Date(user.createdAt).toLocaleDateString()}</span></div>
          </div>
        </div>

        {/* Challenge Progress */}
        <div className="challenge-progress">
          <h3>🏆 Challenge Progress</h3>
          <div className="progress-stats">
            <div className="stat-card"><div className="stat-number">{challengeProgress.currentDay}</div><div className="stat-label">Current Day</div></div>
            <div className="stat-card"><div className="stat-number">{challengeProgress.totalDays}</div><div className="stat-label">Total Days</div></div>
            <div className="stat-card"><div className="stat-number">{challengeProgress.completedWorkouts}</div><div className="stat-label">Completed</div></div>
            <div className="stat-card"><div className="stat-number">{challengeProgress.streak}</div><div className="stat-label">Day Streak</div></div>
          </div>

          {/* Progress Bar */}
          <div className="progress-bar-container">
            <div className="progress-label">Progress: {challengeProgress.completedWorkouts} / {challengeProgress.totalDays} days</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${getProgressPercentage()}%` }}></div>
            </div>
            <div className="progress-percentage">{Math.round(getProgressPercentage())}% Complete</div>
          </div>

          {/* Calendar */}
          <div className="calendar-progress">
            <h4>Day-by-Day Progress</h4>
            <div className="calendar-grid">
              {[...Array(challengeProgress.totalDays)].map((_, i) => {
                let dayClass = "calendar-day";
                if (i < challengeProgress.completedWorkouts) dayClass += " completed";
                else if (i === challengeProgress.completedWorkouts) dayClass += " current";
                return <div key={i} className={dayClass}>{i + 1}</div>;
              })}
            </div>
            <p style={{ marginTop: '10px', fontSize: '0.9rem', color: '#666' }}>
              Each workout completion = 1 day progress
            </p>
          </div>

          {/* Challenge Info */}
          <div className="challenge-info">
            <h4>Challenge Details</h4>
            <p><strong>Level:</strong> {user.fitnessLevel || user.role || "Beginner"}<br />
               <strong>Duration:</strong> {getTotalDaysByLevel(user.fitnessLevel || user.role)} days<br />
               <strong>Goal:</strong> Complete daily workouts to build fitness habits</p>
          </div>
        </div>

        {/* Achievements */}
        <div className="achievements">
          <h3>🏅 Achievements</h3>
          <div className="achievement-grid">
            {challengeProgress.completedWorkouts >= 1 && <div className="achievement-badge">🥇 First Workout</div>}
            {challengeProgress.completedWorkouts >= 7 && <div className="achievement-badge">🔥 Week Warrior</div>}
            {challengeProgress.completedWorkouts >= 15 && <div className="achievement-badge">💪 Halfway Hero</div>}
            {challengeProgress.completedWorkouts >= 30 && <div className="achievement-badge">🏆 Challenge Champion</div>}
            {challengeProgress.streak >= 5 && <div className="achievement-badge">⚡ Streak Master</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
