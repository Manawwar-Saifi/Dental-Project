/**
 * Membership Plans Page (PROTECTED - Login Required)
 *
 * Patient can view and purchase membership plans using Razorpay.
 * Requires authentication - redirects to login if not logged in.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Skeleton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { toast } from "react-toastify";
import Grid from "@mui/material/Grid";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import PaymentIcon from "@mui/icons-material/Payment";
import CelebrationIcon from "@mui/icons-material/Celebration";
import { useMembershipPlans, usePurchaseMembership } from "../../hooks/patient/useMemberships";
import { useAuthStore } from "../../store/auth.store";
import {
  createMembershipPaymentOrder,
  verifyMembershipPayment,
} from "../../api/patient/memberships.api";
import { getClinics } from "../../api/patient/appointments.api";

/**
 * Format currency
 */
const formatCurrency = (amount) => {
  return `₹${(amount || 0).toLocaleString("en-IN")}`;
};

/**
 * Get icon for plan type
 */
const getPlanIcon = (planName) => {
  const name = planName?.toLowerCase() || "";
  if (name.includes("family")) return <FamilyRestroomIcon />;
  if (name.includes("women")) return <PersonIcon />;
  if (name.includes("student")) return <SchoolIcon />;
  if (name.includes("implant")) return <LocalHospitalIcon />;
  if (name.includes("kit")) return <ShoppingBagIcon />;
  return <CardMembershipIcon />;
};

/**
 * Get color for plan type
 */
const getPlanColor = (planName) => {
  const name = planName?.toLowerCase() || "";
  if (name.includes("family")) return "purple";
  if (name.includes("women")) return "pink";
  if (name.includes("student")) return "blue";
  if (name.includes("implant")) return "teal";
  if (name.includes("kit")) return "orange";
  return "green";
};

/**
 * Load Razorpay script
 */
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Membership Plan Card with Buy Button
 */
const PlanCard = ({ plan, onBuy, isBuying, hasMembership }) => {
  const color = getPlanColor(plan.name);
  const colorClasses = {
    purple: "from-purple-500 to-purple-600",
    pink: "from-pink-500 to-pink-600",
    blue: "from-blue-500 to-blue-600",
    teal: "from-teal-500 to-teal-600",
    orange: "from-orange-500 to-orange-600",
    green: "from-green-500 to-green-600",
  };

  return (
    <Card className="h-full overflow-hidden" elevation={2}>
      {/* Header */}
      <Box className={`bg-linear-to-r ${colorClasses[color]} p-4 text-white`}>
        <Box className="flex items-center gap-2 mb-2">
          {getPlanIcon(plan.name)}
          <Typography variant="h6" className="font-bold">
            {plan.name}
          </Typography>
        </Box>
        <Typography variant="h4" className="font-bold">
          <span className="font-numbers">{formatCurrency(plan.price)}</span>
          <Typography component="span" variant="body2" className="opacity-80 ml-1">
            / {plan.durationMonths || 12} months
          </Typography>
        </Typography>
      </Box>

      {/* Features */}
      <CardContent className="p-4">
        {plan.description && (
          <Typography variant="body2" color="text.secondary" className="mb-3">
            {plan.description}
          </Typography>
        )}

        {plan.features && plan.features.length > 0 && (
          <Box className="space-y-2 mb-4">
            {plan.features.map((feature, idx) => (
              <Box key={idx} className="flex items-start gap-2">
                <CheckCircleIcon className="text-green-500 mt-0.5" fontSize="small" />
                <Typography variant="body2">{feature}</Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Discounts */}
        {plan.discountPercentage > 0 && (
          <Box className="bg-amber-50 rounded-lg p-3 mb-4">
            <Typography variant="caption" className="font-semibold text-amber-700">
              Member Benefits:
            </Typography>
            <Box className="flex flex-wrap gap-2 mt-1">
              <Chip
                size="small"
                label={`${plan.discountPercentage}% off treatments`}
                color="warning"
                variant="outlined"
              />
            </Box>
          </Box>
        )}

        {/* Buy Button */}
        <Button
          fullWidth
          variant="contained"
          startIcon={isBuying ? <CircularProgress size={16} color="inherit" /> : <PaymentIcon />}
          onClick={() => onBuy(plan)}
          disabled={isBuying || hasMembership}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {isBuying ? "Processing..." : hasMembership ? "Already a Member" : "Buy Now"}
        </Button>

        {hasMembership && (
          <Typography variant="caption" color="text.secondary" className="block text-center mt-2">
            You already have an active membership
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

const MembershipPlans = () => {
  const navigate = useNavigate();
  const { patient, isAuthenticated, updatePatient } = useAuthStore();
  const { data: plansData, isLoading: plansLoading } = useMembershipPlans();
  const purchaseMutation = usePurchaseMembership();
  const plans = plansData?.data?.plans || [];

  const [buyingPlanId, setBuyingPlanId] = useState(null);
  const [successDialog, setSuccessDialog] = useState(false);
  const [purchasedPlan, setPurchasedPlan] = useState(null);
  const [defaultClinic, setDefaultClinic] = useState(null);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/membership-plans", message: "Please login to purchase a membership plan" } });
    }
  }, [isAuthenticated, navigate]);

  // Fetch default clinic for payment
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const response = await getClinics();
        if (response?.data?.clinics?.length > 0) {
          setDefaultClinic(response.data.clinics[0]._id);
        }
      } catch (err) {
        console.error("Failed to fetch clinics:", err);
      }
    };
    fetchClinics();
  }, []);

  // Check if patient has active membership
  const hasMembership = patient?.membership?.status === "active" &&
    new Date(patient?.membership?.expiryDate) > new Date();

  /**
   * Handle Buy button click
   */
  const handleBuy = async (plan) => {
    if (!isAuthenticated || !patient) {
      navigate("/login", { state: { from: "/membership-plans" } });
      return;
    }

    if (hasMembership) {
      toast.error("You already have an active membership. Please wait for it to expire.");
      return;
    }

    setBuyingPlanId(plan._id);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load payment gateway. Please try again.");
        setBuyingPlanId(null);
        return;
      }

      // Create Razorpay order
      const orderResponse = await createMembershipPaymentOrder({
        planId: plan._id,
        clinic: defaultClinic || patient?.preferredClinic,
        type: "membership",
        patient: patient._id,
      });

      const { order, paymentId, key_id } = orderResponse.data;

      // Open Razorpay checkout
      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Dental Clinic",
        description: `Membership: ${plan.name}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            // Verify payment
            await verifyMembershipPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentId,
            });

            // Purchase membership
            const purchaseResult = await purchaseMutation.mutateAsync({
              planId: plan._id,
              paymentId,
            });

            // Update patient in store
            if (purchaseResult?.data?.patient) {
              updatePatient(purchaseResult.data.patient);
            }

            // Show success
            setPurchasedPlan(plan);
            setSuccessDialog(true);
          } catch (err) {
            toast.error(err.response?.data?.message || "Payment verification failed. Please contact support.");
          } finally {
            setBuyingPlanId(null);
          }
        },
        prefill: {
          name: patient?.name || "",
          email: patient?.email || "",
          contact: patient?.phone || "",
        },
        theme: {
          color: "#0D9488",
        },
        modal: {
          ondismiss: function () {
            setBuyingPlanId(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response) {
        toast.error(`Payment failed: ${response.error.description}`);
        setBuyingPlanId(null);
      });
      razorpay.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate payment. Please try again.");
      setBuyingPlanId(null);
    }
  };

  /**
   * Handle success dialog close
   */
  const handleSuccessClose = () => {
    setSuccessDialog(false);
    setPurchasedPlan(null);
    navigate("/membership");
  };

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Box>
      {/* Page Header */}
      <Box className="mb-6">
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Membership Plans
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Choose a plan and enjoy exclusive member benefits
        </Typography>
      </Box>

      {/* Current Membership Alert */}
      {hasMembership && (
        <Alert severity="info" className="mb-4">
          You have an active <strong>{patient?.membership?.planName}</strong> membership valid until{" "}
          <strong>{new Date(patient?.membership?.expiryDate).toLocaleDateString()}</strong>.
          You cannot purchase another plan until it expires.
        </Alert>
      )}

      {/* Plans Grid */}
      {plansLoading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Skeleton variant="rectangular" height={400} className="rounded-lg" />
            </Grid>
          ))}
        </Grid>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <CardMembershipIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No plans available
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Contact the clinic for membership information
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {plans.map((plan) => (
            <Grid key={plan._id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <PlanCard
                plan={plan}
                onBuy={handleBuy}
                isBuying={buyingPlanId === plan._id}
                hasMembership={hasMembership}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Success Dialog */}
      <Dialog open={successDialog} onClose={handleSuccessClose} maxWidth="sm" fullWidth>
        <DialogTitle className="text-center">
          <CelebrationIcon sx={{ fontSize: 48, color: "success.main", mb: 1 }} />
          <Typography variant="h5" fontWeight="bold" color="success.main">
            Membership Purchased!
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box className="text-center py-4">
            <Typography variant="body1" gutterBottom>
              Congratulations! You are now a <strong>{purchasedPlan?.name}</strong> member.
            </Typography>
            <Typography variant="body2" color="text.secondary" className="mt-2">
              Enjoy {purchasedPlan?.discountPercentage}% discount on all treatments for the next{" "}
              {purchasedPlan?.durationMonths || 12} months.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions className="justify-center pb-4">
          <Button
            variant="contained"
            onClick={handleSuccessClose}
            className="bg-teal-600 hover:bg-teal-700"
          >
            View My Membership
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MembershipPlans;
