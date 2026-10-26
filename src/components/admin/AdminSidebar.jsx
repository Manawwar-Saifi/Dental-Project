/**
 * Admin Sidebar Component
 *
 * Navigation sidebar for admin panel.
 * Features:
 * - Responsive drawer (permanent on desktop, temporary on mobile)
 * - Navigation items with icons
 * - Active state highlighting
 *
 * Props:
 * - open: Boolean for mobile drawer state
 * - onClose: Function to close mobile drawer
 */
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
  Divider,
  Badge,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import EventIcon from "@mui/icons-material/Event";
import BiotechIcon from "@mui/icons-material/Biotech";
import PaymentIcon from "@mui/icons-material/Payment";
import AssessmentIcon from "@mui/icons-material/Assessment";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import BusinessIcon from "@mui/icons-material/Business";
import SettingsIcon from "@mui/icons-material/Settings";
import LanguageIcon from "@mui/icons-material/Language";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import NotificationsIcon from "@mui/icons-material/Notifications";
import GroupIcon from "@mui/icons-material/Group";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import ArticleIcon from "@mui/icons-material/Article";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import { useAdminStore } from "../../store/admin.store";
import { usePermissions } from "../../hooks/admin/usePermissions";

import logo from "../../../public/dental-clinic-logo.png";

// Sidebar width
const DRAWER_WIDTH = 260;

/**
 * Navigation items configuration
 * Easy to add/remove menu items here
 */
// `module` matches the Permission collection's module key exactly (see
// backend src/modules/permissions/permission.constants.js). A nav item with
// no `module` (Main Website) is always shown -- it's not access-gated at all.
const ADMIN_NAV = [
  { label: "Dashboard", path: "/admin/dashboard", icon: DashboardIcon, module: "dashboard" },
  { label: "Patients", path: "/admin/patients", icon: PeopleIcon, badgeKey: "patients", module: "patients" },
  { label: "Enquiries", path: "/admin/enquiries", icon: ContactPhoneIcon, badgeKey: "enquiries", badgeColor: "#ef4444", module: "enquiries" },
  { label: "Appointments", path: "/admin/appointments", icon: EventIcon, badgeKey: "appointments", badgeColor: "#3b82f6", module: "appointments" },
  { label: "Lab", path: "/admin/lab", icon: BiotechIcon, module: "lab" },
  { label: "Payment History", path: "/admin/payments", icon: PaymentIcon, badgeKey: "payments", badgeColor: "#f59e0b", module: "payments" },
  { label: "Billing", path: "/admin/billing", icon: ReceiptLongIcon, module: "billing" },
  { label: "Expenses", path: "/admin/expenses", icon: MoneyOffIcon, module: "expenses" },
  { label: "Reports", path: "/admin/reports", icon: AssessmentIcon, module: "reports" },
  { label: "Memberships", path: "/admin/memberships", icon: CardMembershipIcon, badgeKey: "memberships", badgeColor: "#8b5cf6", module: "memberships" },
  { label: "Blogs", path: "/admin/blogs", icon: ArticleIcon, module: "blogs" },
  { label: "Notifications", path: "/admin/notifications", icon: NotificationsIcon, badgeKey: "notifications", badgeColor: "#ec4899", module: "notifications" },
  { label: "Clinics", path: "/admin/clinics", icon: BusinessIcon, module: "clinics" },
  { label: "Staff", path: "/admin/users", icon: GroupIcon, module: "staff" },
  { label: "Settings", path: "/admin/settings", icon: SettingsIcon, module: "settings" },
  { label: "Main Website", path: "/", icon: LanguageIcon, external: true },
];

const AdminSidebar = ({ open, onClose }) => {
  const location = useLocation();
  const { admin } = useAdminStore();
  const { hasPermission, isReady } = usePermissions();

  // Dynamic, permission-driven nav -- a module shows only when this role's
  // `view` flag is true. Items with no `module` (Main Website) always show.
  // While permissions are still loading, show nothing gated yet rather than
  // flashing the full nav then collapsing it.
  const navItems = ADMIN_NAV.filter((item) => {
    if (!item.module) return true;
    if (!isReady) return false;
    return hasPermission(item.module, "view");
  });

  // "Permissions" (the matrix editor itself) is admin-only by direct role
  // check, not permission-driven -- it must never be hideable via the
  // matrix it itself edits (avoids a self-lockout on the nav item).
  const navItemsWithPermissions =
    admin?.role === "admin"
      ? [
          ...navItems.slice(0, -1),
          { label: "Permissions", path: "/admin/permissions", icon: AdminPanelSettingsIcon, module: null },
          navItems[navItems.length - 1],
        ]
      : navItems;

  // Fetch badge counts
  const { data: badgeCounts } = useQuery({
    queryKey: ["admin", "sidebar-badges"],
    queryFn: async () => {
      const [enquiries, notifications, appointments] = await Promise.allSettled([
        api.get("/enquiries/stats").then((r) => r.data),
        api.get("/notifications/unread-count").then((r) => r.data),
        api.get("/appointments/today").then((r) => r.data),
      ]);
      return {
        enquiries: enquiries.status === "fulfilled" ? (enquiries.value?.data?.stats?.byStatus?.new || 0) : 0,
        notifications: notifications.status === "fulfilled" ? (notifications.value?.data?.count || 0) : 0,
        appointments: appointments.status === "fulfilled" ? (appointments.value?.data?.length || 0) : 0,
      };
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const rawBadges = badgeCounts || {};

  // Track "seen" counts — when user visits a page, store the current count
  // Badge only shows when new count > last seen count
  const getSeenKey = (key) => `badge_seen_${key}`;

  // Save seen count when page is active
  React.useEffect(() => {
    navItemsWithPermissions.forEach((item) => {
      if (item.badgeKey && location.pathname.startsWith(item.path) && rawBadges[item.badgeKey] !== undefined) {
        localStorage.setItem(getSeenKey(item.badgeKey), String(rawBadges[item.badgeKey]));
      }
    });
  }, [location.pathname, rawBadges, navItemsWithPermissions]);

  // Calculate unseen badges
  const badges = {};
  Object.keys(rawBadges).forEach((key) => {
    const seen = parseInt(localStorage.getItem(getSeenKey(key)) || "0", 10);
    badges[key] = Math.max(0, rawBadges[key] - seen);
  });
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  /**
   * Handle navigation item click
   */
  const handleNavClick = (path) => {
    navigate(path);
    // Close drawer on mobile after navigation
    if (isMobile) {
      onClose();
    }
  };

  /**
   * Check if path is active
   */
  const isActive = (path) => location.pathname === path;

  /**
   * Sidebar content (shared between permanent and temporary drawer)
   */
  const sidebarContent = (
    <>
      {/* Logo/Brand */}
      <Toolbar className="border-b border-gray-100">
        <Box className="flex items-center gap-2">
          <img src={logo} alt="Dental Clinic" width={70} />
          <Box>
            <Typography variant="body2" sx={{ fontSize: "13px", fontWeight: 700, color: "#003366", lineHeight: 1.2 }}>
              Dental Clinic
            </Typography>
            <Typography variant="caption" sx={{ fontSize: "10px", color: "#9ca3af", letterSpacing: "0.04em" }}>
              Admin Panel
            </Typography>
          </Box>
        </Box>
      </Toolbar>

      {/* Navigation List */}
      <List className="px-3 py-1">
        {navItemsWithPermissions.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <ListItem key={item.path} disablePadding className="mb-0.5">
              <ListItemButton
                onClick={() => {
                  if (item.external) {
                    window.open(item.path, "_blank");
                  } else {
                    handleNavClick(item.path);
                  }
                }}
                className={`
                  rounded-lg! transition-all duration-200 py-1.5! px-3!
                  ${
                    active
                      ? "bg-orange-50! font-semibold!"
                      : "hover:bg-gray-100 text-gray-600"
                  }
                `}
                sx={active ? { borderLeft: "3px solid #F57C00" } : { borderLeft: "3px solid transparent" }}
              >
                <ListItemIcon
                  sx={{ minWidth: 36, color: active ? "#F57C00" : "#4B5563" }}
                >
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    sx: {
                      fontSize: "0.82rem",
                      fontWeight: active ? 600 : 500,
                      color: active ? "#F57C00" : "#374151",
                      letterSpacing: "-0.01em",
                    },
                  }}
                />
                {item.badgeKey && badges[item.badgeKey] > 0 && !active && (
                  <Box
                    sx={{
                      bgcolor: active ? "rgba(255,255,255,0.3)" : (item.badgeColor || "#ef4444"),
                      color: "#fff",
                      borderRadius: "12px",
                      minWidth: 22,
                      height: 22,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      px: 0.5,
                    }}
                  >
                    {badges[item.badgeKey]}
                  </Box>
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Bottom section */}
      <Box className="mt-auto p-4">
        <Divider className="mb-4" />
        <Typography variant="caption" className="text-gray-400">
          Dental Clinic CRM · v1.0
        </Typography>
      </Box>
    </>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { lg: DRAWER_WIDTH }, flexShrink: { lg: 0 } }}
    >
      {/* Mobile Drawer (temporary) */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }} // Better mobile performance
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* Desktop Drawer (permanent) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", lg: "block" },
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            borderRight: "1px solid #e5e7eb",
          },
        }}
        open
      >
        {sidebarContent}
      </Drawer>
    </Box>
  );
};

export { DRAWER_WIDTH };
export default AdminSidebar;
