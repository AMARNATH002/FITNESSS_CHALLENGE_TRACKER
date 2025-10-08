import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import UserList from "./components/UserList";
import AdminDashboard from "./components/AdminDashboard";
import Signup from "./components/Signup";
import Login from "./components/Login";
import RoleSelect from "./components/RoleSelect";
import Challenges from "./components/Challenges";
import Profile from "./components/Profile";
import Goals from "./components/Goals";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

// ---------------- Home Component ----------------
function Home() {
  return (
    <div className="home-page">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h1>Welcome to <span className="highlight">Fitness Tracker</span></h1>
        <p className="tagline">Track your workouts, stay consistent, and challenge yourself daily.</p>

        <div className="auth-buttons">
          <Link to="/signup" className="btn btn-signup">Sign Up</Link>
          <Link to="/login" className="btn btn-login">Login</Link>
        </div>
      </div>

      {/* Program Level Cards */}
      <div className="programs-section">
        <div className="programs-grid">
          <div className="program-card">
            <div className="card-icon">💪</div>
            <h3>Beginner Level</h3>
            <p>Perfect for students new to fitness</p>
          </div>

          <div className="program-card">
            <div className="card-icon">💪</div>
            <h3>Intermediate Level</h3>
            <p>For students with some fitness experience</p>
          </div>

          <div className="program-card">
            <div className="card-icon">💪</div>
            <h3>Advanced Level</h3>
            <p>For fitness enthusiasts and athletes</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- About Component ----------------
function About() {
  return (
    <div className="simple-page">
      <div className="page-container">
        <h1 className="page-title">About Us</h1>
        <p className="page-description">
          We are dedicated to helping you achieve your body and mind through the power of fitness.
        </p>
        <div className="simple-content">
          <p>The Fitness Challenge Tracker is your personal companion for building discipline, tracking workouts, and staying motivated with challenges.</p>
        </div>
      </div>
    </div>
  );
}

// ---------------- App Component ----------------
function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(!!sessionStorage.getItem("user"));
  const user = React.useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('user') || 'null'); } catch { return null; }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    setIsLoggedIn(false);
    window.location.href = "/";
  };

  return (
    <Router>
      <div className="app-container">
        {/* Simple Navbar */}
        <nav className="simple-navbar">
          <div className="navbar-content">
            <div className="navbar-left">
              <h1 className="navbar-title">FITNESS CHALLENGE TRACKER</h1>
              <p className="navbar-subtitle">KEC</p>
            </div>
            <div className="navbar-yeah-buddy1">
              <span className="yeah-buddy-text">YEAH BUDDY😎</span>
            </div>
            <div className="navbar-right">
              <Link to="/" className="nav-link">HOME</Link>
              <Link to="/about" className="nav-link">ABOUT US</Link>
              <Link to="/role" className="nav-link">PROGRAMS</Link>
              <Link to="/users" className="nav-link">BLOG</Link>
              <Link to="/profile" className="nav-link">MY PROFILE</Link>
              <Link to="/goals" className="nav-link">GOALS</Link>
              <Link to="/contact" className="nav-link">CONTACT</Link>
              {!isLoggedIn && (
                <Link to="/login" className="nav-link">SIGNUP / LOGIN</Link>
              )}
              {isLoggedIn && (
                <Link to="/login" onClick={handleLogout} className="nav-link">LOGOUT</Link>
              )}
            </div>
            <div className="navbar-yeah-buddy">
              <span className="yeah-buddy-text">LIGHT WEIGHT👑</span>
            </div>
          </div>
        </nav>

        {/* Dark Theme Sidebar */}
        {isLoggedIn && (
          <div className="sidebar">
            <div className="sidebar-icon" title="Dashboard">📊</div>
            <div className="sidebar-icon" title="Challenges">🏋️</div>
            <div className="sidebar-icon" title="Schedule">📅</div>
            <div className="sidebar-icon" title="Goals">⭐</div>
            <div className="sidebar-icon" title="Settings">⚙️</div>
          </div>
        )}

        {/* Routes */}
        <main className={isLoggedIn ? 'with-sidebar' : ''}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/role" element={
              <ProtectedRoute>
                {user?.accountRole === 'Admin' ? <Home /> : <RoleSelect />}
              </ProtectedRoute>
            } />
            <Route path="/challenges" element={
              <ProtectedRoute>
                {user?.accountRole === 'Admin' ? <Home /> : <Challenges />}
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/goals" element={
              <ProtectedRoute>
                <Goals />
              </ProtectedRoute>
            } />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/users" element={<UserList />} />
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <p>💪🏻Be Consistent & Strong -🏋️‍♂️- 👊🏻- KEC Fitness Tracker 💪🏻</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
