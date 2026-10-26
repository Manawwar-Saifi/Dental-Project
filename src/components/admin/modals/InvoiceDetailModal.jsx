/**
 * Invoice Detail Modal
 *
 * Shows full invoice details with conditional action buttons.
 * Inline forms for recording payment and cancelling invoice.
 */
import { useState } from "react";
import { CLINIC_NAME } from "../../../constants/clinic.js";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SendIcon from "@mui/icons-material/Send";
import PaymentIcon from "@mui/icons-material/Payment";
import CancelIcon from "@mui/icons-material/Cancel";
import DeleteIcon from "@mui/icons-material/Delete";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import BlockIcon from "@mui/icons-material/Block";
import EditIcon from "@mui/icons-material/Edit";
import HistoryIcon from "@mui/icons-material/History";
import Tooltip from "@mui/material/Tooltip";
import { toast } from "react-toastify";
import { useInvoice, useBillingMutations } from "../../../hooks/admin/useBilling";
import { usePermissions } from "../../../hooks/admin/usePermissions";
import InvoicePreviewModal from "../../InvoicePreviewModal";
import ConfirmDialog from "../../common/ConfirmDialog";
import EditInvoiceModal from "./EditInvoiceModal";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { verifyRazorpayPaymentLink } from "../../../api/admin/payments.api";

/**
 * Status config
 */
const statusConfig = {
  draft:          { label: "Draft",          sx: { bgcolor: "#64748b", color: "#fff" } },
  sent:           { label: "Sent",           sx: { bgcolor: "#0369a1", color: "#fff" } },
  partially_paid: { label: "Partially Paid", sx: { bgcolor: "#b45309", color: "#fff" } },
  paid:           { label: "Paid",           sx: { bgcolor: "#15803d", color: "#fff" } },
  overdue:        { label: "Overdue",        sx: { bgcolor: "#9f1239", color: "#fff" } },
  cancelled:      { label: "Cancelled",      sx: { bgcolor: "#374151", color: "#fff" } },
};

const paymentStatusConfig = {
  unpaid: { color: "error", label: "Unpaid" },
  partial: { color: "warning", label: "Partial" },
  paid: { color: "success", label: "Paid" },
};

const itemTypeLabels = {
  treatment: "Treatment",
  surgery: "Surgery",
  test: "Test",
  opd_fee: "Appointment Fee",
  membership: "Membership",
  medicine: "Medicine",
  other: "Other",
};

const paymentMethodLabels = {
  cash: "Cash",
  card: "Card",
  upi: "UPI",
  online: "Online",
};

const formatCurrency = (val) =>
  `₹${(val || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const InfoRow = ({ label, children }) => (
  <Box className="flex justify-between py-1">
    <Typography variant="body2" className="text-gray-500">
      {label}
    </Typography>
    <Typography variant="body2" className="font-medium">
      {children}
    </Typography>
  </Box>
);

const InvoiceDetailModal = ({ open, onClose, invoice, onRefresh }) => {
  // Verify Payment (missed-webhook safety net)
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [showVoidForm, setShowVoidForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [voidReason, setVoidReason] = useState("");
  const [issueConfirmOpen, setIssueConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [editInvoiceOpen, setEditInvoiceOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Fetch full details
  const { data: fullData, isLoading, isError, refetch: refetchInvoice } = useInvoice(invoice?._id);
  const { hasPermission } = usePermissions();
  const inv = fullData?.data?.invoice || invoice;

  const {
    issueInvoice,
    isIssuing,
    recordPayment,
    isRecordingPayment,
    cancelInvoice,
    isCancelling,
    voidInvoice,
    isVoiding,
    deleteInvoice,
    isDeleting,
  } = useBillingMutations();

  const resetForms = () => {
    setShowPaymentForm(false);
    setShowCancelForm(false);
    setShowVoidForm(false);
    setPaymentAmount("");
    setCancelReason("");
    setVoidReason("");
  };

  const handleClose = () => {
    resetForms();
    onClose();
  };

  const handleIssue = () => {
    if (isIssuing) return;
    setIssueConfirmOpen(true);
  };

  const doIssue = () => {
    setIssueConfirmOpen(false);
    issueInvoice(inv._id, {
      onSuccess: () => {
        refetchInvoice();
        onRefresh?.();
        resetForms();
      },
      onError: (err) =>
        toast.error(err.response?.data?.message || "Failed to issue invoice"),
    });
  };

  /**
   * Only offered where it can actually help: a Razorpay link exists AND money
   * still appears outstanding. On a fully-paid invoice there is nothing to
   * reconcile, and on an invoice with no link there is nothing to ask about.
   */
  const canVerifyPayment =
    !!inv?.paymentLink?.id && (inv?.balanceDue || 0) > 0 && !inv?.isVoided;

  const handleVerifyPayment = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await verifyRazorpayPaymentLink(inv._id);
      const { outcome } = res.data || {};

      if (outcome === "reconciled") {
        setVerifyResult({ tone: "success", message: res.message });
        toast.success(res.message);
        refetchInvoice();
        onRefresh?.();
      } else if (outcome === "already_reconciled") {
        // The webhook got there first -- report it, change nothing, and still
        // refresh so the admin sees the already-correct state.
        setVerifyResult({ tone: "success", message: "Already recorded — no action taken." });
        toast.info("This payment was already recorded.");
        refetchInvoice();
        onRefresh?.();
      } else {
        // Razorpay says it isn't paid. This is a real answer, not an error:
        // it tells the admin the patient has not actually paid yet.
        setVerifyResult({ tone: "warning", message: res.message });
        toast.warn(res.message);
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Could not check the payment status. Please try again.";
      setVerifyResult({ tone: "error", message });
      toast.error(message);
    } finally {
      setVerifying(false);
    }
  };

  const handleRecordPayment = () => {
    if (isRecordingPayment) return;
    if (!paymentAmount || isNaN(paymentAmount))
      return toast.error("Enter a valid numeric amount");
    const amount = Number(paymentAmount);
    if (amount <= 0) return toast.error("Amount must be greater than 0");
    if (amount > (inv?.balanceDue || 0) + 0.01)
      return toast.error(`Amount cannot exceed balance due (${formatCurrency(inv?.balanceDue)})`);

    recordPayment(
      { id: inv._id, data: { amount } },
      {
        onSuccess: () => {
          refetchInvoice();
          onRefresh?.();
          resetForms();
        },
        onError: (err) =>
          toast.error(
            err.response?.data?.message || "Failed to record payment"
          ),
      }
    );
  };

  const handleCancel = () => {
    if (isCancelling) return;
    if (!cancelReason.trim())
      return toast.error("Please provide a cancellation reason");
    cancelInvoice(
      { id: inv._id, data: { reason: cancelReason.trim() } },
      {
        onSuccess: () => {
          refetchInvoice();
          onRefresh?.();
          resetForms();
        },
        onError: (err) =>
          toast.error(
            err.response?.data?.message || "Failed to cancel invoice"
          ),
      }
    );
  };

  const handleVoid = () => {
    if (isVoiding) return;
    if (!voidReason.trim() || voidReason.trim().length < 10)
      return toast.error("Please provide a reason of at least 10 characters");
    voidInvoice(
      { id: inv._id, data: { reason: voidReason.trim() } },
      {
        onSuccess: () => {
          toast.success("Invoice voided");
          refetchInvoice();
          onRefresh?.();
          resetForms();
        },
        onError: (err) =>
          toast.error(err.response?.data?.message || "Failed to void invoice"),
      }
    );
  };

  const handleDeleteInvoice = () => {
    if (isDeleting) return;
    setDeleteConfirmOpen(true);
  };

  const doDeleteInvoice = () => {
    setDeleteConfirmOpen(false);
    deleteInvoice(inv._id, {
      onSuccess: () => {
        toast.success("Deleted successfully");
        onRefresh?.();
        handleClose();
      },
      onError: (err) =>
        toast.error(err.response?.data?.message || "Failed to delete invoice"),
    });
  };

  if (!invoice) return null;

  const status = statusConfig[inv?.status] || statusConfig.draft;
  const payStatus =
    paymentStatusConfig[inv?.paymentStatus] || paymentStatusConfig.unpaid;

  return (
    <>
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ className: "rounded-xl" }}
    >
      {/* Header */}
      <DialogTitle className="bg-linear-to-r from-indigo-600 to-indigo-700 text-white">
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-3">
            <ReceiptLongIcon />
            <Box>
              <Typography variant="h6" component="span" className="font-bold">
                {inv?.invoiceNumber || "Invoice"}
              </Typography>
              <Box className="flex gap-2 mt-1 items-center">
                <Chip
                  label={status.label}
                  size="small"
                  sx={status.sx}
                  className="text-xs"
                />
                <Chip
                  label={payStatus.label}
                  size="small"
                  color={payStatus.color}
                  className="text-xs"
                />
                {inv?.isVoided && (
                  <Chip
                    label="Voided"
                    size="small"
                    sx={{ bgcolor: "#7f1d1d", color: "#fff" }}
                    className="text-xs"
                  />
                )}
                {inv?.editHistory?.length > 0 && (
                  <Tooltip title="View correction history">
                    <Chip
                      icon={<HistoryIcon sx={{ color: "#fff !important" }} />}
                      label={`Edited (${inv.editHistory.length})`}
                      size="small"
                      onClick={() => setHistoryOpen(true)}
                      sx={{ bgcolor: "#7c3aed", color: "#fff", cursor: "pointer" }}
                      className="text-xs"
                    />
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Box>
          <IconButton onClick={handleClose}>
            <CloseIcon className="text-white" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent className="p-6 mt-2">
        {isLoading ? (
          <Box className="text-center py-8">
            <CircularProgress />
          </Box>
        ) : isError ? (
          <Alert severity="error" className="my-4">
            Failed to load invoice details. Please close and try again.
          </Alert>
        ) : (
          <>
            {inv?.isVoided && (
              <Alert severity="error" className="mb-4">
                <strong>Voided</strong>
                {inv.voidedAt ? ` on ${formatDate(inv.voidedAt)}` : ""} — {inv.voidReason}
              </Alert>
            )}

            {/* Invoice & Patient Info */}
            <Grid container spacing={3} className="mb-4">
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper variant="outlined" className="p-3">
                  <Typography
                    variant="subtitle2"
                    className="font-semibold text-gray-700 mb-2"
                  >
                    Invoice Details
                  </Typography>
                  <InfoRow label="Invoice Date">
                    {formatDate(inv?.invoiceDate)}
                  </InfoRow>
                  <InfoRow label="Due Date">{formatDate(inv?.dueDate)}</InfoRow>
                  <InfoRow label="Created By">
                    {inv?.createdBy?.name || "-"}
                  </InfoRow>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper variant="outlined" className="p-3">
                  <Typography
                    variant="subtitle2"
                    className="font-semibold text-gray-700 mb-2"
                  >
                    Patient & Clinic
                  </Typography>
                  <InfoRow label="Patient">
                    {inv?.patient?.name || "-"}
                  </InfoRow>
                  <InfoRow label="Phone">
                    {inv?.patient?.phone || "-"}
                  </InfoRow>
                  <InfoRow label="Clinic">
                    {inv?.clinic?.name || "-"}
                  </InfoRow>
                </Paper>
              </Grid>
            </Grid>

            {/* Items Table */}
            <Typography
              variant="subtitle2"
              className="font-semibold text-gray-700 mb-2"
            >
              Line Items
            </Typography>
            <TableContainer component={Paper} variant="outlined" className="mb-4">
              <Table size="small">
                <TableHead>
                  <TableRow className="bg-gray-50">
                    <TableCell className="font-semibold">#</TableCell>
                    <TableCell className="font-semibold">Description</TableCell>
                    <TableCell className="font-semibold">Category</TableCell>
                    <TableCell align="right" className="font-semibold">
                      Qty
                    </TableCell>
                    <TableCell align="right" className="font-semibold">
                      Price
                    </TableCell>
                    <TableCell align="right" className="font-semibold">
                      Disc
                    </TableCell>
                    <TableCell align="right" className="font-semibold">
                      Tax
                    </TableCell>
                    <TableCell align="right" className="font-semibold">
                      Total
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(inv?.items || []).map((item, idx) => (
                    <TableRow key={item._id || idx} hover>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        <Chip
                          label={itemTypeLabels[item.itemType] || item.itemType}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right" className="font-numbers">{item.quantity}</TableCell>
                      <TableCell align="right" className="font-numbers">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell align="right" className="font-numbers">
                        {item.discount?.percentage
                          ? `${item.discount.percentage}%`
                          : "-"}
                      </TableCell>
                      <TableCell align="right" className="font-numbers">
                        {formatCurrency(item.taxAmount)}
                      </TableCell>
                      <TableCell align="right" className="font-numbers font-medium">
                        {formatCurrency(item.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Totals Breakdown */}
            <Box className="flex justify-end mb-4">
              <Paper variant="outlined" className="p-4 min-w-[300px]">
                <InfoRow label="Subtotal"><span className="font-numbers">{formatCurrency(inv?.subtotal)}</span></InfoRow>
                {(inv?.discount?.percentage > 0 || inv?.discount?.amount > 0) && (
                  <InfoRow label={`Discount${inv?.discount?.percentage ? ` (${inv.discount.percentage}%)` : ""}`}>
                    <span className="font-numbers text-red-500">
                      -{formatCurrency(inv?.discount?.amount || 0)}
                    </span>
                  </InfoRow>
                )}
                {inv?.totalTax > 0 && (
                  <InfoRow label="Tax"><span className="font-numbers">{formatCurrency(inv?.totalTax)}</span></InfoRow>
                )}
                <Divider className="my-2" />
                <InfoRow label="Grand Total">
                  <span className="font-numbers text-lg font-bold">
                    {formatCurrency(inv?.grandTotal)}
                  </span>
                </InfoRow>
                <InfoRow label="Amount Paid">
                  <span className="font-numbers text-green-600 font-medium">
                    {formatCurrency(inv?.amountPaid)}
                  </span>
                </InfoRow>
                {inv?.paymentMethod && (
                  <InfoRow label="Payment Method">
                    {paymentMethodLabels[inv.paymentMethod] || inv.paymentMethod}
                  </InfoRow>
                )}
                <Divider className="my-1" />
                <InfoRow label="Balance Due">
                  <span
                    className={`font-numbers font-bold ${inv?.balanceDue > 0 ? "text-red-600" : "text-green-600"}`}
                  >
                    {formatCurrency(inv?.balanceDue)}
                  </span>
                </InfoRow>

                {/* Verify Payment -- the missed-webhook safety net.
                    Shown only where it can actually help: a Razorpay link was
                    generated AND the invoice still shows money outstanding.
                    This is exactly the "the patient says they already paid"
                    situation, so it sits right under Balance Due. */}
                {canVerifyPayment && (
                  <Box className="mt-2">
                    <Button
                      size="small"
                      variant="outlined"
                      fullWidth
                      onClick={handleVerifyPayment}
                      disabled={verifying}
                      startIcon={
                        verifying ? <CircularProgress size={14} /> : <VerifiedUserIcon fontSize="small" />
                      }
                      sx={{ textTransform: "none", fontSize: "12px" }}
                    >
                      {verifying ? "Checking with Razorpay…" : "Verify Payment"}
                    </Button>
                    <Typography variant="caption" className="block text-gray-500 mt-1 text-center">
                      Patient says they paid? Check the payment link's real status.
                    </Typography>
                    {verifyResult && (
                      <Typography
                        variant="caption"
                        className={`block mt-1 text-center font-medium ${
                          verifyResult.tone === "success"
                            ? "text-green-700"
                            : verifyResult.tone === "warning"
                            ? "text-amber-700"
                            : "text-red-700"
                        }`}
                      >
                        {verifyResult.message}
                      </Typography>
                    )}
                  </Box>
                )}
              </Paper>
            </Box>

            {/* Legal company line */}
            <Typography variant="caption" className="block text-center text-gray-500 mb-4">
              {CLINIC_NAME}
            </Typography>

            {/* Notes */}
            {inv?.notes && (
              <Paper className="p-3 mb-3 bg-yellow-50 border border-yellow-200">
                <Typography variant="caption" className="text-yellow-800 font-semibold">
                  Notes
                </Typography>
                <Typography variant="body2" className="text-yellow-900">
                  {inv.notes}
                </Typography>
              </Paper>
            )}

            {/* Cancellation Info */}
            {inv?.status === "cancelled" && (
              <Paper className="p-3 mb-3 bg-red-50 border border-red-200">
                <Typography variant="caption" className="text-red-800 font-semibold">
                  Cancelled
                </Typography>
                <Typography variant="body2" className="text-red-900">
                  {inv.cancellationReason || "No reason provided"}
                </Typography>
                <Typography variant="caption" className="text-red-600">
                  By {inv.cancelledBy?.name || "Admin"} on{" "}
                  {formatDate(inv.cancelledAt)}
                </Typography>
              </Paper>
            )}

            {/* Inline Record Payment Form */}
            {showPaymentForm && (
              <Paper className="p-4 mb-3 bg-green-50 border border-green-200">
                <Typography
                  variant="subtitle2"
                  className="font-semibold text-green-800 mb-2"
                >
                  Record Payment
                </Typography>
                <Box className="flex items-center gap-3">
                  <TextField
                    label="Amount (₹)"
                    type="number"
                    size="small"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    inputProps={{ min: 1, max: inv?.balanceDue }}
                    helperText={`Balance due: ${formatCurrency(inv?.balanceDue)}`}
                    className="min-w-[200px]"
                  />
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={handleRecordPayment}
                    disabled={isRecordingPayment}
                    startIcon={
                      isRecordingPayment ? (
                        <CircularProgress size={16} />
                      ) : (
                        <PaymentIcon />
                      )
                    }
                  >
                    Confirm
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setShowPaymentForm(false);
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Paper>
            )}

            {/* Inline Cancel Form */}
            {showCancelForm && (
              <Paper className="p-4 mb-3 bg-red-50 border border-red-200">
                <Typography
                  variant="subtitle2"
                  className="font-semibold text-red-800 mb-2"
                >
                  Cancel Invoice
                </Typography>
                <Box className="flex items-center gap-3">
                  <TextField
                    label="Cancellation Reason"
                    size="small"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Reason for cancellation..."
                    className="flex-1"
                  />
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={handleCancel}
                    disabled={isCancelling}
                    startIcon={
                      isCancelling ? (
                        <CircularProgress size={16} />
                      ) : (
                        <CancelIcon />
                      )
                    }
                  >
                    Confirm Cancel
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setShowCancelForm(false);
                    }}
                  >
                    Back
                  </Button>
                </Box>
              </Paper>
            )}

            {/* Inline Void Form */}
            {showVoidForm && (
              <Paper className="p-4 mb-3 bg-red-50 border border-red-200">
                <Typography variant="subtitle2" className="font-semibold text-red-800 mb-2">
                  Void Invoice
                </Typography>
                <Typography variant="caption" className="text-red-700 block mb-2">
                  Voiding works on any invoice, including paid ones — use this for phantom/erroneous
                  invoices. It never deletes the record or touches linked payments.
                </Typography>
                <Box className="flex items-start gap-3">
                  <TextField
                    label="Reason (min 10 characters)"
                    size="small"
                    multiline
                    minRows={2}
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    placeholder="Why is this invoice being voided?"
                    className="flex-1"
                  />
                  <Box className="flex flex-col gap-1">
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={handleVoid}
                      disabled={isVoiding || voidReason.trim().length < 10}
                      startIcon={isVoiding ? <CircularProgress size={16} /> : <BlockIcon />}
                    >
                      Confirm Void
                    </Button>
                    <Button size="small" onClick={() => setShowVoidForm(false)}>
                      Back
                    </Button>
                  </Box>
                </Box>
              </Paper>
            )}
          </>
        )}
      </DialogContent>

      {/* Actions */}
      {!showPaymentForm && !showCancelForm && !showVoidForm && (
        <DialogActions className="p-4 bg-gray-50">
          <Button onClick={handleClose} color="inherit">
            Close
          </Button>

          {/* Draft actions */}
          {inv?.status === "draft" && (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => setShowCancelForm(true)}
              >
                Cancel Invoice
              </Button>
              <Button
                variant="contained"
                startIcon={
                  isIssuing ? <CircularProgress size={16} /> : <SendIcon />
                }
                onClick={handleIssue}
                disabled={isIssuing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Issue Invoice
              </Button>
            </>
          )}

          {/* Sent / Overdue actions */}
          {(inv?.status === "sent" || inv?.status === "overdue") && (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => setShowCancelForm(true)}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<PaymentIcon />}
                onClick={() => setShowPaymentForm(true)}
              >
                Record Payment
              </Button>
            </>
          )}

          {/* Partially paid actions */}
          {inv?.status === "partially_paid" && (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => setShowCancelForm(true)}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<PaymentIcon />}
                onClick={() => setShowPaymentForm(true)}
              >
                Record Payment
              </Button>
            </>
          )}

          {/* Download PDF — opens preview modal first */}
          {inv?.status && inv.status !== "draft" && (
            <Button
              variant="outlined"
              startIcon={<PictureAsPdfIcon />}
              onClick={() => setPdfPreviewOpen(true)}
            >
              Download PDF
            </Button>
          )}

          {/* Delete Permanently — only for draft or cancelled invoices */}
          {(inv?.status === "draft" || inv?.status === "cancelled") && (
            <Button
              variant="outlined"
              color="error"
              startIcon={isDeleting ? <CircularProgress size={16} /> : <DeleteIcon />}
              onClick={handleDeleteInvoice}
              disabled={isDeleting}
            >
              Delete Permanently
            </Button>
          )}

          {/* Edit Invoice — self-service correction, any non-voided invoice */}
          {!inv?.isVoided && hasPermission("billing", "edit") && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditInvoiceOpen(true)}
              sx={{ borderColor: "#7c3aed", color: "#7c3aed", "&:hover": { borderColor: "#6d28d9", bgcolor: "#f5f3ff" } }}
            >
              Edit Invoice
            </Button>
          )}

          {/* Void Invoice — works even on paid invoices, unlike Cancel above */}
          {!inv?.isVoided && hasPermission("billing", "delete") && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<BlockIcon />}
              onClick={() => setShowVoidForm(true)}
            >
              Void Invoice
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>

    <EditInvoiceModal
      open={editInvoiceOpen}
      onClose={() => setEditInvoiceOpen(false)}
      invoice={inv}
      onSuccess={() => {
        setEditInvoiceOpen(false);
        refetchInvoice();
        onRefresh?.();
      }}
    />

    <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle className="flex items-center justify-between">
        Correction History
        <IconButton onClick={() => setHistoryOpen(false)} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {(inv?.editHistory || []).slice().reverse().map((entry, idx) => (
          <Paper key={idx} variant="outlined" className="p-3 mb-2">
            <Typography variant="caption" className="text-gray-500 block">
              {formatDate(entry.editedAt)} by {entry.editedBy?.name || "admin"}
            </Typography>
            <Typography variant="body2" className="font-medium mb-1">
              {entry.reason}
            </Typography>
            <Typography variant="caption" className="text-gray-600 font-mono break-all">
              {JSON.stringify(entry.changes)}
            </Typography>
          </Paper>
        ))}
        {!(inv?.editHistory || []).length && (
          <Typography variant="body2" className="text-gray-500">No corrections recorded.</Typography>
        )}
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      open={issueConfirmOpen}
      onClose={() => setIssueConfirmOpen(false)}
      onConfirm={doIssue}
      title="Issue Invoice"
      message="Issue this invoice? It cannot be edited after issuing."
      confirmText="Issue Invoice"
      confirmColor="primary"
    />
    <ConfirmDialog
      open={deleteConfirmOpen}
      onClose={() => setDeleteConfirmOpen(false)}
      onConfirm={doDeleteInvoice}
      title="Delete Invoice"
      message="Permanently delete this invoice? This action cannot be undone."
      confirmText="Delete Permanently"
      confirmColor="error"
      loading={isDeleting}
    />
    <InvoicePreviewModal
      open={pdfPreviewOpen}
      onClose={() => setPdfPreviewOpen(false)}
      invoice={inv}
    />
    </>
  );
};

export default InvoiceDetailModal;
