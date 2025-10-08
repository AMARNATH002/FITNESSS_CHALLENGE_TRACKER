import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function RoleSelect() {
  const navigate = useNavigate();
  
  // If user already has fitnessLevel, send them straight to Challenges
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user && user.fitnessLevel) {
          navigate("/challenges", { state: { role: user.fitnessLevel } });
        }
      } catch (_) {
        // ignore corrupt storage
      }
    }
  }, [navigate]);

  const handleSelect = async (fitnessLevel) => {
    alert(`You chose ${fitnessLevel} level! Let's get started! 💪`);
    
    try {
      // Update user's fitnessLevel in database
      const storedUser = sessionStorage.getItem('user');
      const token = sessionStorage.getItem('token');
      
      if (storedUser && token) {
        const user = JSON.parse(storedUser);
        
        // Update in database
        await axios.put(
          `/api/users/${user._id}`,
          { fitnessLevel },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Update local storage
        const updated = { ...user, fitnessLevel };
        sessionStorage.setItem('user', JSON.stringify(updated));
      }
      
      setTimeout(() => {
        navigate("/challenges", { state: { role: fitnessLevel } });
      }, 1000);
    } catch (error) {
      console.error("Error updating fitness level:", error);
      alert("Error saving your selection. Please try again.");
    }
  };

  return (
    <div className="role-select-container">
      <div className="role-select-card">
        <h2>🏋️‍♂️ Choose Your Challenge Level</h2>
        <p>Select the level that matches your current fitness journey</p>
        
        <div className="role-buttons">
          <div className="role-option" onClick={() => handleSelect("Beginner")}>
            <h3>🥇 Beginner</h3>
            <p>Perfect for those starting their fitness journey</p>
            <ul>
              <li>Basic exercises</li>
              <li>3 sets per exercise</li>
              <li>Focus on form</li>
            </ul>
          </div>
          
          <div className="role-option" onClick={() => handleSelect("Intermediate")}>
            <h3>🥈 Intermediate</h3>
            <p>For those with some fitness experience</p>
            <ul>
              <li>Advanced exercises</li>
              <li>3-4 sets per exercise</li>
              <li>Increased intensity</li>
            </ul>
          </div>
          
          <div className="role-option" onClick={() => handleSelect("Master")}>
            <h3>🥉 Master</h3>
            <p>For fitness enthusiasts ready for a challenge</p>
            <ul>
              <li>Expert level exercises</li>
              <li>4+ sets per exercise</li>
              <li>Maximum intensity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoleSelect;
