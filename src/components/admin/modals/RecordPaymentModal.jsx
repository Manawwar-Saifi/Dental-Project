/**
 * Record Payment Modal
 *
 * Modal for recording a new payment for a patient.
 */
import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import PaymentIcon from "@mui/icons-material/Payment";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "react-toastify";
import api from "../../../api/axios";
import { useClinics } from "../../../hooks/admin/useClinics";

/**
 * Payment modes
 */
const paymentModes = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "netbanking", label: "Net Banking" },
];

/**
 * Payment types
 */
const paymentTypes = [
  { value: "opd_fee", label: "Appointment Fee" },
  { value: "consultation", label: "Consultation" },
  { value: "treatment", label: "Treatment" },
  { value: "test", label: "Test/Investigation" },
  { value: "membership", label: "Membership" },
  { value: "other", label: "Other" },
];

const RecordPaymentModal = ({ open, onClose, patient, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: "",
    paymentMode: "cash",
    type: "opd_fee",
    clinic: "",
    referenceNumber: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dueAmount, setDueAmount] = useState(0);
  const [fetchingDue, setFetchingDue] = useState(false);

  // Fetch clinics
  const { data: clinicsData } = useClinics();
  const clinics = clinicsData?.data || [];

  // Set default clinic when clinics load
  useEffect(() => {
    if (clinics.length > 0 && !formData.clinic) {
      setFormData((prev) => ({ ...prev, clinic: clinics[0]._id }));
    }
  }, [clinics]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        amount: "",
        paymentMode: "cash",
        type: "opd_fee",
        clinic: clinics[0]?._id || "",
        referenceNumber: "",
        notes: "",
      });
      setDueAmount(0);
    }
  }, [open]);

  // Auto-fetch patient's total pending due when modal opens
  useEffect(() => {
    if (!open || !patient?._id) return;
    setFetchingDue(true);
    api
      .get(`/billing/patient/${patient._id}/pending-amount`)
      .then((res) => {
        const due = res.data?.pendingAmount || 0;
        setDueAmount(due);
        if (due > 0) {
          setFormData((prev) => ({ ...prev, amount: String(due) }));
        }
      })
      .catch((err) => {
        console.error("[RecordPayment] due fetch failed:", err);
        setDueAmount(0);
      })
      .finally(() => setFetchingDue(false));
  }, [open, patient?._id]);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!formData.clinic) {
      toast.error("Please select a clinic");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = {
        patient: patient._id,
        amount: Number(formData.amount),
        paymentMode: formData.paymentMode,
        type: formData.type,
        clinic: formData.clinic,
        referenceNumber: formData.referenceNumber || undefined,
        notes: formData.notes || undefined,
      };

      await api.post("/payments", data);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!patient) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "rounded-xl" }}
    >
      {/* Header */}
      <DialogTitle className="bg-linear-to-r from-green-600 to-green-700 text-white">
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <PaymentIcon />
            <Typography variant="h6" component="span" className="font-bold">
              Record Payment
            </Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={isSubmitting}>
            <CloseIcon className="text-white" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent className="p-6 mt-4">
        {/* Patient Info */}
        <Box className="bg-gray-50 rounded-lg p-4 mb-4">
          <Typography variant="subtitle2" className="font-semibold text-gray-700">
            Patient
          </Typography>
          <Typography variant="body2">
            {patient.name} - {patient.phone}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Amount */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Amount (₹) *"
              type="number"
              value={formData.amount}
              onChange={handleChange("amount")}
              placeholder="e.g., 500"
              size="small"
              inputProps={{ min: 1 }}
              helperText={
                fetchingDue
                  ? "Fetching due amount…"
                  : dueAmount > 0
                  ? `Total due: ₹${dueAmount.toLocaleString("en-IN")}`
                  : "No pending dues"
              }
            />
          </Grid>

          {/* Payment Mode */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="Payment Mode *"
              value={formData.paymentMode}
              onChange={handleChange("paymentMode")}
              size="small"
            >
              {paymentModes.map((mode) => (
                <MenuItem key={mode.value} value={mode.value}>
                  {mode.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Payment Type */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="Payment Type"
              value={formData.type}
              onChange={handleChange("type")}
              size="small"
            >
              {paymentTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Clinic */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="Clinic *"
              value={formData.clinic}
              onChange={handleChange("clinic")}
              size="small"
            >
              {clinics.map((clinic) => (
                <MenuItem key={clinic._id} value={clinic._id}>
                  {clinic.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Reference Number (for UPI/Card) */}
          {(formData.paymentMode === "upi" ||
            formData.paymentMode === "card" ||
            formData.paymentMode === "netbanking") && (
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Reference/Transaction Number"
                value={formData.referenceNumber}
                onChange={handleChange("referenceNumber")}
                placeholder="e.g., TXN123456"
                size="small"
              />
            </Grid>
          )}

          {/* Notes */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Notes"
              value={formData.notes}
              onChange={handleChange("notes")}
              placeholder="Any additional notes..."
              size="small"
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </DialogContent>

      {/* Actions */}
      <DialogActions className="p-4 bg-gray-50">
        <Button onClick={handleClose} color="inherit" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-green-600 hover:bg-green-700"
          startIcon={isSubmitting ? <CircularProgress size={16} /> : <AddIcon />}
        >
          {isSubmitting ? "Recording..." : "Record Payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecordPaymentModal;
