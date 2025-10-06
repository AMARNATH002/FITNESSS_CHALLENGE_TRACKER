import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, requireAdmin = false }) {
  const storedUser = sessionStorage.getItem("user");
  const token = sessionStorage.getItem("token");
  if (!storedUser || !token) {
    return <Navigate to="/login" replace />;
  }
  try {
    const user = JSON.parse(storedUser);
    if (requireAdmin && user.accountRole !== 'Admin') {
      return <Navigate to="/" replace />;
    }
  } catch (_) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default ProtectedRoute;


