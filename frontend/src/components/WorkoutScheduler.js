import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './WorkoutScheduler.css';

function WorkoutScheduler() {
  const [schedules, setSchedules] = useState([]);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const [newSchedule, setNewSchedule] = useState({
    title: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 30,
    exercises: [{ name: '', sets: 3, reps: 10, restTime: 60, notes: '' }]
  });

  useEffect(() => {
    const userData = sessionStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      loadSchedules(parsed._id);
    }
  }, []);

  const loadSchedules = async (userId) => {
    try {
      const token = sessionStorage.getItem('token');
      
      // Load all schedules
      const [schedulesRes, todayRes, upcomingRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/users/${userId}/schedules`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/api/users/${userId}/schedules/today`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/api/users/${userId}/schedules/upcoming`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setSchedules(schedulesRes.data);
      setTodaySchedules(todayRes.data);
      setUpcomingSchedules(upcomingRes.data);
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/users/${user._id}/schedules`,
        newSchedule,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNewSchedule({
        title: '',
        description: '',
        scheduledDate: '',
        scheduledTime: '',
        duration: 30,
        exercises: [{ name: '', sets: 3, reps: 10, restTime: 60, notes: '' }]
      });
      setShowCreateForm(false);
      loadSchedules(user._id);
      alert('Workout scheduled successfully! 📅');
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Failed to create schedule. Please try again.');
    }
  };

  const handleUpdateSchedule = async (scheduleId, updates) => {
    if (!user) return;

    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/users/${user._id}/schedules/${scheduleId}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      loadSchedules(user._id);
      setEditingSchedule(null);
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert('Failed to update schedule. Please try again.');
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!user) return;

    if (!window.confirm('Are you sure you want to delete this workout schedule?')) {
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/users/${user._id}/schedules/${scheduleId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      loadSchedules(user._id);
      alert('Schedule deleted successfully!');
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule. Please try again.');
    }
  };

  const addExercise = () => {
    setNewSchedule(prev => ({
      ...prev,
      exercises: [...prev.exercises, { name: '', sets: 3, reps: 10, restTime: 60, notes: '' }]
    }));
  };

  const removeExercise = (index) => {
    setNewSchedule(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const updateExercise = (index, field, value) => {
    setNewSchedule(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) => 
        i === index ? { ...exercise, [field]: value } : exercise
      )
    }));
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: '#4CAF50',
      in_progress: '#FF9800',
      completed: '#2196F3',
      cancelled: '#F44336',
      skipped: '#9E9E9E'
    };
    return colors[status] || '#9E9E9E';
  };

  const getStatusIcon = (status) => {
    const icons = {
      scheduled: '📅',
      in_progress: '🏃‍♂️',
      completed: '✅',
      cancelled: '❌',
      skipped: '⏭️'
    };
    return icons[status] || '📅';
  };

  if (loading) {
    return (
      <div className="scheduler-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading your workout schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="scheduler-container">
      <div className="scheduler-header">
        <h1>📅 Workout Scheduler</h1>
        <p>Plan and track your workout sessions</p>
        <button 
          className="create-btn"
          onClick={() => setShowCreateForm(true)}
        >
          + Schedule New Workout
        </button>
      </div>

      {/* Today's Workouts */}
      <div className="section">
        <h2>🏃‍♂️ Today's Workouts</h2>
        {todaySchedules.length === 0 ? (
          <div className="empty-state">
            <p>No workouts scheduled for today</p>
          </div>
        ) : (
          <div className="schedule-grid">
            {todaySchedules.map(schedule => (
              <div key={schedule._id} className="schedule-card">
                <div className="schedule-header">
                  <h3>{schedule.title}</h3>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(schedule.status) }}
                  >
                    {getStatusIcon(schedule.status)} {schedule.status}
                  </span>
                </div>
                <p className="schedule-time">
                  {schedule.scheduledTime} • {schedule.duration} minutes
                </p>
                {schedule.description && (
                  <p className="schedule-description">{schedule.description}</p>
                )}
                <div className="schedule-actions">
                  {schedule.status === 'scheduled' && (
                    <button 
                      className="action-btn start-btn"
                      onClick={() => handleUpdateSchedule(schedule._id, { status: 'in_progress' })}
                    >
                      Start Workout
                    </button>
                  )}
                  {schedule.status === 'in_progress' && (
                    <button 
                      className="action-btn complete-btn"
                      onClick={() => handleUpdateSchedule(schedule._id, { status: 'completed' })}
                    >
                      Mark Complete
                    </button>
                  )}
                  <button 
                    className="action-btn edit-btn"
                    onClick={() => setEditingSchedule(schedule)}
                  >
                    Edit
                  </button>
                  <button 
                    className="action-btn delete-btn"
                    onClick={() => handleDeleteSchedule(schedule._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Workouts */}
      <div className="section">
        <h2>📆 Upcoming Workouts (Next 7 Days)</h2>
        {upcomingSchedules.length === 0 ? (
          <div className="empty-state">
            <p>No upcoming workouts scheduled</p>
          </div>
        ) : (
          <div className="schedule-grid">
            {upcomingSchedules.map(schedule => (
              <div key={schedule._id} className="schedule-card">
                <div className="schedule-header">
                  <h3>{schedule.title}</h3>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(schedule.status) }}
                  >
                    {getStatusIcon(schedule.status)} {schedule.status}
                  </span>
                </div>
                <p className="schedule-date">
                  {new Date(schedule.scheduledDate).toLocaleDateString()} at {schedule.scheduledTime}
                </p>
                <p className="schedule-duration">{schedule.duration} minutes</p>
                {schedule.description && (
                  <p className="schedule-description">{schedule.description}</p>
                )}
                <div className="schedule-actions">
                  <button 
                    className="action-btn edit-btn"
                    onClick={() => setEditingSchedule(schedule)}
                  >
                    Edit
                  </button>
                  <button 
                    className="action-btn delete-btn"
                    onClick={() => handleDeleteSchedule(schedule._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingSchedule) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingSchedule ? 'Edit Workout' : 'Schedule New Workout'}</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingSchedule(null);
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSchedule}>
              <div className="form-group">
                <label>Workout Title</label>
                <input
                  type="text"
                  value={editingSchedule ? editingSchedule.title : newSchedule.title}
                  onChange={(e) => editingSchedule ? 
                    setEditingSchedule({...editingSchedule, title: e.target.value}) :
                    setNewSchedule({...newSchedule, title: e.target.value})
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editingSchedule ? editingSchedule.description : newSchedule.description}
                  onChange={(e) => editingSchedule ? 
                    setEditingSchedule({...editingSchedule, description: e.target.value}) :
                    setNewSchedule({...newSchedule, description: e.target.value})
                  }
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={editingSchedule ? 
                      new Date(editingSchedule.scheduledDate).toISOString().split('T')[0] : 
                      newSchedule.scheduledDate
                    }
                    onChange={(e) => editingSchedule ? 
                      setEditingSchedule({...editingSchedule, scheduledDate: e.target.value}) :
                      setNewSchedule({...newSchedule, scheduledDate: e.target.value})
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="time"
                    value={editingSchedule ? editingSchedule.scheduledTime : newSchedule.scheduledTime}
                    onChange={(e) => editingSchedule ? 
                      setEditingSchedule({...editingSchedule, scheduledTime: e.target.value}) :
                      setNewSchedule({...newSchedule, scheduledTime: e.target.value})
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    value={editingSchedule ? editingSchedule.duration : newSchedule.duration}
                    onChange={(e) => editingSchedule ? 
                      setEditingSchedule({...editingSchedule, duration: parseInt(e.target.value)}) :
                      setNewSchedule({...newSchedule, duration: parseInt(e.target.value)})
                    }
                    min="1"
                    max="300"
                  />
                </div>
              </div>

              <div className="exercises-section">
                <h3>Exercises</h3>
                {(editingSchedule ? editingSchedule.exercises : newSchedule.exercises).map((exercise, index) => (
                  <div key={index} className="exercise-item">
                    <div className="exercise-header">
                      <h4>Exercise {index + 1}</h4>
                      {!editingSchedule && (editingSchedule ? editingSchedule.exercises : newSchedule.exercises).length > 1 && (
                        <button 
                          type="button"
                          className="remove-exercise-btn"
                          onClick={() => removeExercise(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="exercise-form">
                      <input
                        type="text"
                        placeholder="Exercise name"
                        value={exercise.name}
                        onChange={(e) => editingSchedule ? 
                          setEditingSchedule({
                            ...editingSchedule, 
                            exercises: editingSchedule.exercises.map((ex, i) => 
                              i === index ? {...ex, name: e.target.value} : ex
                            )
                          }) :
                          updateExercise(index, 'name', e.target.value)
                        }
                        required
                      />
                      
                      <div className="exercise-inputs">
                        <input
                          type="number"
                          placeholder="Sets"
                          value={exercise.sets}
                          onChange={(e) => editingSchedule ? 
                            setEditingSchedule({
                              ...editingSchedule, 
                              exercises: editingSchedule.exercises.map((ex, i) => 
                                i === index ? {...ex, sets: parseInt(e.target.value)} : ex
                              )
                            }) :
                            updateExercise(index, 'sets', parseInt(e.target.value))
                          }
                          min="1"
                        />
                        <input
                          type="number"
                          placeholder="Reps"
                          value={exercise.reps}
                          onChange={(e) => editingSchedule ? 
                            setEditingSchedule({
                              ...editingSchedule, 
                              exercises: editingSchedule.exercises.map((ex, i) => 
                                i === index ? {...ex, reps: parseInt(e.target.value)} : ex
                              )
                            }) :
                            updateExercise(index, 'reps', parseInt(e.target.value))
                          }
                          min="1"
                        />
                        <input
                          type="number"
                          placeholder="Rest (sec)"
                          value={exercise.restTime}
                          onChange={(e) => editingSchedule ? 
                            setEditingSchedule({
                              ...editingSchedule, 
                              exercises: editingSchedule.exercises.map((ex, i) => 
                                i === index ? {...ex, restTime: parseInt(e.target.value)} : ex
                              )
                            }) :
                            updateExercise(index, 'restTime', parseInt(e.target.value))
                          }
                          min="0"
                        />
                      </div>
                      
                      <textarea
                        placeholder="Notes (optional)"
                        value={exercise.notes}
                        onChange={(e) => editingSchedule ? 
                          setEditingSchedule({
                            ...editingSchedule, 
                            exercises: editingSchedule.exercises.map((ex, i) => 
                              i === index ? {...ex, notes: e.target.value} : ex
                            )
                          }) :
                          updateExercise(index, 'notes', e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
                
                {!editingSchedule && (
                  <button 
                    type="button"
                    className="add-exercise-btn"
                    onClick={addExercise}
                  >
                    + Add Exercise
                  </button>
                )}
              </div>

              <div className="form-actions">
                <button 
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingSchedule(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="save-btn"
                >
                  {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkoutScheduler;
