/**
 * Assign Membership Modal (Admin)
 *
 * Lets an admin manually assign a membership plan to a patient — separate from
 * the online Razorpay purchase flow. Supports:
 * - Selecting ANY plan (active AND inactive/discontinued — labelled accordingly)
 * - A free-text custom plan name for plans that no longer exist in the system
 * - Custom start/end dates, amount paid, payment method and notes
 *
 * Posts to /memberships/assign-manual.
 */
import React, { useState, useEffect, useMemo } from "react";
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
  InputAdornment,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import { toast } from "react-toastify";
import { getMembershipPlans, assignManualMembership } from "../../../api/admin/memberships.api";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "online", label: "Online" },
];

/** Format a Date to a yyyy-mm-dd string for <input type="date"> */
const toInputDate = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  // Normalise to local date (avoid TZ shifting the day)
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const addMonths = (dateStr, months) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  d.setMonth(d.getMonth() + (months || 12));
  return toInputDate(d);
};

const AssignMembershipModal = ({ open, onClose, patient, onSuccess }) => {
  const today = useMemo(() => toInputDate(new Date()), []);

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [planSelection, setPlanSelection] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});

  // Reset the form and load all plans (active + inactive) when opened
  useEffect(() => {
    if (!open) return;

    setPlanSelection("");
    setStartDate(today);
    setEndDate("");
    setAmountPaid("");
    setPaymentMethod("cash");
    setNotes("");
    setErrors({});

    const loadPlans = async () => {
      try {
        setLoadingPlans(true);
        // active: "all" -> backend returns active AND inactive plans
        const res = await getMembershipPlans({ active: "all" });
        const list = res?.data?.plans || [];
        // Active plans first, then discontinued; alphabetical within each group
        list.sort((a, b) => {
          if (!!b.isActive !== !!a.isActive) return a.isActive ? -1 : 1;
          return (a.name || "").localeCompare(b.name || "");
        });
        setPlans(list);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load plans");
      } finally {
        setLoadingPlans(false);
      }
    };
    loadPlans();
  }, [open, today]);

  const selectedPlan = plans.find((p) => p._id === planSelection);

  // When a real plan is picked, prefill the end date (from duration) and amount
  const handlePlanChange = (value) => {
    setPlanSelection(value);
    setErrors((e) => ({ ...e, plan: undefined }));

    if (value) {
      const plan = plans.find((p) => p._id === value);
      if (plan) {
        setEndDate(addMonths(startDate || today, plan.durationMonths));
        if (plan.price != null) setAmountPaid(String(plan.price));
      }
    }
  };

  // Keep end date in sync with start date when a real plan defines a duration
  const handleStartDateChange = (value) => {
    setStartDate(value);
    if (selectedPlan && value) {
      setEndDate(addMonths(value, selectedPlan.durationMonths));
    }
  };

  const validate = () => {
    const e = {};
    if (!planSelection) e.plan = "Please choose a plan";
    if (!startDate) e.startDate = "Start date is required";
    if (!endDate) e.endDate = "End date is required";
    if (startDate && endDate && new Date(endDate) <= new Date(startDate))
      e.endDate = "End date must be after the start date";
    if (amountPaid !== "" && Number(amountPaid) < 0)
      e.amountPaid = "Amount cannot be negative";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!patient?._id) {
      toast.error("No patient selected");
      return;
    }
    if (!validate()) return;

    const payload = {
      patientId: patient._id,
      planId: planSelection,
      startDate,
      endDate,
      amountPaid: amountPaid === "" ? undefined : Number(amountPaid),
      paymentMethod,
      notes: notes.trim() || undefined,
    };

    try {
      setSubmitting(true);
      const res = await assignManualMembership(payload);
      toast.success(res?.message || "Membership assigned successfully");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign membership");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle className="flex items-center justify-between bg-linear-to-r from-purple-600 to-purple-700 text-white">
        <Box className="flex items-center gap-2">
          <CardMembershipIcon />
          <span>Assign Membership</span>
        </Box>
        <IconButton onClick={onClose} disabled={submitting} size="small">
          <CloseIcon className="text-white" />
        </IconButton>
      </DialogTitle>

      <DialogContent className="pt-6!">
        {patient && (
          <Typography variant="body2" className="text-gray-500" sx={{ mb: 3 }}>
            Patient: <span className="font-medium text-gray-800">{patient.name}</span>
            {patient.phone ? ` (${patient.phone})` : ""}
          </Typography>
        )}

        {loadingPlans ? (
          <Box className="text-center py-8">
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Box className="flex flex-col gap-4">
            {/* Plan select (active + inactive) */}
            <TextField
              select
              fullWidth
              label="Membership Plan"
              value={planSelection}
              onChange={(e) => handlePlanChange(e.target.value)}
              error={Boolean(errors.plan)}
              helperText={errors.plan}
              disabled={submitting}
            >
              <MenuItem value="" disabled>
                Select a plan
              </MenuItem>
              {plans.map((plan) => (
                <MenuItem
                  key={plan._id}
                  value={plan._id}
                  disabled={!plan.isActive || plan.discontinued}
                  sx={(!plan.isActive || plan.discontinued) ? { color: "#9CA3AF", opacity: 1 } : undefined}
                >
                  {plan.name}
                  {plan.discontinued ? " (Discontinued)" : !plan.isActive ? " (Inactive)" : ""}
                </MenuItem>
              ))}
            </TextField>

            {/* Dates */}
            <Box className="flex gap-4">
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                error={Boolean(errors.startDate)}
                helperText={errors.startDate}
                disabled={submitting}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                error={Boolean(errors.endDate)}
                helperText={errors.endDate}
                disabled={submitting}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            {/* Amount + payment method */}
            <Box className="flex gap-4">
              <TextField
                fullWidth
                type="number"
                label="Amount Paid"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                error={Boolean(errors.amountPaid)}
                helperText={errors.amountPaid}
                disabled={submitting}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
              <TextField
                select
                fullWidth
                label="Payment Method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={submitting}
              >
                {PAYMENT_METHODS.map((m) => (
                  <MenuItem key={m.value} value={m.value}>
                    {m.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Notes */}
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions className="p-4">
        <Button onClick={onClose} color="inherit" disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || loadingPlans}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {submitting ? (
            <Box className="flex items-center gap-2">
              <CircularProgress size={18} color="inherit" />
              <span>Assigning...</span>
            </Box>
          ) : (
            "Assign"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignMembershipModal;
