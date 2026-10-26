import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { logoutPatient } from "../api/auth.api";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Divider,
  ListItemIcon,
  Badge,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import { usePatientUnreadCount } from "../hooks/patient/useNotifications";

import logo from "../../public/dental-clinic-logo.png";

/**
 * Patient Header Component
 *
 * Shows:
 * - Logo/clinic name
 * - Mobile menu toggle
 * - User avatar with dropdown menu
 */
const PatientHeader = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const { patient, logout } = useAuthStore();

  const { data: unreadData } = usePatientUnreadCount();
  const unreadCount = unreadData?.data?.count || 0;

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate("/profile");
  };

  const handleLogout = async () => {
    handleMenuClose();
    try { await logoutPatient(); } catch {}
    logout();
    navigate("/login", { replace: true });
  };

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return "P";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: "white",
        color: "text.primary",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <Toolbar>
        {/* Mobile menu button */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuToggle}
          sx={{ mr: 2, display: { md: "none" } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Logo */}
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            fontWeight: "bold",
            color: "primary.main",
            cursor: "pointer",
          }}
          onClick={() => navigate("/dashboard")}
        >
          <img src={logo} alt="Dental Clinic" width={100}/>
        </Typography>

        {/* User menu */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            color="inherit"
            onClick={() => navigate("/notifications")}
            size="small"
          >
            <Badge badgeContent={unreadCount} color="error" max={99}>
              <NotificationsIcon sx={{ fontSize: 22 }} />
            </Badge>
          </IconButton>

          <Typography
            variant="body2"
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            {patient?.name || "Patient"}
          </Typography>

          <IconButton
            onClick={handleMenuOpen}
            size="small"
            aria-controls={open ? "account-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: "primary.main",
                fontSize: "0.875rem",
              }}
            >
              {getInitials(patient?.name)}
            </Avatar>
          </IconButton>
        </Box>

        {/* Dropdown menu */}
        <Menu
          id="account-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 180,
            },
          }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2">{patient?.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {patient?.phone}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default PatientHeader;
