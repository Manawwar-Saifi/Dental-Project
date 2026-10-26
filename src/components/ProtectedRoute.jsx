import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

/**
 * Protected Route Component
 *
 * Wraps routes that require authentication.
 * Redirects to /login if user is not authenticated.
 * Preserves the intended destination for post-login redirect.
 */
const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login, saving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected content
  return <Outlet />;
};

export default ProtectedRoute;
