/**
 * Patient Invoices Page
 *
 * Lists the logged-in patient's invoices and opens a detail dialog with the
 * full line-item breakdown. All data comes from the IDOR-protected
 * GET /patients/:id/invoices endpoint (invoices are embedded with items).
 */
import { useState, useEffect } from "react";
import { CLINIC_NAME } from "../../constants/clinic.js";
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
  TablePagination,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Divider,
  TextField,
  InputAdornment,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PaymentIcon from "@mui/icons-material/Payment";
import Tooltip from "@mui/material/Tooltip";
import { toast } from "react-toastify";
import { useMyInvoices } from "../../hooks/patient/useMyInvoices";
import { useAuthStore } from "../../store/auth.store";
import { createPendingOrder, verifyPendingPayment } from "../../api/patient/payments.api";
import InvoicePreviewModal from "../../components/InvoicePreviewModal";

const paymentStatusConfig = {
  unpaid: { color: "error", label: "Unpaid" },
  partial: { color: "warning", label: "Partially Paid" },
  paid: { color: "success", label: "Paid" },
};

const itemCategoryLabels = {
  treatment: "Treatment",
  surgery: "Surgery",
  test: "Test",
  opd_fee: "OPD Fee",
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

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (val) => `₹${(val || 0).toLocaleString("en-IN")}`;

/** Build a short items summary, e.g. "Root Canal, Medicine — 2 items". */
const itemsSummary = (items = []) => {
  if (!items.length) return "—";
  const names = items.map((i) => i.description).filter(Boolean);
  const shown = names.slice(0, 2).join(", ");
  const more = names.length > 2 ? "…" : "";
  return `${shown}${more} — ${items.length} item${items.length > 1 ? "s" : ""}`;
};

/** Detail row inside the dialog */
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

/* ── Pay Invoice Modal ──────────────────────────────────────────────── */

const PayInvoiceModal = ({ open, onClose, invoice, onSuccess }) => {
  const patient = useAuthStore((s) => s.patient);
  const [enteredAmount, setEnteredAmount] = useState(0);
  const [inputError, setInputError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && invoice) {
      setEnteredAmount(invoice.balanceDue || 0);
      setInputError("");
      setLoading(false);
    }
  }, [open, invoice]);

  if (!invoice) return null;

  const balanceDue = invoice.balanceDue || 0;

  const handleAmountChange = (e) => {
    const val = Number(e.target.value);
    setEnteredAmount(val);
    if (!val || val <= 0) {
      setInputError("Amount must be greater than ₹0");
    } else if (val > balanceDue) {
      setInputError(`Cannot exceed balance due of ${formatCurrency(balanceDue)}`);
    } else {
      setInputError("");
    }
  };

  const handlePay = async () => {
    if (!enteredAmount || enteredAmount <= 0 || enteredAmount > balanceDue || inputError) return;
    setLoading(true);
    try {
      const orderData = await createPendingOrder(enteredAmount, invoice._id);
      const options = {
        key: orderData.data.keyId,
        amount: Math.round(orderData.data.amount * 100),
        currency: "INR",
        name: "Dental Clinic",
        description: `Payment for ${invoice.invoiceNumber}`,
        order_id: orderData.data.orderId,
        handler: async (paymentResponse) => {
          // Blur before closing the dialog so no button inside the MUI Dialog
          // retains focus while MUI applies aria-hidden to the portal root.
          document.activeElement?.blur();
          try {
            await verifyPendingPayment({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });
            toast.success("Payment successful! Invoice updated.");
            onSuccess();
            onClose();
          } catch (err) {
            toast.error(err?.response?.data?.message || "Payment verification failed");
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: patient?.name || "",
          email: patient?.email || "",
          contact: patient?.phone || "",
        },
        theme: { color: "#f59e0b" },
        modal: {
          ondismiss: () => {
            document.activeElement?.blur();
            setLoading(false);
          },
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        document.activeElement?.blur();
        toast.error("Payment failed. Please try again.");
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to initiate payment");
      setLoading(false);
    }
  };

  const isInvalid = !enteredAmount || enteredAmount <= 0 || enteredAmount > balanceDue || !!inputError;

  return (
    <Dialog open={open} onClose={!loading ? onClose : undefined} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Typography variant="h6" component="span" fontWeight={700}>Pay Invoice</Typography>
        <IconButton onClick={onClose} size="small" disabled={loading}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ bgcolor: "#f9fafb", borderRadius: 1, p: 1.5, mb: 2 }}>
          <InfoRow label="Invoice #">{invoice.invoiceNumber || "—"}</InfoRow>
          <InfoRow label="Grand Total">{formatCurrency(invoice.grandTotal)}</InfoRow>
          <InfoRow label="Already Paid">{formatCurrency(invoice.amountPaid)}</InfoRow>
          <InfoRow label="Balance Due">
            <span style={{ color: "#dc2626", fontWeight: 700 }}>{formatCurrency(balanceDue)}</span>
          </InfoRow>
        </Box>
        <TextField
          fullWidth
          type="number"
          label="Amount to Pay"
          value={enteredAmount}
          onChange={handleAmountChange}
          error={!!inputError}
          helperText={inputError || `Min ₹1 — Max ${formatCurrency(balanceDue)}`}
          disabled={loading}
          InputProps={{
            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
          }}
          inputProps={{ min: 1, max: balanceDue, step: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handlePay}
          disabled={isInvalid || loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PaymentIcon />}
          sx={{ bgcolor: "#f59e0b", color: "#fff", "&:hover": { bgcolor: "#d97706" } }}
        >
          {loading ? "Processing…" : `Pay ${formatCurrency(enteredAmount)}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const InvoiceDetailDialog = ({ invoice, open, onClose, onPayNow }) => {
  if (!invoice) return null;
  const pay = paymentStatusConfig[invoice.paymentStatus] || paymentStatusConfig.unpaid;

  // Pre-discount total: sum of unit prices before any discount is applied.
  // invoice.subtotal is already post-item-discount, so we recompute from unitPrice.
  const originalSubtotal = (invoice.items || []).reduce(
    (sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 1), 0
  );
  // Item-level discount (e.g. membership applied per line by generateInvoice)
  const itemLevelDiscount = Math.round(originalSubtotal - (invoice.subtotal || 0));
  // Invoice-level discount (additional overall discount, usually 0 for memberships)
  const invoiceLevelDiscountAmt = (invoice.discount?.percentage || 0) > 0
    ? Math.round(((invoice.subtotal || 0) * invoice.discount.percentage) / 100)
    : (invoice.discount?.amount || 0);
  const totalDiscount = itemLevelDiscount + invoiceLevelDiscountAmt;
  // Build a human-readable label for the discount row
  const discountItemPct = (invoice.items || []).find(i => (i.discount?.percentage || 0) > 0)?.discount?.percentage;
  const discountLabel = discountItemPct
    ? `Membership Discount (${discountItemPct}%)`
    : (invoice.discount?.percentage || 0) > 0
      ? `Discount (${invoice.discount.percentage}%)`
      : "Discount";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ className: "rounded-xl" }}>
      <DialogTitle className="bg-navy text-white">
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-3">
            <ReceiptLongIcon />
            <Box>
              <Typography variant="h6" component="span" className="font-bold">
                {invoice.invoiceNumber || "Invoice"}
              </Typography>
              <Typography variant="caption" className="text-white/80">
                {formatDate(invoice.invoiceDate)}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon className="text-white" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent className="p-6">
        {/* Line Items */}
        <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-2 mt-2">
          Line Items
        </Typography>
        <TableContainer component={Paper} variant="outlined" className="mb-4">
          <Table size="small">
            <TableHead>
              <TableRow className="bg-gray-50">
                <TableCell className="font-semibold">#</TableCell>
                <TableCell className="font-semibold">Description</TableCell>
                <TableCell className="font-semibold">Category</TableCell>
                <TableCell align="right" className="font-semibold">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(invoice.items || []).map((item, idx) => (
                <TableRow key={item._id || idx} hover>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>
                    <Chip
                      label={itemCategoryLabels[item.itemType] || item.itemType}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right" className="font-numbers font-medium">
                    {formatCurrency((item.unitPrice || 0) * (item.quantity || 1))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Totals */}
        <Box className="flex justify-end">
          <Paper variant="outlined" className="p-4 min-w-[280px]">
            <InfoRow label="Subtotal">
              <span className="font-numbers">{formatCurrency(originalSubtotal)}</span>
            </InfoRow>
            {totalDiscount > 0 && (
              <InfoRow label={discountLabel}>
                <span className="font-numbers text-orange-600 font-medium">
                  -{formatCurrency(totalDiscount)}
                </span>
              </InfoRow>
            )}
            {invoice.totalTax > 0 && (
              <InfoRow label="Tax">
                <span className="font-numbers">{formatCurrency(invoice.totalTax)}</span>
              </InfoRow>
            )}
            <Divider className="my-2" />
            <InfoRow label="Grand Total">
              <span className="font-numbers text-lg font-bold">
                {formatCurrency(invoice.grandTotal)}
              </span>
            </InfoRow>
            <InfoRow label="Amount Paid">
              <span className="font-numbers text-green-600 font-medium">
                {formatCurrency(invoice.amountPaid)}
              </span>
            </InfoRow>
            {invoice.paymentMethod && (
              <InfoRow label="Payment Method">
                {paymentMethodLabels[invoice.paymentMethod] || invoice.paymentMethod}
              </InfoRow>
            )}
            <Divider className="my-1" />
            <InfoRow label="Balance Due">
              <span
                className={`font-numbers font-bold ${invoice.balanceDue > 0 ? "text-red-600" : "text-green-600"}`}
              >
                {formatCurrency(invoice.balanceDue)}
              </span>
            </InfoRow>
            <Box className="flex justify-end mt-3">
              <Chip label={pay.label} color={pay.color} size="small" />
            </Box>
          </Paper>
        </Box>

        <Typography variant="caption" className="block text-center text-gray-500 mt-4">
          {CLINIC_NAME}
        </Typography>

        {invoice.notes && (
          <Paper className="p-3 mt-4 bg-yellow-50 border border-yellow-200">
            <Typography variant="caption" className="text-yellow-800 font-semibold block">
              Notes
            </Typography>
            <Typography variant="body2" className="text-yellow-900">
              {invoice.notes}
            </Typography>
          </Paper>
        )}
      </DialogContent>

      <DialogActions className="p-4 bg-gray-50">
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        {invoice.balanceDue > 0 && invoice.paymentStatus !== "paid" && (
          <Button
            variant="contained"
            startIcon={<PaymentIcon />}
            onClick={onPayNow}
            sx={{ bgcolor: "#f59e0b", color: "#fff", "&:hover": { bgcolor: "#d97706" } }}
          >
            Pay Now
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const Invoices = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [payInvoiceOpen, setPayInvoiceOpen] = useState(false);
  const [payInvoice, setPayInvoice] = useState(null);

  const { data, isLoading, error, refetch } = useMyInvoices({ page, limit });

  const invoices = data?.data || [];
  const pagination = data?.pagination || { total: 0 };

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Invoices
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View your bills and payment status
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="h6" fontWeight="bold">
              Your Invoices
            </Typography>
          </Box>

          {isLoading ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }} color="text.secondary">
                Loading invoices...
              </Typography>
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography color="error">Failed to load invoices. Please try again.</Typography>
            </Box>
          ) : invoices.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <ReceiptLongIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No invoices found
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Your invoices will appear here
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} elevation={0}>
                <Table sx={{ bgcolor: "white", minWidth: "max-content" }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Items</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Paid</TableCell>
                      <TableCell align="right">Balance</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.map((invoice) => {
                      const pay =
                        paymentStatusConfig[invoice.paymentStatus] || paymentStatusConfig.unpaid;
                      return (
                        <TableRow
                          key={invoice._id}
                          hover
                          sx={{ cursor: "pointer" }}
                          onClick={() => setSelected(invoice)}
                        >
                          <TableCell>
                            <Typography variant="body2" className="font-mono text-xs" fontWeight="medium">
                              {invoice.invoiceNumber || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{formatDate(invoice.invoiceDate)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {itemsSummary(invoice.items)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold" className="font-numbers">
                              {formatCurrency(invoice.grandTotal)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" className="font-numbers text-green-600">
                              {formatCurrency(invoice.amountPaid)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              className={`font-numbers ${invoice.balanceDue > 0 ? "text-red-600" : "text-gray-400"}`}
                              fontWeight={invoice.balanceDue > 0 ? "bold" : "normal"}
                            >
                              {invoice.balanceDue > 0 ? formatCurrency(invoice.balanceDue) : "—"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={pay.label} size="small" color={pay.color} />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                              {invoice.balanceDue > 0 && invoice.paymentStatus !== "paid" && (
                                <Tooltip title="Pay Now">
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPayInvoice(invoice);
                                      setPayInvoiceOpen(true);
                                    }}
                                    sx={{
                                      bgcolor: "#f59e0b",
                                      color: "#fff",
                                      "&:hover": { bgcolor: "#d97706" },
                                      minWidth: "auto",
                                      px: 1,
                                      py: 0.5,
                                      fontSize: "0.7rem",
                                      fontWeight: 700,
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    Pay
                                  </Button>
                                </Tooltip>
                              )}
                              <Tooltip title="Preview Invoice">
                                <IconButton
                                  size="small"
                                  sx={{ color: "#e06c00" }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewInvoice(invoice);
                                    setPreviewOpen(true);
                                  }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              {pagination.total > limit && (
                <TablePagination
                  component="div"
                  count={pagination.total}
                  page={page - 1}
                  onPageChange={(_, p) => setPage(p + 1)}
                  rowsPerPage={limit}
                  onRowsPerPageChange={(e) => {
                    setLimit(parseInt(e.target.value, 10));
                    setPage(1);
                  }}
                  rowsPerPageOptions={[10, 25, 50]}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <InvoiceDetailDialog
        invoice={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onPayNow={() => {
          setPayInvoice(selected);
          setPayInvoiceOpen(true);
          setSelected(null);
        }}
      />

      <InvoicePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        invoice={previewInvoice}
      />

      <PayInvoiceModal
        open={payInvoiceOpen}
        onClose={() => setPayInvoiceOpen(false)}
        invoice={payInvoice}
        onSuccess={() => {
          setPayInvoiceOpen(false);
          refetch();
        }}
      />
    </Box>
  );
};

export default Invoices;
