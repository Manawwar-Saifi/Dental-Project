/**
 * Payment Detail Modal
 *
 * Displays complete payment information with refund option.
 */
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  IconButton,
  TextField,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import PaymentIcon from "@mui/icons-material/Payment";
import PersonIcon from "@mui/icons-material/Person";
import ReceiptIcon from "@mui/icons-material/Receipt";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteIcon from "@mui/icons-material/Delete";
import UndoIcon from "@mui/icons-material/Undo";
import { toast } from "react-toastify";
import { usePaymentMutations, useAdminPaymentMutations } from "../../../hooks/admin/usePayments";
import { usePermissions } from "../../../hooks/admin/usePermissions";
import ConfirmDialog from "../../common/ConfirmDialog";

/**
 * Format date
 */
const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format currency
 */
const formatCurrency = (amount) => {
  return `₹${(amount || 0).toLocaleString("en-IN")}`;
};

/**
 * Info row component
 */
const InfoRow = ({ label, value, highlight = false }) => (
  <Box className="flex justify-between items-center py-0.5">
    <Typography variant="caption" className="text-gray-500">{label}</Typography>
    <Typography variant="caption" className={`font-medium ${highlight ? "text-green-600" : ""}`}>
      {value || "-"}
    </Typography>
  </Box>
);

/**
 * Status colors
 */
const statusColors = {
  pending: "warning",
  paid: "success",
  failed: "error",
  refunded: "info",
  cancelled: "default",
};

/**
 * Payment mode labels
 */
const paymentModeLabels = {
  cash: "Cash",
  card: "Card",
  upi: "UPI",
  razorpay: "Razorpay",
  netbanking: "Net Banking",
  other: "Other",
};

/**
 * Payment type labels
 */
const paymentTypeLabels = {
  opd_fee: "Appointment Fee",
  consultation: "Consultation",
  treatment: "Treatment",
  test: "Test/Investigation",
  invoice_payment: "Invoice Payment",
  advance: "Advance Payment",
  membership: "Membership",
  refund: "Refund",
  other: "Other",
};

const REFUND_WINDOW_DAYS = 365;

const PaymentDetailModal = ({ open, onClose, payment, onRefund, onDelete, initialRefundAmount }) => {
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundAmountError, setRefundAmountError] = useState("");
  const [refundAmountWarning, setRefundAmountWarning] = useState("");
  const [showReverseForm, setShowReverseForm] = useState(false);
  const [reverseReason, setReverseReason] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [manualConfirmPending, setManualConfirmPending] = useState(null);
  const [manualMethod, setManualMethod] = useState("cash");

  const { processRefund, isRefunding, deletePayment, isDeleting, confirmManualRefund, isConfirmingManual } = usePaymentMutations();
  const { reversePayment, isReversing } = useAdminPaymentMutations();
  // Hooks must run unconditionally on every render -- this was previously
  // called after the `if (!payment) return null` early return below, so it
  // only ran once `payment` became truthy, changing the hook count between
  // renders (React error #310, "Rendered more hooks than during the
  // previous render"). usePermissions() itself calls useAdminStore (Zustand)
  // and useQuery (React Query), several hooks at once, so the mismatch was
  // immediate as soon as the modal opened with `payment` initially unset.
  const { hasPermission } = usePermissions();

  const handleRefundAmountChange = (e) => {
    const val = e.target.value;
    setRefundAmount(val);
    if (val === "") {
      setRefundAmountError("");
      setRefundAmountWarning("");
      return;
    }
    const n = Number(val);
    if (isNaN(n) || n <= 0) {
      setRefundAmountError("Refund amount must be greater than ₹0");
      setRefundAmountWarning("");
    } else if (n > payment.amount && !isClosedTreatmentPayment) {
      // Non-treatment payments keep the original hard cap — only completed
      // treatments (within the refund window) get the goodwill-refund allowance.
      setRefundAmountError(
        `Cannot exceed the paid amount of ${formatCurrency(payment.amount)}`
      );
      setRefundAmountWarning("");
    } else if (n > payment.amount) {
      // Sunny's explicit choice: allow, don't block — just flag it.
      setRefundAmountError("");
      setRefundAmountWarning(
        `Note: this exceeds the amount actually collected (${formatCurrency(payment.amount)}). Confirm this is an intentional goodwill/compensation refund.`
      );
    } else {
      setRefundAmountError("");
      setRefundAmountWarning("");
    }
  };

  // Item 6 connector: when a caller (Edit Treatment's overpaid banner) opens
  // this modal already knowing the exact amount to refund, jump straight
  // into a pre-filled refund form (running it through the same validation as
  // manual input) instead of making the admin re-derive and re-type the same
  // number. Purely additive -- every other caller omits this prop and
  // behaves exactly as before.
  useEffect(() => {
    if (open && payment && initialRefundAmount > 0) {
      setShowRefundForm(true);
      handleRefundAmountChange({ target: { value: String(initialRefundAmount) } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payment?._id, initialRefundAmount]);

  const handleRefund = () => {
    if (!refundReason.trim()) {
      toast.error("Please provide a reason for refund");
      return;
    }
    // Inline validation already blocks submission via disabled button;
    // this is a defensive guard in case the button state is stale.
    if (refundAmountError) return;
    const amount = refundAmount ? Number(refundAmount) : payment.amount;
    processRefund(
      { id: payment._id, data: { amount, reason: refundReason } },
      {
        onSuccess: () => {
          setShowRefundForm(false);
          setRefundReason("");
          setRefundAmount("");
          setRefundAmountError("");
          onRefund?.();
          onClose();
        },
        onError: (err) => {
          const responseData = err.response?.data;
          if (responseData?.code === "RAZORPAY_API_FAILED" && responseData?.canConfirmManual) {
            setShowRefundForm(false);
            setManualConfirmPending({
              paymentId: responseData.paymentId,
              amount: refundAmount ? Number(refundAmount) : payment.amount,
              reason: refundReason,
            });
            toast.warning("Razorpay refund failed — refund is marked pending. Confirm manual refund to complete.");
          } else {
            toast.error(responseData?.message || "Failed to process refund");
          }
        },
      }
    );
  };

  const handleReverse = async () => {
    if (!reverseReason.trim()) {
      toast.error("Please provide a reason for reversal");
      return;
    }
    try {
      await reversePayment({ paymentId: payment._id, reason: reverseReason.trim() });
      setShowReverseForm(false);
      setReverseReason("");
      onRefund?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reverse payment");
    }
  };

  const handleConfirmManualRefund = () => {
    confirmManualRefund(
      { id: manualConfirmPending.paymentId, data: { manualMethod } },
      {
        onSuccess: () => {
          setManualConfirmPending(null);
          setShowRefundForm(false);
          setRefundReason("");
          setRefundAmount("");
          setManualMethod("cash");
          onRefund?.();
          onClose();
          toast.success("Refund confirmed as manually processed");
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || "Failed to confirm manual refund");
        },
      }
    );
  };

  const handleDelete = () => {
    if (isDeleting) return;
    setDeleteConfirmOpen(true);
  };

  const doDelete = () => {
    setDeleteConfirmOpen(false);
    deletePayment(payment._id, {
      onSuccess: () => {
        toast.success("Deleted successfully");
        onDelete?.();
        onClose();
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Failed to delete payment");
      },
    });
  };

  const handleClose = () => {
    if (!isRefunding && !isReversing && !isConfirmingManual) {
      setShowRefundForm(false);
      setRefundReason("");
      setRefundAmount("");
      setRefundAmountError("");
      setShowReverseForm(false);
      setReverseReason("");
      setManualConfirmPending(null);
      setManualMethod("cash");
      onClose();
    }
  };

  if (!payment) return null;

  // Completed treatment (Close Treatment Plan) → 1-year refund window instead
  // of the usual amount cap. Backend enforces this authoritatively; this is
  // UX-only (hide/disable + tooltip) and degrades gracefully when payment.appointment
  // isn't populated (e.g. multi-invoice settlements) — treated as "no restriction".
  const appt = payment.appointment;
  const isClosedTreatmentPayment = !!(
    appt &&
    appt.visitType === "treatment" &&
    appt.treatmentStatus &&
    appt.treatmentClosedAt
  );
  const daysSinceClosed = isClosedTreatmentPayment
    ? (Date.now() - new Date(appt.treatmentClosedAt).getTime()) / 86400000
    : null;
  const refundWindowExpired = isClosedTreatmentPayment && daysSinceClosed > REFUND_WINDOW_DAYS;

  // Only show refund for payments linked to a single invoice (payment.invoice).
  // Payments recorded via collectPayment/recordAdminPayment use settledInvoices[]
  // instead — those are handled by the Reverse flow below.
  const refundEligible = payment.status === "paid" && !payment.settledInvoices?.length;
  const canRefund = refundEligible && !refundWindowExpired;
  const canDeletePermission = hasPermission("payments", "delete");
  const canReverse = !!(payment.settledInvoices?.length) && !payment.reversed && payment.status !== "reversed" && canDeletePermission;

  return (
    <>
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "rounded-xl" }}
    >
      {/* Header */}
      <DialogTitle className="bg-linear-to-r from-green-600 to-green-700 text-white" sx={{ p: 0 }}>
        <Box className="flex items-center justify-between px-4 py-2">
          <Box className="flex items-center gap-2">
            <PaymentIcon fontSize="small" />
            <Typography variant="subtitle1" className="font-bold">{payment.paymentNumber}</Typography>
            <Chip label={payment.status} size="small" color={statusColors[payment.status] || "default"} className="capitalize" />
          </Box>
          <IconButton onClick={handleClose} disabled={isRefunding || isReversing || isConfirmingManual} size="small">
            <CloseIcon className="text-white" fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent className="p-4">
        <Grid container spacing={2}>
          {/* Left Column - Payment Info */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption" className="font-semibold text-gray-600 uppercase flex items-center gap-1 mb-1">
              <AccountBalanceWalletIcon sx={{ fontSize: 13 }} className="text-green-600" /> Payment Info
            </Typography>
            <Box sx={{ bgcolor: "#f9fafb", borderRadius: 1, p: 1.5 }}>
              <InfoRow label="Amount" value={<span className="font-numbers">{formatCurrency(payment.amount)}</span>} highlight />
              <InfoRow label="Mode" value={paymentModeLabels[payment.paymentMode] || payment.paymentMode} />
              <InfoRow label="Type" value={paymentTypeLabels[payment.type] || payment.type} />
              <InfoRow label="Status" value={payment.status?.toUpperCase()} />
              {payment.referenceNumber && (
                <InfoRow label="Reference #" value={payment.referenceNumber} />
              )}
              <InfoRow label="Paid At" value={formatDate(payment.paidAt)} />
              <InfoRow label="Recorded" value={formatDate(payment.createdAt)} />
            </Box>
          </Grid>

          {/* Right Column - Patient & Invoice */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption" className="font-semibold text-gray-600 uppercase flex items-center gap-1 mb-1">
              <PersonIcon sx={{ fontSize: 13 }} className="text-blue-600" /> Patient & Invoice
            </Typography>
            <Box sx={{ bgcolor: "#f9fafb", borderRadius: 1, p: 1.5 }}>
              <InfoRow label="Patient" value={payment.patient?.name} />
              <InfoRow label="Phone" value={payment.patient?.phone} />
              <InfoRow label="Clinic" value={payment.clinic?.name} />
              {payment.invoice && (
                <>
                  <Divider className="my-2" />
                  <InfoRow label="Invoice #" value={payment.invoice?.invoiceNumber} />
                  <InfoRow label="Invoice Total" value={<span className="font-numbers">{formatCurrency(payment.invoice?.grandTotal)}</span>} />
                </>
              )}
            </Box>

            {/* Received By */}
            {payment.receivedBy && (
              <Box className="mt-4">
                <Typography variant="caption" className="text-gray-500">
                  Received by: {payment.receivedBy?.name}
                </Typography>
              </Box>
            )}
          </Grid>

          {/* Notes */}
          {payment.notes && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ bgcolor: "#fffbeb", borderRadius: 1, p: 1.5, border: "1px solid #fde68a" }}>
                <Typography variant="caption" className="font-semibold text-gray-700 block mb-0.5">Notes</Typography>
                <Typography variant="body2">{payment.notes}</Typography>
              </Box>
            </Grid>
          )}

          {/* Razorpay Details */}
          {payment.paymentMode === "razorpay" && payment.razorpayPaymentId && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" className="font-semibold text-gray-600 uppercase flex items-center gap-1 mb-1">
                <ReceiptIcon sx={{ fontSize: 13 }} className="text-purple-600" /> Razorpay Details
              </Typography>
              <Box sx={{ bgcolor: "#faf5ff", borderRadius: 1, p: 1.5 }}>
                <InfoRow label="Order ID" value={payment.razorpayOrderId} />
                <InfoRow label="Payment ID" value={payment.razorpayPaymentId} />
                {payment.razorpayDetails?.method && (
                  <InfoRow label="Method" value={payment.razorpayDetails.method} />
                )}
                {payment.razorpayDetails?.vpa && (
                  <InfoRow label="UPI ID" value={payment.razorpayDetails.vpa} />
                )}
              </Box>
            </Grid>
          )}

          {/* Refund Details */}
          {payment.status === "refunded" && payment.refund && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ bgcolor: "#fef2f2", borderRadius: 1, p: 1.5, border: "1px solid #fecaca" }}>
                <Typography variant="caption" className="font-semibold text-red-700 block mb-0.5">Refund Information</Typography>
                {payment.refund.amount != null && (
                  <InfoRow label="Refund Amount" value={<span className="font-numbers">{formatCurrency(payment.refund.amount)}</span>} highlight />
                )}
                <InfoRow label="Refunded At" value={formatDate(payment.refund.refundedAt)} />
                <InfoRow label="Reason" value={payment.refund.reason} />
                {payment.refund.razorpayRefundId && (
                  <InfoRow label="Razorpay Refund ID" value={payment.refund.razorpayRefundId} />
                )}
              </Box>
            </Grid>
          )}

          {/* Refund Form */}
          {showRefundForm && canRefund && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ bgcolor: "#fef2f2", borderRadius: 1, p: 1.5, border: "1px solid #fecaca" }}>
                <Typography variant="caption" className="font-semibold text-red-700 block mb-3">Refund Payment</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Refund Amount"
                      type="number"
                      size="small"
                      value={refundAmount}
                      onChange={handleRefundAmountChange}
                      placeholder={String(payment.amount)}
                      error={!!refundAmountError}
                      helperText={
                        refundAmountError ||
                        `Leave blank to refund the full ${formatCurrency(payment.amount)}`
                      }
                      slotProps={{
                        htmlInput: isClosedTreatmentPayment
                          ? { min: 1, step: 1 }
                          : { min: 1, max: payment.amount, step: 1 },
                      }}
                    />
                    {refundAmountWarning && (
                      <Typography variant="caption" sx={{ color: "#b45309", display: "block", mt: 0.5 }}>
                        {refundAmountWarning}
                      </Typography>
                    )}
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Reason for Refund *"
                      size="small"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Enter reason for refund..."
                      multiline
                      rows={2}
                    />
                  </Grid>
                </Grid>
                <Box className="flex gap-2 mt-3">
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={handleRefund}
                    disabled={isRefunding || !!refundAmountError}
                    startIcon={isRefunding ? <CircularProgress size={16} /> : <RefreshIcon />}
                  >
                    {isRefunding ? "Processing..." : "Confirm Refund"}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setShowRefundForm(false);
                      setRefundAmount("");
                      setRefundAmountError("");
                    }}
                    disabled={isRefunding}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Grid>
          )}

          {/* Manual Refund Confirmation — shown when Razorpay API failed */}
          {manualConfirmPending && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ bgcolor: "#fff7ed", borderRadius: 1, p: 1.5, border: "1px solid #fed7aa" }}>
                <Typography variant="caption" className="font-semibold text-orange-700 block mb-1">
                  Razorpay refund failed — confirm manual refund
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                  The refund is recorded as <strong>pending</strong>. Confirm that you have refunded{" "}
                  <strong>{formatCurrency(manualConfirmPending.amount)}</strong> to the patient manually.
                  This will mark the payment as fully refunded.
                </Typography>
                <Box className="flex items-center gap-2 mb-3">
                  <Typography variant="caption" className="text-gray-600 shrink-0">Method used:</Typography>
                  <select
                    value={manualMethod}
                    onChange={(e) => setManualMethod(e.target.value)}
                    disabled={isConfirmingManual}
                    style={{
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      padding: "4px 8px",
                      fontSize: 13,
                      background: "#fff",
                    }}
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </Box>
                <Box className="flex gap-2">
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleConfirmManualRefund}
                    disabled={isConfirmingManual}
                    startIcon={isConfirmingManual ? <CircularProgress size={16} color="inherit" /> : null}
                    sx={{ bgcolor: "#ea580c", "&:hover": { bgcolor: "#c2410c" }, textTransform: "none", fontSize: 12 }}
                  >
                    {isConfirmingManual ? "Confirming..." : "Confirm Manual Refund"}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setManualConfirmPending(null)}
                    disabled={isConfirmingManual}
                    sx={{ textTransform: "none", fontSize: 12 }}
                  >
                    Later
                  </Button>
                </Box>
              </Box>
            </Grid>
          )}

          {/* Reverse Form — for admin-recorded payments (settledInvoices) */}
          {showReverseForm && canReverse && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ bgcolor: "#fef2f2", borderRadius: 1, p: 1.5, border: "1px solid #fecaca" }}>
                <Typography variant="caption" className="font-semibold text-red-700 block mb-0.5">Void Payment (Data Error)</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                  Restores the original balance on all invoices settled by this payment. The full amount is reversed.
                </Typography>
                <TextField
                  fullWidth
                  label="Reason for reversal *"
                  size="small"
                  value={reverseReason}
                  onChange={(e) => setReverseReason(e.target.value)}
                  placeholder="e.g. Payment recorded by mistake"
                  multiline
                  rows={2}
                  disabled={isReversing}
                />
                <Box className="flex gap-2 mt-3">
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={handleReverse}
                    disabled={isReversing || !reverseReason.trim()}
                    startIcon={isReversing ? <CircularProgress size={16} /> : <UndoIcon />}
                  >
                    {isReversing ? "Reversing..." : "Confirm Reversal"}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setShowReverseForm(false);
                      setReverseReason("");
                    }}
                    disabled={isReversing}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      {/* Actions */}
      <DialogActions className="p-2 bg-gray-50">
        {refundEligible && !showRefundForm && (
          <Tooltip
            title={
              refundWindowExpired
                ? "Refund window (1 year) has expired for this completed treatment"
                : "Return money to the patient (cash/UPI/Razorpay)"
            }
            placement="top"
          >
            <span>
              <Button
                variant="outlined"
                color="error"
                startIcon={<RefreshIcon />}
                onClick={() => setShowRefundForm(true)}
                disabled={refundWindowExpired}
                sx={{ textTransform: "none", fontSize: "12px" }}
              >
                Refund Payment
              </Button>
            </span>
          </Tooltip>
        )}
        {canReverse && !showReverseForm && (
          <Tooltip title="Undo a data-entry mistake — no money changes hands" placement="top">
            <Button
              variant="outlined"
              color="warning"
              startIcon={<UndoIcon />}
              onClick={() => setShowReverseForm(true)}
              sx={{ textTransform: "none", fontSize: "12px" }}
            >
              Void Payment (Data Error)
            </Button>
          </Tooltip>
        )}
        {canDeletePermission && (
          <Button
            variant="outlined"
            color="error"
            startIcon={isDeleting ? <CircularProgress size={16} /> : <DeleteIcon />}
            onClick={handleDelete}
            disabled={isDeleting || isRefunding || isReversing}
            sx={{ textTransform: "none", fontSize: "12px" }}
          >
            Delete
          </Button>
        )}
        <Box className="flex-grow" />
        <Button onClick={handleClose} color="inherit" disabled={isRefunding || isReversing || isConfirmingManual} sx={{ textTransform: "none", fontSize: "12px" }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>

    <ConfirmDialog
      open={deleteConfirmOpen}
      onClose={() => setDeleteConfirmOpen(false)}
      onConfirm={doDelete}
      title="Delete Payment"
      message="Permanently delete this payment? This action cannot be undone."
      confirmText="Delete Permanently"
      confirmColor="error"
      loading={isDeleting}
    />
    </>
  );
};

export default PaymentDetailModal;
