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
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useMyAppointments } from "../hooks/patient/useMyAppointments";
import { useMyPayments } from "../hooks/patient/useMyPayments";
import { useMyReports } from "../hooks/patient/useMyReports";
import { useMyTreatments } from "../hooks/patient/useMyTreatments";
import { useMyInvoices } from "../hooks/patient/useMyInvoices";
import DashboardIcon from "@mui/icons-material/Dashboard";
import EventIcon from "@mui/icons-material/Event";
import PaymentIcon from "@mui/icons-material/Payment";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DescriptionIcon from "@mui/icons-material/Description";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PersonIcon from "@mui/icons-material/Person";
import LanguageIcon from "@mui/icons-material/Language";

const DRAWER_WIDTH = 240;

/**
 * Navigation items for patient portal
 */
const navItems = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: <DashboardIcon />,
  },
  {
    title: "My Appointments",
    path: "/appointments",
    icon: <EventIcon />,
    badgeKey: "appointments",
    badgeColor: "#3b82f6",
  },
  {
    title: "Payment History",
    path: "/payments",
    icon: <PaymentIcon />,
    badgeKey: "payments",
    badgeColor: "#f59e0b",
  },
  {
    title: "Invoices",
    path: "/invoices",
    icon: <ReceiptLongIcon />,
    badgeKey: "invoices",
    badgeColor: "#e06c00",
  },
  {
    title: "Reports",
    path: "/reports",
    icon: <DescriptionIcon />,
    badgeKey: "reports",
    badgeColor: "#10b981",
  },
  {
    title: "Treatments",
    path: "/my-treatments",
    icon: <MedicalServicesIcon />,
    badgeKey: "treatments",
    badgeColor: "#8b5cf6",
  },
  {
    title: "My Membership",
    path: "/membership",
    icon: <CardMembershipIcon />,
  },
  {
    title: "Notifications",
    path: "/notifications",
    icon: <NotificationsIcon />,
  },
  {
    title: "Profile",
    path: "/profile",
    icon: <PersonIcon />,
  },
  {
    title: "Main Website",
    path: "https://dentalclinic.example.com/",
    icon: <LanguageIcon />,
    external: true,
  },
];

/**
 * Patient Sidebar Component
 *
 * Navigation sidebar with links to all patient pages.
 * Responsive: drawer on mobile, permanent on desktop.
 */
const PatientSidebar = ({ open, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Fetch counts for badges
  const { data: appointmentsData } = useMyAppointments();
  const { data: paymentsData } = useMyPayments();
  const { data: reportsData } = useMyReports();
  const { data: treatmentsData } = useMyTreatments();
  const { data: invoicesData } = useMyInvoices();

  const allAppointments = appointmentsData?.data?.appointments || appointmentsData?.data || [];
  const upcomingCount = Array.isArray(allAppointments)
    ? allAppointments.filter((a) => ["scheduled", "confirmed"].includes(a.status) && new Date(a.date) >= new Date(new Date().toDateString())).length
    : 0;

  const rawBadges = {
    appointments: upcomingCount,
    payments: paymentsData?.pagination?.total || 0,
    reports: reportsData?.data?.reports?.length || 0,
    treatments: treatmentsData?.data?.treatments?.length || treatmentsData?.data?.length || 0,
    invoices: invoicesData?.pagination?.total || 0,
  };

  // Track seen counts
  const getSeenKey = (key) => `patient_badge_seen_${key}`;

  React.useEffect(() => {
    navItems.forEach((item) => {
      if (item.badgeKey && location.pathname === item.path && rawBadges[item.badgeKey] !== undefined) {
        localStorage.setItem(getSeenKey(item.badgeKey), String(rawBadges[item.badgeKey]));
      }
    });
  }, [location.pathname, rawBadges]);

  const badges = {};
  Object.keys(rawBadges).forEach((key) => {
    const seen = parseInt(localStorage.getItem(getSeenKey(key)) || "0", 10);
    badges[key] = Math.max(0, rawBadges[key] - seen);
  });

  const handleNavClick = (path) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const handleExternalLink = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
    if (isMobile) {
      onClose();
    }
  };

  const drawerContent = (
    <Box sx={{ overflow: "auto" }}>
      <Toolbar /> {/* Spacer for fixed header */}
      {/* Extra top gap so the first item sits cleanly below the header bar
          instead of butting up against it. */}
      <List sx={{ pt: 2.5 }}>
        {navItems.map((item) => {
          const isActive = !item.external && location.pathname === item.path;

          return (
            <ListItem
              key={item.path}
              disablePadding
              sx={{ px: 1, mb: 0.5 }}
            >
              <ListItemButton
                onClick={() =>
                  item.external ? handleExternalLink(item.path) : handleNavClick(item.path)
                }
                sx={{
                  borderRadius: 1,
                  bgcolor: isActive ? "primary.main" : "transparent",
                  color: isActive ? "white" : item.external ? "primary.main" : "text.primary",
                  "&:hover": {
                    bgcolor: isActive ? "primary.dark" : "action.hover",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? "white" : item.external ? "primary.main" : "text.secondary",
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{
                    fontSize: "0.9rem",
                    fontWeight: isActive ? 600 : item.external ? 500 : 400,
                  }}
                />
                {item.badgeKey && badges[item.badgeKey] > 0 && !isActive && (
                  <Box
                    sx={{
                      bgcolor: item.badgeColor || "#ef4444",
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
    </Box>
  );

  return (
    <>
      {/* Mobile drawer (temporary) */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DRAWER_WIDTH,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer (permanent) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            borderRight: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default PatientSidebar;
export { DRAWER_WIDTH };
