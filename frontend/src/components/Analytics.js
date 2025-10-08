import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Analytics.css';

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = sessionStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      loadAnalytics(parsed._id);
    }
  }, []);

  const loadAnalytics = async (userId) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(
        `/api/users/${userId}/analytics`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading your analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="analytics-container">
        <div className="error">
          <p>Unable to load analytics data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>📊 Your Progress Analytics</h1>
        <p>Detailed insights into your fitness journey</p>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">🏋️</div>
          <div className="metric-content">
            <h3>{analytics.totalWorkouts}</h3>
            <p>Total Workouts</p>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">🔥</div>
          <div className="metric-content">
            <h3>{analytics.currentStreak}</h3>
            <p>Current Streak</p>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">🏆</div>
          <div className="metric-content">
            <h3>{analytics.longestStreak}</h3>
            <p>Best Streak</p>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">⚡</div>
          <div className="metric-content">
            <h3>{analytics.totalCaloriesBurned}</h3>
            <p>Calories Burned</p>
          </div>
        </div>
      </div>

      {/* Weekly Progress */}
      <div className="progress-section">
        <h2>📈 Weekly Progress</h2>
        <div className="progress-chart">
          {analytics.weeklyProgress.map((week, index) => (
            <div key={index} className="week-bar">
              <div className="week-info">
                <span className="week-label">{week.week}</span>
                <span className="week-workouts">{week.workoutsCompleted} workouts</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${Math.min((week.workoutsCompleted / analytics.goals.weeklyWorkouts) * 100, 100)}%` 
                  }}
                ></div>
              </div>
              <div className="week-calories">{week.caloriesBurned} cal</div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Progress */}
      <div className="progress-section">
        <h2>📅 Monthly Progress</h2>
        <div className="monthly-grid">
          {analytics.monthlyProgress.map((month, index) => (
            <div key={index} className="month-card">
              <h4>{month.month}</h4>
              <div className="month-stats">
                <div className="stat">
                  <span className="stat-value">{month.workoutsCompleted}</span>
                  <span className="stat-label">Workouts</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{month.caloriesBurned}</span>
                  <span className="stat-label">Calories</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{Math.round(month.averageStreak)}</span>
                  <span className="stat-label">Avg/Week</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="achievements-section">
        <h2>🏅 Achievements</h2>
        <div className="achievements-grid">
          {analytics.achievements.map((achievement, index) => (
            <div key={index} className="achievement-card">
              <div className="achievement-icon">{achievement.icon}</div>
              <div className="achievement-content">
                <h4>{achievement.name}</h4>
                <p>{achievement.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="recent-workouts">
        <h2>🕒 Recent Workouts</h2>
        <div className="workouts-list">
          {analytics.recentWorkouts.map((workout, index) => (
            <div key={index} className="workout-item">
              <div className="workout-info">
                <h4>{workout.exercise}</h4>
                <p>{workout.sets} × {workout.reps} • {workout.calories} cal</p>
              </div>
              <div className="workout-date">
                {new Date(workout.date).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Goals Progress */}
      <div className="goals-progress">
        <h2>🎯 Goals Progress</h2>
        <div className="goals-grid">
          <div className="goal-item">
            <div className="goal-header">
              <span>Daily Goal</span>
              <span>{analytics.goals.dailyWorkouts} workouts/day</span>
            </div>
            <div className="goal-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${Math.min((analytics.totalWorkouts / (analytics.goals.dailyWorkouts * 30)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="goal-item">
            <div className="goal-header">
              <span>Weekly Goal</span>
              <span>{analytics.goals.weeklyWorkouts} workouts/week</span>
            </div>
            <div className="goal-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${Math.min((analytics.weeklyProgress[0]?.workoutsCompleted / analytics.goals.weeklyWorkouts) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="goal-item">
            <div className="goal-header">
              <span>Monthly Goal</span>
              <span>{analytics.goals.monthlyWorkouts} workouts/month</span>
            </div>
            <div className="goal-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${Math.min((analytics.monthlyProgress[0]?.workoutsCompleted / analytics.goals.monthlyWorkouts) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
