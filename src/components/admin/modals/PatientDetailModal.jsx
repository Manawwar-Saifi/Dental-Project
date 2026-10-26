/**
 * Patient Detail Modal (Enhanced)
 *
 * Displays complete patient information with tabs:
 * - Overview: Personal info, medical info, membership
 * - Appointments: Patient's appointment history (with edit)
 * - Treatments: Treatment history
 * - Payment History: Payment history with summary (with add payment)
 * - Reports: Medical reports
 * - Lab: Lab orders for this patient (client-side filtered)
 * - Invoices: Patient's invoices (server-side filtered by patient ID)
 */
import React, { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Tooltip,
  TextField,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import CakeIcon from "@mui/icons-material/Cake";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import EventIcon from "@mui/icons-material/Event";
import PaymentIcon from "@mui/icons-material/Payment";
import DescriptionIcon from "@mui/icons-material/Description";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import ScienceIcon from "@mui/icons-material/Science";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import LockResetIcon from "@mui/icons-material/LockReset";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import AddIcon from "@mui/icons-material/Add";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import CancelIcon from "@mui/icons-material/Cancel";
import { useMembershipMutations } from "../../../hooks/admin/useMemberships";
import {
  getPatientAppointments,
  getPatientTreatments,
  getPatientReports,
  getPatientTests,
  deletePatient,
} from "../../../api/admin/patients.api";
import { getLabOrders } from "../../../api/admin/labOrders.api";
import { getAppointment } from "../../../api/admin/appointments.api";
import { getBillingStats, getInvoices } from "../../../api/admin/billing.api";
import { getPayments } from "../../../api/admin/payments.api";
import EditAppointmentModal from "./EditAppointmentModal";
import AppointmentDetailModal from "./AppointmentDetailModal";
import TreatmentPlanDetailModal from "./TreatmentPlanDetailModal";
import AssignMembershipModal from "./AssignMembershipModal";
import ResetPasswordDialog from "./ResetPasswordDialog";
import FollowUpReminderModal from "./FollowUpReminderModal";
import ConfirmDialog from "../../common/ConfirmDialog";
import InvoiceDetailModal from "./InvoiceDetailModal";
import { toast } from "react-toastify";
import ReportPreviewModal from "../../shared/ReportPreviewModal";

/**
 * Tab Panel Component
 */
const TabPanel = ({ children, value, index, ...other }) => (
  <div role="tabpanel" hidden={value !== index} {...other}>
    {value === index && <Box className="py-2">{children}</Box>}
  </div>
);

/**
 * Info row component
 */
const InfoRow = ({ icon: Icon, label, value, color = "text-gray-600" }) => (
  <Box className="flex items-center gap-2 py-0.5">
    {Icon && <Icon className={color} sx={{ fontSize: 14 }} />}
    <Typography variant="caption" className="text-gray-500 shrink-0" sx={{ minWidth: 80 }}>
      {label}
    </Typography>
    <Typography variant="body2" className={value ? "font-medium" : "text-gray-400"}>
      {value || "—"}
    </Typography>
  </Box>
);

/**
 * Section header component
 */
const SectionHeader = ({ title, icon: Icon }) => (
  <Box className="flex items-center gap-1.5 mb-1">
    {Icon && <Icon className="text-blue-600" sx={{ fontSize: 14 }} />}
    <Typography
      variant="caption"
      className="font-semibold text-gray-600 uppercase tracking-wide"
    >
      {title}
    </Typography>
  </Box>
);

/**
 * Format date
 */
const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Format currency
 */
const formatCurrency = (amount) => {
  return `₹${(amount || 0).toLocaleString("en-IN")}`;
};

/**
 * Status chip colors
 */
const statusColors = {
  scheduled: "info",
  confirmed: "primary",
  completed: "success",
  cancelled: "error",
  in_progress: "warning",
  pending: "warning",
  paid: "success",
  partial: "warning",
  unpaid: "error",
  delivered: "success",
  rejected: "error",
  partially_paid: "warning",
};

/**
 * Overview Tab Content
 */
const OverviewTab = ({ patient, onAssignMembership, onRefresh }) => {
  const {
    phone,
    email,
    gender,
    dateOfBirth,
    calculatedAge,
    address,
    bloodGroup,
    allergies,
    medicalHistory,
    emergencyContact,
    membership,
    notes,
  } = patient;

  // Pause/Cancel/Resume -- admin-only actions on the current membership,
  // matching the Void Invoice / Reopen Treatment reason-dialog pattern.
  const [membershipAction, setMembershipAction] = useState(null); // "pause" | "cancel" | "resume" | null
  const [membershipActionReason, setMembershipActionReason] = useState("");
  const {
    pauseMembership,
    resumeMembership,
    cancelMembership,
    isPausingMembership,
    isResumingMembership,
    isCancellingMembership,
  } = useMembershipMutations();

  const membershipActionBusy = isPausingMembership || isResumingMembership || isCancellingMembership;
  const reasonRequired = membershipAction === "pause" || membershipAction === "cancel";
  const reasonValid = !reasonRequired || membershipActionReason.trim().length >= 10;

  const closeMembershipActionDialog = () => {
    setMembershipAction(null);
    setMembershipActionReason("");
  };

  const submitMembershipAction = () => {
    const onSuccess = () => {
      toast.success(
        membershipAction === "pause"
          ? "Membership paused"
          : membershipAction === "resume"
          ? "Membership resumed"
          : "Membership cancelled"
      );
      closeMembershipActionDialog();
      onRefresh?.();
    };
    const onError = (err) => {
      toast.error(err?.response?.data?.message || "Action failed");
    };

    if (membershipAction === "pause") {
      pauseMembership({ patientId: patient._id, reason: membershipActionReason.trim() }, { onSuccess, onError });
    } else if (membershipAction === "resume") {
      resumeMembership({ patientId: patient._id, reason: membershipActionReason.trim() || undefined }, { onSuccess, onError });
    } else if (membershipAction === "cancel") {
      cancelMembership({ patientId: patient._id, reason: membershipActionReason.trim() }, { onSuccess, onError });
    }
  };

  const membershipActionCopy = {
    pause: {
      title: "Pause Membership",
      icon: <PauseCircleOutlineIcon color="warning" fontSize="small" />,
      helper: "Temporarily suspends membership benefits (e.g. free/discounted OPD fees). Can be resumed later. A reason of at least 10 characters is required for the audit trail.",
      color: "warning",
      confirmLabel: "Confirm Pause",
    },
    resume: {
      title: "Resume Membership",
      icon: <PlayCircleOutlineIcon color="success" fontSize="small" />,
      helper: "Restores membership benefits immediately. Validity dates are not auto-extended for the paused period.",
      color: "success",
      confirmLabel: "Confirm Resume",
    },
    cancel: {
      title: "Cancel Membership",
      icon: <CancelIcon color="error" fontSize="small" />,
      helper: "Permanently ends this membership -- unlike Pause, it cannot be resumed. This does NOT process a refund; use the payment's Refund action separately if money needs to go back. A reason of at least 10 characters is required for the audit trail.",
      color: "error",
      confirmLabel: "Confirm Cancel",
    },
  };
  const activeActionCopy = membershipAction ? membershipActionCopy[membershipAction] : null;

  // membershipStatusColors is now module-level (shared with MembershipTab).

  const lastStatusHistoryEntry = membership?.statusHistory?.length
    ? membership.statusHistory[membership.statusHistory.length - 1]
    : null;

  const paymentMethodLabels = {
    cash: "Cash",
    card: "Card",
    upi: "UPI",
    bank_transfer: "Bank Transfer",
    online: "Online",
  };

  return (
    <>
    <Grid container spacing={2}>
      {/* Left Column */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Box className="space-y-3">
          <Box>
            <SectionHeader title="Personal Information" icon={PersonIcon} />
            <Box className="bg-gray-50 rounded-lg p-2.5">
              <InfoRow icon={PhoneIcon} label="Phone" value={phone} color="text-blue-600" />
              <InfoRow icon={EmailIcon} label="Email" value={email} color="text-blue-600" />
              <InfoRow
                icon={PersonIcon}
                label="Gender"
                value={gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : null}
              />
              <InfoRow
                icon={CakeIcon}
                label="Date of Birth"
                value={dateOfBirth ? `${formatDate(dateOfBirth)} (${calculatedAge} years)` : null}
              />
            </Box>
          </Box>

          <Box>
            <SectionHeader title="Address" icon={LocationOnIcon} />
            <Box className="bg-gray-50 rounded-lg p-2.5">
              {address ? (
                <Typography variant="body2">
                  {[address.street, address.city, address.state, address.pincode]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </Typography>
              ) : (
                <Typography variant="body2" className="text-gray-400">
                  No address provided
                </Typography>
              )}
            </Box>
          </Box>

          <Box>
            <SectionHeader title="Emergency Contact" icon={ContactPhoneIcon} />
            <Box className="bg-gray-50 rounded-lg p-2.5">
              {emergencyContact?.name ? (
                <>
                  <Typography variant="body2" className="font-medium">
                    {emergencyContact.name}
                  </Typography>
                  <Typography variant="body2" className="text-gray-600">
                    {emergencyContact.phone} ({emergencyContact.relation || "Contact"})
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" className="text-gray-400">
                  No emergency contact
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Grid>

      {/* Right Column */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Box className="space-y-3">
          <Box>
            <SectionHeader title="Medical Information" icon={LocalHospitalIcon} />
            <Box className="bg-gray-50 rounded-lg p-2.5">
              <InfoRow label="Blood Group" value={bloodGroup} />
              <Box className="py-2">
                <Typography variant="caption" className="text-gray-500 block mb-1">
                  Allergies
                </Typography>
                {allergies?.length > 0 ? (
                  <Box className="flex flex-wrap gap-1">
                    {allergies.map((allergy, idx) => (
                      <Chip
                        key={idx}
                        label={allergy}
                        size="small"
                        color="error"
                        variant="outlined"
                        icon={<WarningAmberIcon />}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" className="text-gray-400">
                    No known allergies
                  </Typography>
                )}
              </Box>
              <Box className="py-2">
                <Typography variant="caption" className="text-gray-500 block mb-1">
                  Medical History
                </Typography>
                {medicalHistory?.length > 0 ? (
                  <Box className="flex flex-wrap gap-1">
                    {medicalHistory.map((condition, idx) => (
                      <Chip key={idx} label={condition} size="small" variant="outlined" />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" className="text-gray-400">
                    No medical history recorded
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          <Box>
            <Box className="flex items-center justify-between mb-2">
              <Box className="flex items-center gap-2">
                <CardMembershipIcon className="text-blue-600" fontSize="small" />
                <Typography
                  variant="subtitle2"
                  className="font-semibold text-gray-700 uppercase tracking-wide"
                >
                  Membership
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={onAssignMembership}
                sx={{ fontSize: "0.7rem" }}
              >
                Assign Membership
              </Button>
            </Box>
            <Box className="bg-gray-50 rounded-lg p-2.5">
              {membership?.status ? (
            <>
              <Box className="flex items-center justify-between mb-2">
                <Typography variant="body2" className="font-medium">
                  {membership.planName}
                </Typography>
                <Chip
                  label={membership.status}
                  size="small"
                  className="capitalize"
                  color={membershipStatusColors[membership.status] || "default"}
                />
              </Box>
              {membership.discountPercent != null && membership.discountPercent > 0 && (
                <Typography variant="caption" className="text-gray-500 block">
                  Discount: {membership.discountPercent}%
                </Typography>
              )}
              <Typography variant="caption" className="text-gray-500 block">
                Valid: {formatDate(membership.startDate)} - {formatDate(membership.expiryDate)}
              </Typography>
              {membership.amountPaid != null && (
                <Typography variant="caption" className="text-gray-500 block">
                  Amount paid: {formatCurrency(membership.amountPaid)}
                  {membership.paymentMethod
                    ? ` (${paymentMethodLabels[membership.paymentMethod] || membership.paymentMethod})`
                    : ""}
                </Typography>
              )}
              {membership.notes && (
                <Typography variant="caption" className="text-gray-500 block">
                  Notes: {membership.notes}
                </Typography>
              )}
              {(membership.status === "paused" || membership.status === "cancelled") && lastStatusHistoryEntry && (
                <Box className="mt-1.5 pt-1.5 border-t border-gray-200">
                  <Typography variant="caption" className="text-gray-500 block">
                    {membership.status === "paused" ? "Paused" : "Cancelled"} by{" "}
                    {lastStatusHistoryEntry.performedBy?.name || "admin"} on{" "}
                    {formatDate(lastStatusHistoryEntry.performedAt)}
                  </Typography>
                  {lastStatusHistoryEntry.reason && (
                    <Typography variant="caption" className="text-gray-500 block">
                      Reason: {lastStatusHistoryEntry.reason}
                    </Typography>
                  )}
                </Box>
              )}
              {membership.status === "active" && (
                <Box className="flex gap-1.5 mt-2">
                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    startIcon={<PauseCircleOutlineIcon />}
                    onClick={() => setMembershipAction("pause")}
                    sx={{ fontSize: "0.65rem", textTransform: "none" }}
                  >
                    Pause
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => setMembershipAction("cancel")}
                    sx={{ fontSize: "0.65rem", textTransform: "none" }}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
              {membership.status === "paused" && (
                <Box className="flex gap-1.5 mt-2">
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<PlayCircleOutlineIcon />}
                    onClick={() => setMembershipAction("resume")}
                    sx={{ fontSize: "0.65rem", textTransform: "none" }}
                  >
                    Resume
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => setMembershipAction("cancel")}
                    sx={{ fontSize: "0.65rem", textTransform: "none" }}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <Typography variant="body2" className="text-gray-400">
              No active membership
            </Typography>
          )}
            </Box>
          </Box>

          {notes && (
            <Box>
              <SectionHeader title="Notes" />
              <Box className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <Typography variant="body2">{notes}</Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Grid>
    </Grid>

    {/* Pause / Resume / Cancel Membership -- reason dialog, admin-only,
        matching the Void Invoice / Reopen Treatment pattern. */}
    <Dialog
      open={!!membershipAction}
      onClose={() => { if (!membershipActionBusy) closeMembershipActionDialog(); }}
      maxWidth="sm"
      fullWidth
    >
      {activeActionCopy && (
        <>
          <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {activeActionCopy.icon}
            {activeActionCopy.title}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {activeActionCopy.helper}
            </Typography>
            <TextField
              label={reasonRequired ? "Reason *" : "Reason (optional)"}
              multiline
              rows={3}
              fullWidth
              size="small"
              value={membershipActionReason}
              onChange={(e) => setMembershipActionReason(e.target.value)}
              disabled={membershipActionBusy}
              placeholder="Briefly explain why…"
              error={!reasonValid && membershipActionReason.length > 0}
              helperText={
                reasonRequired
                  ? `${membershipActionReason.trim().length}/10 minimum`
                  : "Optional for Resume"
              }
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeMembershipActionDialog} color="inherit" disabled={membershipActionBusy}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color={activeActionCopy.color}
              startIcon={membershipActionBusy ? <CircularProgress size={14} color="inherit" /> : activeActionCopy.icon}
              onClick={submitMembershipAction}
              disabled={membershipActionBusy || !reasonValid}
            >
              {membershipActionBusy ? "Working…" : activeActionCopy.confirmLabel}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
    </>
  );
};

/**
 * Membership Tab Content -- current + past memberships.
 *
 * Pure display: patient.membership (current) and patient.membershipHistory
 * (archived on every reassign/renew, confirmed via a real record) already
 * carry everything needed -- no schema change, no new fetch. Reuses the
 * exact status-color/statusHistory-summary logic from Overview's membership
 * card for visual consistency; Pause/Cancel/Resume actions stay on Overview
 * only (this tab is read-only history, not a second place to manage them).
 */
const membershipStatusColors = {
  active: "success",
  paused: "warning",
  cancelled: "error",
  expired: "default",
};

const MembershipHistoryCard = ({ entry, isCurrent }) => {
  const lastAction = entry.statusHistory?.length ? entry.statusHistory[entry.statusHistory.length - 1] : null;
  return (
    <Box
      className={isCurrent ? "rounded-lg p-3 border-2 border-indigo-200 bg-indigo-50" : "rounded-lg p-3 border border-gray-200 bg-gray-50"}
    >
      <Box className="flex items-center justify-between mb-1">
        <Typography variant="body2" className="font-semibold">
          {entry.planName || "—"}
        </Typography>
        <Chip
          label={entry.status}
          size="small"
          className="capitalize"
          color={membershipStatusColors[entry.status] || "default"}
        />
      </Box>
      {entry.discountPercent != null && entry.discountPercent > 0 && (
        <Typography variant="caption" className="text-gray-500 block">
          Discount: {entry.discountPercent}%
        </Typography>
      )}
      <Typography variant="caption" className="text-gray-500 block">
        Valid: {formatDate(entry.startDate)} - {formatDate(entry.expiryDate)}
      </Typography>
      {entry.amountPaid != null && (
        <Typography variant="caption" className="text-gray-500 block">
          Amount paid: {formatCurrency(entry.amountPaid)}
        </Typography>
      )}
      {lastAction && (
        <Typography variant="caption" className="text-gray-500 block mt-0.5">
          {lastAction.action === "cancelled" ? "Cancelled" : lastAction.action === "paused" ? "Paused" : "Resumed"} by{" "}
          {lastAction.performedBy?.name || "admin"} on {formatDate(lastAction.performedAt)}
          {lastAction.reason ? ` — ${lastAction.reason}` : ""}
        </Typography>
      )}
    </Box>
  );
};

const MembershipTab = ({ patient, onAssignMembership }) => {
  const { membership, membershipHistory } = patient;
  const pastMemberships = membershipHistory?.length
    ? [...membershipHistory].sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
    : [];

  if (!membership?.status && !pastMemberships.length) {
    return (
      <Box className="text-center py-8">
        <Typography className="text-gray-400 mb-3">No membership history</Typography>
        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={onAssignMembership}>
          Assign Membership
        </Button>
      </Box>
    );
  }

  return (
    <Box className="space-y-3">
      {membership?.status && <MembershipHistoryCard entry={membership} isCurrent />}
      {pastMemberships.length > 0 && (
        <Box>
          <Typography variant="caption" className="font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">
            Past Memberships
          </Typography>
          <Box className="space-y-2">
            {pastMemberships.map((entry, idx) => (
              <MembershipHistoryCard key={idx} entry={entry} />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

/**
 * Appointments Tab Content
 */
const AppointmentsTab = ({ patientId, patient, refreshKey, onRefresh }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [viewAppointment, setViewAppointment] = useState(null);
  const [viewLoadingId, setViewLoadingId] = useState(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPatientAppointments(patientId, { limit: 50 });
      setAppointments(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId) fetchAppointments();
  }, [patientId, refreshKey, fetchAppointments]);

  // This tab's own list endpoint (getPatientAppointments) never populates
  // `patient` -- it's already scoped to one known patient, so the list
  // response leaves it as a bare ObjectId. Passing that straight into
  // AppointmentDetailModal showed "Unknown Patient"/blank phone. Fetching
  // the real, fully-populated appointment on click (same pattern already
  // used for the Treatments tab's Treatment #/Linked OPD Visit columns, and
  // the same data source the main Appointments page's detail view uses)
  // guarantees full parity instead of patching just the one missing field.
  const openAppointmentDetail = async (appointmentId) => {
    setViewLoadingId(appointmentId);
    try {
      const res = await getAppointment(appointmentId);
      setViewAppointment(res.data?.appointment || res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load appointment details");
    } finally {
      setViewLoadingId(null);
    }
  };

  const handleEditClick = (appointment) => {
    setViewAppointment(null);
    setSelectedAppointment(appointment);
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    fetchAppointments();
    onRefresh?.();
  };

  if (loading) return <Box className="text-center py-8"><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!appointments.length) return <Typography className="text-gray-400 text-center py-8">No appointments found</Typography>;

  return (
    <>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead className="bg-gray-50">
            <TableRow>
              <TableCell>Appointment #</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Clinic</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.map((apt) => (
              <TableRow key={apt._id} hover>
                <TableCell
                  className="font-numbers"
                  onClick={() => openAppointmentDetail(apt._id)}
                  sx={{
                    color: "#4f46e5",
                    cursor: "pointer",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  {viewLoadingId === apt._id ? <CircularProgress size={12} /> : apt.appointmentNumber || "-"}
                </TableCell>
                <TableCell>{formatDate(apt.date)}</TableCell>
                <TableCell>{apt.timeSlot || "-"}</TableCell>
                <TableCell>{apt.clinic?.name || "-"}</TableCell>
                <TableCell>
                  <Chip size="small" label={apt.type?.replace("_", " ") || "Regular"} variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip size="small" label={apt.status} color={statusColors[apt.status] || "default"} />
                </TableCell>
                <TableCell>{apt.reason || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Appointment Modal */}
      <EditAppointmentModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onSuccess={handleEditSuccess}
      />

      {/* Appointment # click -- opens the same detail view used elsewhere in
          admin. Its own "Edit" button (onEdit) opens the same edit form the
          removed Actions-column pencil icon used to -- same capability,
          reached via the detail view instead of a separate row action. */}
      <AppointmentDetailModal
        open={!!viewAppointment}
        onClose={() => setViewAppointment(null)}
        appointment={viewAppointment}
        onEdit={handleEditClick}
      />
    </>
  );
};

/**
 * Treatments Tab Content
 */
const TreatmentsTab = ({ patientId }) => {
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewAppointment, setViewAppointment] = useState(null);
  const [viewTreatment, setViewTreatment] = useState(null);
  const [viewLoadingId, setViewLoadingId] = useState(null);

  const fetchTreatments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPatientTreatments(patientId, { limit: 50 });
      setTreatments(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load treatments");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId) fetchTreatments();
  }, [patientId, fetchTreatments]);

  // Treatment #/Linked OPD Visit columns are populated from this endpoint's
  // own trimmed shape (id + number only, no `patient`) -- fetch the real,
  // fully-populated appointment on demand via GET /appointments/:id
  // (getAppointmentById) so the detail modal (built for the raw Appointment
  // shape, reading appointment.patient?.name/.phone) renders correctly, same
  // as it does from the main Appointments page. This route previously fell
  // through to the phone-lookup route (no /:id route was ever wired), which
  // returned "Patient not found" for any appointment ObjectId -- fixed at
  // the backend routing layer.
  const openAppointmentDetail = async (appointmentId) => {
    if (!appointmentId) return;
    setViewLoadingId(appointmentId);
    try {
      const res = await getAppointment(appointmentId);
      setViewAppointment(res.data?.appointment || res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load appointment details");
    } finally {
      setViewLoadingId(null);
    }
  };

  // Treatment # opens the richer Treatment Plan detail view (sessions,
  // billing, Edit Treatment) instead of the plain OPD-style
  // AppointmentDetailModal -- same fetch-on-click fix as above, just routed
  // to the treatment-specific modal.
  const openTreatmentDetail = async (appointmentId) => {
    if (!appointmentId) return;
    setViewLoadingId(appointmentId);
    try {
      const res = await getAppointment(appointmentId);
      setViewTreatment(res.data?.appointment || res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load treatment details");
    } finally {
      setViewLoadingId(null);
    }
  };

  if (loading) return <Box className="text-center py-8"><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!treatments.length) return <Typography className="text-gray-400 text-center py-8">No treatments found</Typography>;

  return (
    <>
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead className="bg-gray-50">
          <TableRow>
            <TableCell>Treatment #</TableCell>
            <TableCell>Linked OPD Visit</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Treatment</TableCell>
            <TableCell>Clinic</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Cost</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {treatments.map((trt) => (
            <TableRow key={trt._id} hover>
              <TableCell
                className="font-numbers"
                onClick={() => openTreatmentDetail(trt._id)}
                sx={{
                  color: "#4f46e5",
                  cursor: "pointer",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                {viewLoadingId === trt._id ? (
                  <CircularProgress size={12} />
                ) : (
                  trt.appointmentNumber || "-"
                )}
              </TableCell>
              <TableCell
                className="font-numbers"
                onClick={() =>
                  trt.originatingOpdAppointment && openAppointmentDetail(trt.originatingOpdAppointment._id)
                }
                sx={
                  trt.originatingOpdAppointment
                    ? { color: "#4f46e5", cursor: "pointer", "&:hover": { textDecoration: "underline" } }
                    : { color: "text.disabled" }
                }
              >
                {viewLoadingId === trt.originatingOpdAppointment?._id ? (
                  <CircularProgress size={12} />
                ) : (
                  trt.originatingOpdAppointment?.appointmentNumber || "—"
                )}
              </TableCell>
              <TableCell>{formatDate(trt.createdAt)}</TableCell>
              <TableCell>{trt.treatmentType?.name || trt.name || "-"}</TableCell>
              <TableCell>{trt.clinic?.name || "-"}</TableCell>
              <TableCell>
                <Chip size="small" label={trt.status} color={statusColors[trt.status] || "default"} />
              </TableCell>
              <TableCell>{formatCurrency(trt.cost ?? trt.treatmentType?.price ?? 0)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>

    <AppointmentDetailModal
      open={!!viewAppointment}
      onClose={() => setViewAppointment(null)}
      appointment={viewAppointment}
    />

    <TreatmentPlanDetailModal
      open={!!viewTreatment}
      onClose={() => setViewTreatment(null)}
      appointment={viewTreatment}
      onRefetch={() => {
        fetchTreatments();
        if (viewTreatment?._id) openTreatmentDetail(viewTreatment._id);
      }}
    />
    </>
  );
};

/**
 * Tests Tab Content
 */
const TestsTab = ({ patientId }) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const res = await getPatientTests(patientId, { limit: 50 });
        setTests(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load tests");
      } finally {
        setLoading(false);
      }
    };
    if (patientId) fetchTests();
  }, [patientId]);

  if (loading) return <Box className="text-center py-8"><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!tests.length) return <Typography className="text-gray-400 text-center py-8">No tests found</Typography>;

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead className="bg-gray-50">
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Test Name</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Cost</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tests.map((test) => (
            <TableRow key={test._id} hover>
              <TableCell>{formatDate(test.createdAt || test.date)}</TableCell>
              <TableCell>{test.testType?.name || test.name || "-"}</TableCell>
              <TableCell>
                <Chip size="small" label={test.testType?.category || test.category || "-"} variant="outlined" />
              </TableCell>
              <TableCell>
                <Chip size="small" label={test.status || "pending"} color={statusColors[test.status] || "default"} />
              </TableCell>
              <TableCell>{formatCurrency(test.cost || test.testType?.price)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/**
 * Payment History Tab Content
 * Shows one row per Payment transaction (not per invoice).
 * Read-only — actions (Record Payment, Refund) are on the Billing page.
 */
const PaymentsTab = ({ patientId, refreshKey }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const payRes = await getPayments({ patient: patientId, limit: 50 });
      setPayments(payRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load payment history");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId) fetchData();
  }, [patientId, refreshKey, fetchData]);

  if (loading) return <Box className="text-center py-8"><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  const paymentMethodLabel = (method) => {
    const map = {
      cash: "Cash", card: "Card", upi: "UPI", online: "Online",
      razorpay: "Online", "pay-at-clinic": "Pay at Clinic", free: "Free",
    };
    return map[method] || (method ? method.replace(/-/g, " ") : "-");
  };

  const paymentTypeLabel = (type) => {
    const map = {
      opd_fee: "Appointment Fee", treatment: "Treatment", invoice_payment: "Invoice Payment",
      consultation: "Consultation", membership: "Membership",
      advance: "Advance", refund: "Refund", other: "Other",
    };
    return map[type] || (type ? type.replace(/_/g, " ") : "-");
  };

  const paymentStatusColors = {
    paid: "success", refunded: "error", reversed: "default",
    pending: "warning", failed: "error", cancelled: "default", refund_pending: "warning",
  };

  const formatDateTime = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };

  const sorted = [...payments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <>
      {!sorted.length ? (
        <Typography className="text-gray-400 text-center py-8">
          No payments recorded for this patient yet.
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead className="bg-gray-50">
              <TableRow>
                <TableCell>Date & Time</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Invoice</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((pay) => (
                <TableRow key={pay._id} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDateTime(pay.createdAt)}</TableCell>
                  <TableCell className="font-numbers font-semibold text-green-700">
                    {formatCurrency(pay.amount)}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={paymentMethodLabel(pay.paymentMode)} variant="outlined" />
                  </TableCell>
                  <TableCell>{paymentTypeLabel(pay.type)}</TableCell>
                  <TableCell className="font-numbers text-gray-500">
                    {pay.invoice?.invoiceNumber || pay.settledInvoices?.[0]?.invoiceNumber || "—"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={pay.status || "-"}
                      color={paymentStatusColors[pay.status] || "default"}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
};

/**
 * Reports Tab Content
 */
const ReportsTab = ({ patientId }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewReport, setPreviewReport] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await getPatientReports(patientId, { limit: 50 });
        setReports(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    if (patientId) fetchReports();
  }, [patientId]);

  if (loading) return <Box className="text-center py-8"><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!reports.length) return <Typography className="text-gray-400 text-center py-8">No reports found</Typography>;

  return (
    <>
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead className="bg-gray-50">
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Uploaded By</TableCell>
            <TableCell align="center">File</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reports.map((rpt) => {
            // Multi-file reports store data in files[] -- the legacy
            // singular `file` field is a Mongoose-default-populated
            // placeholder ({ fileType: "application/pdf" }, no url) that's
            // always truthy but never useful. files[] first, `file` only
            // as a fallback for reports predating multi-file support.
            //
            // A tiny per-row View/Download icon was hard to tap accurately
            // on mobile -- tapping ANYWHERE on the row now opens the
            // full-screen ReportPreviewModal (large Back/Download buttons).
            const reportFiles = rpt.files?.length > 0 ? rpt.files : rpt.file?.url ? [rpt.file] : [];
            return (
              <TableRow
                key={rpt._id}
                hover
                onClick={() => setPreviewReport(rpt)}
                sx={{ cursor: reportFiles.length > 0 ? "pointer" : "default" }}
              >
                <TableCell>{formatDate(rpt.createdAt)}</TableCell>
                <TableCell>{rpt.title || "-"}</TableCell>
                <TableCell>
                  <Chip size="small" label={rpt.category?.replace("_", " ") || "-"} variant="outlined" />
                </TableCell>
                <TableCell>{rpt.uploadedBy?.name || "-"}</TableCell>
                <TableCell align="center">
                  {reportFiles.length === 0 ? (
                    <Typography variant="caption" color="text.disabled">-</Typography>
                  ) : (
                    <Tooltip title="Tap row to view">
                      <VisibilityIcon fontSize="small" color="action" />
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>

    <ReportPreviewModal
      open={!!previewReport}
      onClose={() => setPreviewReport(null)}
      report={previewReport}
    />
    </>
  );
};

/**
 * Invoices Tab Content
 */
const InvoicesTab = ({ patientId, paymentStatusFilter, onSetFilter, onClearFilter }) => {
  const [invoices, setInvoices] = useState([]);
  const [invoiceStats, setInvoiceStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const params = { patient: patientId, limit: 50 };
        if (paymentStatusFilter) params.paymentStatus = paymentStatusFilter;
        const [invRes, statsRes] = await Promise.all([
          getInvoices(params),
          getBillingStats({ patient: patientId }),
        ]);
        setInvoices(invRes.data || []);
        setInvoiceStats(statsRes.data?.stats || null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load invoices");
      } finally {
        setLoading(false);
      }
    };
    if (patientId) fetchInvoices();
  }, [patientId, paymentStatusFilter]);

  if (loading) return <Box className="text-center py-8"><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <>
      {/* Invoice-based billing summary — same source/computation as the
          Billing page, just relocated here from Payment History (these are
          invoice-level metrics). */}
      {invoiceStats && (
        <Box className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <Box className="bg-purple-50 rounded-lg p-4 text-center">
            <Typography variant="h6" className="font-numbers font-bold text-purple-600">
              {formatCurrency(invoiceStats.totalAmount)}
            </Typography>
            <Typography variant="caption" className="text-gray-600">Total Amount</Typography>
          </Box>
          <Box className="bg-green-50 rounded-lg p-4 text-center">
            <Typography variant="h6" className="font-numbers font-bold text-green-600">
              {formatCurrency(invoiceStats.totalPaid)}
            </Typography>
            <Typography variant="caption" className="text-gray-600">Total Paid</Typography>
          </Box>
          <Box
            className="bg-red-50 rounded-lg p-4 text-center cursor-pointer hover:bg-red-100 transition-colors"
            onClick={() => onSetFilter?.("unpaid")}
          >
            <Typography variant="h6" className="font-numbers font-bold text-red-600">
              {formatCurrency(invoiceStats.totalDue)}
            </Typography>
            <Typography variant="caption" className="text-gray-600">Balance Due</Typography>
          </Box>
          <Box className="bg-blue-50 rounded-lg p-4 text-center">
            <Typography variant="h6" className="font-numbers font-bold text-blue-600">
              {invoiceStats.totalInvoices || 0}
            </Typography>
            <Typography variant="caption" className="text-gray-600">Invoices</Typography>
          </Box>
        </Box>
      )}

      {paymentStatusFilter && (
        <Box className="flex items-center gap-2 mb-3">
          <Chip
            label={`Filter: ${paymentStatusFilter.replace(/_/g, " ")}`}
            size="small"
            color="warning"
            onDelete={onClearFilter}
          />
          <Typography variant="caption" className="text-gray-500">
            Click × to show all invoices
          </Typography>
        </Box>
      )}

      {!invoices.length ? (
        <Typography className="text-gray-400 text-center py-8">
          {paymentStatusFilter
            ? `No ${paymentStatusFilter.replace(/_/g, " ")} invoices found for this patient.`
            : "No invoices found for this patient."}
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead className="bg-gray-50">
              <TableRow>
                <TableCell>Invoice No.</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell>Balance Due</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv._id} hover>
                  <TableCell className="font-numbers">{inv.invoiceNumber || "-"}</TableCell>
                  <TableCell>{formatDate(inv.createdAt)}</TableCell>
                  <TableCell>
                    {inv.items?.length > 0 ? inv.items[0].description || "-" : "-"}
                    {inv.items?.length > 1 && (
                      <Typography component="span" variant="caption" className="text-gray-400">
                        {` +${inv.items.length - 1} more`}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(inv.grandTotal)}</TableCell>
                  <TableCell className="text-green-600">{formatCurrency(inv.amountPaid)}</TableCell>
                  <TableCell className="text-red-600">{formatCurrency(inv.balanceDue)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={inv.paymentStatus?.replace(/_/g, " ") || "-"}
                      color={statusColors[inv.paymentStatus] || "default"}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Invoice">
                      <IconButton
                        size="small"
                        onClick={() => { setSelectedInvoice(inv); setInvoiceModalOpen(true); }}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <InvoiceDetailModal
        open={invoiceModalOpen}
        onClose={() => { setInvoiceModalOpen(false); setSelectedInvoice(null); }}
        invoice={selectedInvoice}
        onRefresh={() => {
          setInvoiceModalOpen(false);
          setSelectedInvoice(null);
        }}
      />
    </>
  );
};

/**
 * Lab Orders Tab Content
 * Fetches all lab orders and filters client-side by patient ID.
 */
const LabOrdersTab = ({ patientId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await getLabOrders({ limit: 200 });
        const all = res.data || [];
        setOrders(
          all.filter((o) => String(o.patient?._id || o.patient) === String(patientId))
        );
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load lab orders");
      } finally {
        setLoading(false);
      }
    };
    if (patientId) fetchOrders();
  }, [patientId]);

  if (loading) return <Box className="text-center py-8"><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!orders.length) return <Typography className="text-gray-400 text-center py-8">No lab orders found for this patient.</Typography>;

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead className="bg-gray-50">
          <TableRow>
            <TableCell>Order No.</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Lab</TableCell>
            <TableCell>Items</TableCell>
            <TableCell>Delivery</TableCell>
            <TableCell>Payment</TableCell>
            <TableCell>Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order._id} hover>
              <TableCell className="font-numbers">{order.orderNumber || "-"}</TableCell>
              <TableCell>{formatDate(order.orderDate)}</TableCell>
              <TableCell>{order.lab?.name || "-"}</TableCell>
              <TableCell>
                {order.items?.length > 0
                  ? order.items.map((it) => it.procedure).join(", ")
                  : "-"}
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={order.deliveryStatus?.replace(/_/g, " ") || "-"}
                  color={statusColors[order.deliveryStatus] || "default"}
                />
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={order.paymentStatus?.replace(/_/g, " ") || "-"}
                  color={statusColors[order.paymentStatus] || "default"}
                />
              </TableCell>
              <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/**
 * Main Component
 */
const PatientDetailModal = ({ open, onClose, patient, onEdit, onDelete, onReactivate, onRefresh }) => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [assignMembershipOpen, setAssignMembershipOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [permDeleteConfirmOpen, setPermDeleteConfirmOpen] = useState(false);
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("");

  // Reset tab when modal opens
  useEffect(() => {
    if (open) setActiveTab(0);
  }, [open]);

  // Trigger refresh for child components
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    onRefresh?.();
  };

  const handlePermDelete = async () => {
    try {
      setPermDeleteConfirmOpen(false);
      const result = await deletePatient(patient._id);
      const patientName = result?.data?.name || patient?.name || "Patient";
      toast.success(`"${patientName}" has been permanently deleted.`);
      onClose();
      queryClient.invalidateQueries({ queryKey: ["admin", "patients"] });
      queryClient.refetchQueries({ queryKey: ["admin", "patients"] });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete patient");
    }
  };

  if (!patient) return null;

  const { name, isActive, hasMembership, membership, currentDiscount, createdAt, updatedAt } = patient;

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: "8px", maxHeight: "90vh" } }}
    >
      {/* Header */}
      <DialogTitle className="bg-linear-to-r from-indigo-600 to-indigo-700 text-white" sx={{ p: 0 }}>
        <Box className="flex items-center justify-between px-4 py-2">
          <Box className="flex items-center gap-3">
            <Avatar className="bg-white text-blue-600 font-bold" sx={{ width: 40, height: 40, fontSize: "1rem" }}>
              {name?.[0]?.toUpperCase() || "P"}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" className="font-bold leading-tight">
                {name || "Unknown Patient"}
              </Typography>
              <Box className="flex items-center gap-2 mt-0.5">
                <Chip
                  label={isActive ? "Active" : "Inactive"}
                  size="small"
                  color={isActive ? "success" : "error"}
                  sx={!isActive ? { bgcolor: "#ef4444", color: "#fff" } : {}}
                />
                {hasMembership && (
                  <Chip
                    label={`${membership?.planName} (${currentDiscount}% off)`}
                    size="small"
                    sx={{ bgcolor: "#fef9c3", color: "#92400e", fontWeight: 500 }}
                  />
                )}
              </Box>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon className="text-white" fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Tabs */}
      <Box className="border-b border-gray-200 px-4">
        <Tabs
          value={activeTab}
          onChange={(_, val) => {
            if (val === 5) setInvoiceStatusFilter("");
            setActiveTab(val);
          }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 36,
            "& .MuiTab-root": { minHeight: 36, py: 0.5, px: 1.5, fontSize: "0.75rem", fontWeight: 600, textTransform: "none", minWidth: 0 },
          }}
        >
          <Tab label="Overview" />
          <Tab label="Membership" />
          <Tab label="Appointments" />
          <Tab label="Treatments" />
          <Tab label="Tests" />
          <Tab label="Invoices" />
          <Tab label="Payment History" />
          <Tab label="Reports" />
          <Tab label="Lab" />
        </Tabs>
      </Box>

      {/* Content — scrolls within the dialog; the pinned footer below stays clear.
          overflowY forced so content never hides behind the action buttons. */}
      <DialogContent
        className="p-4"
        sx={{ overflowY: "auto !important" }}
      >
        <TabPanel value={activeTab} index={0}>
          <OverviewTab
            patient={patient}
            onAssignMembership={() => setAssignMembershipOpen(true)}
            onRefresh={handleRefresh}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <MembershipTab
            patient={patient}
            onAssignMembership={() => setAssignMembershipOpen(true)}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <AppointmentsTab
            patientId={patient._id}
            patient={patient}
            refreshKey={refreshKey}
            onRefresh={handleRefresh}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          <TreatmentsTab patientId={patient._id} />
        </TabPanel>
        <TabPanel value={activeTab} index={4}>
          <TestsTab patientId={patient._id} />
        </TabPanel>
        <TabPanel value={activeTab} index={5}>
          <InvoicesTab
            patientId={patient._id}
            paymentStatusFilter={invoiceStatusFilter}
            onSetFilter={setInvoiceStatusFilter}
            onClearFilter={() => setInvoiceStatusFilter("")}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={6}>
          <PaymentsTab patientId={patient._id} refreshKey={refreshKey} />
        </TabPanel>
        <TabPanel value={activeTab} index={7}>
          <ReportsTab patientId={patient._id} />
        </TabPanel>
        <TabPanel value={activeTab} index={8}>
          <LabOrdersTab patientId={patient._id} />
        </TabPanel>

      </DialogContent>

      {/* Actions — pinned footer, clearly separated with a top divider */}
      <DialogActions
        className="p-3 bg-gray-50 justify-between"
        sx={{ borderTop: 1, borderColor: "divider", flexWrap: "wrap", rowGap: 1 }}
      >
        <Box className="flex gap-2 flex-wrap">
          <Button
            variant="outlined"
            startIcon={<LockResetIcon />}
            onClick={() => setResetPasswordOpen(true)}
            sx={{ textTransform: "none", fontSize: "12px", py: 0.5, px: 1.5 }}
          >
            Reset Password
          </Button>
          <Button
            variant="outlined"
            startIcon={<EventRepeatIcon />}
            onClick={() => setFollowUpOpen(true)}
            sx={{ textTransform: "none", fontSize: "12px", py: 0.5, px: 1.5 }}
          >
            Add Follow-up Reminder
          </Button>
          {onDelete && isActive && (
            <Tooltip
              title={hasMembership ? "Patient has an active membership — cannot deactivate." : ""}
              arrow
            >
              <span>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => onDelete(patient)}
                  disabled={hasMembership}
                  sx={{ textTransform: "none", fontSize: "12px", py: 0.5, px: 1.5 }}
                >
                  Deactivate
                </Button>
              </span>
            </Tooltip>
          )}
          {onDelete && !isActive && (
            <>
              <Button
                variant="outlined"
                color="success"
                onClick={() => onReactivate?.(patient)}
                sx={{ textTransform: "none", fontSize: "12px", py: 0.5, px: 1.5 }}
              >
                Activate
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setPermDeleteConfirmOpen(true)}
                sx={{ textTransform: "none", fontSize: "12px", py: 0.5, px: 1.5 }}
              >
                Delete Permanently
              </Button>
            </>
          )}
        </Box>
        <Box className="flex gap-2 flex-wrap">
          <Button onClick={onClose} color="inherit" sx={{ textTransform: "none", fontSize: "12px", py: 0.5, px: 1.5 }}>
            Close
          </Button>
          {onEdit && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => onEdit(patient)}
              className="bg-blue-600 hover:bg-blue-700"
              sx={{ textTransform: "none", fontSize: "12px", py: 0.5, px: 1.5 }}
            >
              Edit Patient
            </Button>
          )}
        </Box>
      </DialogActions>


      {/* Assign Membership Modal */}
      <AssignMembershipModal
        open={assignMembershipOpen}
        onClose={() => setAssignMembershipOpen(false)}
        patient={patient}
        onSuccess={handleRefresh}
      />

      {/* Reset / Set Password */}
      <ResetPasswordDialog
        open={resetPasswordOpen}
        onClose={() => setResetPasswordOpen(false)}
        patient={patient}
      />

      {/* Follow-up Reminder (reminder only — no payment) */}
      <FollowUpReminderModal
        open={followUpOpen}
        onClose={() => setFollowUpOpen(false)}
        patient={patient}
      />
    </Dialog>

    <ConfirmDialog
      open={permDeleteConfirmOpen}
      onClose={() => setPermDeleteConfirmOpen(false)}
      onConfirm={handlePermDelete}
      title="Permanently Delete Patient"
      message={`Permanently delete ${name}? This cannot be undone.`}
      confirmText="Delete Permanently"
      confirmColor="error"
    />
    </>
  );
};

export default PatientDetailModal;
