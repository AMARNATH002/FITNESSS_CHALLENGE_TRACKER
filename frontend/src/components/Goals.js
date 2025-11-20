import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Goals.css';

const defaultGoals = {
  dailyWorkouts: 1,
  weeklyWorkouts: 5,
  monthlyWorkouts: 20,
  currentStreak: 0,
  longestStreak: 0,
  smartGoals: [],
  milestones: [],
  targetWeight: null,
  targetBodyFat: null,
  targetMuscleMass: null
};

function Goals() {
  const [goals, setGoals] = useState(defaultGoals);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [showSmartGoalForm, setShowSmartGoalForm] = useState(false);
  const [newSmartGoal, setNewSmartGoal] = useState({
    title: '',
    description: '',
    targetValue: '',
    currentValue: '0',
    unit: '',
    deadline: '',
    category: 'fitness',
    priority: 'medium'
  });

  const loadGoals = useCallback(async (userId) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(
        `/api/users/${userId}/goals`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = response.data || {};
      setGoals({
        ...defaultGoals,
        ...data,
        smartGoals: Array.isArray(data.smartGoals) ? data.smartGoals : [],
        milestones: Array.isArray(data.milestones) ? data.milestones : []
      });
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const userData = sessionStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      loadGoals(parsed._id);
    }
  }, [loadGoals]);

  const updateGoals = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `/api/users/${user._id}/goals`,
        {
          dailyWorkouts: goals.dailyWorkouts,
          weeklyWorkouts: goals.weeklyWorkouts,
          monthlyWorkouts: goals.monthlyWorkouts,
          smartGoals: goals.smartGoals,
          milestones: goals.milestones,
          targetWeight: goals.targetWeight,
          targetBodyFat: goals.targetBodyFat,
          targetMuscleMass: goals.targetMuscleMass
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Goals updated successfully! 🎯');
    } catch (error) {
      console.error('Error updating goals:', error);
      alert('Failed to update goals. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addSmartGoal = () => {
    if (!newSmartGoal.title || !newSmartGoal.targetValue || !newSmartGoal.deadline) {
      alert('Please fill in all required fields');
      return;
    }

    const smartGoal = {
      ...newSmartGoal,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      progress: 0,
      status: 'active'
    };

    setGoals(prev => ({
      ...prev,
      smartGoals: [...(prev.smartGoals || []), smartGoal]
    }));

    setNewSmartGoal({
      title: '',
      description: '',
      targetValue: '',
      currentValue: '0',
      unit: '',
      deadline: '',
      category: 'fitness',
      priority: 'medium'
    });
    setShowSmartGoalForm(false);
  };

  const updateSmartGoalProgress = (goalId, newProgress) => {
    setGoals(prev => ({
      ...prev,
      smartGoals: (prev.smartGoals || []).map(goal => 
        goal.id === goalId 
          ? { ...goal, currentValue: newProgress, progress: Math.min((newProgress / goal.targetValue) * 100, 100) }
          : goal
      )
    }));
  };

  const deleteSmartGoal = (goalId) => {
    setGoals(prev => ({
      ...prev,
      smartGoals: (prev.smartGoals || []).filter(goal => goal.id !== goalId)
    }));
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#4CAF50',
      medium: '#FF9800',
      high: '#F44336'
    };
    return colors[priority] || '#666';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      fitness: '💪',
      weight: '⚖️',
      strength: '🏋️',
      endurance: '🏃',
      flexibility: '🤸',
      nutrition: '🥗'
    };
    return icons[category] || '🎯';
  };

  const handleInputChange = (field, value) => {
    const numValue = parseInt(value) || 0;
    setGoals(prev => ({
      ...prev,
      [field]: Math.max(0, numValue)
    }));
  };

  if (loading) {
    return (
      <div className="goals-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading your goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="goals-container">
      <div className="goals-header">
        <h1>🎯 My Fitness Goals</h1>
        <p>Set your workout targets and track your progress</p>
      </div>

      <div className="goals-content">
        <div className="goals-stats">
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-info">
              <h3>{goals.currentStreak}</h3>
              <p>Current Streak</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-info">
              <h3>{goals.longestStreak}</h3>
              <p>Best Streak</p>
            </div>
          </div>
        </div>

        <div className="goals-form">
          <h2>Set Your Targets</h2>
          
          <div className="goal-input-group">
            <label htmlFor="dailyWorkouts">Daily Workouts</label>
            <div className="input-with-unit">
              <input
                type="number"
                id="dailyWorkouts"
                value={goals.dailyWorkouts}
                onChange={(e) => handleInputChange('dailyWorkouts', e.target.value)}
                min="0"
                max="10"
              />
              <span className="unit">per day</span>
            </div>
            <p className="input-help">How many workouts do you want to complete each day?</p>
          </div>

          <div className="goal-input-group">
            <label htmlFor="weeklyWorkouts">Weekly Workouts</label>
            <div className="input-with-unit">
              <input
                type="number"
                id="weeklyWorkouts"
                value={goals.weeklyWorkouts}
                onChange={(e) => handleInputChange('weeklyWorkouts', e.target.value)}
                min="0"
                max="50"
              />
              <span className="unit">per week</span>
            </div>
            <p className="input-help">Total workouts you want to complete each week</p>
          </div>

          <div className="goal-input-group">
            <label htmlFor="monthlyWorkouts">Monthly Workouts</label>
            <div className="input-with-unit">
              <input
                type="number"
                id="monthlyWorkouts"
                value={goals.monthlyWorkouts}
                onChange={(e) => handleInputChange('monthlyWorkouts', e.target.value)}
                min="0"
                max="200"
              />
              <span className="unit">per month</span>
            </div>
            <p className="input-help">Total workouts you want to complete each month</p>
          </div>

          <button 
            className="save-goals-btn"
            onClick={updateGoals}
            disabled={saving}
          >
            {saving ? 'Saving...' : '💾 Save Goals'}
          </button>
        </div>

        {/* SMART Goals Section */}
        <div className="smart-goals-section">
          <div className="section-header">
            <h2>🎯 SMART Goals</h2>
            <button 
              className="add-goal-btn"
              onClick={() => setShowSmartGoalForm(true)}
            >
              + Add SMART Goal
            </button>
          </div>

          {!goals.smartGoals || goals.smartGoals.length === 0 ? (
            <div className="empty-state">
              <p>No SMART goals set yet. Create your first goal!</p>
            </div>
          ) : (
            <div className="smart-goals-grid">
              {(goals.smartGoals || []).map(goal => (
                <div key={goal.id} className="smart-goal-card">
                  <div className="goal-header">
                    <div className="goal-title">
                      <span className="category-icon">{getCategoryIcon(goal.category)}</span>
                      <h3>{goal.title}</h3>
                    </div>
                    <div 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(goal.priority) }}
                    >
                      {goal.priority}
                    </div>
                  </div>
                  
                  <p className="goal-description">{goal.description}</p>
                  
                  <div className="goal-progress">
                    <div className="progress-info">
                      <span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                      <span>{Math.round(goal.progress)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${Math.min(goal.progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="goal-actions">
                    <input
                      type="number"
                      placeholder="Update progress"
                      value={goal.currentValue}
                      onChange={(e) => updateSmartGoalProgress(goal.id, e.target.value)}
                      className="progress-input"
                    />
                    <button 
                      className="delete-goal-btn"
                      onClick={() => deleteSmartGoal(goal.id)}
                    >
                      Delete
                    </button>
                  </div>
                  
                  <div className="goal-meta">
                    <span>Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
                    <span>Category: {goal.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body Composition Goals */}
        <div className="body-composition-section">
          <h2>📊 Body Composition Goals</h2>
          <div className="composition-goals">
            <div className="composition-goal">
              <label>Target Weight (kg)</label>
              <input
                type="number"
                value={goals.targetWeight || ''}
                onChange={(e) => setGoals(prev => ({ ...prev, targetWeight: e.target.value }))}
                placeholder="Enter target weight"
              />
            </div>
            
            <div className="composition-goal">
              <label>Target Body Fat %</label>
              <input
                type="number"
                value={goals.targetBodyFat || ''}
                onChange={(e) => setGoals(prev => ({ ...prev, targetBodyFat: e.target.value }))}
                placeholder="Enter target body fat %"
                step="0.1"
              />
            </div>
            
            <div className="composition-goal">
              <label>Target Muscle Mass (kg)</label>
              <input
                type="number"
                value={goals.targetMuscleMass || ''}
                onChange={(e) => setGoals(prev => ({ ...prev, targetMuscleMass: e.target.value }))}
                placeholder="Enter target muscle mass"
                step="0.1"
              />
            </div>
          </div>
        </div>

        <div className="goals-tips">
          <h3>💡 Tips for Success</h3>
          <ul>
            <li>Start with achievable goals and gradually increase them</li>
            <li>Consistency is more important than intensity</li>
            <li>Track your progress daily to stay motivated</li>
            <li>Celebrate small wins along the way</li>
            <li>Use SMART goals: Specific, Measurable, Achievable, Relevant, Time-bound</li>
          </ul>
        </div>
      </div>

      {/* SMART Goal Form Modal */}
      {showSmartGoalForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create SMART Goal</h2>
              <button 
                className="close-btn"
                onClick={() => setShowSmartGoalForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); addSmartGoal(); }}>
              <div className="form-group">
                <label>Goal Title *</label>
                <input
                  type="text"
                  value={newSmartGoal.title}
                  onChange={(e) => setNewSmartGoal(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Run 5K in 25 minutes"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newSmartGoal.description}
                  onChange={(e) => setNewSmartGoal(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your goal in detail..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Target Value *</label>
                  <input
                    type="number"
                    value={newSmartGoal.targetValue}
                    onChange={(e) => setNewSmartGoal(prev => ({ ...prev, targetValue: e.target.value }))}
                    placeholder="25"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Unit</label>
                  <input
                    type="text"
                    value={newSmartGoal.unit}
                    onChange={(e) => setNewSmartGoal(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder="minutes"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={newSmartGoal.category}
                    onChange={(e) => setNewSmartGoal(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="fitness">Fitness</option>
                    <option value="weight">Weight</option>
                    <option value="strength">Strength</option>
                    <option value="endurance">Endurance</option>
                    <option value="flexibility">Flexibility</option>
                    <option value="nutrition">Nutrition</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={newSmartGoal.priority}
                    onChange={(e) => setNewSmartGoal(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Deadline *</label>
                <input
                  type="date"
                  value={newSmartGoal.deadline}
                  onChange={(e) => setNewSmartGoal(prev => ({ ...prev, deadline: e.target.value }))}
                  required
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowSmartGoalForm(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="save-btn"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Goals;
