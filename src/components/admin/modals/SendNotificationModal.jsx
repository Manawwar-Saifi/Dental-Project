/**
 * Send Notification Modal
 *
 * Modal for sending notifications to patients or staff.
 * Supports single send and bulk send.
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
  Alert,
  Autocomplete,
  FormControlLabel,
  Switch,
  Chip,
} from "@mui/material";
import { toast } from "react-toastify";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import SendIcon from "@mui/icons-material/Send";
import { searchPatients } from "../../../api/admin/patients.api";
import { useNotificationMutations } from "../../../hooks/admin/useNotifications";

const notificationTypes = [
  { value: "general", label: "General" },
  { value: "appointment_reminder", label: "Appointment Reminder" },
  { value: "payment_reminder", label: "Payment Reminder" },
  { value: "treatment_update", label: "Treatment Update" },
  { value: "test_result", label: "Test Result" },
  { value: "membership_expiry", label: "Membership Expiry" },
  { value: "promotional", label: "Promotional" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const recipientModes = [
  { value: "single", label: "Single Patient" },
  { value: "all_patients", label: "All Patients" },
  { value: "all_users", label: "All Staff" },
];

const SendNotificationModal = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    recipientMode: "single",
    patient: null,
    type: "general",
    title: "",
    message: "",
    priority: "normal",
    sendSms: false,
    sendEmail: false,
    showInApp: true,
  });
  const [patientSearch, setPatientSearch] = useState("");
  const [patientOptions, setPatientOptions] = useState([]);
  const [patientLoading, setPatientLoading] = useState(false);

  const { sendNotificationAsync, isSending, sendBulkAsync, isSendingBulk } =
    useNotificationMutations();

  const isSubmitting = isSending || isSendingBulk;

  // Reset form
  useEffect(() => {
    if (open) {
      setFormData({
        recipientMode: "single",
        patient: null,
        type: "general",
        title: "",
        message: "",
        priority: "normal",
        sendSms: false,
        sendEmail: false,
        showInApp: true,
      });
      setPatientSearch("");
      setPatientOptions([]);
    }
  }, [open]);

  // Patient search
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

  const handleSubmit = async () => {
    if (!formData.title.trim()) return toast.error("Title is required");
    if (!formData.message.trim()) return toast.error("Message is required");
    if (formData.recipientMode === "single" && !formData.patient)
      return toast.error("Please select a patient");

    try {
      if (formData.recipientMode === "single") {
        await sendNotificationAsync({
          recipientType: "patient",
          recipientId: formData.patient._id,
          type: formData.type,
          title: formData.title.trim(),
          message: formData.message.trim(),
          priority: formData.priority,
          sendSms: formData.sendSms,
          sendEmail: formData.sendEmail,
          showInApp: formData.showInApp,
        });
      } else {
        await sendBulkAsync({
          recipientType: formData.recipientMode,
          type: formData.type,
          title: formData.title.trim(),
          message: formData.message.trim(),
          priority: formData.priority,
          sendSms: formData.sendSms,
          sendEmail: formData.sendEmail,
          showInApp: formData.showInApp,
        });
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send notification");
    }
  };

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "rounded-xl" }}
    >
      <DialogTitle className="bg-linear-to-r from-blue-600 to-blue-700 text-white">
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <NotificationsActiveIcon />
            <Typography variant="h6" className="font-bold">
              Send Notification
            </Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={isSubmitting}>
            <CloseIcon className="text-white" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent className="p-6 mt-4">
        <Grid container spacing={3}>
          {/* Recipient Mode */}
          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Send To"
              value={formData.recipientMode}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  recipientMode: e.target.value,
                  patient: null,
                }))
              }
              size="small"
            >
              {recipientModes.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Patient Search (single mode only) */}
          {formData.recipientMode === "single" && (
            <Grid size={{ xs: 12 }}>
              <Autocomplete
                options={patientOptions}
                getOptionLabel={(opt) =>
                  opt ? `${opt.name} - ${opt.phone}` : ""
                }
                value={formData.patient}
                onChange={(_, val) =>
                  setFormData((prev) => ({ ...prev, patient: val }))
                }
                onInputChange={(_, val) => setPatientSearch(val)}
                loading={patientLoading}
                isOptionEqualToValue={(opt, val) => opt._id === val?._id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Patient *"
                    placeholder="Search by name or phone..."
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {patientLoading ? (
                            <CircularProgress size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                noOptionsText={
                  patientSearch.length < 2
                    ? "Type at least 2 characters"
                    : "No patients found"
                }
              />
            </Grid>
          )}

          {/* Bulk mode notice */}
          {formData.recipientMode !== "single" && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="info">
                This will send to{" "}
                {formData.recipientMode === "all_patients"
                  ? "all active patients"
                  : "all active staff members"}
              </Alert>
            </Grid>
          )}

          {/* Type + Priority */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="Type"
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, type: e.target.value }))
              }
              size="small"
            >
              {notificationTypes.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="Priority"
              value={formData.priority}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, priority: e.target.value }))
              }
              size="small"
            >
              {priorityOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Title */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Title *"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              size="small"
              placeholder="e.g., Appointment Reminder"
            />
          </Grid>

          {/* Message */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Message *"
              value={formData.message}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, message: e.target.value }))
              }
              size="small"
              multiline
              rows={3}
              placeholder="Enter notification message..."
            />
          </Grid>

          {/* Channels */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" className="text-gray-600 mb-1">
              Delivery Channels
            </Typography>
            <Box className="flex flex-wrap gap-4">
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.showInApp}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        showInApp: e.target.checked,
                      }))
                    }
                    color="primary"
                  />
                }
                label="In-App"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.sendSms}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sendSms: e.target.checked,
                      }))
                    }
                    color="success"
                  />
                }
                label="SMS"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.sendEmail}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sendEmail: e.target.checked,
                      }))
                    }
                    color="info"
                  />
                }
                label="Email"
              />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions className="p-4 bg-gray-50">
        <Button onClick={handleClose} color="inherit" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
          startIcon={
            isSubmitting ? <CircularProgress size={16} /> : <SendIcon />
          }
        >
          {isSubmitting
            ? "Sending..."
            : formData.recipientMode === "single"
              ? "Send Notification"
              : "Send to All"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SendNotificationModal;
