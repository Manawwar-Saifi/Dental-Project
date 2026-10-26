/**
 * Admin Protected Route Component
 *
 * Route guard for admin pages.
 * Checks if admin is authenticated before allowing access, then checks the
 * current route's module against the logged-in user's own fetched
 * permissions (GET /permissions/mine) -- dynamic, not hardcoded per-role
 * rules. Blocks direct URL entry into a module this role can't view,
 * mirroring the same checkPermission("<module>", "view") the backend now
 * enforces on gated routes.
 *
 * Usage:
 * <Route element={<AdminProtectedRoute />}>
 *   <Route path="dashboard" element={<Dashboard />} />
 * </Route>
 */
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAdminStore } from "../../store/admin.store";
import { usePermissions } from "../../hooks/admin/usePermissions";
import { moduleForPath, PATH_TO_MODULE } from "../../config/permissionModules";

const AdminProtectedRoute = () => {
  const { isAuthenticated, admin } = useAdminStore();
  const { hasPermission, viewableModules, isLoading, isReady } = usePermissions();
  const location = useLocation();

  // If not authenticated, redirect to admin login
  // Save the attempted URL for redirecting after login
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // "Permissions" (the matrix editor) is admin-only by direct role check,
  // same reasoning as the sidebar -- never gated by the matrix it edits.
  if (location.pathname.startsWith("/admin/permissions")) {
    if (admin?.role !== "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Outlet />;
  }

  const module = moduleForPath(location.pathname);

  // A route with no module mapping (e.g. /admin/dashboard's own sub-pages
  // not in the list, or a genuinely unrestricted page) is allowed through
  // once authenticated -- only mapped modules are permission-gated.
  if (!module) {
    return <Outlet />;
  }

  // Wait for permissions to load before making a redirect decision --
  // avoids a flash-redirect on refresh before GET /permissions/mine resolves.
  if (isLoading || !isReady) {
    return (
      <Box className="flex items-center justify-center" sx={{ height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!hasPermission(module, "view")) {
    // Redirect to the first module this role CAN view, or a generic
    // access-denied state if they somehow have none at all.
    const firstAllowed = PATH_TO_MODULE.find((entry) => viewableModules.includes(entry.module));
    if (firstAllowed) {
      return <Navigate to={firstAllowed.path} replace />;
    }
    return (
      <Box className="flex flex-col items-center justify-center gap-2" sx={{ height: "100vh" }}>
        <Typography variant="h6" color="text.secondary">
          Access denied
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Your account has no accessible modules. Contact an administrator.
        </Typography>
      </Box>
    );
  }

  // Authenticated and permitted - render child routes
  return <Outlet />;
};

export default AdminProtectedRoute;
