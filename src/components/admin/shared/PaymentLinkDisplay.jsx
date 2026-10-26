/**
 * PaymentLinkDisplay
 *
 * Shows a generated Razorpay Payment Link with an always-available "Copy
 * Link" button (the manual fallback -- works regardless of WhatsApp outcome)
 * plus a status indicator surfacing the REAL WhatsApp send outcome from the
 * booking/update response (never assumed successful). Used in both
 * AddAppointmentModal's success banner and AppointmentDetailModal's Change
 * Payment Method flow -- single source of truth, not duplicated.
 */
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { toast } from "react-toastify";

const PaymentLinkDisplay = ({ shortUrl, whatsappSent, error }) => {
  if (!shortUrl && !error) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      toast.success("Payment link copied");
    } catch {
      toast.error("Could not copy automatically -- please select and copy the link manually");
    }
  };

  return (
    <Box
      sx={{
        border: "1px solid #bfdbfe",
        borderRadius: 2,
        backgroundColor: "#eff6ff",
        p: 1.5,
        mt: 1.5,
        textAlign: "left",
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 700, color: "#1e40af", display: "block", mb: 0.5 }}>
        Razorpay Payment Link
      </Typography>
      {shortUrl ? (
        <>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography
              variant="caption"
              sx={{ fontFamily: "monospace", color: "#1e3a8a", wordBreak: "break-all", flex: "1 1 auto" }}
            >
              {shortUrl}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ContentCopyIcon sx={{ fontSize: 14 }} />}
              onClick={handleCopy}
              sx={{ textTransform: "none", fontSize: "11px", height: 26, flexShrink: 0 }}
            >
              Copy Link
            </Button>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.75 }}>
            {whatsappSent ? (
              <>
                <CheckCircleIcon sx={{ fontSize: 14, color: "#059669" }} />
                <Typography variant="caption" sx={{ color: "#059669", fontWeight: 600 }}>
                  Sent via WhatsApp
                </Typography>
              </>
            ) : (
              <>
                <ErrorOutlineIcon sx={{ fontSize: 14, color: "#dc2626" }} />
                <Typography variant="caption" sx={{ color: "#dc2626", fontWeight: 600 }}>
                  WhatsApp send failed — please copy and share manually
                </Typography>
              </>
            )}
          </Box>
        </>
      ) : (
        <Typography variant="caption" sx={{ color: "#dc2626" }}>
          Could not generate the payment link ({error || "unknown error"}). Try again, or collect payment another way.
        </Typography>
      )}
    </Box>
  );
};

export default PaymentLinkDisplay;
