import { useState, useEffect, useCallback } from "react";
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
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PaymentIcon from "@mui/icons-material/Payment";
import api from "../../../api/axios";
import { searchPatients } from "../../../api/admin/patients.api";
import { useAdminPaymentMutations } from "../../../hooks/admin/usePayments";

const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
];

const RecordAdminPaymentModal = ({ open, onClose, onSuccess }) => {
  const [patientQuery, setPatientQuery] = useState("");
  const [patientOptions, setPatientOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [pendingAmount, setPendingAmount] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [loadingPending, setLoadingPending] = useState(false);

  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [mode, setMode] = useState("cash");
  const [reference, setReference] = useState("");
  const [submitError, setSubmitError] = useState("");

  const { recordPayment, isRecording } = useAdminPaymentMutations();

  // ── Patient search ─────────────────────────────────────────────────────────

  const fetchPatients = useCallback(async (q) => {
    setSearchLoading(true);
    try {
      const res = await searchPatients(q);
      setPatientOptions(res?.data?.patients || []);
    } catch {
      setPatientOptions([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchPatients("");
  }, [open, fetchPatients]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => fetchPatients(patientQuery), 300);
    return () => clearTimeout(timer);
  }, [patientQuery, open, fetchPatients]);

  // ── Pending amount — direct api call, flat response ────────────────────────

  const fetchPendingAmount = async (patientId) => {
    setLoadingPending(true);
    setAmount("");
    setAmountError("");
    setPendingAmount(0);
    setInvoiceCount(0);
    try {
      const res = await api.get(`/billing/patient/${patientId}/pending-amount`);
      const pending = res.data.pendingAmount || 0;
      const count = res.data.invoiceCount || 0;
      setPendingAmount(pending);
      setInvoiceCount(count);
      setAmount(pending > 0 ? String(pending) : "");
    } catch (err) {
      console.error("[RecordPayment] pending fetch failed:", err);
      setPendingAmount(0);
      setInvoiceCount(0);
      setAmount("");
    } finally {
      setLoadingPending(false);
    }
  };

  // ── Patient selection ──────────────────────────────────────────────────────

  const handlePatientChange = (_, newValue) => {
    setSelectedPatient(newValue);
    if (newValue && newValue._id) {
      fetchPendingAmount(newValue._id);
    } else {
      setPendingAmount(0);
      setInvoiceCount(0);
      setAmount("");
      setAmountError("");
    }
  };

  // ── Form reset ─────────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setPatientQuery("");
    setSelectedPatient(null);
    setPendingAmount(0);
    setInvoiceCount(0);
    setAmount("");
    setAmountError("");
    setMode("cash");
    setReference("");
    setSubmitError("");
  }, []);

  useEffect(() => {
    if (open) resetForm();
  }, [open, resetForm]);

  // ── Validation ─────────────────────────────────────────────────────────────

  const handleAmountChange = (e) => {
    const val = e.target.value;
    setAmount(val);
    const num = Number(val);
    if (!val || num <= 0) {
      setAmountError("Amount must be greater than 0");
    } else if (pendingAmount > 0 && num > pendingAmount + 0.01) {
      setAmountError(`Cannot exceed pending ₹${pendingAmount.toLocaleString("en-IN")}`);
    } else {
      setAmountError("");
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!selectedPatient) return;
    const num = Number(amount);
    if (!num || num <= 0) { setAmountError("Amount must be greater than 0"); return; }
    if (pendingAmount > 0 && num > pendingAmount + 0.01) {
      setAmountError(`Cannot exceed ₹${pendingAmount.toLocaleString("en-IN")}`);
      return;
    }
    setSubmitError("");
    try {
      await recordPayment({
        patientId: selectedPatient._id,
        amount: num,
        mode,
        reference: reference.trim() || undefined,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setSubmitError(err?.response?.data?.message || "Failed to record payment. Please try again.");
    }
  };

  const noPending = selectedPatient && !loadingPending && pendingAmount === 0;
  const canSubmit =
    selectedPatient &&
    !noPending &&
    !loadingPending &&
    amount &&
    Number(amount) > 0 &&
    !amountError &&
    !isRecording;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PaymentIcon sx={{ color: "#1e3a5f" }} />
          <Typography variant="h6" component="span" fontWeight="bold">Record Payment</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" disabled={isRecording}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Patient Search */}
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          Patient
        </Typography>
        <Autocomplete
          options={patientOptions}
          getOptionLabel={(opt) => opt?.name || ""}
          isOptionEqualToValue={(option, value) => option._id === value._id}
          filterOptions={(x) => x}
          loading={searchLoading}
          value={selectedPatient}
          onChange={handlePatientChange}
          inputValue={patientQuery}
          onInputChange={(_, val, reason) => {
            if (reason !== "reset") setPatientQuery(val);
          }}
          noOptionsText={searchLoading ? "Searching…" : "No patients found"}
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option._id}>
              <Box>
                <Typography variant="body2" fontWeight={600}>{option.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  📞 {option.phone || "—"}{option.email ? ` • ${option.email}` : ""}
                </Typography>
              </Box>
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Search by name or phone…"
              size="small"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {searchLoading ? <CircularProgress size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={{ mb: selectedPatient ? 1 : 3 }}
        />

        {/* Selected patient confirmation */}
        {selectedPatient && (
          <Box sx={{ bgcolor: "#f0f7ff", borderRadius: "6px", px: 1.5, py: 1, mt: 1, mb: 2 }}>
            <Typography variant="body2" sx={{ fontSize: 13, color: "#1e3a5f" }}>
              <strong>Selected:</strong> {selectedPatient.name} — {selectedPatient.phone || "—"}
            </Typography>
          </Box>
        )}

        {/* Pending amount display */}
        {selectedPatient && (
          <Box sx={{ mb: 2.5, minHeight: 24 }}>
            {loadingPending ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={14} />
                <Typography variant="body2" color="text.secondary">Fetching pending balance…</Typography>
              </Box>
            ) : noPending ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                No pending balance for this patient.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, flexWrap: "wrap" }}>
                <Typography variant="body2" fontWeight={700} sx={{ color: "#f59e0b", fontSize: 16 }}>
                  Pending: ₹{pendingAmount.toLocaleString("en-IN")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  across {invoiceCount} invoice{invoiceCount !== 1 ? "s" : ""} · oldest settled first
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Amount — auto-filled from pending, editable for partial payments */}
        <TextField
          label="Amount (₹) *"
          type="number"
          fullWidth
          size="small"
          value={amount}
          onChange={handleAmountChange}
          error={!!amountError}
          helperText={
            amountError ||
            (selectedPatient && pendingAmount > 0
              ? `Due: ₹${pendingAmount.toLocaleString("en-IN")} — you can enter a partial amount`
              : " ")
          }
          inputProps={{ min: 1, step: 1 }}
          disabled={!selectedPatient || loadingPending || noPending}
          sx={{ mb: 2 }}
        />

        {/* Payment Mode */}
        <TextField
          select
          label="Payment Mode *"
          fullWidth
          size="small"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          sx={{ mb: 2 }}
        >
          {PAYMENT_MODES.map((m) => (
            <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
          ))}
        </TextField>

        {/* Reference (UPI/Card) */}
        {(mode === "upi" || mode === "card") && (
          <TextField
            label="Reference / Transaction ID"
            fullWidth
            size="small"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. TXN123456"
            sx={{ mb: 2 }}
          />
        )}

        {submitError && <Alert severity="error" sx={{ mt: 1 }}>{submitError}</Alert>}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="outlined" color="inherit" onClick={onClose} disabled={isRecording}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit}
          startIcon={isRecording ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{
            bgcolor: "#1e3a5f",
            "&:hover": { bgcolor: "#162d4a" },
            "&:disabled": { bgcolor: "#c0c8d4" },
          }}
        >
          {isRecording ? "Recording…" : "Record Payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecordAdminPaymentModal;
