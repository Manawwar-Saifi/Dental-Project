/**
 * Public Plan Detail Page
 *
 * Shows full membership plan details with features, benefits, and buy button.
 * URL: /membership-plans/:id
 */
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  MenuItem,
  Alert,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import Grid from "@mui/material/Grid";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { filterName, NAME_PLACEHOLDER } from "../../utils/nameInput";
import { toast } from "react-toastify";
import api from "../../api/axios";
import BreadcrumbBanner from "../../components/public/BreadcrumbBanner";
import { ONLINE_PAYMENTS_ENABLED } from "../../utils/paymentFlags";
import { useAuthStore } from "../../store/auth.store";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import StarIcon from "@mui/icons-material/Star";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import DiscountIcon from "@mui/icons-material/Discount";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import GroupsIcon from "@mui/icons-material/Groups";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const tierColors = {
  silver: { bg: "#e3f2fd", accent: "#1565c0", badge: "#1976d2", gradient: "linear-gradient(135deg, #42a5f5, #1565c0)" },
  gold: { bg: "#fff8e1", accent: "#f57f17", badge: "#ffc107", gradient: "linear-gradient(135deg, #ffd54f, #ff8f00)" },
  platinum: { bg: "#e8eaf6", accent: "#1a237e", badge: "#3f51b5", gradient: "linear-gradient(135deg, #7986cb, #283593)" },
};

// Plan images from public folder
const planImages = {
  "individual silver": "/student-dental-plan.jpg",
  "individual gold": "/women-dental-plan.jpeg",
  "individual platinum": "/implant-post-care.webp",
  "family silver": "/oral-hygiene-kids.jpg",
  "family gold": "/oral-hygiene-adults.jpg",
  "family platinum": "/family-dental-plan.jpg",
};

const getPlanImage = (plan) => {
  const key = plan?.name?.toLowerCase();
  return planImages[key] || "/implant-post-care.webp";
};

const PlanDetailPage = () => {
  const { id: slug } = useParams();
  const location = window.location;
  const patient = useAuthStore((state) => state.patient);
  const isLoggedIn = useAuthStore((state) => state.isAuthenticated);

  const [buyDialog, setBuyDialog] = useState(false);
  const [buyForm, setBuyForm] = useState({ name: "", phone: "", email: "", gender: "", dateOfBirth: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);

  // Prefill form if logged in
  useEffect(() => {
    if (isLoggedIn && patient) {
      setBuyForm({
        name: patient.name || "",
        phone: patient.phone || "",
        email: patient.email || "",
        gender: patient.gender || "",
        dateOfBirth: patient.dateOfBirth || "",
      });
      setIsNewUser(false);
    }
  }, [isLoggedIn, patient]);

  // Fetch all plans and find by slug
  const { data, isLoading } = useQuery({
    queryKey: ["public", "membership-plans"],
    queryFn: () => api.get("/memberships/plans").then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const allPlans = data?.data?.plans || data?.data || [];
  const plan = allPlans.find(
    (p) => p.name?.toLowerCase().replace(/\s+/g, "-") === slug
  ) || allPlans.find((p) => p._id === slug);
  const colors = tierColors[plan?.tier] || tierColors.silver;
  const image = getPlanImage(plan);

  const handlePurchase = async () => {
    if (!buyForm.name.trim() || !buyForm.phone.trim() || !buyForm.email.trim()) {
      toast.info("Please fill in all fields");
      return;
    }
    if (!/^\d{10}$/.test(buyForm.phone.replace(/\D/g, ""))) {
      toast.info("Please enter a valid 10-digit phone number");
      return;
    }

    setIsProcessing(true);
    try {
      // Load Razorpay script if not loaded
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve(true);
          script.onerror = () => reject(new Error("Failed to load Razorpay"));
          document.body.appendChild(script);
        });
      }

      const orderRes = await api.post("/payments/razorpay/create-order", {
        planId: plan._id,
        type: "membership",
        isOnlineBooking: true,
      });

      const { order, paymentId, key_id } = orderRes.data.data;

      const rzp = new window.Razorpay({
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Dental Clinic",
        description: `${plan.name} Membership`,
        order_id: order.id,
        prefill: { name: buyForm.name, contact: buyForm.phone, email: buyForm.email },
        theme: { color: "#006694" },
        handler: async (response) => {
          try {
            await api.post("/payments/razorpay/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentId,
            });

            await api.post("/memberships/purchase", {
              planId: plan._id,
              paymentId,
              name: buyForm.name,
              phone: buyForm.phone,
              email: buyForm.email,
            });

            toast.success("Membership purchased successfully! Check your email for login details.");
            setBuyDialog(false);
          } catch (err) {
            toast.error(err.response?.data?.message || "Payment verification failed");
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.warning("Payment cancelled");
          },
        },
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate payment");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <BreadcrumbBanner title="Plan Details" breadcrumbs={[{ label: "Home", path: "/" }, { label: "Plans", path: "/membership-plans" }, { label: "Loading..." }]} />
        <Box sx={{ textAlign: "center", py: 10 }}><CircularProgress /></Box>
      </>
    );
  }

  if (!plan) {
    return (
      <>
        <title>Plan Not Found | Dental Clinic</title>
        <meta name="robots" content="noindex, follow" />
        <BreadcrumbBanner title="Plan Not Found" breadcrumbs={[{ label: "Home", path: "/" }, { label: "Plans", path: "/membership-plans" }]} />
        <Container maxWidth="md" sx={{ py: 10, textAlign: "center" }}>
          <Typography variant="h5" component="p" color="text.secondary">Plan not found</Typography>
          <Button component={Link} to="/membership-plans" startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
            Back to Plans
          </Button>
        </Container>
      </>
    );
  }

  const planSlug = plan.name?.toLowerCase().replace(/\s+/g, "-");
  const canonicalUrl = `https://dentalclinic.example.com/membership-plans/${planSlug}`;
  const metaTitle = `${plan.name} Membership Plan | Dental Clinic, Sonipat`;
  const metaDescription = (
    plan.description ||
    `${plan.name} dental membership plan at Dental Clinic, Sonipat — ₹${plan.price?.toLocaleString("en-IN")}, ${plan.discountPercentage || plan.discountPercent || 0}% treatment discount, ${plan.validityMonths || 12} months validity.`
  ).slice(0, 160);

  return (
    <>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={`${plan.name} plan Sonipat, dental membership Sonipat, Dental Clinic plans`} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content="index, follow" />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={`https://dentalclinic.example.com${image}`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={`https://dentalclinic.example.com${image}`} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: `${plan.name} Membership Plan`,
            description: metaDescription,
            image: `https://dentalclinic.example.com${image}`,
            url: canonicalUrl,
            brand: { "@type": "Organization", name: "Dental Clinic" },
            offers: {
              "@type": "Offer",
              price: plan.price,
              priceCurrency: "INR",
              availability: "https://schema.org/InStock",
              url: canonicalUrl,
            },
          }),
        }}
      />
      <BreadcrumbBanner
        title={plan.name}
        breadcrumbs={[{ label: "Home", path: "/" }, { label: "Plans", path: "/membership-plans" }, { label: plan.name }]}
      />

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          {/* Left Sidebar */}
          <Grid size={{ xs: 12, md: 4 }}>
            {/* Plan Name Card */}
            <Card sx={{ borderRadius: 3, mb: 3, background: colors.gradient, color: "#fff" }}>
              <CardContent sx={{ p: 3 }}>
                <Box className="flex items-center gap-2 mb-2">
                  <CardMembershipIcon />
                  <Chip label={plan.tier?.toUpperCase()} size="small" sx={{ bgcolor: "rgba(255,255,255,0.25)", color: "#fff", fontWeight: 700 }} />
                </Box>
                <Typography variant="h5" component="p" fontWeight={800} sx={{ textTransform: "uppercase" }}>
                  {plan.name}
                </Typography>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent>
                <Box className="flex items-center gap-2 mb-2">
                  <DiscountIcon sx={{ color: colors.badge }} />
                  <Typography variant="body1" fontWeight={600}>
                    {plan.discountPercentage || plan.discountPercent || 0}% Discount
                  </Typography>
                </Box>
                <Box className="flex items-center gap-2 mb-2">
                  <CalendarMonthIcon sx={{ color: colors.badge }} />
                  <Typography variant="body1" fontWeight={600}>
                    {plan.validityMonths || 12} Months Validity
                  </Typography>
                </Box>
                <Box className="flex items-center gap-2">
                  <GroupsIcon sx={{ color: colors.badge }} />
                  <Typography variant="body1" fontWeight={600}>
                    {plan.type === "family" ? "Family Plan" : "Individual Plan"}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Terms Link */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Terms & Conditions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Membership is non-transferable. Benefits apply to registered member only.
                  Valid at all Dental Clinic locations. Cannot be combined with other offers.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Content */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ borderRadius: 4, border: "2px dashed #d4a017", boxShadow: "0 4px 20px rgba(212,160,23,0.15)" }}>
              <CardContent sx={{ p: 4 }}>
                {/* Plan Image */}
                <Box
                  component="img"
                  src={image}
                  alt={plan.name}
                  loading="lazy"
                  sx={{
                    width: 220,
                    height: 170,
                    objectFit: "cover",
                    borderRadius: 2,
                    mb: 3,
                    boxShadow: 2,
                  }}
                />

                {/* Plan Title & Price */}
                <Typography variant="h4" component="h2" fontWeight={800} color="#003366" sx={{ textTransform: "uppercase", mb: 1 }}>
                  {plan.name}
                </Typography>

                <Typography variant="h5" component="p" fontWeight={700} sx={{ mb: 3 }}>
                  <span style={{ fontWeight: 400 }}>Fees→</span>{" "}
                  <span className="font-numbers">₹{plan.price?.toLocaleString("en-IN")}</span>
                </Typography>

                {/* Description */}
                {plan.description && (
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
                    {plan.description}
                  </Typography>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Features */}
                {plan.features?.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" component="h3" fontWeight={700} color="#003366" gutterBottom>
                      Our {plan.name} includes:
                    </Typography>
                    <List disablePadding>
                      {plan.features.map((feature, i) => (
                        <ListItem key={i} disableGutters sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircleIcon sx={{ color: colors.badge, fontSize: 20 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={feature}
                            primaryTypographyProps={{ fontSize: "1rem" }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Benefits */}
                {plan.benefits?.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" component="h3" fontWeight={700} color="#003366" gutterBottom>
                      Benefits
                    </Typography>
                    <List disablePadding>
                      {plan.benefits.map((benefit, i) => (
                        <ListItem key={i} disableGutters sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <StarIcon sx={{ color: colors.badge, fontSize: 20 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={benefit.description}
                            secondary={benefit.discountPercentage ? `${benefit.discountPercentage}% discount` : null}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

              </CardContent>
            </Card>

            {/* Buy Button — centered below card. Online purchase requires
                Razorpay; when disabled, purchases aren't available online
                (no server-side payment verification exists to safely
                create an "unpaid" membership record instead). */}
            <Box sx={{ textAlign: "center", mt: 3 }}>
              {ONLINE_PAYMENTS_ENABLED ? (
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => {
                    setBuyDialog(true);
                    if (isLoggedIn && patient) {
                      setBuyForm({ name: patient.name || "", phone: patient.phone || "", email: patient.email || "", gender: patient.gender || "", dateOfBirth: patient.dateOfBirth || "" });
                      setIsNewUser(false);
                    } else {
                      setBuyForm({ name: "", phone: "", email: "", gender: "", dateOfBirth: "" });
                      setIsNewUser(true);
                    }
                  }}
                  sx={{
                      bgcolor: "#006694",
                      borderRadius: 5,
                      py: 1.5,
                      px: 5,
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      "&:hover": { bgcolor: "#005580" },
                  }}
                >
                  Buy Now - <span className="font-numbers">₹{plan.price?.toLocaleString("en-IN")}</span>
                </Button>
              ) : (
                <Typography variant="body2" sx={{ color: "text.secondary", border: "1px solid #e0e0e0", borderRadius: 3, py: 1.5, px: 3, display: "inline-block" }}>
                  Online purchase is temporarily unavailable. Please visit the clinic to purchase this plan.
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Buy Dialog */}
      <Dialog open={buyDialog} onClose={() => !isProcessing && setBuyDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: "#003366" }}>
          Purchase {plan?.name}
          <Typography variant="body2" color="text.secondary">
            <span className="font-numbers">₹{plan?.price?.toLocaleString("en-IN")}</span> — {plan?.tier} plan
          </Typography>
        </DialogTitle>
        <DialogContent>
          {/* Logged in user — show prefilled info */}
          {isLoggedIn && !isNewUser ? (
            <Box sx={{ mt: 1 }}>
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                Logged in as <strong>{patient?.name}</strong> ({patient?.phone})
              </Alert>
              <Box sx={{ bgcolor: "#f5f5f5", borderRadius: 2, p: 2 }}>
                <Typography variant="body2"><strong>Name:</strong> {buyForm.name}</Typography>
                <Typography variant="body2"><strong>Phone:</strong> {buyForm.phone}</Typography>
                <Typography variant="body2"><strong>Email:</strong> {buyForm.email || "—"}</Typography>
              </Box>
            </Box>
          ) : (
            /* Not logged in — collect full details */
            <Box sx={{ mt: 1 }}>
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color: "#006694", fontWeight: 700 }}>
                  Login first
                </Link>{" "}
                to auto-fill your details.
              </Alert>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  fullWidth size="small" required
                  label="Full Name"
                  placeholder={NAME_PLACEHOLDER}
                  value={buyForm.name}
                  onChange={(e) => setBuyForm((p) => ({ ...p, name: filterName(e.target.value) }))}
                />
                <TextField
                  fullWidth size="small" required
                  label="Phone Number"
                  value={buyForm.phone}
                  onChange={(e) => setBuyForm((p) => ({ ...p, phone: e.target.value }))}
                  inputProps={{ maxLength: 10 }}
                />
                <TextField
                  fullWidth size="small" required
                  label="Email"
                  type="email"
                  value={buyForm.email}
                  onChange={(e) => setBuyForm((p) => ({ ...p, email: e.target.value }))}
                  helperText="Login credentials will be sent to this email"
                />
                <TextField
                  fullWidth size="small" select
                  label="Gender"
                  value={buyForm.gender}
                  onChange={(e) => setBuyForm((p) => ({ ...p, gender: e.target.value }))}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
                <TextField
                  fullWidth size="small"
                  label="Date of Birth"
                  type="date"
                  value={buyForm.dateOfBirth}
                  onChange={(e) => setBuyForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setBuyDialog(false)} disabled={isProcessing} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePurchase}
            disabled={isProcessing}
            sx={{ bgcolor: "#006694", borderRadius: 5, px: 4, "&:hover": { bgcolor: "#005580" } }}
            startIcon={isProcessing ? <CircularProgress size={16} color="inherit" /> : <ShoppingCartIcon />}
          >
            {isProcessing ? "Processing..." : <span>Pay <span className="font-numbers">₹{plan?.price?.toLocaleString("en-IN")}</span></span>}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PlanDetailPage;
