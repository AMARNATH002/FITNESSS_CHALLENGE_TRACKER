import React, { useState, useEffect, useCallback } from 'react';
import './WorkoutVideoModal.css';

const workoutVideos = {
    'squats': {
      id: 'YaXPRqUwItQ',
      title: 'Perfect Squat Form',
      duration: '0:52',
      description: 'Master the basic squat movement'
    },
    'plank': {
      id: 'pSHjTRCQxIw',
      title: 'How to Hold a Plank',
      duration: '0:38',
      description: 'Proper plank form and breathing'
    },
    'burpees': {
      id: 'TU8QYVW0gDU',
      title: 'Burpee Exercise Tutorial',
      duration: '0:58',
      description: 'Complete burpee movement breakdown'
    },
    'pullups': {
      id: 'eGo4IYlbE5g',
      title: 'Pull-up Technique',
      duration: '0:47',
      description: 'How to do pull-ups properly'
    },
    'lunges': {
      id: 'QOVaHwm-Q6U',
      title: 'Lunge Exercise Form',
      duration: '0:41',
      description: 'Perfect lunge technique'
    },
    'advanced_pushups': {
      id: 'IODxDxX7oi4',
      title: 'Advanced Push-up Variations',
      duration: '0:45',
      description: 'Advanced push-up techniques'
    },
    'plank_hold': {
      id: 'pSHjTRCQxIw',
      title: 'Advanced Plank Hold',
      duration: '0:38',
      description: 'Extended plank hold techniques'
    },
    'jumping_lunges': {
      id: 'QOVaHwm-Q6U',
      title: 'Jumping Lunges Tutorial',
      duration: '0:41',
      description: 'Dynamic lunge variations'
    },
    'advanced_burpees': {
      id: 'TU8QYVW0gDU',
      title: 'Advanced Burpee Variations',
      duration: '0:58',
      description: 'Advanced burpee techniques'
    },
    // Additional workout videos
    'leg_curl': {
      id: 'BHY0Fxqk5nE',
      title: 'Leg Curl Exercise',
      duration: '0:35',
      description: 'Proper leg curl form and technique'
    },
    'bicycle_crunch': {
      id: '9FGIL5a1iLI',
      title: 'Bicycle Crunch Tutorial',
      duration: '0:42',
      description: 'How to do bicycle crunches correctly'
    },
    'jumping_jack': {
      id: 'jHv63Uvk5VA',
      title: 'Jumping Jacks Form',
      duration: '0:28',
      description: 'Proper jumping jack technique'
    },
    'bicep_curl': {
      id: 'gM0WXaXbHj8',
      title: 'Bicep Curl Exercise',
      duration: '0:38',
      description: 'Correct bicep curl form'
    },
    'pull-up': {
      id: 'eGo4IYlbE5g',
      title: 'Pull-up Technique',
      duration: '0:47',
      description: 'How to do pull-ups properly'
    },
    'pull up': {
      id: 'eGo4IYlbE5g',
      title: 'Pull-up Technique',
      duration: '0:47',
      description: 'How to do pull-ups properly'
    }
  };

// Keyword groups for broader matching → single short video each
const keywordVideoMap = [
    { keywords: ['push'], video: workoutVideos['pushups'] },
    { keywords: ['squat','front_squat'], video: { id: 'YaXPRqUwItQ', title: 'Perfect Squat Form', duration: '0:52', description: 'Master the basic squat movement' } },
    { keywords: ['plank','side_plank'], video: workoutVideos['plank'] },
    { keywords: ['burpee'], video: workoutVideos['burpees'] },
    { keywords: ['pull','pulldown'], video: workoutVideos['pullups'] },
    { keywords: ['lunge','lunges','split_squat','bulgarian'], video: workoutVideos['lunges'] },
    { keywords: ['bench','press','incline'], video: { id: 'rT7DgCr-3pg', title: 'Bench Press Form', duration: '0:55', description: 'Proper barbell bench press technique' } },
    { keywords: ['deadlift','romanian','sumo'], video: { id: 'op9kVnSso6Q', title: 'Deadlift Form Guide', duration: '0:59', description: 'Safe and effective deadlift technique' } },
    { keywords: ['row','bent-over','cable_row'], video: { id: 'GZbfZ033f74', title: 'Barbell Row Form', duration: '0:47', description: 'How to row with proper back engagement' } },
    { keywords: ['curl','bicep'], video: workoutVideos['bicep_curl'] },
    { keywords: ['hamstring','leg_curl'], video: workoutVideos['leg_curl'] },
    { keywords: ['jumping_jack','jump rope','high_knees'], video: workoutVideos['jumping_jack'] },
    { keywords: ['hip_thrust','glute_bridge'], video: { id: 'SEdqd1n0cvg', title: 'Hip Thrust Basics', duration: '0:44', description: 'Glute-focused hip thrust tutorial' } },
    { keywords: ['kettlebell'], video: { id: 'rZ3k8JrjU1Q', title: 'Kettlebell Swing Basics', duration: '0:40', description: 'Safe kettlebell swing technique' } },
  ];

function WorkoutVideoModal({ isOpen, onClose, workoutName }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videos, setVideos] = useState([]);

  const loadWorkoutVideos = useCallback(() => {
    setLoading(true);
    setError(null);

    // Find matching videos for the workout
    const normalizedName = workoutName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const matchingVideos = [];

    // Check for exact match first
    if (workoutVideos[normalizedName]) {
      matchingVideos.push(workoutVideos[normalizedName]);
    } else {
      // Keyword-group based matching
      for (const grp of keywordVideoMap) {
        if (grp.keywords.some(k => normalizedName.includes(k))) {
          matchingVideos.push(grp.video);
        }
      }
      // Also allow partial matches against curated keys
      Object.keys(workoutVideos).forEach(key => {
        if (normalizedName.includes(key) || key.includes(normalizedName)) {
          matchingVideos.push(workoutVideos[key]);
        }
      });
    }

    // Remove duplicates
    const uniqueVideos = matchingVideos.filter((video, index, self) =>
      index === self.findIndex(v => v.id === video.id)
    );

    // If no matches found, default to a general full-body form video
    if (uniqueVideos.length === 0) uniqueVideos.push(workoutVideos['squats']);

    setVideos(uniqueVideos);
    setLoading(false);
  }, [workoutName]);

  useEffect(() => {
    if (isOpen && workoutName) {
      loadWorkoutVideos();
    }
  }, [isOpen, workoutName, loadWorkoutVideos]);

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
  };

  if (!isOpen) return null;

  return (
    <div className="video-modal-overlay" onClick={onClose}>
      <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="video-modal-header">
          <h2>🎥 {workoutName} Workout Tutorial</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading workout tutorial...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <p>❌ {error}</p>
            <button className="btn-primary" onClick={loadWorkoutVideos}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && videos.length === 0 && (
          <div className="no-videos">
            <p>No tutorial found for "{workoutName}" workout.</p>
            <button className="btn-primary" onClick={loadWorkoutVideos}>
              Refresh
            </button>
          </div>
        )}

        {!loading && !error && videos.length > 0 && (
          <div className="videos-container">
            {selectedVideo ? (
              <div className="selected-video-section">
                <div className="video-player">
                  <iframe 
                    width="100%" 
                    height="400"
                    src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1&rel=0`}
                    title={selectedVideo.title}
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
                <div className="video-info">
                  <h3>📹 {selectedVideo.title}</h3>
                  <p><strong>Duration:</strong> {selectedVideo.duration}</p>
                  <p><strong>Description:</strong> {selectedVideo.description}</p>
                  <a 
                    href={`https://www.youtube.com/watch?v=${selectedVideo.id}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    Watch on YouTube
                  </a>
                </div>
                <button 
                  className="btn-secondary back-btn"
                  onClick={() => setSelectedVideo(null)}
                >
                  ← Back to All Tutorials
                </button>
              </div>
            ) : (
              <div className="videos-grid">
                {videos.map((video, index) => (
                  <div 
                    key={index} 
                    className="video-card"
                    onClick={() => handleVideoSelect(video)}
                  >
                    <div className="video-thumbnail">
                      <img 
                        src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                        alt={`${video.title} thumbnail`}
                        loading="lazy"
                      />
                      <div className="video-duration">
                        {video.duration}
                      </div>
                      <div className="play-overlay">
                        ▶️
                      </div>
                    </div>
                    <div className="video-details">
                      <h4>{video.title}</h4>
                      <p>{video.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="video-modal-footer">
          <p className="attribution">
            📺 Short workout tutorials (30 seconds to 1 minute) to help you learn proper form
          </p>
        </div>
      </div>
    </div>
  );
}

export default WorkoutVideoModal;