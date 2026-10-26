/**
 * Patient Dashboard Page
 *
 * Shows:
 * - Welcome message with patient name
 * - Quick stats (appointments, payments, reports, treatments)
 * - Upcoming appointment card
 * - Patient info card
 * - Quick actions
 */
import { useAuthStore } from "../../store/auth.store";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Chip,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import EventIcon from "@mui/icons-material/Event";
import PaymentIcon from "@mui/icons-material/Payment";
import DescriptionIcon from "@mui/icons-material/Description";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import { useNavigate } from "react-router-dom";
import { useMyAppointments } from "../../hooks/patient/useMyAppointments";
import { useMyBillingSummary } from "../../hooks/patient/useMyInvoices";
import { useMyReports } from "../../hooks/patient/useMyReports";
import { useMyTreatments } from "../../hooks/patient/useMyTreatments";
import { useMyMembership, useMembershipPlans } from "../../hooks/patient/useMemberships";
import UpcomingFollowUps from "../../components/patient/UpcomingFollowUps";

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Dashboard = () => {
  const patient = useAuthStore((state) => state.patient);
  const navigate = useNavigate();

  // Fetch real data for stats
  const { data: appointmentsData, isLoading: loadingApts } = useMyAppointments();
  const { data: billingSummaryData, isLoading: loadingPay } = useMyBillingSummary();
  const { data: reportsData, isLoading: loadingRep } = useMyReports();
  const { data: treatmentsData, isLoading: loadingTreat } = useMyTreatments({ limit: 5 });
  const { data: membershipData, isLoading: loadingMembership } = useMyMembership();
  const { data: plansData } = useMembershipPlans();

  const firstName = patient?.name?.split(" ")[0] || "Patient";

  // Active membership (if any)
  const membership = membershipData?.data?.currentMembership || null;
  const hasActiveMembership =
    membership &&
    membership.status === "active" &&
    (!membership.expiryDate || new Date(membership.expiryDate) >= new Date());

  const plans = plansData?.data || [];

  // Extract counts
  const allAppointments = appointmentsData?.data?.appointments || appointmentsData?.data || [];
  const appointmentCount = Array.isArray(allAppointments) ? allAppointments.length : 0;

  // Pending Amount = total outstanding balance across this patient's invoices
  // (same invoice-based source as the admin Billing page: sum of balanceDue).
  const billingStats = billingSummaryData?.data?.stats || {};
  const pendingAmount = billingStats.totalDue || 0;

  const reports = reportsData?.data?.reports || [];
  const reportCount = Array.isArray(reports) ? reports.length : 0;

  const treatments = treatmentsData?.data || [];
  const treatmentCount = Array.isArray(treatments) ? treatments.length : 0;

  // Find next upcoming appointment
  const now = new Date();
  const upcomingAppointments = Array.isArray(allAppointments)
    ? allAppointments
        .filter(
          (a) =>
            ["scheduled", "confirmed"].includes(a.status) &&
            new Date(a.date) >= new Date(now.toDateString())
        )
        .sort((a, b) => new Date(a.date) - new Date(b.date))
    : [];
  const nextAppointment = upcomingAppointments[0];

  // Stats config
  const stats = [
    {
      title: "Appointments",
      value: loadingApts ? null : appointmentCount,
      icon: <EventIcon />,
      color: "#1976d2",
      path: "/appointments",
    },
    {
      title: "Pending Amount",
      value: loadingPay ? null : `₹${pendingAmount.toLocaleString("en-IN")}`,
      icon: <PaymentIcon />,
      color: "#ed6c02",
      path: "/payments",
    },
    {
      title: "Reports",
      value: loadingRep ? null : reportCount,
      icon: <DescriptionIcon />,
      color: "#2e7d32",
      path: "/reports",
    },
    {
      title: "Treatments",
      value: loadingTreat ? null : treatmentCount,
      icon: <MedicalServicesIcon />,
      color: "#9c27b0",
      path: "/my-treatments",
    },
  ];

  return (
    <Box>
      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  startIcon={<EventIcon />}
                  onClick={() => navigate("/book-appointment")}
                >
                  Book Appointment / Treatment
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PaymentIcon />}
                  onClick={() => navigate("/payments")}
                >
                  Payment History
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DescriptionIcon />}
                  onClick={() => navigate("/reports")}
                >
                  Medical Reports
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<MedicalServicesIcon />}
                  onClick={() => navigate("/my-treatments")}
                >
                  Treatment History
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Welcome, {firstName}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here&apos;s an overview of your dental health journey
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid key={stat.title} size={{ xs: 6, md: 3 }}>
            <Card
              sx={{
                cursor: "pointer",
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-4px)" },
              }}
              onClick={() => navigate(stat.path)}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Avatar
                    sx={{
                      bgcolor: `${stat.color}15`,
                      color: stat.color,
                      width: 40,
                      height: 40,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                </Box>
                {stat.value === null ? (
                  <Skeleton width={60} height={40} />
                ) : (
                  <Typography variant="h4" fontWeight="bold" className="font-numbers">
                    {stat.value}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Upcoming Appointment */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" fontWeight="bold">
                  Upcoming Appointment
                </Typography>
                <Button size="small" onClick={() => navigate("/appointments")}>
                  View All
                </Button>
              </Box>

              {loadingApts ? (
                <Box sx={{ textAlign: "center", py: 3 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : nextAppointment ? (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "#f0f7ff",
                    borderRadius: 2,
                    border: "1px solid #bbdefb",
                  }}
                >
                  <Box className="flex items-center justify-between mb-2">
                    <Typography variant="subtitle1" fontWeight="bold">
                      {formatDate(nextAppointment.date)}
                    </Typography>
                    <Chip
                      label={nextAppointment.status}
                      size="small"
                      color="info"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Time: {nextAppointment.timeSlot || "-"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Clinic: {nextAppointment.clinic?.name || "-"}
                  </Typography>
                  {nextAppointment.reason && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Reason: {nextAppointment.reason}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 4,
                    bgcolor: "#f5f5f5",
                    borderRadius: 1,
                  }}
                >
                  <EventIcon
                    sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
                  />
                  <Typography color="text.secondary">
                    No upcoming appointments
                  </Typography>
                  <Button
                    variant="text"
                    size="small"
                    sx={{ mt: 1 }}
                    onClick={() => navigate("/book-appointment")}
                  >
                    Book Now
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Patient Info Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" fontWeight="bold">
                  Your Information
                </Typography>
                <Button size="small" onClick={() => navigate("/profile")}>
                  Edit Profile
                </Button>
              </Box>

              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Name"
                    secondary={patient?.name || "-"}
                    primaryTypographyProps={{
                      variant: "body2",
                      color: "text.secondary",
                    }}
                    secondaryTypographyProps={{ variant: "body1" }}
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText
                    primary="Phone"
                    secondary={patient?.phone ? `+91 ${patient.phone}` : "-"}
                    primaryTypographyProps={{
                      variant: "body2",
                      color: "text.secondary",
                    }}
                    secondaryTypographyProps={{ variant: "body1" }}
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText
                    primary="Email"
                    secondary={patient?.email || "Not provided"}
                    primaryTypographyProps={{
                      variant: "body2",
                      color: "text.secondary",
                    }}
                    secondaryTypographyProps={{ variant: "body1" }}
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText
                    primary="Patient ID"
                    secondary={patient?.patientId || "-"}
                    primaryTypographyProps={{
                      variant: "body2",
                      color: "text.secondary",
                    }}
                    secondaryTypographyProps={{ variant: "body1" }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Membership */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CardMembershipIcon sx={{ color: "#ed6c02" }} />
                  <Typography variant="h6" fontWeight="bold">
                    Your Membership
                  </Typography>
                </Box>
                {!hasActiveMembership && !loadingMembership && (
                  <Button size="small" onClick={() => navigate("/membership-plans")}>
                    View Plans
                  </Button>
                )}
              </Box>

              {loadingMembership ? (
                <Box sx={{ textAlign: "center", py: 3 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : hasActiveMembership ? (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "#fff7ed",
                    borderRadius: 2,
                    border: "1px solid #fed7aa",
                  }}
                >
                  <Box className="flex items-center justify-between mb-2">
                    <Typography variant="subtitle1" fontWeight="bold">
                      {membership.planName}
                    </Typography>
                    <Chip label="Active" size="small" color="success" />
                  </Box>
                  {membership.discountPercent > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Discount: {membership.discountPercent}% on treatments
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Valid till: {formatDate(membership.expiryDate)}
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 4,
                    bgcolor: "#f5f5f5",
                    borderRadius: 1,
                  }}
                >
                  <CardMembershipIcon
                    sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
                  />
                  <Typography color="text.secondary">
                    No active membership
                  </Typography>
                </Box>
              )}

              {/* All Available Plans */}
              {plans.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Available Plans
                    </Typography>
                    <Button size="small" onClick={() => navigate("/membership-plans")}>
                      View All →
                    </Button>
                  </Box>
                  <Grid container spacing={1.5}>
                    {plans.map((plan) => {
                      const isCurrent = hasActiveMembership && membership.planName === plan.name;
                      return (
                        <Grid key={plan._id} size={{ xs: 12, sm: 6, md: 4 }}>
                          <Box
                            sx={{
                              p: 1.5,
                              border: "1px solid",
                              borderColor: isCurrent ? "#ed6c02" : "divider",
                              borderRadius: 1.5,
                              bgcolor: isCurrent ? "#fff7ed" : "#fafafa",
                              position: "relative",
                            }}
                          >
                            {isCurrent && (
                              <Chip
                                label="Your Plan"
                                size="small"
                                color="warning"
                                sx={{ position: "absolute", top: 8, right: 8, fontSize: "0.6rem", height: 18 }}
                              />
                            )}
                            <Typography variant="body2" fontWeight="bold" sx={{ pr: isCurrent ? 9 : 0 }}>
                              {plan.name}
                            </Typography>
                            {plan.discountPercentage > 0 && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {plan.discountPercentage}% off treatments
                              </Typography>
                            )}
                            <Typography variant="subtitle2" fontWeight="bold" color="primary" sx={{ mt: 0.5 }}>
                              ₹{plan.price.toLocaleString("en-IN")}
                              <Typography component="span" variant="caption" color="text.secondary">
                                {" "}/ {plan.durationMonths === 12 ? "year" : `${plan.durationMonths} months`}
                              </Typography>
                            </Typography>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Follow-up Reminders (no payment) */}
        <Grid size={{ xs: 12 }}>
          <UpcomingFollowUps />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
