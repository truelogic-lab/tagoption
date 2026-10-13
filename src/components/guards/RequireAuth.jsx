import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../../lib/auth";

/**
 * Redirects to /auth if there's no session.
 * After login, `useNavigate(-1)` or the `from` we pass here returns the user
 * to the page they were trying to reach.
 */
export default function RequireAuth({ children }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }
  return children;
}
