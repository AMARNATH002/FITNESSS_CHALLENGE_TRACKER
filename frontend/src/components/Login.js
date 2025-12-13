import React, { useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/users/login", formData);

      if (!res.data || !res.data.user || !res.data.token) {
        throw new Error("Invalid response from server");
      }

      alert("Login successful! Welcome back! 💪");

      sessionStorage.setItem("user", JSON.stringify(res.data.user));
      sessionStorage.setItem("token", res.data.token);

      // Add a small delay to ensure sessionStorage is set
      setTimeout(() => {
        const next =
          res.data.user?.accountRole === "Admin"
            ? "/admin"
            : res.data.user?.fitnessLevel
            ? "/challenges"
            : "/role";

        window.location.href = next;
      }, 100);
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error.response?.data?.error || error.message || "Login failed. Please try again.";
      alert(errorMessage);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px"
          }}
        >
          <span style={{ fontSize: "1.5rem", marginRight: "10px" }}>🔥</span>
          <h2 style={{ margin: 0, fontSize: "1.8rem" }}>WELCOME BACK</h2>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
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

          <button type="submit" className="auth-btn">
            GET BACK TO TRAINING
          </button>
        </form>

        <div style={{ marginTop: "12px", textAlign: "center" }}>
          <Link to="/signup" className="auth-secondary-btn">
            Go to Signup
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
