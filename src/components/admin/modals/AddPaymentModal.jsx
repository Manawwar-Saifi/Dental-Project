/**
 * Add Payment Modal
 *
 * Modal for recording a new payment with patient search.
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
} from "@mui/material";
import { toast } from "react-toastify";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import PaymentIcon from "@mui/icons-material/Payment";
import AddIcon from "@mui/icons-material/Add";
import api from "../../../api/axios";
import { searchPatients } from "../../../api/admin/patients.api";
import { useClinics } from "../../../hooks/admin/useClinics";
import { usePaymentMutations } from "../../../hooks/admin/usePayments";

/**
 * Payment modes
 */
const paymentModes = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "netbanking", label: "Net Banking" },
  { value: "other", label: "Other" },
];

/**
 * Payment types
 */
const paymentTypes = [
  { value: "opd_fee", label: "Appointment Fee" },
  { value: "consultation", label: "Consultation" },
  { value: "treatment", label: "Treatment" },
  { value: "test", label: "Test/Investigation" },
  { value: "invoice_payment", label: "Invoice Payment" },
  { value: "advance", label: "Advance Payment" },
  { value: "membership", label: "Membership" },
  { value: "other", label: "Other" },
];

const AddPaymentModal = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    patient: null,
    amount: "",
    paymentMode: "cash",
    type: "opd_fee",
    clinic: "",
    referenceNumber: "",
    notes: "",
  });
  const [patientSearch, setPatientSearch] = useState("");
  const [patientOptions, setPatientOptions] = useState([]);
  const [patientLoading, setPatientLoading] = useState(false);
  const [dueAmount, setDueAmount] = useState(0);
  const [fetchingDue, setFetchingDue] = useState(false);

  // Fetch clinics
  const { data: clinicsData } = useClinics();
  const clinics = clinicsData?.data || [];

  // Payment mutations
  const { createPayment, isCreating } = usePaymentMutations();

  // Set default clinic when clinics load
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
        amount: "",
        paymentMode: "cash",
        type: "opd_fee",
        clinic: clinics[0]?._id || "",
        referenceNumber: "",
        notes: "",
      });
      setPatientSearch("");
      setPatientOptions([]);
      setDueAmount(0);
    }
  }, [open, clinics]);

  // Search patients
  useEffect(() => {
    const searchPatientsAsync = async () => {
      if (patientSearch.length < 2) {
        setPatientOptions([]);
        return;
      }

      setPatientLoading(true);
      try {
        const res = await searchPatients(patientSearch);
        setPatientOptions(res.data?.patients || []);
      } catch (err) {
        console.error("Patient search failed:", err);
        setPatientOptions([]);
      } finally {
        setPatientLoading(false);
      }
    };

    const debounce = setTimeout(searchPatientsAsync, 300);
    return () => clearTimeout(debounce);
  }, [patientSearch]);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.patient) {
      toast.error("Please select a patient");
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!formData.clinic) {
      toast.error("Please select a clinic");
      return;
    }

    const data = {
      patient: formData.patient._id,
      amount: Number(formData.amount),
      paymentMode: formData.paymentMode,
      type: formData.type,
      clinic: formData.clinic,
      referenceNumber: formData.referenceNumber || undefined,
      notes: formData.notes || undefined,
    };

    createPayment(data, {
      onSuccess: () => {
        onSuccess?.();
        onClose();
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Failed to record payment");
      },
    });
  };

  const handleClose = () => {
    if (!isCreating) {
      onClose();
    }
  };

  const showReferenceField =
    formData.paymentMode === "upi" ||
    formData.paymentMode === "card" ||
    formData.paymentMode === "netbanking";

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
          <IconButton onClick={handleClose} disabled={isCreating}>
            <CloseIcon className="text-white" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent className="p-6 mt-4">
        <Grid container spacing={3}>
          {/* Patient Search */}
          <Grid size={{ xs: 12 }}>
            <Autocomplete
              options={patientOptions}
              getOptionLabel={(option) =>
                option ? `${option.name} - ${option.phone}` : ""
              }
              value={formData.patient}
              onChange={async (_, newValue) => {
                setFormData((prev) => ({ ...prev, patient: newValue, amount: "" }));
                setDueAmount(0);
                if (newValue && newValue._id) {
                  setFetchingDue(true);
                  try {
                    const res = await api.get(`/billing/patient/${newValue._id}/pending-amount`);
                    const due = res.data?.pendingAmount || 0;
                    setDueAmount(due);
                    if (due > 0) {
                      setFormData((prev) => ({ ...prev, amount: String(due) }));
                    }
                  } catch (err) {
                    console.error("[AddPayment] due fetch failed:", err);
                  } finally {
                    setFetchingDue(false);
                  }
                }
              }}
              onInputChange={(_, newInput) => {
                setPatientSearch(newInput);
              }}
              loading={patientLoading}
              isOptionEqualToValue={(option, value) => option._id === value?._id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Patient *"
                  placeholder="Search by name or phone..."
                  size="small"
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
                  : formData.patient
                  ? "No pending dues"
                  : ""
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

          {/* Reference Number (for UPI/Card/NetBanking) */}
          {showReferenceField && (
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
        <Button onClick={handleClose} color="inherit" disabled={isCreating}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isCreating}
          className="bg-green-600 hover:bg-green-700"
          startIcon={isCreating ? <CircularProgress size={16} /> : <AddIcon />}
        >
          {isCreating ? "Recording..." : "Record Payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddPaymentModal;
