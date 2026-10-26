import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useAdminPaymentMutations } from "../../../hooks/admin/usePayments";
import PaymentMethodSelector from "../shared/PaymentMethodSelector";
import PaymentLinkDisplay from "../shared/PaymentLinkDisplay";

const fmt = (n) => (n || 0).toLocaleString("en-IN");

/**
 * CollectPaymentModal
 *
 * Post-hoc payment collection against an EXISTING invoice -- shared by every
 * "Collect" entry point in the admin panel (Billing page, Appointments row
 * action, AppointmentDetailModal, Payments page, and TreatmentPlanDetailModal's
 * per-session Collect). Single source of truth -- never duplicated.
 *
 * Cash/UPI behave exactly as before (immediate collection, modal closes on
 * success). Razorpay generates a real Payment Link for EXACTLY the amount
 * entered here (never the invoice's full/original total -- this may be a
 * partial or post-hoc collection against an invoice that already has
 * amountPaid > 0) via the same backend `generateRazorpayPaymentLink` used at
 * booking time. The link is fire-and-forget WhatsApp'd to the patient and
 * always shown with a manual copy fallback (PaymentLinkDisplay) -- the modal
 * stays open afterward so the admin can see/copy the link before closing.
 */
const CollectPaymentModal = ({ open, onClose, invoice, patient, onSuccess, appointmentId }) => {
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [mode, setMode] = useState("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [paymentLinkResult, setPaymentLinkResult] = useState(null);

  const { collectPayment, isCollecting } = useAdminPaymentMutations();

  // Pre-fill amount whenever a different invoice is opened
  useEffect(() => {
    if (open && invoice) {
      setAmount(String(invoice.balanceDue || ""));
      setAmountError("");
      setMode("cash");
      setReference("");
      setNotes("");
      setSubmitError("");
      setPaymentLinkResult(null);
    }
  }, [open, invoice?._id]);

  const handleAmountChange = (e) => {
    const val = e.target.value;
    setAmount(val);
    const num = Number(val);
    if (!val || num <= 0) {
      setAmountError("Amount must be greater than 0");
    } else if (invoice && num > (invoice.balanceDue || 0) + 0.01) {
      setAmountError(`Cannot exceed balance due ₹${fmt(invoice.balanceDue)}`);
    } else {
      setAmountError("");
    }
  };

  const handleSubmit = async () => {
    const num = Number(amount);
    if (!num || num <= 0) {
      setAmountError("Amount must be greater than 0");
      return;
    }
    if (invoice && num > (invoice.balanceDue || 0) + 0.01) {
      setAmountError(`Cannot exceed balance due ₹${fmt(invoice.balanceDue)}`);
      return;
    }
    setSubmitError("");
    try {
      const res = await collectPayment({
        invoiceId: invoice._id,
        amount: num,
        mode,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
        ...(appointmentId ? { appointmentId } : {}),
      });

      if (mode === "razorpay") {
        // Link generated (or generation failed) -- never "collected" yet, so
        // keep the modal open showing the link/error instead of closing.
        setPaymentLinkResult(res?.data?.paymentLink || { error: "Unknown error" });
        onSuccess?.(); // let the parent refetch invoice/payment state in the background
      } else {
        onSuccess?.(`₹${fmt(num)} collected for ${invoice.invoiceNumber}`);
        onClose();
      }
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message || "Failed to collect payment. Please try again."
      );
    }
  };

  const canSubmit =
    invoice &&
    amount &&
    Number(amount) > 0 &&
    !amountError &&
    !isCollecting &&
    !paymentLinkResult;

  if (!invoice) return null;

  return (
    <Dialog open={open} onClose={!isCollecting ? onClose : undefined} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}
      >
        <Typography variant="h6" component="span" fontWeight={700}>
          Collect Payment
        </Typography>
        <IconButton onClick={onClose} size="small" disabled={isCollecting}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1.5 }}>
        {/* Invoice info box */}
        <Box
          sx={{
            bgcolor: "#f3f4f6",
            borderRadius: 1.5,
            px: 2,
            py: 1.5,
            mb: 2.5,
          }}
        >
          <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
            {invoice.invoiceNumber}
            {invoice.category ? (
              <Box
                component="span"
                sx={{
                  ml: 1,
                  px: 0.75,
                  py: 0.25,
                  bgcolor: "#e0e7ff",
                  color: "#3730a3",
                  borderRadius: "4px",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {invoice.category}
              </Box>
            ) : null}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {patient?.name || "—"}{patient?.phone ? ` — ${patient.phone}` : ""}
          </Typography>
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                ₹{fmt(invoice.totalAmount ?? invoice.grandTotal)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Paid
              </Typography>
              <Typography variant="body2" fontWeight={600} sx={{ color: "#16a34a" }}>
                ₹{fmt(invoice.amountPaid)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Balance Due
              </Typography>
              <Typography variant="body2" fontWeight={700} sx={{ color: "#dc2626", fontSize: 15 }}>
                ₹{fmt(invoice.balanceDue)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {!paymentLinkResult && (
          <>
            {/* Amount */}
            <TextField
              label="Amount (₹) *"
              type="number"
              fullWidth
              size="small"
              value={amount}
              onChange={handleAmountChange}
              error={!!amountError}
              disabled={isCollecting}
              helperText={
                amountError ||
                `Balance due: ₹${fmt(invoice.balanceDue)} — enter full or partial amount`
              }
              inputProps={{ min: 1, step: 1 }}
              sx={{ mb: 2 }}
            />

            {/* Payment Method */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: "#6b7280", display: "block", mb: 0.5 }}>
                Payment Method
              </Typography>
              <PaymentMethodSelector value={mode} onChange={setMode} disabled={isCollecting} />
            </Box>

            {mode === "razorpay" ? (
              <Typography variant="caption" sx={{ display: "block", color: "#2563eb", mb: 2 }}>
                A Razorpay payment link will be generated for this exact amount and sent via
                WhatsApp — payment is collected later by the patient, not now.
              </Typography>
            ) : (
              /* Reference (UPI) */
              mode === "upi" && (
                <TextField
                  label="Reference / Transaction ID"
                  fullWidth
                  size="small"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. TXN123456"
                  disabled={isCollecting}
                  sx={{ mb: 2 }}
                />
              )
            )}

            {/* Notes */}
            <TextField
              label="Notes (optional)"
              fullWidth
              size="small"
              multiline
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isCollecting}
              sx={{ mb: submitError ? 2 : 0 }}
            />
          </>
        )}

        {paymentLinkResult && (
          <PaymentLinkDisplay
            shortUrl={paymentLinkResult.shortUrl}
            whatsappSent={paymentLinkResult.whatsappSent}
            error={paymentLinkResult.error}
          />
        )}

        {submitError && <Alert severity="error" sx={{ mt: 2 }}>{submitError}</Alert>}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        {paymentLinkResult ? (
          <Button variant="contained" onClick={onClose}>
            Done
          </Button>
        ) : (
          <>
            <Button variant="outlined" color="inherit" onClick={onClose} disabled={isCollecting}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!canSubmit}
              startIcon={isCollecting ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{
                bgcolor: "#f59e0b",
                color: "#fff",
                fontWeight: 700,
                "&:hover": { bgcolor: "#d97706" },
                "&:disabled": { bgcolor: "#fcd34d", color: "#fff" },
              }}
            >
              {isCollecting
                ? "Processing…"
                : mode === "razorpay"
                ? "Generate Payment Link"
                : `Collect ₹${amount && Number(amount) > 0 ? fmt(Number(amount)) : fmt(invoice.balanceDue)}`}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CollectPaymentModal;
