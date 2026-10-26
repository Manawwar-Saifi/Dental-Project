/**
 * PaymentMethodSelector
 *
 * Single source of truth for the 3-way Cash / UPI / Razorpay payment method
 * button group -- replaces the old 2-option Cash/Online toggle. Used by
 * AddAppointmentModal (both the OPD/Appointment branch and the Treatment
 * branch -- same component, not duplicated JSX) and by the "Change Payment
 * Method" action in AppointmentDetailModal.
 *
 * Cash and UPI are both simple record-only labels (admin collected it
 * themselves; UPI = admin's own personal/business UPI, not a system
 * integration). Razorpay generates a real shareable Payment Link via the
 * backend (see razorpayLinks.js) -- selecting it doesn't collect payment by
 * itself, it just marks the method so a link gets generated on submit.
 */
import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

const METHODS = [
  { value: "cash", label: "Cash", color: "#1e3a5f" },
  { value: "upi", label: "UPI", color: "#7c3aed" },
  { value: "razorpay", label: "Razorpay", color: "#2563eb" },
];

const PaymentMethodSelector = ({ value, onChange, disabled = false, size = "small" }) => {
  const height = size === "small" ? 22 : 28;
  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      {METHODS.map((method) => {
        const selected = value === method.value;
        return (
          <Button
            key={method.value}
            variant={selected ? "contained" : "outlined"}
            size="small"
            disabled={disabled}
            onClick={() => onChange(method.value)}
            sx={{
              textTransform: "none",
              fontSize: "11px",
              height,
              minWidth: 0,
              px: 1.5,
              ...(selected
                ? { backgroundColor: method.color, color: "#fff", "&:hover": { backgroundColor: method.color } }
                : { borderColor: method.color, color: method.color }),
            }}
          >
            {method.label}
          </Button>
        );
      })}
    </Box>
  );
};

export default PaymentMethodSelector;
