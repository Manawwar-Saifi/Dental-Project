/**
 * Cancel Appointment Modal
 *
 * Modal for cancelling an appointment with a reason.
 */
import React, { useState } from "react";
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
} from "@mui/material";
import { toast } from "react-toastify";
import CloseIcon from "@mui/icons-material/Close";
import CancelIcon from "@mui/icons-material/Cancel";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useAppointmentMutations } from "../../../hooks/admin/useAppointments";

const CancelAppointmentModal = ({ open, onClose, appointment, onSuccess }) => {
  const [reason, setReason] = useState("");

  const { cancelAppointment, isCancelling } = useAppointmentMutations();

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    cancelAppointment(
      { id: appointment._id, reason },
      {
        onSuccess: () => {
          setReason("");
          onSuccess?.();
          onClose();
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || "Failed to cancel appointment");
        },
      }
    );
  };

  const handleClose = () => {
    if (!isCancelling) {
      setReason("");
      onClose();
    }
  };

  if (!appointment) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { className: "rounded-xl" } }}
    >
      {/* Header */}
      <DialogTitle className="bg-linear-to-r from-red-500 to-red-600 text-white">
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <WarningAmberIcon className="text-white" />
            <Typography variant="h6" component="span" className="font-bold text-white">
              Cancel Appointment
            </Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={isCancelling}>
            <CloseIcon className="text-white" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent className="p-6">
        <Box className="text-center py-4">
          <Box className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <CancelIcon className="text-red-500 text-3xl" />
          </Box>

          <Typography variant="h6" className="mb-2 text-gray-800">
            Are you sure you want to cancel?
          </Typography>

          <Typography variant="body2" className="text-gray-600 mb-4">
            Appointment <strong>{appointment.appointmentNumber}</strong> for{" "}
            <strong>{appointment.patient?.name}</strong>
          </Typography>
        </Box>

        <TextField
          fullWidth
          label="Cancellation Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          multiline
          rows={3}
          placeholder="Please provide a reason for cancellation..."
          required
          size="small"
        />
      </DialogContent>

      {/* Actions */}
      <DialogActions className="p-4 bg-gray-50">
        <Button onClick={handleClose} color="inherit" disabled={isCancelling}>
          Go Back
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isCancelling}
          className="bg-red-500 hover:bg-red-600"
          startIcon={isCancelling ? <CircularProgress size={16} /> : <CancelIcon />}
        >
          {isCancelling ? "Cancelling..." : "Cancel Appointment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CancelAppointmentModal;
