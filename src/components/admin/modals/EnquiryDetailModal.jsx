/**
 * Enquiry Detail Modal
 *
 * Shows full lead details with actions:
 * - Change status, assign staff, add notes
 * - Schedule follow-up, mark spam, convert to patient
 */
import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  TextField,
  MenuItem,
  Divider,
  Paper,
  Avatar,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import PhoneIcon from "@mui/icons-material/Phone";
import SendIcon from "@mui/icons-material/Send";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import BlockIcon from "@mui/icons-material/Block";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { toast } from "react-toastify";
import { useEnquiry, useEnquiryMutations } from "../../../hooks/admin/useEnquiries";
import { useUsers } from "../../../hooks/admin/useUsers";
import ConfirmDialog from "../../common/ConfirmDialog";

const statusConfig = {
  new: { color: "info", label: "New" },
  contacted: { color: "primary", label: "Contacted" },
  appointment_scheduled: { color: "success", label: "Apt Scheduled" },
  visited: { color: "warning", label: "Visited" },
  converted: { color: "secondary", label: "Converted" },
  not_interested: { color: "error", label: "Not Interested" },
  invalid: { color: "default", label: "Invalid" },
  closed: { color: "default", label: "Closed" },
};

const statusOptions = Object.entries(statusConfig).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateShort = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const InfoRow = ({ label, children }) => (
  <Box className="flex justify-between py-1">
    <Typography variant="body2" className="text-gray-500">{label}</Typography>
    <Typography variant="body2" className="font-medium">{children}</Typography>
  </Box>
);

const EnquiryDetailModal = ({ open, onClose, enquiry, onRefresh }) => {
  const [newNote, setNewNote] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [activeAction, setActiveAction] = useState(null); // "status" | "assign" | "note" | "followup"
  const [spamConfirmOpen, setSpamConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const { data: fullData, isLoading, refetch } = useEnquiry(enquiry?._id);
  const enq = fullData?.data?.enquiry || enquiry;

  const { data: usersData } = useUsers({ limit: 100 });
  const staffList = usersData?.data?.users || usersData?.data || [];

  const {
    updateStatus, isUpdatingStatus,
    assignEnquiry, isAssigning,
    addNote, isAddingNote,
    scheduleFollowUp, isScheduling,
    markAsSpam, isMarkingSpam,
    markConverted, isConverting,
    deleteEnquiry, isDeleting,
  } = useEnquiryMutations();

  const resetActions = () => {
    setActiveAction(null);
    setNewNote("");
    setNewStatus("");
    setStatusNote("");
    setAssignTo("");
    setFollowUpDate("");
  };

  const handleClose = () => {
    resetActions();
    onClose();
  };

  const onMutationSuccess = () => {
    refetch();
    onRefresh?.();
    resetActions();
  };

  const onMutationError = (err) => {
    toast.error(err.response?.data?.message || "Action failed");
  };

  const handleStatusChange = () => {
    if (!newStatus) return toast.error("Select a status");
    updateStatus(
      { id: enq._id, data: { status: newStatus, note: statusNote } },
      { onSuccess: onMutationSuccess, onError: onMutationError }
    );
  };

  const handleAssign = () => {
    if (!assignTo) return toast.error("Select a staff member");
    assignEnquiry(
      { id: enq._id, data: { assignedTo: assignTo } },
      { onSuccess: onMutationSuccess, onError: onMutationError }
    );
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return toast.error("Enter a note");
    addNote(
      { id: enq._id, data: { text: newNote.trim() } },
      { onSuccess: onMutationSuccess, onError: onMutationError }
    );
  };

  const handleFollowUp = () => {
    if (!followUpDate) return toast.error("Select a date");
    scheduleFollowUp(
      { id: enq._id, data: { nextFollowUp: followUpDate } },
      { onSuccess: onMutationSuccess, onError: onMutationError }
    );
  };

  const handleSpam = () => setSpamConfirmOpen(true);

  const doSpam = () => {
    setSpamConfirmOpen(false);
    markAsSpam(
      { id: enq._id, data: { isSpam: !enq?.isSpam } },
      { onSuccess: onMutationSuccess, onError: onMutationError }
    );
  };

  const handleDelete = () => setDeleteConfirmOpen(true);

  const doDelete = () => {
    setDeleteConfirmOpen(false);
    deleteEnquiry(enq._id, {
      onSuccess: () => { onRefresh?.(); handleClose(); },
      onError: onMutationError,
    });
  };

  if (!enquiry) return null;

  const status = statusConfig[enq?.status] || statusConfig.new;

  return (
    <>
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ className: "rounded-xl" }}>
      {/* Header */}
      <DialogTitle className="bg-linear-to-r from-teal-600 to-teal-700 text-white">
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-3">
            <PhoneIcon />
            <Box>
              <Typography variant="h6" component="span" className="font-bold">
                {enq?.name || "Enquiry"}
              </Typography>
              <Box className="flex gap-2 mt-0.5">
                <Chip label={enq?.enquiryNumber || "-"} size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }} className="text-xs font-mono" />
                <Chip label={status.label} size="small" color={status.color} className="text-xs" />
                {enq?.isUrgent && <Chip label="Urgent" size="small" color="error" className="text-xs" />}
                {enq?.isSpam && <Chip label="Spam" size="small" color="default" className="text-xs" />}
              </Box>
            </Box>
          </Box>
          <IconButton onClick={handleClose}><CloseIcon className="text-white" /></IconButton>
        </Box>
      </DialogTitle>

      <DialogContent className="p-6 mt-2">
        {isLoading ? (
          <Box className="text-center py-8"><CircularProgress /></Box>
        ) : (
          <>
            {/* Contact & Enquiry Info */}
            <Grid container spacing={3} className="mb-4">
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper variant="outlined" className="p-3">
                  <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-2">Contact</Typography>
                  <InfoRow label="Phone">{enq?.phone || "-"}</InfoRow>
                  <InfoRow label="Email">{enq?.email || "-"}</InfoRow>
                  <InfoRow label="Treatment">{enq?.treatmentName || "-"}</InfoRow>
                  <InfoRow label="Source Page">{enq?.source?.referrer || enq?.source?.page || "-"}</InfoRow>
                  <InfoRow label="Page URL">{enq?.source?.page || "-"}</InfoRow>
                  <InfoRow label="Preferred Date">{formatDateShort(enq?.preferredDate)}</InfoRow>
                  <InfoRow label="Preferred Time">{enq?.preferredTime || "-"}</InfoRow>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper variant="outlined" className="p-3">
                  <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-2">Status</Typography>
                  <InfoRow label="Assigned To">{enq?.assignedTo?.name || "Unassigned"}</InfoRow>
                  <InfoRow label="Follow-ups">{enq?.followUpCount || 0}</InfoRow>
                  <InfoRow label="Next Follow-up">{formatDateShort(enq?.nextFollowUp)}</InfoRow>
                  <InfoRow label="Last Contact">{formatDate(enq?.lastContactedAt)}</InfoRow>
                  <InfoRow label="Created">{formatDate(enq?.createdAt)}</InfoRow>
                </Paper>
              </Grid>
            </Grid>

            {/* Message */}
            {enq?.message && (
              <Paper variant="outlined" className="p-3 mb-4 bg-gray-50">
                <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-1">Message</Typography>
                <Typography variant="body2">{enq.message}</Typography>
              </Paper>
            )}

            {/* Source Info */}
            {enq?.source?.utm_source && (
              <Paper variant="outlined" className="p-3 mb-4">
                <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-1">Source</Typography>
                <Box className="flex flex-wrap gap-2">
                  {enq.source.utm_source && <Chip label={`Source: ${enq.source.utm_source}`} size="small" variant="outlined" />}
                  {enq.source.utm_medium && <Chip label={`Medium: ${enq.source.utm_medium}`} size="small" variant="outlined" />}
                  {enq.source.utm_campaign && <Chip label={`Campaign: ${enq.source.utm_campaign}`} size="small" variant="outlined" />}
                  {enq.source.device && <Chip label={enq.source.device} size="small" variant="outlined" />}
                </Box>
              </Paper>
            )}

            {/* Inline Action Forms */}
            {activeAction === "status" && (
              <Paper className="p-4 mb-3 bg-blue-50 border border-blue-200">
                <Typography variant="subtitle2" className="font-semibold text-blue-800 mb-2">Change Status</Typography>
                <Box className="flex items-center gap-3">
                  <TextField select size="small" label="Status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} sx={{ minWidth: 180 }}>
                    {statusOptions.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                  </TextField>
                  <TextField size="small" label="Note (optional)" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} className="flex-1" />
                  <Button variant="contained" size="small" onClick={handleStatusChange} disabled={isUpdatingStatus}
                    startIcon={isUpdatingStatus ? <CircularProgress size={16} /> : <SendIcon />}>
                    Update
                  </Button>
                  <Button size="small" onClick={resetActions}>Cancel</Button>
                </Box>
              </Paper>
            )}

            {activeAction === "assign" && (
              <Paper className="p-4 mb-3 bg-purple-50 border border-purple-200">
                <Typography variant="subtitle2" className="font-semibold text-purple-800 mb-2">Assign to Staff</Typography>
                <Box className="flex items-center gap-3">
                  <TextField select size="small" label="Staff Member" value={assignTo} onChange={(e) => setAssignTo(e.target.value)} sx={{ minWidth: 220 }}>
                    {(Array.isArray(staffList) ? staffList : []).map((u) => <MenuItem key={u._id} value={u._id}>{u.name} ({u.role})</MenuItem>)}
                  </TextField>
                  <Button variant="contained" size="small" color="secondary" onClick={handleAssign} disabled={isAssigning}
                    startIcon={isAssigning ? <CircularProgress size={16} /> : <PersonAddIcon />}>
                    Assign
                  </Button>
                  <Button size="small" onClick={resetActions}>Cancel</Button>
                </Box>
              </Paper>
            )}

            {activeAction === "note" && (
              <Paper className="p-4 mb-3 bg-yellow-50 border border-yellow-200">
                <Typography variant="subtitle2" className="font-semibold text-yellow-800 mb-2">Add Note</Typography>
                <Box className="flex items-center gap-3">
                  <TextField size="small" label="Note" value={newNote} onChange={(e) => setNewNote(e.target.value)} className="flex-1" multiline rows={2} />
                  <Button variant="contained" size="small" color="warning" onClick={handleAddNote} disabled={isAddingNote}
                    startIcon={isAddingNote ? <CircularProgress size={16} /> : <NoteAddIcon />}>
                    Add
                  </Button>
                  <Button size="small" onClick={resetActions}>Cancel</Button>
                </Box>
              </Paper>
            )}

            {activeAction === "followup" && (
              <Paper className="p-4 mb-3 bg-green-50 border border-green-200">
                <Typography variant="subtitle2" className="font-semibold text-green-800 mb-2">Schedule Follow-up</Typography>
                <Box className="flex items-center gap-3">
                  <TextField type="datetime-local" size="small" label="Follow-up Date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 220 }} />
                  <Button variant="contained" size="small" color="success" onClick={handleFollowUp} disabled={isScheduling}
                    startIcon={isScheduling ? <CircularProgress size={16} /> : <ScheduleIcon />}>
                    Schedule
                  </Button>
                  <Button size="small" onClick={resetActions}>Cancel</Button>
                </Box>
              </Paper>
            )}

            {/* Notes History */}
            {enq?.notes?.length > 0 && (
              <Box className="mb-4">
                <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-2">Notes ({enq.notes.length})</Typography>
                {enq.notes.map((note, idx) => (
                  <Paper key={note._id || idx} variant="outlined" className="p-2 mb-2">
                    <Box className="flex items-start gap-2">
                      <Avatar sx={{ width: 24, height: 24, fontSize: 11 }} className="bg-gray-200 text-gray-600 mt-0.5">
                        {note.addedBy?.name?.[0] || "?"}
                      </Avatar>
                      <Box className="flex-1">
                        <Typography variant="body2">{note.text}</Typography>
                        <Typography variant="caption" className="text-gray-400">
                          {note.addedBy?.name || "Admin"} &middot; {formatDate(note.addedAt)}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}

            {/* Status History */}
            {enq?.statusHistory?.length > 0 && (
              <Box>
                <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-2">Status History</Typography>
                {enq.statusHistory.map((entry, idx) => {
                  const cfg = statusConfig[entry.status] || statusConfig.new;
                  return (
                    <Box key={idx} className="flex items-center gap-2 mb-1.5">
                      <Chip label={cfg.label} size="small" color={cfg.color} sx={{ minWidth: 100 }} />
                      <Typography variant="caption" className="text-gray-500">
                        {formatDate(entry.changedAt)} {entry.changedBy?.name ? `by ${entry.changedBy.name}` : ""}
                      </Typography>
                      {entry.note && <Typography variant="caption" className="text-gray-400 italic">— {entry.note}</Typography>}
                    </Box>
                  );
                })}
              </Box>
            )}

            {/* Converted Info */}
            {enq?.status === "converted" && enq?.convertedToPatient && (
              <Paper className="p-3 mt-3 bg-green-50 border border-green-200">
                <Typography variant="caption" className="text-green-800 font-semibold">Converted to Patient</Typography>
                <Typography variant="body2" className="text-green-900">
                  {enq.convertedToPatient.name} ({enq.convertedToPatient.phone}) — {formatDateShort(enq.convertedAt)}
                </Typography>
              </Paper>
            )}
          </>
        )}
      </DialogContent>

      {/* Actions */}
      {!activeAction && (
        <DialogActions className="p-4 bg-gray-50 flex-wrap gap-2">
          <Button onClick={handleClose} color="inherit">Close</Button>
          <Box className="flex-1" />
          <Button size="small" variant="outlined" color="error" onClick={handleSpam} disabled={isMarkingSpam}>
            {enq?.isSpam ? "Unmark Spam" : "Spam"}
          </Button>
          <Button size="small" variant="outlined" color="error" onClick={handleDelete} disabled={isDeleting}>
            Delete
          </Button>
          <Button size="small" variant="outlined" onClick={() => setActiveAction("note")} startIcon={<NoteAddIcon />}>
            Note
          </Button>
          <Button size="small" variant="outlined" color="secondary" onClick={() => setActiveAction("assign")} startIcon={<PersonAddIcon />}>
            Assign
          </Button>
          <Button size="small" variant="outlined" color="success" onClick={() => setActiveAction("followup")} startIcon={<ScheduleIcon />}>
            Follow-up
          </Button>
          <Button size="small" variant="contained" onClick={() => setActiveAction("status")} className="bg-blue-600 hover:bg-blue-700">
            Change Status
          </Button>
        </DialogActions>
      )}
    </Dialog>

    <ConfirmDialog
      open={spamConfirmOpen}
      onClose={() => setSpamConfirmOpen(false)}
      onConfirm={doSpam}
      title={enq?.isSpam ? "Unmark Spam" : "Mark as Spam"}
      message={enq?.isSpam ? "Remove spam flag from this enquiry?" : "Mark this enquiry as spam?"}
      confirmText={enq?.isSpam ? "Unmark Spam" : "Mark as Spam"}
      confirmColor="warning"
    />
    <ConfirmDialog
      open={deleteConfirmOpen}
      onClose={() => setDeleteConfirmOpen(false)}
      onConfirm={doDelete}
      title="Delete Enquiry"
      message="Permanently delete this enquiry? This cannot be undone."
      confirmText="Delete Permanently"
      confirmColor="error"
    />
    </>
  );
};

export default EnquiryDetailModal;
