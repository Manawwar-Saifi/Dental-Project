/**
 * Patient Appointment Detail Page
 *
 * Shows full appointment details with patient info, timing, payment, and clinic.
 */
import { useState } from "react";
import { Box, Card, CardContent, Typography, Chip, CircularProgress, Button, Divider, TextField, IconButton, Tooltip } from "@mui/material";
import { toast } from "react-toastify";
import Grid from "@mui/material/Grid";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import EventIcon from "@mui/icons-material/Event";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import PaymentIcon from "@mui/icons-material/Payment";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { useNavigate, useParams } from "react-router-dom";
import { useMyAppointments, useAppointmentMutations } from "../../hooks/patient/useMyAppointments";
import { useAuthStore } from "../../store/auth.store";

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

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const InfoRow = ({ icon: Icon, label, value, valueColor }) => (
  <Box className="flex items-start gap-3 py-3">
    <Icon className="text-gray-400 mt-0.5" fontSize="small" />
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight="medium" color={valueColor || "text.primary"}>
        {value || "-"}
      </Typography>
    </Box>
  </Box>
);

const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = useAuthStore((state) => state.patient);
  const { data, isLoading, isFetching, dataUpdatedAt, refetch } = useMyAppointments();
  const { cancelAppointment, isCancelling } = useAppointmentMutations();
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const allAppointments = data?.data?.appointments || data?.data || [];
  const appointment = allAppointments.find((a) => a._id === id);

  if (isLoading) {
    return (
      <Box sx={{ textAlign: "center", py: 10 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }} color="text.secondary">Loading appointment details...</Typography>
      </Box>
    );
  }

  if (!appointment) {
    return (
      <Box sx={{ textAlign: "center", py: 10 }}>
        <Typography variant="h6" color="text.secondary">Appointment not found</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/appointments")} sx={{ mt: 2 }}>
          Back to Appointments
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <Box className="flex items-center gap-3">
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/appointments")} variant="text">
            Back
          </Button>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Appointment Details
            </Typography>
            <Box className="flex items-center gap-2">
              <Typography variant="body2" color="text.secondary" className="font-mono">
                {appointment.appointmentNumber || ""}
              </Typography>
              {dataUpdatedAt > 0 && (
                <Typography variant="caption" color="text.disabled">
                  · updated {Math.round((Date.now() - dataUpdatedAt) / 1000)}s ago
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
        <Box className="flex items-center gap-2">
          <Tooltip title="Refresh appointment data">
            <span>
              <IconButton
                size="small"
                onClick={() => refetch()}
                disabled={isFetching}
                sx={{ color: "text.secondary" }}
              >
                <RefreshIcon fontSize="small" sx={{ animation: isFetching ? "spin 1s linear infinite" : "none", "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } } }} />
              </IconButton>
            </span>
          </Tooltip>
          <Chip
            label={statusLabels[appointment.status] || appointment.status}
            color={statusColors[appointment.status] || "default"}
            size="medium"
            sx={{ fontSize: "0.9rem", px: 1 }}
          />
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column — Appointment Info */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom className="flex items-center gap-2">
                <CalendarMonthIcon color="primary" /> Appointment Info
              </Typography>
              <Divider sx={{ mb: 1 }} />

              <InfoRow icon={EventIcon} label="Date" value={formatDate(appointment.date)} />
              <InfoRow icon={AccessTimeIcon} label="Time Slot" value={appointment.timeSlot} />
              <InfoRow
                icon={ConfirmationNumberIcon}
                label="Token Number"
                value={appointment.tokenNumber ? `#${appointment.tokenNumber}` : "-"}
                valueColor="primary.main"
              />
              <InfoRow icon={MedicalServicesIcon} label="Reason for Visit" value={appointment.reason} />
              <InfoRow
                icon={EventIcon}
                label="Type"
                value={appointment.type === "follow_up" ? "Follow-up" : appointment.type === "emergency" ? "Emergency" : "Regular"}
              />
              {appointment.notes && (
                <InfoRow icon={MedicalServicesIcon} label="Notes" value={appointment.notes} />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column — Clinic & Payment */}
        <Grid size={{ xs: 12, md: 6 }}>
          {/* Clinic Info */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom className="flex items-center gap-2">
                <LocationOnIcon color="primary" /> Clinic Information
              </Typography>
              <Divider sx={{ mb: 1 }} />

              <InfoRow icon={LocationOnIcon} label="Clinic Name" value={appointment.clinic?.name} />
              {appointment.clinic?.address && (
                <InfoRow
                  icon={LocationOnIcon}
                  label="Address"
                  value={[
                    appointment.clinic.address.street,
                    appointment.clinic.address.area,
                    appointment.clinic.address.city,
                    appointment.clinic.address.state,
                    appointment.clinic.address.pincode,
                  ].filter(Boolean).join(", ")}
                />
              )}
              {appointment.clinic?.phone && (
                <InfoRow icon={PhoneIcon} label="Phone" value={appointment.clinic.phone} />
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom className="flex items-center gap-2">
                <PaymentIcon color="primary" /> Payment Details
              </Typography>
              <Divider sx={{ mb: 1 }} />

              <InfoRow
                icon={PaymentIcon}
                label="OPD Fee"
                value={appointment.isFree ? "Free" : <span className="font-numbers">{`₹${appointment.opdFee || 0}`}</span>}
              />
              <Box className="flex items-start gap-3 py-3">
                <PaymentIcon className="text-gray-400 mt-0.5" fontSize="small" />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Payment Status
                  </Typography>
                  <Chip
                    label={appointment.opdFeePaid ? "Paid" : "Unpaid"}
                    size="small"
                    color={appointment.opdFeePaid ? "success" : "warning"}
                  />
                </Box>
              </Box>
              {appointment.source && (
                <InfoRow icon={EventIcon} label="Booking Source" value={appointment.source} />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Patient Info */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom className="flex items-center gap-2">
                <PersonIcon color="primary" /> Your Information
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <InfoRow icon={PersonIcon} label="Name" value={patient?.name || appointment.patient?.name} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <InfoRow icon={PhoneIcon} label="Phone" value={patient?.phone || appointment.patient?.phone} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <InfoRow icon={PersonIcon} label="Email" value={patient?.email || "-"} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Timing Info (if checked in/completed) */}
        {(appointment.checkInTime || appointment.startTime || appointment.endTime) && (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom className="flex items-center gap-2">
                  <AccessTimeIcon color="primary" /> Timing Details
                </Typography>
                <Divider sx={{ mb: 1 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <InfoRow icon={AccessTimeIcon} label="Check-in Time" value={appointment.checkInTime ? formatDateTime(appointment.checkInTime) : "Not checked in"} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <InfoRow icon={AccessTimeIcon} label="Start Time" value={appointment.startTime ? formatDateTime(appointment.startTime) : "Not started"} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <InfoRow icon={AccessTimeIcon} label="End Time" value={appointment.endTime ? formatDateTime(appointment.endTime) : "Not ended"} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Cancellation Info */}
        {appointment.status === "cancelled" && appointment.cancellationReason && (
          <Grid size={{ xs: 12 }}>
            <Card sx={{ borderLeft: 4, borderColor: "error.main" }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" color="error" gutterBottom>
                  Cancellation Details
                </Typography>
                <Typography variant="body1">{appointment.cancellationReason}</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Actions */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Actions</Typography>
              <Divider sx={{ mb: 2 }} />

              {/* Cancel form */}
              {showCancelForm && (
                <Box sx={{ mb: 2, p: 2, bgcolor: "#fff3f3", borderRadius: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Reason for cancellation"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Box className="flex gap-2">
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      disabled={isCancelling}
                      onClick={() => {
                        cancelAppointment(
                          { id: appointment._id, reason: cancelReason || "Cancelled by patient" },
                          {
                            onSuccess: () => {
                              toast.success("Appointment cancelled");
                              navigate("/appointments");
                            },
                            onError: (err) => toast.error(err.response?.data?.message || "Failed to cancel"),
                          }
                        );
                      }}
                    >
                      {isCancelling ? "Cancelling..." : "Confirm Cancel"}
                    </Button>
                    <Button size="small" onClick={() => setShowCancelForm(false)}>Back</Button>
                  </Box>
                </Box>
              )}

              <Box className="flex gap-2 flex-wrap">
                {/* Cancel — for active appointments */}
                {!["cancelled", "completed", "no_show"].includes(appointment.status) && !showCancelForm && (
                  <Button variant="outlined" color="error" onClick={() => setShowCancelForm(true)}>
                    Cancel Appointment
                  </Button>
                )}
                {/* Rebook — for cancelled/completed */}
                {["cancelled", "completed", "no_show"].includes(appointment.status) && (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => navigate("/book-appointment")}
                  >
                    Rebook Appointment
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Created info */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="caption" color="text.disabled" className="text-center block">
            Created: {formatDateTime(appointment.createdAt)}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AppointmentDetail;
