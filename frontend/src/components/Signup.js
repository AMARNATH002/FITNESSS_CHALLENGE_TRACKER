import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    accountRole: "User",
    fitnessLevel: "Beginner"
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    // If switching to Admin, clear fitnessLevel from form state (not asked for Admin)
    if (name === 'accountRole') {
      if (value === 'Admin') {
        setFormData({ ...formData, accountRole: value, fitnessLevel: '' });
      } else {
        setFormData({ ...formData, accountRole: value, fitnessLevel: formData.fitnessLevel || 'Beginner' });
      }
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        accountRole: formData.accountRole,
        ...(formData.accountRole === 'User' && formData.fitnessLevel ? { fitnessLevel: formData.fitnessLevel } : {})
      };
      const response = await axios.post("http://localhost:5000/api/users/signup", payload);
      alert("Signup successful! Welcome to your fitness journey! 💪");
      navigate("/login");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "Signup failed. Try again!");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>🏋️‍♂️</span>
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>JOIN THE CHALLENGE</h2>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label>Account Role</label>
            <select
              name="accountRole"
              value={formData.accountRole}
              onChange={handleChange}
              className="form-select"
            >
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          {formData.accountRole === 'User' && (
            <div className="form-group">
              <label>Fitness Level</label>
              <select
                name="fitnessLevel"
                value={formData.fitnessLevel}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Master">Master</option>
              </select>
            </div>
          )}
          
          <button type="submit" className="auth-btn">START YOUR JOURNEY</button>
        </form>
        <div style={{ marginTop: "12px", textAlign: "center" }}>
          <Link to="/login" className="auth-secondary-btn">Go to Login</Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;
