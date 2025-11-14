// src/components/PrivateRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const PrivateRoute = ({ children }) => {
  const { user, loading, networkOffline } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700 dark:text-gray-200">
        Carregando...
      </div>
    );
  }

  // If we couldn't validate the session due to a network error, allow access
  // so the user can inspect the app and try to login manually. Only redirect
  // when we have a clear absence of a user and we're not offline.
  if (!user && !networkOffline) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default PrivateRoute;
