/**
 * Edit Appointment Modal
 *
 * Pre-fills all fields from the existing appointment and submits PATCH on save.
 * Patient is read-only; all other fields are editable.
 * Layout mirrors AddAppointmentModal (same Grid sizes, mt-5, mt-2 on payment toggle).
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
  Autocomplete,
  FormControlLabel,
  Switch,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Divider,
  Chip,
  Paper,
} from "@mui/material";
import { toast } from "react-toastify";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import { useAppointmentMutations } from "../../../hooks/admin/useAppointments";
import { getTreatmentMaster } from "../../../api/admin/treatments.api";
import { getAvailableSlots } from "../../../api/admin/appointments.api";
import {
  MAX_DATE,
  dateGuards,
  isPastSlotForDate,
} from "../../../utils/dateInput";
import { generateTimeSlots } from "../../../utils/timeSlots";
import StyledTextField from "../shared/StyledTextField";

// Admin/clinic_manager may edit an appointment's date up to this many days
// into the past (backend enforces the same window, gated to those roles).
const MIN_BACKDATE_DAYS = 10;
const minBackdateStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - MIN_BACKDATE_DAYS);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const OTHER_TREATMENT = { _id: "other", name: "Other (custom treatment)", price: null };

const typeOptions = [
  { value: "regular", label: "Regular" },
  { value: "follow_up", label: "Follow-up" },
];

const sourceOptions = [
  { value: "walk_in", label: "Walk-in" },
  { value: "phone", label: "Phone" },
  { value: "online", label: "Online" },
  { value: "app", label: "App" },
];

// Admin can book up to 10 PM (doctor works late evenings)
const timeSlots = generateTimeSlots("09:00", "22:00");

const formatCurrency = (val) => `₹${(Number(val) || 0).toLocaleString("en-IN")}`;

const toDateStr = (dateVal) => {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const EditAppointmentModal = ({ open, onClose, appointment, onSuccess }) => {
  const [formData, setFormData] = useState({
    date: "",
    timeSlot: "",
    type: "regular",
    appointmentType: "regular",
    visitType: "opd",
    treatment: null,
    treatmentName: "",
    fee: "",
    opdFee: 300,
    isFree: false,
    reason: "",
    notes: "",
    source: "walk_in",
  });
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [errors, setErrors] = useState({});
  const [treatments, setTreatments] = useState([]);
  const [availableSlots, setAvailableSlots] = useState(null);

  // "Other" treatment popup dialog state — mirrors AddAppointmentModal pattern.
  const [otherTreatmentDialogOpen, setOtherTreatmentDialogOpen] = useState(false);
  const [otherTreatmentInput, setOtherTreatmentInput] = useState(""); // dialog text-field working copy
  const [previousTreatmentObj, setPreviousTreatmentObj] = useState(null); // treatment object before "Other" was selected

  const { updateAppointment: updateApptMutation, isUpdating } = useAppointmentMutations();

  // Track the original date so we can mark the original slot as "(current)"
  const [originalDate, setOriginalDate] = useState("");
  const [originalSlot, setOriginalSlot] = useState("");

  // Pre-fill form when appointment + modal opens
  useEffect(() => {
    if (!open || !appointment) return;

    const dateStr = toDateStr(appointment.date);
    setOriginalDate(dateStr);
    setOriginalSlot(appointment.timeSlot || "");

    setFormData({
      date: dateStr,
      timeSlot: appointment.timeSlot || "",
      type: appointment.type || "regular",
      appointmentType: appointment.appointmentType || "regular",
      visitType: appointment.visitType || "opd",
      treatment: null, // resolved after treatments load
      treatmentName: appointment.treatmentName || "",
      fee: appointment.fee !== undefined && appointment.fee !== null ? String(appointment.fee) : "",
      opdFee: appointment.opdFee ?? appointment.fee ?? 300,
      isFree: appointment.isFree || false,
      reason: appointment.reason || "",
      notes: appointment.notes || "",
      source: appointment.source || "walk_in",
    });

    const pm = appointment.paymentMethod;
    setPaymentMethod(pm === "online" ? "online" : pm === "free" || appointment.isFree ? "free" : "cash");
    setErrors({});
    setOtherTreatmentDialogOpen(false);
    setOtherTreatmentInput("");
    setPreviousTreatmentObj(null);
  }, [open, appointment]);

  // Fetch treatments when modal opens
  useEffect(() => {
    if (!open) return;
    getTreatmentMaster()
      .then((res) => setTreatments(res.data?.treatmentTypes || []))
      .catch(() => setTreatments([]));
  }, [open]);

  // Resolve treatment object from the treatments list once both are available
  useEffect(() => {
    if (!appointment || treatments.length === 0) return;
    if (appointment.visitType !== "treatment") return;

    const aptTreatmentId = appointment.treatmentId?._id || appointment.treatmentId;

    if (aptTreatmentId && aptTreatmentId !== "other") {
      const found = treatments.find((t) => t._id === String(aptTreatmentId));
      if (found) {
        setFormData((prev) => ({ ...prev, treatment: found }));
      } else {
        // Treatment removed from catalog; fall back to "other"
        setFormData((prev) => ({
          ...prev,
          treatment: OTHER_TREATMENT,
          treatmentName: appointment.treatmentId?.name || prev.treatmentName,
        }));
      }
    } else if (appointment.treatmentName && !aptTreatmentId) {
      setFormData((prev) => ({ ...prev, treatment: OTHER_TREATMENT }));
    }
  }, [treatments, appointment]);

  // Fetch available slots when clinic + date are known
  useEffect(() => {
    if (!open || !appointment?.clinic?._id || !formData.date) {
      setAvailableSlots(null);
      return;
    }
    let active = true;
    getAvailableSlots(appointment.clinic._id, formData.date)
      .then((res) => {
        if (!active) return;
        const slots = res?.data?.availableSlots || [];
        // Include the original slot on the original date — the public API counts this
        // appointment's booking too and may mark it as full, but it's already ours.
        const needsOriginal =
          originalSlot && formData.date === originalDate && !slots.includes(originalSlot);
        setAvailableSlots(needsOriginal ? [...slots, originalSlot] : slots);
      })
      .catch(() => { if (active) setAvailableSlots([]); });
    return () => { active = false; };
  }, [open, formData.date, appointment, originalDate, originalSlot]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = () => {
    const errs = {};
    if (!formData.date) errs.date = "Date is required";
    if (!formData.timeSlot) errs.timeSlot = "Time slot is required";
    if (!formData.reason?.trim()) errs.reason = "Reason is required";
    if (formData.visitType === "treatment") {
      if (!formData.treatment) errs.treatment = "Select a treatment";
      if (formData.treatment?._id === "other" && !formData.treatmentName?.trim())
        errs.treatmentName = "Enter the treatment name";
      if (!formData.isFree && (!Number(formData.fee) || Number(formData.fee) <= 0))
        errs.fee = "Enter a valid fee";
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const isCustom = formData.treatment?._id === "other";
    const data = {
      date: formData.date,
      timeSlot: formData.timeSlot,
      type: formData.type,
      appointmentType: formData.appointmentType,
      visitType: formData.visitType,
      reason: formData.reason,
      notes: formData.notes || undefined,
      source: formData.source,
      isFree: formData.isFree,
      paymentMethod: formData.isFree ? "free" : paymentMethod,
      ...(formData.visitType === "treatment"
        ? {
            treatmentId: isCustom ? undefined : formData.treatment?._id,
            treatmentName: isCustom ? formData.treatmentName.trim() : undefined,
            fee: formData.isFree ? 0 : Number(formData.fee),
          }
        : {
            opdFee: formData.isFree ? 0 : Number(formData.opdFee),
            fee: formData.isFree ? 0 : Number(formData.opdFee),
          }),
    };

    updateApptMutation(
      { id: appointment._id, data },
      {
        onSuccess: () => {
          toast.success("Appointment updated successfully");
          onSuccess?.();
          onClose();
        },
        onError: (err) =>
          toast.error(err.response?.data?.message || "Failed to update appointment"),
      }
    );
  };

  const handleClose = () => {
    if (!isUpdating) {
      setErrors({});
      setOtherTreatmentDialogOpen(false);
      setOtherTreatmentInput("");
      setPreviousTreatmentObj(null);
      onClose();
    }
  };

  if (!appointment) return null;

  const baseFee = formData.isFree
    ? 0
    : formData.visitType === "treatment"
    ? Number(formData.fee) || 0
    : Number(formData.opdFee) || 0;

  return (
    <>
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      slotProps={{ paper: { className: "rounded-xl" } }}
    >
      {/* Header — matches AddAppointmentModal */}
      <DialogTitle
        className="bg-linear-to-r from-indigo-600 to-indigo-700 text-white"
        sx={{ py: 1.25, px: 2 }}
      >
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <EditIcon className="text-white" fontSize="small" />
            <Typography variant="subtitle1" className="font-bold text-white">
              Edit Appointment — {appointment.appointmentNumber}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClose} disabled={isUpdating}>
            <CloseIcon className="text-white" fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content — mt-5 preserved */}
      <DialogContent
        sx={{
          px: 2,
          pt: 2.5,
          pb: 2,
          "& .MuiFormHelperText-root": {
            fontSize: "0.7rem",
            lineHeight: 1.3,
            mt: 0.25,
          },
        }}
        className="mt-5"
      >
        {/* Read-only patient / clinic info bar */}
        <Box
          sx={{
            bgcolor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 1,
            px: 2,
            py: 1,
            mb: 2,
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{ color: "#64748b", fontWeight: 600, textTransform: "uppercase", fontSize: "0.65rem", display: "block" }}
            >
              Patient
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {appointment.patient?.name || "Unknown"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              {appointment.patient?.phone || "—"}
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: "#64748b", fontWeight: 600, textTransform: "uppercase", fontSize: "0.65rem", display: "block" }}
            >
              Clinic
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {appointment.clinic?.name || "—"}
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: "#64748b", fontWeight: 600, textTransform: "uppercase", fontSize: "0.65rem", display: "block" }}
            >
              Appt #
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "monospace" }}>
              {appointment.appointmentNumber || "—"}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Date */}
          <Grid size={{ xs: 6, sm: 3, md: 3 }}>
            <TextField
              fullWidth
              label="Appointment Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date: e.target.value, timeSlot: prev.timeSlot }))
              }
              error={!!errors.date}
              helperText={errors.date}
              required
              size="small"
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: minBackdateStr(), max: MAX_DATE, ...dateGuards }}
            />
          </Grid>

          {/* Time Slot */}
          <Grid size={{ xs: 6, sm: 3, md: 3 }}>
            <TextField
              fullWidth
              label="Time Slot"
              name="timeSlot"
              value={formData.timeSlot}
              onChange={handleChange}
              error={!!errors.timeSlot}
              helperText={
                errors.timeSlot ||
                (Array.isArray(availableSlots)
                  ? "Full or past slots are disabled"
                  : "Loading slots…")
              }
              required
              select
              size="small"
            >
              <MenuItem value="">Select Time</MenuItem>
              {timeSlots.map((slot) => {
                const isCurrentSlot = slot === originalSlot && formData.date === originalDate;
                const disabled =
                  isPastSlotForDate(formData.date, slot) ||
                  (Array.isArray(availableSlots) &&
                    !availableSlots.includes(slot) &&
                    !isCurrentSlot);
                return (
                  <MenuItem key={slot} value={slot} disabled={disabled}>
                    {slot}
                    {isCurrentSlot ? " (current)" : disabled ? " — unavailable" : ""}
                  </MenuItem>
                );
              })}
            </TextField>
          </Grid>

          {/* Appointment Type */}
          <Grid size={{ xs: 6, sm: 3, md: 3 }}>
            <TextField
              fullWidth
              label="Appointment Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              select
              size="small"
            >
              {typeOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Reason */}
          <Grid size={{ xs: 6, sm: 3, md: 3 }}>
            <TextField
              fullWidth
              label="Reason for Visit"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              error={!!errors.reason}
              helperText={errors.reason}
              required
              size="small"
            />
          </Grid>

          {/* Visit Type */}
          <Grid size={{ xs: 6, sm: 6, md: 4 }}>
            <FormControl>
              <FormLabel
                className="text-xs font-semibold text-gray-700"
                sx={{ "&.Mui-focused": { color: "inherit" } }}
              >
                Visit Type
              </FormLabel>
              <RadioGroup
                row
                value={formData.visitType}
                onChange={(e) => {
                  const newVisitType = e.target.value;
                  if (newVisitType === "treatment") {
                    setPaymentMethod("cash");
                    if (formData.isFree) {
                      setFormData((prev) => ({ ...prev, visitType: "treatment", isFree: false }));
                      return;
                    }
                  }
                  setFormData((prev) => ({
                    ...prev,
                    visitType: newVisitType,
                    ...(newVisitType === "opd"
                      ? { treatment: null, treatmentName: "", fee: "" }
                      : {}),
                  }));
                }}
                sx={{
                  "& .MuiFormControlLabel-label": { fontSize: "0.85rem" },
                  "& .MuiFormControlLabel-root": { mr: 1.5 },
                }}
              >
                <FormControlLabel value="opd" control={<Radio size="small" />} label="Appointment" />
                <FormControlLabel value="treatment" control={<Radio size="small" />} label="Treatment" />
              </RadioGroup>
            </FormControl>
          </Grid>

          {/* Urgency */}
          <Grid size={{ xs: 6, sm: 6, md: 4 }}>
            <FormControl>
              <FormLabel
                className="text-xs font-semibold text-gray-700"
                sx={{ "&.Mui-focused": { color: "inherit" } }}
              >
                Urgency
              </FormLabel>
              <RadioGroup
                row
                value={formData.appointmentType}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, appointmentType: e.target.value }))
                }
                sx={{
                  "& .MuiFormControlLabel-label": { fontSize: "0.85rem" },
                  "& .MuiFormControlLabel-root": { mr: 1.5 },
                }}
              >
                <FormControlLabel value="regular" control={<Radio size="small" />} label="Regular" />
                <FormControlLabel
                  value="emergency"
                  control={<Radio size="small" sx={{ "&.Mui-checked": { color: "#dc2626" } }} />}
                  label="Emergency"
                />
              </RadioGroup>
            </FormControl>
          </Grid>

          {/* Source */}
          <Grid size={{ xs: 6, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              label="Booking Source"
              name="source"
              value={formData.source}
              onChange={handleChange}
              select
              size="small"
            >
              {sourceOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Treatment fields (treatment visits only) */}
          {formData.visitType === "treatment" && (
            <>
              <Grid size={{ xs: 6, sm: 6, md: 4 }}>
                <Autocomplete
                  options={[...treatments, OTHER_TREATMENT]}
                  getOptionLabel={(o) => {
                    if (!o) return "";
                    // When "Other" is selected and a custom name is saved, show it
                    // as "Other — <name>" so the admin sees what they entered.
                    if (o._id === "other" && formData.treatment?._id === "other" && formData.treatmentName)
                      return `Other — ${formData.treatmentName}`;
                    return o.name || "";
                  }}
                  value={formData.treatment}
                  isOptionEqualToValue={(opt, val) => opt._id === val?._id}
                  onChange={(_, value) => {
                    if (value?._id === "other") {
                      // Save previous treatment so Cancel can revert
                      setPreviousTreatmentObj(formData.treatment);
                      setOtherTreatmentInput(formData.treatmentName); // pre-fill with current custom name
                      setOtherTreatmentDialogOpen(true);
                      // Set treatment to OTHER_TREATMENT immediately so the
                      // Autocomplete shows "Other…" — treatmentName unchanged until dialog Save
                      setFormData((prev) => ({ ...prev, treatment: value }));
                    } else {
                      setFormData((prev) => ({
                        ...prev,
                        treatment: value,
                        fee: value?.price != null ? String(value.price) : prev.fee,
                        treatmentName: "",
                      }));
                    }
                    setErrors((prev) => ({ ...prev, treatment: "", treatmentName: "", fee: "" }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Treatment"
                      placeholder="Select a treatment"
                      required
                      size="small"
                      error={!!errors.treatment}
                      helperText={errors.treatment}
                    />
                  )}
                />
              </Grid>
              {!formData.isFree && (
                <Grid size={{ xs: 6, sm: 6, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Treatment Fee (₹)"
                    name="fee"
                    type="number"
                    value={formData.fee}
                    onChange={handleChange}
                    required
                    size="small"
                    error={!!errors.fee}
                    helperText={errors.fee}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
              )}
            </>
          )}

          {/* Free Appointment Toggle */}
          <Grid size={{ xs: 6, sm: 6, md: 4 }}>
            <Box className="flex items-center h-full">
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isFree}
                    onChange={(e) => {
                      const isFree = e.target.checked;
                      setFormData((prev) => ({ ...prev, isFree }));
                      setPaymentMethod(isFree ? "free" : "cash");
                    }}
                    color="success"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      Free Appointment
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      No payment required
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Grid>

          {/* OPD Fee (OPD visits only) */}
          {formData.visitType === "opd" && (
            <Grid size={{ xs: 6, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                label={`Appointment Fee (₹) — ${formData.appointmentType === "emergency" ? "Emergency" : "Regular"}`}
                name="opdFee"
                type="number"
                value={formData.opdFee}
                onChange={handleChange}
                size="small"
                disabled={formData.isFree}
                helperText={formData.isFree ? "Fee waived for free appointment" : undefined}
                inputProps={{ min: 0 }}
              />
            </Grid>
          )}

          {/* Fee summary + payment method toggle (OPD only) */}
          {formData.visitType === "opd" && (
            <Grid size={{ xs: 12 }}>
              <Paper variant="outlined" className="p-3 bg-gray-50">
                <Box className="flex justify-between items-center py-1">
                  <Typography variant="caption" className="text-gray-600">
                    Appointment / Consultation fee
                  </Typography>
                  <span className="font-numbers font-semibold">
                    {formData.isFree ? "Free" : formatCurrency(baseFee)}
                  </span>
                </Box>
                <Divider className="my-2.5" />

                {/* mt-2 on inner Box preserved */}
                <Box className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-0.5">
                  <Box className="flex items-center gap-1 mt-2">
                    <Typography variant="caption" className="text-gray-500">Method:</Typography>
                    {formData.isFree ? (
                      <Chip size="small" variant="outlined" label="Free" sx={{ height: 20 }} />
                    ) : (
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant={paymentMethod === "cash" ? "contained" : "outlined"}
                          size="small"
                          onClick={() => setPaymentMethod("cash")}
                          sx={{
                            textTransform: "none",
                            fontSize: "11px",
                            height: 24,
                            minWidth: 0,
                            px: 1.5,
                            ...(paymentMethod === "cash"
                              ? { backgroundColor: "#1e3a5f", color: "#fff", "&:hover": { backgroundColor: "#162d4a" } }
                              : { borderColor: "#1e3a5f", color: "#1e3a5f" }),
                          }}
                        >
                          Cash
                        </Button>
                        <Button
                          variant={paymentMethod === "online" ? "contained" : "outlined"}
                          size="small"
                          onClick={() => setPaymentMethod("online")}
                          sx={{
                            textTransform: "none",
                            fontSize: "11px",
                            height: 24,
                            minWidth: 0,
                            px: 1.5,
                            ...(paymentMethod === "online"
                              ? { backgroundColor: "#059669", color: "#fff", "&:hover": { backgroundColor: "#047857" } }
                              : { borderColor: "#059669", color: "#059669" }),
                          }}
                        >
                          Pay Online
                        </Button>
                      </Box>
                    )}
                  </Box>
                  <Box className="flex items-center gap-1">
                    <Typography variant="caption" className="text-gray-500">Status:</Typography>
                    <Chip
                      size="small"
                      color={formData.isFree ? "info" : "warning"}
                      label={formData.isFree ? "Free" : "Pending"}
                      sx={{ height: 20 }}
                    />
                  </Box>
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Notes */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              multiline
              rows={2}
              size="small"
              placeholder="Additional notes..."
            />
          </Grid>
        </Grid>
      </DialogContent>

      {/* Actions */}
      <DialogActions
        className="px-4 py-2 bg-gray-50"
        sx={{ borderTop: 1, borderColor: "divider" }}
      >
        <Button onClick={handleClose} color="inherit" disabled={isUpdating}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isUpdating}
          className="bg-indigo-600 hover:bg-indigo-700"
          startIcon={isUpdating ? <CircularProgress size={16} color="inherit" /> : <EditIcon />}
        >
          {isUpdating ? "Updating..." : "Update Appointment"}
        </Button>
      </DialogActions>
    </Dialog>

    {/* "Enter treatment name" popup (other-treatment dialog) — same pattern as AddAppointmentModal.
        Opens when the admin selects "Other (custom treatment)" from the
        Autocomplete.  On Save, treatmentName is updated in formData.
        On Cancel, the Autocomplete reverts to the previous treatment. */}
    <Dialog
      open={otherTreatmentDialogOpen}
      onClose={() => {
        setFormData((prev) => ({ ...prev, treatment: previousTreatmentObj, treatmentName: previousTreatmentObj?._id === "other" ? prev.treatmentName : "" }));
        setOtherTreatmentInput("");
        setOtherTreatmentDialogOpen(false);
      }}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Enter treatment name</DialogTitle>
      {/* Same pt fix as AddAppointmentModal: "&&" gives specificity 0-2-0
          so this rule beats MUI's sibling zeroing rule at the same specificity,
          by insertion order (Emotion sx comes after theme). Without it, pt=0
          and the shrunk label is clipped by overflow-y:auto. */}
      <DialogContent sx={{ "&&": { pt: 2.5 } }}>
        <StyledTextField
          autoFocus
          label="Treatment name"
          size="small"
          fullWidth
          value={otherTreatmentInput}
          onChange={(e) => setOtherTreatmentInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && otherTreatmentInput.trim()) {
              setFormData((prev) => ({ ...prev, treatmentName: otherTreatmentInput.trim() }));
              setOtherTreatmentDialogOpen(false);
            }
          }}
          placeholder="e.g., Root planing"
          sx={{ mt: 0.5 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          color="inherit"
          onClick={() => {
            setFormData((prev) => ({ ...prev, treatment: previousTreatmentObj, treatmentName: previousTreatmentObj?._id === "other" ? prev.treatmentName : "" }));
            setOtherTreatmentInput("");
            setOtherTreatmentDialogOpen(false);
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!otherTreatmentInput.trim()}
          onClick={() => {
            setFormData((prev) => ({ ...prev, treatmentName: otherTreatmentInput.trim() }));
            setOtherTreatmentDialogOpen(false);
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default EditAppointmentModal;
