/**
 * Admin Dashboard Page
 *
 * Main dashboard showing overview statistics and recent activity.
 *
 * Features:
 * - Stats cards (patients, appointments, revenue, etc.)
 * - Recent appointments table
 * - Recent patients list
 * - Today's schedule
 *
 * Uses:
 * - MUI Grid for responsive layout
 * - Tailwind CSS for styling
 * - React Query via useDashboard hook
 */
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Skeleton,
  IconButton,
  Button,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import PeopleIcon from "@mui/icons-material/People";
import EventIcon from "@mui/icons-material/Event";
import PaymentIcon from "@mui/icons-material/Payment";
import TodayIcon from "@mui/icons-material/Today";
import ScienceIcon from "@mui/icons-material/Science";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "../../hooks/admin/useDashboard";
import PatientDetailModal from "../../components/admin/modals/PatientDetailModal";

/**
 * Stats Card Component
 * Reusable card for displaying statistics
 */
const StatsCard = ({ title, value, icon: Icon, iconBg, iconColor, loading, onClick }) => (
  <Card
    elevation={0}
    onClick={onClick}
    className="h-full rounded-xl! border border-gray-100 shadow-xs!"
    sx={onClick ? {
      cursor: "pointer",
      transition: "all 0.2s ease",
      "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 20px rgba(0,0,0,0.12)" },
    } : undefined}
  >
    <CardContent className="flex items-center gap-4 p-5!">
      {/* Icon */}
      <Box
        className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}
      >
        <Icon className={`${iconColor} text-2xl`} />
      </Box>

      {/* Content */}
      <Box>
        <Typography variant="body2" className="text-gray-500 mb-1 text-[13px] font-medium">
          {title}
        </Typography>
        {loading ? (
          <Skeleton width={60} height={32} />
        ) : (
          <Typography variant="h5" className="font-numbers font-bold text-[#003366] text-[28px]">
            {value ?? 0}
          </Typography>
        )}
      </Box>
    </CardContent>
  </Card>
);

/**
 * Status pill styling (soft pastel pills — navy/orange/gray theme + semantic states)
 */
const statusPill = (status) => {
  const map = {
    scheduled: "bg-blue-50 text-blue-600",
    confirmed: "bg-blue-50 text-blue-600",
    checked_in: "bg-amber-50 text-amber-600",
    in_progress: "bg-amber-50 text-amber-600",
    completed: "bg-green-50 text-green-600",
    cancelled: "bg-red-50 text-red-600",
    no_show: "bg-gray-100 text-gray-500",
    pending: "bg-amber-50 text-amber-600",
    new: "bg-blue-50 text-blue-600",
    contacted: "bg-amber-50 text-amber-600",
  };
  return map[status?.toLowerCase()] || "bg-gray-100 text-gray-500";
};

const PILL_CLS =
  "inline-block rounded-full px-2.5 py-0.5 text-[12px] font-medium capitalize whitespace-nowrap";

/**
 * Format date helper
 */
const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/**
 * Format time helper
 */
const formatTime = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    stats,
    recentAppointments,
    recentPatients,
    todayAppointments,
    recentEnquiries,
    staleTreatments,
    unbilledAppointments,
    isLoadingStats,
    isLoadingRecentAppointments,
    isLoadingRecentPatients,
    isLoadingTodayAppointments,
    isLoadingRecentEnquiries,
    refetchAll,
  } = useDashboard();

  const [selectedPatient, setSelectedPatient] = useState(null);

  return (
    <Box>
      {/* Page Header */}
      <Box className="flex justify-between items-center mb-6">
        <Box>
          <Typography variant="h4" className="font-bold text-[#003366]">
            Dashboard
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            Welcome back! Here's what's happening today.
          </Typography>
        </Box>
        <IconButton onClick={refetchAll} className="text-gray-600">
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} className="mb-6">
        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
          <StatsCard
            title="Total Patients"
            value={stats?.totalPatients}
            icon={PeopleIcon}
            iconBg="bg-blue-50"
            iconColor="text-blue-500"
            loading={isLoadingStats}
            onClick={() => navigate("/admin/patients")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
          <StatsCard
            title="Total Appointments"
            value={stats?.totalAppointments}
            icon={EventIcon}
            iconBg="bg-orange-50"
            iconColor="text-accent"
            loading={isLoadingStats}
            onClick={() => navigate("/admin/appointments")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
          <StatsCard
            title="Pending Payments"
            value={stats?.pendingPayments}
            icon={PaymentIcon}
            iconBg="bg-red-50"
            iconColor="text-red-500"
            loading={isLoadingStats}
            onClick={() => navigate("/admin/payments")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
          <StatsCard
            title="Today's Appointments"
            value={stats?.todayAppointments}
            icon={TodayIcon}
            iconBg="bg-green-50"
            iconColor="text-green-500"
            loading={isLoadingStats}
            onClick={() => navigate("/admin/appointments?filter=today")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
          <StatsCard
            title="Pending Lab Orders"
            value={stats?.pendingLabOrders}
            icon={ScienceIcon}
            iconBg="bg-purple-50"
            iconColor="text-purple-500"
            loading={isLoadingStats}
            onClick={() => navigate("/admin/lab?deliveryStatus=pending")}
          />
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Recent Appointments Table */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card elevation={0} className="rounded-xl! border border-gray-100">
            <CardContent className="p-5!">
              {/* Card Header */}
              <Box className="flex justify-between items-center mb-4">
                <Typography variant="h6" className="font-semibold text-[#003366] text-[16px]">
                  Recent Appointments
                </Typography>
                <Button
                  size="small"
                  className="text-accent!"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate("/admin/appointments")}
                >
                  View All
                </Button>
              </Box>

              {/* Appointments List */}
              <Box>
                {isLoadingRecentAppointments ? (
                  [...Array(3)].map((_, i) => (
                    <Box key={i} className="flex items-center gap-3 p-2">
                      <Skeleton variant="circular" width={40} height={40} />
                      <Box flex={1}>
                        <Skeleton width="60%" height={20} />
                        <Skeleton width="40%" height={16} />
                      </Box>
                    </Box>
                  ))
                ) : recentAppointments?.length > 0 ? (
                  recentAppointments.map((appointment) => (
                    <Box
                      key={appointment._id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      sx={{ cursor: "pointer" }}
                      onClick={() => navigate("/admin/appointments")}
                    >
                      <Avatar sx={{ width: 36, height: 36 }} className="bg-gray-100 text-[#003366]">
                        {appointment.patient?.name?.[0] || "P"}
                      </Avatar>
                      <Box className="flex-1 min-w-0">
                        <Typography variant="body2" className="font-medium text-gray-800 truncate">
                          {appointment.patient?.name || "Unknown"}
                        </Typography>
                        <Typography variant="caption" className="text-gray-500">
                          {appointment.reason || "Checkup"} • {formatDate(appointment.date)} • {appointment.timeSlot || ""}
                        </Typography>
                      </Box>
                      <span className={`${PILL_CLS} ${statusPill(appointment.status)}`}>
                        {appointment.status?.replace("_", " ") || "scheduled"}
                      </span>
                    </Box>
                  ))
                ) : (
                  <Box className="text-center py-8">
                    <Typography variant="body2" className="text-gray-500">
                      No recent appointments
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Patients */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card elevation={0} className="h-full rounded-xl! border border-gray-100">
            <CardContent className="p-5!">
              {/* Card Header */}
              <Box className="flex justify-between items-center mb-4">
                <Typography variant="h6" className="font-semibold text-[#003366] text-[16px]">
                  Recent Patients
                </Typography>
                <Button
                  size="small"
                  className="text-accent!"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate("/admin/patients")}
                >
                  View All
                </Button>
              </Box>

              {/* Patient List */}
              <Box className="space-y-3">
                {isLoadingRecentPatients ? (
                  // Loading skeletons
                  [...Array(5)].map((_, index) => (
                    <Box key={index} className="flex items-center gap-3 p-2">
                      <Skeleton variant="circular" width={40} height={40} />
                      <Box className="flex-1">
                        <Skeleton width="60%" />
                        <Skeleton width="40%" height={16} />
                      </Box>
                    </Box>
                  ))
                ) : recentPatients?.length > 0 ? (
                  recentPatients.map((patient) => (
                    <Box
                      key={patient._id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <Avatar className="bg-gray-100 text-[#003366]">
                        {patient.name?.[0] || "P"}
                      </Avatar>
                      <Box className="flex-1 min-w-0">
                        <Typography variant="body2" className="font-medium text-gray-800 truncate">
                          {patient.name || "Unknown"}
                        </Typography>
                        <Typography variant="caption" className="text-gray-500">
                          {patient.phone || "No phone"}
                        </Typography>
                      </Box>
                      <Typography variant="caption" className="text-gray-400">
                        {formatDate(patient.createdAt)}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Box className="text-center py-8">
                    <Typography variant="body2" className="text-gray-500">
                      No recent patients
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Enquiries / Contact Form Entries */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} className="rounded-xl! border border-gray-100">
            <CardContent className="p-5!">
              <Box className="flex justify-between items-center mb-4">
                <Typography variant="h6" className="font-semibold text-[#003366] text-[16px]">
                  Recent Enquiries
                </Typography>
                <Button
                  size="small"
                  className="text-accent!"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate("/admin/enquiries")}
                >
                  View All
                </Button>
              </Box>

              <Box>
                {isLoadingRecentEnquiries ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Box key={i} className="flex items-center gap-3 p-2">
                      <Skeleton variant="circular" width={40} height={40} />
                      <Box flex={1}>
                        <Skeleton width="60%" height={20} />
                        <Skeleton width="40%" height={16} />
                      </Box>
                    </Box>
                  ))
                ) : recentEnquiries?.length > 0 ? (
                  recentEnquiries.map((enquiry) => (
                    <Box
                      key={enquiry._id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate("/admin/enquiries")}
                    >
                      <Avatar className="bg-gray-100 text-[#003366]">
                        {enquiry.name?.[0] || "?"}
                      </Avatar>
                      <Box className="flex-1 min-w-0">
                        <Typography variant="body2" className="font-medium text-gray-800 truncate">
                          {enquiry.name}
                        </Typography>
                        <Typography variant="caption" className="text-gray-500">
                          {enquiry.phone} {enquiry.treatmentName ? `• ${enquiry.treatmentName}` : ""}
                        </Typography>
                      </Box>
                      <span className={`${PILL_CLS} ${statusPill(enquiry.status || "new")}`}>
                        {enquiry.status || "new"}
                      </span>
                    </Box>
                  ))
                ) : (
                  <Box className="text-center py-8">
                    <Typography variant="body2" className="text-gray-500">
                      No enquiries yet
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Today's Schedule */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} className="rounded-xl! border border-gray-100">
            <CardContent className="p-5!">
              {/* Card Header */}
              <Box className="flex justify-between items-center mb-4">
                <Typography variant="h6" className="font-semibold text-[#003366] text-[16px]">
                  Today's Schedule
                </Typography>
                <Typography variant="body2" className="text-gray-500">
                  {new Date().toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Typography>
              </Box>

              {/* Today's Appointments */}
              {isLoadingTodayAppointments ? (
                <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, index) => (
                    <Skeleton key={index} variant="rounded" height={80} />
                  ))}
                </Box>
              ) : todayAppointments?.length > 0 ? (
                <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {todayAppointments.map((appointment) => {
                    const isEmergency = appointment.appointmentType === "emergency";
                    return (
                    <Box
                      key={appointment._id}
                      className={`p-4 border rounded-xl hover:shadow-sm transition-all cursor-pointer ${
                        isEmergency
                          ? "border-gray-100 border-l-4 border-l-red-600 bg-red-50/40"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                      onClick={() => navigate("/admin/appointments")}
                    >
                      <Box className="flex items-center gap-3 mb-2">
                        <Avatar sx={{ width: 36, height: 36 }} className="bg-gray-100 text-[#003366] text-sm">
                          {appointment.patient?.name?.[0] || "P"}
                        </Avatar>
                        <Box className="flex-1 min-w-0">
                          <Typography variant="body2" className="font-medium truncate flex items-center gap-1">
                            {appointment.patient?.name || "Unknown"}
                            {isEmergency && (
                              <span className="inline-block w-2 h-2 rounded-full bg-red-600 shrink-0" title="Emergency" />
                            )}
                          </Typography>
                          <Typography variant="caption" className="text-gray-500">
                            {appointment.timeSlot || "-"}
                          </Typography>
                        </Box>
                      </Box>
                      <Box className="flex justify-between items-center gap-1">
                        <Typography variant="caption" className="text-gray-600 truncate max-w-[100px]">
                          {appointment.reason || "Checkup"}
                        </Typography>
                        {isEmergency ? (
                          <span className="rounded-full px-2 py-0.5 text-[11px] font-bold bg-red-600 text-white">
                            Emergency
                          </span>
                        ) : (
                          <span className={`${PILL_CLS} ${statusPill(appointment.status)}`}>
                            {appointment.status?.replace("_", " ") || "scheduled"}
                          </span>
                        )}
                      </Box>
                    </Box>
                    );
                  })}
                </Box>
              ) : (
                <Box className="text-center py-8">
                  <Typography variant="body2" className="text-gray-500">
                    No appointments scheduled for today
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Unbilled Appointments — chargeable but no invoice exists. Red, not
            amber: this is unrecoverable revenue until someone acts, and these
            are invisible on the Billing page by construction (no invoice for it
            to list). Shown ABOVE stalled treatments — higher severity. */}
        {unbilledAppointments?.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Card elevation={0} className="rounded-xl! border border-red-300 bg-red-50/50">
              <CardContent className="p-5!">
                <Box className="flex justify-between items-center mb-2">
                  <Typography variant="h6" className="font-semibold text-[#991b1b] text-[16px]">
                    Unbilled Appointments ({unbilledAppointments.length})
                  </Typography>
                  <Button
                    size="small"
                    className="text-accent!"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate("/admin/appointments")}
                  >
                    View Appointments
                  </Button>
                </Box>
                <Typography variant="caption" className="text-red-800 block mb-3">
                  These appointments have a fee but no invoice, so they cannot be
                  billed or collected against and will not appear in Billing.
                  Please contact support to have an invoice created.
                </Typography>
                <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {unbilledAppointments.map((a) => (
                    <Box
                      key={a._id}
                      className="p-3 border border-red-200 rounded-lg bg-white hover:shadow-sm transition-all cursor-pointer"
                      onClick={() => navigate("/admin/appointments")}
                    >
                      <Typography variant="body2" className="font-medium text-gray-800 truncate">
                        {a.patient?.name || "Unknown"}
                      </Typography>
                      <Typography variant="caption" className="text-gray-500 block truncate">
                        {a.appointmentNumber} • ₹{(a.fee ?? a.opdFee ?? 0).toLocaleString("en-IN")}
                      </Typography>
                      <Typography variant="caption" className="text-red-700 font-medium block truncate">
                        {a.invoiceError?.message
                          ? `Invoice failed: ${a.invoiceError.message}`
                          : "No invoice linked"}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Stalled Treatments — not yet closed, behind on sessions, no activity in 90+ days */}
        {staleTreatments?.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Card elevation={0} className="rounded-xl! border border-amber-200 bg-amber-50/40">
              <CardContent className="p-5!">
                <Box className="flex justify-between items-center mb-4">
                  <Typography variant="h6" className="font-semibold text-[#92400e] text-[16px]">
                    Stalled Treatments ({staleTreatments.length})
                  </Typography>
                  <Button
                    size="small"
                    className="text-accent!"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate("/admin/appointments?tab=treatments")}
                  >
                    View Treatments
                  </Button>
                </Box>
                <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {staleTreatments.map((t) => (
                    <Box
                      key={t.appointmentId}
                      className="p-3 border border-amber-200 rounded-lg bg-white hover:shadow-sm transition-all cursor-pointer"
                      onClick={() => navigate("/admin/appointments?tab=treatments")}
                    >
                      <Typography variant="body2" className="font-medium text-gray-800 truncate">
                        {t.patient?.name || "Unknown"}
                      </Typography>
                      <Typography variant="caption" className="text-gray-500 block truncate">
                        {t.treatmentName || "Treatment"} • Session {t.sessionsBooked} of {t.sessionsPlanned}
                      </Typography>
                      <Typography variant="caption" className="text-amber-700 font-medium">
                        No activity for {t.daysSinceActivity} days
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Patient Detail Modal */}
      <PatientDetailModal
        open={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        patient={selectedPatient}
      />
    </Box>
  );
};

export default Dashboard;