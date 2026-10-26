/**
 * Patient — Book Treatment
 *
 * Lists the clinic's treatment catalog and lets the logged-in patient pay
 * online (Razorpay) or book to pay at the clinic. Membership discounts are
 * shown here for transparency, but the backend re-computes price + discount
 * server-side on every order (the client amount is never trusted).
 */
import { useState } from "react";
import { CLINIC_NAME } from "../../constants/clinic.js";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Chip,
} from "@mui/material";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  getTreatmentCatalog,
  createTreatmentPaymentOrder,
  verifyTreatmentPayment,
  payTreatmentAtClinic,
} from "../../api/patient/treatments.api";
import { getMyMembership } from "../../api/patient/memberships.api";
import { useAuthStore } from "../../store/auth.store";
import { ONLINE_PAYMENTS_ENABLED } from "../../utils/paymentFlags";

const NAVY = "#0d1b4a";
const ACCENT = "#f57c00";
const ACCENT_DARK = "#e06c00";

const formatCurrency = (val) => `₹${Math.round(val || 0).toLocaleString("en-IN")}`;

/**
 * Calm, low-saturation accent per treatment category — a light tinted pill with
 * a darker dot/text of the same hue. Replaces the old all-orange look with
 * tasteful, consistent variety. Falls back to a neutral slate for unknown ones.
 */
const CATEGORY_STYLES = {
  preventive: { label: "Preventive", text: "#047857", bg: "#ecfdf5" },
  restorative: { label: "Restorative", text: "#b45309", bg: "#fffbeb" },
  endodontic: { label: "Endodontic", text: "#be123c", bg: "#fff1f2" },
  periodontic: { label: "Periodontic", text: "#0f766e", bg: "#f0fdfa" },
  prosthodontic: { label: "Prosthodontic", text: "#4338ca", bg: "#eef2ff" },
  orthodontic: { label: "Orthodontic", text: "#1d4ed8", bg: "#eff6ff" },
  surgical: { label: "Surgical", text: "#b91c1c", bg: "#fef2f2" },
  cosmetic: { label: "Cosmetic", text: "#a21caf", bg: "#fdf4ff" },
  pediatric: { label: "Pediatric", text: "#0e7490", bg: "#ecfeff" },
  other: { label: "General", text: "#475569", bg: "#f1f5f9" },
};

const categoryStyle = (category) =>
  CATEGORY_STYLES[category] || CATEGORY_STYLES.other;

/** Load the Razorpay checkout script once. */
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const BookTreatment = () => {
  const patient = useAuthStore((state) => state.patient);
  const queryClient = useQueryClient();

  // Which treatment is mid-action, and which action ("online" | "clinic")
  const [busy, setBusy] = useState({ id: null, action: null });

  const { data: catalogData, isLoading, error } = useQuery({
    queryKey: ["treatment-catalog"],
    queryFn: getTreatmentCatalog,
    staleTime: 5 * 60 * 1000,
  });

  const { data: membershipData } = useQuery({
    queryKey: ["patient", "membership", patient?._id],
    queryFn: () => getMyMembership(patient?._id),
    enabled: !!patient?._id,
    staleTime: 60 * 1000,
  });

  const treatments = catalogData?.data?.treatmentTypes || [];

  // Server-verified discount for this patient (0 when no active membership).
  const discountPercent = membershipData?.data?.hasMembership
    ? membershipData?.data?.currentDiscount || 0
    : 0;

  const priceFor = (treatment) => {
    const base = treatment.price || 0;
    const discounted =
      discountPercent > 0
        ? Math.max(1, Math.round(base * (1 - discountPercent / 100)))
        : base;
    return { base, discounted, hasDiscount: discountPercent > 0 && discounted < base };
  };

  const refreshPayments = () => {
    queryClient.invalidateQueries({ queryKey: ["patient", "payments"] });
  };

  // ---------- Pay Online (Razorpay) ----------
  const handlePayOnline = async (treatment) => {
    setBusy({ id: treatment._id, action: "online" });
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Could not load the payment gateway. Please try again.");
        return;
      }

      const orderResp = await createTreatmentPaymentOrder({
        treatmentId: treatment._id,
        type: "treatment",
      });
      const { order, paymentId, key_id } = orderResp.data;

      const rzp = new window.Razorpay({
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Dental Clinic",
        description: treatment.name,
        order_id: order.id,
        prefill: {
          name: patient?.name || "",
          contact: patient?.phone || "",
          email: patient?.email || undefined,
        },
        theme: { color: NAVY },
        handler: async (response) => {
          try {
            await verifyTreatmentPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentId,
            });
            toast.success("Payment successful! Your treatment has been booked.");
            refreshPayments();
          } catch (err) {
            toast.error(
              err.response?.data?.message || "Payment verification failed. Please contact us."
            );
          } finally {
            setBusy({ id: null, action: null });
          }
        },
        modal: {
          ondismiss: () => {
            setBusy({ id: null, action: null });
            toast.warning("Payment cancelled");
          },
        },
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not start payment. Please try again.");
      setBusy({ id: null, action: null });
    }
  };

  // ---------- Pay at Clinic (pending record) ----------
  const handlePayAtClinic = async (treatment) => {
    setBusy({ id: treatment._id, action: "clinic" });
    try {
      const resp = await payTreatmentAtClinic({ treatmentId: treatment._id });
      const amount = resp.data?.amount ?? priceFor(treatment).discounted;
      toast.success(`Treatment booked! Please pay ${formatCurrency(amount)} at the clinic.`);
      refreshPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not book the treatment. Please try again.");
    } finally {
      setBusy({ id: null, action: null });
    }
  };

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Book a Treatment
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Choose a treatment and pay online or reserve it to pay at the clinic.
        </Typography>
        {discountPercent > 0 && (
          <Chip
            color="warning"
            size="small"
            sx={{ mt: 1.5, fontWeight: 700 }}
            label={`Member discount applied: ${discountPercent}% off`}
          />
        )}
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
          Payments processed by {CLINIC_NAME}.
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }} color="text.secondary">
            Loading treatments...
          </Typography>
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography color="error">Failed to load treatments. Please try again.</Typography>
        </Box>
      ) : treatments.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <LocalHospitalIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No treatments available right now
          </Typography>
        </Box>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {treatments.map((treatment) => {
            const { base, discounted, hasDiscount } = priceFor(treatment);
            const isBusy = busy.id === treatment._id;
            const cat = categoryStyle(treatment.category);

            return (
              <div
                key={treatment._id}
                className="flex flex-col bg-white rounded-2xl border border-gray-200 p-5 transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
              >
                {/* Category indicator */}
                <div className="mb-3">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium"
                    style={{ backgroundColor: cat.bg, color: cat.text }}
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.text }}
                    />
                    {cat.label}
                  </span>
                </div>

                <h3
                  className="text-[18px] font-semibold leading-snug"
                  style={{ color: NAVY }}
                >
                  {treatment.name}
                </h3>

                <p className="text-[14px] text-gray-500 mt-2 leading-snug line-clamp-3 min-h-[60px]">
                  {treatment.description || "Professional dental care at Dental Clinic."}
                </p>

                {/* Price */}
                <div className="mt-3 mb-4 flex items-baseline gap-2 flex-wrap">
                  {hasDiscount && (
                    <span className="font-numbers text-gray-400 text-[15px] line-through">
                      {formatCurrency(base)}
                    </span>
                  )}
                  <span
                    className="font-numbers text-[24px] font-bold tracking-tight"
                    style={{ color: NAVY }}
                  >
                    {formatCurrency(discounted)}
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-auto flex flex-col gap-2">
                  {ONLINE_PAYMENTS_ENABLED && (
                    <Button
                      fullWidth
                      variant="contained"
                      disableElevation
                      disabled={isBusy}
                      onClick={() => handlePayOnline(treatment)}
                      sx={{
                        bgcolor: ACCENT,
                        textTransform: "none",
                        fontWeight: 600,
                        borderRadius: 1.5,
                        py: 1,
                        "&:hover": { bgcolor: ACCENT_DARK },
                      }}
                    >
                      {isBusy && busy.action === "online" ? (
                        <CircularProgress size={20} sx={{ color: "white" }} />
                      ) : (
                        `Pay online — ${formatCurrency(discounted)}`
                      )}
                    </Button>
                  )}
                  <Button
                    fullWidth
                    variant="outlined"
                    disabled={isBusy}
                    startIcon={
                      isBusy && busy.action === "clinic" ? null : (
                        <StorefrontIcon sx={{ fontSize: 18 }} />
                      )
                    }
                    onClick={() => handlePayAtClinic(treatment)}
                    sx={{
                      color: "#475569",
                      borderColor: "#d1d5db",
                      textTransform: "none",
                      fontWeight: 500,
                      borderRadius: 1.5,
                      py: 1,
                      "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" },
                    }}
                  >
                    {isBusy && busy.action === "clinic" ? (
                      <CircularProgress size={20} sx={{ color: "#475569" }} />
                    ) : (
                      "Pay at clinic"
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Box>
  );
};

export default BookTreatment;
