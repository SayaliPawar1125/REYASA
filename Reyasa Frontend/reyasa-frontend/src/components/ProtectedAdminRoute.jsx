
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedAdminRoute = () => {
  const token = localStorage.getItem("token");
  const storedRole = localStorage.getItem("role");

  const role = storedRole
    ?.toUpperCase()
    .replace("ROLE_", "");

  // Not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Logged in, but not an admin
  if (role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  // Admin access allowed
  return <Outlet />;
};

export default ProtectedAdminRoute;
