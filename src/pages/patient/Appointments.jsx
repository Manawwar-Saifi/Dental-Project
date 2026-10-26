/**
 * Patient Appointments Page
 *
 * Shows appointment history with tabs for Upcoming/Past/All
 */
import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import { useNavigate } from "react-router-dom";
import { useMyAppointments } from "../../hooks/patient/useMyAppointments";

const statusColors = {
  scheduled: "info",
  confirmed: "info",
  checked_in: "warning",
  in_progress: "warning",
  completed: "success",
  cancelled: "error",
  no_show: "default",
};

const statusLabels = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  checked_in: "Checked In",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

const wasRescheduled = (apt) =>
  typeof apt.notes === "string" && apt.notes.includes("Rescheduled from");

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Appointments = () => {
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();
  const { data, isLoading, error } = useMyAppointments();

  const allAppointments = data?.data?.appointments || data?.data || [];
  const now = new Date();

  // Filter based on tab
  const getFilteredAppointments = () => {
    if (!Array.isArray(allAppointments)) return [];
    if (tabValue === 0) {
      // Upcoming: scheduled, confirmed, checked_in
      return allAppointments.filter(
        (a) =>
          ["scheduled", "confirmed", "checked_in"].includes(a.status) &&
          new Date(a.date) >= new Date(now.toDateString())
      );
    }
    if (tabValue === 1) {
      // Past: completed, cancelled, no_show, or past date
      return allAppointments.filter(
        (a) =>
          ["completed", "cancelled", "no_show"].includes(a.status) ||
          new Date(a.date) < new Date(now.toDateString())
      );
    }
    return allAppointments; // All
  };

  const filteredAppointments = getFilteredAppointments();

  return (
    <Box>
      {/* Page Header */}
      <Box className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            My Appointments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View your appointment history and upcoming visits
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => navigate("/book-appointment")}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          Book Appointment / Treatment
        </Button>
      </Box>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Upcoming" />
          <Tab label="Past" />
          <Tab label="All" />
        </Tabs>
      </Card>

      {/* Content */}
      <Card>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          {isLoading ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }} color="text.secondary">
                Loading appointments...
              </Typography>
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography color="error">
                Failed to load appointments. Please try again.
              </Typography>
            </Box>
          ) : filteredAppointments.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <EventIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No {tabValue === 0 ? "upcoming" : tabValue === 1 ? "past" : ""} appointments
              </Typography>
              <Typography variant="body2" color="text.disabled">
                {tabValue === 0
                  ? "Book an appointment to get started"
                  : "Your appointments will appear here"}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table sx={{ bgcolor: "white", minWidth: "max-content" }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                    <TableCell>Appointment</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Clinic</TableCell>
                    <TableCell>Token</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Visit Type</TableCell>
                    <TableCell>Fee</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAppointments.map((apt) => (
                    <TableRow
                      key={apt._id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => navigate(`/appointments/${apt._id}`)}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium" className="font-mono text-xs">
                          {apt.appointmentNumber || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatDate(apt.date)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {apt.timeSlot || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {apt.clinic?.name || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {apt.tokenNumber ? `#${apt.tokenNumber}` : "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" className="max-w-[200px] truncate">
                          {apt.reason || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                          {apt.visitType === "treatment" ? (
                            <Chip
                              label={apt.treatmentId?.name || "Treatment"}
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          ) : (
                            <Chip label="OPD" size="small" color="info" variant="outlined" />
                          )}
                          {apt.appointmentType === "emergency" && (
                            <Chip
                              label="Emergency"
                              size="small"
                              sx={{ bgcolor: "#dc2626", color: "#fff", fontWeight: 700 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" className="font-numbers">
                          {apt.isFree
                            ? "Free"
                            : `₹${(apt.invoice?.grandTotal ?? apt.fee ?? apt.opdFee ?? 0).toLocaleString("en-IN")}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          if (apt.isFree) {
                            return <Chip label="Free" size="small" color="info" variant="outlined" />;
                          }
                          const ps = apt.invoice?.paymentStatus;
                          const map = {
                            paid: { label: "Paid", color: "success" },
                            partial: { label: "Partially Paid", color: "warning" },
                            unpaid: { label: "Unpaid", color: "error" },
                          };
                          const cfg = ps
                            ? map[ps] || { label: ps, color: "default" }
                            : {
                                label: apt.opdFeePaid ? "Paid" : "Unpaid",
                                color: apt.opdFeePaid ? "success" : "error",
                              };
                          return <Chip label={cfg.label} size="small" color={cfg.color} />;
                        })()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, alignItems: "flex-start" }}>
                          <Chip
                            label={statusLabels[apt.status] || apt.status}
                            size="small"
                            color={statusColors[apt.status] || "default"}
                          />
                          {wasRescheduled(apt) && (
                            <Chip
                              icon={<EventRepeatIcon sx={{ fontSize: "0.75rem !important" }} />}
                              label="Rescheduled"
                              size="small"
                              sx={{
                                bgcolor: "#cffafe",
                                color: "#0891b2",
                                border: "1px solid #a5f3fc",
                                fontWeight: 600,
                                fontSize: "0.65rem",
                                height: 20,
                                "& .MuiChip-icon": { color: "#0891b2" },
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Appointments;
