/**
 * Admin Header Component
 *
 * Top navigation bar for admin panel.
 * Features:
 * - Mobile menu toggle
 * - Admin profile dropdown
 * - Notifications dropdown with real-time data
 * - Logout functionality
 *
 * Props:
 * - onMenuClick: Function to toggle mobile sidebar
 */
import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Button,
  Skeleton,
  Chip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import EventIcon from "@mui/icons-material/Event";
import PaymentIcon from "@mui/icons-material/Payment";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import InfoIcon from "@mui/icons-material/Info";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useAdminStore } from "../../store/admin.store";
import { useAdminAuth } from "../../hooks/admin/useAdminAuth";
import {
  useUnreadCount,
  useUnreadNotifications,
  useNotificationMutations,
} from "../../hooks/admin/useNotifications";
import { DRAWER_WIDTH } from "./AdminSidebar";
import { Link } from "react-router-dom";

/**
 * Get icon based on notification type
 */
const getNotificationIcon = (type) => {
  const iconProps = { fontSize: "small" };
  switch (type) {
    case "appointment_reminder":
    case "appointment_confirmation":
    case "appointment_cancellation":
      return <EventIcon {...iconProps} className="text-blue-500" />;
    case "payment_reminder":
    case "payment_received":
      return <PaymentIcon {...iconProps} className="text-green-500" />;
    case "treatment_update":
    case "test_result":
      return <MedicalServicesIcon {...iconProps} className="text-purple-500" />;
    case "membership_expiry":
    case "membership_renewal":
      return <CardMembershipIcon {...iconProps} className="text-orange-500" />;
    default:
      return <InfoIcon {...iconProps} className="text-gray-500" />;
  }
};

/**
 * Format time ago
 */
const timeAgo = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

const AdminHeader = ({ onMenuClick }) => {
  // Profile menu anchor
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // Notification menu anchor
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const notifMenuOpen = Boolean(notifAnchorEl);

  // Get admin data from store
  const { admin } = useAdminStore();
  const { logout, isLoggingOut } = useAdminAuth();

  // Fetch notifications
  const { data: unreadCountData } = useUnreadCount();
  const { data: unreadData, isLoading: isLoadingNotifs } =
    useUnreadNotifications();
  const { markAsRead, markAllAsRead, isMarkingAllRead } =
    useNotificationMutations();

  const unreadCount = unreadCountData?.data?.count || 0;
  const notifications = unreadData?.data?.notifications || [];

  /**
   * Open profile menu
   */
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  /**
   * Close profile menu
   */
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  /**
   * Open notification menu
   */
  const handleNotifOpen = (event) => {
    setNotifAnchorEl(event.currentTarget);
  };

  /**
   * Close notification menu
   */
  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  /**
   * Handle notification click
   */
  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    handleNotifClose();
  };

  /**
   * Handle mark all as read
   */
  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  /**
   * Handle logout click
   */
  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  /**
   * Get admin initials for avatar
   */
  const getInitials = () => {
    if (!admin?.name) return "A";
    return admin.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { lg: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { lg: `${DRAWER_WIDTH}px` },
        bgcolor: "white",
        borderBottom: "1px solid #f3f4f6",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar className="justify-between">
        {/* Left side - Menu toggle (mobile only) */}
        <Box className="flex items-center gap-2">
          <IconButton
            onClick={onMenuClick}
            edge="start"
            sx={{ display: { lg: "none" } }}
            className="text-gray-600"
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            className="text-[#003366] font-semibold text-[18px] hidden sm:block"
          >
            Admin Panel
          </Typography>
        </Box>

        {/* Right side - Notifications & Profile */}
        <Box className="flex items-center gap-2">
          {/* Notifications */}
          <IconButton className="text-gray-600" onClick={handleNotifOpen}>
            <Badge badgeContent={unreadCount} color="error" max={99}>
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* Profile Button */}
          <IconButton
            onClick={handleMenuOpen}
            size="small"
            aria-controls={menuOpen ? "account-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={menuOpen ? "true" : undefined}
          >
            <Avatar
              className="bg-[#003366]"
              sx={{ width: 36, height: 36, fontSize: "0.9rem" }}
            >
              {getInitials()}
            </Avatar>
          </IconButton>
        </Box>

        {/* Notifications Dropdown */}
        <Menu
          anchorEl={notifAnchorEl}
          open={notifMenuOpen}
          onClose={handleNotifClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          PaperProps={{
            className: "mt-2",
            sx: { width: 360, maxHeight: 480 },
          }}
        >
          {/* Header */}
          <Box className="px-4 py-3 flex justify-between items-center border-b">
            <Typography variant="subtitle1" className="font-semibold">
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={handleMarkAllRead}
                disabled={isMarkingAllRead}
                startIcon={<CheckCircleIcon />}
              >
                Mark all read
              </Button>
            )}
          </Box>

          {/* Notifications List */}
          {isLoadingNotifs ? (
            <Box className="p-4">
              {[1, 2, 3].map((i) => (
                <Box key={i} className="flex gap-3 mb-3">
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box className="flex-1">
                    <Skeleton width="80%" height={20} />
                    <Skeleton width="60%" height={16} />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : notifications.length === 0 ? (
            <Box className="p-8 text-center">
              <NotificationsIcon
                sx={{ fontSize: 48 }}
                className="text-gray-300 mb-2"
              />
              <Typography variant="body2" className="text-gray-500">
                No new notifications
              </Typography>
            </Box>
          ) : (
            <List className="p-0 max-h-80 overflow-y-auto">
              {notifications.slice(0, 10).map((notification) => (
                <ListItem
                  key={notification._id}
                  button
                  onClick={() => handleNotificationClick(notification)}
                  className={`border-b hover:bg-gray-50 ${
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}
                >
                  <ListItemAvatar>
                    <Avatar
                      className={
                        notification.isRead ? "bg-gray-100" : "bg-blue-100"
                      }
                    >
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box className="flex justify-between items-start">
                        <Typography
                          variant="body2"
                          className={`${!notification.isRead ? "font-semibold" : ""}`}
                        >
                          {notification.title}
                        </Typography>
                        {notification.priority === "high" ||
                        notification.priority === "urgent" ? (
                          <Chip
                            label={notification.priority}
                            size="small"
                            color={
                              notification.priority === "urgent"
                                ? "error"
                                : "warning"
                            }
                            className="ml-2 text-xs h-5"
                          />
                        ) : null}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="caption"
                          className="text-gray-600 line-clamp-2"
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          variant="caption"
                          className="text-gray-400 block mt-1"
                        >
                          {timeAgo(notification.createdAt)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}

          {/* Footer */}
          {notifications.length > 0 && (
            <Box className="p-2 border-t text-center">
              <Button
                component={Link}
                to="/admin/notifications"
                size="small"
                className="text-accent"
                onClick={handleNotifClose}
              >
                View All Notifications
              </Button>
            </Box>
          )}
        </Menu>

        {/* Profile Dropdown Menu */}
        <Menu
          id="account-menu"
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          PaperProps={{
            className: "mt-2 min-w-[200px]",
          }}
        >
          {/* Admin Info */}
          <Box className="px-4 py-3">
            <Typography className="font-medium text-gray-800">
              {admin?.name || "Admin User"}
            </Typography>
            <Typography variant="body2" className="text-gray-500">
              {admin?.email || "admin@clinic.com"}
            </Typography>
          </Box>

          <Divider />

          {/* Menu Items */}
          <MenuItem onClick={handleMenuClose} component={Link} to="/admin/settings">
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            Settings
          </MenuItem>

          <Divider />

          <MenuItem onClick={handleLogout} disabled={isLoggingOut}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" className="text-red-500" />
            </ListItemIcon>
            <span className="text-red-500">
              {isLoggingOut ? "Logging out..." : "Logout"}
            </span>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default AdminHeader;
