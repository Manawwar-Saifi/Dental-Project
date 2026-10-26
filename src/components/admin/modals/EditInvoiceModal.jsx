/**
 * Edit Invoice Modal — self-service correction tool.
 *
 * Pre-filled with the invoice's current items/discount/amountPaid, editable,
 * with a required "Reason for correction" field. Submits to
 * PATCH /billing/invoices/:id/correct, which recomputes totals server-side
 * via updateOne/$set (never a document .save()), and logs the change to the
 * invoice's editHistory for full auditability.
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
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { toast } from "react-toastify";
import { useBillingMutations } from "../../../hooks/admin/useBilling";

const itemTypeOptions = [
  { value: "treatment", label: "Treatment" },
  { value: "surgery", label: "Surgery" },
  { value: "test", label: "Test" },
  { value: "opd_fee", label: "Appointment Fee" },
  { value: "membership", label: "Membership" },
  { value: "medicine", label: "Medicine" },
  { value: "other", label: "Other" },
];

const emptyItem = () => ({
  itemType: "other",
  description: "",
  quantity: 1,
  unitPrice: 0,
  discount: { percentage: 0, amount: 0 },
  taxRate: 0,
});

const formatCurrency = (v) => `₹${(Number(v) || 0).toLocaleString("en-IN")}`;

const EditInvoiceModal = ({ open, onClose, invoice, onSuccess }) => {
  const [items, setItems] = useState([]);
  const [discountPct, setDiscountPct] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [reason, setReason] = useState("");

  const { correctInvoice, isCorrecting } = useBillingMutations();

  useEffect(() => {
    if (open && invoice) {
      setItems(
        (invoice.items || []).map((it) => ({
          itemType: it.itemType,
          description: it.description,
          quantity: it.quantity || 1,
          unitPrice: it.unitPrice || 0,
          discount: { percentage: it.discount?.percentage || 0, amount: it.discount?.amount || 0 },
          taxRate: it.taxRate || 0,
        }))
      );
      setDiscountPct(invoice.discount?.percentage || 0);
      setAmountPaid(invoice.amountPaid || 0);
      setReason("");
    }
  }, [open, invoice]);

  if (!invoice) return null;

  const updateItem = (idx, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      if (field === "discountPct") {
        next[idx] = { ...next[idx], discount: { ...next[idx].discount, percentage: Number(value) || 0 } };
      } else {
        next[idx] = { ...next[idx], [field]: field === "description" || field === "itemType" ? value : Number(value) };
      }
      return next;
    });
  };

  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  // Live preview of the recalculation (mirrors the backend's math exactly).
  const previewItems = items.map((it) => {
    let amount = (it.unitPrice || 0) * (it.quantity || 1);
    if (it.discount?.percentage > 0) amount -= (amount * it.discount.percentage) / 100;
    if (it.discount?.amount > 0) amount -= it.discount.amount;
    amount = Math.max(0, amount);
    const taxAmount = (amount * (it.taxRate || 0)) / 100;
    return { ...it, amount, taxAmount, total: amount + taxAmount };
  });
  const subtotal = previewItems.reduce((s, it) => s + it.amount, 0);
  const totalTax = previewItems.reduce((s, it) => s + it.taxAmount, 0);
  let discountedSubtotal = subtotal;
  if (discountPct > 0) discountedSubtotal -= (discountedSubtotal * discountPct) / 100;
  const grandTotal = Math.max(0, Math.round(discountedSubtotal + totalTax));
  const balanceDue = Math.max(0, grandTotal - (Number(amountPaid) || 0));

  const handleSubmit = () => {
    if (isCorrecting) return;
    if (!reason.trim() || reason.trim().length < 10) {
      return toast.error("Please provide a reason of at least 10 characters");
    }
    if (!items.length) return toast.error("At least one line item is required");
    if (items.some((it) => !it.description?.trim())) {
      return toast.error("Every line item needs a description");
    }

    correctInvoice(
      {
        id: invoice._id,
        data: {
          items,
          discount: { percentage: discountPct, amount: 0 },
          amountPaid: Number(amountPaid) || 0,
          reason: reason.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success("Invoice corrected");
          onSuccess?.();
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to correct invoice"),
      }
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ className: "rounded-xl" }}>
      <DialogTitle className="bg-linear-to-r from-purple-600 to-purple-700 text-white">
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <EditIcon />
            <Typography variant="h6" component="span" className="font-bold">
              Edit Invoice — {invoice.invoiceNumber}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon className="text-white" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent className="p-6 mt-2">
        <Alert severity="warning" className="mb-4">
          This directly corrects financial totals. A reason is required and every change is logged
          to the invoice's audit trail.
        </Alert>

        <TableContainer component={Paper} variant="outlined" className="mb-3">
          <Table size="small">
            <TableHead>
              <TableRow className="bg-gray-50">
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right" sx={{ width: 90 }}>Qty</TableCell>
                <TableCell align="right" sx={{ width: 120 }}>Unit Price</TableCell>
                <TableCell align="right" sx={{ width: 90 }}>Disc %</TableCell>
                <TableCell align="right" sx={{ width: 110 }}>Amount</TableCell>
                <TableCell sx={{ width: 50 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={item.itemType}
                      onChange={(e) => updateItem(idx, "itemType", e.target.value)}
                      sx={{ minWidth: 130 }}
                    >
                      {itemTypeOptions.map((o) => (
                        <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      fullWidth
                      value={item.description}
                      onChange={(e) => updateItem(idx, "description", e.target.value)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                      inputProps={{ min: 1, style: { textAlign: "right" } }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                      inputProps={{ min: 0, style: { textAlign: "right" } }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      value={item.discount?.percentage || 0}
                      onChange={(e) => updateItem(idx, "discountPct", e.target.value)}
                      inputProps={{ min: 0, max: 100, style: { textAlign: "right" } }}
                    />
                  </TableCell>
                  <TableCell align="right" className="font-numbers">
                    {formatCurrency(previewItems[idx]?.amount)}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => removeItem(idx)} disabled={items.length <= 1}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Button size="small" startIcon={<AddIcon />} onClick={addItem} sx={{ mb: 3 }}>
          Add Line Item
        </Button>

        <Box className="flex flex-wrap gap-3 mb-3">
          <TextField
            label="Overall Discount %"
            type="number"
            size="small"
            value={discountPct}
            onChange={(e) => setDiscountPct(Number(e.target.value) || 0)}
            inputProps={{ min: 0, max: 100 }}
          />
          <TextField
            label="Amount Paid"
            type="number"
            size="small"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            inputProps={{ min: 0 }}
          />
        </Box>

        <Paper variant="outlined" className="p-3 mb-3 bg-gray-50">
          <Box className="flex justify-between text-sm mb-1">
            <span>Subtotal</span>
            <span className="font-numbers">{formatCurrency(subtotal)}</span>
          </Box>
          <Box className="flex justify-between text-sm mb-1">
            <span>Grand Total</span>
            <span className="font-numbers font-bold">{formatCurrency(grandTotal)}</span>
          </Box>
          <Box className="flex justify-between text-sm">
            <span>Balance Due</span>
            <span className={`font-numbers font-bold ${balanceDue > 0 ? "text-red-600" : "text-green-600"}`}>
              {formatCurrency(balanceDue)}
            </span>
          </Box>
        </Paper>

        <TextField
          label="Reason for correction (min 10 characters)"
          multiline
          minRows={2}
          fullWidth
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why is this invoice being corrected?"
          required
        />
      </DialogContent>

      <DialogActions className="p-4 bg-gray-50">
        <Button onClick={onClose} color="inherit" disabled={isCorrecting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isCorrecting || reason.trim().length < 10}
          startIcon={isCorrecting ? <CircularProgress size={16} color="inherit" /> : <EditIcon />}
          sx={{ bgcolor: "#7c3aed", "&:hover": { bgcolor: "#6d28d9" } }}
        >
          Save Correction
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditInvoiceModal;
