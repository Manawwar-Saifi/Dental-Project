/**
 * Create Invoice Modal
 *
 * Modal for creating a new draft invoice with dynamic line items.
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
  MenuItem,
  IconButton,
  CircularProgress,
  Autocomplete,
  Divider,
  Paper,
  Chip,
} from "@mui/material";
import { toast } from "react-toastify";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { searchPatients } from "../../../api/admin/patients.api";
import { getMembershipPlans } from "../../../api/admin/memberships.api";
import { useClinics } from "../../../hooks/admin/useClinics";
import { useBillingMutations } from "../../../hooks/admin/useBilling";

/**
 * Line-item category options
 */
const itemTypeOptions = [
  { value: "surgery", label: "Surgery" },
  { value: "membership", label: "Membership" },
  { value: "test", label: "Test" },
  { value: "medicine", label: "Medicine" },
  { value: "other", label: "Other" },
];

/**
 * Payment method options for the initial payment captured on create
 */
const paymentMethodOptions = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI" },
  { value: "online", label: "Online" },
];

/**
 * Blank item template
 */
const blankItem = {
  itemType: "other",
  description: "",
  quantity: 1,
  unitPrice: "",
  discountPercent: 0,
  planId: "",
};

/**
 * Calculate line item total
 */
const calcItemTotal = (item) => {
  const qty = Number(item.quantity) || 0;
  const price = Number(item.unitPrice) || 0;
  const discPct = Number(item.discountPercent) || 0;

  let amount = qty * price;
  amount -= (amount * discPct) / 100;
  amount = Math.max(0, amount);
  return { amount, tax: 0, total: amount };
};

const CreateInvoiceModal = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    patient: null,
    clinic: "",
    items: [{ ...blankItem }],
    discountPercent: 0,
    amountPaid: "",
    paymentMethod: "cash",
    notes: "",
    terms: "",
  });
  const [patientSearch, setPatientSearch] = useState("");
  const [patientOptions, setPatientOptions] = useState([]);
  const [patientLoading, setPatientLoading] = useState(false);
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);

  const { data: clinicsData } = useClinics();
  const clinics = clinicsData?.data || [];
  const { createInvoiceAsync, isCreating } = useBillingMutations();

  // Set default clinic
  useEffect(() => {
    if (clinics.length > 0 && !formData.clinic) {
      setFormData((prev) => ({ ...prev, clinic: clinics[0]._id }));
    }
  }, [clinics, formData.clinic]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        patient: null,
        clinic: clinics[0]?._id || "",
        items: [{ ...blankItem }],
        discountPercent: 0,
        amountPaid: "",
        paymentMethod: "cash",
        notes: "",
        terms: "",
      });
      setPatientSearch("");
      setPatientOptions([]);
    }
  }, [open, clinics]);

  // Load active membership plans once when modal opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      try {
        setPlansLoading(true);
        const res = await getMembershipPlans();
        if (!cancelled) setMembershipPlans(res?.data?.plans || []);
      } catch {
        if (!cancelled) setMembershipPlans([]);
      } finally {
        if (!cancelled) setPlansLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [open]);

  // Search patients with debounce
  useEffect(() => {
    const searchAsync = async () => {
      if (patientSearch.length < 2) {
        setPatientOptions([]);
        return;
      }
      setPatientLoading(true);
      try {
        const res = await searchPatients(patientSearch);
        setPatientOptions(res.data?.patients || []);
      } catch {
        setPatientOptions([]);
      } finally {
        setPatientLoading(false);
      }
    };
    const timer = setTimeout(searchAsync, 300);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  // Item handlers
  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const items = [...prev.items];
      const updated = { ...items[index], [field]: value };
      // Category change clears the plan selection; description/price are unaffected
      // (they are always-visible editable fields, not driven by the plan dropdown)
      if (field === "itemType") {
        updated.planId = "";
      }
      items[index] = updated;
      return { ...prev, items };
    });
  };

  const handlePlanSelect = (index, planId) => {
    const plan = membershipPlans.find((p) => p._id === planId);
    setFormData((prev) => {
      const items = [...prev.items];
      items[index] = {
        ...items[index],
        planId,
        description: plan?.name ?? "",
        unitPrice: plan?.price ?? "",
      };
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { ...blankItem }],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length <= 1) {
      toast.error("At least one item is required");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Calculate totals
  const itemTotals = formData.items.map(calcItemTotal);
  const subtotal = itemTotals.reduce((sum, t) => sum + t.amount, 0);
  const totalTax = itemTotals.reduce((sum, t) => sum + t.tax, 0);
  const discountAmount = (subtotal * (Number(formData.discountPercent) || 0)) / 100;
  const grandTotal = subtotal - discountAmount + totalTax;

  // Auto-derived payment status (mirrors the backend's calculateTotals logic)
  const amountPaidNum = Number(formData.amountPaid) || 0;
  const balanceDue = Math.max(0, grandTotal - amountPaidNum);
  const computedPaymentStatus =
    grandTotal > 0 && amountPaidNum >= grandTotal
      ? { label: "Paid", color: "success" }
      : amountPaidNum > 0
      ? { label: "Partially Paid", color: "warning" }
      : { label: "Unpaid", color: "error" };

  // Submit
  const handleSubmit = async () => {
    if (!formData.patient) return toast.error("Please select a patient");
    if (!formData.clinic) return toast.error("Please select a clinic");
    if (formData.items.length === 0) return toast.error("Add at least one item");

    const invalidItem = formData.items.find((item) => {
      const price = Number(item.unitPrice);
      const disc = Number(item.discountPercent) || 0;
      return (
        !item.description.trim() ||
        !price || price <= 0 ||
        disc < 0 || disc > 100
      );
    });
    if (invalidItem)
      return toast.error("Each item needs a description, price > 0, and valid discount (0–100%)");

    const overallDiscount = Number(formData.discountPercent) || 0;
    if (overallDiscount < 0 || overallDiscount > 100)
      return toast.error("Overall discount must be between 0% and 100%");

    try {
      const data = {
        patient: formData.patient._id,
        clinic: formData.clinic,
        items: formData.items.map((item) => ({
          itemType: item.itemType,
          description: item.description.trim(),
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice),
          discount: { percentage: Number(item.discountPercent) || 0 },
        })),
        discount: {
          percentage: Number(formData.discountPercent) || 0,
        },
        amountPaid: amountPaidNum,
        ...(amountPaidNum > 0 ? { paymentMethod: formData.paymentMethod } : {}),
        notes: formData.notes || undefined,
        terms: formData.terms || undefined,
      };

      await createInvoiceAsync(data);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create invoice");
    }
  };

  const handleClose = () => {
    if (!isCreating) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ className: "rounded-xl" }}
    >
      {/* Header */}
      <DialogTitle className="bg-linear-to-r from-indigo-600 to-indigo-700 text-white py-2 px-3">
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-1.5">
            <ReceiptLongIcon fontSize="small" />
            <Typography variant="subtitle1" className="font-semibold">
              Create Invoice
            </Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={isCreating} size="small">
            <CloseIcon className="text-white" fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent className="p-4 mt-8">
        <Grid container spacing={2}>
          {/* Patient Search */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Autocomplete
              options={patientOptions}
              getOptionLabel={(option) =>
                option ? `${option.name} - ${option.phone}` : ""
              }
              value={formData.patient}
              onChange={(_, newValue) =>
                setFormData((prev) => ({ ...prev, patient: newValue }))
              }
              onInputChange={(_, newInput) => setPatientSearch(newInput)}
              loading={patientLoading}
              isOptionEqualToValue={(option, value) => option._id === value?._id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Patient *"
                  placeholder="Search by name or phone..."
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {patientLoading ? <CircularProgress size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option._id}>
                  <Box>
                    <Typography variant="body2" className="font-medium">
                      {option.name}
                    </Typography>
                    <Typography variant="caption" className="text-gray-500">
                      {option.phone}
                    </Typography>
                  </Box>
                </Box>
              )}
              noOptionsText={
                patientSearch.length < 2
                  ? "Type at least 2 characters to search"
                  : "No patients found"
              }
            />
          </Grid>

          {/* Clinic */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="Clinic *"
              value={formData.clinic}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, clinic: e.target.value }))
              }
              size="small"
            >
              {clinics.map((clinic) => (
                <MenuItem key={clinic._id} value={clinic._id}>
                  {clinic.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Items Section */}
          <Grid size={{ xs: 12 }}>
            <Divider className="my-2" />
            <Box className="flex items-center justify-between mb-2 mt-1.5">
              <Typography variant="body2" className="font-semibold text-gray-700">
                Line Items
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={addItem}
                variant="outlined"
                sx={{ textTransform: "none", fontSize: "12px", height: 30 }}
              >
                Add Item
              </Button>
            </Box>

            {formData.items.map((item, index) => (
              <Box
                key={index}
                sx={{ border: "1px solid #e5e7eb", borderRadius: "6px", p: 1.5, mb: 1.5 }}
              >
                <Grid container spacing={1.5} alignItems="center">
                  {/* Type */}
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      select
                      fullWidth
                      label="Category"
                      value={item.itemType}
                      onChange={(e) =>
                        handleItemChange(index, "itemType", e.target.value)
                      }
                      size="small"
                    >
                      {itemTypeOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </TextField>
                    {index === 0 && (
                      <Typography variant="caption" sx={{ color: "#6b7280", display: "block", mt: 0.5, lineHeight: 1.3 }}>
                        Excluding Appointment and Treatment (created automatically at booking).
                      </Typography>
                    )}
                  </Grid>

                  {/* Description */}
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      label="Description *"
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(index, "description", e.target.value)
                      }
                      size="small"
                      placeholder="e.g., Root Canal Treatment"
                    />
                  </Grid>

                  {/* Unit Price */}
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      label="Price (₹) *"
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleItemChange(index, "unitPrice", e.target.value)
                      }
                      size="small"
                      inputProps={{ min: 0 }}
                    />
                  </Grid>

                  {/* Discount */}
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      label="Disc %"
                      type="number"
                      value={item.discountPercent}
                      onChange={(e) =>
                        handleItemChange(index, "discountPercent", e.target.value)
                      }
                      size="small"
                      inputProps={{ min: 0, max: 100 }}
                    />
                  </Grid>

                  {/* Membership plan quick-fill — second sub-row, only when Category = Membership */}
                  {item.itemType === "membership" && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        fullWidth
                        label="Select Plan"
                        value={item.planId || ""}
                        onChange={(e) => handlePlanSelect(index, e.target.value)}
                        size="small"
                        disabled={plansLoading}
                        helperText="Auto-fills Description and Price above"
                      >
                        <MenuItem value="" disabled>Choose a plan to auto-fill…</MenuItem>
                        {plansLoading ? (
                          <MenuItem value="" disabled>Loading…</MenuItem>
                        ) : membershipPlans.length === 0 ? (
                          <MenuItem value="" disabled>No active plans found</MenuItem>
                        ) : (
                          membershipPlans.map((plan) => (
                            <MenuItem key={plan._id} value={plan._id}>
                              {plan.name} — ₹{plan.price?.toLocaleString("en-IN")}
                            </MenuItem>
                          ))
                        )}
                      </TextField>
                    </Grid>
                  )}

                  {/* Line Total + Delete */}
                  <Grid size={{ xs: 12 }}>
                    <Box className="flex items-center justify-between">
                      <Typography
                        variant="body2"
                        className="font-numbers font-semibold text-green-600"
                      >
                        ₹{itemTotals[index]?.total.toLocaleString("en-IN", { maximumFractionDigits: 2 }) || "0"}
                      </Typography>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeItem(index)}
                        disabled={formData.items.length <= 1}
                        sx={{ p: 0.5 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Grid>

          {/* Totals Preview */}
          <Grid size={{ xs: 12 }}>
            <Box className="flex justify-end">
              <Paper variant="outlined" className="p-2.5 min-w-60">
                <Box className="flex justify-between mb-1">
                  <Typography variant="body2" className="text-gray-600">
                    Subtotal:
                  </Typography>
                  <Typography variant="body2" className="font-numbers">
                    ₹{subtotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
                {Number(formData.discountPercent) > 0 && (
                  <Box className="flex justify-between mb-1">
                    <Typography variant="body2" className="text-gray-600">
                      Discount ({formData.discountPercent}%):
                    </Typography>
                    <Typography variant="body2" className="font-numbers text-red-500">
                      -₹{discountAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                )}
                <Divider className="my-2" />
                <Box className="flex justify-between mt-1">
                  <Typography variant="subtitle2" className="font-bold">
                    Grand Total:
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    className="font-numbers font-bold text-green-600"
                  >
                    ₹{grandTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Grid>

          {/* Payment (optional, captured at creation) */}
          {/* <Grid size={{ xs: 12 }}>
            <Divider className="my-2" />
            <Typography variant="subtitle1" className="font-semibold mb-3">
              Payment
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Amount Paid (₹)"
                  type="number"
                  value={formData.amountPaid}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, amountPaid: e.target.value }))
                  }
                  size="small"
                  inputProps={{ min: 0 }}
                  helperText="Leave blank/0 if unpaid"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Payment Method"
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, paymentMethod: e.target.value }))
                  }
                  size="small"
                  disabled={amountPaidNum <= 0}
                >
                  {paymentMethodOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box className="flex items-center gap-2">
                  <Typography variant="body2" className="text-gray-600">
                    Status:
                  </Typography>
                  <Chip
                    label={computedPaymentStatus.label}
                    color={computedPaymentStatus.color}
                    size="small"
                  />
                  {amountPaidNum > 0 && balanceDue > 0 && (
                    <Typography variant="caption" className="font-numbers text-gray-500">
                      Balance ₹{balanceDue.toLocaleString("en-IN")}
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Grid> */}

          {/* Overall Discount */}
          {/* <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Overall Discount %"
              type="number"
              value={formData.discountPercent}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  discountPercent: e.target.value,
                }))
              }
              size="small"
              inputProps={{ min: 0, max: 100 }}
              helperText="Applied on subtotal"
            />
          </Grid> */}

          {/* Notes */}
          {/* <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              size="small"
              multiline
              rows={2}
              placeholder="Internal notes..."
            />
          </Grid> */}

          {/* Terms */}
          {/* <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Terms & Conditions"
              value={formData.terms}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, terms: e.target.value }))
              }
              size="small"
              multiline
              rows={2}
              placeholder="Payment terms..."
            />
          </Grid> */}
        </Grid>
      </DialogContent>

      {/* Actions */}
      <DialogActions className="px-4 py-2 bg-gray-50">
        <Button onClick={handleClose} color="inherit" disabled={isCreating} size="small">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isCreating}
          size="small"
          className="bg-indigo-600 hover:bg-indigo-700"
          startIcon={
            isCreating ? <CircularProgress size={14} /> : <ReceiptLongIcon fontSize="small" />
          }
          sx={{ textTransform: "none", fontSize: "13px" }}
        >
          {isCreating ? "Creating..." : "Create Draft Invoice"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateInvoiceModal;
