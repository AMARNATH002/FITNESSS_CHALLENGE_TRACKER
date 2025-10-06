import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminDashboard.css';
import WorkoutVideoModal from './WorkoutVideoModal';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [dietPlans, setDietPlans] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedWorkoutIds, setSelectedWorkoutIds] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedWorkoutName, setSelectedWorkoutName] = useState('');
  const token = sessionStorage.getItem('token');

  const api = axios.create({
    baseURL: 'http://localhost:5000',
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [u, w, d] = await Promise.all([
        api.get('/api/admin/users?includeAdmins=false'),
        api.get('/api/admin/workouts'),
        api.get('/api/admin/diet-plans')
      ]);
      setUsers(u.data);
      setWorkouts(w.data);
      setDietPlans(d.data);
      if (u.data.length) setSelectedUserId(u.data[0]._id);
    } catch (e) {
      console.error(e);
      alert('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const seedWorkouts = async () => {
    try {
      const res = await api.post('/api/admin/seed/workouts');
      alert(`Seeded ${res.data.count} workouts`);
      const w = await api.get('/api/admin/workouts');
      setWorkouts(w.data);
    } catch (e) { 
      alert('Seeding failed'); 
    }
  };

  const toggleSelectWorkout = (id) => {
    setSelectedWorkoutIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleUserChange = (userId) => {
    setSelectedUserId(userId);
    setSelectedWorkoutIds([]);
  };

  const assignSelected = async () => {
    if (!selectedUserId || selectedWorkoutIds.length === 0) {
      alert('Pick a user and at least one workout');
      return;
    }
    
    const selectedUser = users.find(u => u._id === selectedUserId);
    if (!selectedUser) {
      alert('User not found');
      return;
    }
    
    const selectedWorkouts = workouts.filter(w => selectedWorkoutIds.includes(w._id));
    const userLevelWorkouts = selectedWorkouts.filter(w => w.difficulty === selectedUser.fitnessLevel);
    const mismatchedWorkouts = selectedWorkouts.filter(w => w.difficulty !== selectedUser.fitnessLevel);
    
    if (mismatchedWorkouts.length > 0) {
      const confirmMessage = `Warning: ${mismatchedWorkouts.length} workout(s) don't match ${selectedUser.name}'s fitness level (${selectedUser.fitnessLevel}):\n${mismatchedWorkouts.map(w => `- ${w.name} (${w.difficulty})`).join('\n')}\n\nDo you want to assign only the matching workouts?`;
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }
    
    const finalWorkoutIds = userLevelWorkouts.map(w => w._id);
    if (finalWorkoutIds.length === 0) {
      alert(`No workouts match ${selectedUser.name}'s fitness level (${selectedUser.fitnessLevel})`);
      return;
    }
    
    try {
      await api.post(`/api/admin/users/${selectedUserId}/assign-workouts`, { workoutIds: finalWorkoutIds, sets: 3, reps: 12 });
      alert(`Successfully assigned ${finalWorkoutIds.length} workout(s) to ${selectedUser.name}`);
      setSelectedWorkoutIds([]);
    } catch (e) {
      alert('Assign failed: ' + (e.response?.data?.error || e.message));
    }
  };

  const removeUserWorkout = async (userId, workoutId) => {
    if (!window.confirm('Are you sure you want to remove this workout from the user?')) {
      return;
    }
    
    try {
      await api.delete(`/api/users/${userId}/workouts/${workoutId}`);
      alert('Workout removed successfully');
      loadData(); // Reload data
    } catch (e) {
      alert('Failed to remove workout: ' + (e.response?.data?.error || e.message));
    }
  };

  const seedDietPlans = async () => {
    try {
      const res = await api.post('/api/admin/seed/diet-plans');
      alert(`Seeded ${res.data.count} diet plans`);
      const d = await api.get('/api/admin/diet-plans');
      setDietPlans(d.data);
    } catch (e) { 
      alert('Seeding diet plans failed: ' + (e.response?.data?.error || e.message)); 
    }
  };

  const addDietPlan = async () => {
    const name = prompt('Enter diet plan name:');
    const goal = prompt('Enter diet goal (Weight Loss, Muscle Gain, Maintenance, Performance):');
    const difficulty = prompt('Enter difficulty (Beginner, Intermediate, Master):');
    const description = prompt('Enter description (optional):');
    
    if (!name || !goal || !difficulty) {
      alert('All fields are required');
      return;
    }
    
    try {
      await api.post('/api/admin/diet-plans', { name, goal, difficulty, description });
      alert('Diet plan added successfully');
      const d = await api.get('/api/admin/diet-plans');
      setDietPlans(d.data);
    } catch (e) {
      alert('Failed to add diet plan: ' + (e.response?.data?.error || e.message));
    }
  };

  const removeDietPlan = async (dietPlanId) => {
    if (!window.confirm('Are you sure you want to remove this diet plan?')) {
      return;
    }
    
    try {
      await api.delete(`/api/admin/diet-plans/${dietPlanId}`);
      alert('Diet plan removed successfully');
      const d = await api.get('/api/admin/diet-plans');
      setDietPlans(d.data);
    } catch (e) {
      alert('Failed to remove diet plan: ' + (e.response?.data?.error || e.message));
    }
  };

  const openWorkoutVideos = (workoutName) => {
    setSelectedWorkoutName(workoutName);
    setVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    setVideoModalOpen(false);
    setSelectedWorkoutName('');
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>👤 Admin Dashboard</h1>
        <p>Manage users, workouts, and diet plans</p>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`} 
          onClick={() => setActiveTab('users')}
        >
          <span className="tab-icon">👥</span>
          Users ({users.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'workouts' ? 'active' : ''}`} 
          onClick={() => setActiveTab('workouts')}
        >
          <span className="tab-icon">🏋️</span>
          Workouts ({workouts.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'diet' ? 'active' : ''}`} 
          onClick={() => setActiveTab('diet')}
        >
          <span className="tab-icon">🥗</span>
          Diet Plans ({dietPlans.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'youtube' ? 'active' : ''}`} 
          onClick={() => setActiveTab('youtube')}
        >
          <span className="tab-icon">📺</span>
          YouTube Fitness
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>👥 User Management</h2>
            <div className="stats">
              <div className="stat-card">
                <h3>{users.length}</h3>
                <p>Total Users</p>
              </div>
              <div className="stat-card">
                <h3>{users.filter(u => u.fitnessLevel === 'Beginner').length}</h3>
                <p>Beginners</p>
              </div>
              <div className="stat-card">
                <h3>{users.filter(u => u.fitnessLevel === 'Intermediate').length}</h3>
                <p>Intermediate</p>
              </div>
              <div className="stat-card">
                <h3>{users.filter(u => u.fitnessLevel === 'Master').length}</h3>
                <p>Masters</p>
              </div>
            </div>
          </div>

          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Fitness Level</th>
                  <th>Workouts</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">👤</div>
                        <span>{user.name || '—'}</span>
                      </div>
                    </td>
                    <td>{user.email || '—'}</td>
                    <td>
                      <span className={`level-badge ${user.fitnessLevel?.toLowerCase()}`}>
                        {user.fitnessLevel}
                      </span>
                    </td>
                    <td>
                      <div className="workout-stats">
                        <span className="total">{user.workouts?.length || 0}</span>
                        <span className="completed">{user.workouts?.filter(w => w.completed).length || 0}</span>
                      </div>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="btn-secondary"
                        onClick={() => {
                          setActiveTab('workouts');
                          setSelectedUserId(user._id);
                        }}
                      >
                        Assign Workouts
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'workouts' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>🏋️ Workout Management</h2>
            <div className="workout-controls">
              <button className="btn-primary" onClick={seedWorkouts}>
                🌱 Seed 50+ Workouts
              </button>
              <div className="user-selector">
                <label>Assign to:</label>
                <select value={selectedUserId} onChange={e => handleUserChange(e.target.value)}>
                  <option value="">Select a user...</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.fitnessLevel})
                    </option>
                  ))}
                </select>
                {selectedUserId && (
                  <span className="level-indicator">
                    {users.find(u => u._id === selectedUserId)?.fitnessLevel} Level
                  </span>
                )}
                <button 
                  className="btn-success"
                  onClick={assignSelected} 
                  disabled={!selectedUserId || selectedWorkoutIds.length === 0}
                >
                  Assign Selected ({selectedWorkoutIds.length})
                </button>
              </div>
            </div>
          </div>

          {selectedUserId && (
            <div className="assignment-tip">
              💡 Only workouts matching {users.find(u => u._id === selectedUserId)?.name}'s fitness level can be selected.
            </div>
          )}

          <div className="workouts-grid">
            {workouts.map(workout => {
              const selectedUser = users.find(u => u._id === selectedUserId);
              const isMatchingLevel = selectedUser ? workout.difficulty === selectedUser.fitnessLevel : true;
              const isSelected = selectedWorkoutIds.includes(workout._id);
              
              return (
                <div 
                  key={workout._id} 
                  className={`workout-card ${isSelected ? 'selected' : ''} ${!isMatchingLevel ? 'disabled' : ''}`}
                >
                  <div className="workout-header">
                    <h3>{workout.name}</h3>
                    <div className="workout-meta">
                      <span className="category">{workout.category}</span>
                      <span className={`difficulty ${workout.difficulty?.toLowerCase()}`}>
                        {workout.difficulty}
                      </span>
                      {selectedUser && (
                        <span className={`match-indicator ${isMatchingLevel ? 'match' : 'no-match'}`}>
                          {isMatchingLevel ? '✅' : '❌'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="workout-actions">
                    <button 
                      onClick={() => toggleSelectWorkout(workout._id)}
                      disabled={!isMatchingLevel}
                      className={isSelected ? 'btn-danger' : 'btn-primary'}
                    >
                      {isSelected ? 'Unselect' : 'Select'}
                    </button>
                    <button 
                      onClick={() => openWorkoutVideos(workout.name)}
                      className="btn-secondary btn-video"
                      title="Watch workout videos"
                    >
                      🎥 Videos
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* User Workouts Management */}
          {selectedUserId && (
            <div className="user-workouts-section">
              <h3>📋 {users.find(u => u._id === selectedUserId)?.name}'s Workouts</h3>
              <div className="user-workouts-list">
                {users.find(u => u._id === selectedUserId)?.workouts?.map(workout => (
                  <div key={workout._id} className="user-workout-item">
                    <div className="workout-info">
                      <span className="exercise-name">{workout.exercise}</span>
                      <span className="workout-details">{workout.sets} × {workout.reps}</span>
                      <span className={`status ${workout.completed ? 'completed' : 'pending'}`}>
                        {workout.completed ? '✅ Completed' : '⏳ Pending'}
                      </span>
                    </div>
                    <button 
                      className="btn-danger btn-small"
                      onClick={() => removeUserWorkout(selectedUserId, workout._id)}
                    >
                      🗑️ Remove
                    </button>
                  </div>
                ))}
                {(!users.find(u => u._id === selectedUserId)?.workouts?.length) && (
                  <p className="no-workouts">No workouts assigned yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'diet' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>🥗 Diet Plan Management</h2>
            <div className="diet-controls">
              <button className="btn-primary" onClick={seedDietPlans}>
                🌱 Seed 9 Diet Plans
              </button>
              <button className="btn-secondary" onClick={addDietPlan}>
                ➕ Add Custom Plan
              </button>
            </div>
          </div>

          <div className="diet-stats">
            <div className="stat-card">
              <h3>{dietPlans.length}</h3>
              <p>Total Plans</p>
            </div>
            <div className="stat-card">
              <h3>{dietPlans.filter(p => p.difficulty === 'Beginner').length}</h3>
              <p>Beginner</p>
            </div>
            <div className="stat-card">
              <h3>{dietPlans.filter(p => p.difficulty === 'Intermediate').length}</h3>
              <p>Intermediate</p>
            </div>
            <div className="stat-card">
              <h3>{dietPlans.filter(p => p.difficulty === 'Master').length}</h3>
              <p>Master</p>
            </div>
          </div>

          <div className="diet-plans-grid">
            {dietPlans.map(plan => (
              <div key={plan._id} className="diet-plan-card">
                <div className="diet-plan-header">
                  <h3>{plan.name}</h3>
                  <button 
                    className="btn-danger btn-small"
                    onClick={() => removeDietPlan(plan._id)}
                  >
                    🗑️
                  </button>
                </div>
                <div className="diet-plan-details">
                  <span className={`goal-badge ${plan.goal?.toLowerCase().replace(' ', '-')}`}>
                    {plan.goal}
                  </span>
                  <span className={`difficulty-badge ${plan.difficulty?.toLowerCase()}`}>
                    {plan.difficulty}
                  </span>
                </div>
                <p className="diet-plan-description">
                  {plan.description || 'No description available'}
                </p>
                {plan.meals && plan.meals.length > 0 && (
                  <div className="diet-plan-meals">
                    <h4>Meals ({plan.meals.length})</h4>
                    <div className="meals-list">
                      {plan.meals.slice(0, 3).map((meal, index) => (
                        <div key={index} className="meal-item">
                          <span className="meal-title">{meal.title}</span>
                          <span className="meal-calories">{meal.calories} cal</span>
                        </div>
                      ))}
                      {plan.meals.length > 3 && (
                        <div className="meal-item more">
                          +{plan.meals.length - 3} more meals
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {dietPlans.length === 0 && (
              <div className="empty-state">
                <h3>No diet plans yet</h3>
                <p>Click "Seed 9 Diet Plans" to add pre-made plans or "Add Custom Plan" to create your own</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'youtube' && (
        <div className="admin-section">
          <div className="youtube-section">
            <h2>📺 Free YouTube Fitness Channels</h2>
            <p>High-quality, free workout tutorials from popular fitness channels.</p>
            
            <div className="youtube-channels-grid">
              <div className="youtube-channel-card">
                <div className="channel-video">
                  <div className="video-placeholder">
                    <div className="play-button">▶️</div>
                    <p>This video is unavailable</p>
                  </div>
                </div>
                <div className="channel-info">
                  <h3>HASfit</h3>
                  <span className="channel-level">Beginner Friendly</span>
                  <p>Free workout videos for all fitness levels with detailed instructions.</p>
                  <button className="visit-channel-btn">Visit Channel</button>
                </div>
              </div>

              <div className="youtube-channel-card">
                <div className="channel-video">
                  <div className="video-placeholder">
                    <div className="play-button">▶️</div>
                    <p>This video is unavailable</p>
                  </div>
                </div>
                <div className="channel-info">
                  <h3>Athlean-X</h3>
                  <span className="channel-level">Advanced</span>
                  <p>Professional fitness advice and advanced workout techniques.</p>
                  <button className="visit-channel-btn">Visit Channel</button>
                </div>
              </div>

              <div className="youtube-channel-card">
                <div className="channel-video">
                  <div className="video-placeholder">
                    <div className="play-button">▶️</div>
                    <p>This video is unavailable</p>
                  </div>
                </div>
                <div className="channel-info">
                  <h3>Pamela Reif</h3>
                  <span className="channel-level">All Levels</span>
                  <p>Popular fitness influencer with workout challenges and routines.</p>
                  <button className="visit-channel-btn">Visit Channel</button>
                </div>
              </div>

              <div className="youtube-channel-card">
                <div className="channel-video">
                  <div className="video-placeholder">
                    <div className="play-button">▶️</div>
                    <p>This video is unavailable</p>
                  </div>
                </div>
                <div className="channel-info">
                  <h3>FitnessBlender</h3>
                  <span className="channel-level">Beginner to Advanced</span>
                  <p>Comprehensive workout library with detailed explanations and modifications.</p>
                  <button className="visit-channel-btn">Visit Channel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <WorkoutVideoModal 
        isOpen={videoModalOpen}
        onClose={closeVideoModal}
        workoutName={selectedWorkoutName}
      />
    </div>
  );
}

export default AdminDashboard;