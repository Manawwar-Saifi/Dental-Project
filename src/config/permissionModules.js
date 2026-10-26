/**
 * Maps admin route paths to Permission module keys.
 * Must match the backend's module list exactly
 * (src/modules/permissions/permission.constants.js).
 *
 * Shared by AdminSidebar (nav visibility) and AdminProtectedRoute (direct
 * URL entry guard) so the two can never drift out of sync with each other.
 */
export const PATH_TO_MODULE = [
  { path: "/admin/dashboard", module: "dashboard" },
  { path: "/admin/patients", module: "patients" },
  { path: "/admin/enquiries", module: "enquiries" },
  { path: "/admin/appointments", module: "appointments" },
  { path: "/admin/lab", module: "lab" },
  { path: "/admin/payments", module: "payments" },
  { path: "/admin/billing", module: "billing" },
  { path: "/admin/reports", module: "reports" },
  { path: "/admin/memberships", module: "memberships" },
  { path: "/admin/blogs", module: "blogs" },
  { path: "/admin/notifications", module: "notifications" },
  { path: "/admin/clinics", module: "clinics" },
  { path: "/admin/users", module: "staff" },
  { path: "/admin/settings", module: "settings" },
];

/** Given a pathname, find the module it belongs to (longest-prefix match). */
export const moduleForPath = (pathname) => {
  const match = PATH_TO_MODULE
    .filter((entry) => pathname.startsWith(entry.path))
    .sort((a, b) => b.path.length - a.path.length)[0];
  return match?.module || null;
};
