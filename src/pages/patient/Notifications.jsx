import { useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  IconButton,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import EventIcon from "@mui/icons-material/Event";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import PaymentIcon from "@mui/icons-material/Payment";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import InfoIcon from "@mui/icons-material/Info";
import {
  usePatientNotifications,
  usePatientNotificationMutations,
} from "../../hooks/patient/useNotifications";

const typeIcons = {
  appointment_confirmation: <EventIcon sx={{ color: "#2e7d32" }} />,
  appointment_cancellation: <EventIcon sx={{ color: "#d32f2f" }} />,
  appointment_reminder: <EventIcon sx={{ color: "#ed6c02" }} />,
  appointment_reschedule: <EventRepeatIcon sx={{ color: "#0891b2" }} />,
  payment_received: <PaymentIcon sx={{ color: "#1976d2" }} />,
  payment_reminder: <PaymentIcon sx={{ color: "#ed6c02" }} />,
  membership_renewal: <CardMembershipIcon sx={{ color: "#9c27b0" }} />,
  membership_expiry: <CardMembershipIcon sx={{ color: "#d32f2f" }} />,
  general: <InfoIcon sx={{ color: "#757575" }} />,
};

const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-IN");
};

const PatientNotifications = () => {
  const { data, isLoading } = usePatientNotifications({ limit: 50 });
  const { markAsRead, markAllAsRead } = usePatientNotificationMutations();
  const notifications = data?.data || [];

  // Mark all unread notifications as read when the page loads so the bell resets to 0.
  useEffect(() => {
    if (notifications.some((n) => !n.isRead)) {
      markAllAsRead();
    }
  }, [notifications, markAllAsRead]);

  return (
    <Box>
      <Box className="flex justify-between items-center mb-4">
        <Box className="flex items-center gap-2">
          <NotificationsIcon sx={{ color: "#003366" }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#003366" }}>
            Notifications
          </Typography>
        </Box>
        {notifications.some((n) => !n.isRead) && (
          <Button
            size="small"
            startIcon={<DoneAllIcon />}
            onClick={() => markAllAsRead()}
            sx={{ fontSize: "0.75rem" }}
          >
            Mark all as read
          </Button>
        )}
      </Box>

      {isLoading ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <NotificationsIcon sx={{ fontSize: 48, color: "#ccc", mb: 1 }} />
            <Typography color="text.secondary">No notifications yet</Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {notifications.map((n) => (
            <Card
              key={n._id}
              sx={{
                cursor: n.isRead ? "default" : "pointer",
                borderLeft: n.isRead ? "4px solid transparent" : "4px solid #1976d2",
                bgcolor: n.isRead ? "#fff" : "#f5f9ff",
                transition: "all 0.2s",
                "&:hover": { bgcolor: "#f0f4f8" },
              }}
              onClick={() => {
                if (!n.isRead) markAsRead(n._id);
              }}
            >
              <CardContent sx={{ display: "flex", alignItems: "flex-start", gap: 2, py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box sx={{ mt: 0.5 }}>
                  {typeIcons[n.type] || typeIcons.general}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" sx={{ fontWeight: n.isRead ? 400 : 700, fontSize: "0.85rem" }}>
                      {n.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#999", whiteSpace: "nowrap", ml: 1 }}>
                      {timeAgo(n.createdAt)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: "#666", fontSize: "0.8rem", mt: 0.25 }}>
                    {n.message}
                  </Typography>
                </Box>
                {!n.isRead && (
                  <Chip label="New" size="small" color="primary" sx={{ fontSize: "0.6rem", height: 18 }} />
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default PatientNotifications;
