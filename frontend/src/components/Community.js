import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Community.css';

function Community() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRanking, setUserRanking] = useState(null);
  const [communityFeed, setCommunityFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  useEffect(() => {
    const userData = sessionStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      loadCommunityData(parsed._id);
    }
  }, [selectedPeriod]);

  const loadCommunityData = async (userId) => {
    try {
      const token = sessionStorage.getItem('token');
      
      const [leaderboardRes, rankingRes, feedRes] = await Promise.all([
        axios.get(`/api/users/leaderboard?period=${selectedPeriod}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`/api/users/${userId}/ranking?period=${selectedPeriod}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`/api/users/community/feed`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setLeaderboard(leaderboardRes.data);
      setUserRanking(rankingRes.data);
      setCommunityFeed(feedRes.data);
    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank <= 10) return '🏆';
    return '⭐';
  };

  const getFitnessLevelColor = (level) => {
    const colors = {
      'Beginner': '#4CAF50',
      'Intermediate': '#FF9800',
      'Master': '#9C27B0'
    };
    return colors[level] || '#666';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="community-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading community data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="community-container">
      <div className="community-header">
        <h1>🏆 Fitness Community</h1>
        <p>Connect with fellow fitness enthusiasts and see how you rank!</p>
      </div>

      {/* User Ranking Card */}
      {userRanking && (
        <div className="user-ranking-card">
          <div className="ranking-header">
            <h2>Your Ranking</h2>
            <div className="ranking-stats">
              <div className="rank-number">
                <span className="rank">#{userRanking.currentRank}</span>
                <span className="total">of {userRanking.totalUsers}</span>
              </div>
              <div className="percentile">
                Top {userRanking.percentile}%
              </div>
            </div>
          </div>
          
          <div className="user-stats-grid">
            <div className="stat-item">
              <div className="stat-value">{userRanking.stats.totalWorkouts}</div>
              <div className="stat-label">Total Workouts</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{userRanking.stats.currentStreak}</div>
              <div className="stat-label">Current Streak</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{userRanking.stats.longestStreak}</div>
              <div className="stat-label">Best Streak</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{userRanking.stats.totalCalories}</div>
              <div className="stat-label">Calories Burned</div>
            </div>
          </div>
        </div>
      )}

      {/* Period Selector */}
      <div className="period-selector">
        <h2>Leaderboard</h2>
        <div className="period-buttons">
          <button 
            className={`period-btn ${selectedPeriod === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('all')}
          >
            All Time
          </button>
          <button 
            className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('month')}
          >
            This Month
          </button>
          <button 
            className={`period-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('week')}
          >
            This Week
          </button>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="leaderboard-section">
        <div className="leaderboard-list">
          {leaderboard.map((user, index) => (
            <div key={user._id} className={`leaderboard-item ${user._id === user?._id ? 'current-user' : ''}`}>
              <div className="rank-info">
                <span className="rank-number">{index + 1}</span>
                <span className="rank-icon">{getRankIcon(index + 1)}</span>
              </div>
              
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div 
                  className="fitness-level"
                  style={{ color: getFitnessLevelColor(user.fitnessLevel) }}
                >
                  {user.fitnessLevel}
                </div>
              </div>
              
              <div className="user-stats">
                <div className="stat">
                  <span className="stat-value">
                    {selectedPeriod === 'all' ? user.goals?.totalWorkouts || 0 : user.recentWorkouts || 0}
                  </span>
                  <span className="stat-label">Workouts</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{user.goals?.currentStreak || 0}</span>
                  <span className="stat-label">Streak</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{user.totalCalories || 0}</span>
                  <span className="stat-label">Calories</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Community Feed */}
      <div className="community-feed-section">
        <h2>🔥 Recent Activity</h2>
        <div className="feed-list">
          {communityFeed.map((activity, index) => (
            <div key={index} className="feed-item">
              <div className="activity-icon">💪</div>
              <div className="activity-content">
                <div className="activity-text">
                  <strong>{activity.name}</strong> completed <strong>{activity.exercise}</strong>
                  <span className="activity-details">
                    ({activity.sets} × {activity.reps})
                  </span>
                </div>
                <div className="activity-meta">
                  <span className="activity-date">{formatDate(activity.date)}</span>
                  <span 
                    className="fitness-level-badge"
                    style={{ backgroundColor: getFitnessLevelColor(activity.fitnessLevel) }}
                  >
                    {activity.fitnessLevel}
                  </span>
                  {activity.calories > 0 && (
                    <span className="calories-badge">🔥 {activity.calories} cal</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Community Tips */}
      <div className="community-tips">
        <h2>💡 Community Tips</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-icon">🏆</div>
            <div className="tip-content">
              <h3>Stay Consistent</h3>
              <p>Consistency beats intensity. Even 15 minutes daily is better than 2 hours once a week.</p>
            </div>
          </div>
          
          <div className="tip-card">
            <div className="tip-icon">👥</div>
            <div className="tip-content">
              <h3>Find a Buddy</h3>
              <p>Workout with friends or join our community challenges to stay motivated together.</p>
            </div>
          </div>
          
          <div className="tip-card">
            <div className="tip-icon">📈</div>
            <div className="tip-content">
              <h3>Track Progress</h3>
              <p>Use our analytics to see your improvement over time and celebrate small wins.</p>
            </div>
          </div>
          
          <div className="tip-card">
            <div className="tip-icon">🎯</div>
            <div className="tip-content">
              <h3>Set Realistic Goals</h3>
              <p>Start small and gradually increase your targets. Sustainable progress is key.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Community;
