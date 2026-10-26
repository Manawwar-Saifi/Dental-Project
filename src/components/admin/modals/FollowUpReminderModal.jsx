/**
 * Follow-up Reminder Modal (admin)
 *
 * Create a reminder for a patient to return for a follow-up visit, and view /
 * mark-done / cancel their existing reminders. This is a REMINDER ONLY — no fee
 * or invoice is shown or created here.
 */
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
  IconButton,
  CircularProgress,
  Chip,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { toast } from "react-toastify";
import { todayStr, MAX_DATE } from "../../../utils/dateInput";
import {
  getFollowUps,
  createFollowUp,
  markFollowUpDone,
  cancelFollowUp,
} from "../../../api/admin/followups.api";

const statusColors = {
  scheduled: "info",
  sent: "warning",
  done: "success",
  cancelled: "default",
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

const FollowUpReminderModal = ({ open, onClose, patient }) => {
  const [form, setForm] = useState({ followUpDate: "", time: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const fetchList = useCallback(async () => {
    if (!patient?._id) return;
    setLoadingList(true);
    try {
      const res = await getFollowUps({ patient: patient._id, limit: 50 });
      setList(res.data || []);
    } catch {
      setList([]);
    } finally {
      setLoadingList(false);
    }
  }, [patient?._id]);

  useEffect(() => {
    if (open) {
      setForm({ followUpDate: "", time: "", reason: "" });
      fetchList();
    }
  }, [open, fetchList]);

  const handleCreate = async () => {
    if (!form.followUpDate) {
      toast.error("Please pick a follow-up date");
      return;
    }
    setSaving(true);
    try {
      await createFollowUp({
        patient: patient._id,
        followUpDate: form.followUpDate,
        time: form.time || undefined,
        reason: form.reason || undefined,
      });
      toast.success("Follow-up reminder created");
      setForm({ followUpDate: "", time: "", reason: "" });
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create reminder");
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (id, fn, okMsg) => {
    setBusyId(id);
    try {
      await fn(id);
      toast.success(okMsg);
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ className: "rounded-xl" }}>
      <DialogTitle className="bg-navy text-white" sx={{ py: 1.25, px: 2 }}>
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <EventRepeatIcon fontSize="small" />
            <Typography variant="subtitle1" className="font-bold">
              Follow-up Reminder
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon className="text-white" fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent className="p-4">
        <Typography variant="body2" className="text-gray-600 mb-1">
          Patient: <span className="font-medium text-gray-800">{patient?.name || "-"}</span>
        </Typography>
        <Typography variant="caption" className="text-gray-400 block mb-3">
          Reminder only — no payment. Fees are collected when the patient visits.
        </Typography>

        <Box className="grid grid-cols-2 gap-3">
          <TextField
            label="Follow-up Date"
            type="date"
            size="small"
            value={form.followUpDate}
            onChange={(e) => setForm((f) => ({ ...f, followUpDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: todayStr(), max: MAX_DATE }}
            required
          />
          <TextField
            label="Time (optional)"
            type="time"
            size="small"
            value={form.time}
            onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
        <TextField
          label="Note / Reason"
          size="small"
          fullWidth
          value={form.reason}
          onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
          placeholder="e.g., Monthly check-up, Review after cleaning"
          sx={{ mt: 1.5 }}
        />
        <Box className="flex justify-end mt-3">
          <Button
            variant="contained"
            size="small"
            onClick={handleCreate}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={14} /> : <EventRepeatIcon />}
            sx={{ bgcolor: "#f57c00", "&:hover": { bgcolor: "#e06c00" } }}
          >
            {saving ? "Saving..." : "Create Reminder"}
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-1">
          Existing reminders
        </Typography>
        {loadingList ? (
          <Box className="text-center py-4"><CircularProgress size={22} /></Box>
        ) : list.length === 0 ? (
          <Typography variant="body2" className="text-gray-400 py-2">
            No follow-up reminders yet.
          </Typography>
        ) : (
          <Box className="flex flex-col gap-2">
            {list.map((r) => (
              <Box
                key={r._id}
                className="flex items-center justify-between gap-2 border border-gray-100 rounded-lg p-2"
              >
                <Box className="min-w-0">
                  <Typography variant="body2" className="font-medium">
                    {formatDate(r.followUpDate)}{r.time ? ` · ${r.time}` : ""}
                  </Typography>
                  {r.reason && (
                    <Typography variant="caption" className="text-gray-500 block truncate">
                      {r.reason}
                    </Typography>
                  )}
                </Box>
                <Box className="flex items-center gap-1 shrink-0">
                  <Chip size="small" label={r.status} color={statusColors[r.status] || "default"} />
                  {(r.status === "scheduled" || r.status === "sent") && (
                    <>
                      <IconButton
                        size="small"
                        color="success"
                        title="Mark done"
                        disabled={busyId === r._id}
                        onClick={() => runAction(r._id, markFollowUpDone, "Marked done")}
                      >
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        title="Cancel"
                        disabled={busyId === r._id}
                        onClick={() => runAction(r._id, cancelFollowUp, "Reminder cancelled")}
                      >
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions className="px-4 py-2 bg-gray-50" sx={{ borderTop: 1, borderColor: "divider" }}>
        <Button onClick={onClose} color="inherit">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FollowUpReminderModal;
