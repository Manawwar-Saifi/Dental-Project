/**
 * Patient Payments Page
 *
 * Shows payment history with summary cards.
 * Allows paying pending invoice balances via Razorpay.
 */
import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import PaymentIcon from "@mui/icons-material/Payment";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CloseIcon from "@mui/icons-material/Close";
import { useMyPaymentHistory } from "../../hooks/patient/useMyPayments";
import { useMyBillingSummary } from "../../hooks/patient/useMyInvoices";
import { useAuthStore } from "../../store/auth.store";
import {
  createPendingOrder,
  verifyPendingPayment,
} from "../../api/patient/payments.api";

const paymentModeLabels = {
  cash: "Cash",
  card: "Card",
  upi: "UPI",
  online: "Online",
  razorpay: "Online",
  netbanking: "Net Banking",
  free: "Free",
  other: "Other",
};

const statusColors = {
  paid: "success",
  partial: "warning",
  unpaid: "error",
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (val) => `₹${(val || 0).toLocaleString("en-IN")}`;

/* ── Pay Pending Modal ──────────────────────────────────────────────── */

const PayPendingModal = ({ open, onClose, pendingAmount, onPaymentSuccess }) => {
  const patient = useAuthStore((s) => s.patient);
  const [enteredAmount, setEnteredAmount] = useState(pendingAmount || 0);
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState("");

  // Sync input when modal opens or pendingAmount changes
  useEffect(() => {
    if (open) {
      setEnteredAmount(pendingAmount || 0);
      setInputError("");
    }
  }, [open, pendingAmount]);

  const handleAmountChange = (e) => {
    const val = Number(e.target.value);
    setEnteredAmount(val);
    if (!val || val <= 0) {
      setInputError("Amount must be greater than 0");
    } else if (val > pendingAmount) {
      setInputError(`Amount cannot exceed ₹${pendingAmount.toLocaleString("en-IN")}`);
    } else {
      setInputError("");
    }
  };

  const handlePay = async () => {
    if (!enteredAmount || enteredAmount <= 0 || enteredAmount > pendingAmount) return;
    setLoading(true);

    try {
      // Step 1: Create Razorpay order
      const orderData = await createPendingOrder(enteredAmount);

      // Step 2: Open Razorpay checkout
      const options = {
        key: orderData.data.keyId,
        amount: Math.round(orderData.data.amount * 100),
        currency: "INR",
        name: "Dental Clinic",
        description: "Pending Amount Payment",
        order_id: orderData.data.orderId,
        handler: async (paymentResponse) => {
          try {
            await verifyPendingPayment({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
              amount: enteredAmount,
            });
            onPaymentSuccess(enteredAmount);
            onClose();
          } catch {
            // verify failure is surfaced via onPaymentSuccess(null) to show error
            onPaymentSuccess(null);
          }
        },
        prefill: {
          name: patient?.name || "",
          email: patient?.email || "",
          contact: patient?.phone || "",
        },
        theme: { color: "#f59e0b" },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => setLoading(false));
      rzp.open();
    } catch (err) {
      console.error("[PayPending] order creation failed:", err);
      setLoading(false);
      onPaymentSuccess(null);
    }
  };

  const isInvalid =
    !enteredAmount || enteredAmount <= 0 || enteredAmount > pendingAmount || !!inputError;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        Pay Pending Amount
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Total Pending:{" "}
          <strong style={{ color: "#f59e0b" }}>
            {formatCurrency(pendingAmount)}
          </strong>
        </Typography>

        <TextField
          label="Enter amount to pay"
          type="number"
          fullWidth
          value={enteredAmount}
          onChange={handleAmountChange}
          inputProps={{ min: 1, max: pendingAmount, step: 1 }}
          error={!!inputError}
          helperText={
            inputError ||
            `You can pay any amount up to ${formatCurrency(pendingAmount)}`
          }
          disabled={loading}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="outlined" color="inherit" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          fullWidth
          onClick={handlePay}
          disabled={isInvalid || loading}
          sx={{
            bgcolor: "#f59e0b",
            color: "#fff",
            fontWeight: 600,
            fontSize: "14px",
            borderRadius: "8px",
            py: 1,
            "&:hover": { bgcolor: "#d97706" },
            "&:disabled": { bgcolor: "#fcd34d" },
          }}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading
            ? "Processing…"
            : `Pay ${formatCurrency(enteredAmount || 0)}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ── Main Page ──────────────────────────────────────────────────────── */

const Payments = () => {
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const { data, isLoading, error, refetch } = useMyPaymentHistory();
  const { data: billingData, refetch: refetchBilling } = useMyBillingSummary();

  const payments = Array.isArray(data?.data) ? data.data : [];
  const stats = billingData?.data?.stats || {};
  const pendingAmount = stats.totalDue || 0;

  const handlePaymentSuccess = (amount) => {
    if (amount) {
      setSnackbar({
        open: true,
        message: `Payment of ${formatCurrency(amount)} successful!`,
        severity: "success",
      });
      refetch();
      refetchBilling();
    } else {
      setSnackbar({
        open: true,
        message: "Payment verification failed. Please contact support.",
        severity: "error",
      });
    }
  };

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Payment History
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View your payment history and pending amounts
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3, alignItems: "stretch" }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <PaymentIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Billed
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" className="font-numbers text-navy">
                    {formatCurrency(stats.totalAmount)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <AccountBalanceWalletIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Paid
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" className="font-numbers text-green-600">
                    {formatCurrency(stats.totalPaid)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <PaymentIcon color="warning" sx={{ fontSize: 40 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Pending Amount
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" className="font-numbers text-orange-600">
                    {formatCurrency(pendingAmount)}
                  </Typography>
                </Box>
              </Box>
              {pendingAmount > 0 && (
                <Button
                  size="small"
                  onClick={() => setPayModalOpen(true)}
                  sx={{
                    mt: 1,
                    bgcolor: "#f59e0b",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "14px",
                    borderRadius: "8px",
                    px: 3,
                    py: 0.75,
                    "&:hover": { bgcolor: "#d97706" },
                  }}
                >
                  Pay Now
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment History */}
      <Card>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="h6" fontWeight="bold">
              Payment History
            </Typography>
          </Box>

          {isLoading ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }} color="text.secondary">
                Loading payments...
              </Typography>
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography color="error">
                Failed to load payments. Please try again.
              </Typography>
            </Box>
          ) : payments.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <PaymentIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No payments recorded yet
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Your payment history will appear here once a payment is made.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table sx={{ bgcolor: "white", minWidth: "max-content" }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                    <TableCell>Date</TableCell>
                    <TableCell>Invoice No.</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Amount Paid</TableCell>
                    <TableCell>Dues</TableCell>
                    <TableCell>Mode</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment._id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(payment.date)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" className="font-mono text-xs" fontWeight="medium">
                          {payment.invoiceNumber || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {payment.service || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" className="font-numbers">
                          {formatCurrency(payment.grandTotal)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" className="font-numbers text-green-600">
                          {formatCurrency(payment.amountPaid)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" className="font-numbers">
                          {payment.dueAfterThisPayment != null
                            ? formatCurrency(payment.dueAfterThisPayment)
                            : "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {paymentModeLabels[payment.paymentMethod] || payment.paymentMethod || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            payment.paymentStatus === "paid"
                              ? "Paid"
                              : payment.paymentStatus === "partial"
                              ? "Partial"
                              : payment.paymentStatus || "-"
                          }
                          size="small"
                          color={statusColors[payment.paymentStatus] || "default"}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Pay Pending Modal */}
      <PayPendingModal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        pendingAmount={pendingAmount}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Success / Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Payments;
