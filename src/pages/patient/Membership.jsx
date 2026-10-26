/**
 * Patient Membership Page
 *
 * Shows current membership status. Links to /membership-plans for browsing and buying plans.
 */
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Skeleton,
  Chip,
  Alert,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { useAuthStore } from "../../store/auth.store";
import api from "../../api/axios";

const fmtDate = (d) => {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getDaysRemaining = (expiryDate) => {
  if (!expiryDate) return 0;
  return Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
};

const Membership = () => {
  const { patient } = useAuthStore();
  const navigate = useNavigate();
  const plansRef = useRef(null);

  const [membershipData, setMembershipData] = useState(null);
  const [membershipLoading, setMembershipLoading] = useState(true);

  useEffect(() => {
    const fetchMembership = async () => {
      try {
        const patientId = patient?._id || patient?.id;
        if (!patientId) {
          setMembershipLoading(false);
          return;
        }
        const res = await api.get(`/patients/${patientId}/membership`);
        setMembershipData(res.data.data);
      } catch (err) {
        console.error("Membership fetch error:", err);
      } finally {
        setMembershipLoading(false);
      }
    };
    fetchMembership();
  }, [patient?._id]);

  const membership = membershipData?.currentMembership;
  const currentPlan = membership?.plan || null;

  const isActive =
    membership?.status === "active" && new Date(membership?.expiryDate) > new Date();
  const daysRemaining = isActive ? getDaysRemaining(membership.expiryDate) : 0;
  const hasExpired = membership && !isActive;

  const handleScrollToPlans = () => {
    plansRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold">
          My Membership
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View your current plan and explore available membership options
        </Typography>
      </Box>

      {/* ── Current Membership Status ── */}
      {membershipLoading ? (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      ) : membership ? (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Plan Status Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card className="h-full overflow-hidden">
              <Box
                sx={{
                  background: isActive
                    ? "linear-gradient(to right, #16a34a, #15803d)"
                    : "linear-gradient(to right, #6b7280, #4b5563)",
                  p: 2.5,
                  color: "white",
                }}
              >
                <Box className="flex items-center gap-2 mb-1">
                  <CardMembershipIcon />
                  <Typography variant="h6" fontWeight="bold">
                    {membership.planName || "Membership Plan"}
                  </Typography>
                  <Chip
                    size="small"
                    label={isActive ? "Active" : "Expired"}
                    sx={{ ml: "auto", bgcolor: "rgba(255,255,255,0.2)", color: "white" }}
                  />
                </Box>
                {isActive && (
                  <Chip
                    size="small"
                    label={`${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`}
                    sx={{ bgcolor: "#f59e0b", color: "white", fontWeight: 700, mt: 0.75 }}
                  />
                )}
                {currentPlan && (currentPlan.discontinued === true || currentPlan.isActive === false) && (
                  <Typography sx={{ fontSize: "11px", color: "rgba(255,255,255,0.85)", mt: 0.75, fontStyle: "italic" }}>
                    This plan has been discontinued
                  </Typography>
                )}
              </Box>

              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ "& > *:not(:last-child)": { mb: 1.5 }, mb: 2.5 }}>
                  <Box className="flex items-center gap-2">
                    <CalendarTodayIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <span className="text-gray-500">Started:</span>{" "}
                      <strong>{fmtDate(membership.startDate)}</strong>
                    </Typography>
                  </Box>
                  <Box className="flex items-center gap-2">
                    <CalendarTodayIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <span className="text-gray-500">Expires:</span>{" "}
                      <strong>{fmtDate(membership.expiryDate)}</strong>
                    </Typography>
                  </Box>
                </Box>

                {hasExpired && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Your membership has expired. Renew below to restore your benefits.
                  </Alert>
                )}

                {membership.discountPercent > 0 && (
                  <Box sx={{ bgcolor: "#f0fdf4", borderRadius: 1.5, p: 1.5, mb: 2.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Member Discount
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="success.main">
                      {membership.discountPercent}% off on treatments
                    </Typography>
                  </Box>
                )}

              </CardContent>
            </Card>
          </Grid>

          {/* Plan Details Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card className="h-full">
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Plan Details
                </Typography>

                {/* Key plan info rows */}
                <Box sx={{ mb: 2 }}>
                  {/* Plan Name row — custom to support Discontinued badge */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography sx={{ color: "#666", fontSize: "13px" }}>Plan Name</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: "13px", textAlign: "right" }}>
                        {membership.planName || "—"}
                      </Typography>
                      {currentPlan && (currentPlan.discontinued === true || currentPlan.isActive === false) && (
                        <Box
                          component="span"
                          sx={{
                            fontSize: "10px",
                            fontWeight: 600,
                            color: "#dc2626",
                            backgroundColor: "#fef2f2",
                            border: "1px solid #fecaca",
                            borderRadius: "4px",
                            padding: "1px 8px",
                            letterSpacing: "0.5px",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Discontinued
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Remaining rows */}
                  {[
                    {
                      label: "Price",
                      value: currentPlan
                        ? `₹${(currentPlan.price || 0).toLocaleString("en-IN")}`
                        : "—",
                    },
                    {
                      label: "Duration",
                      value: currentPlan
                        ? `${currentPlan.durationMonths || 12} months`
                        : "—",
                    },
                    { label: "Purchased On", value: fmtDate(membership.startDate) },
                    { label: "Expires On", value: fmtDate(membership.expiryDate) },
                    ...(membership.discountPercent > 0
                      ? [{ label: "Member Discount", value: `${membership.discountPercent}% off treatments` }]
                      : []),
                  ].map(({ label, value }) => (
                    <Box
                      key={label}
                      sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
                    >
                      <Typography sx={{ color: "#666", fontSize: "13px" }}>{label}</Typography>
                      <Typography sx={{ fontWeight: 600, fontSize: "13px", textAlign: "right", ml: 2 }}>
                        {value}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Features & Benefits */}
                {(currentPlan?.features?.length > 0 || currentPlan?.benefits?.length > 0) && (
                  <Box sx={{ borderTop: "1px solid #e5e7eb", pt: 2, mt: 2 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: "14px", mb: 1.5 }}>
                      Benefits
                    </Typography>

                    {/* features[] is an array of strings */}
                    {currentPlan?.features?.map((f, i) => (
                      <Box key={`f-${i}`} sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1 }}>
                        <CheckCircleIcon fontSize="small" sx={{ color: "#059669", mt: "1px", flexShrink: 0 }} />
                        <Typography sx={{ fontSize: "13px", color: "#333" }}>{f}</Typography>
                      </Box>
                    ))}

                    {/* benefits[] is an array of objects — use .description */}
                    {currentPlan?.benefits?.map((b, i) => {
                      const text =
                        typeof b === "string"
                          ? b
                          : b?.description || b?.type || JSON.stringify(b);
                      return (
                        <Box key={`b-${i}`} sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1 }}>
                          <CheckCircleIcon fontSize="small" sx={{ color: "#059669", mt: "1px", flexShrink: 0 }} />
                          <Typography sx={{ fontSize: "13px", color: "#333" }}>{text}</Typography>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        /* No membership at all */
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ textAlign: "center", py: 5 }}>
            <CardMembershipIcon sx={{ fontSize: 72, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
              No Active Membership
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
            >
              You don't have a membership plan yet. Explore the options below to enjoy exclusive
              benefits and discounts on treatments.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* ── View All Plans Button ── */}
      <Box ref={plansRef} sx={{ textAlign: "center", mt: 4 }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => window.open("/membership-plans", "_blank")}
          sx={{
            backgroundColor: "#f59e0b",
            color: "#fff",
            fontWeight: 600,
            fontSize: "15px",
            textTransform: "none",
            borderRadius: "10px",
            px: 5,
            py: 1.5,
            "&:hover": { backgroundColor: "#d97706" },
          }}
           
        >
          View All Plans
        </Button>
      </Box>

    </Box>
  );
};

export default Membership;
